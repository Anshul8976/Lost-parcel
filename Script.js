const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const message = document.getElementById("message");

const parcelCount = document.getElementById("parcelCount");
const timerDisplay = document.getElementById("timer");
const scoreDisplay = document.getElementById("score");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let gameRunning = false;
let gameOver = false;
let timeLeft = 60;
let score = 0;
let collected = 0;
let lastTime = 0;

const player = {
  x: 80,
  y: HEIGHT - 80,
  size: 26,
  speed: 260
};

const van = {
  x: WIDTH - 100,
  y: 70,
  width: 58,
  height: 36
};

let parcels = [];

const walls = [
  { x: 170, y: 70, width: 220, height: 28 },
  { x: 520, y: 70, width: 180, height: 28 },

  { x: 110, y: 180, width: 30, height: 220 },
  { x: 280, y: 170, width: 30, height: 170 },

  { x: 430, y: 170, width: 230, height: 28 },
  { x: 760, y: 160, width: 30, height: 230 },

  { x: 170, y: 440, width: 230, height: 28 },
  { x: 500, y: 400, width: 30, height: 120 }
];

const keys = {};

document.addEventListener("keydown", (event) => {
  keys[event.key] = true;

  if (
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(
      event.key
    )
  ) {
    event.preventDefault();
  }
});

document.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

// Touch controls
document.querySelectorAll("[data-key]").forEach((button) => {
  const key = button.dataset.key;

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    keys[key] = true;
  });

  button.addEventListener("pointerup", () => {
    keys[key] = false;
  });

  button.addEventListener("pointerleave", () => {
    keys[key] = false;
  });

  button.addEventListener("pointercancel", () => {
    keys[key] = false;
  });
});

function resetGame() {
  player.x = 80;
  player.y = HEIGHT - 80;

  timeLeft = 60;
  score = 0;
  collected = 0;

  gameRunning = false;
  gameOver = false;

  parcels = [
    { x: 90, y: 90, collected: false },
    { x: 690, y: 330, collected: false },
    { x: 350, y: 500, collected: false }
  ];

  updateHUD();
  draw();
}

function startGame() {
  resetGame();

  gameRunning = true;
  gameOver = false;

  message.classList.add("hidden");

  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function endGame(title, text) {
  gameRunning = false;
  gameOver = true;

  message.querySelector("h2").textContent = title;
  message.querySelector("p").textContent = text;
  startButton.textContent = "Play again";

  message.classList.remove("hidden");
}

function updateHUD() {
  parcelCount.textContent = `${collected} / ${parcels.length}`;
  timerDisplay.textContent = Math.ceil(timeLeft);
  scoreDisplay.textContent = score;
}

function isKeyDown(...possibleKeys) {
  return possibleKeys.some((key) => keys[key]);
}

function circleRectCollision(circle, rect) {
  const closestX = Math.max(
    rect.x,
    Math.min(circle.x, rect.x + rect.width)
  );

  const closestY = Math.max(
    rect.y,
    Math.min(circle.y, rect.y + rect.height)
  );

  const dx = circle.x - closestX;
  const dy = circle.y - closestY;

  return dx * dx + dy * dy < circle.size * circle.size;
}

function isInsideBounds(x, y) {
  return (
    x - player.size >= 0 &&
    x + player.size <= WIDTH &&
    y - player.size >= 0 &&
    y + player.size <= HEIGHT
  );
}

function canMoveTo(x, y) {
  const testPlayer = {
    x,
    y,
    size: player.size
  };

  if (!isInsideBounds(x, y)) {
    return false;
  }

  for (const wall of walls) {
    if (circleRectCollision(testPlayer, wall)) {
      return false;
    }
  }

  return true;
}

function movePlayer(dx, dy) {
  const newX = player.x + dx;
  const newY = player.y + dy;

  // Separate X/Y movement makes wall collisions smoother.
  if (canMoveTo(newX, player.y)) {
    player.x = newX;
  }

  if (canMoveTo(player.x, newY)) {
    player.y = newY;
  }
}

function updatePlayer(delta) {
  let dx = 0;
  let dy = 0;

  if (isKeyDown("ArrowUp", "w", "W")) {
    dy -= 1;
  }

  if (isKeyDown("ArrowDown", "s", "S")) {
    dy += 1;
  }

  if (isKeyDown("ArrowLeft", "a", "A")) {
    dx -= 1;
  }

  if (isKeyDown("ArrowRight", "d", "D")) {
    dx += 1;
  }

  if (dx !== 0 || dy !== 0) {
    const length = Math.sqrt(dx * dx + dy * dy);

    dx /= length;
    dy /= length;

    movePlayer(
      dx * player.speed * delta,
      dy * player.speed * delta
    );
  }
}

function collectParcels() {
  for (const parcel of parcels) {
    if (parcel.collected) continue;

    const dx = player.x - parcel.x;
    const dy = player.y - parcel.y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < player.size + 15) {
      parcel.collected = true;
      collected++;
      score += 100;

      updateHUD();
    }
  }
}

