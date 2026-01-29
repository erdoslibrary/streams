document.addEventListener('DOMContentLoaded', () => {
    // Game State
    let bag = [];
    let isDrawing = false;

    // DOM Elements
    const bagBtn = document.getElementById('bagBtn');
    const resetBtn = document.getElementById('resetBtn');
    const currentTileEl = document.getElementById('currentTile');
    const remainingInfoEl = document.getElementById('remainingCount');
    const historyGrid = document.getElementById('historyGrid');
    const rabbitImg = document.getElementById('rabbit');
    const confettiCanvas = document.getElementById('confetti-canvas');
    const ctx = confettiCanvas.getContext('2d');

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
    bagBtn.addEventListener('click', handleDrawRequest);
    resetBtn.addEventListener('click', () => {
        if (confirm('창고를 정리하고 처음부터 다시 시작할까요?')) {
            initGame();
        }
    });

    function initGame() {
        bag = generateTiles();
        isDrawing = false;

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
        if (bag.length === 0) {
            alert('꿀떡이 다 떨어졌어요!');
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
        updateRemainingCount();
        triggerConfetti(); // 🎉

        isDrawing = false;
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
        remainingInfoEl.textContent = `🍡 ${bag.length} / 40`;
    }

    // --- Simple Confetti System ---
    const particles = [];
    const colors = ['#FF6B6B', '#FFD93D', '#A8E6CF', '#FFB7B2', '#FFF'];

    function triggerConfetti() {
        // Spawn 30 particles from center
        for (let i = 0; i < 30; i++) {
            particles.push({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 1) * 10 - 5, // Upward burst
                size: Math.random() * 8 + 4, // chunky pixel confetti
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
