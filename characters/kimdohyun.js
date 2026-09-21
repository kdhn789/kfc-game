module.exports = {
    name: '김도현',
    hp: 180,
    speed: 10,
    jumpPower: -8,
    meleeDamage: 40,
    image: './images/kimdohyun.png',
    scale: 1.5,

    // Q 스킬: 길고 두꺼운 원기둥 형태의 창 발사
    onQSkill: (p, room, socketId) => {
        const now = Date.now();
        const cooldown = 3000;

        if (!p.lastQSkillTime || now - p.lastQSkillTime >= cooldown) {
            p.lastQSkillTime = now;

            const dir = p.facing === 'right' ? 1 : -1;
            const projX = dir === 1 ? p.x + p.width : p.x - 80;
            const projY = p.y + p.height / 2 - 12;

            room.projectiles.push({
                x: projX,
                y: projY,
                vx: dir * 14,
                vy: 0,
                width: 80,  // 창의 길이
                height: 20, // 창의 두께 (원기둥 느낌)
                color: '#ffd700',
                owner: socketId,
                isSpear: true,
                life: 30,
                maxLife: 30 // 페이드 아웃 계산용
            });

            p.dialogue = "ㅈ집들에게 전해~";
            p.dialogueTimer = 60;
        }
    },

    // R 스킬: 공주 페스티벌 (속도 25로 2초간 폭주 질주 + 파티클 폭발, 쿨타임 8초)
    onRSkill: (p, room, socketId) => {
        const now = Date.now();
        if (!p.lastRSkillTime || now - p.lastRSkillTime >= 5000) {
            p.lastRSkillTime = now;
            
            const originalSpeed = p.speed;
            p.speed = 24; // 속도 25로 폭주
            p.dialogue = "자숙중";
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
                    color: '#64623f' // 핫핑크 파티클
                });
            }

            // 2초 뒤 속도 복구
            setTimeout(() => {
                p.speed = originalSpeed;
            }, 2000);
        }
    }
};