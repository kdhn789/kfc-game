module.exports = {
    name: '성열진',
    hp: 152.3,
    speed: 7,
    jumpPower: -11,
    meleeDamage: 15,
    image: './images/seongyeoljin.png',
    // Q 스킬: 우유 탄막 8방향 발사
    onQSkill: (p, room, socketId) => {
        const now = Date.now();
        if (!p.lastRangedTime || now - p.lastRangedTime >= 800) {
            p.lastRangedTime = now;
            const totalBullets = 8;
            for (let i = 0; i < totalBullets; i++) {
                const angle = (i * (360 / totalBullets)) * (Math.PI / 180);
                const speed = 7;
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
    // R 스킬: 우유 분수 (16개 포물선 화산 발사, 쿨타임 8초)
    onRSkill: (p, room, socketId) => {
        const now = Date.now();
        if (!p.lastRSkillTime || now - p.lastRSkillTime >= 5000) {
            p.lastRSkillTime = now;
            const totalBullets = 25;
            for (let i = 0; i < totalBullets; i++) {
                // 위쪽 방향으로 화산처럼 퍼지도록 각도 조절 (-180도 ~ 0도 사이 포물선)
                const angle = (Math.random() * 140 + 200) * (Math.PI / 180); 
                const speed = Math.random() * 6 + 5;
                room.projectiles.push({
                    x: p.x + (p.width / 2),
                    y: p.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    gravity: 0.3, // 포물선을 그리게 만드는 중력 적용
                    owner: socketId,
                    color: '#fffacd' // 연한 레몬우유빛 색상
                });
            }
            p.dialogue = "배싸! Faaaaaaah!";
            p.dialogueTimer = 150;
        }
    }
};