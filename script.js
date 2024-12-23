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
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load textures
const snakeTexture = new THREE.TextureLoader().load('assets/CubeTexture - Copy.png');
const foodTexture = new THREE.TextureLoader().load('assets/Snake Icon.png');

// Add a background grid
const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0x444444); // Grid size and divisions
scene.add(gridHelper);

// Snake setup
const snakeGeometry = new THREE.BoxGeometry(1, 1, 1);
const snakeMaterial = new THREE.MeshBasicMaterial({ map: snakeTexture });
const snake = [];
const initialSegment = new THREE.Mesh(snakeGeometry, snakeMaterial);
scene.add(initialSegment);
snake.push(initialSegment);

// Food setup
const foodGeometry = new THREE.BoxGeometry(1, 1, 1);
const foodMaterial = new THREE.MeshBasicMaterial({ map: foodTexture });
const food = new THREE.Mesh(foodGeometry, foodMaterial);
food.position.set(Math.random() * 10 - 5, 0.5, Math.random() * 10 - 5);
scene.add(food);

// HTML elements for score and timer
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

// Game variables
let direction = { x: 1, z: 0 }; // Adjust direction for top-down (x, z plane)
let snakeSpeed = 0.1;
let lastUpdateTime = 0;
let score = 0;
let startTime = Date.now();

// Movement control
document.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'ArrowUp':
      if (direction.z === 0) direction = { x: 0, z: -1 };
      break;
    case 'ArrowDown':
      if (direction.z === 0) direction = { x: 0, z: 1 };
      break;
    case 'ArrowLeft':
      if (direction.x === 0) direction = { x: -1, z: 0 };
      break;
    case 'ArrowRight':
      if (direction.x === 0) direction = { x: 1, z: 0 };
      break;
  }
});

// Update snake position
function updateSnake(deltaTime) {
  const head = snake[0];

  // Move snake segments
  for (let i = snake.length - 1; i > 0; i--) {
    snake[i].position.copy(snake[i - 1].position);
  }

  // Update head position
  head.position.x += direction.x * snakeSpeed * deltaTime;
  head.position.z += direction.z * snakeSpeed * deltaTime;
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
    food.position.set(Math.random() * 10 - 5, 0.5, Math.random() * 10 - 5);

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
  const deltaTime = time - lastUpdateTime;
  if (deltaTime > 100) {
    updateSnake(deltaTime);
    checkCollision();
    updateTimer();
    lastUpdateTime = time;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Start the game loop
animate();
