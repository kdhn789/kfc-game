// server_11.js
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

function broadcastRoomList() {
    const roomListInfo = [];
    for (const rCode in rooms) {
        if (!rooms[rCode].isSingle) {
            const playerCount = Object.keys(rooms[rCode].players).length;
            const spectatorCount = rooms[rCode].spectators ? rooms[rCode].spectators.size : 0;
            
            roomListInfo.push({
                roomCode: rCode,
                playerCount: playerCount,
                status: rooms[rCode].status,
                spectatorCount: spectatorCount
            });
        }
    }
    io.emit('room-list-update', roomListInfo);
}

// 웨이브에 따른 봇 생성 헬퍼 함수
function spawnBotsForWave(room, waveMain) {
    // 기존 봇 제거
    for (let id in room.players) {
        if (id.startsWith('bot_')) {
            delete room.players[id];
        }
    }

    const botCharKeys = Object.keys(CHARACTER_STATS);
    for (let i = 0; i < waveMain; i++) {
        const botId = `bot_${i + 1}`;
        const randomBotChar = botCharKeys.length > 0 ? botCharKeys[Math.floor(Math.random() * botCharKeys.length)] : '성열진';
        const botStat = CHARACTER_STATS[randomBotChar] || { hp: 100, speed: 3, jumpPower: -12, meleeDamage: 10 };

        room.players[botId] = {
            x: 500 + (i * 60), y: 300, width: 40 * (botStat.scale || 1.0), height: 40 * (botStat.scale || 1.0),
            vx: 0, vy: 0, hp: botStat.hp || 100, maxHp: botStat.hp || 100,
            speed: botStat.speed || 3, jumpPower: botStat.jumpPower || -12, char: randomBotChar,
            isDead: false, isAttacking: false,
            facing: 'left',
            skillLogic: botStat.onQSkill || null,
            rSkillLogic: botStat.onRSkill || null,
            rReleaseLogic: botStat.onRRelease || null,
            meleeLogic: botStat.onMeleeSkill || null,
            meleeDamage: botStat.meleeDamage || 10,
            hasUsedGrow: false, hasUsedAwaken: false, lastRangedTime: 0, lastRSkillTime: 0, lastMeleeTime: 0,
            lastQSkillTime: 0,
            dialogue: '',       
            dialogueTimer: 0,
            burnTimer: 0, 
            burnTicks: 0,
            isSilenced: false,
            isBot: true,
            botTimer: 0
        };
    }
}