function reachedVan() {
  return (
    player.x > van.x - 35 &&
    player.x < van.x + van.width + 35 &&
    player.y > van.y - 35 &&
    player.y < van.y + van.height + 35
  );
}

function update(delta) {
  updatePlayer(delta);
  collectParcels();

  timeLeft -= delta;

  if (timeLeft <= 0) {
    timeLeft = 0;
    updateHUD();

    endGame(
      "Time's up!",
      `You delivered ${collected} of ${parcels.length} parcels.`
    );

    return;
  }

  if (collected === parcels.length && reachedVan()) {
    score += Math.ceil(timeLeft) * 10;

    updateHUD();

    endGame(
      "Delivery complete!",
      `All parcels delivered. Final score: ${score}`
    );

    return;
  }

  updateHUD();
}

function drawBackground() {
  ctx.fillStyle = "#0b0e12";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Ground
  ctx.fillStyle = "#151a20";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle grid
  ctx.strokeStyle = "#20262e";
  ctx.lineWidth = 1;

  for (let x = 0; x <= WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }

  for (let y = 0; y <= HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
}

function drawWalls() {
  for (const wall of walls) {
    ctx.fillStyle = "#303944";
    ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

    ctx.strokeStyle = "#4b5664";
    ctx.lineWidth = 2;
    ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
  }
}

function drawVan() {
  // Van shadow
  ctx.fillStyle = "#00000066";
  ctx.fillRect(van.x + 4, van.y + 5, van.width, van.height);

  // Van body
  ctx.fillStyle = "#55a7ff";
  ctx.fillRect(van.x, van.y, van.width, van.height);

  // Cab
  ctx.fillStyle = "#8ac5ff";
  ctx.fillRect(van.x + 35, van.y + 5, 18, 18);

  // Windows
  ctx.fillStyle = "#142333";
  ctx.fillRect(van.x + 39, van.y + 8, 12, 10);

  // Wheels
  ctx.fillStyle = "#080a0d";

  ctx.beginPath();
  ctx.arc(van.x + 12, van.y + van.height, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(van.x + 45, van.y + van.height, 7, 0, Math.PI * 2);
  ctx.fill();

  // Label
  ctx.fillStyle = "#07111c";
  ctx.font = "bold 9px Arial";
  ctx.fillText("VAN", van.x + 7, van.y + 17);
}

function drawParcels() {
  for (const parcel of parcels) {
    if (parcel.collected) continue;

    // Glow
    ctx.beginPath();
    ctx.arc(parcel.x, parcel.y, 22, 0, Math.PI * 2);
    ctx.fillStyle = "#ffb84d22";
    ctx.fill();

    // Box
    ctx.fillStyle = "#c88942";
    ctx.fillRect(parcel.x - 12, parcel.y - 12, 24, 24);

    ctx.strokeStyle = "#f4c77a";
    ctx.lineWidth = 2;
    ctx.strokeRect(parcel.x - 12, parcel.y - 12, 24, 24);

    // Tape
    ctx.fillStyle = "#ead39b";
    ctx.fillRect(parcel.x - 3, parcel.y - 12, 6, 24);
    ctx.fillRect(parcel.x - 12, parcel.y - 3, 24, 6);
  }
}

function drawPlayer() {
  // Shadow
  ctx.beginPath();
  ctx.ellipse(
    player.x,
    player.y + player.size,
    player.size,
    player.size / 2,
    0,
    0,
    Math.PI * 2
  );

  ctx.fillStyle = "#00000088";
  ctx.fill();

  // Player body
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);

  ctx.fillStyle = "#ffb84d";
  ctx.fill();

  ctx.strokeStyle = "#fff0cf";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Face
  ctx.fillStyle = "#17120b";

  ctx.beginPath();
  ctx.arc(player.x - 7, player.y - 3, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(player.x + 7, player.y - 3, 3, 0, Math.PI * 2);
  ctx.fill();

  // Backpack
  ctx.fillStyle = "#8b5c25";
  ctx.fillRect(
    player.x - player.size - 5,
    player.y - 10,
    8,
    20
  );
}

function drawInstructions() {
  if (!gameRunning) return;

  ctx.fillStyle = "#ffffff99";
  ctx.font = "12px Arial";
  ctx.fillText(
    "Collect every parcel",
    18,
    HEIGHT - 18
  );
}

function draw() {
  drawBackground();
  drawWalls();
  drawVan();
  drawParcels();
  drawPlayer();
  drawInstructions();
}

function gameLoop(timestamp) {
  if (!gameRunning) {
    draw();
    return;
  }

  const delta = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  update(delta);
  draw();

  if (gameRunning) {
    requestAnimationFrame(gameLoop);
  }
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

// Initial state
resetGame();
