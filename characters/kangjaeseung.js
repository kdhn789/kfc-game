module.exports = {
    name: '강재승',
    hp: 170,          // 묵직한 체력
    speed: 4.5,
    jumpPower: -11,
    meleeDamage: 10,
    image: './images/kangjaeseung.png', // 캐릭터 이미지 파일 경로

    // Q 스킬: 밀치기 (데미지 10, 멀리 넉백, 쿨타임 2초)
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

                    // 전방 넓은 밀치기 판정 박스
                    const pushBox = {
                        x: p.facing === 'right' ? p.x + p.width : p.x - 50,
                        y: p.y,
                        width: 50,
                        height: p.height
                    };

                    if (pushBox.x < enemy.x + enemy.width &&
                        pushBox.x + pushBox.width > enemy.x &&
                        pushBox.y < enemy.y + enemy.height &&
                        pushBox.y + pushBox.height > enemy.y) {
                        
                        enemy.hp -= 25;
                        const knockDir = p.facing === 'right' ? 1 : -1;
                        enemy.x += knockDir * 190; // 아주 멀리 밀쳐냄!
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

    // Shift 스킬: 울할매 뜨끈불가마 (빨간색 불 분수 16발 포물선 난사, 쿨타임 3초)
    onRSkill: (p, room, socketId) => {
        const now = Date.now();
        if (!p.lastRSkillTime || now - p.lastRSkillTime >= 3500) {
            p.lastRSkillTime = now;

            const totalBullets = 12;
            for (let i = 0; i < totalBullets; i++) {
                const angle = (Math.random() * 140 + 200) * (Math.PI / 180); // 위쪽으로 포물선 발사
                const speed = Math.random() * 6 + 5;

                room.projectiles.push({
                    x: p.x + (p.width / 2),
                    y: p.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    gravity: 0.3, // 포물선 중력
                    owner: socketId,
                    color: '#ff4500' // 뜨거운 주황/빨간 불꽃 색상
                });
            }

            p.dialogue = "울할매 뜨끈불가마 맛좀 봐라!!!";
            p.dialogueTimer = 150;
        }
    }
};