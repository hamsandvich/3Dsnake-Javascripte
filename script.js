// Create the scene
const scene = new THREE.Scene();

// Set up the camera
const camera = new THREE.OrthographicCamera(
  -10, 10, 10, -10, 0.1, 100 // left, right, top, bottom, near, far
);
camera.position.set(0, 10, 0); // Place the camera above the scene
camera.lookAt(0, 0, 0); // Look directly at the center of the scene

// Create the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Add lighting for depth
const ambientLight = new THREE.AmbientLight(0x404040); // Soft ambient light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10);
directionalLight.castShadow = true; // Enable shadows
scene.add(directionalLight);

// Load textures
const textureLoader = new THREE.TextureLoader();
const headTexture = textureLoader.load('assets/SnakeHead.png');
const bodyTexture = textureLoader.load('assets/SnakeBody.png');
const foodTexture = textureLoader.load('assets/Food.bmp');

// Materials for head, body, and food
const headMaterial = new THREE.MeshStandardMaterial({ map: headTexture });
const bodyMaterial = new THREE.MeshStandardMaterial({ map: bodyTexture });
const foodMaterial = new THREE.MeshStandardMaterial({ map: foodTexture });

// Add a background grid
const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
scene.add(gridHelper);

// Snake and game setup
const gridSize = 1; // Size of each grid square
const gridBoundary = 10; // Boundary limit based on grid size
const snakeGeometry = new THREE.BoxGeometry(gridSize, gridSize, gridSize);
const foodGeometry = new THREE.BoxGeometry(gridSize, gridSize, gridSize);
const food = new THREE.Mesh(foodGeometry, foodMaterial);
scene.add(food);

const snake = []; // Array to hold the snake segments
let direction = { x: gridSize, z: 0 }; // Initial movement direction
let snakeSpeed = 200; // Snake moves every 200 ms
let score = 0;
let foodsEaten = 0;
let startTime = Date.now();
let lastMoveTime = 0;
let isGameOver = false;
let gameMode = null; // 'classic' or 'modern'

// High score logic for Classic and Modern modes
let highScoreClassic = parseInt(localStorage.getItem('snakeHighScoreClassic')) || 0;
let highScoreModern = parseInt(localStorage.getItem('snakeHighScoreModern')) || 0;
let currentHighScore = 0; // Will hold the high score for the selected mode

// HTML elements for UI
const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.top = '10px';
scoreElement.style.left = '10px';
scoreElement.style.color = 'white';
scoreElement.style.fontSize = '20px';
document.body.appendChild(scoreElement);

const timerElement = document.createElement('div');
timerElement.style.position = 'absolute';
timerElement.style.top = '40px';
timerElement.style.left = '10px';
timerElement.style.color = 'white';
timerElement.style.fontSize = '20px';
document.body.appendChild(timerElement);

const gameOverElement = document.createElement('div');
gameOverElement.style.position = 'absolute';
gameOverElement.style.top = '50%';
gameOverElement.style.left = '50%';
gameOverElement.style.transform = 'translate(-50%, -50%)';
gameOverElement.style.color = 'white';
gameOverElement.style.fontSize = '30px';
gameOverElement.style.textAlign = 'center';
gameOverElement.style.display = 'none';
document.body.appendChild(gameOverElement);

const restartButton = document.createElement('button');
restartButton.innerText = 'Play Again';
restartButton.style.position = 'absolute';
restartButton.style.top = '60%';
restartButton.style.left = '50%';
restartButton.style.transform = 'translate(-50%, -50%)';
restartButton.style.fontSize = '20px';
restartButton.style.display = 'none';
restartButton.addEventListener('click', () => location.reload()); // Reload the page to restart the game
document.body.appendChild(restartButton);

// Movement control
document.addEventListener('keydown', (event) => {
  if (isGameOver) return; // Disable controls after game over
  switch (event.key) {
    case 'ArrowUp': if (direction.z === 0) direction = { x: 0, z: -gridSize }; break;
    case 'ArrowDown': if (direction.z === 0) direction = { x: 0, z: gridSize }; break;
    case 'ArrowLeft': if (direction.x === 0) direction = { x: -gridSize, z: 0 }; break;
    case 'ArrowRight': if (direction.x === 0) direction = { x: gridSize, z: 0 }; break;
  }
});

// Snake initialization
function setupSnake() {
  while (snake.length > 0) {
    const segment = snake.pop();
    scene.remove(segment);
  }

  const headSegment = new THREE.Mesh(snakeGeometry, headMaterial);
  headSegment.position.set(0, 0.5, 0);
  snake.push(headSegment);
  scene.add(headSegment);
}

// Food positioning
function generateFoodPosition() {
  let newPosition;
  do {
    newPosition = new THREE.Vector3(
      Math.floor(Math.random() * 20 - 10) * gridSize,
      0.5,
      Math.floor(Math.random() * 20 - 10) * gridSize
    );
  } while (snake.some(segment => segment.position.equals(newPosition)));
  return newPosition;
}

function repositionFood() {
  const newFoodPosition = generateFoodPosition();
  food.position.copy(newFoodPosition);
}

