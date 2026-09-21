// characters/kangyul.js
module.exports = {
    name: '강율',
    hp: 100,
    speed: 8,
    jumpPower: -15,
    meleeDamage: 17,
    scale: 1.0,
    image: './images/kangyul.png',

    // Q 스킬: 율스트라이크 (쿨타임 4초 및 대사 추가)
    onQSkill: (p, room, socketId) => {
        if (room.status !== 'playing') return;

        const now = Date.now();
        if (p.lastQSkillTime && now - p.lastQSkillTime < 4000) return;
        p.lastQSkillTime = now;

        // 대사 설정
        p.dialogue = "내 폐!";
        p.dialogueTimer = 90; // 대사 유지 시간

        p.isAttacking = true;
        setTimeout(() => { p.isAttacking = false; }, 200);

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
                }
                enemy.x += dashDir * 40;
                room.screenShake = 8;

                if (enemy.hp <= 0 && !(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                    enemy.hp = 0;
                    enemy.isDead = true;
                    room.status = 'ended';
                }
            }
        }
    },

    // SHIFT(R) 스킬: 무빙포즈 (쿨타임 4초 및 대사 추가)
    onRSkill: (p, room, socketId) => {
        if (room.status !== 'playing') return;

        const now = Date.now();
        if (p.lastRSkillTime && now - p.lastRSkillTime < 4000) return;
        p.lastRSkillTime = now;

        // 대사 설정
        p.dialogue = "내 심장!";
        p.dialogueTimer = 90;

        for (let id in room.players) {
            if (id !== socketId) {
                const enemy = room.players[id];
                if (enemy.isDead) continue;

                p.hp -= 30;
                if (p.hp < 0) p.hp = 0;

                room.screenShake = 15;

                if (p.hp <= 0) {
                    p.isDead = true;
                    room.status = 'ended';
                    break; 
                }

                if (!(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                    enemy.hp -= 30;
                }

                if (enemy.hp <= 0 && !(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                    enemy.hp = 0;
                    enemy.isDead = true;
                    room.status = 'ended';
                }
            }
        }
    },

    // 기본 공격(E)
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