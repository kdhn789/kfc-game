module.exports = {
    name: '조겸',
    hp: 100,
    speed: 8,
    jumpPower: -13,
    meleeDamage: 11,
    image: './images/jogyum.png',
    scale: 1.0,

    onQSkill: (p) => {
        const dashDir = p.facing === 'right' ? 1 : -1;
        p.x += dashDir * 180;
        if (p.x < 0) p.x = 0;
        if (p.x > 800 - p.width) p.x = 800 - p.width;
        p.dialogue = "6세 여아 발견!";
        p.dialogueTimer = 90;
    },

    onRSkill: (p, room, socketId) => {
        const now = Date.now();
        if (!p.lastRSkillTime || now - p.lastRSkillTime >= 5000) {
            p.lastRSkillTime = now;
            
            const originalSpeed = p.speed;
            p.speed = 24;
            p.dialogue = "공주 페스티벌 JJ야~~";
            p.dialogueTimer = 120;

            for (let i = 0; i < 12; i++) {
                room.projectiles.push({
                    x: p.x + (p.width / 2),
                    y: p.y + (p.height / 2),
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    life: 30,
                    owner: socketId,
                    color: '#ff69b4'
                });
            }

            setTimeout(() => {
                p.speed = originalSpeed;
            }, 2000);
        }
    }
};