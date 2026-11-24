document.addEventListener('DOMContentLoaded', function () {
    const spirits = {
                mallow: { name: 'Mallow', emoji: '👻', sprite: 'https://uploads.onecompiler.io/457avz6hb/1794909526363/image_1794909536247.png', type: 'Kindling spirit', power: 4, color: 'soft light' },
        cinder: { name: 'Cinder', emoji: '🦊', sprite: 'https://uploads.onecompiler.io/457avz6hb/1794909847687/image_1794909860103.png', type: 'Ember spirit', power: 6, color: 'quick fire' },
                ripple: { name: 'Ripple', emoji: '🫧', sprite: 'https://uploads.onecompiler.io/457avz6hb/459fbh6ba/download%20(1).png', type: 'Tide spirit', power: 4, color: 'flowing water' }

    };
    const state = {
        spirit: null, x: 50, y: 51, bond: 12, hp: 30, maxHp: 30, level: 1,
        battle: false, enemyHp: 24, enemyMaxHp: 24, enemyName: 'Gloam Bat', enemyEmoji: '🦇',
        dodging: false, captured: false, battleX: 18, jumpHeight: 0, jumpVelocity: 0,
        crouching: false, dashTime: 0, attackPhase: 'idle', attackTimer: 1.4, attackTargetX: 18,
        enemyPower: 4, enemyShot: '💜', enemyAttack: 'shadow bolt', projectiles: [],
        allyProjectiles: [], allyBurstLeft: 0, allyBurstTimer: 0, allyShotDamage: 0,
        enemyX: 76, enemyBottom: 48, enemyTargetX: 76, enemyTargetBottom: 48, enemyMoveTimer: 2,
        burstShotsLeft: 0, burstTimer: 0, keys: {},
                weaponReadyAt: 0, abilityReadyAt: 0, specialReadyAt: 0, spiritAttackCount: 0, facing: 1, battleLoop: null,
        commandUntil: 0,
        currentWild: null

    };


        const $ = id => document.getElementById(id);
    function characterMarkup(kind) {
        if (kind === 'person') {
            return '<span class="character-art person-art" aria-hidden="true"><span class="person-head"><i class="person-eye left"></i><i class="person-eye right"></i></span><span class="person-arm left"></span><span class="person-arm right"></span><span class="person-body"></span><span class="person-leg left"></span><span class="person-leg right"></span></span>';
        }
        const className = kind === '🦇' ? 'bat' : kind === '🔥' || kind === '🦊' ? 'ember' : kind === '💧' || kind === '🫧' ? 'tide' : kind === '🌿' ? 'moss' : 'kindling';
        const wings = kind === '🦇' ? '<span class="bat-wing left"></span><span class="bat-wing right"></span>' : '';
        return '<span class="character-art spirit-character ' + className + '" aria-hidden="true">' + wings + '<span class="spirit-body"></span><i class="spirit-eye left"></i><i class="spirit-eye right"></i><i class="spirit-mouth"></i></span>';
    }
    function setSpiritSprite(element, sprite, fallback) {
        element.innerHTML = characterMarkup(fallback || '👻');
    }
    function setPerson(element) {
        element.innerHTML = characterMarkup('person');
    }
    const player = $('player');
    const companion = $('companion');
    document.querySelectorAll('.starter').forEach(button => {
        const starter = spirits[button.dataset.spirit];
        const slot = button.querySelector('.character-slot');
        if (starter && slot) setSpiritSprite(slot, null, starter.emoji);
    });
    setPerson(player);
    setPerson($('room-player'));
    setPerson($('battle-player'));
    const wildSpirits = [
                { name: 'Gloam Bat', emoji: '🦇', sprite: 'https://uploads.onecompiler.io/457avz6hb/459fbh6ba/download%20(2).png', hp: 24, power: 4, shot: '💜', attack: 'shadow bolt' },

        { name: 'Mossling', emoji: '🌿', sprite: 'https://uploads.onecompiler.io/457avz6hb/459fbh6ba/image_1795056494074.png', hp: 28, power: 6, shot: '🍃', attack: 'thorn shot' },
                { name: 'Wisp', emoji: '✨', sprite: 'https://uploads.onecompiler.io/457avz6hb/459fbh6ba/Sparkle-ghost-restyled-64x64px.png', hp: 20, power: 8, shot: '🔆', attack: 'spirit flare' }

    ];
        let roamTimer;
    let toastTimer;



    wildSpirits.forEach((wild, index) => {
        const ghost = document.createElement('div');
        wild.x = 29 + index * 20;
        wild.y = 25 + index * 18;
                ghost.className = 'actor wild-ghost hidden';
        setSpiritSprite(ghost, wild.sprite, wild.emoji);
        ghost.title = wild.name;
        ghost.setAttribute('aria-label', 'Wild spirit ' + wild.name);
        ghost.style.left = wild.x + '%';
        ghost.style.top = wild.y + '%';
        $('scene').appendChild(ghost);
        wild.element = ghost;
    });


    document.querySelectorAll('.starter').forEach(button => {
        button.addEventListener('click', () => chooseSpirit(button.dataset.spirit));
    });
    $('pet-button').addEventListener('click', petSpirit);
    $('snack-button').addEventListener('click', giveTreat);
    $('room-button').addEventListener('click', () => {
        if (state.spirit && !state.battle) $('room-overlay').classList.remove('hidden');
    });
    $('leave-room-button').addEventListener('click', () => $('room-overlay').classList.add('hidden'));
    $('battle-button').addEventListener('click', startBattle);
        $('attack-button').addEventListener('click', spiritAttack);
    $('special-button').addEventListener('click', specialAttack);
    $('weapon-button').addEventListener('click', weaponAttack);
    $('capture-button').addEventListener('click', attemptCapture);
    $('leave-button').addEventListener('click', finishBattle);
    $('return-button').addEventListener('click', finishBattle);


    document.addEventListener('keydown', event => {
        if (!state.spirit || $('starter-overlay').classList.contains('hidden') === false || !$('room-overlay').classList.contains('hidden')) return;
        if (state.battle) {
            const key = event.key.toLowerCase();
            if (['a', 'd', 'w', 's', ' ', 'f', 'e', 'j'].includes(key) || event.key.startsWith('Arrow')) event.preventDefault();
            state.keys[key] = true;
            if (event.key.startsWith('Arrow')) state.keys[event.key] = true;
            if ((key === 'w' || event.key === 'ArrowUp') && !event.repeat && state.jumpHeight === 0 && state.jumpVelocity <= 0) state.jumpVelocity = 10;
            if (key === ' ' && !event.repeat) dash();
                        if (key === 'f' && !event.repeat) spiritAttack();
            if (key === 'e' && !event.repeat) specialAttack();
            if (key === 'j' && !event.repeat) weaponAttack();
            return;
        }
        const directions = {
            ArrowUp: [0, -5], w: [0, -5], W: [0, -5],
            ArrowDown: [0, 5], s: [0, 5], S: [0, 5],
            ArrowLeft: [-5, 0], a: [-5, 0], A: [-5, 0],
            ArrowRight: [5, 0], d: [5, 0], D: [5, 0]
        };
        if (directions[event.key]) {
            event.preventDefault();
            movePlayer(...directions[event.key]);
        }
    });
    document.addEventListener('keyup', event => {
        const key = event.key.toLowerCase();
        delete state.keys[key];
        delete state.keys[event.key];
        if (key === 's' || event.key === 'ArrowDown') setCrouch(false);
    });


    function chooseSpirit(key) {
        state.spirit = spirits[key];
        $('starter-overlay').classList.add('hidden');
        $('empty-spirit').classList.add('hidden');
        $('spirit-details').classList.remove('hidden');
        player.classList.remove('hidden');
        companion.classList.remove('hidden');
        wildSpirits.forEach(wild => wild.element.classList.remove('hidden'));
        if (!roamTimer) roamTimer = setInterval(roamWildSpirits, 100);
        $('pet-button').disabled = false;
        $('snack-button').disabled = false;
        $('room-button').disabled = false;
                setSpiritSprite($('spirit-avatar'), state.spirit.sprite, state.spirit.emoji);
        $('spirit-name').textContent = state.spirit.name;
        $('spirit-type').textContent = state.spirit.type + ' · Lv. 1';
                setSpiritSprite($('battle-companion'), state.spirit.sprite, state.spirit.emoji);
        setSpiritSprite($('room-companion'), state.spirit.sprite, state.spirit.emoji);
        $('ally-name').textContent = state.spirit.name;
        setSpiritSprite(companion, state.spirit.sprite, state.spirit.emoji);
        updateActors();
        updateStats();
        showGameMessage(state.spirit.name + ' chose you, too. Your adventure begins at home.');
        $('position-label').textContent = 'Living room · at home';
    }


    function movePlayer(dx, dy) {
        state.x = Math.max(7, Math.min(91, state.x + dx));
        state.y = Math.max(13, Math.min(88, state.y + dy));
        updateActors();
        if (state.x > 84 && state.y > 38 && state.y < 68) {
            $('position-label').textContent = 'Front door · the wider world is coming soon';
        } else if (state.x < 25 && state.y < 40) {
            $('position-label').textContent = 'Bed · take a quiet moment';
        } else if (state.x > 65 && state.y < 35) {
            $('position-label').textContent = 'Keepsake shelf · old memories';
        } else {
            $('position-label').textContent = 'Living room · at home';
        }
        checkWildSpiritContact();
    }


    function updateActors() {
        player.style.left = state.x + '%';
        player.style.top = state.y + '%';
        companion.style.left = Math.max(8, Math.min(92, state.x - 5)) + '%';
        companion.style.top = Math.min(88, state.y + 9) + '%';
    }


    function petSpirit() {
        if (!state.spirit) return;
        state.bond = Math.min(100, state.bond + 12);
        showGameMessage(state.spirit.name + ' leans into your hand. Your bond grows warmer.');
        updateStats();
        checkEvolution();
    }


    function giveTreat() {
        if (!state.spirit) return;
        state.bond = Math.min(100, state.bond + 8);
        state.hp = Math.min(state.maxHp, state.hp + 7);
        showGameMessage('You share a little moonberry treat. ' + state.spirit.name + ' looks brighter.');
        updateStats();
        checkEvolution();
    }


    function updateStats() {
        $('bond-label').textContent = state.bond + ' / 100';
        $('bond-meter').style.width = state.bond + '%';
        $('health-label').textContent = state.hp + ' / ' + state.maxHp;
        $('health-meter').style.width = (state.hp / state.maxHp * 100) + '%';
    }


    function checkEvolution() {
        if (state.bond >= 100 && state.level === 1) {
            state.level = 2;
            $('spirit-type').textContent = state.spirit.type + ' · Lv. 2 · Awakened';
            showGameMessage(state.spirit.name + ' glows with your bond—your companion has awakened!');
        }
    }


        function roamWildSpirits() {
        if (!state.spirit || state.battle || !$('room-overlay').classList.contains('hidden')) return;

        // Check for a catch before the spirit reacts and flees from the player.
        checkWildSpiritContact();
        if (state.battle) return;

        wildSpirits.forEach(wild => {
            if (wild.element.classList.contains('hidden')) return;
            const dx = wild.x - state.x;
            const dy = wild.y - state.y;
            const distance = Math.hypot(dx, dy);

            if (distance < 26 && distance > 0) {
                // Flee gently, leaving enough time for the player to pursue.
                wild.x += (dx / distance) * 0.5;
                wild.y += (dy / distance) * 0.5;
            } else {
                // Wander slowly when the player is farther away.
                wild.roamAngle = (wild.roamAngle || Math.random() * Math.PI * 2) + (Math.random() - 0.5) * 0.12;
                wild.x += Math.cos(wild.roamAngle) * 0.12;
                wild.y += Math.sin(wild.roamAngle) * 0.12;
            }

            wild.x = Math.max(12, Math.min(88, wild.x));
            wild.y = Math.max(18, Math.min(84, wild.y));
            wild.element.style.left = wild.x + '%';
            wild.element.style.top = wild.y + '%';
        });
    }


    function checkWildSpiritContact() {
        if (!state.spirit || state.battle || !$('room-overlay').classList.contains('hidden')) return;
                const wild = wildSpirits.find(spirit =>
            !spirit.element.classList.contains('hidden') &&
            Math.abs(spirit.x - state.x) < 8 && Math.abs(spirit.y - state.y) < 12
        );

        if (!wild) return;


        // Move the encountered spirit away so returning home won't trigger it again immediately.
        let attempts = 0;
        do {
            wild.x = 12 + Math.random() * 76;
            wild.y = 18 + Math.random() * 66;
            attempts++;
        } while (attempts < 30 && Math.abs(wild.x - state.x) < 12 && Math.abs(wild.y - state.y) < 16);
        wild.element.style.left = wild.x + '%';
        wild.element.style.top = wild.y + '%';
        startBattle(wild);
    }


        function startBattle(wild) {
        if (!state.spirit || state.battle || !$('room-overlay').classList.contains('hidden')) return;
        if (!wild) {
            const availableSpirits = wildSpirits.filter(spirit => !spirit.element.classList.contains('hidden'));
            if (!availableSpirits.length) return;
            wild = availableSpirits[Math.floor(Math.random() * availableSpirits.length)];
        }
        state.currentWild = wild;
        state.battle = true;

        state.enemyName = wild.name;
        state.enemyEmoji = wild.emoji;
        state.enemyPower = wild.power;
        state.enemyShot = wild.shot;
        state.enemyAttack = wild.attack;
        state.projectiles.forEach(projectile => projectile.element.remove());
        state.allyProjectiles.forEach(projectile => projectile.element.remove());
        state.projectiles = [];
        state.allyProjectiles = [];
        state.allyBurstLeft = 0;
        state.allyBurstTimer = 0;
                $('enemy-projectile').classList.add('hidden');
        state.enemyX = 92;
        state.enemyBottom = 58;
        state.enemyTargetX = 92;
        state.enemyTargetBottom = 58;
        state.enemyMoveTimer = 1.5;
        state.burstShotsLeft = 0;
                state.burstTimer = 0;
        state.keys = {};
        $('enemy-art').style.left = state.enemyX + '%';
        $('enemy-art').style.right = 'auto';
        $('enemy-art').style.bottom = state.enemyBottom + '%';
        state.enemyMaxHp = wild.hp;
        state.enemyHp = state.enemyMaxHp;
        state.dodging = false;
        state.captured = false;
                state.battleX = 18;
        state.facing = 1;
        state.abilityReadyAt = 0;
        state.specialReadyAt = Date.now() + 7000;
        $('battle-world').style.left = '0px';
        $('battle-player').style.transform = 'none';
        state.jumpHeight = 0;
        state.jumpVelocity = 0;
        state.crouching = false;
        state.dashTime = 0;
        state.attackPhase = 'idle';
        state.attackTimer = 1.4;
        state.weaponReadyAt = 0;
        state.spiritAttackCount = 0;
        $('battle-player').classList.remove('crouching', 'dashing', 'walking', 'jumping', 'commanding');
        state.commandUntil = 0;
        $('attack-warning').classList.remove('active');
        $('battle-player').style.left = state.battleX + '%';
        $('battle-player').style.bottom = '34%';
        $('battle-companion').style.left = '7%';
        $('battle-companion').style.bottom = '33%';
                $('battle-overlay').classList.remove('hidden');
        $('mode-badge').textContent = 'IN BATTLE';

        $('battle-title').textContent = 'A wild spirit appears!';
        $('battle-message').textContent = 'The ' + state.enemyName + ' is preparing to attack. Move and dodge while your companion fights!';
        $('enemy-name').textContent = state.enemyName;
                setSpiritSprite($('enemy-art'), wild.sprite, state.enemyEmoji);
        $('capture-button').disabled = false;
        $('battle-actions').classList.remove('hidden');
                $('battle-end-actions').classList.add('hidden');
        updateBattleMeters();
        renderBattleActors();
        updateSpecialButton();
        if (state.battleLoop) clearInterval(state.battleLoop);

        state.battleLoop = setInterval(updateBattle, 50);
    }


    function moveBattlePlayer(direction) {
        if (!state.battle || state.enemyHp <= 0) return;
                state.facing = direction;
        $('battle-player').style.transform = direction > 0 ? 'none' : 'scaleX(-1)';
        state.battleX = Math.max(3, Math.min(98, state.battleX + direction * 0.8));
    }


        function renderBattleActors() {
        const field = $('battle-field');
        const world = $('battle-world');
        const fieldWidth = field.clientWidth;
        const worldWidth = fieldWidth * 3;
        const playerWorldX = state.battleX / 100 * worldWidth;
        const cameraOffset = Math.max(0, Math.min(worldWidth - fieldWidth, playerWorldX - fieldWidth * .38));
        world.style.left = -cameraOffset + 'px';
        $('battle-player').style.left = state.battleX + '%';
        $('battle-player').style.bottom = 'calc(34% + ' + state.jumpHeight + 'px)';
        $('battle-companion').style.left = Math.max(2, state.battleX - 9) + '%';
        $('battle-companion').style.bottom = 'calc(33% + ' + Math.round(state.jumpHeight * .65) + 'px)';
        $('enemy-art').style.left = state.enemyX + '%';
        $('enemy-art').style.bottom = state.enemyBottom + '%';
        const enemyScreenX = state.enemyX / 100 * worldWidth - cameraOffset;
        const marker = $('enemy-direction');
        const enemyOffscreen = enemyScreenX < 0 || enemyScreenX > fieldWidth;
        marker.classList.toggle('visible', enemyOffscreen);
        marker.classList.toggle('left', enemyScreenX < 0);
        marker.classList.toggle('right', enemyScreenX > fieldWidth);
        marker.textContent = enemyScreenX < 0 ? '◀' : '▶';
        marker.title = state.enemyName + ' is off-screen';
    }


    function setCrouch(active) {
        if (!state.battle) return;
        state.crouching = active;
        $('battle-player').classList.toggle('crouching', active);
    }


    function dash() {
        if (!state.battle || state.enemyHp <= 0 || state.dashTime > 0) return;
        state.dashTime = .25;
        $('battle-player').classList.add('dashing');
    }


    function showSpiritAttack(mode) {
        const field = $('battle-field');
        const companionElement = $('battle-companion');
        const companionRect = companionElement.getBoundingClientRect();
        const enemyRect = $('enemy-art').getBoundingClientRect();
        const fieldRect = field.getBoundingClientRect();
        const startX = companionRect.left + companionRect.width / 2 - fieldRect.left;
        const startY = companionRect.top + companionRect.height / 2 - fieldRect.top;
        const targetX = enemyRect.left + enemyRect.width / 2 - fieldRect.left;
        const targetY = enemyRect.top + enemyRect.height / 2 - fieldRect.top;


        if (mode === 'tackle') {
            companionElement.classList.add('tackling');
            companionElement.style.transform = 'translateX(' + (targetX - startX - companionRect.width) + 'px) scale(1.15)';
            window.setTimeout(() => {
                companionElement.style.transform = '';
                window.setTimeout(() => companionElement.classList.remove('tackling'), 180);
            }, 180);
        } else {
                        const attackStyle = {
                mallow: { emoji: '🟣', className: 'kindling', color: '#bda3ff' },
                cinder: { emoji: '🔥', className: 'ember', color: '#ff9a68' },
                ripple: { emoji: '💧', className: 'tide', color: '#7ee9ff' }
            }[Object.keys(spirits).find(key => spirits[key] === state.spirit)] || { emoji: '✨', className: 'kindling', color: '#bda3ff' };

            const projectile = document.createElement('div');
                        projectile.className = 'ghost-projectile ' + (mode === 'special' ? 'special ' : 'bullet ') + attackStyle.className;
            projectile.textContent = mode === 'special' ? '🌟' : attackStyle.emoji;
            projectile.setAttribute('aria-hidden', 'true');
                        projectile.style.left = startX + 'px';
            projectile.style.top = startY + 'px';
            projectile.style.setProperty('--shot-color', attackStyle.color);
            projectile.style.setProperty('--travel-x', (targetX - startX) + 'px');

            projectile.style.setProperty('--travel-y', (targetY - startY) + 'px');
            field.appendChild(projectile);


            window.setTimeout(() => {
                projectile.remove();
                const impact = document.createElement('div');
                impact.className = 'ghost-impact';
                impact.textContent = '✨';
                impact.setAttribute('aria-hidden', 'true');
                impact.style.left = targetX + 'px';
                impact.style.top = targetY + 'px';
                field.appendChild(impact);
                window.setTimeout(() => impact.remove(), 400);
            }, 450);
        }
    }


    function spiritAttack() {
        if (!state.battle || state.enemyHp <= 0 || Date.now() < state.abilityReadyAt || state.allyBurstLeft > 0) return;
        state.abilityReadyAt = Date.now() + 1250;
        state.commandUntil = Date.now() + 700;
        state.allyBurstLeft = 3;
        state.allyBurstTimer = 0;
        state.allyShotDamage = Math.ceil((5 + Math.floor(state.spirit.power * 0.75) + Math.floor(Math.random() * 2)) / 3);
        state.spiritAttackCount++;
        $('battle-message').textContent = state.spirit.name + ' fires a three-shot spirit volley!';
    }

    function launchSpiritShot() {
        const world = $('battle-world');
        const element = document.createElement('div');
        element.className = 'ghost-projectile bullet ' + (state.spirit === spirits.cinder ? 'ember' : state.spirit === spirits.ripple ? 'tide' : 'kindling');
        element.setAttribute('aria-hidden', 'true');
        const fieldHeight = $('battle-field').getBoundingClientRect().height;
        const companionHeight = $('battle-companion').getBoundingClientRect().height;
        const startX = Math.max(2, state.battleX - 7);
        const startY = 33 + companionHeight / (2 * fieldHeight) * 100 + state.jumpHeight / fieldHeight * 100;
        const dx = state.enemyX - startX;
        const dy = state.enemyBottom + 8 - startY;
        const distance = Math.hypot(dx, dy) || 1;
        const speed = 0.8;
        element.style.left = startX + '%';
        element.style.bottom = startY + '%';
        world.appendChild(element);
        state.allyProjectiles.push({
            x: startX, y: startY,
            vx: dx / distance * speed, vy: dy / distance * speed,
            damage: state.allyShotDamage, element
        });

        if (Math.random() < 0.35) {
            state.enemyTargetX = state.enemyX < 50 ? 92 : 8;
            state.enemyTargetBottom = state.enemyBottom < 50 ? 59 : 41;
            state.enemyMoveTimer = 1.4;
            $('battle-message').textContent = state.enemyName + ' tries to dodge the spirit shot!';
        }
    }


        function specialAttack() {
        if (!state.battle || state.enemyHp <= 0 || Date.now() < state.specialReadyAt) return;
        state.specialReadyAt = Date.now() + 9000;
        state.commandUntil = Date.now() + 700;
        const damage = 20 + state.spirit.power;
        showSpiritAttack('special');
        state.enemyHp = Math.max(0, state.enemyHp - damage);
        $('battle-message').textContent = state.spirit.name + ' unleashes a special spirit burst for ' + damage + ' damage!';
        updateBattleMeters();
        updateSpecialButton();
        if (state.enemyHp === 0) winBattle('The special spirit burst defeats the ' + state.enemyName + '!');
    }


    function updateSpecialButton() {
        const button = $('special-button');
        const remaining = Math.max(0, state.specialReadyAt - Date.now());
        button.disabled = !state.battle || remaining > 0;
        button.textContent = remaining > 0
            ? '🌟 Special charging (' + Math.ceil(remaining / 1000) + 's)'
            : '🌟 Special attack (E)';
    }


    function weaponAttack() {
        if (!state.battle || state.enemyHp <= 0 || Date.now() < state.weaponReadyAt) return;

        state.weaponReadyAt = Date.now() + 650;
        state.enemyHp = Math.max(0, state.enemyHp - 6);
        $('battle-message').textContent = 'You strike with your weapon for 6 damage!';
        updateBattleMeters();
        if (state.enemyHp === 0) winBattle('You defeat the ' + state.enemyName + ' with your weapon!');
    }


    function updateBattle() {
        if (!state.battle || state.enemyHp <= 0) return;
        if (state.keys.a || state.keys.arrowleft) moveBattlePlayer(-1);
        if (state.keys.d || state.keys.arrowright) moveBattlePlayer(1);
        setCrouch(Boolean(state.keys.s || state.keys.arrowdown));
        const playerElement = $('battle-player');
        const moving = Boolean(state.keys.a || state.keys.d || state.keys.arrowleft || state.keys.arrowright);
        playerElement.classList.toggle('walking', moving && state.dashTime <= 0 && !state.crouching && state.jumpHeight === 0);
        playerElement.classList.toggle('jumping', state.jumpHeight > 0 || state.jumpVelocity > 0);
        playerElement.classList.toggle('commanding', Date.now() < state.commandUntil && !state.crouching && state.jumpHeight === 0 && state.dashTime <= 0);

        if (state.jumpHeight > 0 || state.jumpVelocity > 0) {
            state.jumpHeight = Math.max(0, state.jumpHeight + state.jumpVelocity);
            state.jumpVelocity -= .65;
            if (state.jumpHeight === 0) state.jumpVelocity = 0;
        }
        if (state.dashTime > 0) {
            state.battleX = Math.max(3, Math.min(98, state.battleX + state.facing * 1.8));
                        state.dashTime -= .05;
            if (state.dashTime <= 0) $('battle-player').classList.remove('dashing');
        }

        if (state.allyBurstLeft > 0) {
            state.allyBurstTimer -= .05;
            if (state.allyBurstTimer <= 0) {
                launchSpiritShot();
                state.allyBurstLeft--;
                state.allyBurstTimer = .22;
            }
        }

        state.enemyMoveTimer -= .05;
        if (state.enemyMoveTimer <= 0) {
            const cornerX = [8, 92];
            const cornerBottom = [41, 59];
            state.enemyTargetX = cornerX[Math.floor(Math.random() * cornerX.length)];
            state.enemyTargetBottom = cornerBottom[Math.floor(Math.random() * cornerBottom.length)];
            state.enemyMoveTimer = 1.3 + Math.random() * 1.2;
        }
                state.enemyX += (state.enemyTargetX - state.enemyX) * .022;
        state.enemyBottom += (state.enemyTargetBottom - state.enemyBottom) * .022;
        renderBattleActors();


        state.attackTimer -= .05;
        if (state.attackPhase === 'idle' && state.attackTimer <= 0) {
            state.attackPhase = 'telegraph';
            state.attackTimer = .75;
            const warning = $('attack-warning');
                        warning.style.left = Math.max(0, Math.min(86, state.battleX - 7)) + '%';
            warning.style.right = 'auto';
            warning.style.width = '14%';
            warning.classList.add('active');
            $('battle-message').textContent = state.enemyName + ' charges a power ' + state.enemyPower + ' ' + state.enemyAttack + '—move, jump, crouch, or dash!';
        } else if (state.attackPhase === 'telegraph' && state.attackTimer <= 0) {
            $('attack-warning').classList.remove('active');
            state.attackPhase = 'projectile';
            state.burstShotsLeft = 3;
            state.burstTimer = 0;
            $('battle-message').textContent = state.enemyName + ' fires a burst of ' + state.enemyAttack + 's!';
        } else if (state.attackPhase === 'projectile') {
            state.burstTimer -= .05;
            if (state.burstShotsLeft > 0 && state.burstTimer <= 0) {
                const projectileElement = document.createElement('div');
                projectileElement.className = 'enemy-projectile';
                projectileElement.textContent = state.enemyShot;
                                $('battle-world').appendChild(projectileElement);

                                const fieldHeight = $('battle-field').getBoundingClientRect().height;
                const startX = state.enemyX + 2;
                const startY = state.enemyBottom + 8;
                const targetX = state.battleX;
                const playerHeight = $('battle-player').getBoundingClientRect().height;
                const targetY = 34 + playerHeight / (2 * fieldHeight) * 100 + state.jumpHeight / fieldHeight * 100;
                const dx = targetX - startX;
                const dy = targetY - startY;
                const distance = Math.hypot(dx, dy) || 1;
                const speed = 1.7;
                state.projectiles.push({
                    x: startX,
                    y: startY,
                    vx: dx / distance * speed,
                    vy: dy / distance * speed,
                    damage: Math.max(2, Math.round(state.enemyPower * .5)),
                    canHitPlayer: true,
                    element: projectileElement
                });
                state.burstShotsLeft--;
                state.burstTimer = .28;
            }
            if (state.burstShotsLeft === 0 && state.burstTimer <= 0) {
                state.attackPhase = 'recover';
                state.attackTimer = 1.25;
            }
        } else if (state.attackPhase === 'recover' && state.attackTimer <= 0) {
            state.attackPhase = 'idle';
            state.attackTimer = 1.2;
        }


        state.allyProjectiles = state.allyProjectiles.filter(projectile => {
            projectile.x += projectile.vx;
            projectile.y += projectile.vy;
            projectile.element.style.left = projectile.x + '%';
            projectile.element.style.bottom = projectile.y + '%';
            if (projectile.x < 0 || projectile.x > 300 || projectile.y < 0 || projectile.y > 100) {
                projectile.element.remove();
                return false;
            }
            const hitEnemy = Math.abs(projectile.x - state.enemyX) < 2.2 && Math.abs(projectile.y - (state.enemyBottom + 8)) < 5;
            if (hitEnemy) {
                projectile.element.remove();
                state.enemyHp = Math.max(0, state.enemyHp - projectile.damage);
                updateBattleMeters();
                if (state.enemyHp === 0) winBattle('Your companion\'s spirit volley defeats the ' + state.enemyName + '!');
                return false;
            }
            return true;
        });

                state.projectiles = state.projectiles.filter(projectile => {
            projectile.x += projectile.vx;
            projectile.y += projectile.vy;
            projectile.element.style.left = projectile.x + '%';
            projectile.element.style.bottom = projectile.y + '%';
            if (projectile.x < -5 || projectile.x > 105 || projectile.y < -10 || projectile.y > 110) {
                projectile.element.remove();
                return false;
            }
            const field = $('battle-field');
            const fieldHeight = field.getBoundingClientRect().height;
            const playerHeight = $('battle-player').getBoundingClientRect().height;
            const playerCenterX = state.battleX + 23 / (field.clientWidth * 3) * 100;
            const playerCenterY = 34 + playerHeight / (2 * fieldHeight) * 100 + state.jumpHeight / fieldHeight * 100;
            const nearPlayer = Math.abs(projectile.x - playerCenterX) < 1.5 && Math.abs(projectile.y - playerCenterY) < 2.5;
            if (!nearPlayer) projectile.canHitPlayer = true;
            if (nearPlayer && projectile.canHitPlayer) {
                state.hp = Math.max(0, state.hp - projectile.damage);
                    projectile.element.remove();
                    $('battle-message').textContent = 'A ' + state.enemyName + ' projectile hits for ' + projectile.damage + ' damage!';
                    updateStats();
                    if (state.hp === 0) {
                        state.hp = 10;
                        $('battle-message').textContent = 'Your companion helps you recover and drives the spirit away.';
                        updateStats();
                        finishBattleAfterDelay();
                    }
                    return false;
            }
            return true;
        });
                updateBattleMeters();
        updateSpecialButton();
    }


    function attemptCapture() {
        if (!state.battle || state.enemyHp <= 0) return;
        if (state.enemyHp <= 10) {
            state.captured = true;
            state.enemyHp = 0;
            updateBattleMeters();
            winBattle('The ' + state.enemyName + ' accepts your invitation and joins your collection!');
        } else {
            $('battle-message').textContent = 'The ' + state.enemyName + ' is still wary. Weaken it more, and keep dodging its attacks.';
        }
    }


        function winBattle(message) {
        state.battle = false;
        if (state.battleLoop) clearInterval(state.battleLoop);
        const defeatedWild = state.currentWild;
        state.currentWild = null;
        if (defeatedWild) {
            defeatedWild.element.classList.add('hidden');
            if (!state.captured) {
                window.clearTimeout(defeatedWild.respawnTimer);
                defeatedWild.respawnTimer = window.setTimeout(() => {
                    defeatedWild.x = 12 + Math.random() * 76;
                    defeatedWild.y = 18 + Math.random() * 66;
                    defeatedWild.element.style.left = defeatedWild.x + '%';
                    defeatedWild.element.style.top = defeatedWild.y + '%';
                    defeatedWild.element.classList.remove('hidden');
                    defeatedWild.respawnTimer = null;
                }, 10000);
            }
        }

        state.projectiles.forEach(projectile => projectile.element.remove());
        state.allyProjectiles.forEach(projectile => projectile.element.remove());
        state.projectiles = [];
        state.allyProjectiles = [];
        state.allyBurstLeft = 0;
        $('enemy-projectile').classList.add('hidden');
        $('attack-warning').classList.remove('active');
        state.bond = Math.min(100, state.bond + 10);
        $('battle-message').textContent = message + ' Your bond grows from the adventure.';
        $('battle-actions').classList.add('hidden');
        $('battle-end-actions').classList.remove('hidden');
        updateStats();
        checkEvolution();
        
        if (state.captured) $('dex-count').textContent = '2 / 20 spirits';
    }


    function finishBattleAfterDelay() {
        state.battle = false;
        if (state.battleLoop) clearInterval(state.battleLoop);
        state.projectiles.forEach(projectile => projectile.element.remove());
        state.allyProjectiles.forEach(projectile => projectile.element.remove());
        state.projectiles = [];
        state.allyProjectiles = [];
        state.allyBurstLeft = 0;
        $('enemy-projectile').classList.add('hidden');
        $('attack-warning').classList.remove('active');
        $('battle-actions').classList.add('hidden');
        $('battle-end-actions').classList.remove('hidden');
        updateBattleMeters();
    }


    function finishBattle() {
        state.battle = false;
        if (state.battleLoop) clearInterval(state.battleLoop);
        state.projectiles.forEach(projectile => projectile.element.remove());
        state.allyProjectiles.forEach(projectile => projectile.element.remove());
        state.projectiles = [];
        state.allyProjectiles = [];
        state.allyBurstLeft = 0;
        $('enemy-projectile').classList.add('hidden');
        $('attack-warning').classList.remove('active');
        $('battle-overlay').classList.add('hidden');
        $('mode-badge').textContent = 'SAFE PLACE';
        updateStats();
    }


    function updateBattleMeters() {
        $('ally-battle-hp').style.width = (state.hp / state.maxHp * 100) + '%';
        $('enemy-battle-hp').style.width = (state.enemyHp / state.enemyMaxHp * 100) + '%';
    }


        function showGameMessage(message) {
        const toast = $('room-overlay').classList.contains('hidden') ? $('game-toast') : $('room-toast');
        toast.textContent = message;
        toast.classList.remove('hidden');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.add('hidden'), 3500);
    }

});
