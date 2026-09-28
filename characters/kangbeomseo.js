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
                targetEnemy.dialogue = "나 너무 힘들어ㅜㅜ";
                targetEnemy.dialogueTimer = 50;

                const originalSpeed = targetEnemy.speed;
                targetEnemy.speed = originalSpeed * 0.5; // 이동속도 절반 감소

                room.floatingTexts.push({
                    x: targetEnemy.x + targetEnemy.width / 2,
                    y: targetEnemy.y,
                    text: "이동속도 -50%",
                    color: '#4673f0',
                    life: 40
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
            setTimeout(() => { p.isAttacking = false; }, 300);

            // 원 두개로 엉덩이 모양을 표현하는 파티클/시각 효과 생성
            if (room.particles) {
                const startX = p.facing === 'right' ? p.x + p.width : p.x;
                const startY = p.y + p.height / 2;
                for (let i = 0; i < 20; i++) {
                    room.particles.push({
                        x: startX + (Math.random() - 0.5) * 30,
                        y: startY + (Math.random() - 0.5) * 30,
                        vx: (Math.random() - 0.5) * 4,
                        vy: (Math.random() - 0.5) * 4,
                        color: '#ff9800',
                        type: 'particle',
                        life: 25
                    });
                }
            }

            const attackBox = {
                x: p.facing === 'right' ? p.x + p.width : p.x - 60,
                y: p.y,
                width: 60,
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
                            enemy.hp -= 12;
                            if (enemy.hp < 0) enemy.hp = 0;
                        }

                        room.screenShake = 15;
                        room.floatingTexts.push({
                            x: enemy.x + enemy.width / 2,
                            y: enemy.y,
                            text: "범덩이 피격!",
                            color: '#ff4757',
                            life: 40
                        });

                        // 벽에 두 번 튕기는 넉백 로직 (좌우 벽 0 ~ 800 기준)
                        const initialDir = p.facing === 'right' ? 1 : -1;
                        let bounceCount = 0;
                        let currentX = enemy.x + initialDir * 120;

                        // 첫 번째 위치 설정 및 벽 충돌 판정
                        if (currentX <= 0) {
                            currentX = 0;
                            bounceCount++;
                        } else if (currentX >= 800 - enemy.width) {
                            currentX = 800 - enemy.width;
                            bounceCount++;
                        }
                        enemy.x = currentX;

                        // 두 번째 튕김 효과 (약간의 지연 후 반대 방향으로 이동)
                        setTimeout(() => {
                            if (enemy && !enemy.isDead) {
                                const reboundDir = -initialDir;
                                let secondX = enemy.x + reboundDir * 150;
                                if (secondX <= 0) {
                                    secondX = 0;
                                    bounceCount++;
                                } else if (secondX >= 800 - enemy.width) {
                                    secondX = 800 - enemy.width;
                                    bounceCount++;
                                }
                                enemy.x = secondX;

                                room.floatingTexts.push({
                                    x: enemy.x + enemy.width / 2,
                                    y: enemy.y,
                                    text: `벽 튕김 (${bounceCount}회)!`,
                                    color: '#ffeb3b',
                                    life: 30
                                });
                            }
                        }, 150);
                    }
                }
            }
        }
    }
};