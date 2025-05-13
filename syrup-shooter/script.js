// --- DOM Element References ---
const gameContainer = document.getElementById('game-container');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('start-button');
const playAgainButton = document.getElementById('play-again-button');
const endGameButton = document.getElementById('end-game-button'); // Reference exists
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const finalScoreDisplay = document.getElementById('final-score');
const uiElements = document.getElementById('ui-elements');
const chefElement = document.getElementById('chef');
const crosshairElement = document.getElementById('crosshair');
// Ammo/Reload Elements
const ammoDisplay = document.getElementById('ammo');
const maxAmmoDisplay = document.getElementById('max-ammo');
const reloadContainer = document.getElementById('reload-container');
const reloadTrack = document.getElementById('reload-track');
const reloadHandle = document.getElementById('reload-handle');
// Audio Elements
const backgroundMusic = document.getElementById('background-music');
const introMusic = document.getElementById('intro-music');
const gameOverMusic = document.getElementById('game-over-music');
const shootSound = document.getElementById('shoot-sound');
const hitSound = document.getElementById('hit-sound');
const reloadCompleteSound = document.getElementById('reload-complete-sound');

// --- Game State Variables ---
let gameActive = false;
let score = 0;
const GAME_DURATION = 60;
let timeLeft = GAME_DURATION;
let timerInterval = null;
let waffleSpawnInterval = null;
let animationFrameId = null;
let borderFlashInterval = null;
let borderFlashRate = 150; // Current flash rate (ms)
let waffles = [];
let syrupShots = [];
let currentMaxWaffleSpeed = 0;
// Ammo/Reload State
const MAX_AMMO = 10;
let ammoCount = MAX_AMMO;
let isReloading = false;
let isDraggingReload = false;
let reloadDragStartX = 0;
let reloadHandleStartX = 0;

// --- Game Constants ---
const WAFFLE_SIZE = 50;
const WAFFLE_SPAWN_RATE = 1200;
const WAFFLE_BASE_MIN_SPEED = 1;
const WAFFLE_BASE_MAX_SPEED = 3;
const WAFFLE_SPEED_INCREASE_INTERVAL = 10;
const WAFFLE_SPEED_INCREASE_AMOUNT = 0.5;
const SYRUP_SHOT_SIZE = 20;
const SYRUP_SHOT_SPEED = 7;
const CHEF_SHOOT_OFFSET_Y = -15;
const BORDER_FLASH_START_TIME = 13;
const BORDER_FLASH_RATE_NORMAL = 150; // ms
const BORDER_FLASH_RATE_URGENT = 75;  // ms (Faster!)
const BORDER_FLASH_URGENT_TIME = 10; // Seconds left
const DEFAULT_BORDER_COLOR = '#4a2e1a';
const RELOAD_COMPLETION_THRESHOLD = 5; // Pixels tolerance

// --- Asset Loading ---
const waffleImage = new Image();
waffleImage.src = 'assets/images/waffle.png';
waffleImage.onerror = () => console.error("Failed to load waffle.png");

const syrupImage = new Image();
syrupImage.src = 'assets/images/syrup_shot.png';
syrupImage.onerror = () => console.error("Failed to load syrup_shot.png");

// --- Utility Functions ---
function getRandom(min, max) { return Math.random() * (max - min) + min; }
function checkCollision(rect1, rect2) { /* ... (AABB collision) ... */
    return ( rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y );
}
function getMousePos(event) { /* ... (Handles mouse/touch) ... */
    const rect = gameContainer.getBoundingClientRect(); const clientX = event.clientX || (event.touches && event.touches[0] ? event.touches[0].clientX : 0); const clientY = event.clientY || (event.touches && event.touches[0] ? event.touches[0].clientY : 0); return { x: clientX - rect.left, y: clientY - rect.top };
}
function getRandomBrightColor() { return `hsl(${Math.random() * 360}, 100%, 50%)`; }

