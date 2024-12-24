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

// HTML elements for score, timer, and game over
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
let startTime = Date.now();
let lastMoveTime = 0;
let isGameOver = false;

// High score logic
let highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;

// Display initial score and high score
scoreElement.innerHTML = `Score: ${score} | High Score: ${highScore}`;

// Movement control
document.addEventListener('keydown', (event) => {
  if (isGameOver) return; // Disable controls after game over
  switch (event.key) {
    case 'ArrowUp':
      if (direction.z === 0) direction = { x: 0, z: -gridSize };
      break;
    case 'ArrowDown':
      if (direction.z === 0) direction = { x: 0, z: gridSize };
      break;
    case 'ArrowLeft':
      if (direction.x === 0) direction = { x: -gridSize, z: 0 };
      break;
    case 'ArrowRight':
      if (direction.x === 0) direction = { x: gridSize, z: 0 };
      break;
  }
});

// Rotate the head of the snake
function updateHeadRotation() {
  const head = snake[0];
  if (direction.x === gridSize && direction.z === 0) {
    head.rotation.set(0, -Math.PI / 2, 0); // Facing left
  } else if (direction.x === -gridSize && direction.z === 0) {
    head.rotation.set(0, Math.PI / 2, 0); // Facing right
  } else if (direction.z === gridSize && direction.x === 0) {
    head.rotation.set(0, Math.PI, 0); // Facing down
  } else if (direction.z === -gridSize && direction.x === 0) {
    head.rotation.set(0, 0, 0); // Facing up
  }
}

// Add a new segment to the snake
function addSnakeSegment() {
  const newSegment = new THREE.Mesh(snakeGeometry, bodyMaterial);
  newSegment.position.copy(snake[snake.length - 1].position); // Place at the tail
  snake.push(newSegment);
  scene.add(newSegment);
}

// Generate a new food position ensuring it doesn't overlap with the snake
function generateFoodPosition() {
  let newPosition;
  do {
    newPosition = new THREE.Vector3(
      Math.floor(Math.random() * 10 - 5) * gridSize, 
      0.5, 
      Math.floor(Math.random() * 10 - 5) * gridSize
    );
  } while (snake.some(segment => segment.position.equals(newPosition)));
  return newPosition;
}

// Place the food at a new position
function repositionFood() {
  const newFoodPosition = generateFoodPosition();
  food.position.copy(newFoodPosition);
}

// End the game and update high score
function endGame(message) {
  isGameOver = true;

  // Update high score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('snakeHighScore', highScore); // Save to local storage
  }

  gameOverElement.innerHTML = `${message}<br>Final Score: ${score}<br>High Score: ${highScore}`;
  gameOverElement.style.display = 'block';
  restartButton.style.display = 'block';
}

// Update snake position
function updateSnake() {
  const head = snake[0];
  const newHeadPosition = new THREE.Vector3(
    head.position.x + direction.x,
    head.position.y,
    head.position.z + direction.z
  );

  // Check if snake goes off-screen
  if (
    Math.abs(newHeadPosition.x) >= gridBoundary ||
    Math.abs(newHeadPosition.z) >= gridBoundary
  ) {
    endGame('Game Over! You went off-screen.');
    return;
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

  // Update head rotation
  updateHeadRotation();
}

// Check for collision with food
function checkCollision() {
  const head = snake[0];
  if (head.position.distanceTo(food.position) < 0.5) {
    addSnakeSegment(); // Grow snake
    repositionFood(); // Move food
    score += 10; // Update score
    scoreElement.innerHTML = `Score: ${score} | High Score: ${highScore}`;
  }
}

// Update timer
function updateTimer() {
  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  timerElement.innerHTML = `Time: ${elapsedTime}s`;
}

// Game loop
function animate(time) {
  if (isGameOver) return; // Stop updating after game over
  if (time - lastMoveTime > snakeSpeed) {
    updateSnake();
    checkCollision();
    lastMoveTime = time;
  }

  updateTimer();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Initial setup of the snake
function setupSnake() {
  const headSegment = new THREE.Mesh(snakeGeometry, headMaterial);
  headSegment.position.set(0, 0.5, 0); // Start at the center
  snake.push(headSegment);
  scene.add(headSegment);
}

// Initialize the game
setupSnake();
repositionFood();
animate();
