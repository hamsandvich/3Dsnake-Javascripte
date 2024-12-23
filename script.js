// Create the scene
const scene = new THREE.Scene();

// Set up the camera
const camera = new THREE.OrthographicCamera(
  -10, // left
  10,  // right
  10,  // top
  -10, // bottom
  0.1, // near
  100  // far
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
const snakeTexture = textureLoader.load('assets/CubeTexture.png');
const foodTexture = textureLoader.load('assets/Square.bmp');

// Add a background grid
const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0x444444); // Grid size and divisions
scene.add(gridHelper);

// Snake setup
const gridSize = 1; // Size of each grid square
const gridBoundary = 10; // Boundary limit based on grid size
const snakeGeometry = new THREE.BoxGeometry(gridSize, gridSize, gridSize);
const snakeMaterial = new THREE.MeshStandardMaterial({ map: snakeTexture });
const snake = [];
const initialSegment = new THREE.Mesh(snakeGeometry, snakeMaterial);
initialSegment.position.set(0, 0.5, 0); // Align to grid
scene.add(initialSegment);
snake.push(initialSegment);

// Food setup
const foodGeometry = new THREE.BoxGeometry(gridSize, gridSize, gridSize);
const foodMaterial = new THREE.MeshStandardMaterial({ map: foodTexture });
const food = new THREE.Mesh(foodGeometry, foodMaterial);
food.position.set(
  Math.floor(Math.random() * 10 - 5) * gridSize, 
  0.5, 
  Math.floor(Math.random() * 10 - 5) * gridSize
);
scene.add(food);

// HTML elements for score, timer, and game over
const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.top = '10px';
scoreElement.style.left = '10px';
scoreElement.style.color = 'white';
scoreElement.style.fontSize = '20px';
scoreElement.style.fontFamily = 'Arial, sans-serif';
scoreElement.innerHTML = `Score: 0`;
document.body.appendChild(scoreElement);

const timerElement = document.createElement('div');
timerElement.style.position = 'absolute';
timerElement.style.top = '40px';
timerElement.style.left = '10px';
timerElement.style.color = 'white';
timerElement.style.fontSize = '20px';
timerElement.style.fontFamily = 'Arial, sans-serif';
timerElement.innerHTML = `Time: 0s`;
document.body.appendChild(timerElement);

const gameOverElement = document.createElement('div');
gameOverElement.style.position = 'absolute';
gameOverElement.style.top = '50%';
gameOverElement.style.left = '50%';
gameOverElement.style.transform = 'translate(-50%, -50%)';
gameOverElement.style.color = 'white';
gameOverElement.style.fontSize = '30px';
gameOverElement.style.fontFamily = 'Arial, sans-serif';
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
let direction = { x: gridSize, z: 0 }; // Adjust direction for top-down (x, z plane)
let snakeSpeed = 200; // Snake moves every 200 ms
let score = 0;
let startTime = Date.now();
let lastMoveTime = 0;
let isGameOver = false;

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

// End the game
function endGame(message) {
  isGameOver = true;
  gameOverElement.innerHTML = `${message}<br>Final Score: ${score}`;
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
}

// Check for collision with food
function checkCollision() {
  const head = snake[0];
  if (head.position.distanceTo(food.position) < 0.5) {
    // Add a new segment to the snake
    const newSegment = new THREE.Mesh(snakeGeometry, snakeMaterial);
    newSegment.position.copy(snake[snake.length - 1].position);
    snake.push(newSegment);
    scene.add(newSegment);

    // Reposition food
    food.position.set(
      Math.floor(Math.random() * 10 - 5) * gridSize, 
      0.5, 
      Math.floor(Math.random() * 10 - 5) * gridSize
    );

    // Update score
    score += 10;
    scoreElement.innerHTML = `Score: ${score}`;
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

// Start the game loop
animate();