// --- Audio Handling ---
function playSound(soundElement) { /* ... (Plays sound if ready) ... */
    if (soundElement && soundElement.readyState >= 2) { soundElement.currentTime = 0; soundElement.play().catch(e => console.error("Sound play failed:", soundElement.id, e)); } else if (soundElement) { console.warn("Sound not ready:", soundElement.id); }
}
function stopSound(soundElement) { /* ... (Stops sound if ready) ... */
     if (soundElement) { soundElement.pause(); if(soundElement.readyState >= 2) { soundElement.currentTime = 0; } }
}

// --- Game Logic Functions ---

function startGame() {
    console.log("Starting game...");
    // Reset state
    score = 0; timeLeft = GAME_DURATION; waffles = []; syrupShots = []; gameActive = true;
    isReloading = false; isDraggingReload = false; ammoCount = MAX_AMMO;
    currentMaxWaffleSpeed = WAFFLE_BASE_MAX_SPEED; borderFlashRate = BORDER_FLASH_RATE_NORMAL;

    // Clear intervals/timeouts
    clearInterval(timerInterval); timerInterval = null;
    clearInterval(waffleSpawnInterval); waffleSpawnInterval = null;
    clearInterval(borderFlashInterval); borderFlashInterval = null;
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }

    // Reset UI and visuals
    scoreDisplay.textContent = score; timerDisplay.textContent = timeLeft;
    ammoDisplay.textContent = ammoCount; maxAmmoDisplay.textContent = MAX_AMMO;
    startScreen.classList.remove('active'); gameOverScreen.classList.remove('active');
    canvas.style.display = 'block';
    uiElements.style.display = 'flex'; // Show top UI bar
    endGameButton.style.display = 'block'; // ** Show End Game button **
    chefElement.style.display = 'block';
    crosshairElement.style.display = document.documentElement.clientWidth > 820 ? 'block' : 'none';
    reloadContainer.classList.remove('active'); // Hide reload bar
    document.body.style.cursor = document.documentElement.clientWidth > 820 ? 'none' : 'default';
    gameContainer.style.borderColor = DEFAULT_BORDER_COLOR;

    // Set canvas dimensions
    canvas.width = gameContainer.clientWidth; canvas.height = gameContainer.clientHeight;

    // Start game processes
    startTimer(); startWaffleSpawner(); gameLoop();

    // Audio Control
    stopSound(introMusic); stopSound(gameOverMusic); playSound(backgroundMusic);

    console.log("Game started!");
}

function endGame() {
    if (!gameActive) return;
    console.log("Ending game...");
    gameActive = false; isDraggingReload = false;

    // Stop game processes
    clearInterval(timerInterval); timerInterval = null;
    clearInterval(waffleSpawnInterval); waffleSpawnInterval = null;
    clearInterval(borderFlashInterval); borderFlashInterval = null;
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }

    // Audio Control
    stopSound(backgroundMusic); playSound(gameOverMusic);

    // Update UI
    finalScoreDisplay.textContent = score;
    canvas.style.display = 'none';
    uiElements.style.display = 'none'; // Hide top UI bar
    endGameButton.style.display = 'none'; // ** Hide End Game button **
    chefElement.style.display = 'none'; crosshairElement.style.display = 'none';
    reloadContainer.classList.remove('active'); // Hide reload bar
    gameOverScreen.classList.add('active');
    document.body.style.cursor = 'default'; gameContainer.style.borderColor = DEFAULT_BORDER_COLOR;

    // Clean up potential dangling event listeners from reload drag
    document.removeEventListener('mousemove', handleReloadDragMove);
    document.removeEventListener('mouseup', handleReloadDragEnd);
    document.removeEventListener('touchmove', handleReloadDragMove);
    document.removeEventListener('touchend', handleReloadDragEnd);
    document.body.classList.remove('dragging');

    console.log("Game ended. Final Score:", score);
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!gameActive) { clearInterval(timerInterval); return; }
        timeLeft--; timerDisplay.textContent = timeLeft;

        // --- Progressive Waffle Speed ---
        const elapsedSeconds = GAME_DURATION - timeLeft;
        if (elapsedSeconds > 0 && elapsedSeconds % WAFFLE_SPEED_INCREASE_INTERVAL === 0) {
             if(currentMaxWaffleSpeed < WAFFLE_BASE_MAX_SPEED * 3) { currentMaxWaffleSpeed += WAFFLE_SPEED_INCREASE_AMOUNT; }
        }

        // --- Border Flashing ---
        if (timeLeft <= BORDER_FLASH_URGENT_TIME && borderFlashRate !== BORDER_FLASH_RATE_URGENT) {
             borderFlashRate = BORDER_FLASH_RATE_URGENT; clearInterval(borderFlashInterval); borderFlashInterval = null;
        }
        if (elapsedSeconds >= BORDER_FLASH_START_TIME && borderFlashInterval === null) {
            borderFlashInterval = setInterval(() => {
                if (!gameActive) { clearInterval(borderFlashInterval); borderFlashInterval = null; gameContainer.style.borderColor = DEFAULT_BORDER_COLOR; return; }
                gameContainer.style.borderColor = getRandomBrightColor();
            }, borderFlashRate);
        }

        // --- End Game Check ---
        if (timeLeft <= 0) { endGame(); }
    }, 1000);
}

