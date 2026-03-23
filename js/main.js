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
    info: document.getElementById('info'),
    shop: document.getElementById('shop'),
    leaderboard: document.getElementById('leaderboard'),
};

function showScreen(name, direction = 'right') {
    const inClass = direction === 'right' ? 'slide-right' : 'slide-left';
    Object.entries(screens).forEach(([k, s]) => {
        if (!s) return;
        if (k === name) {
            s.classList.remove('hidden', inClass);
        } else {
            s.classList.add('hidden');
        }
    });
    // Start arcade for info screens
    if (name === 'info' || name === 'arcade') arcadeStart();
    else arcadeStop();
}

function safeBindClick(id, callback) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', callback);
}

safeBindClick('btn-goto-config', () => showScreen('config'));

// ── Animación de Jugar (Tienda) ───────────────────────────────────────────────
safeBindClick('btn-goto-shop', () => { 
    const overlay = document.getElementById('transition-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        void overlay.offsetWidth; 
        overlay.classList.add('animating');
    }
    
    if (window.Sfx) {
        setTimeout(() => window.Sfx.play('shoot'), 400); 
        setTimeout(() => window.Sfx.play('hit'), 500); 
    }
    
    setTimeout(() => {
        showScreen('shop'); 
        if (typeof updateShopUI === 'function') updateShopUI();
    }, 600); // Wipe central
    
    setTimeout(() => {
        if (overlay) {
            overlay.classList.remove('animating');
            overlay.classList.add('hidden');
        }
    }, 1200); // Fin de la animación
});


safeBindClick('btn-shop-back', () => showScreen('menu', 'left'));
safeBindClick('btn-start-arcade', () => showScreen('info'));

safeBindClick('btn-goto-leaderboard', () => {
    showScreen('leaderboard');
    if (typeof renderLeaderboard === 'function') renderLeaderboard();
});
safeBindClick('btn-leaderboard-back', () => showScreen('menu', 'left'));

safeBindClick('btn-info-back', () => { arcadeStop(); showScreen('shop', 'left'); });

// ── Supabase Setup ────────────────────────────────────────────────────────────
const _supabaseUrl = 'https://ovybbobxlamapbyvputc.supabase.co';
const _supabaseKey = 'sb_publishable_mO4qLVaJdMonv3k3ynoA9A_ZK3l0k8c';
let sbClient = null;
try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        sbClient = window.supabase.createClient(_supabaseUrl, _supabaseKey);
    }
} catch(e) { console.warn('Supabase init failed:', e); }



// ── Meta Progresión ────────────────────────────────────────────────────────
// ── Chests & Rewards ────────────────────────────────────────────────────────
const CHEST_TYPES = [
    { id: 'wooden', name: 'Cofre de Madera', icon: '📦', time: 1000 * 60 * 5, minMoney: 10, maxMoney: 30, skinProb: 0.02, powerProb: 0.01, upgradeProb: 0.1, color: '#8b4513' },
    { id: 'silver', name: 'Cofre de Plata', icon: '🥈', time: 1000 * 60 * 30, minMoney: 30, maxMoney: 80, skinProb: 0.05, powerProb: 0.03, upgradeProb: 0.2, color: '#c0c0c0' },
    { id: 'golden', name: 'Cofre de Oro', icon: '🥇', time: 1000 * 60 * 60 * 2, minMoney: 100, maxMoney: 250, skinProb: 0.12, powerProb: 0.08, upgradeProb: 0.4, color: '#ffd700' },
    { id: 'epic', name: 'Cofre Épico', icon: '💎', time: 1000 * 60 * 60 * 8, minMoney: 300, maxMoney: 800, skinProb: 0.25, powerProb: 0.15, upgradeProb: 0.7, color: '#a855f7' },
    { id: 'legendary', name: 'Cofre Legendario', icon: '⭐', time: 1000 * 60 * 60 * 24, minMoney: 1000, maxMoney: 2500, skinProb: 0.60, powerProb: 0.40, upgradeProb: 1.0, color: '#ef4444' }
];

const SKINS = [
    { id: 'default', name: 'Estandar', color: '#22c55e', style: 'normal', weight: 100 },
    { id: 'blue', name: 'Azul Marino', color: '#3b82f6', style: 'normal', weight: 50 },
    { id: 'red', name: 'Rojo Fuego', color: '#ef4444', style: 'normal', weight: 50 },
    { id: 'spiderman', name: 'Spiderman', color: '#dc2626', style: 'web', weight: 2 },
    { id: 'gold', name: 'Dorado', color: '#fbbf24', style: 'normal', weight: 20 }
];

const SUPERPOWERS_DATA = [
    { id: 'dash', name: 'Dash', icon: '⚡', desc: 'Impulso rápido (Espacio)' },
    { id: 'superball', name: 'Super Bola', icon: '🔮', desc: 'Bola gigante perforante (Espacio)' }
];

