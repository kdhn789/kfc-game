module.exports = {
    name: '박준모',
    hp: 170,
    speed: 10,
    jumpPower: -13,
    meleeDamage: 10,
    image: './images/parkjunmo.png', // 추후 준비될 이미지 경로
    scale: 1,

    // Q 스킬: 담배빵 (근접 공격, 0.5초 정지 및 데미지 8)
    onQSkill: (p, room, socketId) => {
        const now = Date.now();
        const cooldown = 2500; // 2.5초 쿨타임

        if (!p.lastQSkillTime || now - p.lastQSkillTime >= cooldown) {
            p.lastQSkillTime = now;

            p.dialogue = "담배빵 ㅄ아";
            p.dialogueTimer = 40;

            const attackBox = {
                x: p.facing === 'right' ? p.x + p.width : p.x - 50,
                y: p.y,
                width: 50,
                height: p.height
            };

            for (let id in room.players) {
                if (id !== socketId) {
                    const enemy = room.players[id];
                    if (enemy.isDead) continue;

                    if (attackBox.x < enemy.x + enemy.width &&
                        attackBox.x + attackBox.width > enemy.x &&
                        attackBox.y < enemy.y + enemy.height &&
                        attackBox.y + enemy.height > enemy.y) {
                        
                        if (!(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                            enemy.hp -= 8; // 데미지 8
                        }

                        // 0.5초 동안 움직이지 못하게 정지
                        const originalSpeed = enemy.speed;
                        enemy.speed = 0;
                        enemy.vx = 0;
                        enemy.isStunned = true;

                        setTimeout(() => {
                            if (enemy) {
                                enemy.speed = originalSpeed;
                                enemy.isStunned = false;
                            }
                        }, 2000); // 0.5초

                        room.screenShake = 5;

                        if (enemy.hp <= 0 && !(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                            enemy.hp = 0;
                            enemy.isDead = true;
                            room.status = 'ended';
                        }
                    }
                }
            }
        }
    },

    // R / 쉬프트 스킬: 도넛 (원거리 구체 3개 발사, 맞으면 밀려남)
    onRSkill: (p, room, socketId) => {
        const now = Date.now();
        const cooldown = 3000; // 3초 쿨타임

        if (!p.lastRSkillTime || now - p.lastRSkillTime >= cooldown) {
            p.lastRSkillTime = now;

            p.dialogue = "어 도넛츠나 쳐먹어-";
            p.dialogueTimer = 40;

            const dir = p.facing === 'right' ? 1 : -1;
            const startX = p.facing === 'right' ? p.x + p.width : p.x - 20;

            // 추후 크기 조정이 가능하도록 변수로 분리
            const donutWidth = 24;
            const donutHeight = 24;

            // 하얀색 도넛 모양 구체 3개를 0.15초 간격으로 연속 발사
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (!room || room.status === 'ended') return;

                    room.projectiles.push({
                        owner: socketId,
                        x: startX,
                        y: p.y + (p.height / 2) - (donutHeight / 2) + (i * 8 - 8),
                        vx: dir * (6 + i * 0.4),
                        vy: 0,
                        width: donutWidth,    // 도넛 너비 크기
                        height: donutHeight,  // 도넛 높이 크기
                        damage: 5,            // 도넛 데미지
                        isDonut: true,        // 도넛 식별 플래그
                        knockback: 60         // 맞았을 때 밀려나는 거리 (추후 조정 가능)
                    });
                }, i * 150);
            }
        }
    }
};