function startWaffleSpawner() {
    clearInterval(waffleSpawnInterval);
    waffleSpawnInterval = setInterval(createWaffle, WAFFLE_SPAWN_RATE);
    createWaffle();
}

function createWaffle() {
    if (!gameActive) return;
    /* ... (Waffle creation logic - unchanged) ... */
    const size = WAFFLE_SIZE; let x, y; let dx, dy; const currentMinSpeed = WAFFLE_BASE_MIN_SPEED; const maxSpeed = currentMaxWaffleSpeed; const edge = Math.floor(Math.random() * 4);
    switch (edge) { case 0: x = getRandom(0, canvas.width - size); y = -size; dx = getRandom(-maxSpeed, maxSpeed); dy = getRandom(currentMinSpeed, maxSpeed); break; case 1: x = canvas.width; y = getRandom(0, canvas.height - size); dx = getRandom(-maxSpeed, -currentMinSpeed); dy = getRandom(-maxSpeed, maxSpeed); break; case 2: x = getRandom(0, canvas.width - size); y = canvas.height; dx = getRandom(-maxSpeed, maxSpeed); dy = getRandom(-maxSpeed, -currentMinSpeed); break; case 3: x = -size; y = getRandom(0, canvas.height - size); dx = getRandom(currentMinSpeed, maxSpeed); dy = getRandom(-maxSpeed, maxSpeed); break; }
    if (Math.abs(dx) < currentMinSpeed / 2 && Math.abs(dy) < currentMinSpeed / 2) { dx = dx >= 0 ? currentMinSpeed : -currentMinSpeed; dy = dy >= 0 ? currentMinSpeed : -currentMinSpeed; }
    waffles.push({ x, y, width: size, height: size, dx, dy });
}

function shootSyrup(event) {
    if (!gameActive || isReloading) return;
    if (ammoCount <= 0) { startReload(); return; }

    ammoCount--; ammoDisplay.textContent = ammoCount;
    playSound(shootSound);

    // Calculate Shot Trajectory
    const targetPos = getMousePos(event);
    const chefRect = chefElement.getBoundingClientRect(); const containerRect = gameContainer.getBoundingClientRect();
    const startX = (chefRect.left - containerRect.left) + (chefRect.width / 2);
    const startY = (chefRect.top - containerRect.top) + (chefRect.height / 2) + CHEF_SHOOT_OFFSET_Y;
    const angle = Math.atan2(targetPos.y - startY, targetPos.x - startX);
    const dx = Math.cos(angle) * SYRUP_SHOT_SPEED; const dy = Math.sin(angle) * SYRUP_SHOT_SPEED;

    syrupShots.push({ x: startX - SYRUP_SHOT_SIZE / 2, y: startY - SYRUP_SHOT_SIZE / 2, width: SYRUP_SHOT_SIZE, height: SYRUP_SHOT_SIZE, dx, dy });

    if (ammoCount <= 0) { startReload(); }
}

