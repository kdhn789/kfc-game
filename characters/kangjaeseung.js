module.exports = {
    name: '강재승',
    hp: 170,
    speed: 4.5,
    jumpPower: -11,
    meleeDamage: 12,
    image: './images/kangjaeseung.png',
    scale: 1.0,

    onQSkill: (p, room, socketId) => {
        const now = Date.now();
        if (!p.lastQSkillTime || now - p.lastQSkillTime >= 2000) {
            p.lastQSkillTime = now;
            p.isAttacking = true;
            setTimeout(() => { p.isAttacking = false; }, 200);

            for (let id in room.players) {
                if (id !== socketId) {
                    const enemy = room.players[id];
                    if (enemy.isDead) continue;

                    const pushBox = {
                        x: p.facing === 'right' ? p.x + p.width : p.x - 50,
                        y: p.y,
                        width: 50,
                        height: p.height
                    };

                    if (pushBox.x < enemy.x + enemy.width &&
                        pushBox.x + pushBox.width > enemy.x &&
                        pushBox.y < enemy.y + enemy.height &&
                        pushBox.y + enemy.height > enemy.y) {
                        
                        enemy.hp -= 25;
                        const knockDir = p.facing === 'right' ? 1 : -1;
                        enemy.x += knockDir * 190;
                        room.screenShake = 20;

                        if (enemy.hp <= 0) {
                            enemy.hp = 0;
                            enemy.isDead = true;
                            room.status = 'ended';
                            io.to(room.roomCode).emit('game-over', { winner: socketId });
                        }
                    }
                }
            }

            p.dialogue = "오른쪽 딸근의 지배자!";
            p.dialogueTimer = 100;
        }
    },

    onRSkill: (p, room, socketId) => {
        const now = Date.now();
        if (!p.lastRSkillTime || now - p.lastRSkillTime >= 3500) {
            p.lastRSkillTime = now;

            const totalBullets = 12;
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
                    color: '#ff4500'
                });
            }

            p.dialogue = "울할매 뜨끈불가마 맛좀 봐라!!!";
            p.dialogueTimer = 150;
        }
    }
};