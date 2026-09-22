module.exports = {
    name: '조겸',
    hp: 100,
    speed: 8,
    jumpPower: -13,
    meleeDamage: 11,
    image: './images/jogyum.png',
    // Q 스킬: 대시
    onQSkill: (p) => {
        const dashDir = p.facing === 'right' ? 1 : -1;
        p.x += dashDir * 180;
        if (p.x < 0) p.x = 0;
        if (p.x > 800 - p.width) p.x = 800 - p.width;
        p.dialogue = "6세 여아 발견!";
        p.dialogueTimer = 90;
    },
    // R 스킬: 공주 페스티벌 (속도 25로 2초간 폭주 질주 + 파티클 폭발, 쿨타임 8초)
    onRSkill: (p, room, socketId) => {
        const now = Date.now();
        if (!p.lastRSkillTime || now - p.lastRSkillTime >= 5000) {
            p.lastRSkillTime = now;
            
            const originalSpeed = p.speed;
            p.speed = 24; // 속도 25로 폭주
            p.dialogue = "공주 페스티벌 JJ야~~";
            p.dialogueTimer = 120;

            // 분홍색 파티클 폭발 생성 (시각적 효과용 투사체 활용)
            for (let i = 0; i < 12; i++) {
                room.projectiles.push({
                    x: p.x + (p.width / 2),
                    y: p.y + (p.height / 2),
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    life: 30, // 금방 사라지는 파티클
                    owner: socketId,
                    color: '#ff69b4' // 핫핑크 파티클
                });
            }

            // 2초 뒤 속도 복구
            setTimeout(() => {
                p.speed = originalSpeed;
            }, 2000);
        }
    }
};