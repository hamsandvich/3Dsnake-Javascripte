import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import Stats from 'stats.js'

const scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera( 75, 800 / 600, 1, 1000 );
//Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(800, 600);
camera.position.setY(140);
camera.rotateX(-1.570795326417451);
camera.rotateY(0);
camera.rotateZ(0);
renderer.render(scene, camera);

//const controls = new OrbitControls(camera, renderer.domElement);

//Lighting 
const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5,5,5);

const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(pointLight,ambientLight);
function addcube(colorz) {
  const texture = new THREE.TextureLoader().load( 'CubeTexture - Copy.png' );
  var geometry = new THREE.BoxGeometry( 10, 10, 10 );
  var material = new THREE.MeshBasicMaterial( { color: colorz } );
  var cube = new THREE.Mesh( geometry, material );
  return cube;
  
}
var snake = [];
var newCube = addcube(0xffffff);
scene.add(newCube);
snake.push(newCube);
var Head = addcube(0xffffff);
scene.add(Head);
Head.position.set(1,1,1);

function drawboarder(){
  //boarder 
  const points = [];
  const material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
  //bottom side
  points.push( new THREE.Vector3( -100, 0, 100 ) );
  points.push( new THREE.Vector3( 100, 0, 100 ) );
  //left side
  points.push( new THREE.Vector3( -100, 0, 100 ) );
  points.push( new THREE.Vector3( -100, 0, -100 ) );
  ///top side
  points.push( new THREE.Vector3( -100, 0, -100 ) );
  points.push( new THREE.Vector3( 100, 0, -100 ) );
  //right side
  points.push( new THREE.Vector3( 100, 0, 100 ) );
  points.push( new THREE.Vector3( 100, 0, -100 ) );
  const geometry = new THREE.BufferGeometry().setFromPoints( points );
  const line = new THREE.Line( geometry, material );
  scene.add( line );
}

drawboarder();

// Helper Onjects
//Shows where point light is and where its pointing
const lightHelper = new THREE.PointLightHelper(pointLight);
//plan grid
const gridHelper = new THREE.GridHelper(200,50);
//scene.add(lightHelper,gridHelper);

var b = new THREE.Vector3( );

//Movement

//speed of movement
var speedPostive = 1;
var speedNegative = -1;
var up = false;
var down = false;
var left = false;
var right= true;
//movement controls
function gameControl(event){
  var keyCode = event.keyCode;
  //console.log(keyCode);
  if (keyCode == 40 && down == false) {
    down = false;
    up = true;
    left = false;
    right = false;
  } 
  else if (keyCode == 38 && up == false) {
    down = true;
    up = false;
    left = false;
    right = false;
      
  } 
  else if (keyCode == 39 && left == false) {
    down = false;
    up = false;
    left = false;
    right = true;
      
  } 
  else if (keyCode == 37 && right == false) {
    down = false;
    up = false;
    left = true;
    right = false;
  } 
}
document.addEventListener("keydown", gameControl)

function clearScene() {
  var to_remove = [];

  scene.traverse ( function( child ) {
      if ( child instanceof THREE.Mesh && !child.userData.keepMe === true ) {
          to_remove.push( child );
       }
  } );

  for ( var i = 0; i < to_remove.length; i++ ) {
      scene.remove( to_remove[i] );
  }
}

function movementcube(){


    if(up  ){
      Head.translateZ(speedPostive);
      
    }
    if(down ){
      Head.translateZ(speedNegative);
      
    }
    if(left  ){
      Head.translateX(speedNegative);
      
    }
    if(right){
      Head.translateX(speedPostive);
      
    }
    followSnake();

}
var movementTimer = 0;
var movementtime = 1;

