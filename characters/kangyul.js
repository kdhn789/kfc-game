// characters/kangyul.js
module.exports = {
    name: '강율',
    hp: 100,
    speed: 8,
    jumpPower: -15,
    meleeDamage: 15,
    scale: 1.0,
    image: './images/kangyul.png',

    // Q 스킬: 율스트라이크
    onQSkill: (p, room, socketId) => {
        if (room.status !== 'playing') return;
        p.isAttacking = true;
        setTimeout(() => { p.isAttacking = false; }, 200);

        for (let id in room.players) {
            if (id !== socketId) {
                const enemy = room.players[id];
                if (enemy.isDead) continue;

                const dashDir = p.facing === 'right' ? 1 : -1;
                p.x += dashDir * 80;
                if (p.x < 0) p.x = 0;
                if (p.x > 800 - p.width) p.x = 800 - p.width;

                if (!(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                    enemy.hp -= 20;
                }
                enemy.x += dashDir * 40;
                room.screenShake = 8;

                if (enemy.hp <= 0 && !(room.isSingle && room.botDifficulty === 'sandbag' && id === 'bot')) {
                    enemy.hp = 0;
                    enemy.isDead = true;
                    room.status = 'ended';
                }
            }
        }
    },

    // SHIFT(R) 스킬: 무빙포즈 (자폭 방지 및 게임 종료 상태 체크 추가)
    onRSkill: (p, room, socketId) => {
        if (room.status !== 'playing') return;
        
        for (let id in room.players) {
            if (id !== socketId) {
                const enemy = room.players[id];
                if (enemy.isDead) continue;

                p.hp -= 30;
                if (p.hp < 0) p.hp = 0;

                room.screenShake = 15;

                if (p.hp <= 0) {
                    p.isDead = true;
                    room.status = 'ended';
                    break; 
                }

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

    // 기본 공격(E): 오타(height) 수정 및 게임 상태 체크 추가
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

                // 수정된 부분: enemy.height 참조 오류 해결
                if (attackBox.x < enemy.x + enemy.width &&
                    attackBox.x + attackBox.width > enemy.x &&
                    attackBox.y < enemy.y + enemy.height &&
                    attackBox.y + attackBox.height > enemy.y) {
                    
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