module.exports = {
    name: '노관휘',
    hp: 150,
    speed: 5,
    jumpPower: -12,
    meleeDamage: 10,
    image: './images/nohgwanhwi.png',
    scale: 1,

    // Q 스킬: 드럼통 (노란색 범위 표시 및 파란색 드럼통 사각형으로 상대 속박)
    onQSkill: (p, room, socketId) => {
        const now = Date.now();
        const cooldown = 3000; // 3초 쿨타임

        if (!p.lastQSkillTime || now - p.lastQSkillTime >= cooldown) {
            p.lastQSkillTime = now;

            p.dialogue = "파란트럼통에 갇혀라!";
            p.dialogueTimer = 40;

            // E스킬(기본 공격 범위)처럼 Q스킬 시전 시 잠시 노란색 범위 이펙트 표시
            p.isQAttacking = true;
            setTimeout(() => { p.isQAttacking = false; }, 200);

            const attackBox = {
                x: p.facing === 'right' ? p.x + p.width : p.x - 70,
                y: p.y - 10,
                width: 70,
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
                            enemy.hp -= 10;
                            if (enemy.hp < 0) enemy.hp = 0;
                        }

                        const originalSpeed = enemy.speed;
                        enemy.speed = 0;
                        enemy.vx = 0;
                        enemy.isTrapped = true;
                        enemy.isDrumTrapped = true; // 파란색 드럼통 렌더링 플래그

                        room.floatingTexts.push({
                            x: enemy.x + enemy.width / 2,
                            y: enemy.y,
                            text: "파란트럼통 속박!",
                            color: '#00bcd4',
                            life: 40
                        });

                        setTimeout(() => {
                            if (enemy) {
                                enemy.speed = originalSpeed;
                                enemy.isTrapped = false;
                                enemy.isDrumTrapped = false;
                            }
                        }, 3000); // 3초 속박
                    }
                }
            }
        }
    },

    // SHIFT 스킬: 너고아니? (상대방을 맵 맨 끝으로 밀어내기, 쿨타임 2초)
    onRSkill: (p, room, socketId) => {
        const now = Date.now();
        const cooldown = 2000; // 2초 쿨타임

        if (!p.lastRSkillTime || now - p.lastRSkillTime >= cooldown) {
            p.lastRSkillTime = now;

            p.dialogue = "너고아니?";
            p.dialogueTimer = 40;

            const attackBox = {
                x: p.facing === 'right' ? p.x + p.width : p.x - 90,
                y: p.y - 20,
                width: 90,
                height: p.height + 40
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
                            enemy.hp -= 8;
                            if (enemy.hp < 0) enemy.hp = 0;
                        }

                        if (p.facing === 'right') {
                            enemy.x = 800 - enemy.width;
                        } else {
                            enemy.x = 0;
                        }

                        room.screenShake = 15;
                        room.floatingTexts.push({
                            x: enemy.x + enemy.width / 2,
                            y: enemy.y,
                            text: "너고아니?!",
                            color: '#ff4757',
                            life: 40
                        });
                    }
                }
            }
        }
    }
};