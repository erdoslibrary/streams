document.addEventListener('DOMContentLoaded', () => {
    // Game State
    let bag = [];
    let isDrawing = false;
    let turnCount = 0;
    const MAX_TURNS = 20;

    // Sound Context
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();

    function playSound(type) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        if (type === 'pop') {
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        } else if (type === 'fanfare') {
            // Simple Arpeggio
            const now = audioCtx.currentTime;
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.connect(g);
                g.connect(audioCtx.destination);
                o.frequency.value = freq;
                g.gain.setValueAtTime(0.3, now + i * 0.1);
                g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
                o.start(now + i * 0.1);
                o.stop(now + i * 0.1 + 0.3);
            });
        }
    }

    // DOM Elements
    const bagBtn = document.getElementById('bagBtn');
    const resetBtn = document.getElementById('resetBtn');
    const currentTileEl = document.getElementById('currentTile');
    const remainingInfoEl = document.getElementById('remainingCount');
    const historyGrid = document.getElementById('historyGrid');
    const rabbitImg = document.getElementById('rabbit');
    const confettiCanvas = document.getElementById('confetti-canvas');
    const ctx = confettiCanvas.getContext('2d');

    // Modal Elements
    const modal = document.getElementById('gameModal');
    const modalRestartBtn = document.getElementById('modalRestartBtn');
    const modalScore = document.getElementById('modalScore');

    // Resize canvas
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    });

    // Initialize Game
    initGame();

    // Event Listeners
    // Event Listeners
    bagBtn.addEventListener('click', handleDrawRequest);

    // Resume audio context on first user interaction
    document.addEventListener('click', () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }, { once: true });

    resetBtn.addEventListener('click', () => {
        if (confirm('창고를 정리하고 처음부터 다시 시작할까요?')) {
            initGame();
        }
    });

    modalRestartBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        initGame();
    });

    function initGame() {
        bag = generateTiles();
        isDrawing = false;
        turnCount = 0;

        // Clear UI
        historyGrid.innerHTML = '';
        currentTileEl.className = 'tile hidden';
        currentTileEl.textContent = '?';
        updateRemainingCount();
    }

    function generateTiles() {
        const tiles = [];
        // 1-10: 1 each
        for (let i = 1; i <= 10; i++) tiles.push(i);
        // 11-19: 2 each
        for (let i = 11; i <= 19; i++) { tiles.push(i); tiles.push(i); }
        // 20-30: 1 each
        for (let i = 20; i <= 30; i++) tiles.push(i);
        // Star
        tiles.push('★');

        return shuffle(tiles);
    }

    function shuffle(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex != 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    function handleDrawRequest() {
        if (isDrawing) return;
        if (turnCount >= MAX_TURNS) {
            // Should be handled by modal, but just in case
            return;
        }

        isDrawing = true;

        // Squeeze Animation
        bagBtn.classList.add('squeeze-anim');

        // Rabbit Reaction (Jump/Twitch)
        rabbitImg.style.transform = "scale(1.1) translateY(-10px)";
        setTimeout(() => rabbitImg.style.transform = "scale(1) translateY(0)", 200);

        // Delay for animation
        setTimeout(() => {
            performDraw();
            bagBtn.classList.remove('squeeze-anim');
        }, 300);
    }

    function performDraw() {
        const drawnTile = bag.pop();

        displayTile(drawnTile);
        addToHistory(drawnTile);

        turnCount++;
        updateRemainingCount();
        triggerConfetti(); // 🎉
        playSound('pop');

        isDrawing = false;

        if (turnCount >= MAX_TURNS) {
            setTimeout(endGame, 1000);
        }
    }

    function endGame() {
        playSound('fanfare');
        modalScore.textContent = `총 수확: ${turnCount}개 / 20턴`;
        modal.classList.remove('hidden');
    }

    function getTileColorClass(value) {
        if (value === '★') return 'tile-gold';
        if (value >= 1 && value <= 10) return 'tile-white';
        if (value >= 11 && value <= 19) return 'tile-pink';
        if (value >= 20 && value <= 30) return 'tile-green';
        return 'tile-white';
    }

    function displayTile(value) {
        const colorClass = getTileColorClass(value);
        currentTileEl.className = `tile ${colorClass}`; // Reset classes, add specific one
        currentTileEl.textContent = value;

        // Re-trigger animation
        currentTileEl.classList.remove('hidden');

        // Pop effect via CSS transition is automatic if we remove hidden
        // To enforce re-play if needed, we could toggle a class, but simple removal works with transition.
    }

    function addToHistory(value) {
        const miniTile = document.createElement('div');
        miniTile.className = `mini-tile ${getTileColorClass(value)}`;
        miniTile.textContent = value;

        // Append
        historyGrid.appendChild(miniTile);
        historyGrid.scrollTop = historyGrid.scrollHeight;
    }

    function updateRemainingCount() {
        remainingInfoEl.textContent = `진행: ${turnCount} / ${MAX_TURNS}`;
    }

    // --- Simple Confetti System ---
    const particles = [];
    const colors = ['#FF6B6B', '#FFD93D', '#A8E6CF', '#FFB7B2', '#FFF'];

    function triggerConfetti() {
        // Get bag position
        const bagRect = bagBtn.getBoundingClientRect();
        const spawnX = bagRect.left + (bagRect.width / 2);
        const spawnY = bagRect.top; // Spawn from top of bag

        // Spawn 30 particles
        for (let i = 0; i < 30; i++) {
            particles.push({
                x: spawnX,
                y: spawnY,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 1) * 12 - 8, // Stronger upward burst
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 100
            });
        }
        requestAnimationFrame(updateConfetti);
    }

    function updateConfetti() {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.5; // Gravity
            p.life--;

            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size); // Square pixels
        }

        // Remove dead particles
        for (let i = particles.length - 1; i >= 0; i--) {
            if (particles[i].life <= 0) particles.splice(i, 1);
        }

        if (particles.length > 0) requestAnimationFrame(updateConfetti);
    }
});
