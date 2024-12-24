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

// Materials for head and body
const headMaterial = new THREE.MeshStandardMaterial({ map: headTexture });
const bodyMaterial = new THREE.MeshStandardMaterial({ map: bodyTexture });

// Add a background grid
const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0x444444); // Grid size and divisions
scene.add(gridHelper);

// Snake setup
const gridSize = 1; // Size of each grid square
const gridBoundary = 10; // Boundary limit based on grid size
const snakeGeometry = new THREE.BoxGeometry(gridSize, gridSize, gridSize);
const snake = [];

// Food setup
const foodGeometry = new THREE.BoxGeometry(gridSize, gridSize, gridSize);
const foodMaterial = new THREE.MeshStandardMaterial({ map: textureLoader.load('assets/Food.bmp') });
const food = new THREE.Mesh(foodGeometry, foodMaterial);
scene.add(food);

// HTML elements
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
restartButton.addEventListener('click', () => {
  location.reload(); // Reload the page to restart the game
});
document.body.appendChild(restartButton);

// Game variables
let direction = { x: gridSize, z: 0 }; // Initial movement direction
let snakeSpeed = 200; // Snake moves every 200 ms
let score = 0;
let foodsEaten = 0;
let startTime = Date.now();
let lastMoveTime = 0;
let isGameOver = false;
let gameMode = null; // 'classic' or 'modern'

// High score logic
let highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;

// Game Mode Selection
function displayGameModeMenu() {
  const menu = document.createElement('div');
  menu.style.position = 'absolute';
  menu.style.top = '50%';
  menu.style.left = '50%';
  menu.style.transform = 'translate(-50%, -50%)';
  menu.style.textAlign = 'center';
  menu.style.color = 'white';
  menu.style.fontSize = '30px';

  const classicButton = document.createElement('button');
  classicButton.innerText = 'Classic Mode';
  classicButton.style.fontSize = '20px';
  classicButton.style.margin = '10px';
  classicButton.onclick = () => {
    gameMode = 'classic';
    menu.remove();
    startGame();
  };

  const modernButton = document.createElement('button');
  modernButton.innerText = 'Modern Mode';
  modernButton.style.fontSize = '20px';
  modernButton.style.margin = '10px';
  modernButton.onclick = () => {
    gameMode = 'modern';
    menu.remove();
    startGame();
  };

  menu.appendChild(classicButton);
  menu.appendChild(modernButton);
  document.body.appendChild(menu);
}

// Warp logic for modern mode
function warpPosition(position) {
  if (position.x >= gridBoundary) position.x = -gridBoundary + gridSize;
  if (position.x < -gridBoundary) position.x = gridBoundary - gridSize;
  if (position.z >= gridBoundary) position.z = -gridBoundary + gridSize;
  if (position.z < -gridBoundary) position.z = gridBoundary - gridSize;
  return position;
}

// Update snake position
function updateSnake() {
  const head = snake[0];
  const newHeadPosition = new THREE.Vector3(
    head.position.x + direction.x,
    head.position.y,
    head.position.z + direction.z
  );

  if (gameMode === 'classic') {
    // Classic mode: Check if snake goes off-screen
    if (
      Math.abs(newHeadPosition.x) >= gridBoundary ||
      Math.abs(newHeadPosition.z) >= gridBoundary
    ) {
      endGame('Game Over! You went off-screen.');
      return;
    }
  } else if (gameMode === 'modern') {
    // Modern mode: Warp to the opposite side of the screen
    warpPosition(newHeadPosition);
  }

  // Check if snake runs into itself
  for (let i = 1; i < snake.length; i++) {
    if (newHeadPosition.equals(snake[i].position)) {
      endGame('Game Over! You ran into yourself.');
      return;
    }
  }

  // Move snake segments
  for (let i = snake.length - 1; i > 0; i--) {
    snake[i].position.copy(snake[i - 1].position);
  }

  // Update head position
  head.position.copy(newHeadPosition);
}

// Check for collision with food
function checkCollision() {
  const head = snake[0];
  if (head.position.distanceTo(food.position) < 0.5) {
    addSnakeSegment(); // Grow snake
    repositionFood(); // Move food
    score += 10;
    foodsEaten += 1;

    if (gameMode === 'modern' && foodsEaten % 5 === 0) {
      snakeSpeed = Math.max(50, snakeSpeed - 20); // Increase speed
    }

    scoreElement.innerHTML = `Score: ${score} | High Score: ${highScore}`;
  }
}

// Start the game
function startGame() {
  setupSnake();
  repositionFood();
  animate();
}

// Display the game mode menu
displayGameModeMenu();
