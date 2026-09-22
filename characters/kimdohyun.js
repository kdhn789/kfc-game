module.exports = {
    name: '김도현',
    hp: 180,
    speed: 2,
    jumpPower: -8,
    meleeDamage: 40,
    image: './images/kimdohyun.png',
    scale: 1.4,

    onMeleeSkill: (p, room, socketId) => {
        const now = Date.now();
        const cooldown = 3000;

        if (!p.lastMeleeTime || now - p.lastMeleeTime >= cooldown) {
            p.lastMeleeTime = now;

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
                            enemy.hp -= 20;
                        }
                        
                        const knockDir = p.facing === 'right' ? 1 : -1;
                        enemy.x += knockDir * 40; 
                        room.screenShake = 10; 
                    }
                }
            }
            p.dialogue = "야이ㅂㅅ아";
            p.dialogueTimer = 40;
        }
    },

    onQSkill: (p, room, socketId) => {
        const now = Date.now();
        const cooldown = 300;

        if (!p.lastQSkillTime || now - p.lastQSkillTime >= cooldown) {
            p.lastQSkillTime = now;
            const dir = p.facing === 'right' ? 1 : -1;
            p.vx = dir * 7;
            p.vy = -3; 
            p.dialogue = "앞구르기";
            p.dialogueTimer = 60;
            p.isRolling = true;
            setTimeout(() => {
                p.isRolling = false;
                p.vx = 0;
            }, 600);
        }
    },

    onRSkill: (p, room, socketId) => {
        const now = Date.now();
        const cooldown = 300;

        if (!p.lastRSkillTime || now - p.lastRSkillTime >= cooldown) {
            p.lastRSkillTime = now;
            const backDir = p.facing === 'right' ? -1 : 1;
            p.vx = backDir * 7;
            p.vy = -3; 
            p.dialogue = "뒤구르기";
            p.dialogueTimer = 60;
            p.isRolling = true;
            setTimeout(() => {
                p.isRolling = false;
                p.vx = 0;
            }, 600);
        }
    }
};