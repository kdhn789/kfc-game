// characters/kangyul.js
module.exports = {
    name: '강율',
    hp: 100,
    speed: 8,
    jumpPower: -15,
    meleeDamage: 17,
    scale: 1.0,
    image: './images/kangyul.png',

    // Q 스킬: 폐 터뜨리기 (폐공격)
    onQSkill: (p, room, socketId) => {
        if (room.status !== 'playing') return;

        const now = Date.now();
        if (p.lastQSkillTime && now - p.lastQSkillTime < 4000) return;
        p.lastQSkillTime = now;

        p.dialogue = "내 폐!";
        p.dialogueTimer = 90;

        p.isAttacking = true;
        setTimeout(() => { p.isAttacking = false; }, 200);

        // 폐공격 파티클(이펙트) 생성 추가 (푸른 계열의 파동)
        for (let i = 0; i < 6; i++) {
            room.projectiles.push({
                x: p.x + p.width / 2,
                y: p.y + p.height / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                color: '#00cec9',
                type: 'particle',
                life: 20
            });
        }

        for (let id in room.players) {
            if (id !== socketId) {
                const enemy = room.players[id];
                if (enemy.isDead) continue;

                const dashDir = p.facing === 'right' ? 1 : -1;
                p.x += dashDir * 80;
                if (p.x < 0) p.x = 0;
                if (p.x > 800 - p.width) p.x = 800 - p.width;

                if (!(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                    enemy.hp -= 20;
                    room.floatingTexts.push({
                        x: enemy.x + enemy.width / 2,
                        y: enemy.y,
                        text: `-20`,
                        color: '#00cec9',
                        life: 30
                    });
                }
                enemy.x += dashDir * 40;
                room.screenShake = 8;

                if (enemy.hp <= 0 && !(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                    enemy.hp = 0;
                    enemy.isDead = true;
                    room.status = 'ended';
                    io?.to(roomCode)?.emit('game-over', { winner: socketId });
                }
            }
        }
    },

    // SHIFT(R) 스킬: 심장 터뜨리기
    onRSkill: (p, room, socketId) => {
        if (room.status !== 'playing') return;

        const now = Date.now();
        if (p.lastRSkillTime && now - p.lastRSkillTime < 4000) return;
        p.lastRSkillTime = now;

        p.dialogue = "내 심장!";
        p.dialogueTimer = 90;

        // 심장공격 파티클(이펙트) 생성 추가 (붉은 계열의 파동)
        for (let i = 0; i < 8; i++) {
            room.projectiles.push({
                x: p.x + p.width / 2,
                y: p.y + p.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                color: '#db3131c8',
                type: 'particle',
                life: 25
            });
        }

        for (let id in room.players) {
            if (id !== socketId) {
                const enemy = room.players[id];
                if (enemy.isDead) continue;

                p.hp -= 30;
                if (p.hp < 0) p.hp = 0;
                room.floatingTexts.push({
                    x: p.x + p.width / 2,
                    y: p.y,
                    text: `-30`,
                    color: '#a14141cb',
                    life: 30
                });

                room.screenShake = 15;

                // 자기 자신이 심장 터뜨리기로 사망했을 때 게임 멈춤 방지 및 처리
                if (p.hp <= 0) {
                    p.isDead = true;
                    room.status = 'ended';
                    return; 
                }

                if (!(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                    enemy.hp -= 30;
                    room.floatingTexts.push({
                        x: enemy.x + enemy.width / 2,
                        y: enemy.y,
                        text: `-30`,
                        color: '#ff7675',
                        life: 30
                    });
                }

                // 상대방이 심장 터뜨리기에 맞아 사망했을 때 게임 멈춤 방지 및 처리
                if (enemy.hp <= 0 && !(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                    enemy.hp = 0;
                    enemy.isDead = true;
                    room.status = 'ended';
                }
            }
        }
    },

    onMeleeSkill: (p, room, socketId) => {
        if (room.status !== 'playing') return;

        p.hp -= 1;
        if (p.hp <= 0) {
            p.hp = 0;
            p.isDead = true;
            room.status = 'ended';
            return;
        }

        p.isAttacking = true;
        setTimeout(() => { p.isAttacking = false; }, 200);

        for (let id in room.players) {
            if (id !== socketId) {
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
                    attackBox.y + attackBox.height > enemy.y) {
                    
                    if (!(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                        enemy.hp -= p.meleeDamage;
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

                    if (enemy.hp <= 0 && !(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                        enemy.hp = 0;
                        enemy.isDead = true;
                        room.status = 'ended';
                    }
                }
            }
        }
    }
};