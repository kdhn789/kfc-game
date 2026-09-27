module.exports = {
    name: '이희재',
    hp: 160,
    speed: 7,
    jumpPower: -11,
    meleeDamage: 12,
    image: './images/leeheejae.png',
    scale: 1.0,

    onQSkill: (p, room, socketId) => {
        const now = Date.now();
        const cooldown = 2000; // 쿨타임 2초

        if (!p.lastQSkillTime || now - p.lastQSkillTime >= cooldown) {
            p.lastQSkillTime = now;
            p.dialogue = "꼭지빔!!";
            p.dialogueTimer = 40;

            const dir = p.facing === 'right' ? 1 : -1;
            const laserWidth = 400; // 끝까지 가는 레이저 길이
            const laserHeight = 25;

            // Q스킬 시전 시 위로 90도 회전/발사 연출을 위한 플래그 및 각도 설정
            p.isQBeamAttacking = true;
            p.beamAngle = 0; // 정면 시작

            // 위로 90도까지 움직이며 한번 쏘는 로직
            let currentAngleStep = 0;
            const maxSteps = 10;
            const intervalId = setInterval(() => {
                currentAngleStep++;
                p.beamAngle = -(Math.PI / 2) * (currentAngleStep / maxSteps); // 위로 90도(-90도) 회전

                if (currentAngleStep >= maxSteps) {
                    clearInterval(intervalId);
                    setTimeout(() => {
                        p.isQBeamAttacking = false;
                        p.beamAngle = 0;
                    }, 200);
                }
            }, 20);

            // 판정 박스 생성 (직선으로 끝까지)
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

            // 근처 상대방 찾기
            let targetEnemy = null;
            let minDistance = 150; // 근처 판정 거리

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
                // 상대방 뒤에 3초간 밀착하여 진동하면서 연속 딜
                const attachDuration = 2000;
                const tickInterval = 100; // 0.3초마다 딜
                let elapsed = 0;

                p.isAttached = true;

                const attachTimer = setInterval(() => {
                    elapsed += tickInterval;
                    if (elapsed >= attachDuration || targetEnemy.isDead || p.isDead) {
                        clearInterval(attachTimer);
                        p.isAttached = false;
                        return;
                    }

                    // 상대방 뒤로 위치 고정 및 진동 효과
                    const offsetDir = targetEnemy.facing === 'right' ? -20 : 40;
                    p.x = targetEnemy.x + offsetDir + (Math.random() * 6 - 3);
                    p.y = targetEnemy.y + (Math.random() * 6 - 3);
                    p.vx = 0;
                    p.vy = 0;

                    // 연속 딜 적용
                    if (!(room.isSingle && room.botDifficulty === 'sandbag')) {
                        targetEnemy.hp -= 4;
                        if (targetEnemy.hp < 0) targetEnemy.hp = 0;
                    }

                    room.floatingTexts.push({
                        x: targetEnemy.x + targetEnemy.width / 2,
                        y: targetEnemy.y,
                        text: "-4",
                        color: '#ff4757',
                        life: 20
                    });

                    room.screenShake = 4;
                }, tickInterval);
            } else {
                p.dialogue = "근처에 사람이 없어!";
                p.dialogueTimer = 40;
            }
        }
    }
};