const META_UPGRADES = [
    { id: 'hp', icon: '❤️', name: 'Vitalidad', desc: '+20 HP Máx', levels: 6, basePrice: 100, mult: 1.8 },
    { id: 'dmg', icon: '💥', name: 'Fuerza', desc: '+5 Daño Base', levels: 6, basePrice: 150, mult: 2.0 },
    { id: 'spd', icon: '⚡', name: 'Rapidez', desc: '+8% Vel. Base', levels: 6, basePrice: 200, mult: 2.2 },
    { id: 'mag', icon: '🧲', name: 'Atracción', desc: '+30 Rango Imán', levels: 6, basePrice: 120, mult: 1.7 },
];

let meta = {
    money: 0,
    upgrades: { hp: 0, dmg: 0, spd: 0, mag: 0 },
    chests: [null, null, null],
    unlockedSkins: ['default'],
    currentSkin: 'default',
    unlockedPowers: [],
    currentPower: null,
    initialBuffs: { hp: 0, dmg: 0, spd: 0, mag: 0 }
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

// ── Tabs ───────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
});

function updateShopUI() {
    const elMoney = document.getElementById('shop-money');
    elMoney.textContent = meta.money;

    renderUpgrades();
    renderChests();
    renderSkins();
    renderPowers();

    // Actualizar stats visuales
    document.getElementById('stat-hp').textContent = 100 + (meta.upgrades.hp * 20) + meta.initialBuffs.hp;
    document.getElementById('stat-dmg').textContent = 10 + (meta.upgrades.dmg * 5) + meta.initialBuffs.dmg;
    document.getElementById('stat-spd').textContent = (1.0 + (meta.upgrades.spd * 0.08) + meta.initialBuffs.spd).toFixed(2) + 'x';
    document.getElementById('stat-mag').textContent = 120 + (meta.upgrades.mag * 30) + meta.initialBuffs.mag;
}

function renderUpgrades() {
    const container = document.getElementById('upgrades-container');
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
}

function renderChests() {
    const container = document.getElementById('chests-container');
    container.innerHTML = '';
    meta.chests.forEach((chest, idx) => {
        const slot = document.createElement('div');
        slot.className = 'chest-slot' + (!chest ? ' empty' : '');

        if (!chest) {
            slot.innerHTML = 'Vacío';
        } else {
            const type = CHEST_TYPES.find(t => t.id === chest.type);
            const now = Date.now();
            const remaining = chest.unlockStartTime ? Math.max(0, chest.unlockStartTime + type.time - now) : type.time;
            const canOpen = chest.unlockStartTime && remaining <= 0;
            const isUnlocking = chest.unlockStartTime && remaining > 0;

            slot.innerHTML = `
                        <div class="chest-icon" style="color: ${type.color}">${type.icon}</div>
                        <div class="chest-info">
                            <div class="chest-name">${type.name}</div>
                            <div class="chest-timer">${canOpen ? '¡LISTO!' : formatTime(remaining)}</div>
                        </div>
                        <button class="btn-chest" ${isUnlocking ? 'disabled' : ''}>
                            ${canOpen ? 'ABRIR' : (isUnlocking ? '...' : 'DESBLOQUEAR')}
                        </button>
                    `;
            const btn = slot.querySelector('.btn-chest');
            btn.onclick = (e) => {
                e.stopPropagation();
                if (canOpen) openChest(idx, slot);
                else if (!isUnlocking) startUnlock(idx);
            };
        }
        container.appendChild(slot);
    });
}

function renderSkins() {
    const container = document.getElementById('skins-container');
    container.innerHTML = '';
    SKINS.forEach(skin => {
        const isUnlocked = meta.unlockedSkins.includes(skin.id);
        const isSelected = meta.currentSkin === skin.id;
        const card = document.createElement('div');
        card.className = `skin-card ${isSelected ? 'selected' : ''}`;
        card.innerHTML = `
                    <div class="skin-preview">
                        <div class="skin-dot" style="background: ${skin.color}"></div>
                    </div>
                    <div class="up-title">
                        <h3>${skin.name}</h3>
                        <p>${isUnlocked ? (isSelected ? 'Seleccionado' : 'Desbloqueado') : 'Bloqueado'}</p>
                    </div>
                    ${isSelected ? '<div class="check-badge">✓</div>' : ''}
                `;
        if (isUnlocked) {
            card.onclick = () => {
                meta.currentSkin = skin.id;
                saveMeta();
                updateShopUI();
            };
        }
        container.appendChild(card);
    });
}

