// characters/kangyul.js
module.exports = {
    name: '강율',
    hp: 100,
    speed: 8,
    jumpPower: -15,
    meleeDamage: 15,
    scale: 1.0,
    image: './images/kangyul.png',

    // Q 스킬: 폐 터뜨리기 (펑 터지면서 상대한테 대쉬)
    onQSkill: (p, room, socketId) => {
        p.isAttacking = true;
        setTimeout(() => { p.isAttacking = false; }, 200);

        for (let id in room.players) {
            if (id !== socketId) {
                const enemy = room.players[id];
                if (enemy.isDead) continue;

                // 앞으로 쾅 대쉬하며 이동
                const dashDir = p.facing === 'right' ? 1 : -1;
                p.x += dashDir * 80;
                if (p.x < 0) p.x = 0;
                if (p.x > 800 - p.width) p.x = 800 - p.width;

                // 적에게 데미지 부여 및 넉백
                if (!(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                    enemy.hp -= 20;
                }
                enemy.x += dashDir * 40;
                room.screenShake = 8;

                // 적 체력 체크
                if (enemy.hp <= 0 && !(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                    enemy.hp = 0;
                    enemy.isDead = true;
                    room.status = 'ended';
                    // io 객체가 필요할 수 있으므로 상황에 맞게 처리 (서버 내부 로직 참조)
                }
            }
        }
    },

    // SHIFT(R) 스킬: 심장 터뜨리기 (자폭: 자신 30, 상대 30 감소 - 자기가 먼저 깎이고 상대 깎임)
    onRSkill: (p, room, socketId) => {
        // 쿨타임 체크 등을 원하시면 여기에 추가 가능합니다.
        
        for (let id in room.players) {
            if (id !== socketId) {
                const enemy = room.players[id];
                if (enemy.isDead) continue;

                // 1. 요청하신 대로 '자기가 먼저 피가 깎이고'
                p.hp -= 30;
                if (p.hp < 0) p.hp = 0;

                room.screenShake = 15;

                // 자기가 먼저 죽었는지 판정
                if (p.hp <= 0) {
                    p.isDead = true;
                    room.status = 'ended';
                    break; // 자기가 죽었으므로 여기서 처리 종료 혹은 승패 판정
                }

                // 2. '상대가 깎이는 식'
                if (!(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                    enemy.hp -= 30;
                }

                if (enemy.hp <= 0 && !(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                    enemy.hp = 0;
                    enemy.isDead = true;
                    room.status = 'ended';
                }
            }
        }
    },

    // 기본 공격(E 또는 일반 타격) 시 패시브 적용: 공격할 때마다 자기 피가 역으로 1씩 깎임
    onMeleeSkill: (p, room, socketId) => {
        // 패시브 발동: 공격 시 자신 체력 1 감소
        p.hp -= 1;
        if (p.hp <= 0) {
            p.hp = 0;
            p.isDead = true;
            room.status = 'ended';
            return;
        }

        // 기본 근접 공격 로직 수행
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
                    attackBox.y + height > enemy.y) { // 수정: enemy.height
                    
                    if (!(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                        enemy.hp -= p.meleeDamage;
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