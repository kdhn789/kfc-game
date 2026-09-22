// characters/kangyul.js
module.exports = {
    name: '강율',
    hp: 100,
    speed: 14,
    jumpPower: -13,
    meleeDamage: 17,
    scale: 1.0,
    image: './images/kangyul.png',

    // Q 스킬: 의사 호출 (머리 위 청록색 십자가, 페이드아웃, 피 20 회복, 쿨타임 4초)
    onQSkill: (p, room, socketId) => {
        if (room.status !== 'playing') return;

        const now = Date.now();
        if (p.lastQSkillTime && now - p.lastQSkillTime < 8000) return; // 쿨타임 4초
        p.lastQSkillTime = now;

        p.dialogue = "의사 선생님!!!";
        p.dialogueTimer = 90;

        // 체력 20 회복 (최대 체력인 100을 넘지 않도록 처리)
        p.hp = Math.min(p.maxHp, p.hp + 20);
        room.floatingTexts.push({
            x: p.x + p.width / 2,
            y: p.y,
            text: `+20`,
            color: '#00d1a7', // 청록색 계열
            life: 30
        });

        // 머리 위로 청록색 십자가 및 페이드아웃 효과를 위한 파티클/텍스트 오브젝트 생성
        room.projectiles.push({
            x: p.x + p.width / 2,
            y: p.y - 15,
            vx: 0,
            vy: -0.5,
            color: '#00d196',
            type: 'particle',
            life: 40
        });
    },

    // SHIFT(R) 스킬: 폐 터뜨리기 (빨간색 파티클을 흘리며 앞으로 대쉬, 공격 스킬 없음)
    onRSkill: (p, room, socketId) => {
        if (room.status !== 'playing') return;

        const now = Date.now();
        if (p.lastRSkillTime && now - p.lastRSkillTime < 2000) return;
        p.lastRSkillTime = now;

        p.dialogue = "내 폐!";
        p.dialogueTimer = 100;

        const dashDir = p.facing === 'right' ? 1 : -1;
        p.x += dashDir * 140;
        if (p.x < 0) p.x = 0;
        if (p.x > 800 - p.width) p.x = 800 - p.width;

        // 빨간색 파티클 흘리기
        for (let i = 0; i < 6; i++) {
            room.projectiles.push({
                x: p.x + p.width / 2,
                y: p.y + p.height / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: '#ae1f1f',
                type: 'particle',
            });
        }
    },

    // 공격하면 자기 피 1 닳는 기능 유지
    onMeleeSkill: (p, room, socketId) => {
        if (room.status !== 'playing') return;

        p.hp -= 1;
        if (p.hp <= 0) {
            p.hp = 0;
            p.isDead = true;
            room.status = 'ended';
            return;
        }

        p.isAttacking = true;
        setTimeout(() => { p.isAttacking = false; }, 200);

        for (let id in room.players) {
            if (id !== socketId) {
                const enemy = room.players[id];
                if (enemy.isDead) continue;

                const attackBox = {
                    x: p.facing === 'right' ? p.x + p.width : p.x - 40,
                    y: p.y,
                    width: 40,
                    height: p.height
                };

                if (attackBox.x < enemy.x + enemy.width &&
                    attackBox.x + attackBox.width > enemy.x &&
                    attackBox.y < enemy.y + enemy.height &&
                    attackBox.y + enemy.height > enemy.y) {
                    
                    if (!(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                        enemy.hp -= p.meleeDamage;
                        room.floatingTexts.push({
                            x: enemy.x + enemy.width / 2,
                            y: enemy.y,
                            text: `-${p.meleeDamage}`,
                            color: '#be2431',
                        });
                    }
                    
                    const knockDir = p.facing === 'right' ? 1 : -1;
                    enemy.x += knockDir * 40; 
                    room.screenShake = 10; 

                    if (enemy.hp <= 0 && !(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                        enemy.hp = 0;
                        enemy.isDead = true;
                        room.status = 'ended';
                    }
                }
            }
        }
    }
};