io.on('connection', (socket) => {
    console.log(`사용자 접속: ${socket.id}`);

    const roomListInfo = [];
    for (const rCode in rooms) {
        if (!rooms[rCode].isSingle) {
            const playerCount = Object.keys(rooms[rCode].players).length;
            const spectatorCount = rooms[rCode].spectators ? rooms[rCode].spectators.size : 0;
            roomListInfo.push({
                roomCode: rCode,
                playerCount: playerCount,
                status: rooms[rCode].status,
                spectatorCount: spectatorCount
            });
        }
    }
    socket.emit('room-list-update', roomListInfo);

    socket.on('start-single-play', (difficulty) => {
        const roomCode = 'single_' + socket.id;
        
        rooms[roomCode] = { 
            players: {}, 
            spectators: new Set(),
            projectiles: [], 
            particles: [],
            floatingTexts: [], 
            screenShake: 0, 
            status: 'waiting',
            gameInterval: null,
            isSingle: true,
            botDifficulty: difficulty || 'normal',
            isWaveMode: (difficulty === 'wave'),
            waveSub: 1, // 1-1, 1-2, 1-3 중 소블록
            waveMain: 1 // 웨이브 앞자리 (1-1이면 1)
        };

        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.isReady = true;

        rooms[roomCode].players[socket.id] = {
            x: 100, y: 300, width: 40, height: 40,
            vx: 0, vy: 0, hp: 100, maxHp: 100,
            speed: 5, jumpPower: -12, char: null,
            isDead: false, isAttacking: false,
            facing: 'right',
            skillLogic: null,
            rSkillLogic: null,
            rReleaseLogic: null,
            meleeLogic: null,
            meleeDamage: 15,
            hasUsedGrow: false, hasUsedAwaken: false, lastRangedTime: 0, lastRSkillTime: 0, lastMeleeTime: 0,
            dialogue: '',       
            dialogueTimer: 0,
            burnTimer: 0, 
            burnTicks: 0,
            isSilenced: false  
        };

        if (rooms[roomCode].isWaveMode) {
            spawnBotsForWave(rooms[roomCode], 1);
        } else {
            const botCharKeys = Object.keys(CHARACTER_STATS);
            const randomBotChar = botCharKeys.length > 0 ? botCharKeys[Math.floor(Math.random() * botCharKeys.length)] : '성열진';
            const botStat = CHARACTER_STATS[randomBotChar] || { hp: 100, speed: 3, jumpPower: -12, meleeDamage: 10 };

            rooms[roomCode].players['bot'] = {
                x: 660, y: 300, width: 40 * (botStat.scale || 1.0), height: 40 * (botStat.scale || 1.0),
                vx: 0, vy: 0, hp: botStat.hp || 100, maxHp: botStat.hp || 100,
                speed: botStat.speed || 3, jumpPower: botStat.jumpPower || -12, char: randomBotChar,
                isDead: false, isAttacking: false,
                facing: 'left',
                skillLogic: botStat.onQSkill || null,
                rSkillLogic: botStat.onRSkill || null,
                rReleaseLogic: botStat.onRRelease || null,
                meleeLogic: botStat.onMeleeSkill || null,
                meleeDamage: botStat.meleeDamage || 10,
                hasUsedGrow: false, hasUsedAwaken: false, lastRangedTime: 0, lastRSkillTime: 0, lastMeleeTime: 0,
                lastQSkillTime: 0,
                dialogue: '',       
                dialogueTimer: 0,
                burnTimer: 0, 
                burnTicks: 0,
                isSilenced: false,
                isBot: true,
                botTimer: 0
            };
        }

        broadcastRoomList();
        socket.emit('start-character-select');
    });

    socket.on('join-room', (roomCode) => {
        for (const rCode of socket.rooms) {
            if (rCode !== socket.id) {
                socket.leave(rCode);
            }
        }

        if (socket.roomCode && rooms[socket.roomCode]) {
            const oldRoom = rooms[socket.roomCode];
            if (oldRoom.spectators) oldRoom.spectators.delete(socket.id);
            if (oldRoom.players && oldRoom.players[socket.id]) {
                delete oldRoom.players[socket.id];
            }
        }

        if (!rooms[roomCode] || rooms[roomCode].status === 'ended') {
            rooms[roomCode] = { 
                players: {}, 
                spectators: new Set(),
                projectiles: [], 
                particles: [],
                floatingTexts: [], 
                screenShake: 0, 
                status: 'waiting',
                gameInterval: null
            };
        }

        const room = rooms[roomCode];
        const playerKeys = Object.keys(room.players);

        if (playerKeys.length >= 2 || room.status === 'playing' || room.status === 'waiting_countdown' || room.status === 'playing_prep') {
            if (!room.spectators) room.spectators = new Set();
            room.spectators.add(socket.id);

            socket.join(roomCode);
            socket.roomCode = roomCode;
            socket.isSpectator = true;

            broadcastRoomList();
            socket.emit('start-spectating', {
                players: room.players,
                status: room.status
            });
            return;
        }

        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.isReady = false;
        socket.isSpectator = false;

        const spawnX = playerKeys.length === 0 ? 100 : 660;

        room.players[socket.id] = {
            x: spawnX, y: 300, width: 40, height: 40,
            vx: 0, vy: 0, hp: 100, maxHp: 100,
            speed: 5, jumpPower: -12, char: null,
            isDead: false, isAttacking: false,
            facing: playerKeys.length === 0 ? 'right' : 'left',
            skillLogic: null,
            rSkillLogic: null,
            rReleaseLogic: null,
            meleeLogic: null,
            meleeDamage: 15,
            hasUsedGrow: false, hasUsedAwaken: false, lastRangedTime: 0, lastRSkillTime: 0, lastMeleeTime: 0,
            dialogue: '',       
            dialogueTimer: 0,
            burnTimer: 0, 
            burnTicks: 0,
            isSilenced: false  
        };

        io.to(roomCode).emit('update-room', Object.keys(room.players).length);
        broadcastRoomList(); 
        
        if (Object.keys(room.players).length === 2) {
            room.status = 'playing_prep'; 
            broadcastRoomList();
            io.to(roomCode).emit('start-ready-phase');
            io.to(roomCode).emit('start-character-select');
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
        if (!rooms[roomCode] || socket.isSpectator) return;

        const room = rooms[roomCode];
        const p = room.players[socket.id];
        if (!p) return;
        
        const stat = CHARACTER_STATS[charName];

        if (stat) {
            p.char = charName;
            p.hp = stat.hp;
            p.maxHp = stat.hp;
            p.speed = stat.speed;
            p.jumpPower = stat.jumpPower;
            p.image = stat.image;
            p.skillLogic = stat.onQSkill;
            p.rSkillLogic = stat.onRSkill;
            p.rReleaseLogic = stat.onRRelease; 
            p.meleeLogic = stat.onMeleeSkill; 
            if (stat.meleeDamage) p.meleeDamage = stat.meleeDamage;

            const scale = stat.scale || 1.0;
            p.width = 40 * scale;
            p.height = 40 * scale;
        }
        
        const playerEntries = Object.values(room.players);
        let allSelected = false;

        if (room.isSingle) {
            allSelected = true;
        } else if (playerEntries.length === 2) {
            allSelected = playerEntries.every(player => player.char !== null);
        }

        if (allSelected && room.status !== 'playing' && room.status !== 'waiting_countdown') {
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
        if (socket.isSpectator) return;
        const p = rooms[roomCode].players[socket.id];
        if (!p || p.isDead) return;

        if (keys.left) { p.vx = -p.speed; p.facing = 'left'; }
        else if (keys.right) { p.vx = p.speed; p.facing = 'right'; }
        else { p.vx = 0; }

        if (keys.jump && p.y >= 340 - p.height) { p.vy = p.jumpPower; }

        if (keys.skill && !p.isSilenced) {
            if (p.meleeLogic) {
                p.meleeLogic(p, rooms[roomCode], socket.id);
            } else {
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
                            
                            if (!(room.isSingle && room.botDifficulty === 'sandbag' && id.startsWith('bot'))) {
                                enemy.hp -= p.meleeDamage;
                                if (enemy.hp < 0) enemy.hp = 0;
                                room.floatingTexts.push({
                                    x: enemy.x + enemy.width / 2,
                                    y: enemy.y,
                                    text: `-${p.meleeDamage}`,
                                    color: '#ff4757',
                                    life: 30
                                });
                            }
                            
                            const knockDir = p.facing === 'right' ? 1 : -1;
                            enemy.x += knockDir * 40; 
                            room.screenShake = 10; 
                        }
                    }
                }
            }
        }

        if (keys.qSkill && p.skillLogic && !p.isSilenced) {
            p.skillLogic(p, rooms[roomCode], socket.id);
        }

        if (keys.rSkill && !p.isSilenced) {
            if (p.rSkillLogic) {
                p.rSkillLogic(p, rooms[roomCode], socket.id);
            }
        } else {
            if (p.rReleaseLogic) {
                p.rReleaseLogic(p);
            }
        }
    });

    socket.on('leave-room', () => {
        const roomCode = socket.roomCode;
        if (roomCode && rooms[roomCode]) {
            const room = rooms[roomCode];
            if (room.spectators && room.spectators.has(socket.id)) {
                room.spectators.delete(socket.id);
                socket.leave(roomCode);
                socket.isSpectator = false;
                socket.roomCode = null;
                broadcastRoomList();
                return;
            }
            if (room.gameInterval) clearInterval(room.gameInterval);
            delete rooms[roomCode];
            broadcastRoomList();
        }
        socket.roomCode = null;
    });

    socket.on('disconnect', () => {
        console.log(`사용자 퇴장: ${socket.id}`);
        const roomCode = socket.roomCode;
        if (roomCode && rooms[roomCode]) {
            const room = rooms[roomCode];
            if (room.spectators && room.spectators.has(socket.id)) {
                room.spectators.delete(socket.id);
                broadcastRoomList();
                return;
            }
            if (room.gameInterval) {
                clearInterval(room.gameInterval);
                room.gameInterval = null;
            }
            delete rooms[roomCode];
            broadcastRoomList();
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
            if (room.gameInterval) {
                clearInterval(room.gameInterval);
                room.gameInterval = null;
            }
            return;
        }

        if (room.screenShake > 0) room.screenShake--;

        if (room.floatingTexts) {
            for (let i = room.floatingTexts.length - 1; i >= 0; i--) {
                const ft = room.floatingTexts[i];
                ft.y -= 1; 
                ft.life--;
                if (ft.life <= 0) {
                    room.floatingTexts.splice(i, 1);
                }
            }
        }

        if (room.particles) {
            for (let i = room.particles.length - 1; i >= 0; i--) {
                const pt = room.particles[i];
                pt.x += pt.vx;
                pt.y += pt.vy;
                pt.life--;
                if (pt.life <= 0) {
                    room.particles.splice(i, 1);
                }
            }
        }

        if (room.status === 'playing') {
            if (room.isSingle) {
                const playerSocketId = Object.keys(room.players).find(id => !id.startsWith('bot'));
                const player = room.players[playerSocketId];

                // 웨이브 모드 체크: 모든 봇이 죽었는지 확인
                if (room.isWaveMode) {
                    let allBotsDead = true;
                    for (let id in room.players) {
                        if (id.startsWith('bot_')) {
                            if (!room.players[id].isDead && room.players[id].hp > 0) {
                                allBotsDead = false;
                                break;
                            }
                        }
                    }

                    if (allBotsDead) {
                        // 다음 웨이브로 진행
                        room.waveSub++;
                        if (room.waveSub > 3) {
                            room.waveMain++;
                            room.waveSub = 1;
                        }

                        // 앞자리(1-1, 2-1 등)가 바뀔 때 플레이어 피 무한 회복
                        if (room.waveSub === 1 && player) {
                            player.hp = player.maxHp;
                            room.floatingTexts.push({
                                x: player.x + player.width / 2,
                                y: player.y - 15,
                                text: `WAVE ${room.waveMain}-${room.waveSub}! HP FULL!`,
                                color: '#4CAF50',
                                life: 60
                            });
                        } else {
                            room.floatingTexts.push({
                                x: 400,
                                y: 100,
                                text: `WAVE ${room.waveMain}-${room.waveSub} START!`,
                                color: '#ff9800',
                                life: 60
                            });
                        }

                        spawnBotsForWave(room, room.waveMain);
                    }
                }

                // 봇 AI 이동 처리
                for (let id in room.players) {
                    if (id.startsWith('bot') || id === 'bot') {
                        const bot = room.players[id];
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

                                const now = Date.now();
                                const qCooldown = 2000;
                                const rCooldown = 2000;
                                const skillChance = diff === 'hard' ? 0.04 : 0.015;
                                
                                if (bot.skillLogic && Math.random() < skillChance && !bot.isSilenced) {
                                    if (!bot.lastQSkillTime || now - bot.lastQSkillTime >= qCooldown) {
                                        bot.skillLogic(bot, room, id);
                                        bot.lastQSkillTime = now;
                                    }
                                }

                                if (bot.rSkillLogic && Math.random() < (skillChance * 0.7) && !bot.isSilenced) {
                                    if (!bot.lastRSkillTime || now - bot.lastRSkillTime >= rCooldown) {
                                        bot.rSkillLogic(bot, room, id);
                                        bot.lastRSkillTime = now;
                                    }
                                }
                            } else {
                                bot.vx = 0;
                            }
                        }
                    }
                }
            }

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
                        if (p.hp < 0) p.hp = 0;
                        p.burnTicks--;
                        room.floatingTexts.push({
                            x: p.x + p.width / 2,
                            y: p.y,
                            text: `-2`,
                            color: '#ff4757',
                            life: 30
                        });
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

            for (let id in room.players) {
                const p = room.players[id];
                if (!p.isDead && p.hp <= 0) {
                    p.hp = 0;
                    p.isDead = true;
                    // 싱글/웨이브 모드에서 플레이어가 죽었을 때만 게임 종료
                    if (room.isSingle) {
                        const playerSocketId = Object.keys(room.players).find(k => !k.startsWith('bot'));
                        if (id === playerSocketId) {
                            room.status = 'ended';
                            io.to(roomCode).emit('game-over', { winner: 'bot' });
                            if (room.gameInterval) {
                                clearInterval(room.gameInterval);
                                room.gameInterval = null;
                            }
                            delete rooms[roomCode];
                            broadcastRoomList();
                            return;
                        }
                    } else {
                        room.status = 'ended';
                        const killerId = Object.keys(room.players).find(k => k !== id);
                        io.to(roomCode).emit('game-over', { winner: killerId });
                        if (room.gameInterval) {
                            clearInterval(room.gameInterval);
                            room.gameInterval = null;
                        }
                        delete rooms[roomCode];
                        broadcastRoomList();
                        return;
                    }
                }
            }

            // 캐릭터들끼리 몸 겹침 및 밟기 방지 (찐따플레이 룰)
            const playerIds = Object.keys(room.players);
            for (let i = 0; i < playerIds.length; i++) {
                for (let j = i + 1; j < playerIds.length; j++) {
                    const p1 = room.players[playerIds[i]];
                    const p2 = room.players[playerIds[j]];

                    if (!p1.isDead && !p2.isDead) {
                        if (p1.x < p2.x + p2.width && p1.x + p1.width > p2.x &&
                            p1.y < p2.y + p2.height && p1.y + p1.height > p2.y) {
                            
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

                if (proj.type === 'particle') continue;

                const pWidth = proj.width || 15;
                const pHeight = proj.height || 15;

                for (let id in room.players) {
                    if (id !== proj.owner) {
                        const enemy = room.players[id];
                        
                        if (!enemy.isDead &&
                            proj.x < enemy.x + enemy.width &&
                            proj.x + pWidth > enemy.x &&
                            proj.y < enemy.y + enemy.height &&
                            proj.y + pHeight > enemy.y) {
                            
                            const dmg = proj.damage || 6;
                            if (!(room.isSingle && room.botDifficulty === 'sandbag' && id.startsWith('bot'))) {
                                enemy.hp -= dmg;
                                if (enemy.hp < 0) enemy.hp = 0;
                                room.floatingTexts.push({
                                    x: enemy.x + enemy.width / 2,
                                    y: enemy.y,
                                    text: `-${dmg}`,
                                    color: '#ff4757',
                                    life: 30
                                });
                            }

                            if (proj.knockback) {
                                const knockDir = proj.vx > 0 ? 1 : -1;
                                enemy.x += knockDir * (proj.knockback / 6);
                            }

                            room.screenShake = 6; 
                            room.projectiles.splice(i, 1);
                            break;
                        }
                    }
                }
            }
        }

        io.to(roomCode).emit('game-update', {
            players: room.players,
            projectiles: room.projectiles.concat(room.particles || []),
            floatingTexts: room.floatingTexts,
            screenShake: room.screenShake,
            spectatorCount: room.spectators ? room.spectators.size : 0,
            waveInfo: room.isWaveMode ? `${room.waveMain}-${room.waveSub}` : null
        });

    }, 1000 / 60);
}

server.listen(3000, () => {
    console.log('서버가 3000번 포트에서 실행 중입니다!');
});