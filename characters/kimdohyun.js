module.exports = {
    name: '김도현',
    hp: 180,
    speed: 2,
    jumpPower: -8,
    meleeDamage: 20,
    image: './images/kimdohyun.png',
    scale: 1.4,

    // E 스킬 (김도현 전용 근접 공격 - 2초 쿨타임)
    onMeleeSkill: (p, room, socketId) => {
        const now = Date.now();
        const cooldown = 2000; // 2초 쿨타임

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

                        if (enemy.hp <= 0 && !(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                            enemy.hp = 0;
                            enemy.isDead = true;
                            room.status = 'ended';
                            // 게임 종료 처리 필요시 연동
                        }
                    }
                }
            }
            p.dialogue = "받아라!";
            p.dialogueTimer = 40;
        }
    },

    // Q 스킬: 앞으로 구르기
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

    // R 스킬: 뒤로 구르기
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