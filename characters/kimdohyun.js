module.exports = {
    name: '김도현',
    hp: 180,
    speed: 2.5,
    jumpPower: -6.5,
    meleeDamage: 40,
    image: './images/kimdohyun.png',
    
    // Q 스킬: 거대화
    onQSkill: (p) => {
        if (!p.hasUsedGrow) {
            p.hasUsedGrow = true;
            const oldHeight = p.height;
            p.width = 80;
            p.height = 80;
            p.y -= (p.height - oldHeight); 
            const hpRatio = p.hp / p.maxHp;
            p.maxHp *= 2;
            p.hp = p.maxHp * hpRatio;
            p.dialogue = "파이리빵 마이쪙";
            p.dialogueTimer = 120;
        }
    },

    // 쉬프트(Shift) 스킬: 2초간 속도 빨라지고 변신, 쿨타임 6초
    onRSkill: (p, room, socketId) => {
        const now = Date.now();
        const cooldown = 6000; // 6초 쿨타임

        // 쿨타임 체크 (마지막 사용 시간이 없거나 6초가 지난 경우)
        if (!p.lastShiftTime || now - p.lastShiftTime >= cooldown) {
            p.lastShiftTime = now;

            // 기존 속도와 이미지 백업
            const originalSpeed = p.speed;
            const originalImage = p.image;

            // 변신 및 속도 증가 적용
            p.speed = 11; // 원하는 빠른 속도로 조절 가능합니다.
            p.image = './images/kimdohyun_awakened.png'; // 변신 외형 이미지
            p.dialogue = "아 노출 마려워";
            p.dialogueTimer = 120;

            // 2초(2000ms) 후에 원래 속도와 이미지로 복구
            setTimeout(() => {
                // 게임 도중 사망하거나 방이 사라진 경우가 아닐 때만 복구
                if (p && !p.isDead) {
                    p.speed = originalSpeed;
                    p.image = originalImage;
                }
            }, 2000);
        }
    }
};