// Head rotation logic
function updateHeadRotation() {
  const head = snake[0];
  if (direction.x === gridSize) head.rotation.set(0, Math.PI / 2, 0);
  else if (direction.x === -gridSize) head.rotation.set(0, -Math.PI / 2, 0);
  else if (direction.z === gridSize) head.rotation.set(0, Math.PI, 0);
  else if (direction.z === -gridSize) head.rotation.set(0, 0, 0);
}

// High score handling
function loadHighScore() {
  if (gameMode === 'classic') currentHighScore = highScoreClassic;
  else if (gameMode === 'modern') currentHighScore = highScoreModern;
  scoreElement.innerHTML = `Score: ${score} | High Score: ${currentHighScore}`;
}

function saveHighScore() {
  if (gameMode === 'classic') {
    if (score > highScoreClassic) {
      highScoreClassic = score;
      localStorage.setItem('snakeHighScoreClassic', highScoreClassic);
    }
  } else if (gameMode === 'modern') {
    if (score > highScoreModern) {
      highScoreModern = score;
      localStorage.setItem('snakeHighScoreModern', highScoreModern);
    }
  }
}

// Game logic
function updateSnake() {
  const head = snake[0];
  const newHeadPosition = new THREE.Vector3(
    head.position.x + direction.x,
    head.position.y,
    head.position.z + direction.z
  );

  if (gameMode === 'classic') {
    if (Math.abs(newHeadPosition.x) >= gridBoundary || Math.abs(newHeadPosition.z) >= gridBoundary) {
      endGame('Game Over! You went off-screen.');
      return;
    }
  } else if (gameMode === 'modern') {
    if (newHeadPosition.x >= gridBoundary) newHeadPosition.x = -gridBoundary + gridSize;
    if (newHeadPosition.x < -gridBoundary) newHeadPosition.x = gridBoundary - gridSize;
    if (newHeadPosition.z >= gridBoundary) newHeadPosition.z = -gridBoundary + gridSize;
    if (newHeadPosition.z < -gridBoundary) newHeadPosition.z = gridBoundary - gridSize;
  }

  for (let i = 1; i < snake.length; i++) {
    if (newHeadPosition.equals(snake[i].position)) {
      endGame('Game Over! You ran into yourself.');
      return;
    }
  }

  for (let i = snake.length - 1; i > 0; i--) {
    snake[i].position.copy(snake[i - 1].position);
  }

  head.position.copy(newHeadPosition);
  updateHeadRotation();
}

// Collision detection
function checkCollision() {
  const head = snake[0];
  if (head.position.distanceTo(food.position) < 0.5) {
    addSnakeSegment();
    repositionFood();
    score += 10;
    foodsEaten++;
    if (gameMode === 'modern' && foodsEaten % 5 === 0) snakeSpeed = Math.max(50, snakeSpeed - 20);
    scoreElement.innerHTML = `Score: ${score} | High Score: ${currentHighScore}`;
  }
}

function addSnakeSegment() {
  const newSegment = new THREE.Mesh(snakeGeometry, bodyMaterial);
  newSegment.position.copy(snake[snake.length - 1].position);
  snake.push(newSegment);
  scene.add(newSegment);
}

// Game over logic
function endGame(message) {
  isGameOver = true;
  saveHighScore();
  gameOverElement.innerHTML = `${message}<br>Final Score: ${score}<br>High Score: ${currentHighScore}`;
  gameOverElement.style.display = 'block';
  restartButton.style.display = 'block';
}

// Timer
function updateTimer() {
  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  timerElement.innerHTML = `Time: ${elapsedTime}s`;
}

// Game loop
function animate(time) {
  if (isGameOver) return;
  if (time - lastMoveTime > snakeSpeed) {
    updateSnake();
    checkCollision();
    lastMoveTime = time;
  }
  updateTimer();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Game mode selection
function displayGameModeMenu() {
  const menu = document.createElement('div');
  menu.style.position = 'absolute';
  menu.style.top = '50%';
  menu.style.left = '50%';
  menu.style.transform = 'translate(-50%, -50%)';
  menu.style.textAlign = 'center';
  menu.style.color = 'white';
  menu.style.fontSize = '30px';

  const title = document.createElement('div');
  title.innerText = 'Select Game Mode';
  title.style.marginBottom = '20px';
  menu.appendChild(title);

  const classicButton = document.createElement('button');
  classicButton.innerText = 'Classic Mode';
  classicButton.style.fontSize = '20px';
  classicButton.style.margin = '10px';
  classicButton.onclick = () => {
    gameMode = 'classic';
    document.body.removeChild(menu);
    startGame();
  };

  const modernButton = document.createElement('button');
  modernButton.innerText = 'Modern Mode';
  modernButton.style.fontSize = '20px';
  modernButton.style.margin = '10px';
  modernButton.onclick = () => {
    gameMode = 'modern';
    document.body.removeChild(menu);
    startGame();
  };

  menu.appendChild(classicButton);
  menu.appendChild(modernButton);
  document.body.appendChild(menu);
}

// Start the game
function startGame() {
  loadHighScore();
  setupSnake();
  repositionFood();
  animate();
}

// Display the game mode menu
displayGameModeMenu();
