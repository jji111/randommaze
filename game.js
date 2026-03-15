const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameState = "MENU";
let mazeWidth, mazeHeight, TILE_SIZE;
const WALL = 1;
const PATH = 0;

let map = [];
let player = { x: 1, y: 1 };
let exit = { x: 1, y: 1 };

let startTime;
let timerInterval;
let hintsLeft = 0;
let isHintActive = false;

function startGame(level) {
    if (level === 1) { mazeWidth = 10; mazeHeight = 10; hintsLeft = 2; }
    else if (level === 2) { mazeWidth = 18; mazeHeight = 18; hintsLeft = 4; }
    else if (level === 3) { mazeWidth = 24; mazeHeight = 24; hintsLeft = 6; }

    TILE_SIZE = 600 / (mazeWidth * 2 + 1);
    generateMaze();

    player = { x: 1, y: 1 };
    exit = { x: mazeWidth * 2 - 1, y: mazeHeight * 2 - 1 };

    document.getElementById("menu").classList.add("hidden");
    document.getElementById("gameArea").classList.remove("hidden");
    document.getElementById("info").style.color = "#fff";

    gameState = "PLAY";
    startTime = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 100);
}

function updateTimer() {
    if (gameState !== "PLAY") return;
    let elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    document.getElementById("info").innerText = "시간: " + elapsed + "초 | 힌트 H: " + hintsLeft + "개 | 메뉴 M";
}

function returnToMenu() {
    gameState = "MENU";
    clearInterval(timerInterval);
    document.getElementById("gameArea").classList.add("hidden");
    document.getElementById("menu").classList.remove("hidden");
}

function generateMaze() {
    const mapW = mazeWidth * 2 + 1;
    const mapH = mazeHeight * 2 + 1;
    map = Array.from({ length: mapH }, () => Array(mapW).fill(WALL));

    let sets = new Array(mazeWidth).fill(0);
    let nextSetID = 1;

    for (let y = 0; y < mazeHeight; y++) {
        for (let x = 0; x < mazeWidth; x++) {
            if (sets[x] === 0) sets[x] = nextSetID++;
        }
        for (let x = 0; x < mazeWidth - 1; x++) {
            if (sets[x] !== sets[x + 1]) {
                if (Math.random() < 0.5 || y === mazeHeight - 1) {
                    let oldSet = sets[x + 1];
                    let newSet = sets[x];
                    for (let i = 0; i < mazeWidth; i++) {
                        if (sets[i] === oldSet) sets[i] = newSet;
                    }
                    map[y * 2 + 1][x * 2 + 2] = PATH;
                }
            }
            map[y * 2 + 1][x * 2 + 1] = PATH;
        }
        map[y * 2 + 1][(mazeWidth - 1) * 2 + 1] = PATH;

        if (y < mazeHeight - 1) {
            let setsMap = {};
            for (let x = 0; x < mazeWidth; x++) {
                if (!setsMap[sets[x]]) setsMap[sets[x]] = [];
                setsMap[sets[x]].push(x);
            }
            for (let id in setsMap) {
                let currentSetIndices = setsMap[id];
                let numDown = Math.floor(Math.random() * currentSetIndices.length) + 1;
                currentSetIndices.sort(() => Math.random() - 0.5);
                for (let i = 0; i < numDown; i++) {
                    map[y * 2 + 2][currentSetIndices[i] * 2 + 1] = PATH;
                }
            }
            for (let x = 0; x < mazeWidth; x++) {
                if (map[y * 2 + 2][x * 2 + 1] === WALL) sets[x] = 0;
            }
        }
    }
    map[exit.y][exit.x] = PATH;
}

window.addEventListener("keydown", e => {
    if (gameState !== "PLAY" && gameState !== "RESULT") return;

    if (e.key === "m" || e.key === "M") {
        returnToMenu();
        return;
    }

    if(gameState==="RESULT") return; 

    if (e.key === "h" || e.key === "H") {
        if (hintsLeft > 0 && !isHintActive) {
            hintsLeft--;
            isHintActive = true;
            updateTimer();
            setTimeout(() => { isHintActive = false; }, 3000);
        }
        return;
    }

    if (isHintActive) return;

    let nx = player.x;
    let ny = player.y;

    if (e.key === "ArrowUp") ny--;
    else if (e.key === "ArrowDown") ny++;
    else if (e.key === "ArrowLeft") nx--;
    else if (e.key === "ArrowRight") nx++;

    if (map[ny] && map[ny][nx] === PATH) {
        player.x = nx;
        player.y = ny;
    }

    if (player.x === exit.x && player.y === exit.y) {
        clearInterval(timerInterval);

        let finalTime = ((Date.now() - startTime) / 1000).toFixed(1);

        document.getElementById("info").innerText = `탈출 성공! 소요 시간: ${finalTime}초 | 메뉴로 가려면 M 키를 누르세요`;
        document.getElementById("info").style.color = "#4CAF50";
        gameState = "RESULT";
    }
});

function render() {
    if (gameState !== "PLAY" && gameState !== "RESULT") return;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            if (map[i][j] === WALL) {
                ctx.fillStyle = "#555";
                ctx.fillRect(j * TILE_SIZE, i * TILE_SIZE, TILE_SIZE + 1, TILE_SIZE + 1);
            }
        }
    }

    ctx.fillStyle = "#ff4444";
    ctx.fillRect(exit.x * TILE_SIZE, exit.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

    let px = player.x * TILE_SIZE + TILE_SIZE / 2;
    let py = player.y * TILE_SIZE + TILE_SIZE / 2;

    ctx.fillStyle = "#0f0";
    ctx.beginPath();
    ctx.arc(px, py, TILE_SIZE*0.45, 0, Math.PI * 2);
    ctx.fill();

    if (gameState !== "RESULT" && !isHintActive) {
        let visionRadius = TILE_SIZE * 3;
        let gradient = ctx.createRadialGradient(px, py, TILE_SIZE *0.5 , px, py, visionRadius);
        gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
        gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.8)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 1)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function gameLoop() {
    render();
    requestAnimationFrame(gameLoop);
}

gameLoop();