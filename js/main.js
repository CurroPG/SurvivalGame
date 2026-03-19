        'use strict';

        // ── Partículas decorativas ────────────────────────────────────────────────────
        (function () {
            const container = document.getElementById('particles');
            const colors = ['#6366f1', '#22c55e', '#ef4444', '#818cf8'];
            for (let i = 0; i < 30; i++) {
                const p = document.createElement('div');
                p.className = 'particle';
                const sz = Math.random() * 5 + 3;
                p.style.cssText = `
            width:${sz}px;height:${sz}px;
            left:${Math.random() * 100}%;
            background:${colors[Math.floor(Math.random() * colors.length)]};
            animation-duration:${8 + Math.random() * 14}s;
            animation-delay:${Math.random() * 10}s;
        `;
                container.appendChild(p);
            }
        })();

        // ── Navegación entre pantallas ────────────────────────────────────────────────
        const screens = {
            menu: document.getElementById('menu'),
            config: document.getElementById('config'),
            game: document.getElementById('game'),
            info: document.getElementById('info'),
            shop: document.getElementById('shop'),
        };

        function showScreen(name, direction = 'right') {
            const inClass = direction === 'right' ? 'slide-right' : 'slide-left';
            Object.entries(screens).forEach(([k, s]) => {
                if (k === name) {
                    s.classList.remove('hidden', inClass);
                } else {
                    s.classList.add('hidden');
                }
            });
            if (name === 'info') arcadeStart();
            else arcadeStop();
        }

        document.getElementById('btn-goto-config').addEventListener('click', () => showScreen('config'));
        document.getElementById('btn-goto-shop').addEventListener('click', () => { showScreen('shop'); updateShopUI(); });
        document.getElementById('btn-config-back').addEventListener('click', () => showScreen('menu', 'left'));
        document.getElementById('btn-info-back').addEventListener('click', () => { arcadeStop(); showScreen('shop', 'left'); });
        document.getElementById('btn-game-back').addEventListener('click', () => { stopGame(); showScreen('menu', 'left'); });
        document.getElementById('btn-shop-back').addEventListener('click', () => showScreen('menu', 'left'));
        document.getElementById('btn-start-arcade').addEventListener('click', () => showScreen('info'));

        // ── Sliders de configuración ──────────────────────────────────────────────────
        function bindSlider(sliderId, valueId) {
            const sl = document.getElementById(sliderId);
            const vl = document.getElementById(valueId);
            function update() {
                const pct = (sl.value - sl.min) / (sl.max - sl.min) * 100;
                sl.style.setProperty('--pct', pct + '%');
                vl.textContent = sl.value;
            }
            sl.addEventListener('input', update);
            update();
        }
        bindSlider('sl-buenos', 'val-buenos');
        bindSlider('sl-malos', 'val-malos');
        bindSlider('sl-obs', 'val-obs');

        document.getElementById('btn-start').addEventListener('click', () => {
            const cfg = {
                buenos: +document.getElementById('sl-buenos').value,
                malos: +document.getElementById('sl-malos').value,
                obstaculos: +document.getElementById('sl-obs').value,
            };
            showScreen('game');
            startGame(cfg);
        });

        document.getElementById('btn-restart').addEventListener('click', () => {
            const cfg = {
                buenos: +document.getElementById('sl-buenos').value,
                malos: +document.getElementById('sl-malos').value,
                obstaculos: +document.getElementById('sl-obs').value,
            };
            startGame(cfg);
        });

        // ── Pausa ─────────────────────────────────────────────────────────────────────
        let pausado = false;
        const btnPause = document.getElementById('btn-pause');
        btnPause.addEventListener('click', () => {
            pausado = !pausado;
            btnPause.textContent = pausado ? '▶' : '⏸';
        });

        // ══════════════════════════════════════════════════════════════════════════════
        // LÓGICA DEL JUEGO
        // ══════════════════════════════════════════════════════════════════════════════

        // ── Posicion ──────────────────────────────────────────────────────────────────
        class Posicion {
            constructor(x, y) { this._x = x; this._y = y; }
            getX() { return this._x; } setX(x) { this._x = x; }
            getY() { return this._y; } setY(y) { this._y = y; }
            static calcularDistancia(p1, p2) {
                return Math.sqrt((p1._x - p2._x) ** 2 + (p1._y - p2._y) ** 2);
            }
        }

        // ── Estrategias ───────────────────────────────────────────────────────────────
        const DX = [-1, 0, 1, -1, 1, -1, 0, 1];
        const DY = [-1, -1, -1, 0, 0, 1, 1, 1];

        class Huir {
            mover(actual, objetivo, mapa) {
                let best = 0, vx = 0, vy = 0;
                for (let i = 0; i < 8; i++) {
                    const nx = actual._x + DX[i], ny = actual._y + DY[i];
                    if (nx >= 0 && nx < mapa[0].length && ny >= 0 && ny < mapa.length) {
                        const c = mapa[ny][nx];
                        if (c === null || (!c.esObstaculo() && !c.esBueno())) {
                            const d = Posicion.calcularDistancia(new Posicion(nx, ny), objetivo);
                            if (d > best) { best = d; vx = DX[i]; vy = DY[i]; }
                        }
                    }
                }
                return new Posicion(actual._x + vx, actual._y + vy);
            }
        }

        class Perseguir {
            mover(actual, objetivo, mapa) {
                let best = Infinity, vx = 0, vy = 0;
                for (let i = 0; i < 8; i++) {
                    const nx = actual._x + DX[i], ny = actual._y + DY[i];
                    if (nx >= 0 && nx < mapa[0].length && ny >= 0 && ny < mapa.length) {
                        const c = mapa[ny][nx];
                        if (c === null || (!c.esObstaculo() && !c.esMalo())) {
                            const d = Posicion.calcularDistancia(new Posicion(nx, ny), objetivo);
                            if (d < best) { best = d; vx = DX[i]; vy = DY[i]; }
                        }
                    }
                }
                return new Posicion(actual._x + vx, actual._y + vy);
            }
        }

        // ── Elementos ─────────────────────────────────────────────────────────────────
        class Elementos {
            constructor(x, y, mov) { this.posi = new Posicion(x, y); this.objetivo = null; this._mov = mov; }
            getPosiX() { return this.posi._x; }
            getPosiY() { return this.posi._y; }
            getPosi() { return this.posi; }
            setObjetivo(o) { this.objetivo = o; }
            esObstaculo() { return false; } esMalo() { return false; } esBueno() { return false; }
            mover(mapa) {
                if (this.objetivo !== null)
                    this.posi = this._mov.mover(this.posi, this.objetivo.posi, mapa);
            }
        }
        class Buenos extends Elementos { constructor(x, y) { super(x, y, new Huir()); } esBueno() { return true; } }
        class Malos extends Elementos { constructor(x, y) { super(x, y, new Perseguir()); } esMalo() { return true; } }
        class Obstaculos extends Elementos { constructor(x, y) { super(x, y, null); } esObstaculo() { return true; } }

        // ── Mapa ──────────────────────────────────────────────────────────────────────
        class Mapa {
            constructor(alto, ancho) {
                this.alto = alto; this.ancho = ancho;
                this.grid = Array.from({ length: alto }, () => Array(ancho).fill(null));
                this.buenos = []; this.malos = [];
            }
            _rnd(max) { return Math.floor(Math.random() * max); }
            _freePos() {
                let x, y;
                do { x = this._rnd(this.ancho); y = this._rnd(this.alto); }
                while (this.grid[y][x] !== null);
                return { x, y };
            }
            _place(elem) {
                const { x, y } = this._freePos();
                elem.posi._x = x; elem.posi._y = y;
                this.grid[y][x] = elem;
            }
            generarConConfig(numBuenos, numMalos, numObs) {
                const maxElem = this.alto * this.ancho - 1;
                numObs = Math.min(numObs, Math.floor(maxElem * 0.4));
                numBuenos = Math.min(numBuenos, Math.floor((maxElem - numObs) * 0.6));
                numMalos = Math.min(numMalos, maxElem - numObs - numBuenos);

                for (let i = 0; i < numObs; i++)   this._place(new Obstaculos(0, 0));
                for (let i = 0; i < numBuenos; i++) { const b = new Buenos(0, 0); this.buenos.push(b); this._place(b); }
                for (let i = 0; i < numMalos; i++) { const m = new Malos(0, 0); this.malos.push(m); this._place(m); }
            }
            _nearMalo(b) {
                let c = null, mn = Infinity;
                for (const m of this.malos) { const d = Posicion.calcularDistancia(m.posi, b.posi); if (d < mn) { mn = d; c = m; } }
                return c;
            }
            _nearBueno(m) {
                let c = null, mn = Infinity;
                for (const b of this.buenos) { const d = Posicion.calcularDistancia(m.posi, b.posi); if (d < mn) { mn = d; c = b; } }
                return c;
            }
            refrescar() {
                for (const b of this.buenos) { b.setObjetivo(this._nearMalo(b)); this.grid[b.getPosiY()][b.getPosiX()] = null; }
                for (const m of this.malos) { m.setObjetivo(this._nearBueno(m)); this.grid[m.getPosiY()][m.getPosiX()] = null; }
                for (const b of this.buenos) { b.mover(this.grid); this.grid[b.getPosiY()][b.getPosiX()] = b; }
                for (const m of this.malos) { m.mover(this.grid); this.grid[m.getPosiY()][m.getPosiX()] = m; }
                this.buenos = this.buenos.filter(b =>
                    !this.malos.some(m => m.getPosiX() === b.getPosiX() && m.getPosiY() === b.getPosiY())
                );
            }
        }

        // ── Canvas & Loop ─────────────────────────────────────────────────────────────
        const CELL = 10, ALTO = 60, ANCHO = 100, FPS_MS = 50;
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = ANCHO * CELL; canvas.height = ALTO * CELL;

        const elB = document.getElementById('stat-buenos');
        const elM = document.getElementById('stat-malos');
        const elO = document.getElementById('stat-obs');
        const elT = document.getElementById('stat-tick');

        let mapa, timer, tick = 0, numObsCfg = 0;

        function startGame(cfg) {
            stopGame();
            pausado = false; btnPause.textContent = '⏸';
            mapa = new Mapa(ALTO, ANCHO);
            mapa.generarConConfig(cfg.buenos, cfg.malos, cfg.obstaculos);
            numObsCfg = cfg.obstaculos;
            tick = 0;
            timer = setInterval(gameLoop, FPS_MS);
        }

        function stopGame() {
            if (timer) { clearInterval(timer); timer = null; }
        }

        function gameLoop() {
            if (pausado) return;
            mapa.refrescar();
            tick++;
            render();
            elB.textContent = mapa.buenos.length;
            elM.textContent = mapa.malos.length;
            elO.textContent = numObsCfg;
            elT.textContent = tick;
            if (mapa.buenos.length === 0) { stopGame(); gameOver(); }
        }

        function render() {
            ctx.fillStyle = '#080c14'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#111827'; ctx.lineWidth = .3;
            for (let i = 0; i <= ALTO; i++) { ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(canvas.width, i * CELL); ctx.stroke(); }
            for (let j = 0; j <= ANCHO; j++) { ctx.beginPath(); ctx.moveTo(j * CELL, 0); ctx.lineTo(j * CELL, canvas.height); ctx.stroke(); }

            for (let i = 0; i < ALTO; i++) {
                for (let j = 0; j < ANCHO; j++) {
                    const e = mapa.grid[i][j]; if (!e) continue;
                    const cx = j * CELL + CELL / 2, cy = i * CELL + CELL / 2, r = CELL / 2 - 1;
                    if (e.esObstaculo()) {
                        ctx.fillStyle = '#374151';
                        ctx.fillRect(j * CELL + 1, i * CELL + 1, CELL - 2, CELL - 2);
                        continue;
                    }
                    const col = e.esBueno() ? '#22c55e' : '#ef4444';
                    ctx.shadowColor = col; ctx.shadowBlur = 7;
                    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.arc(cx - 1, cy - 1, r * .38, 0, Math.PI * 2); ctx.fill();
                }
            }
        }

        function gameOver() {
            ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.shadowBlur = 24; ctx.shadowColor = '#ef4444';
            ctx.fillStyle = '#ef4444';
            ctx.font = `bold ${CELL * 3.2}px Inter,sans-serif`; ctx.textAlign = 'center';
            ctx.fillText('¡Los malos ganaron!', canvas.width / 2, canvas.height / 2 - CELL * 1.5);
            ctx.shadowBlur = 0; ctx.fillStyle = '#94a3b8';
            ctx.font = `${CELL * 1.3}px Inter,sans-serif`;
            ctx.fillText(`Supervivieron ${tick} ticks`, canvas.width / 2, canvas.height / 2 + CELL * 2);
            ctx.fillText('Pulsa 🔄 para reiniciar', canvas.width / 2, canvas.height / 2 + CELL * 4);
        }

        // ── Meta Progresión ────────────────────────────────────────────────────────
        const META_UPGRADES = [
            { id: 'hp', icon: '❤️', name: 'Vitalidad', desc: '+20 HP Máx', levels: 6, basePrice: 100, mult: 1.8 },
            { id: 'dmg', icon: '💥', name: 'Fuerza', desc: '+5 Daño Base', levels: 6, basePrice: 150, mult: 2.0 },
            { id: 'spd', icon: '⚡', name: 'Rapidez', desc: '+8% Vel. Base', levels: 6, basePrice: 200, mult: 2.2 },
            { id: 'mag', icon: '🧲', name: 'Atracción', desc: '+30 Rango Imán', levels: 6, basePrice: 120, mult: 1.7 },
        ];

        let meta = {
            money: 0,
            upgrades: { hp: 0, dmg: 0, spd: 0, mag: 0 }
        };

        function loadMeta() {
            const saved = localStorage.getItem('survival_meta');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    meta = { ...meta, ...parsed };
                } catch (e) { console.error("Error cargando meta", e); }
            }
        }
        function saveMeta() {
            localStorage.setItem('survival_meta', JSON.stringify(meta));
        }

        function updateShopUI() {
            const container = document.getElementById('upgrades-container');
            const elMoney = document.getElementById('shop-money');
            elMoney.textContent = meta.money;

            container.innerHTML = '';
            META_UPGRADES.forEach(up => {
                const lvl = meta.upgrades[up.id];
                const price = Math.floor(up.basePrice * Math.pow(up.mult, lvl));
                const isMax = lvl >= up.levels;

                const card = document.createElement('div');
                card.className = 'up-card';
                card.innerHTML = `
                    <div class="up-header">
                        <div class="up-icon">${up.icon}</div>
                        <div class="up-title">
                            <h3>${up.name}</h3>
                            <p>${up.desc}</p>
                        </div>
                    </div>
                    <div class="up-level">
                        ${Array.from({ length: up.levels }).map((_, i) => `<div class="lvl-dot ${i < lvl ? 'active' : ''}"></div>`).join('')}
                    </div>
                    <div class="up-buy">
                        <span class="price">${isMax ? 'MÁXIMO' : `💰 ${price}`}</span>
                        <button class="btn-buy" ${isMax || meta.money < price ? 'disabled' : ''}>
                            ${isMax ? 'COMPRADO' : 'MEJORAR'}
                        </button>
                    </div>
                `;
                const btn = card.querySelector('.btn-buy');
                if (btn) btn.onclick = () => buyUpgrade(up.id, price);
                container.appendChild(card);
            });

            // Actualizar stats visuales
            document.getElementById('stat-hp').textContent = 100 + (meta.upgrades.hp * 20);
            document.getElementById('stat-dmg').textContent = 10 + (meta.upgrades.dmg * 5);
            document.getElementById('stat-spd').textContent = (1.0 + (meta.upgrades.spd * 0.08)).toFixed(2) + 'x';
            document.getElementById('stat-mag').textContent = 120 + (meta.upgrades.mag * 30);
        }

        function buyUpgrade(id, price) {
            if (meta.money >= price) {
                meta.money -= price;
                meta.upgrades[id]++;
                saveMeta();
                updateShopUI();
                if (window.Sfx) window.Sfx.play('gem');
            }
        }

        loadMeta();

        // Canvas de previsualización en la tienda
        const previewCanvas = document.getElementById('charPreview');
        const pCtx = previewCanvas.getContext('2d');
        let preAngle = 0;

        function renderPreview() {
            const shopScreen = document.getElementById('shop');
            if (shopScreen.classList.contains('hidden')) {
                requestAnimationFrame(renderPreview);
                return;
            }
            previewCanvas.width = 250; previewCanvas.height = 250;
            const cx = 125, cy = 125;
            pCtx.clearRect(0, 0, 250, 250);

            preAngle += 0.02;
            const float = Math.sin(preAngle * 2) * 5;

            pCtx.shadowBlur = 20; pCtx.shadowColor = '#22c55e';
            pCtx.fillStyle = '#22c55e';
            pCtx.beginPath(); pCtx.arc(cx, cy + float, 30, 0, Math.PI * 2); pCtx.fill();
            pCtx.shadowBlur = 0;
            pCtx.fillStyle = '#fff';
            pCtx.beginPath(); pCtx.arc(cx + 12, cy + float - 4, 8, 0, Math.PI * 2); pCtx.fill();
            pCtx.fillStyle = '#000';
            pCtx.beginPath(); pCtx.arc(cx + 15, cy + float - 4, 3, 0, Math.PI * 2); pCtx.fill();

            requestAnimationFrame(renderPreview);
        }
        renderPreview();

        // ══════════════════════════════════════════════════════════════════════════════
        // MINI-JUEGO ARCADE – pantalla "Cómo funciona"
        // ══════════════════════════════════════════════════════════════════════════════
        (function () {

            const arcCanvas = document.getElementById('arcadeCanvas');
            const arcCtx = arcCanvas.getContext('2d');

            // ── Tamaños dinámicos ─────────────────────────────────────────────────────────
            function resizeArcCanvas() {
                const infoEl = document.getElementById('info');
                const header = infoEl.querySelector('.info-header');
                const hint = infoEl.querySelector('.controls-hint');
                const hh = header ? header.offsetHeight : 60;
                const ch = hint ? hint.offsetHeight : 28;
                arcCanvas.width = window.innerWidth;
                arcCanvas.height = Math.max(window.innerHeight - hh - ch, 300);
            }

            // ── Estado del juego ──────────────────────────────────────────────────────────
            const PLAYER_RADIUS = 18;
            const ENEMY_RADIUS = 14;
            const BULLET_RADIUS = 6;
            const PLAYER_SPEED = 3.0; // Aumentada velocidad base
            const BULLET_SPEED = 9;
            const ENEMY_BASE_SPEED = 1.0;
            const PLAYER_MAX_HP = 100;
            const ENEMY_MAX_HP = 30;
            const DAMAGE_PER_HIT = 20;

            const POWERUPS = [
                { id: 'dmg', icon: '💥', title: 'Munición Pesada', desc: '+15 Daño por bala', apply: () => player.damage += 15 },
                { id: 'spd', icon: '⚡', title: 'Agilidad', desc: '+25% Velocidad de mov.', apply: () => player.speedMult += 0.25 },
                { id: 'fire', icon: '🔥', title: 'Fuego Rápido', desc: 'Dispara un 30% más rápido', apply: () => player.fireRateMult *= 0.7 },
                { id: 'hp', icon: '❤️', title: 'Vitalidad', desc: '+50 Vida Máx y curación total', apply: () => { player.maxHp += 50; player.hp = player.maxHp; } },
                { id: 'multi', icon: '🔫', title: 'Multidisparo', desc: 'Dispara una bala extra a la vez', apply: () => player.multiShot += 1 },
                { id: 'pierce', icon: '👻', title: 'Perforación', desc: 'Las balas atraviesan +1 enemigo', apply: () => player.pierce += 1 },
                { id: 'vamp', icon: '🧛', title: 'Vampirismo', desc: 'Cura 2 HP por cada enemigo', apply: () => player.vampirism += 2 },
                { id: 'magnet', icon: '🧲', title: 'Magnetismo', desc: 'Atrae la Experiencia desde más lejos', apply: () => player.magnetRadius += 80 },
                { id: 'tank', icon: '🛡️', title: 'Piel de Piedra', desc: 'Ganas +25 Vida Máx y tus balas hacen +10 Daño', apply: () => { player.maxHp += 25; player.hp += 25; player.damage += 10; } },
                { id: 'exp', icon: '🧠', title: 'Sabiduría', desc: 'Los enemigos sueltan un 50% más de Experiencia', apply: () => player.xpMult += 0.5 },
            ];

            // ── Web Audio API (Sfx) ───────────────────────────────────────────────────────
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const Sfx = {
                play: function (type) {
                    if (audioCtx.state === 'suspended') audioCtx.resume();
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    const now = audioCtx.currentTime;

                    switch (type) {
                        case 'shoot':
                            osc.type = 'square';
                            osc.frequency.setValueAtTime(300, now);
                            osc.frequency.exponentialRampToValueAtTime(10, now + 0.1);
                            gain.gain.setValueAtTime(0.05, now);
                            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                            osc.start(now); osc.stop(now + 0.1);
                            break;
                        case 'hit':
                            osc.type = 'sawtooth';
                            osc.frequency.setValueAtTime(150, now);
                            osc.frequency.linearRampToValueAtTime(50, now + 0.05);
                            gain.gain.setValueAtTime(0.08, now);
                            gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
                            osc.start(now); osc.stop(now + 0.05);
                            break;
                        case 'hurt':
                            osc.type = 'square';
                            osc.frequency.setValueAtTime(100, now);
                            osc.frequency.linearRampToValueAtTime(30, now + 0.3);
                            gain.gain.setValueAtTime(0.15, now);
                            gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
                            osc.start(now); osc.stop(now + 0.3);
                            break;
                        case 'gem':
                            osc.type = 'sine';
                            osc.frequency.setValueAtTime(800, now);
                            osc.frequency.linearRampToValueAtTime(1200, now + 0.08);
                            gain.gain.setValueAtTime(0.05, now);
                            gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
                            osc.start(now); osc.stop(now + 0.08);
                            break;
                        case 'levelup':
                            osc.type = 'square';
                            osc.frequency.setValueAtTime(400, now);
                            osc.frequency.setValueAtTime(600, now + 0.1);
                            osc.frequency.setValueAtTime(800, now + 0.2);
                            gain.gain.setValueAtTime(0.1, now);
                            gain.gain.linearRampToValueAtTime(0.001, now + 0.5);
                            osc.start(now); osc.stop(now + 0.5);
                            break;
                        case 'death':
                            osc.type = 'sawtooth';
                            osc.frequency.setValueAtTime(100, now);
                            osc.frequency.exponentialRampToValueAtTime(10, now + 1.5);
                            gain.gain.setValueAtTime(0.2, now);
                            gain.gain.linearRampToValueAtTime(0.001, now + 1.5);
                            osc.start(now); osc.stop(now + 1.5);
                            break;
                    }
                }
            };

            let arcState; // 'playing' | 'dead' | 'waveclear' | 'stopped' | 'levelup'
            let player, bullets, enemyBullets, enemies, xpGems, particles, wave, score;
            let superBossWarning = 0;
            let isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
            let joystick = { active: false, id: null, originX: 0, originY: 0, x: 0, y: 0, curX: 0, curY: 0 };
            let keys = {};
            let mouseX = 0, mouseY = 0;
            let arcRAF = null;
            let lastTime = 0;
            let waveDelay = 0;
            let flashAlpha = 0;
            let level = 1, xp = 0, maxXp = 100;
            let camera = { x: 0, y: 0 }; // Cámara para mapa infinito

            // HUD elements
            const elPlayerBar = document.getElementById('arc-player-bar');
            const elLevel = document.getElementById('arc-level');
            const elXpBar = document.getElementById('arc-xp-bar');
            const elWave = document.getElementById('arc-wave');
            const elScore = document.getElementById('arc-score');
            const elLvlOverlay = document.getElementById('arc-levelup-overlay');
            const elLvlDisplay = document.getElementById('arc-lvl-display');
            const elPwrUpCont = document.getElementById('powerup-container');

            // ── Drop XP & LevelUp ──────────────────────────────────────────────────────────
            function dropXp(x, y, amount) {
                xpGems.push({ x, y, amount, life: 12000 });
            }
            function addXp(amount) {
                xp += amount;
                Sfx.play('gem');
                if (xp >= maxXp) {
                    xp -= maxXp;
                    level++;
                    maxXp = Math.floor(maxXp * 1.8); // Curva de nivel mucho más exigente
                    triggerLevelUp();
                }
            }
            function triggerLevelUp() {
                Sfx.play('levelup');
                arcState = 'levelup';
                elLvlDisplay.textContent = level;
                elLvlOverlay.classList.remove('hidden');
                elPwrUpCont.innerHTML = '';

                // Pick 3 random powerups
                const shuffled = [...POWERUPS].sort(() => 0.5 - Math.random());
                const choices = shuffled.slice(0, 3);
                choices.forEach(p => {
                    const div = document.createElement('div');
                    div.className = 'powerup-card';
                    div.innerHTML = `<span class="icon">${p.icon}</span><h3>${p.title}</h3><p>${p.desc}</p>`;
                    div.onclick = () => {
                        p.apply();
                        elLvlOverlay.classList.add('hidden');
                        arcState = 'playing';
                        updateHUD();
                        // Añadir inmunidad de 2 segundos al subir de nivel para evitar morir instantáneamente
                        player.invincible = 2000;
                    };
                    elPwrUpCont.appendChild(div);
                });
            }

            // ── Partículas visuales ───────────────────────────────────────────────────────
            function makeParticle(x, y, color) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 4;
                return {
                    x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                    life: 1, decay: 0.04 + Math.random() * 0.04, r: 2 + Math.random() * 4, color
                };
            }

            // ── Inicialización ────────────────────────────────────────────────────────────
            function arcadeInit() {
                resizeArcCanvas();
                const bonusHp = meta.upgrades.hp * 20;
                const bonusDmg = meta.upgrades.dmg * 5;
                const bonusSpd = meta.upgrades.spd * 0.08;
                const bonusMag = meta.upgrades.mag * 30;

                player = {
                    x: arcCanvas.width / 2, y: arcCanvas.height / 2,
                    hp: PLAYER_MAX_HP + bonusHp, maxHp: PLAYER_MAX_HP + bonusHp, invincible: 0, angle: 0,
                    damage: 10 + bonusDmg, speedMult: 1.0 + bonusSpd, multiShot: 0, pierce: 0, vampirism: 0,
                    shootCooldown: 0, fireRateMult: 1.0, magnetRadius: 120 + bonusMag, xpMult: 1.0
                };
                bullets = [];
                enemyBullets = [];
                enemies = [];
                xpGems = [];
                particles = [];
                wave = 1;
                score = 0;
                level = 1; xp = 0; maxXp = 100;
                arcState = 'playing';
                waveDelay = 0; flashAlpha = 0; superBossWarning = 0;
                camera = { x: 0, y: 0 };
                elLvlOverlay.classList.add('hidden');
                spawnWave(wave);
                updateHUD();
            }

            function spawnWave(w) {
                // Escalado de dificultad mayor
                let count = 4 + Math.floor(w * 2.5);
                const isLargeMap = (w > 15);
                let hasSuperBoss = (w % 15 === 0);
                let hasBoss = (!hasSuperBoss && w % 10 === 0);
                let hasMiniBoss = (!hasSuperBoss && !hasBoss && w % 5 === 0);

                let hasElite = (!hasSuperBoss && !hasBoss && !hasMiniBoss && w % 3 === 0 && w > 1);

                if (hasSuperBoss) { count = Math.max(1, Math.floor(count * 0.2)); superBossWarning = 3000; }
                else if (hasBoss) count = Math.max(2, Math.floor(count * 0.4));

                // Desoves especiales dependientes de subtipos aleatorios (comportamientos únicos)
                if (hasSuperBoss) {
                    let st = Math.random() > 0.5 ? 'bullet_hell' : 'berserker';
                    let sx = (w > 15) ? (camera.x + arcCanvas.width / 2) : (arcCanvas.width / 2);
                    let sy = (w > 15) ? (camera.y + 50) : 50;
                    enemies.push({
                        id: Math.random(),
                        x: sx, y: sy,
                        hp: ENEMY_MAX_HP * 45 + w * 80, maxHp: ENEMY_MAX_HP * 45 + w * 80,
                        speed: ENEMY_BASE_SPEED * 1.4 + w * 0.025, angle: 0,
                        type: 'superboss', subType: st, r: 65, dmg: 65, xpDrop: 3500, color: '#f43f5e',
                        cooldown: 0, phaseTimer: 0, dash: 0
                    });
                } else if (hasBoss) {
                    let st = Math.random() > 0.5 ? 'summoner' : 'spread_shooter';
                    let sx = (w > 15) ? (camera.x + arcCanvas.width / 2) : (arcCanvas.width / 2);
                    let sy = (w > 15) ? (camera.y + 50) : 50;
                    enemies.push({
                        id: Math.random(),
                        x: sx || 400, y: sy || 50,
                        hp: ENEMY_MAX_HP * 25 + w * 50, maxHp: ENEMY_MAX_HP * 25 + w * 50,
                        speed: ENEMY_BASE_SPEED * 1.25 + w * 0.025, angle: 0,
                        type: 'boss', subType: st, r: 40, dmg: 50, xpDrop: 2000, color: '#a855f7',
                        cooldown: 0, phaseTimer: 0, dash: 0
                    });
                } else if (hasMiniBoss) {
                    let st = Math.random() > 0.5 ? 'charger' : 'twin_shooter';
                    enemies.push({
                        id: Math.random(),
                        x: Math.random() > 0.5 ? 40 : arcCanvas.width - 40, y: arcCanvas.height / 2,
                        hp: ENEMY_MAX_HP * 10 + w * 30, maxHp: ENEMY_MAX_HP * 10 + w * 30,
                        speed: ENEMY_BASE_SPEED * 1.2 + w * 0.03, angle: 0,
                        type: 'miniboss', subType: st, r: 30, dmg: 40, xpDrop: 800, color: '#eab308',
                        cooldown: 0, phaseTimer: 0, dash: 0
                    });
                } else if (hasElite) {
                    let et = Math.floor(Math.random() * 3);
                    if (et === 0) {
                        enemies.push({
                            id: Math.random(), x: Math.random() > 0.5 ? 40 : arcCanvas.width - 40, y: arcCanvas.height / 2,
                            hp: ENEMY_MAX_HP * 3.5 + w * 15, maxHp: ENEMY_MAX_HP * 3.5 + w * 15,
                            speed: ENEMY_BASE_SPEED * 1.2 + w * 0.03, angle: 0,
                            type: 'elite_normal', r: 22, dmg: DAMAGE_PER_HIT * 1.5 + w * 2, xpDrop: 150 + w * 5, color: '#7f1d1d', cooldown: 0, phaseTimer: 0, dash: 0
                        });
                    } else if (et === 1) {
                        enemies.push({
                            id: Math.random(), x: Math.random() > 0.5 ? 40 : arcCanvas.width - 40, y: arcCanvas.height / 2,
                            hp: ENEMY_MAX_HP * 2.5 + w * 10, maxHp: ENEMY_MAX_HP * 2.5 + w * 10,
                            speed: ENEMY_BASE_SPEED * 0.9 + w * 0.04, angle: 0,
                            type: 'elite_shooter', r: 18, dmg: DAMAGE_PER_HIT * 1.2 + w * 2, xpDrop: 150 + w * 5, color: '#0369a1', cooldown: 800, phaseTimer: 0, dash: 0
                        });
                    } else {
                        enemies.push({
                            id: Math.random(), x: Math.random() > 0.5 ? 40 : arcCanvas.width - 40, y: arcCanvas.height / 2,
                            hp: ENEMY_MAX_HP * 1.5 + w * 8, maxHp: ENEMY_MAX_HP * 1.5 + w * 8,
                            speed: ENEMY_BASE_SPEED * 2.4 + w * 0.1, angle: 0,
                            type: 'elite_runner', r: 14, dmg: DAMAGE_PER_HIT * 1.5 + w * 2, xpDrop: 150 + w * 5, color: '#c2410c', cooldown: 0, phaseTimer: 0, dash: 0
                        });
                    }
                }

                // Probabilidades de enemigos especiales avanzadas (a partir de la oleada 2-3)
                const probRunner = Math.min(0.4, w * 0.03);
                const probShooter = Math.min(0.3, w * 0.02);

                for (let i = 0; i < count; i++) {
                    let ex, ey;
                    if (!isLargeMap) {
                        const side = Math.floor(Math.random() * 4);
                        const pad = ENEMY_RADIUS + 5;
                        if (side === 0) { ex = Math.random() * arcCanvas.width; ey = pad; }
                        else if (side === 1) { ex = arcCanvas.width - pad; ey = Math.random() * arcCanvas.height; }
                        else if (side === 2) { ex = Math.random() * arcCanvas.width; ey = arcCanvas.height - pad; }
                        else { ex = pad; ey = Math.random() * arcCanvas.height; }
                    } else {
                        // Spawn en un anillo alrededor del jugador en mapa infinito
                        const dist = Math.max(arcCanvas.width, arcCanvas.height) * 0.6 + Math.random() * 200;
                        const ang = Math.random() * Math.PI * 2;
                        ex = player.x + Math.cos(ang) * dist;
                        ey = player.y + Math.sin(ang) * dist;
                    }

                    const rnd = Math.random();
                    if (rnd < probShooter && w >= 3) {
                        // Shooter: Se mantiene a distancia y dispara
                        enemies.push({
                            id: Math.random(),
                            x: ex, y: ey,
                            hp: ENEMY_MAX_HP * 0.8 + w * 3, maxHp: ENEMY_MAX_HP * 0.8 + w * 3,
                            speed: ENEMY_BASE_SPEED * 0.7 + w * 0.05, angle: 0,
                            type: 'shooter', r: ENEMY_RADIUS, dmg: DAMAGE_PER_HIT, xpDrop: 20 + w * 4, color: '#0ea5e9',
                            cooldown: Math.random() * 2000 + 1000
                        });
                    } else if (rnd < probShooter + probRunner && w >= 2) {
                        // Runner: Muy rápido pero frágil
                        enemies.push({
                            id: Math.random(),
                            x: ex, y: ey,
                            hp: ENEMY_MAX_HP * 0.5 + w * 2, maxHp: ENEMY_MAX_HP * 0.5 + w * 2,
                            speed: ENEMY_BASE_SPEED * 1.8 + w * 0.1, angle: 0,
                            type: 'runner', r: ENEMY_RADIUS * 0.75, dmg: DAMAGE_PER_HIT * 0.75, xpDrop: 15 + w * 2, color: '#f97316'
                        });
                    } else {
                        // Normal (Aumentado)
                        enemies.push({
                            id: Math.random(),
                            x: ex, y: ey,
                            hp: ENEMY_MAX_HP + w * 8, maxHp: ENEMY_MAX_HP + w * 8, // más vida
                            speed: ENEMY_BASE_SPEED + w * 0.15, angle: 0, // un poco más rápidos
                            type: 'normal', r: ENEMY_RADIUS, dmg: DAMAGE_PER_HIT + w * 2, xpDrop: 15 + w * 3, color: '#ef4444' // más daño
                        });
                    }
                }
            }

            // ── Disparo ───────────────────────────────────────────────────────────────────
            function shoot(mx, my) {
                if (arcState !== 'playing') return;
                if (player.shootCooldown > 0) return;

                player.shootCooldown = 400 * player.fireRateMult;
                Sfx.play('shoot');

                // Convertir coordenadas de pantalla a mundo
                const isLargeMap = (wave > 15);
                const worldX = isLargeMap ? (mx + camera.x) : mx;
                const worldY = isLargeMap ? (my + camera.y) : my;

                const dx = worldX - player.x, dy = worldY - player.y;
                const angle = Math.atan2(dy, dx);
                const ms = player.multiShot;
                for (let i = 0; i <= ms; i++) {
                    const offset = (ms === 0) ? 0 : (i - ms / 2) * 0.15;
                    const a = angle + offset;
                    bullets.push({
                        x: player.x, y: player.y,
                        vx: Math.cos(a) * BULLET_SPEED, vy: Math.sin(a) * BULLET_SPEED,
                        pierce: player.pierce || 0, hitList: []
                    });
                }
            }

            // Interfaz para disparar hacia un ángulo concreto (usado en Auto-Aim mobile)
            function shootAngle(angle) {
                if (arcState !== 'playing') return;
                if (player.shootCooldown > 0) return;

                player.shootCooldown = 400 * player.fireRateMult;
                Sfx.play('shoot');

                const ms = player.multiShot;
                for (let i = 0; i <= ms; i++) {
                    const offset = (ms === 0) ? 0 : (i - ms / 2) * 0.15;
                    const a = angle + offset;
                    bullets.push({
                        x: player.x, y: player.y,
                        vx: Math.cos(a) * BULLET_SPEED, vy: Math.sin(a) * BULLET_SPEED,
                        pierce: player.pierce || 0, hitList: []
                    });
                }
            }

            // ── Actualización ─────────────────────────────────────────────────────────────
            function arcadeUpdate(dt) {
                if (arcState === 'dead' || arcState === 'stopped' || arcState === 'levelup') return;

                if (arcState === 'waveclear') {
                    waveDelay -= dt;
                    if (waveDelay <= 0) {
                        wave++;
                        spawnWave(wave);
                        arcState = 'playing';
                    }
                    return;
                }

                const factor = dt / (1000 / 60);

                // Mover XP
                xpGems = xpGems.filter(g => {
                    const dx = player.x - g.x, dy = player.y - g.y;
                    const d = Math.sqrt(dx * dx + dy * dy) || 1;
                    if (d < PLAYER_RADIUS + 8) {
                        addXp(g.amount);
                        return false;
                    }
                    if (d < player.magnetRadius) {
                        g.x += (dx / d) * 8 * factor;
                        g.y += (dy / d) * 8 * factor;
                    }
                    g.life -= dt;
                    return g.life > 0;
                });

                // Movimiento del jugador
                let vx = 0, vy = 0;

                if (isMobile && joystick.active) {
                    let maxDist = 45; // Radio visual del joystick
                    let ang = Math.atan2(joystick.y, joystick.x);
                    let dist = Math.sqrt(joystick.x * joystick.x + joystick.y * joystick.y);
                    let normalizedDist = Math.min(dist, maxDist) / maxDist; // 0.0 a 1.0

                    vx = Math.cos(ang) * normalizedDist;
                    vy = Math.sin(ang) * normalizedDist;
                } else {
                    if (keys['ArrowLeft'] || keys['a'] || keys['A']) vx -= 1;
                    if (keys['ArrowRight'] || keys['d'] || keys['D']) vx += 1;
                    if (keys['ArrowUp'] || keys['w'] || keys['W']) vy -= 1;
                    if (keys['ArrowDown'] || keys['s'] || keys['S']) vy += 1;
                }

                const vlen = Math.sqrt(vx * vx + vy * vy) || 1;
                const isLargeMap = (wave > 15);
                const mapW = isLargeMap ? arcCanvas.width * 3 : arcCanvas.width;
                const mapH = isLargeMap ? arcCanvas.height * 3 : arcCanvas.height;

                if (vx !== 0 || vy !== 0) {
                    const spd = PLAYER_SPEED * player.speedMult * factor;
                    const moveMult = isMobile ? Math.min(vlen, 1) : 1;
                    
                    player.x = Math.max(PLAYER_RADIUS, Math.min(mapW - PLAYER_RADIUS, player.x + (vx / vlen) * spd * moveMult));
                    player.y = Math.max(PLAYER_RADIUS, Math.min(mapH - PLAYER_RADIUS, player.y + (vy / vlen) * spd * moveMult));
                }

                // Actualizar cámara
                if (isLargeMap) {
                    // Seguir al jugador suavemente, pero sin salir del mapa
                    const targetCamX = Math.max(0, Math.min(mapW - arcCanvas.width, player.x - arcCanvas.width / 2));
                    const targetCamY = Math.max(0, Math.min(mapH - arcCanvas.height, player.y - arcCanvas.height / 2));
                    camera.x += (targetCamX - camera.x) * 0.1 * factor;
                    camera.y += (targetCamY - camera.y) * 0.1 * factor;
                } else {
                    camera.x = 0;
                    camera.y = 0;
                }

                if (!isMobile) {
                    const worldMX = isLargeMap ? (mouseX + camera.x) : mouseX;
                    const worldMY = isLargeMap ? (mouseY + camera.y) : mouseY;
                    player.angle = Math.atan2(worldMY - player.y, worldMX - player.x);
                    // Disparo continuo al mantener el ratón pulsado
                    if (mouseDown) shoot(mouseX, mouseY);
                } else {
                    // Auto-Aim en móviles
                    if (enemies.length > 0) {
                        let closest = null;
                        let minDist = Infinity;
                        for (const e of enemies) {
                            let dx = e.x - player.x, dy = e.y - player.y;
                            let dist = dx * dx + dy * dy;
                            if (dist < minDist) { minDist = dist; closest = e; }
                        }
                        if (closest) {
                            let dx = closest.x - player.x, dy = closest.y - player.y;
                            player.angle = Math.atan2(dy, dx);
                            shootAngle(player.angle);
                        }
                    }
                }

                // Flash e Invencibilidad
                if (flashAlpha > 0) flashAlpha -= dt * 0.003;
                if (flashAlpha < 0) flashAlpha = 0;
                if (player.invincible > 0) player.invincible -= dt;
                if (player.shootCooldown > 0) player.shootCooldown -= dt;

                // Mover balas del jugador
                bullets = bullets.filter(b => {
                    b.x += b.vx * factor;
                    b.y += b.vy * factor;
                    return b.x > -100 && b.x < mapW + 100 && b.y > -100 && b.y < mapH + 100;
                });

                // Mover balas enemigas
                enemyBullets = enemyBullets.filter(eb => {
                    eb.x += eb.vx * factor;
                    eb.y += eb.vy * factor;

                    // Colision de bala enemiga con jugador
                    if (player.invincible <= 0) {
                        const dx = player.x - eb.x, dy = player.y - eb.y;
                        if (dx * dx + dy * dy < (PLAYER_RADIUS + eb.r) ** 2) {
                            player.hp -= eb.dmg;
                            player.invincible = 800;
                            flashAlpha = 0.55;
                            for (let k = 0; k < 8; k++) particles.push(makeParticle(player.x, player.y, '#ef4444'));
                            if (player.hp <= 0) {
                                player.hp = 0;
                                arcState = 'dead';
                            }
                            return false; // se destruye la bala
                        }
                    }
                    return eb.x > -100 && eb.x < mapW + 100 && eb.y > -100 && eb.y < mapH + 100;
                });

                if (superBossWarning > 0) superBossWarning -= dt;

                // Comportamiento de Enemigos
                for (const e of enemies) {
                    const dx = player.x - e.x, dy = player.y - e.y;
                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                    let spd = e.speed * factor;

                    if (e.type === 'shooter' || e.type === 'elite_shooter') {
                        let isElite = (e.type === 'elite_shooter');
                        if (len < 180) {
                            spd = -spd * 0.5;
                        } else if (len < 220) {
                            spd = 0;
                        }
                        e.cooldown -= dt;
                        if (e.cooldown <= 0 && len < 400) {
                            e.cooldown = isElite ? (800 + Math.random() * 500) : (1800 + Math.random() * 1000);
                            enemyBullets.push({
                                x: e.x, y: e.y, r: isElite ? 7 : 5, dmg: Math.floor(e.dmg * (isElite ? 0.8 : 0.6)),
                                vx: (dx / len) * (BULLET_SPEED * (isElite ? 0.8 : 0.55)),
                                vy: (dy / len) * (BULLET_SPEED * (isElite ? 0.8 : 0.55))
                            });
                        }
                        e.x += (dx / len) * spd; e.y += (dy / len) * spd;
                    } else if (e.type === 'miniboss') {
                        if (e.subType === 'charger') {
                            e.cooldown -= dt;
                            if (e.cooldown <= 0) {
                                if (len < 400) { e.cooldown = 1500; e.dash = 400; e.dashVx = (dx / len); e.dashVy = (dy / len); }
                                else { e.cooldown = 800; }
                            }
                            if (e.dash > 0) { e.dash -= dt; e.x += e.dashVx * (spd * 4.5); e.y += e.dashVy * (spd * 4.5); }
                            else { e.x += (dx / len) * (spd * 1.5); e.y += (dy / len) * (spd * 1.5); }
                        } else { // twin_shooter
                            e.cooldown -= dt;
                            if (e.cooldown <= 0 && len < 500) {
                                e.cooldown = 1100;
                                for (let k = -1; k <= 1; k += 2) {
                                    let a = Math.atan2(dy, dx) + k * 0.3;
                                    enemyBullets.push({ x: e.x, y: e.y, r: 6, dmg: Math.floor(e.dmg * 0.7), vx: Math.cos(a) * BULLET_SPEED * 0.8, vy: Math.sin(a) * BULLET_SPEED * 0.8 });
                                }
                            }
                            if (len < 150) spd = -spd * 0.5; else if (len < 250) spd = 0;
                            e.x += (dx / len) * spd; e.y += (dy / len) * spd;
                        }
                    } else if (e.type === 'boss') {
                        if (e.subType === 'summoner') {
                            e.cooldown -= dt;
                            if (e.cooldown <= 0) {
                                e.cooldown = 1800;
                                for (let k = 0; k < 4; k++) {
                                    enemies.push({ id: Math.random(), x: e.x + (Math.random() * 40 - 20), y: e.y + (Math.random() * 40 - 20), hp: ENEMY_MAX_HP + wave * 3, maxHp: ENEMY_MAX_HP + wave * 3, speed: ENEMY_BASE_SPEED + wave * 0.15, angle: 0, type: 'runner', r: ENEMY_RADIUS - 3, dmg: DAMAGE_PER_HIT * 0.6, xpDrop: 5, color: '#ec4899' });
                                }
                            }
                            e.x += (dx / len) * spd; e.y += (dy / len) * spd;
                        } else { // spread_shooter
                            e.cooldown -= dt;
                            if (e.cooldown <= 0) {
                                e.cooldown = 1200;
                                for (let k = 0; k < 12; k++) {
                                    let a = e.angle + (Math.PI / 6) * k;
                                    enemyBullets.push({ x: e.x, y: e.y, r: 7, dmg: Math.floor(e.dmg * 0.6), vx: Math.cos(a) * BULLET_SPEED * 0.7, vy: Math.sin(a) * BULLET_SPEED * 0.7 });
                                }
                            }
                            e.x += (dx / len) * spd * 0.5; e.y += (dy / len) * spd * 0.5;
                        }
                    } else if (e.type === 'superboss') {
                        if (e.subType === 'bullet_hell') {
                            e.cooldown -= dt;
                            e.phaseTimer += dt * 0.0035;
                            if (e.cooldown <= 0) {
                                e.cooldown = 250; // fires constantly fast
                                let a = e.phaseTimer;
                                for (let k = 0; k < 6; k++) {
                                    let ta = a + (Math.PI / 3) * k;
                                    enemyBullets.push({ x: e.x, y: e.y, r: 8, dmg: Math.floor(e.dmg * 0.5), vx: Math.cos(ta) * BULLET_SPEED * 0.6, vy: Math.sin(ta) * BULLET_SPEED * 0.6 });
                                }
                            }
                            e.x += (dx / len) * spd * 0.4; e.y += (dy / len) * spd * 0.4;
                        } else { // berserker
                            e.cooldown -= dt;
                            if (e.cooldown <= 0) {
                                if (len < 500) { e.cooldown = 1500; e.dash = 600; e.dashVx = (dx / len); e.dashVy = (dy / len); }
                                else { e.cooldown = 1000; }
                            }
                            if (e.dash > 0) {
                                e.dash -= dt; e.x += e.dashVx * (spd * 3.5); e.y += e.dashVy * (spd * 3.5);
                                if (Math.random() < 0.3) enemyBullets.push({ x: e.x, y: e.y, r: 4, dmg: Math.floor(e.dmg * 0.3), vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 });
                            }
                            else { e.x += (dx / len) * spd * 1.5; e.y += (dy / len) * spd * 1.5; }
                        }
                    } else {
                        e.x += (dx / len) * spd;
                        e.y += (dy / len) * spd;
                    }

                    // Limitar enemigos al mapa
                    e.x = Math.max(e.r, Math.min(mapW - e.r, e.x));
                    e.y = Math.max(e.r, Math.min(mapH - e.r, e.y));

                    e.angle = Math.atan2(dy, dx);
                }

                // Colisión balas-enemigos
                for (let i = bullets.length - 1; i >= 0; i--) {
                    const b = bullets[i];
                    for (let j = enemies.length - 1; j >= 0; j--) {
                        const e = enemies[j];
                        if (b.hitList.includes(e.id)) continue;
                        const dx = b.x - e.x, dy = b.y - e.y;
                        if (dx * dx + dy * dy < (BULLET_RADIUS + e.r) ** 2) {
                            e.hp -= player.damage;
                            b.hitList.push(e.id);
                            Sfx.play('hit');
                            for (let k = 0; k < 4; k++) particles.push(makeParticle(e.x, e.y, e.color));

                            if (e.hp <= 0) {
                                if (player.vampirism) player.hp = Math.min(player.maxHp, player.hp + player.vampirism);
                                dropXp(e.x, e.y, Math.floor(e.xpDrop * player.xpMult));
                                for (let k = 0; k < 12; k++) particles.push(makeParticle(e.x, e.y, '#facc15'));
                                enemies.splice(j, 1);
                            }
                            if (b.pierce <= 0) {
                                bullets.splice(i, 1);
                                break;
                            } else {
                                b.pierce--;
                            }
                        }
                    }
                }

                // Colisión enemigos-jugador
                if (player.invincible <= 0) {
                    for (let j = enemies.length - 1; j >= 0; j--) {
                        const e = enemies[j];
                        const dx = player.x - e.x, dy = player.y - e.y;
                        if (dx * dx + dy * dy < (PLAYER_RADIUS + e.r - 4) ** 2) {
                            player.hp -= e.dmg;
                            player.invincible = 800; // 800ms
                            flashAlpha = 0.55;
                            Sfx.play('hurt');
                            for (let k = 0; k < 8; k++) particles.push(makeParticle(player.x, player.y, '#ef4444'));
                            if (player.hp <= 0) {
                                player.hp = 0;
                                arcState = 'dead';
                                Sfx.play('death');
                                
                                // Ganar dinero al morir: 50 base + 25 por oleada
                                const earned = 50 + (wave * 25);
                                meta.money += earned;
                                saveMeta();
                            }
                            break;
                        }
                    }
                }

                // Actualizar partículas
                particles = particles.filter(p => {
                    p.x += p.vx; p.y += p.vy;
                    p.life -= p.decay;
                    return p.life > 0;
                });

                if (enemies.length === 0 && arcState === 'playing') {
                    arcState = 'waveclear';
                    waveDelay = 2500; // ms
                }

                updateHUD();
            }

            function updateHUD() {
                const pct = Math.max(0, player.hp / player.maxHp * 100);
                elPlayerBar.style.width = pct + '%';
                elWave.textContent = wave;
                elScore.textContent = meta.money;
                elLevel.textContent = level;
                elXpBar.style.width = Math.min(100, (xp / maxXp) * 100) + '%';
            }

            // ── Render ────────────────────────────────────────────────────────────────────
            function arcadeRender() {
                const W = arcCanvas.width, H = arcCanvas.height;
                const isLargeMap = (wave > 15);
                const mapW = isLargeMap ? W * 3 : W;
                const mapH = isLargeMap ? H * 3 : H;
                arcCtx.clearRect(0, 0, W, H);

                // Fondo
                arcCtx.fillStyle = '#080c14';
                arcCtx.fillRect(0, 0, W, H);
                
                arcCtx.save();
                if (isLargeMap) arcCtx.translate(-camera.x, -camera.y);

                // Fondo cuadriculado
                arcCtx.strokeStyle = '#111827'; arcCtx.lineWidth = .5;
                const G = 40;

                // Dibujar rejilla limitada por el mapa
                for (let x = 0; x <= mapW; x += G) { 
                    arcCtx.beginPath(); arcCtx.moveTo(x, 0); arcCtx.lineTo(x, mapH); arcCtx.stroke(); 
                }
                for (let y = 0; y <= mapH; y += G) { 
                    arcCtx.beginPath(); arcCtx.moveTo(0, y); arcCtx.lineTo(mapW, y); arcCtx.stroke(); 
                }

                // Borde del mapa
                arcCtx.strokeStyle = '#ef4444'; arcCtx.lineWidth = 4;
                arcCtx.strokeRect(0, 0, mapW, mapH);

                // XP Gems
                for (const g of xpGems) {
                    arcCtx.shadowColor = '#3b82f6'; arcCtx.shadowBlur = 8;
                    arcCtx.fillStyle = '#60a5fa';
                    arcCtx.beginPath(); arcCtx.arc(g.x, g.y, 4.5, 0, Math.PI * 2); arcCtx.fill();
                }
                arcCtx.shadowBlur = 0;

                // Partículas
                for (const p of particles) {
                    arcCtx.globalAlpha = p.life;
                    arcCtx.fillStyle = p.color;
                    arcCtx.beginPath();
                    arcCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    arcCtx.fill();
                }
                arcCtx.globalAlpha = 1;

                // Balas
                for (const b of bullets) {
                    arcCtx.shadowColor = '#818cf8'; arcCtx.shadowBlur = 10;
                    arcCtx.fillStyle = '#a5b4fc';
                    arcCtx.beginPath();
                    arcCtx.arc(b.x, b.y, BULLET_RADIUS, 0, Math.PI * 2);
                    arcCtx.fill();
                }
                arcCtx.shadowBlur = 0;

                // Enemigos
                for (const e of enemies) {
                    // Cuerpo
                    arcCtx.shadowColor = e.color; arcCtx.shadowBlur = 12;
                    arcCtx.fillStyle = e.color;
                    arcCtx.beginPath();
                    arcCtx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
                    arcCtx.fill();
                    // Ojo/dirección
                    arcCtx.shadowBlur = 0;
                    arcCtx.fillStyle = '#fff';
                    const eyeX = e.x + Math.cos(e.angle) * e.r * 0.5;
                    const eyeY = e.y + Math.sin(e.angle) * e.r * 0.5;
                    arcCtx.beginPath(); arcCtx.arc(eyeX, eyeY, e.r * 0.3, 0, Math.PI * 2); arcCtx.fill();
                    // Barra de vida del enemigo
                    const bw = e.r * 2;
                    const bh = 4;
                    const bx = e.x - e.r;
                    const by = e.y - e.r - 8;
                    arcCtx.fillStyle = '#374151';
                    arcCtx.fillRect(bx, by, bw, bh);
                    arcCtx.fillStyle = '#ef4444';
                    arcCtx.fillRect(bx, by, bw * (Math.max(0, e.hp) / e.maxHp), bh);
                }
                arcCtx.shadowBlur = 0;

                // Balas enemigas
                for (const eb of enemyBullets) {
                    arcCtx.shadowColor = '#f43f5e'; arcCtx.shadowBlur = 8;
                    arcCtx.fillStyle = '#fb7185';
                    arcCtx.beginPath();
                    arcCtx.arc(eb.x, eb.y, eb.r, 0, Math.PI * 2);
                    arcCtx.fill();
                }
                arcCtx.shadowBlur = 0;

                // Jugador
                const isInv = player.invincible > 0;
                if (!isInv || Math.floor(Date.now() / 80) % 2 === 0) {
                    arcCtx.shadowColor = '#22c55e'; arcCtx.shadowBlur = 18;
                    arcCtx.fillStyle = '#22c55e';
                    arcCtx.beginPath();
                    arcCtx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
                    arcCtx.fill();
                    // Cañon (apunta al ratón)
                    arcCtx.shadowBlur = 0;
                    arcCtx.strokeStyle = '#86efac'; arcCtx.lineWidth = 4; arcCtx.lineCap = 'round';
                    arcCtx.beginPath();
                    arcCtx.moveTo(player.x, player.y);
                    arcCtx.lineTo(
                        player.x + Math.cos(player.angle) * PLAYER_RADIUS * 1.5,
                        player.y + Math.sin(player.angle) * PLAYER_RADIUS * 1.5
                    );
                    arcCtx.stroke();
                    // Ojo/punto central
                    arcCtx.fillStyle = 'rgba(255,255,255,.8)';
                    arcCtx.beginPath(); arcCtx.arc(player.x, player.y, 5, 0, Math.PI * 2); arcCtx.fill();
                }
                
                arcCtx.restore();

                // Flash rojo al recibir daño (fuera del transform de cámara para cubrir toda la pantalla)
                if (flashAlpha > 0) {
                    arcCtx.fillStyle = `rgba(239,68,68,${flashAlpha})`;
                    arcCtx.fillRect(0, 0, W, H);
                }

                // ── Pantallas de estado ────────────────────────────────────────────────
                if (arcState === 'waveclear') {
                    arcCtx.fillStyle = 'rgba(0,0,0,.45)';
                    arcCtx.fillRect(0, 0, W, H);
                    arcCtx.shadowColor = '#22c55e'; arcCtx.shadowBlur = 30;
                    arcCtx.fillStyle = '#22c55e';
                    arcCtx.font = 'bold 42px Inter,sans-serif'; arcCtx.textAlign = 'center';
                    arcCtx.fillText(`¡Oleada ${wave} superada!`, W / 2, H / 2 - 20);
                    arcCtx.shadowBlur = 0;
                    arcCtx.fillStyle = '#94a3b8';
                    arcCtx.font = '20px Inter,sans-serif';
                    arcCtx.fillText(`Oleada ${wave + 1} comenzará en breve…`, W / 2, H / 2 + 24);
                }

                if (arcState === 'dead') {
                    arcCtx.fillStyle = 'rgba(0,0,0,.85)';
                    arcCtx.fillRect(0, 0, W, H);
                    arcCtx.shadowColor = '#ef4444'; arcCtx.shadowBlur = 30;
                    arcCtx.fillStyle = '#ef4444';
                    arcCtx.font = 'bold 48px Inter,sans-serif'; arcCtx.textAlign = 'center';
                    arcCtx.fillText('¡Has muerto!', W / 2, H / 3);
                    arcCtx.shadowBlur = 0;
                    arcCtx.fillText(`Oleada alcanzada: ${wave}`, W / 2, H / 3 + 40);

                    const earned = 50 + (wave * 25);
                    arcCtx.fillStyle = '#facc15';
                    arcCtx.fillText(`💰 Monedas ganadas: ${earned}`, W / 2, H / 3 + 75);

                    // Cargar Récord Actual
                    const hiStr = localStorage.getItem('survivalArcHighScore');
                    const hiScore = hiStr ? parseInt(hiStr) : 0;

                    arcCtx.fillStyle = '#eab308';
                    arcCtx.font = 'bold 24px Inter,sans-serif';
                    arcCtx.fillText(`👑 Mejor Puntuación: ${Math.max(score, hiScore)} 👑`, W / 2, H / 3 + 120);

                    arcCtx.fillStyle = '#fff';
                    arcCtx.font = '16px Inter,sans-serif';
                    arcCtx.fillText('Pulsa 🔄 Reiniciar para volver a jugar', W / 2, H / 3 + 175);
                }
            }

            // Guarda la puntuación actual si es mayor a la guardada
            function saveHighScore() {
                const hiStr = localStorage.getItem('survivalArcHighScore');
                let hiScore = hiStr ? parseInt(hiStr) : 0;
                if (score > hiScore) {
                    localStorage.setItem('survivalArcHighScore', score.toString());
                }
            }

            // ── Loop principal ────────────────────────────────────────────────────────────
            function arcadeLoop(ts) {
                const dt = ts - lastTime;
                lastTime = ts;
                arcadeUpdate(Math.min(dt, 100)); // cap para no saltar frames largos
                arcadeRender();
                arcRAF = requestAnimationFrame(arcadeLoop);
            }

            function arcadeStart() {
                if (arcRAF) return;
                arcadeInit();
                lastTime = performance.now();
                arcRAF = requestAnimationFrame(arcadeLoop);
            }

            function arcadeStop() {
                if (arcRAF) { cancelAnimationFrame(arcRAF); arcRAF = null; }
            }
            window.arcadeStop = arcadeStop;
            window.arcadeStart = arcadeStart;
            window.Sfx = Sfx; // Exportar Sfx globalmente para la tienda


            // ── Controles de teclado ──────────────────────────────────────────────────────
            window.addEventListener('keydown', e => { keys[e.key] = true; });
            window.addEventListener('keyup', e => { keys[e.key] = false; });

            // ── Ratón ─────────────────────────────────────────────────────────────────────
            let mouseDown = false;

            arcCanvas.addEventListener('mousemove', e => {
                if (isMobile) return;
                const r = arcCanvas.getBoundingClientRect();
                mouseX = e.clientX - r.left;
                mouseY = e.clientY - r.top;
            });
            arcCanvas.addEventListener('mousedown', e => {
                if (isMobile) return;
                mouseDown = true;
                const r = arcCanvas.getBoundingClientRect();
                shoot(e.clientX - r.left, e.clientY - r.top);
            });
            arcCanvas.addEventListener('mouseup', () => { mouseDown = false; });
            arcCanvas.addEventListener('mouseleave', () => { mouseDown = false; });

            // ── Eventos Táctiles (Joystick móvil) ──────────────────────────────────────────
            arcCanvas.addEventListener('touchstart', e => {
                if (!isMobile) return;
                if (e.cancelable) e.preventDefault();
                for (let i = 0; i < e.changedTouches.length; i++) {
                    let t = e.changedTouches[i];
                    if (!joystick.active) {
                        const r = arcCanvas.getBoundingClientRect();
                        joystick.active = true;
                        joystick.id = t.identifier;
                        joystick.originX = t.clientX - r.left;
                        joystick.originY = t.clientY - r.top;
                        joystick.curX = joystick.originX;
                        joystick.curY = joystick.originY;
                        joystick.x = 0;
                        joystick.y = 0;
                    }
                }
            }, { passive: false });

            arcCanvas.addEventListener('touchmove', e => {
                if (!isMobile || !joystick.active) return;
                if (e.cancelable) e.preventDefault();
                for (let i = 0; i < e.changedTouches.length; i++) {
                    let t = e.changedTouches[i];
                    if (t.identifier === joystick.id) {
                        const r = arcCanvas.getBoundingClientRect();
                        joystick.curX = t.clientX - r.left;
                        joystick.curY = t.clientY - r.top;
                        joystick.x = joystick.curX - joystick.originX;
                        joystick.y = joystick.curY - joystick.originY;
                    }
                }
            }, { passive: false });

            const endTouch = (e) => {
                if (!isMobile || !joystick.active) return;
                for (let i = 0; i < e.changedTouches.length; i++) {
                    let t = e.changedTouches[i];
                    if (t.identifier === joystick.id) {
                        joystick.active = false;
                        joystick.id = null;
                        joystick.x = 0;
                        joystick.y = 0;
                    }
                }
            };
            arcCanvas.addEventListener('touchend', endTouch);
            arcCanvas.addEventListener('touchcancel', endTouch);

            // ── Botón reiniciar ───────────────────────────────────────────────────────────
            document.getElementById('arc-restart').addEventListener('click', () => {
                arcadeStop();
                arcadeInit();
                lastTime = performance.now();
                arcRAF = requestAnimationFrame(arcadeLoop);
            });

            // ── Resize ────────────────────────────────────────────────────────────────────
            window.addEventListener('resize', () => {
                if (arcRAF) {
                    resizeArcCanvas();
                    if (player) {
                        player.x = Math.min(player.x, arcCanvas.width - PLAYER_RADIUS);
                        player.y = Math.min(player.y, arcCanvas.height - PLAYER_RADIUS);
                    }
                }
            });

        })(); // fin IIFE mini-juego
