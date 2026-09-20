module.exports = {
    name: '김도현',
    hp: 220,
    speed: 2.5,
    jumpPower: -5,
    meleeDamage: 50,
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
    // R 스킬: 피 40% 미만일 때 속도 15, 피 10으로 고정 (1회용 각성)
    onRSkill: (p) => {
        if (!p.hasUsedAwaken && p.hp < p.maxHp * 0.4) {
            p.hasUsedAwaken = true;
            p.speed = 14;
            p.jumpPower = -10;
            p.hp = 10; // 피가 10으로 폭감하는 리스크
            p.image = './images/kimdohyun_awakened.png'; // 각성 외형 이미지
            p.dialogue = "아 노출 마려워";
            p.dialogueTimer = 150;
        }
    }
};