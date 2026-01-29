document.addEventListener('DOMContentLoaded', () => {
    // Game State
    let bag = [];
    let isDrawing = false;
    
    // DOM Elements
    const bagBtn = document.getElementById('bagBtn');
    const resetBtn = document.getElementById('resetBtn');
    const currentTileEl = document.getElementById('currentTile');
    const shakeMsgEl = document.getElementById('shakeMsg');
    const remainingInfoEl = document.getElementById('remainingCount');
    const historyGrid = document.getElementById('historyGrid');

    // Initialize Game
    initGame();

    // Event Listeners
    bagBtn.addEventListener('click', handleDrawRequest);
    resetBtn.addEventListener('click', () => {
        if(confirm('Restart game?')) {
            initGame();
        }
    });

    function initGame() {
        bag = generateTiles();
        isDrawing = false;
        
        // Clear UI
        historyGrid.innerHTML = '';
        currentTileEl.classList.add('hidden');
        shakeMsgEl.classList.add('hidden');
        updateRemainingCount();
        
        // Remove any residual animation classes
        bagBtn.classList.remove('shaking');
    }

    function generateTiles() {
        const tiles = [];
        
        // 1-10: 1 each
        for (let i = 1; i <= 10; i++) tiles.push(i);
        
        // 11-19: 2 each
        for (let i = 11; i <= 19; i++) {
            tiles.push(i);
            tiles.push(i);
        }
        
        // 20-30: 1 each
        for (let i = 20; i <= 30; i++) tiles.push(i);
        
        // Star (represented as '★')
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
            alert('Game Over! All tiles have been drawn.');
            return;
        }

        isDrawing = true;
        
        // hide old result immediately
        currentTileEl.classList.add('hidden');
        shakeMsgEl.classList.remove('hidden');

        // Start Shake Animation
        bagBtn.classList.add('shaking');

        // Wait for animation (e.g., 600ms)
        setTimeout(() => {
            performDraw();
        }, 600);
    }

    function performDraw() {
        bagBtn.classList.remove('shaking');
        shakeMsgEl.classList.add('hidden');
        
        const drawnTile = bag.pop(); // Remove from end (it's shuffled)
        
        displayTile(drawnTile);
        addToHistory(drawnTile);
        updateRemainingCount();
        
        isDrawing = false;
    }

    function displayTile(value) {
        currentTileEl.textContent = value;
        currentTileEl.classList.remove('hidden');
        
        // Handle star logic if needed for styles
        if (value === '★') {
            currentTileEl.classList.add('is-star');
        } else {
            currentTileEl.classList.remove('is-star');
        }
    }

    function addToHistory(value) {
        const miniTile = document.createElement('div');
        miniTile.className = 'mini-tile';
        miniTile.textContent = value;
        if (value === '★') {
            miniTile.classList.add('is-star');
        }
        
        // Prepend to show newest first? Or append? 
        // "Stacked" usually implies piling up. Let's append for chronological order, or prepend for "stack".
        // The user said "차곡차곡 쌓여서" (stacked up). Usually implies a pile. 
        // Let's use PREPEND so the newest is at the top/first, so it's easily visible? 
        // Actually, for a board game tracking, seeing the *sequence* is often left-to-right.
        // Let's just append (normal flow) but ensure the grid handles it well. 
        // Wait, "stacked up" could mean a visual stack. 
        // I will use `prepend` so the most recent is the first item in the grid, easiest to check.
        // On second thought, people marking their sheets usually want the full list visible.
        // I'll stick to `appendChild` (Left -> Right, Top -> Bottom) as it matches reading order.
        historyGrid.appendChild(miniTile);
        
        // Auto-scroll to bottom
        historyGrid.scrollTop = historyGrid.scrollHeight;
    }

    function updateRemainingCount() {
        remainingInfoEl.textContent = `Remaining: ${bag.length}`;
    }
});