function updateCrosshair(event) {
    if (!gameActive || document.documentElement.clientWidth <= 820) { crosshairElement.style.display = 'none'; return; };
    crosshairElement.style.display = 'block';
    const mousePos = getMousePos(event);
    crosshairElement.style.left = `${mousePos.x}px`; crosshairElement.style.top = `${mousePos.y}px`;
}

// --- Reload Mechanic Functions ---

function startReload() {
    if (isReloading || !gameActive) return;
    console.log("Starting reload...");
    isReloading = true; reloadContainer.classList.add('active');
    reloadHandle.style.left = '0px';
}

function completeReload() {
    console.log("Reload complete!");
    isReloading = false; isDraggingReload = false;
    ammoCount = MAX_AMMO; ammoDisplay.textContent = ammoCount;
    reloadContainer.classList.remove('active');
    playSound(reloadCompleteSound);

    // Clean up drag listeners and styles
    document.body.classList.remove('dragging');
    document.removeEventListener('mousemove', handleReloadDragMove);
    document.removeEventListener('mouseup', handleReloadDragEnd);
    document.removeEventListener('touchmove', handleReloadDragMove);
    document.removeEventListener('touchend', handleReloadDragEnd);
}

// --- Reload Drag Event Handlers ---

function handleReloadDragStart(event) {
    if (!isReloading) return;
    isDraggingReload = true; reloadHandle.style.cursor = 'grabbing'; document.body.classList.add('dragging');
    if (event.type === 'mousedown') { reloadDragStartX = event.clientX; }
    else if (event.type === 'touchstart') { reloadDragStartX = event.touches[0].clientX; event.preventDefault(); }
    reloadHandleStartX = reloadHandle.offsetLeft;
    document.addEventListener('mousemove', handleReloadDragMove); document.addEventListener('mouseup', handleReloadDragEnd);
    document.addEventListener('touchmove', handleReloadDragMove, { passive: false }); document.addEventListener('touchend', handleReloadDragEnd);
}

function handleReloadDragMove(event) {
    if (!isDraggingReload) return;
    let currentX;
    if (event.type === 'mousemove') { currentX = event.clientX; }
    else if (event.type === 'touchmove') { currentX = event.touches[0].clientX; event.preventDefault(); }
    else { return; }
    const dx = currentX - reloadDragStartX; let newLeft = reloadHandleStartX + dx;
    const minLeft = 0; const maxLeft = reloadTrack.offsetWidth - reloadHandle.offsetWidth;
    newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
    reloadHandle.style.left = `${newLeft}px`;
}

function handleReloadDragEnd(event) {
    if (!isDraggingReload) return;
    isDraggingReload = false; reloadHandle.style.cursor = 'grab'; document.body.classList.remove('dragging');
    document.removeEventListener('mousemove', handleReloadDragMove); document.removeEventListener('mouseup', handleReloadDragEnd);
    document.removeEventListener('touchmove', handleReloadDragMove); document.removeEventListener('touchend', handleReloadDragEnd);
    const currentLeft = reloadHandle.offsetLeft; const maxLeft = reloadTrack.offsetWidth - reloadHandle.offsetWidth;
    if (currentLeft >= maxLeft - RELOAD_COMPLETION_THRESHOLD) { completeReload(); }
}


