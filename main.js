import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
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

let scene, camera, renderer, brainModel;
let controller;
let score = 0;
let timeLeft = 60;
let gameActive = false;
let currentGreenPointIndex = -1;
let isDragging = false;
let previousTouch = null;
let currentMode = 'rotate';
let modelStartPosition = null;

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

const setupGameUI = () => {
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
    display: none;
  `;
  document.body.appendChild(scoreDisplay);

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
    display: none;
  `;
  document.body.appendChild(timerDisplay);

  const modeButton = document.createElement('button');
  modeButton.id = 'mode-button';
  modeButton.textContent = 'Mode: Rotate';
  modeButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 20px;
    background-color: #00ff9d;
    color: black;
    border: none;
    border-radius: 5px;
    font-size: 18px;
    cursor: pointer;
    z-index: 1000;
    display: none;
  `;
  document.body.appendChild(modeButton);

  modeButton.addEventListener('click', () => {
    currentMode = currentMode === 'rotate' ? 'move' : 'rotate';
    modeButton.textContent = `Mode: ${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}`;
  });

  return { scoreDisplay, timerDisplay, modeButton };
};

const updateUIDisplays = () => {
  const scoreDisplay = document.getElementById('score-display');
  const timerDisplay = document.getElementById('timer-display');
  if (scoreDisplay) {
    scoreDisplay.textContent = `Score: ${score}`;
    scoreDisplay.style.display = 'block';
  }
  if (timerDisplay) {
    timerDisplay.textContent = `Time: ${timeLeft}s`;
    timerDisplay.style.display = 'block';
  }
};

const handleTouchStart = (event) => {
  isDragging = true;
  previousTouch = {
    x: event.touches[0].clientX,
    y: event.touches[0].clientY
  };
  
  if (currentMode === 'move' && brainModel) {
    modelStartPosition = brainModel.position.clone();
  }
};

const handleTouchMove = (event) => {
  if (!isDragging || !brainModel) return;

  const touch = event.touches[0];
  const deltaX = touch.clientX - previousTouch.x;
  const deltaY = touch.clientY - previousTouch.y;

  if (currentMode === 'rotate') {
    brainModel.rotation.y += deltaX * 0.01;
    brainModel.rotation.x += deltaY * 0.01;
  } else {
    brainModel.position.x = modelStartPosition.x + (deltaX * 0.005);
    brainModel.position.z = modelStartPosition.z - (deltaY * 0.005);
    
    const greenPoint = scene.getObjectByName('greenPoint');
    const collisionSphere = scene.getObjectByName('greenPointCollider');
    if (greenPoint) {
      greenPoint.position.copy(brainModel.position);
    }
    if (collisionSphere) {
      const worldPosition = new Vector3(
        collisionSphere.position.x,
        collisionSphere.position.y,
        collisionSphere.position.z
      ).add(brainModel.position.clone().sub(modelStartPosition));
      collisionSphere.position.copy(worldPosition);
    }
  }

  previousTouch = {
    x: touch.clientX,
    y: touch.clientY
  };
};

const handleTouchEnd = () => {
  isDragging = false;
  previousTouch = null;
  modelStartPosition = null;
};

const startGame = () => {
  if (!gameActive) {
    score = 0;
    timeLeft = 60;
    gameActive = true;
    updateUIDisplays();
    updateGreenPoint();
    startTimer();
  }
};

const endGame = () => {
  gameActive = false;
  
  const scoreDisplay = document.getElementById('score-display');
  const timerDisplay = document.getElementById('timer-display');
  if (scoreDisplay) scoreDisplay.style.display = 'none';
  if (timerDisplay) timerDisplay.style.display = 'none';

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

  const oldGreenPoint = scene.getObjectByName('greenPoint');
  const oldCollisionSphere = scene.getObjectByName('greenPointCollider');
  if (oldGreenPoint) scene.remove(oldGreenPoint);
  if (oldCollisionSphere) scene.remove(oldCollisionSphere);

  const oldIndex = currentGreenPointIndex;
  do {
    currentGreenPointIndex = Math.floor(Math.random() * numPoints);
  } while (currentGreenPointIndex === oldIndex);

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
  greenPoint.rotation.copy(brainModel.rotation);

  const collisionGeometry = new SphereGeometry(0.15);
  const collisionMaterial = new MeshBasicMaterial({ visible: false });
  const collisionSphere = new Mesh(collisionGeometry, collisionMaterial);
  
  const worldPosition = new Vector3(
    greenPointPosition[0],
    greenPointPosition[1],
    greenPointPosition[2]
  ).applyMatrix4(brainModel.matrixWorld);
  
  collisionSphere.position.copy(worldPosition);
  collisionSphere.name = 'greenPointCollider';

  scene.add(greenPoint);
  scene.add(collisionSphere);
};

const resetPointColor = (index) => {
  if (!brainModel || index === -1) return;
  currentGreenPointIndex = -1;
};

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
      score++;
      updateUIDisplays();
      updateGreenPoint();
      
      if (controller.gamepad && controller.gamepad.hapticActuators) {
        controller.gamepad.hapticActuators[0].pulse(0.8, 100);
      }
    }
  }
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
  brainModel.position.set(0, 1.6, -2);
};

const init = async () => {
  scene = new Scene();

  camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.6, 3);

  renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  document.body.style.backgroundColor = 'white';
  renderer.domElement.style.display = 'none';

  const xrButton = XRButton.createButton(renderer);
  document.body.appendChild(xrButton);

  renderer.xr.addEventListener('sessionstart', () => {
    renderer.domElement.style.display = 'block';
    scene.add(brainModel);
    document.getElementById('mode-button').style.display = 'block';
  });

  renderer.xr.addEventListener('sessionend', () => {
    renderer.domElement.style.display = 'none';
    scene.remove(brainModel);
    document.getElementById('mode-button').style.display = 'none';
    endGame();
  });

  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  controller.addEventListener('selectstart', startGame);
  scene.add(controller);

  const pointLight = new PointLight(0xffffff, 1, 100);
  pointLight.position.set(5, 5, 5);
  scene.add(pointLight);

  const ambientLight = new AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);

  const loader = new GLTFLoader();
  loader.load('/Brainwashed_XR/assets/Brain.glb', (gltf) => {
    setupBrainModel(gltf);
  });

  setupGameUI();

  renderer.domElement.addEventListener('touchstart', handleTouchStart, false);
  renderer.domElement.addEventListener('touchmove', handleTouchMove, false);
  renderer.domElement.addEventListener('touchend', handleTouchEnd, false);
  
  window.addEventListener('resize', onWindowResize, false);
  renderer.setAnimationLoop(animate);
};

const animate = () => {
  if (brainModel && scene.getObjectById(brainModel.id)) {
    const greenPoint = scene.getObjectByName('greenPoint');
    if (greenPoint) {
      greenPoint.rotation.copy(brainModel.rotation);
    }
  }
  renderer.render(scene, camera);
};

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

init();