const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const CHARACTER_STATS = {};
const charFolderPath = path.join(__dirname, 'characters');

if (fs.existsSync(charFolderPath)) {
    const charFiles = fs.readdirSync(charFolderPath).filter(file => file.endsWith('.js'));
    for (const file of charFiles) {
        const charModule = require(path.join(charFolderPath, file));
        CHARACTER_STATS[charModule.name] = charModule;
        console.log(`> 캐릭터 로드 완료: ${charModule.name}`);
    }
}

const rooms = {};

io.on('connection', (socket) => {
    console.log(`사용자 접속: ${socket.id}`);

    socket.on('join-room', (roomCode) => {
        if (!rooms[roomCode] || rooms[roomCode].status === 'ended') {
            rooms[roomCode] = { 
                players: {}, 
                projectiles: [], 
                screenShake: 0, 
                status: 'waiting',
                gameInterval: null
            };
        }

        const room = rooms[roomCode];
        const playerKeys = Object.keys(room.players);

        if (playerKeys.length >= 2) {
            socket.emit('room-full');
            return;
        }

        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.isReady = false;

        const spawnX = playerKeys.length === 0 ? 100 : 660;

        room.players[socket.id] = {
            x: spawnX, y: 300, width: 40, height: 40,
            vx: 0, vy: 0, hp: 100, maxHp: 100,
            speed: 5, jumpPower: -12, char: null,
            isDead: false, isAttacking: false,
            facing: playerKeys.length === 0 ? 'right' : 'left',
            skillLogic: null,
            rSkillLogic: null,
            meleeDamage: 15,
            hasUsedGrow: false, hasUsedAwaken: false, lastRangedTime: 0, lastRSkillTime: 0,
            dialogue: '',       
            dialogueTimer: 0,
            burnTimer: 0, // 화상 지속 시간 타이머
            burnTicks: 0  // 화상 남은 횟수
        };

        io.to(roomCode).emit('update-room', Object.keys(room.players).length);
        if (Object.keys(room.players).length === 2) {
            io.to(roomCode).emit('start-ready-phase');
        }
    });

    socket.on('player-ready', () => {
        const roomCode = socket.roomCode;
        if (!rooms[roomCode]) return;
        socket.isReady = true;

        const socketsInRoom = io.sockets.adapter.rooms.get(roomCode);
        let readyCount = 0;
        if (socketsInRoom) {
            for (let sId of socketsInRoom) {
                const s = io.sockets.sockets.get(sId);
                if (s && s.isReady) readyCount++;
            }
        }
        if (readyCount === 2) {
            io.to(roomCode).emit('start-character-select');
        }
    });

    socket.on('select-character', (charName) => {
        const roomCode = socket.roomCode;
        if (!rooms[roomCode]) return;

        const p = rooms[roomCode].players[socket.id];
        const stat = CHARACTER_STATS[charName];

        if (p && stat) {
            p.char = charName;
            p.hp = stat.hp;
            p.maxHp = stat.hp;
            p.speed = stat.speed;
            p.jumpPower = stat.jumpPower;
            p.skillLogic = stat.onQSkill;
            p.rSkillLogic = stat.onRSkill;
            if (stat.meleeDamage) p.meleeDamage = stat.meleeDamage;
        }

        const room = rooms[roomCode];
        const allSelected = Object.values(room.players).every(player => player.char !== null);

        if (allSelected && room.status !== 'playing') {
            room.status = 'playing';
            io.to(roomCode).emit('start-countdown', room.players);
            startGameLoop(roomCode);
        }
    });

    socket.on('player-input', (keys) => {
        const roomCode = socket.roomCode;
        if (!rooms[roomCode] || rooms[roomCode].status !== 'playing') return;
        const p = rooms[roomCode].players[socket.id];
        if (!p || p.isDead) return;

        if (keys.left) { p.vx = -p.speed; p.facing = 'left'; }
        else if (keys.right) { p.vx = p.speed; p.facing = 'right'; }
        else { p.vx = 0; }

        if (keys.jump && p.y >= 300) { p.vy = p.jumpPower; }

        // E키 기본 근접 공격
        if (keys.skill) {
            p.isAttacking = true;
            setTimeout(() => { p.isAttacking = false; }, 200);

            const room = rooms[roomCode];
            for (let id in room.players) {
                if (id !== socket.id) {
                    const enemy = room.players[id];
                    if (enemy.isDead) continue;

                    const attackBox = {
                        x: p.facing === 'right' ? p.x + p.width : p.x - 40,
                        y: p.y,
                        width: 40,
                        height: p.height
                    };

                    if (attackBox.x < enemy.x + enemy.width &&
                        attackBox.x + attackBox.width > enemy.x &&
                        attackBox.y < enemy.y + enemy.height &&
                        attackBox.y + enemy.height > enemy.y) {
                        
                        enemy.hp -= p.meleeDamage;
                        const knockDir = p.facing === 'right' ? 1 : -1;
                        enemy.x += knockDir * 40; 
                        room.screenShake = 10; 

                        if (enemy.hp <= 0) {
                            enemy.hp = 0;
                            enemy.isDead = true;
                            room.status = 'ended';
                            io.to(roomCode).emit('game-over', { winner: socket.id });
                        }
                    }
                }
            }
        }

        if (keys.qSkill && p.skillLogic) {
            p.skillLogic(p, rooms[roomCode], socket.id);
        }

        if (keys.rSkill && p.rSkillLogic) {
            p.rSkillLogic(p, rooms[roomCode], socket.id);
        }
    });

    socket.on('disconnect', () => {
        console.log(`사용자 퇴장: ${socket.id}`);
        const roomCode = socket.roomCode;
        if (roomCode && rooms[roomCode]) {
            const room = rooms[roomCode];
            if (room.gameInterval) clearInterval(room.gameInterval);
            delete rooms[roomCode];
            io.to(roomCode).emit('game-over', { winner: null });
        }
    });
});

