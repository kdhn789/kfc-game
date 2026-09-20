module.exports = {
    name: '김도현',
    hp: 180,
    speed: 10,
    jumpPower: -8,
    meleeDamage: 40,
    image: './images/kimdohyun.png',
    
    // 기본 특성: 크기 1.5배 (캐릭터 생성 시 적용을 위해 scale 부여 가능, 아래 로직에서 반영)
    scale: 1.5,

    // Q 스킬: 창 (앞으로 노란색 원기둥 모양의 창을 찌름)
    onQSkill: (p, room, socketId) => {
        const now = Date.now();
        const cooldown = 3000; // 3초 쿨타임

        if (!p.lastQSkillTime || now - p.lastQSkillTime >= cooldown) {
            p.lastQSkillTime = now;

            // 바라보는 방향에 따른 창 발사 위치 설정
            const dir = p.facing === 'right' ? 1 : -1;
            const projX = dir === 1 ? p.x + p.width : p.x - 50;
            const projY = p.y + p.height / 2 - 10;

            // 노란색 원기둥 형태의 창 투사체 생성
            room.projectiles.push({
                x: projX,
                y: projY,
                vx: dir * 12,
                vy: 0,
                width: 50,
                height: 12,
                color: '#ffd700', // 노란색
                owner: socketId,
                isSpear: true,
                life: 25 // 사거리 유지 시간
            });

            p.dialogue = "ㅈ집 발견!";
            p.dialogueTimer = 60;
        }
    },

    // 쉬프트(Shift) 스킬: 자숙 (꾹 누르는 방식 - 누르는 동안 크기 0.5배, 이동 불가, 체력 3씩 회복)
    onRSkill: (p, room, socketId) => {
        // 이미 자숙 중이 아니라면 시작
        if (!p.isContemplating) {
            p.isContemplating = true;
            
            // 기존 크기 백업
            p.originalWidth = p.width;
            p.originalHeight = p.height;
            p.originalSpeed = p.speed;

            // 크기 0.5배로 축소 및 이동 불가(속도 0)
            p.width = 40 * 0.75; // 기본 크기 기준 조절
            p.height = 40 * 0.75;
            p.speed = 0;
            p.vx = 0;

            p.dialogue = "자숙 중...";
        }
    },

    // 쉬프트 키를 뗐을 때 호출될 해제 함수 (서버에서 키 뗄 때 감지하도록 연동)
    onRRelease: (p) => {
        if (p.isContemplating) {
            p.isContemplating = false;
            // 원래 크기와 속도로 복구
            p.width = p.originalWidth || 60;
            p.height = p.originalHeight || 60;
            p.speed = p.originalSpeed || 2;
            p.dialogue = "자숙 끝!";
            p.dialogueTimer = 60;
        }
    }
};