module.exports = {
    name: '김도현',
    hp: 180,
    speed: 2.5,
    jumpPower: -8,
    meleeDamage: 40,
    image: './images/kimdohyun.png',
    scale: 1.5,

    // Q 스킬: 앞으로 구르기 (느리고 웃긴 구르기)
    onQSkill: (p, room, socketId) => {
        const now = Date.now();
        const cooldown = 300;

        if (!p.lastQSkillTime || now - p.lastQSkillTime >= cooldown) {
            p.lastQSkillTime = now;

            const dir = p.facing === 'right' ? 1 : -1;
            
            // 앞으로 툭 굴러가는 속도 부여 (느리게 구름)
            p.vx = dir * 6;
            p.vy = -3; // 살짝 뜸

            p.dialogue = "앞구르기";
            p.dialogueTimer = 60;

            // 구르는 동안 이동 속도 및 판정 처리 (잠깐 동안)
            p.isRolling = true;
            setTimeout(() => {
                p.isRolling = false;
                p.vx = 0;
            }, 600);
        }
    },

    // R 스킬: 뒤로 구르기 (느리고 웃긴 후퇴)
    onRSkill: (p, room, socketId) => {
        const now = Date.now();
        const cooldown = 300;

        if (!p.lastRSkillTime || now - p.lastRSkillTime >= cooldown) {
            p.lastRSkillTime = now;
            
            // 바라보는 방향의 반대(뒤쪽)로 굴러감
            const backDir = p.facing === 'right' ? -1 : 1;

            p.vx = backDir * 6;
            p.vy = -3; // 살짝 뜸

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