function startGameLoop(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    if (room.gameInterval) clearInterval(room.gameInterval);

    room.gameInterval = setInterval(() => {
        if (!rooms[roomCode] || rooms[roomCode].status !== 'playing') {
            clearInterval(room.gameInterval);
            return;
        }

        if (room.screenShake > 0) room.screenShake--;

        const playerIds = Object.keys(room.players);

        for (let id in room.players) {
            const p = room.players[id];
            if (p.isDead) continue;

            if (p.dialogueTimer > 0) {
                p.dialogueTimer--;
                if (p.dialogueTimer === 0) p.dialogue = '';
            }

            // 화상(도트 데미지) 처리: 3초간 0.5초마다(30프레임) 피 4씩 닳게 설정 (총 6번 = 24 데미지 또는 유저 요구사항 반영)
            // 3초간 총 피 4씩 닳는 누적 방식이나 주기적 닳기 처리
            if (p.burnTicks > 0) {
                p.burnTimer++;
                if (p.burnTimer >= 30) { // 매 0.5초마다
                    p.burnTimer = 0;
                    p.hp -= 2; // 0.5초마다 2씩 총 3초간 6번 = 12, 혹은 3초간 총 피 4씩 (원하시는 대로 조절 가능)
                    p.burnTicks--;
                    
                    if (p.hp <= 0) {
                        p.hp = 0;
                        p.isDead = true;
                        room.status = 'ended';
                        // 적이 화상으로 죽었을 경우 처리
                        const killerId = Object.keys(room.players).find(k => k !== id);
                        io.to(roomCode).emit('game-over', { winner: killerId });
                    }
                }
            }

            p.vy += 0.6;
            p.x += p.vx;
            p.y += p.vy;

            const floorY = 340 - p.height;
            if (p.y >= floorY) { p.y = floorY; p.vy = 0; }

            if (p.x < 0) p.x = 0;
            if (p.x > 800 - p.width) p.x = 800 - p.width;
        }

        // 플레이어끼리 밟기 충돌 처리
        if (playerIds.length === 2) {
            const p1 = room.players[playerIds[0]];
            const p2 = room.players[playerIds[1]];

            if (!p1.isDead && !p2.isDead) {
                if (p1.x < p2.x + p2.width && p1.x + p1.width > p2.x &&
                    p1.y < p2.y + p2.height && p1.y + p1.height > p2.y) {
                    
                    if (p1.vy > 0 && p1.y + p1.height - p1.vy <= p2.y + 15) {
                        p1.y = p2.y - p1.height;
                        p1.vy = 0;
                    } else if (p2.vy > 0 && p2.y + p2.height - p2.vy <= p1.y + 15) {
                        p2.y = p1.y - p2.height;
                        p2.vy = 0;
                    } else {
                        const overlapX = Math.min(p1.x + p1.width - p2.x, p2.x + p2.width - p1.x);
                        if (p1.x < p2.x) {
                            p1.x -= overlapX / 2;
                            p2.x += overlapX / 2;
                        } else {
                            p1.x += overlapX / 2;
                            p2.x -= overlapX / 2;
                        }
                    }
                }
            }
        }

        // 투사체 이동 및 피격 판정 (뜨끈불가마 맞으면 화상 효과 부여)
        for (let i = room.projectiles.length - 1; i >= 0; i--) {
            const proj = room.projectiles[i];
            
            proj.x += proj.vx;
            proj.y += proj.vy;
            if (proj.gravity) {
                proj.vy += proj.gravity;
            }

            if (proj.life !== undefined) {
                proj.life--;
                if (proj.life <= 0) {
                    room.projectiles.splice(i, 1);
                    continue;
                }
            }

            if (proj.x < 0 || proj.x > 800 || proj.y < 0 || proj.y > 400) {
                room.projectiles.splice(i, 1);
                continue;
            }

            for (let id in room.players) {
                if (id !== proj.owner) {
                    const enemy = room.players[id];
                    if (!enemy.isDead && proj.life === undefined &&
                        proj.x > enemy.x && proj.x < enemy.x + enemy.width && 
                        proj.y > enemy.y && proj.y < enemy.y + enemy.height) {
                        
                        enemy.hp -= 6;
                        room.screenShake = 6; 

                        // 강재승의 불꽃(주황/빨간색)에 맞았을 때 화상 디버프 부여!
                        if (proj.color === '#ff4500') {
                            enemy.burnTicks = 6; // 3초 동안 (0.5초마다 총 6번)
                            enemy.burnTimer = 0;
                        }

                        room.projectiles.splice(i, 1);

                        if (enemy.hp <= 0) {
                            enemy.hp = 0;
                            enemy.isDead = true;
                            room.status = 'ended';
                            io.to(roomCode).emit('game-over', { winner: proj.owner });
                        }
                        break;
                    }
                }
            }
        }

        io.to(roomCode).emit('game-update', {
            players: room.players,
            projectiles: room.projectiles,
            screenShake: room.screenShake
        });

    }, 1000 / 60);
}

server.listen(3000, () => {
    console.log('서버가 3000번 포트에서 실행 중입니다!');
});