function renderPowers() {
    const container = document.getElementById('powers-container');
    container.innerHTML = '';
    SUPERPOWERS_DATA.forEach(power => {
        const isUnlocked = meta.unlockedPowers.includes(power.id);
        const isSelected = meta.currentPower === power.id;
        const card = document.createElement('div');
        card.className = `power-card ${isSelected ? 'selected' : ''}`;
        card.innerHTML = `
                    <div class="up-header">
                        <div class="up-icon">${power.icon}</div>
                        <div class="up-title">
                            <h3>${power.name}</h3>
                            <p>${power.desc}</p>
                        </div>
                    </div>
                    <p style="font-size: 0.75rem; color: var(--muted)">${isUnlocked ? (isSelected ? 'Seleccionado' : 'Desbloqueado') : 'Bloqueado'}</p>
                    ${isSelected ? '<div class="check-badge">✓</div>' : ''}
                `;
        if (isUnlocked) {
            card.onclick = () => {
                meta.currentPower = isSelected ? null : power.id;
                saveMeta();
                updateShopUI();
            };
        }
        container.appendChild(card);
    });
}

function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}

setInterval(() => {
    const shopScreen = document.getElementById('shop');
    if (!shopScreen.classList.contains('hidden')) {
        renderChests();
    }
}, 1000);

function startUnlock(idx) {
    // Solo uno a la vez (opcional, el usuario no dijo nada, pero suele ser así. 
    // El usuario dijo "inician una cuenta atras de tiempo", lo que puede implicar varios a la vez. 
    // Releyendo: "solo se podran desbloquear cuando pase ese tiempo". No especifica uno a la vez.
    // Vamos a permitir varios a la vez por ahora, o si prefiere uno solo.
    meta.chests[idx].unlockStartTime = Date.now();
    saveMeta();
    updateShopUI();
}

function grantRandomChest() {
    const emptySlot = meta.chests.findIndex(c => c === null);
    if (emptySlot === -1) return; // No hay espacio

    // Pesos para aleatoriedad (madera: 50%, plata: 25%, oro: 15%, epico: 8%, legendario: 2%)
    const weights = [50, 25, 15, 8, 2];
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let rnd = Math.random() * totalWeight;
    let chosenType = CHEST_TYPES[0];

    for (let i = 0; i < weights.length; i++) {
        if (rnd < weights[i]) {
            chosenType = CHEST_TYPES[i];
            break;
        }
        rnd -= weights[i];
    }

    meta.chests[emptySlot] = {
        type: chosenType.id,
        unlockStartTime: null
    };
    saveMeta();
    updateShopUI();
}

async function openChest(idx, slotElement) {
    if (meta.openingChest) return; // Evitar aperturas simultáneas
    meta.openingChest = true;

    const chest = meta.chests[idx];
    const type = CHEST_TYPES.find(t => t.id === chest.type);

    // Animación en la shop
    if (slotElement) {
        slotElement.classList.add('chest-opening');
    }

    // Esperar a la animación (1.5s)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generar recompensas
    const money = Math.floor(Math.random() * (type.maxMoney - type.minMoney + 1)) + type.minMoney;
    meta.money += money;

    let rewards = [
        { text: `${money} Monedas`, icon: '💰' }
    ];

    // Probabilidades
    if (Math.random() < type.skinProb) {
        const availableSkinsToken = SKINS.filter(s => !meta.unlockedSkins.includes(s.id));
        if (availableSkinsToken.length > 0) {
            const totalW = availableSkinsToken.reduce((a, b) => a + b.weight, 0);
            let rnd = Math.random() * totalW;
            let chosenSkin = availableSkinsToken[0];
            for (const s of availableSkinsToken) {
                if (rnd < s.weight) { chosenSkin = s; break; }
                rnd -= s.weight;
            }
            meta.unlockedSkins.push(chosenSkin.id);
            rewards.push({ text: `Skin: ${chosenSkin.name}`, icon: '🎨' });
        }
    }

    if (Math.random() < type.powerProb) {
        const availablePowers = SUPERPOWERS_DATA.filter(p => !meta.unlockedPowers.includes(p.id));
        if (availablePowers.length > 0) {
            const power = availablePowers[Math.floor(Math.random() * availablePowers.length)];
            meta.unlockedPowers.push(power.id);
            rewards.push({ text: `Poder: ${power.name}`, icon: power.icon });
        }
    }

    if (Math.random() < type.upgradeProb) {
        const stats = ['hp', 'dmg', 'spd', 'mag'];
        const stat = stats[Math.floor(Math.random() * stats.length)];
        const amt = stat === 'spd' ? 0.05 : (stat === 'dmg' ? 2 : 10);
        meta.initialBuffs[stat] += amt;
        rewards.push({ text: `+${amt} ${stat.toUpperCase()}`, icon: '✨' });
    }

    // Mostrar overlay
    showRewardOverlay(rewards, type.icon);

    meta.openingChest = false;
    meta.chests[idx] = null;
    saveMeta();
    updateShopUI();

    if (window.Sfx) window.Sfx.play('levelup');
}

