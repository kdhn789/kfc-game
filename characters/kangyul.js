module.exports = {
    name: '강율',
    hp: 100,
    speed: 14,
    jumpPower: -13,
    meleeDamage: 14,
    scale: 1.0,
    image: './images/kangyul.png',

    onQSkill: (p, room, socketId) => {
        if (room.status !== 'playing') return;

        const now = Date.now();
        if (p.lastQSkillTime && now - p.lastQSkillTime < 4000) return;
        p.lastQSkillTime = now;

        p.dialogue = "의사 선생님!!!";
        p.dialogueTimer = 90;

        p.hp = Math.min(p.maxHp, p.hp + 20);
        room.floatingTexts.push({
            x: p.x + p.width / 2,
            y: p.y,
            text: `+20`,
            color: '#00d1a7',
            life: 20
        });

        room.projectiles.push({
            x: p.x + p.width / 2,
            y: p.y - 15,
            vx: 0,
            vy: -0.5,
            color: '#00d196',
            type: 'particle',
            life: 20
        });
    },

    onRSkill: (p, room, socketId) => {
        if (room.status !== 'playing') return;

        const now = Date.now();
        if (p.lastRSkillTime && now - p.lastRSkillTime < 1200) return;
        p.lastRSkillTime = now;

        p.dialogue = "내 폐!";
        p.dialogueTimer = 100;

        const dashDir = p.facing === 'right' ? 1 : -1;
        p.x += dashDir * 140;
        if (p.x < 0) p.x = 0;
        if (p.x > 800 - p.width) p.x = 800 - p.width;

        for (let i = 0; i < 6; i++) {
            room.projectiles.push({
                x: p.x + p.width / 2,
                y: p.y + p.height / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: '#ae1f1f',
                type: 'particle',
                life: 30
            });
        }
    },

    onMeleeSkill: (p, room, socketId) => {
        if (room.status !== 'playing') return;

        p.hp -= 1;
        if (p.hp < 0) p.hp = 0;

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
                    attackBox.y + enemy.height > enemy.y) {
                    
                    if (!(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                        enemy.hp -= p.meleeDamage;
                        if (enemy.hp < 0) enemy.hp = 0;
                        room.floatingTexts.push({
                            x: enemy.x + enemy.width / 2,
                            y: enemy.y,
                            text: `-${p.meleeDamage}`,
                            color: '#be2431',
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
};