// --- Main Game Loop ---
function gameLoop() {
    if (!gameActive) { animationFrameId = null; return; }
    animationFrameId = requestAnimationFrame(gameLoop);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Update and Draw Waffles
    waffles.forEach((waffle) => { /* ... (move, bounce, draw waffle with fallback) ... */
        waffle.x += waffle.dx; waffle.y += waffle.dy;
        if (waffle.x <= 0 || waffle.x + waffle.width >= canvas.width) { waffle.dx *= -1; waffle.x = Math.max(0, Math.min(waffle.x, canvas.width - waffle.width)); }
        if (waffle.y <= 0 || waffle.y + waffle.height >= canvas.height) { waffle.dy *= -1; waffle.y = Math.max(0, Math.min(waffle.y, canvas.height - waffle.height)); }
        try { if (waffleImage.complete && waffleImage.naturalHeight !== 0) { ctx.drawImage(waffleImage, waffle.x, waffle.y, waffle.width, waffle.height); } else { ctx.fillStyle = 'orange'; ctx.fillRect(waffle.x, waffle.y, waffle.width, waffle.height); } } catch (e) { console.error("Error drawing waffle:", e); ctx.fillStyle = 'orange'; ctx.fillRect(waffle.x, waffle.y, waffle.width, waffle.height); }
    });

    // 2. Update and Draw Syrup Shots & Check Collisions
    for (let i = syrupShots.length - 1; i >= 0; i--) { /* ... (move, draw shot, remove if offscreen, check collision) ... */
        const shot = syrupShots[i]; shot.x += shot.dx; shot.y += shot.dy;
        try { if (syrupImage.complete && syrupImage.naturalHeight !== 0) { ctx.drawImage(syrupImage, shot.x, shot.y, shot.width, shot.height); } else { ctx.fillStyle = 'brown'; ctx.fillRect(shot.x, shot.y, shot.width, shot.height); } } catch (e) { console.error("Error drawing syrup shot:", e); ctx.fillStyle = 'brown'; ctx.fillRect(shot.x, shot.y, shot.width, shot.height); }
        if (shot.x < -shot.width || shot.x > canvas.width || shot.y < -shot.height || shot.y > canvas.height) { syrupShots.splice(i, 1); continue; }
        for (let j = waffles.length - 1; j >= 0; j--) {
            const waffle = waffles[j];
            if (checkCollision(shot, waffle)) {
                waffles.splice(j, 1); syrupShots.splice(i, 1); score++; scoreDisplay.textContent = score;
                playSound(hitSound); break;
            }
        }
    }
}

// --- Event Listeners Setup ---
startButton.addEventListener('click', startGame);
playAgainButton.addEventListener('click', startGame);
endGameButton.addEventListener('click', endGame);
gameContainer.addEventListener('click', shootSyrup);
gameContainer.addEventListener('mousemove', updateCrosshair);
reloadHandle.addEventListener('mousedown', handleReloadDragStart);
reloadHandle.addEventListener('touchstart', handleReloadDragStart, { passive: false });

// --- Initial Page Setup ---
function initializeUI() {
    // Set initial screen visibility & UI text
    startScreen.classList.add('active'); gameOverScreen.classList.remove('active');
    canvas.style.display = 'none';
    uiElements.style.display = 'none'; // Hide top bar
    endGameButton.style.display = 'none'; // ** Hide End Game button **
    chefElement.style.display = 'none'; crosshairElement.style.display = 'none';
    reloadContainer.classList.remove('active'); // Hide reload bar
    document.body.style.cursor = 'default'; gameContainer.style.borderColor = DEFAULT_BORDER_COLOR;
    ammoDisplay.textContent = MAX_AMMO; maxAmmoDisplay.textContent = MAX_AMMO;
    scoreDisplay.textContent = 0; timerDisplay.textContent = GAME_DURATION;

    // Clear intervals
    clearInterval(timerInterval); timerInterval = null;
    clearInterval(waffleSpawnInterval); waffleSpawnInterval = null;
    clearInterval(borderFlashInterval); borderFlashInterval = null;

    // --- Initial Audio Setup ---
    stopSound(backgroundMusic); stopSound(gameOverMusic);
    introMusic.play().then(() => { console.log("Intro music playing."); })
    .catch(e => { console.warn("Intro music autoplay failed. Waiting for user interaction.", e); });
}

// Run the initial UI setup when the script loads
initializeUI();
console.log("Syrup Shooter game initialized. Waiting for start.");

