/**
 * 이 파일은 “주머니를 클릭하면 랜덤 타일을 뽑는” 작은 게임 로직입니다.
 *
 * =====================================
 * 초보자가 사전에 알면 좋은 JS 개념 (사전 지식)
 * =====================================
 *
 * 1) DOM (Document Object Model)
 *  - HTML 문서를 자바스크립트에서 다루기 위한 객체 구조입니다.
 *  - document.getElementById('id')로 HTML 요소를 가져와서 글자/스타일/클래스를 바꿀 수 있어요.
 *
 * 2) 이벤트(Event)와 이벤트 리스너(Event Listener)
 *  - “클릭했을 때”, “화면 크기가 바뀌었을 때” 같은 일을 이벤트라고 해요.
 *  - addEventListener('click', 함수) 형태로 이벤트가 일어났을 때 실행할 함수를 연결합니다.
 *
 * 3) 배열(Array)과 스택처럼 쓰기(push/pop)
 *  - 배열은 여러 값을 한 번에 담는 자료구조입니다. 예: [1, 2, 3]
 *  - push는 맨 뒤에 추가, pop은 맨 뒤의 값을 꺼내면서 제거합니다.
 *  - 이 게임에서는 bag(주머니) 배열을 섞어두고 pop()으로 “뽑기”를 구현합니다.
 *
 * 4) 비동기/타이머(setTimeout)와 애니메이션
 *  - setTimeout(함수, ms)는 “ms 밀리초 후에 함수 실행”입니다. (1초 = 1000ms)
 *  - 클릭 → 애니메이션 → 0.3초 뒤 실제 뽑기 같은 흐름을 만들 때 자주 씁니다.
 *
 * 5) 템플릿 문자열(Template Literal)
 *  - 백틱(`)을 쓰면 문자열 안에 ${변수}를 넣을 수 있어요.
 *    예: `진행: ${turnCount} / ${MAX_TURNS}`
 *
 * 6) Canvas(캔버스)
 *  - <canvas>는 자바스크립트로 픽셀 그림을 그릴 수 있는 영역입니다.
 *  - ctx.fillRect(x, y, w, h)로 사각형을 그려 “색종이(컨페티)” 효과를 만들어요.
 *
 * 7) Web Audio API
 *  - 브라우저에서 소리를 만들고 제어할 수 있는 API입니다.
 *  - “사용자 상호작용(클릭 등) 전에는 소리를 막는 정책” 때문에 resume()이 필요할 수 있어요.
 */

