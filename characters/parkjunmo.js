module.exports = {
    name: '박준모',
    hp: 170,
    speed: 10,
    jumpPower: -13,
    meleeDamage: 10,
    image: './images/parkjunmo.png',
    scale: 1,

    // Q 스킬: 담배빵 (근접 공격, 0.5초 정지 및 데미지 8, 불꽃 파티클 및 화면 흔들림)
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

            // 담배빵 불꽃 파티클 생성
            if (room.particles) {
                const particleX = p.facing === 'right' ? p.x + p.width : p.x;
                const particleY = p.y + p.height / 2;
                for (let i = 0; i < 15; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 4 + 2;
                    room.particles.push({
                        x: particleX,
                        y: particleY,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        radius: Math.random() * 3 + 2,
                        color: Math.random() > 0.5 ? '#ff5722' : '#ffeb3b',
                        life: 25 // 생명주기 (프레임)
                    });
                }
            }

            // 화면 강하게 흔들림
            room.screenShake = 12;

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
                        }, 500); // 0.5초

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

    // R / 쉬프트 스킬: 도넛 (하얀색 실제 도넛 모양 구체 3개 발사)
    onRSkill: (p, room, socketId) => {
        const now = Date.now();
        const cooldown = 3000; // 3초 쿨타임

        if (!p.lastRSkillTime || now - p.lastRSkillTime >= cooldown) {
            p.lastRSkillTime = now;

            p.dialogue = "어 도넛츠나 쳐먹어-";
            p.dialogueTimer = 40;

            const dir = p.facing === 'right' ? 1 : -1;
            const startX = p.facing === 'right' ? p.x + p.width : p.x - 20;

            const donutWidth = 28;
            const donutHeight = 28;

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
                        width: donutWidth,
                        height: donutHeight,
                        damage: 5,
                        isDonut: true,       // 도넛 식별 플래그
                        isDonutShape: true,  // 진짜 도넛 모양 렌더링 플래그
                        color: '#ffffff',    // 하얀색
                        knockback: 60        // 맞았을 때 밀려나는 거리
                    });
                }, i * 150);
            }
        }
    }
};