function followSnake(){
  movementTimer = movementTimer + 1;
  
  if (movementTimer == movementtime){
    console.log(movementTimer);
    snake[0].position.x = Head.position.x;
    snake[0].position.z = Head.position.z;
    movementTimer = 0;
  }
  for(let i = snake.length - 1; i >= 1; i--){
    
    if (i > 0){
      let newPos = new THREE.Vector3(snake[i-1].position.x, snake[i-1].position.y, snake[i-1].position.z);

      snake[i].position.x = newPos.x ;
      
      snake[i].position.z = newPos.z ;

        if(i > 9 && i <= snake.length){
          if (snake[i].position.x == Head.position.x && snake[i].position.z == Head.position.z){
            alert("You Lose\n" + " \nYour Score is " + score);
            down = false;
            up = false;
            left = true;
            right = false;
            Head.position.set(1,1,1);
            
            appleAlive = false;
            if(score > highScore){
              highScore = score;
              displayHighScore();
              }
            snake = [];
            clearScene();
            firstSpawn = false;
            Head = addcube(0xffffff);
            scene.add(Head);
            var newCube = addcube(0xffffff);
            scene.add(newCube);
            snake.push(newCube);
            score = 0;
          }
          else if ((snake[i].position.x <= random + 6 && snake[i].position.x >= random - 6) && (snake[i].position.z <= random2 + 6 && snake[i].position.z >= random2 - 6)){
            appleAlive = false;
            console.log("apple spawn inside the snake")
          }
        }
            
    }
  }
}

function grow(){
  var newCube = addcube(0xffffff);
  newCube.position.x = 400
  newCube.position.y = 0
  newCube.position.z = 400
  scene.add(newCube);
  snake.push(newCube);
}
//Food Varibles
var appleAlive = false;
var green = false;
var Apple = addcube(0xff0000);
var firstSpawn = false;
var timer = 0;
//x
var random = 0;
//z
var random2 = 0;
// score
var score = -1;
//Apple controller
function appleController() {
  if((Head.position.x <= random + 6 && Head.position.x >= random - 6) && (Head.position.z <= random2 + 6 && Head.position.z >= random2 - 6)){
    appleAlive = false;
    score = score + 1;
    console.log(score);
    if( score > 0){
      grow();
      grow();
      grow();
    }
  }

}
function foodController(){
  timer = timer + 1;
  if(appleAlive && timer > 15){
    if (green){
      timer = 0;
      Apple.material.color.setHex(0x990000);
      green = false;
      
      
    }
    else if(green == false && timer > 15){
      timer = 0;
      Apple.material.color.setHex(0x00FF00);
      green = true;
      
    }
  }
  
  else if(!appleAlive){
    random = Math.random()* (99 - (-99)) + (-99);
    random2 = Math.random() * (99 - (-99)) + (-99);
    console.log(random,random2);
    Apple.position.set(random,0,random2);
    if (firstSpawn == false){
      scene.add(Apple);
      firstSpawn = true;
      Apple.position.set(random,0,random2);
    }
    appleAlive = true;
  }
  
}
//debug info
var stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

var highScore = 0;

function failstate(){

  if(Head.position.x > 100 || Head.position.x < -100 || Head.position.z > 100 || Head.position.z < -100){
    alert("You Lose\n" + " \nYour Score is " + score);
    down = false;
    up = false;
    left = true;
    right = false;
    Head.position.set(1,1,1);
    
    
    appleAlive = false;
    if(score > highScore){
      highScore = score;
      displayHighScore();
    }
    snake = [];
    clearScene();
    firstSpawn = false;
    Head = addcube(0xffffff);
    scene.add(Head);
    var newCube = addcube(0xffffff);
    scene.add(newCube);
    snake.push(newCube);
    score = 0;
}
}
function displayScore(){
  document.getElementById("score").innerHTML = "Score: " + score ;
}
function displayHighScore(){
  document.getElementById("highscore").innerHTML = "HighScore: " + highScore;
}
displayHighScore();
// animations
function animete() {

  stats.begin();
  displayScore();
  appleController()
  requestAnimationFrame(animete);
  foodController();
  failstate();
  movementcube();
  renderer.render(scene,camera);
  stats.end();
}
animete();