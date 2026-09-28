module.exports = {
    name: '권범서',
    hp: 150,
    speed: 6,
    jumpPower: -11,
    meleeDamage: 10,
    image: './images/kangbeomseo.png',
    scale: 1.0,

    onQSkill: (p, room, socketId) => {
        const now = Date.now();
        const cooldown = 3000; // 쿨타임 3초

        if (!p.lastQSkillTime || now - p.lastQSkillTime >= cooldown) {
            p.lastQSkillTime = now;
            p.dialogue = "ㅗㅗ";
            p.dialogueTimer = 50;

            // Q 스킬 사용 시 화면 진동 효과 부여
            room.screenShake = 12;

            let targetEnemy = null;
            let minDistance = 150; // 근처 범위

            for (let id in room.players) {
                if (id !== socketId) {
                    const enemy = room.players[id];
                    if (enemy.isDead) continue;

                    const dist = Math.abs(enemy.x - p.x);
                    if (dist < minDistance) {
                        minDistance = dist;
                        targetEnemy = enemy;
                    }
                }
            }

            if (targetEnemy) {
                // 눈물 두 방울 흘리는 대사 및 시각 표현
                targetEnemy.dialogue = "나 너무 힘들어ㅜㅜ";
                targetEnemy.dialogueTimer = 60;

                const originalSpeed = targetEnemy.speed;
                targetEnemy.speed = originalSpeed * 0.5; // 이동속도 절반 감소

                room.floatingTexts.push({
                    x: targetEnemy.x + targetEnemy.width / 2,
                    y: targetEnemy.y - 10,
                    text: "💧",
                    color: '#00bcd4',
                    life: 45
                });

                setTimeout(() => {
                    if (targetEnemy) {
                        targetEnemy.speed = originalSpeed; // 2초 후 복구
                    }
                }, 2000);
            }
        }
    },

    onRSkill: (p, room, socketId) => {
        const now = Date.now();
        const cooldown = 3000; // 쿨타임 3초

        if (!p.lastRSkillTime || now - p.lastRSkillTime >= cooldown) {
            p.lastRSkillTime = now;
            p.dialogue = "범덩이!!!";
            p.dialogueTimer = 60;
            p.isAttacking = true;
            setTimeout(() => { p.isAttacking = false; }, 350);

            // 상대쪽을 바라보며 엉덩이를 보이게 점프 (vy 음수값으로 위로 점프하면서 반대 방향으로 몸 돌리기)
            p.vy = -9;
            let targetEnemy = null;
            for (let id in room.players) {
                if (id !== socketId) {
                    targetEnemy = room.players[id];
                    break;
                }
            }

            if (targetEnemy) {
                // 상대가 있는 방향의 반대쪽을 바라보게 해 엉덩이를 들이밀도록 설정
                p.facing = targetEnemy.x > p.x ? 'left' : 'right';
            }

            // 원 사이즈로 더 크게 확장된 엉덩이 모양 파티클 생성
            if (room.particles) {
                const startX = p.facing === 'right' ? p.x - 10 : p.x + p.width + 10;
                const startY = p.y + p.height / 2;
                for (let i = 0; i < 30; i++) {
                    room.particles.push({
                        x: startX + (Math.random() - 0.5) * 45,
                        y: startY + (Math.random() - 0.5) * 45,
                        vx: (Math.random() - 0.5) * 6,
                        vy: (Math.random() - 0.5) * 6,
                        color: '#ff9800',
                        type: 'particle',
                        radius: 7,
                        life: 30
                    });
                }
            }

            const attackBox = {
                x: p.facing === 'right' ? p.x - 40 : p.x,
                y: p.y - 10,
                width: p.width + 80,
                height: p.height + 20
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
                            enemy.hp -= 15;
                            if (enemy.hp < 0) enemy.hp = 0;
                        }

                        room.screenShake = 22;
                        room.floatingTexts.push({
                            x: enemy.x + enemy.width / 2,
                            y: enemy.y,
                            text: "범덩이 명중!",
                            color: '#ff4757',
                            life: 40
                        });

                        // 맞으면 무조건 벽에 튕길 정도로 멀리 날아가도록 넉백 거리 대폭 강화 (맵 끝인 0 또는 760으로 즉시 사출)
                        const pushDir = p.facing === 'right' ? -1 : 1;
                        let targetWallX = pushDir === -1 ? 10 : 750;
                        enemy.x = targetWallX;

                        room.floatingTexts.push({
                            x: enemy.x + enemy.width / 2,
                            y: enemy.y - 20,
                            text: "아잇!",
                            color: '#ffeb3b',
                            life: 35
                        });

                        // 연이어 반대쪽 벽으로 한 번 더 강력하게 튕기는 효과 구현
                        setTimeout(() => {
                            if (enemy && !enemy.isDead) {
                                const reboundWallX = pushDir === -1 ? 750 : 10;
                                enemy.x = reboundWallX;

                                room.floatingTexts.push({
                                    x: enemy.x + enemy.width / 2,
                                    y: enemy.y - 20,
                                    text: "읏!,
                                    color: '#ff9800',
                                    life: 35
                                });
                            }
                        }, 180);
                    }
                }
            }
        }
    }
};