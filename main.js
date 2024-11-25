import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Color,
  PointLight,
  AmbientLight,
  Raycaster,
  Matrix4,
  BufferGeometry,
  Float32BufferAttribute,
  PointsMaterial,
  Points,
  Box3,
  Vector3,
  SphereGeometry,
  MeshBasicMaterial,
  Mesh
} from 'three';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { XRButton } from 'three/addons/webxr/XRButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, brainModel, controls;
let controller;
let score = 0;
let timeLeft = 60;
let gameActive = false;
let currentGreenPointIndex = -1;

// Matériaux pour les points
const pinkMaterial = new PointsMaterial({
  size: 0.1,
  sizeAttenuation: true,
  color: 0xFF69B4
});

const greenMaterial = new PointsMaterial({
  size: 0.15,
  sizeAttenuation: true,
  color: 0x00FF00,
  transparent: true,
  opacity: 0.8
});

// UI Setup
const setupGameUI = () => {
  // Score Display
  const scoreDisplay = document.createElement('div');
  scoreDisplay.id = 'score-display';
  scoreDisplay.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    color: #00ff9d;
    font-size: 24px;
    text-shadow: 0 0 10px #00ff9d;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    z-index: 1000;
    pointer-events: none;
  `;
  document.body.appendChild(scoreDisplay);

  // Timer Display
  const timerDisplay = document.createElement('div');
  timerDisplay.id = 'timer-display';
  timerDisplay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    color: #00ff9d;
    font-size: 24px;
    text-shadow: 0 0 10px #00ff9d;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    z-index: 1000;
    pointer-events: none;
  `;
  document.body.appendChild(timerDisplay);

  // Start Button
  const startButton = document.createElement('button');
  startButton.id = 'start-button';
  startButton.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 1rem 2rem;
    font-size: 1.2rem;
    border: 2px solid #00ff9d;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    cursor: pointer;
    z-index: 1000;
  `;
  startButton.textContent = 'Start Game';
  startButton.onclick = startGame;
  document.body.appendChild(startButton);

  return { scoreDisplay, timerDisplay, startButton };
};

const updateUIDisplays = () => {
  const scoreDisplay = document.getElementById('score-display');
  const timerDisplay = document.getElementById('timer-display');
  if (scoreDisplay) scoreDisplay.textContent = `Score: ${score}`;
  if (timerDisplay) timerDisplay.textContent = `Time: ${timeLeft}s`;
};

// Game Logic
const startGame = () => {
  score = 0;
  timeLeft = 60;
  gameActive = true;
  
  const startButton = document.getElementById('start-button');
  if (startButton) startButton.style.display = 'none';
  
  updateUIDisplays();
  updateGreenPoint();
  startTimer();
};

const endGame = () => {
  gameActive = false;
  
  const startButton = document.getElementById('start-button');
  if (startButton) {
    startButton.style.display = 'block';
    startButton.innerHTML = `
      <div style="color: #00ff9d; margin-bottom: 10px;">Game Over!</div>
      <div>Final Score: ${score}</div>
      <div style="font-size: 0.8em; margin-top: 10px;">Click to play again</div>
    `;
  }

  if (currentGreenPointIndex !== -1) {
    resetPointColor(currentGreenPointIndex);
  }
};

const startTimer = () => {
  const timerInterval = setInterval(() => {
    if (!gameActive) {
      clearInterval(timerInterval);
      return;
    }
    
    timeLeft--;
    updateUIDisplays();
    
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
};

const updateGreenPoint = () => {
  if (!brainModel || !gameActive) return;

  const positions = brainModel.geometry.attributes.position.array;
  const numPoints = positions.length / 3;

  // Supprimer l'ancien point vert
  const oldGreenPoint = scene.getObjectByName('greenPoint');
  const oldCollisionSphere = scene.getObjectByName('greenPointCollider');
  if (oldGreenPoint) scene.remove(oldGreenPoint);
  if (oldCollisionSphere) scene.remove(oldCollisionSphere);

  // Sélectionner un nouveau point aléatoire
  const oldIndex = currentGreenPointIndex;
  do {
    currentGreenPointIndex = Math.floor(Math.random() * numPoints);
  } while (currentGreenPointIndex === oldIndex);

  // Créer le nouveau point vert
  const greenPointGeometry = new BufferGeometry();
  const greenPointPosition = new Float32Array([
    positions[currentGreenPointIndex * 3],
    positions[currentGreenPointIndex * 3 + 1],
    positions[currentGreenPointIndex * 3 + 2]
  ]);
  greenPointGeometry.setAttribute('position', new Float32BufferAttribute(greenPointPosition, 3));

  const greenPoint = new Points(greenPointGeometry, greenMaterial.clone());
  greenPoint.name = 'greenPoint';
  greenPoint.scale.copy(brainModel.scale);
  greenPoint.position.copy(brainModel.position);

  // Créer la sphère de collision
  const collisionGeometry = new SphereGeometry(0.15);
  const collisionMaterial = new MeshBasicMaterial({ visible: false });
  const collisionSphere = new Mesh(collisionGeometry, collisionMaterial);
  collisionSphere.position.set(
    greenPointPosition[0] * brainModel.scale.x + brainModel.position.x,
    greenPointPosition[1] * brainModel.scale.y + brainModel.position.y,
    greenPointPosition[2] * brainModel.scale.z + brainModel.position.z
  );
  collisionSphere.name = 'greenPointCollider';

  scene.add(greenPoint);
  scene.add(collisionSphere);
};

// XR Controller Event Handler
const onSelect = (event) => {
  if (!gameActive) return;

  const tempMatrix = new Matrix4();
  tempMatrix.identity().extractRotation(controller.matrixWorld);

  const raycaster = new Raycaster();
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

  const collisionSphere = scene.getObjectByName('greenPointCollider');
  if (collisionSphere) {
    const intersects = raycaster.intersectObject(collisionSphere);
    if (intersects.length > 0) {
      // Point touché
      score++;
      updateUIDisplays();
      updateGreenPoint();
      
      // Feedback haptique
      if (controller.gamepad && controller.gamepad.hapticActuators) {
        controller.gamepad.hapticActuators[0].pulse(0.8, 100);
      }
    }
  }
};

// Initialisation
const init = async () => {
  // Scene setup
  scene = new Scene();
  scene.background = new Color(0x000000);

  // Camera setup
  camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.6, 3);

  // Renderer setup
  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  // XR setup
  const xrButton = XRButton.createButton(renderer);
  document.body.appendChild(xrButton);

  // Controller setup
  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);

  // Lights
  const pointLight = new PointLight(0xffffff, 1, 100);
  pointLight.position.set(5, 5, 5);
  scene.add(pointLight);

  const ambientLight = new AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);

  // Load brain model
  const loader = new GLTFLoader();
  loader.load('assets/Brain.glb', (gltf) => {
    setupBrainModel(gltf);
  });

  // UI Setup
  setupGameUI();

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.6, 0);
  controls.update();

  // Event listeners
  window.addEventListener('resize', onWindowResize, false);

  // Animation loop
  renderer.setAnimationLoop(animate);
};

const setupBrainModel = (gltf) => {
  let positions = [];
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      const positionAttribute = child.geometry.attributes.position;
      for (let i = 0; i < positionAttribute.count; i++) {
        positions.push(
          positionAttribute.getX(i),
          positionAttribute.getY(i),
          positionAttribute.getZ(i)
        );
      }
    }
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  
  brainModel = new Points(geometry, pinkMaterial);
  
  const box = new Box3().setFromObject(brainModel);
  const center = box.getCenter(new Vector3());
  const size = box.getSize(new Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 5 / maxDim;

  brainModel.scale.set(scale, scale, scale);
  brainModel.position.set(0, 1.6, -2); // Positionné devant l'utilisateur en VR
  
  scene.add(brainModel);
};

const animate = () => {
  if (brainModel && !renderer.xr.isPresenting) {
    controls.update();
  }
  renderer.render(scene, camera);
};

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

// Démarrage
init();