function showRewardOverlay(rewards, chestIcon) {
    const overlay = document.getElementById('reward-overlay');
    const list = document.getElementById('reward-list');
    const icon = document.getElementById('reward-chest-icon');

    icon.textContent = chestIcon;
    list.innerHTML = '';

    rewards.forEach(r => {
        const item = document.createElement('div');
        item.className = 'reward-item';
        item.innerHTML = `<span>${r.icon}</span> ${r.text}`;
        list.appendChild(item);
    });

    overlay.classList.remove('hidden');
}

document.getElementById('btn-reward-close').addEventListener('click', () => {
    document.getElementById('reward-overlay').classList.add('hidden');
});

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

    const currentSkinData = SKINS.find(s => s.id === meta.currentSkin) || SKINS[0];

    pCtx.shadowBlur = 20; pCtx.shadowColor = currentSkinData.color;
    pCtx.fillStyle = currentSkinData.color;
    pCtx.beginPath(); pCtx.arc(cx, cy + float, 30, 0, Math.PI * 2); pCtx.fill();

    if (currentSkinData.style === 'web') {
        pCtx.strokeStyle = '#000';
        pCtx.lineWidth = 1;
        // Telaraña radial
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            pCtx.beginPath(); pCtx.moveTo(cx, cy + float);
            pCtx.lineTo(cx + Math.cos(a) * 30, cy + float + Math.sin(a) * 30); pCtx.stroke();
        }
        // Anillos de telaraña
        for (let r = 10; r <= 30; r += 8) {
            pCtx.beginPath(); pCtx.arc(cx, cy + float, r, 0, Math.PI * 2); pCtx.stroke();
        }
        // Ojos grandes Spiderman
        pCtx.fillStyle = '#fff'; pCtx.strokeStyle = '#000'; pCtx.lineWidth = 2;
        for (let side of [-1, 1]) {
            pCtx.beginPath();
            pCtx.ellipse(cx + 12 * side, cy + float - 2, 8, 12, (Math.PI / 8) * side, 0, Math.PI * 2);
            pCtx.fill(); pCtx.stroke();
        }
        return; // ya pintamos ojos
    }

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
                if (player.acquiredPowers) player.acquiredPowers.push(p);
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
        const bonusHp = (meta.upgrades.hp * 20) + (meta.initialBuffs.hp || 0);
        const bonusDmg = (meta.upgrades.dmg * 5) + (meta.initialBuffs.dmg || 0);
        const bonusSpd = (meta.upgrades.spd * 0.08) + (meta.initialBuffs.spd || 0);
        const bonusMag = (meta.upgrades.mag * 30) + (meta.initialBuffs.mag || 0);

        player = {
            x: arcCanvas.width / 2, y: arcCanvas.height / 2,
            vx: 0, vy: 0,
            hp: PLAYER_MAX_HP + bonusHp, maxHp: PLAYER_MAX_HP + bonusHp, invincible: 0, angle: 0,
            damage: 10 + bonusDmg, speedMult: 1.0 + bonusSpd, multiShot: 0, pierce: 0, vampirism: 0,
            shootCooldown: 0, fireRateMult: 1.0, magnetRadius: 120 + bonusMag, xpMult: 1.0,
            powerCooldown: 0, dashDuration: 0,
            skin: SKINS.find(s => s.id === meta.currentSkin) || SKINS[0],
            power: meta.currentPower,
            acquiredPowers: []
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

    // Manejo de teclado para superpoderes
    window.addEventListener('keydown', e => {
        if (e.code === 'Space') {
            activatePower();
        }
    });

    function activatePower() {
        if (arcState !== 'playing' || !player.power || player.powerCooldown > 0) return;

        if (player.power === 'dash') {
            player.dashDuration = 200; // ms
            player.powerCooldown = 2000; // ms
            Sfx.play('shoot'); // Reutilizar sonido para dash
        } else if (player.power === 'superball') {
            spawnSuperBall();
            player.powerCooldown = 5000; // ms
            Sfx.play('shoot');
        }
    }

    function spawnSuperBall() {
        // Disparar en dirección al ratón
        const isLargeMap = (wave > 15);
        const worldX = isLargeMap ? (mouseX + camera.x) : mouseX;
        const worldY = isLargeMap ? (mouseY + camera.y) : mouseY;
        const angle = Math.atan2(worldY - player.y, worldX - player.x);

        bullets.push({
            x: player.x, y: player.y,
            vx: Math.cos(angle) * (BULLET_SPEED * 0.7), vy: Math.sin(angle) * (BULLET_SPEED * 0.7),
            isSuper: true, r: 40, damage: player.damage * 5, pierce: 999, hitList: []
        });
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
                type: 'superboss', subType: st, r: 65, dmg: 75, xpDrop: 3500, color: '#f43f5e',
                cooldown: 0, phaseTimer: 0, dash: 0, points: 5000 + w * 100
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
                type: 'boss', subType: st, r: 40, dmg: 60, xpDrop: 2000, color: '#a855f7',
                cooldown: 0, phaseTimer: 0, dash: 0, points: 2000 + w * 50
            });
        } else if (hasMiniBoss) {
            let st = Math.random() > 0.5 ? 'charger' : 'twin_shooter';
            enemies.push({
                id: Math.random(),
                x: Math.random() > 0.5 ? 40 : arcCanvas.width - 40, y: arcCanvas.height / 2,
                hp: ENEMY_MAX_HP * 10 + w * 30, maxHp: ENEMY_MAX_HP * 10 + w * 30,
                speed: ENEMY_BASE_SPEED * 1.2 + w * 0.03, angle: 0,
                type: 'miniboss', subType: st, r: 30, dmg: 50, xpDrop: 800, color: '#eab308',
                cooldown: 0, phaseTimer: 0, dash: 0, points: 800 + w * 20
            });
        } else if (hasElite) {
            let et = Math.floor(Math.random() * 3);
            if (et === 0) {
                enemies.push({
                    id: Math.random(), x: Math.random() > 0.5 ? 40 : arcCanvas.width - 40, y: arcCanvas.height / 2,
                    hp: ENEMY_MAX_HP * 4 + w * 25, maxHp: ENEMY_MAX_HP * 4 + w * 25,
                    speed: ENEMY_BASE_SPEED * 1.3 + w * 0.05, angle: 0,
                    type: 'elite_normal', r: 22, dmg: DAMAGE_PER_HIT * 1.8 + w * 3, xpDrop: 150 + w * 5, points: 150 + w * 5, color: '#7f1d1d', cooldown: 0, phaseTimer: 0, dash: 0
                });
            } else if (et === 1) {
                enemies.push({
                    id: Math.random(), x: Math.random() > 0.5 ? 40 : arcCanvas.width - 40, y: arcCanvas.height / 2,
                    hp: ENEMY_MAX_HP * 3 + w * 20, maxHp: ENEMY_MAX_HP * 3 + w * 20,
                    speed: ENEMY_BASE_SPEED * 1.0 + w * 0.06, angle: 0,
                    type: 'elite_shooter', r: 18, dmg: DAMAGE_PER_HIT * 1.5 + w * 3, xpDrop: 150 + w * 5, points: 150 + w * 5, color: '#0369a1', cooldown: 600, phaseTimer: 0, dash: 0
                });
            } else {
                enemies.push({
                    id: Math.random(), x: Math.random() > 0.5 ? 40 : arcCanvas.width - 40, y: arcCanvas.height / 2,
                    hp: ENEMY_MAX_HP * 2 + w * 15, maxHp: ENEMY_MAX_HP * 2 + w * 15,
                    speed: ENEMY_BASE_SPEED * 2.8 + w * 0.15, angle: 0,
                    type: 'elite_runner', r: 14, dmg: DAMAGE_PER_HIT * 1.8 + w * 3, xpDrop: 150 + w * 5, points: 150 + w * 5, color: '#c2410c', cooldown: 0, phaseTimer: 0, dash: 0
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
                    hp: ENEMY_MAX_HP * 1.0 + w * 5, maxHp: ENEMY_MAX_HP * 1.0 + w * 5,
                    speed: ENEMY_BASE_SPEED * 0.8 + w * 0.07, angle: 0,
                    type: 'shooter', r: ENEMY_RADIUS, dmg: DAMAGE_PER_HIT + w * 1.2, xpDrop: 20 + w * 4, points: 50 + w * 5, color: '#0ea5e9',
                    cooldown: Math.random() * 1500 + 800
                });
            } else if (rnd < probShooter + probRunner && w >= 2) {
                // Runner: Muy rápido pero frágil
                enemies.push({
                    id: Math.random(),
                    x: ex, y: ey,
                    hp: ENEMY_MAX_HP * 0.6 + w * 3, maxHp: ENEMY_MAX_HP * 0.6 + w * 3,
                    speed: ENEMY_BASE_SPEED * 2.0 + w * 0.12, angle: 0,
                    type: 'runner', r: ENEMY_RADIUS * 0.75, dmg: DAMAGE_PER_HIT * 1.0 + w * 1.2, xpDrop: 15 + w * 2, points: 30 + w * 3, color: '#f97316'
                });
            } else {
                // Normal (Aumentado)
                enemies.push({
                    id: Math.random(),
                    x: ex, y: ey,
                    hp: ENEMY_MAX_HP + w * 12, maxHp: ENEMY_MAX_HP + w * 12, // más vida
                    speed: ENEMY_BASE_SPEED + w * 0.2, angle: 0, // un poco más rápidos
                    type: 'normal', r: ENEMY_RADIUS, dmg: DAMAGE_PER_HIT + w * 3, xpDrop: 15 + w * 3, points: 20 + i * 2, color: '#ef4444' // más daño
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
        if (arcState === 'dead' || arcState === 'stopped' || arcState === 'levelup' || arcState === 'paused') return;

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
        let kx = 0, ky = 0;

        if (isMobile && joystick.active) {
            let maxDist = 45;
            let ang = Math.atan2(joystick.y, joystick.x);
            let dist = Math.sqrt(joystick.x * joystick.x + joystick.y * joystick.y);
            let normalizedDist = Math.min(dist, maxDist) / maxDist;

            kx = Math.cos(ang) * normalizedDist;
            ky = Math.sin(ang) * normalizedDist;
        } else {
            if (keys['ArrowLeft'] || keys['a'] || keys['A']) kx -= 1;
            if (keys['ArrowRight'] || keys['d'] || keys['D']) kx += 1;
            if (keys['ArrowUp'] || keys['w'] || keys['W']) ky -= 1;
            if (keys['ArrowDown'] || keys['s'] || keys['S']) ky += 1;
        }

        if (kx !== 0 || ky !== 0) {
            const klen = Math.sqrt(kx * kx + ky * ky);
            player.vx = kx / klen;
            player.vy = ky / klen;
        } else if (player.dashDuration <= 0) {
            player.vx = 0;
            player.vy = 0;
        }

        const isLargeMap = (wave > 15);
        const mapW = isLargeMap ? arcCanvas.width * 3 : arcCanvas.width;
        const mapH = isLargeMap ? arcCanvas.height * 3 : arcCanvas.height;

        let spd = PLAYER_SPEED * player.speedMult;
        if (player.dashDuration > 0) {
            spd *= 4;
            player.dashDuration -= dt;
        }

        if (player.vx !== 0 || player.vy !== 0) {
            const moveMult = isMobile ? Math.min(Math.sqrt(kx * kx + ky * ky) / 45, 1) : 1;
            player.x = Math.max(PLAYER_RADIUS, Math.min(mapW - PLAYER_RADIUS, player.x + player.vx * spd * factor * moveMult));
            player.y = Math.max(PLAYER_RADIUS, Math.min(mapH - PLAYER_RADIUS, player.y + player.vy * spd * factor * moveMult));
        }

        if (player.powerCooldown > 0) player.powerCooldown -= dt;

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
                    if (e.cooldown <= 0 && len < 600) {
                        e.cooldown = 900;
                        for (let k = -2; k <= 2; k += 1) { // 5 bullets instead of 2
                            let a = Math.atan2(dy, dx) + k * 0.25;
                            enemyBullets.push({ x: e.x, y: e.y, r: 7, dmg: Math.floor(e.dmg * 0.8), vx: Math.cos(a) * BULLET_SPEED * 1.2, vy: Math.sin(a) * BULLET_SPEED * 1.2 });
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
                        e.cooldown = 1000; // faster fire rate
                        for (let k = 0; k < 18; k++) { // 18 bullets instead of 12
                            let a = e.angle + (Math.PI / 9) * k;
                            enemyBullets.push({ x: e.x, y: e.y, r: 8, dmg: Math.floor(e.dmg * 0.7), vx: Math.cos(a) * BULLET_SPEED * 0.9, vy: Math.sin(a) * BULLET_SPEED * 0.9 });
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
                const br = b.isSuper ? (b.r || 40) : BULLET_RADIUS;
                if (dx * dx + dy * dy < (br + e.r) ** 2) {
                    e.hp -= (b.isSuper ? b.damage : player.damage);
                    b.hitList.push(e.id);
                    Sfx.play('hit');
                    for (let k = 0; k < 4; k++) particles.push(makeParticle(e.x, e.y, e.color));

                    if (e.hp <= 0) {
                        score += (e.points || 10);
                        if (player.vampirism) player.hp = Math.min(player.maxHp, player.hp + player.vampirism);
                        dropXp(e.x, e.y, Math.floor(e.xpDrop * player.xpMult));
                        for (let k = 0; k < 12; k++) particles.push(makeParticle(e.x, e.y, '#facc15'));
                        enemies.splice(j, 1);
                    }
                    if (b.isSuper) {
                        // Super ball no se destruye, tiene perforación infinita
                    } else if (b.pierce <= 0) {
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
                            grantRandomChest();
                            saveHighScore(); 
                            saveMeta();
                            showDeathOverlay();
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
            if (b.isSuper) {
                arcCtx.shadowColor = '#6366f1'; arcCtx.shadowBlur = 18;
                arcCtx.fillStyle = '#818cf8';
                arcCtx.beginPath();
                arcCtx.arc(b.x, b.y, b.r || 40, 0, Math.PI * 2);
                arcCtx.fill();
                arcCtx.shadowBlur = 0;
                continue;
            }
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
            const skin = player.skin;
            arcCtx.shadowColor = skin.color; arcCtx.shadowBlur = 18;
            arcCtx.fillStyle = skin.color;
            arcCtx.beginPath();
            arcCtx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
            arcCtx.fill();

            if (skin.style === 'web') {
                arcCtx.strokeStyle = '#000';
                arcCtx.lineWidth = 1;
                // Telaraña radial
                for (let i = 0; i < 8; i++) {
                    const a = (i / 8) * Math.PI * 2;
                    arcCtx.beginPath(); arcCtx.moveTo(player.x, player.y);
                    arcCtx.lineTo(player.x + Math.cos(a) * PLAYER_RADIUS, player.y + Math.sin(a) * PLAYER_RADIUS);
                    arcCtx.stroke();
                }
                // Anillos de telaraña
                for (let r = 6; r <= PLAYER_RADIUS; r += 6) {
                    arcCtx.beginPath(); arcCtx.arc(player.x, player.y, r, 0, Math.PI * 2); arcCtx.stroke();
                }
                // Ojos Spiderman
                arcCtx.save();
                arcCtx.translate(player.x, player.y);
                arcCtx.rotate(player.angle);
                arcCtx.fillStyle = '#fff'; arcCtx.strokeStyle = '#000'; arcCtx.lineWidth = 2;
                for (let side of [-1, 1]) {
                    arcCtx.beginPath();
                    arcCtx.ellipse(8, 6 * side, 5, 8, (Math.PI / 8) * side, 0, Math.PI * 2);
                    arcCtx.fill(); arcCtx.stroke();
                }
                arcCtx.restore();
            } else {
                // Ojos normales
                arcCtx.save();
                arcCtx.translate(player.x, player.y);
                arcCtx.rotate(player.angle);
                arcCtx.fillStyle = '#fff';
                arcCtx.beginPath(); arcCtx.arc(8, -5, 5, 0, Math.PI * 2); arcCtx.fill();
                arcCtx.beginPath(); arcCtx.arc(8, 5, 5, 0, Math.PI * 2); arcCtx.fill();
                arcCtx.fillStyle = '#000';
                arcCtx.beginPath(); arcCtx.arc(10, -5, 2, 0, Math.PI * 2); arcCtx.fill();
                arcCtx.beginPath(); arcCtx.arc(10, 5, 2, 0, Math.PI * 2); arcCtx.fill();
                arcCtx.restore();
            }
        }

        if (player.dashDuration > 0) {
            arcCtx.strokeStyle = 'rgba(255,255,255,0.3)';
            arcCtx.lineWidth = 3;
            arcCtx.beginPath();
            arcCtx.moveTo(player.x - player.vx * 50, player.y - player.vy * 50);
            arcCtx.lineTo(player.x, player.y);
            arcCtx.stroke();
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

        // El texto de muerte en canvas lo hemos quitado para usar el DOM overlay
    }

    // Guarda la puntuación actual y siempre sube al ranking global
    function saveHighScore() {
        const hiStr = localStorage.getItem('survivalArcHighScore');
        let hiScore = hiStr ? parseInt(hiStr) : 0;
        if (score > hiScore) {
            localStorage.setItem('survivalArcHighScore', score.toString());
        }
        // Siempre intentar subir al ranking global
        saveToLeaderboard(score, wave);
    }

    // ── Loop principal ────────────────────────────────────────────────────────────
    function arcadeLoop(ts) {
        const dt = ts - lastTime;
        lastTime = ts;
        arcadeUpdate(Math.min(dt, 100));
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

    // Botón reiniciar fue reemplazado por el botón y menú de pausa.

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

    // ── Clasificación ────────────────────────────────────────────────────────────
    // ── Clasificación Global (Supabase) ──────────────────────────────────────────
    function initLeaderboard() {
        // La tabla ya está configurada en la base de datos
    }

    async function saveToLeaderboard(newScore, newWave) {
        if (!sbClient) return;
        const playerName = localStorage.getItem('survivalPlayerName');
        if (!playerName) return;

        try {
            // 1. Buscar la entrada más alta de este jugador
            const { data: existingList, error: selectError } = await sbClient
                .from('leaderboard')
                .select('*')
                .eq('player_name', playerName)
                .order('score', { ascending: false });

            if (selectError) throw selectError;

            if (existingList && existingList.length > 0) {
                const bestEntry = existingList[0];
                // 2. Si el nuevo score es mejor, actualizamos la mejor entrada existente
                if (newScore > bestEntry.score) {
                    await sbClient
                        .from('leaderboard')
                        .update({ score: newScore, wave: newWave || 1 })
                        .eq('id', bestEntry.id);
                }
                // Si había más de una entrada (duplicados antiguos), el ranking global se limpia solo al mostrar el Top 10 mejorado
            } else {
                // 3. Si no existe, insertar nueva entrada
                await sbClient
                    .from('leaderboard')
                    .insert([{ player_name: playerName, score: newScore, wave: newWave || 1 }]);
            }
        } catch (err) {
            console.error('Leaderboard sync error:', err);
        }
    }

    async function renderLeaderboard() {
        const body = document.getElementById('leaderboard-body');
        const userBestRow = document.getElementById('user-best-row');
        
        body.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 2rem;">Cargando clasificación global... 🌍</td></tr>';
        
        const hiStr = localStorage.getItem('survivalArcHighScore');
        const hiScore = hiStr ? parseInt(hiStr) : 0;
        const myName = localStorage.getItem('survivalPlayerName') || 'Tú';
        
        userBestRow.innerHTML = `
            <div class="user-info">
                <span>🏆</span>
                <span>${myName}</span>
            </div>
            <div class="user-score">${hiScore.toLocaleString()}</div>
        `;

        if (!sbClient) {
            body.innerHTML = '<tr><td colspan="3" style="text-align:center; color: #ef4444;">Error conectando con los servidores ❌</td></tr>';
            return;
        }

        try {
            const { data, error } = await sbClient
                .from('leaderboard')
                .select('*')
                .order('score', { ascending: false })
                .limit(10);
                
            if (error) throw error;
            
            if (data && data.length > 0) {
                body.innerHTML = data.map((entry, i) => {
                    const isMe = entry.player_name === myName && entry.score === hiScore;
                    return `
                        <tr style="${isMe ? 'background: rgba(99, 102, 241, 0.15);' : ''}">
                            <td>#${i + 1}</td>
                            <td>${entry.player_name} ${isMe ? '<span style="color:var(--accent);font-size:0.75rem;margin-left:5px;">(Tú)</span>' : ''}</td>
                            <td>${entry.score.toLocaleString()}</td>
                            <td style="text-align: center;">${entry.wave || '?'}</td>
                        </tr>
                    `;
                }).join('');
            } else {
                body.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 1rem;">La clasificación está vacía.<br>¡Juega para ser el primero!</td></tr>';
            }
        } catch (err) {
            console.error('Load Leaderboard Error:', err);
            body.innerHTML = '<tr><td colspan="3" style="text-align:center; color: #ef4444;">Error de red al cargar top 10</td></tr>';
        }
    }

    // ── Lógica de Pausa y Muerte ────────────────────────────────────────────────
    const pauseOverlay = document.getElementById('arc-pause-overlay');
    const deathOverlay = document.getElementById('arc-death-overlay');
    const pausePowerList = document.getElementById('pause-power-list');

    function togglePause() {
        if (arcState === 'dead') return;
        if (arcState === 'playing') {
            arcState = 'paused';
            pauseOverlay.classList.remove('hidden');
            renderPausePowers();
        } else if (arcState === 'paused') {
            arcState = 'playing';
            pauseOverlay.classList.add('hidden');
            lastTime = performance.now(); // reset para evitar saltos
        }
    }

    function renderPausePowers() {
        if (!player) return;
        
        pausePowerList.innerHTML = (player.acquiredPowers || []).map(p => `
            <div class="pause-power-item">
                <span>${p.icon}</span>
                <span>${p.title}</span>
            </div>
        `).join('') || '<p style="color:var(--muted)">Sin mejoras aún</p>';
    }

    function showDeathOverlay() {
        document.getElementById('death-wave').textContent = wave;
        const hiStr = localStorage.getItem('survivalArcHighScore');
        const isNewHS = score > parseInt(hiStr || '0');
        document.getElementById('death-new-hs').classList.toggle('hidden', !isNewHS);

        // Pre-fill name input with saved name
        const savedName = localStorage.getItem('survivalPlayerName') || '';
        const nameInput = document.getElementById('death-player-name');
        if (nameInput) {
            nameInput.value = savedName;
            // Hide section if name already saved
            const nameSection = document.getElementById('death-name-section');
            if (nameSection) nameSection.style.display = savedName ? 'none' : 'flex';
        }

        deathOverlay.classList.remove('hidden');
    }

    // Botones
    document.getElementById('arc-pause-btn').addEventListener('click', togglePause);
    document.getElementById('btn-arc-resume').addEventListener('click', togglePause);
    document.getElementById('btn-arc-pause-menu').addEventListener('click', () => {
        arcState = 'dead';
        arcadeStop();
        pauseOverlay.classList.add('hidden');
        showScreen('menu', 'left');
    });

    // Guardar nombre en death screen
    safeBindClick('btn-save-name', () => {
        const nameInput = document.getElementById('death-player-name');
        if (!nameInput) return;
        let name = nameInput.value.trim();
        if (!name) name = 'Jugador_' + Math.floor(Math.random() * 9999);
        localStorage.setItem('survivalPlayerName', name);
        const nameSection = document.getElementById('death-name-section');
        if (nameSection) nameSection.style.display = 'none';
        // Subir la puntuación ahora que tenemos nombre con datos reales
        saveToLeaderboard(score, wave);
    });

    document.getElementById('btn-arc-death-restart').addEventListener('click', () => {
        deathOverlay.classList.add('hidden');
        arcadeInit();
    });
    document.getElementById('btn-arc-death-menu').addEventListener('click', () => {
        deathOverlay.classList.add('hidden');
        showScreen('menu', 'left');
    });

    initLeaderboard();
    window.renderLeaderboard = renderLeaderboard;

})(); // fin IIFE mini-juego
