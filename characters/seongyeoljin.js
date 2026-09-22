module.exports = {
    name: '성열진',
    hp: 152.3,
    speed: 10,
    jumpPower: -11,
    meleeDamage: 9.523,
    image: './images/seongyeoljin.png',
    scale: 1.0,

    onQSkill: (p, room, socketId) => {
        const now = Date.now();
        if (!p.lastRangedTime || now - p.lastRangedTime >= 800) {
            p.lastRangedTime = now;
            const totalBullets = 8;
            for (let i = 0; i < totalBullets; i++) {
                const angle = (i * (360 / totalBullets)) * (Math.PI / 180);
                const speed = 10;
                room.projectiles.push({
                    x: p.x + (p.width / 2),
                    y: p.y + (p.height / 2),
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    owner: socketId,
                    color: '#ffffff'
                });
            }
            p.dialogue = "우유 좀 줄래?";
            p.dialogueTimer = 120;
        }
    },

    onRSkill: (p, room, socketId) => {
        const now = Date.now();
        if (!p.lastRSkillTime || now - p.lastRSkillTime >= 5000) {
            p.lastRSkillTime = now;
            const totalBullets = 16;
            for (let i = 0; i < totalBullets; i++) {
                const angle = (Math.random() * 140 + 200) * (Math.PI / 180); 
                const speed = Math.random() * 6 + 5;
                room.projectiles.push({
                    x: p.x + (p.width / 2),
                    y: p.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    gravity: 0.3,
                    owner: socketId,
                    color: '#fffacd'
                });
            }
            p.dialogue = "배싸! Faaaaaaah!";
            p.dialogueTimer = 150;
        }
    }
};