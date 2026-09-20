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

    // 싱글 플레이 시작 요청 처리 (난이도 포함)
    socket.on('start-single-play', (difficulty) => {
        const roomCode = 'single_' + socket.id;
        
        rooms[roomCode] = { 
            players: {}, 
            projectiles: [], 
            screenShake: 0, 
            status: 'waiting',
            gameInterval: null,
            isSingle: true,
            botDifficulty: difficulty || 'normal'
        };

        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.isReady = true;

        // 플레이어 생성
        rooms[roomCode].players[socket.id] = {
            x: 100, y: 300, width: 40, height: 40,
            vx: 0, vy: 0, hp: 100, maxHp: 100,
            speed: 5, jumpPower: -12, char: null,
            isDead: false, isAttacking: false,
            facing: 'right',
            skillLogic: null,
            rSkillLogic: null,
            meleeDamage: 15,
            hasUsedGrow: false, hasUsedAwaken: false, lastRangedTime: 0, lastRSkillTime: 0,
            dialogue: '',       
            dialogueTimer: 0,
            burnTimer: 0, 
            burnTicks: 0  
        };

        // 봇 캐릭터 생성 (상대방 ID: 'bot')
        const botCharKeys = Object.keys(CHARACTER_STATS);
        const randomBotChar = botCharKeys.length > 0 ? botCharKeys[Math.floor(Math.random() * botCharKeys.length)] : '성열진';
        const botStat = CHARACTER_STATS[randomBotChar] || { hp: 100, speed: 3, jumpPower: -12, meleeDamage: 10 };

        rooms[roomCode].players['bot'] = {
            x: 660, y: 300, width: 40, height: 40,
            vx: 0, vy: 0, hp: botStat.hp || 100, maxHp: botStat.hp || 100,
            speed: botStat.speed || 3, jumpPower: botStat.jumpPower || -12, char: randomBotChar,
            isDead: false, isAttacking: false,
            facing: 'left',
            skillLogic: botStat.onQSkill || null,
            rSkillLogic: botStat.onRSkill || null,
            meleeDamage: botStat.meleeDamage || 10,
            hasUsedGrow: false, hasUsedAwaken: false, lastRangedTime: 0, lastRSkillTime: 0,
            lastQSkillTime: 0,
            dialogue: '',       
            dialogueTimer: 0,
            burnTimer: 0, 
            burnTicks: 0,
            isBot: true,
            botTimer: 0
        };

        // 바로 캐릭터 선택 화면으로 전환 신호 전송
        socket.emit('start-character-select');
    });

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
            burnTimer: 0, 
            burnTicks: 0  
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
            p.image = stat.image; //
            p.skillLogic = stat.onQSkill;
            p.rSkillLogic = stat.onRSkill;
            if (stat.meleeDamage) p.meleeDamage = stat.meleeDamage;
        }

        const room = rooms[roomCode];
        
        // 싱글 플레이일 경우 혼자서 캐릭터를 고르면 바로 게임 시작
        const allSelected = room.isSingle ? true : Object.values(room.room?.players || room.players).every(player => player.char !== null);

        if (allSelected && room.status !== 'playing') {
            room.status = 'waiting_countdown'; 
            io.to(roomCode).emit('start-countdown', room.players);
            
            setTimeout(() => {
                if (rooms[roomCode]) {
                    rooms[roomCode].status = 'playing';
                }
            }, 3000);

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
                        
                        if (!(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                            enemy.hp -= p.meleeDamage;
                        }
                        
                        const knockDir = p.facing === 'right' ? 1 : -1;
                        enemy.x += knockDir * 40; 
                        room.screenShake = 10; 

                        if (enemy.hp <= 0 && !(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
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
        if (!rooms[roomCode] || rooms[roomCode].status === 'ended') {
            clearInterval(room.gameInterval);
            return;
        }

        if (room.screenShake > 0) room.screenShake--;

        if (room.status === 'playing') {
            // 싱글플레이 봇 AI 로직 처리
            if (room.isSingle && room.players['bot']) {
                const bot = room.players['bot'];
                const playerSocketId = Object.keys(room.players).find(id => id !== 'bot');
                const player = room.players[playerSocketId];

                if (!bot.isDead && player && !player.isDead) {
                    const diff = room.botDifficulty;
                    if (diff !== 'sandbag') {
                        bot.botTimer++;
                        const dx = player.x - bot.x;
                        const distance = Math.abs(dx);
                        
                        let moveSpeed = bot.speed * 0.75;
                        if (diff === 'easy') moveSpeed *= 0.5;
                        if (diff === 'hard') moveSpeed *= 1.0;

                        if (distance > 35) {
                            bot.vx = dx > 0 ? moveSpeed : -moveSpeed;
                            bot.facing = dx > 0 ? 'right' : 'left';
                        } else {
                            bot.vx = 0;
                        }

                        // 봇 스킬 쿨타임 적용 (Q스킬: 4초 쿨타임, R스킬: 10초 쿨타임)
                        const now = Date.now();
                        const qCooldown = 4000;
                        const rCooldown = 10000;

                        const skillChance = diff === 'hard' ? 0.04 : 0.015;
                        
                        // Q스킬 시도
                        if (bot.skillLogic && Math.random() < skillChance) {
                            if (!bot.lastQSkillTime || now - bot.lastQSkillTime >= qCooldown) {
                                bot.skillLogic(bot, room, 'bot');
                                bot.lastQSkillTime = now;
                            }
                        }

                        // R스킬 시도
                        if (bot.rSkillLogic && Math.random() < (skillChance * 0.7)) {
                            if (!bot.lastRSkillTime || now - bot.lastRSkillTime >= rCooldown) {
                                bot.rSkillLogic(bot, room, 'bot');
                                bot.lastRSkillTime = now;
                            }
                        }

                        const attackInterval = diff === 'hard' ? 35 : 60;
                        if (distance <= 45 && bot.botTimer % attackInterval === 0) {
                            bot.isAttacking = true;
                            setTimeout(() => { bot.isAttacking = false; }, 200);

                            const attackBox = {
                                x: bot.facing === 'right' ? bot.x + bot.width : bot.x - 40,
                                y: bot.y,
                                width: 40,
                                height: bot.height
                            };

                            if (attackBox.x < player.x + player.width &&
                                attackBox.x + attackBox.width > player.x &&
                                attackBox.y < player.y + player.height &&
                                attackBox.y + player.height > player.y) {
                                
                                player.hp -= bot.meleeDamage;
                                room.screenShake = 8;

                                if (player.hp <= 0) {
                                    player.hp = 0;
                                    player.isDead = true;
                                    room.status = 'ended';
                                    io.to(roomCode).emit('game-over', { winner: 'bot' });
                                }
                            }
                        }

                        if (diff === 'hard' && bot.y >= 300 && Math.random() < 0.02) {
                            bot.vy = bot.jumpPower;
                        } else if (diff === 'normal' && bot.y >= 300 && Math.random() < 0.008) {
                            bot.vy = bot.jumpPower;
                        }
                    } else {
                        bot.vx = 0;
                    }
                }
            }

            const playerIds = Object.keys(room.players);

            for (let id in room.players) {
                const p = room.players[id];
                if (p.isDead) continue;

                if (p.dialogueTimer > 0) {
                    p.dialogueTimer--;
                    if (p.dialogueTimer === 0) p.dialogue = '';
                }

                if (p.burnTicks > 0) {
                    p.burnTimer++;
                    if (p.burnTimer >= 30) { 
                        p.burnTimer = 0;
                        p.hp -= 2; 
                        p.burnTicks--;
                        
                        if (p.hp <= 0) {
                            p.hp = 0;
                            p.isDead = true;
                            room.status = 'ended';
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

            // 플레이어끼리 충돌 처리 (2명이 있을 때만)
            if (playerIds.length === 2) {
                const p1 = room.players[playerIds[0]];
                const p2 = room.players[playerIds[1]];

                if (!p1.isDead && !p2.isDead) {
                    if (p1.x < p2.x + p2.width && p1.x + p1.width > p2.x &&
                        p1.y < p2.y + p2.height && p1.y + p1.height > p2.y) {
                        
                        // 싱글플레이이거나 봇이 포함된 경우 위로 올라타는(밟기) 로직을 제외하고 좌우로만 밀어냄
                        if (room.isSingle) {
                            const overlapX = Math.min(p1.x + p1.width - p2.x, p2.x + p2.width - p1.x);
                            if (p1.x < p2.x) {
                                p1.x -= overlapX / 2;
                                p2.x += overlapX / 2;
                            } else {
                                p1.x += overlapX / 2;
                                p2.x -= overlapX / 2;
                            }
                        } else {
                            // 기존 멀티플레이어 간 밟기 및 밀어내기 충돌 처리
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
            }

            // 투사체 이동 및 피격 판정
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
                            
                            if (!(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                                enemy.hp -= 6;
                            }
                            
                            room.screenShake = 6; 

                            if (proj.color === '#ff4500' && !(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                                enemy.burnTicks = 6; 
                                enemy.burnTimer = 0;
                            }

                            room.projectiles.splice(i, 1);

                            if (enemy.hp <= 0 && !(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
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