// DOMContentLoaded: HTML이 전부 파싱(읽기)된 뒤에 JS를 실행하겠다는 뜻입니다.
// (HTML 요소를 가져오기 전에 JS가 실행되면 요소가 아직 없어서 null이 될 수 있어요.)
document.addEventListener('DOMContentLoaded', () => {
    // =========================
    // 1) 게임 상태(Game State)
    // =========================

    let bag = []; // 주머니(뽑기용 배열). 숫자/별(★) 타일이 들어갑니다.
    let isDrawing = false; // “뽑는 중인지” 표시하는 잠금장치(연타 방지).
    let turnCount = 0; // 지금까지 뽑은 횟수(턴).
    const MAX_TURNS = 20; // 게임은 20번 뽑으면 종료.

    // =========================
    // 2) 사운드(Web Audio)
    // =========================

    // 브라우저마다 AudioContext 이름이 다를 수 있어 “표준/구버전” 둘 다 지원합니다.
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    // 실제 오디오 엔진(컨텍스트)을 생성합니다.
    const audioCtx = new AudioContext();

    // type에 따라 다른 효과음을 재생하는 함수입니다.
    function playSound(type) {
        // 일부 브라우저는 “사용자 상호작용 전에는 오디오가 suspended(정지)” 상태일 수 있어요.
        // 그래서 소리를 내기 전에 resume()로 깨워줍니다.
        if (audioCtx.state === 'suspended') audioCtx.resume();

        // Oscillator(발진기): 특정 주파수의 소리를 만들어냅니다. (삐- 소리)
        const osc = audioCtx.createOscillator();
        // GainNode(볼륨): 소리의 크기를 제어합니다.
        const gainNode = audioCtx.createGain();

        // 소리 흐름: 발진기(osc) → 볼륨(gain) → 스피커(destination)
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // “뽑기” 효과음
        if (type === 'pop') {
            // 시작 주파수 600Hz
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            // 0.1초 동안 100Hz까지 지수적으로 내려가며 “퐁” 같은 느낌
            osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);

            // 볼륨도 처음 크게(0.5) 시작해서 빠르게 줄입니다.
            gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

            // 소리 시작
            osc.start();
            // 0.1초 후 소리 종료
            osc.stop(audioCtx.currentTime + 0.1);
        } else if (type === 'fanfare') {
            // “게임 종료” 팬파레(간단한 아르페지오)
            const now = audioCtx.currentTime; // 기준 시간(지금) 저장

            // 주파수 배열을 순서대로 재생합니다.
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
                // fanfare는 여러 음을 빠르게 연속 재생하므로 발진기/볼륨을 음마다 새로 만듭니다.
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();

                // 음의 연결(oscillator → gain → speaker)
                o.connect(g);
                g.connect(audioCtx.destination);

                // 해당 음의 주파수 설정
                o.frequency.value = freq;

                // i에 따라 0.1초 간격으로 시작하도록 예약하고, 0.3초 동안 감쇠시킵니다.
                g.gain.setValueAtTime(0.3, now + i * 0.1);
                g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);

                // 예약된 시간에 소리 시작/종료
                o.start(now + i * 0.1);
                o.stop(now + i * 0.1 + 0.3);
            });
        }
    }

    // =========================
    // 3) HTML 요소(DOM) 가져오기
    // =========================

    const bagBtn = document.getElementById('bagBtn'); // 주머니 클릭 영역
    const resetBtn = document.getElementById('resetBtn'); // 리셋 버튼
    const currentTileEl = document.getElementById('currentTile'); // “방금 뽑은 타일” 표시
    const remainingInfoEl = document.getElementById('remainingCount'); // 진행 표시(몇 턴 했는지)
    const historyGrid = document.getElementById('historyGrid'); // 히스토리(뽑은 타일 목록) 표시
    const rabbitImg = document.getElementById('rabbit'); // 토끼 이미지(반응 애니메이션용)
    const confettiCanvas = document.getElementById('confetti-canvas'); // 컨페티를 그릴 캔버스
    const ctx = confettiCanvas.getContext('2d'); // 캔버스에 그림을 그릴 2D 컨텍스트

    // =========================
    // 4) 모달(게임 종료 팝업) 요소
    // =========================

    const modal = document.getElementById('gameModal'); // 모달 전체
    const modalRestartBtn = document.getElementById('modalRestartBtn'); // 모달 안 “다시하기” 버튼
    const modalScore = document.getElementById('modalScore'); // 모달 안 점수(문구) 영역

    // =========================
    // 5) 캔버스 크기 맞추기
    // =========================

    // 캔버스는 화면 전체에 컨페티를 뿌릴 것이므로 현재 창 크기로 맞춥니다.
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    // 창 크기가 바뀌면(예: 모바일 회전, 브라우저 리사이즈) 캔버스도 같이 맞춥니다.
    window.addEventListener('resize', () => {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    });

    // =========================
    // 6) 게임 시작(초기화)
    // =========================

    initGame(); // 페이지가 열리면 바로 게임을 초기 상태로 만듭니다.

    // =========================
    // 7) 이벤트 연결
    // =========================

    // 주머니를 클릭하면 타일을 뽑습니다.
    bagBtn.addEventListener('click', handleDrawRequest);

    // 오디오 정책 때문에 “첫 사용자 상호작용” 때 오디오를 한 번 resume()해두면 안정적입니다.
    // { once: true }는 “딱 한 번만 실행”하겠다는 옵션입니다.
    document.addEventListener(
        'click',
        () => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
        },
        { once: true }
    );

    // 리셋 버튼을 누르면 정말 초기화할지 confirm(확인창)으로 물어봅니다.
    resetBtn.addEventListener('click', () => {
        if (confirm('창고를 정리하고 처음부터 다시 시작할까요?')) {
            initGame();
        }
    });

    // 모달의 “다시하기”를 누르면 모달을 숨기고 게임을 리셋합니다.
    modalRestartBtn.addEventListener('click', () => {
        modal.classList.add('hidden'); // CSS의 .hidden 클래스로 숨김 처리
        initGame(); // 새 게임 시작
    });

    // -------------------------
    // 게임 초기화 함수
    // -------------------------
    function initGame() {
        bag = generateTiles(); // 타일을 생성하고 섞어서 주머니에 넣습니다.
        isDrawing = false; // 뽑기 잠금 해제
        turnCount = 0; // 턴 카운트 초기화

        // UI(화면)도 초기 상태로 되돌립니다.
        historyGrid.innerHTML = ''; // 히스토리 영역 비우기
        currentTileEl.className = 'tile hidden'; // 타일을 숨긴 상태로
        currentTileEl.textContent = '?'; // 아직 뽑기 전이니 ? 표시
        updateRemainingCount(); // “진행: 0 / 20” 같은 문구 갱신
    }

    // -------------------------
    // 타일 생성 함수
    // -------------------------
    function generateTiles() {
        const tiles = []; // 여기서 타일 목록을 만들고 마지막에 섞습니다.

        // 1~10은 각각 1개씩 들어갑니다.
        for (let i = 1; i <= 10; i++) tiles.push(i);

        // 11~19는 각각 2개씩 들어갑니다.
        for (let i = 11; i <= 19; i++) {
            tiles.push(i);
            tiles.push(i);
        }

        // 20~30은 각각 1개씩 들어갑니다.
        for (let i = 20; i <= 30; i++) tiles.push(i);

        // 조커(별) 1개
        tiles.push('★');

        // 만든 배열을 섞어서(랜덤) 반환합니다.
        return shuffle(tiles);
    }

    // -------------------------
    // 배열 섞기(셔플) 함수
    // -------------------------
    function shuffle(array) {
        // Fisher–Yates shuffle 알고리즘: 배열을 공정하게 섞을 때 자주 쓰는 방식입니다.
        let currentIndex = array.length; // 아직 섞지 않은 구간의 길이
        let randomIndex; // 그때그때 뽑을 랜덤 인덱스

        // currentIndex가 0이 될 때까지 반복합니다.
        while (currentIndex !== 0) {
            // 0 이상 currentIndex 미만의 랜덤 정수
            randomIndex = Math.floor(Math.random() * currentIndex);

            // 아직 섞지 않은 구간을 1 줄입니다.
            currentIndex--;

            // 구조 분해 할당을 이용해 두 값을 서로 바꿉니다(swap).
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }

        return array; // 섞인 배열을 반환
    }

    // -------------------------
    // “뽑기 요청” 처리
    // -------------------------
    function handleDrawRequest() {
        // 이미 뽑는 중이면(애니메이션 중) 추가 클릭을 무시합니다.
        if (isDrawing) return;

        // 이미 20턴을 다 했다면 더 이상 진행하지 않습니다.
        if (turnCount >= MAX_TURNS) {
            // 원래는 모달이 뜨면서 막히지만, 혹시 모를 상황 대비
            return;
        }

        // 이제부터 “뽑는 중” 상태로 잠급니다.
        isDrawing = true;

        // 주머니에 CSS 애니메이션 클래스를 붙여 “꾹 눌림” 효과를 줍니다.
        bagBtn.classList.add('squeeze-anim');

        // 토끼를 잠깐 키우고 위로 올려서 반응(점프) 느낌을 줍니다.
        rabbitImg.style.transform = 'scale(1.1) translateY(-10px)';

        // 0.2초 뒤 원래 위치로 되돌립니다.
        setTimeout(() => (rabbitImg.style.transform = 'scale(1) translateY(0)'), 200);

        // 애니메이션이 보일 시간을 조금 준 뒤(0.3초) 실제 뽑기를 수행합니다.
        setTimeout(() => {
            performDraw(); // 실제로 타일을 뽑고 UI를 갱신
            bagBtn.classList.remove('squeeze-anim'); // 주머니 애니메이션 클래스 제거
        }, 300);
    }

    // -------------------------
    // 실제 뽑기 수행
    // -------------------------
    function performDraw() {
        // bag 배열의 “맨 뒤”를 꺼내며 제거(pop) → 랜덤으로 섞여 있으니 랜덤 뽑기와 같아요.
        const drawnTile = bag.pop();

        // 큰 타일(현재 뽑은 타일) 표시 업데이트
        displayTile(drawnTile);

        // 히스토리(작은 타일 목록)에 추가
        addToHistory(drawnTile);

        // 한 턴 진행
        turnCount++;

        // 화면에 진행 상황 표시를 갱신
        updateRemainingCount();

        // 컨페티 효과(화면에 색종이)
        triggerConfetti();

        // 뽑기 효과음
        playSound('pop');

        // 뽑기 종료 → 다시 클릭 가능
        isDrawing = false;

        // 20턴이 끝났으면 1초 뒤 게임 종료 처리(모달 띄움)
        if (turnCount >= MAX_TURNS) {
            setTimeout(endGame, 1000);
        }
    }

    // -------------------------
    // 게임 종료 처리(모달 표시)
    // -------------------------
    function endGame() {
        playSound('fanfare'); // 종료 팬파레
        modalScore.textContent = `총 수확: ${turnCount}개 / 20턴`; // 결과 문구 표시
        modal.classList.remove('hidden'); // 모달 보이기
    }

    // -------------------------
    // 타일 값에 따른 색상 클래스 결정
    // -------------------------
    function getTileColorClass(value) {
        // 별(조커)은 금색
        if (value === '★') return 'tile-gold';
        // 1~10은 흰색
        if (value >= 1 && value <= 10) return 'tile-white';
        // 11~19는 분홍색
        if (value >= 11 && value <= 19) return 'tile-pink';
        // 20~30은 초록색
        if (value >= 20 && value <= 30) return 'tile-green';
        // 예외 상황이면 기본 흰색
        return 'tile-white';
    }

    // -------------------------
    // “현재 뽑은 타일” 화면 표시
    // -------------------------
    function displayTile(value) {
        const colorClass = getTileColorClass(value); // 값에 따라 색상을 결정

        // className을 통째로 지정해서 기존 클래스를 초기화하고, 색상 클래스를 붙입니다.
        currentTileEl.className = `tile ${colorClass}`;

        // 텍스트로 타일 값을 보여줍니다(숫자 또는 ★).
        currentTileEl.textContent = value;

        // .hidden을 제거하면 CSS transition으로 “튜- 튀어나오는” 애니메이션이 동작합니다.
        currentTileEl.classList.remove('hidden');
    }

    // -------------------------
    // 히스토리(작은 타일) 추가
    // -------------------------
    function addToHistory(value) {
        // 작은 타일로 쓸 div를 새로 만들어요.
        const miniTile = document.createElement('div');

        // 작은 타일에도 색상 클래스를 적용합니다.
        miniTile.className = `mini-tile ${getTileColorClass(value)}`;

        // 작은 타일에 표시할 텍스트
        miniTile.textContent = value;

        // 히스토리 영역에 새 타일을 추가(맨 뒤에)
        historyGrid.appendChild(miniTile);

        // 스크롤을 맨 아래로 내려서 최신 타일이 보이게 합니다.
        historyGrid.scrollTop = historyGrid.scrollHeight;
    }

    // -------------------------
    // 진행 표시(몇 턴 했는지)
    // -------------------------
    function updateRemainingCount() {
        remainingInfoEl.textContent = `진행: ${turnCount} / ${MAX_TURNS}`;
    }

    // =========================
    // 8) 간단 컨페티(Confetti) 시스템
    // =========================

    const particles = []; // 화면에 뿌릴 컨페티 조각들을 담는 배열
    const colors = ['#FF6B6B', '#FFD93D', '#A8E6CF', '#FFB7B2', '#FFF']; // 컨페티 색상 후보

    // 컨페티를 “생성”하고 애니메이션을 시작합니다.
    function triggerConfetti() {
        // 주머니 버튼의 화면 위치/크기를 얻습니다.
        const bagRect = bagBtn.getBoundingClientRect();

        // 컨페티가 터질 기준 위치(주머니 중앙 상단)
        const spawnX = bagRect.left + bagRect.width / 2;
        const spawnY = bagRect.top;

        // 30개의 컨페티 파티클을 만들어요.
        for (let i = 0; i < 30; i++) {
            particles.push({
                x: spawnX, // 시작 x
                y: spawnY, // 시작 y
                vx: (Math.random() - 0.5) * 10, // x 방향 속도(왼쪽/오른쪽 랜덤)
                vy: (Math.random() - 1) * 12 - 8, // y 방향 속도(위로 확 튀게 음수 크게)
                size: Math.random() * 8 + 4, // 크기(4~12 정도)
                color: colors[Math.floor(Math.random() * colors.length)], // 랜덤 색
                life: 100, // 수명(프레임 단위로 줄어듦)
            });
        }

        // 브라우저가 “다음 프레임에 그리기”를 할 때 updateConfetti를 호출합니다.
        requestAnimationFrame(updateConfetti);
    }

    // 컨페티를 매 프레임 업데이트하며 그립니다.
    function updateConfetti() {
        // 이전 프레임의 그림을 지우고 새로 그릴 준비
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

        // 모든 파티클을 돌면서 위치를 업데이트하고 사각형으로 그립니다.
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i]; // 현재 파티클

            // 위치 업데이트(속도만큼 이동)
            p.x += p.vx;
            p.y += p.vy;

            // 중력처럼 아래로 점점 떨어지게(아래로 가는 속도 증가)
            p.vy += 0.5;

            // 수명 줄이기
            p.life--;

            // 색 지정
            ctx.fillStyle = p.color;
            // 사각형 하나를 그립니다(픽셀 느낌의 컨페티)
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }

        // life가 0 이하인 파티클은 배열에서 제거합니다.
        // (뒤에서 앞으로 돌면 splice로 제거할 때 인덱스가 꼬이지 않아요.)
        for (let i = particles.length - 1; i >= 0; i--) {
            if (particles[i].life <= 0) particles.splice(i, 1);
        }

        // 아직 파티클이 남아 있으면 다음 프레임도 계속 그립니다.
        if (particles.length > 0) requestAnimationFrame(updateConfetti);
    }
});
