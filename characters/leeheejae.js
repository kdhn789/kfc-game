module.exports = {
    name: '이희재',
    hp: 160,
    speed: 7,
    jumpPower: -11,
    meleeDamage: 10,
    image: './images/leeheejae.png',
    scale: 1.0,

    onQSkill: (p, room, socketId) => {
        const now = Date.now();
        const cooldown = 2000; 

        if (!p.lastQSkillTime || now - p.lastQSkillTime >= cooldown) {
            p.lastQSkillTime = now;
            p.dialogue = "꼭지빔!!";
            p.dialogueTimer = 40;

            const dir = p.facing === 'right' ? 1 : -1;
            const laserWidth = 150; 
            const laserHeight = 25;

            p.isQBeamAttacking = true;
            p.beamAngle = 0; 

            let currentAngleStep = 0;
            const maxSteps = 6;
            const intervalId = setInterval(() => {
                currentAngleStep++;
                p.beamAngle = -(Math.PI / 2) * (currentAngleStep / maxSteps); 

                if (currentAngleStep >= maxSteps) {
                    clearInterval(intervalId);
                    setTimeout(() => {
                        p.isQBeamAttacking = false;
                        p.beamAngle = 0;
                    }, 100);
                }
            }, 10);

            const attackBox = {
                x: dir === 1 ? p.x + p.width : p.x - laserWidth,
                y: p.y - 20,
                width: laserWidth,
                height: p.height + 40
            };

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
                            enemy.hp -= 22;
                            if (enemy.hp < 0) enemy.hp = 0;
                        }

                        room.floatingTexts.push({
                            x: enemy.x + enemy.width / 2,
                            y: enemy.y,
                            text: "-22",
                            color: '#ff4757',
                            life: 30
                        });
                    }
                }
            }
        }
    },

    onRSkill: (p, room, socketId) => {
        const now = Date.now();
        const cooldown = 4000;

        if (!p.lastRSkillTime || now - p.lastRSkillTime >= cooldown) {
            p.lastRSkillTime = now;
            p.dialogue = "넣을게~~~";
            p.dialogueTimer = 60;

            let targetEnemy = null;
            let minDistance = 150;

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
                const attachDuration = 2000;
                const tickInterval = 100; 
                let elapsed = 0;

                p.isAttached = true;

                const attachTimer = setInterval(() => {
                    elapsed += tickInterval;

                    // 만약 부착 중 플레이어가 점프 키를 눌렀다면(외부 루프나 입력에서 점프 감지 혹은 아래와 같이 점프 상태 전환 시)
                    // 여기서는 플레이어가 점프를 시도해 vy가 위쪽으로 향하거나(또는 점프 플래그 발생 시) 취소 처리
                    if (p.isJumpRequested || elapsed >= attachDuration || targetEnemy.isDead || p.isDead) {
                        clearInterval(attachTimer);
                        p.isAttached = false;
                        
                        if (p.isJumpRequested) {
                            p.vy = p.jumpPower * 1.3; // 취소하면서 평소보다 높게 뜀 (30% 강화)
                            p.isJumpRequested = false;
                            p.dialogue = "취소!";
                            p.dialogueTimer = 25;
                        }
                        return;
                    }

                    const offsetDir = targetEnemy.facing === 'right' ? -20 : 40;
                    p.x = targetEnemy.x + offsetDir + (Math.random() * 6 - 3);
                    p.y = targetEnemy.y + (Math.random() * 6 - 3);
                    p.vx = 0;
                    p.vy = 0;

                    if (!(room.isSingle && room.botDifficulty === 'sandbag')) {
                        targetEnemy.hp -= 2;
                        if (targetEnemy.hp < 0) targetEnemy.hp = 0;
                    }

                    room.floatingTexts.push({
                        x: targetEnemy.x + targetEnemy.width / 2,
                        y: targetEnemy.y,
                        text: "-2",
                        color: '#ff4757',
                        life: 20
                    });

                    room.screenShake = 4;
                }, tickInterval);
            } else {
                p.dialogue = "근처에 사람이 없노!";
                p.dialogueTimer = 40;
            }
        }
    }
};