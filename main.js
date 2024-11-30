"use strict";

// Import only what you need, to help your bundler optimize final code size using tree shaking
// see https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking)

import {
  AmbientLight,
  BoxGeometry,
  Clock,
  Color,
  CylinderGeometry,
  HemisphereLight,
  MeshBasicMaterial,
  Mesh,
  MeshNormalMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  BufferGeometry,
  SphereGeometry,
  Float32BufferAttribute,
  PointsMaterial,
  Points,
  Box3,
  Vector3,
  Scene,
  WebGLRenderer,
  Raycaster
} from './node_modules/three/src/Three.js';

// XR Emulator
import { DevUI } from './node_modules/@iwer/devui/lib/index.js';
import { XRDevice, metaQuest3 } from './node_modules/iwer/lib/index.js';

// XR
import { XRButton } from './node_modules/three/examples/jsm/webxr/XRButton.js';

// Consider using alternatives like Oimo or cannon-es
import {
  OrbitControls
} from './node_modules/three/addons/controls/OrbitControls.js';

import {
  GLTFLoader
} from './node_modules/three/addons/loaders/GLTFLoader.js';

// Example of hard link to official repo for data, if needed
// const MODEL_PATH = 'https://raw.githubusercontent.com/mrdoob/js/r148/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb';

async function setupXR(xrMode) {

  if (xrMode !== 'immersive-vr') return;

  // iwer setup: emulate vr session
  let nativeWebXRSupport = false;
  if (navigator.xr) {
    nativeWebXRSupport = await navigator.xr.isSessionSupported(xrMode);
  }

  if (!nativeWebXRSupport) {
    const xrDevice = new XRDevice(metaQuest3);
    xrDevice.installRuntime();
    xrDevice.fovy = (75 / 180) * Math.PI;
    xrDevice.ipd = 0;
    window.xrdevice = xrDevice;
    xrDevice.controllers.right.position.set(0.15649, 1.43474, -0.38368);
    xrDevice.controllers.right.quaternion.set(
      0.14766305685043335,
      0.02471366710960865,
      -0.0037767395842820406,
      0.9887216687202454,
    );
    xrDevice.controllers.left.position.set(-0.15649, 1.43474, -0.38368);
    xrDevice.controllers.left.quaternion.set(
      0.14766305685043335,
      0.02471366710960865,
      -0.0037767395842820406,
      0.9887216687202454,
    );
    new DevUI(xrDevice);
  }
}

await setupXR('immersive-ar');



// INSERT CODE HERE
let camera, scene, renderer, brainModel;
let controller;
let placed = 0;
let score = 0;
let timeLeft = 60;
let gameActive = false;
let currentGreenPointIndex = -1;


const pinkMaterial = new PointsMaterial({
  size: 0.05,
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


const startGame = () => {
  //score = 0;
  //timeLeft = 60;
  gameActive = true;
  
  //const startButton = document.getElementById('start-button');
  //if (startButton) startButton.style.display = 'none';
  
  //updateUIDisplays();
  updateGreenPoint();
  //startTimer();
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
  if (touchableObjects.length > 0) touchableObjects.pop();

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

  touchableObjects.push(collisionSphere);

  scene.add(greenPoint);
  scene.add(collisionSphere);
};




const raycaster = new Raycaster();
const touchableObjects = [];

const detectTouch = () => {
  // Obtenez la position de la main ou du contrôleur
  const handPosition = new Vector3();
  controller.getWorldPosition(handPosition); // Position de la main/contrôleur

  // Configurez le raycaster
  raycaster.set(handPosition, new Vector3(0, 0, -1)); // Rayon vers l'avant
  const intersects = raycaster.intersectObjects(touchableObjects);

  if (intersects.length > 0) {
    // Si un objet est touché, augmentez le score
    updateScore(1); // Ajoute 1 point
    console.log("Touché !");
  }
};

const clock = new Clock();

// Main loop
const animate = () => {

  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  // can be used in shaders: uniforms.u_time.value = elapsed;
  detectTouch();
  renderer.render(scene, camera);
};


const init = () => {
  scene = new Scene();

  const aspect = window.innerWidth / window.innerHeight;
  camera = new PerspectiveCamera(75, aspect, 0.1, 10); // meters
  camera.position.set(0, 1.6, 3);

  const light = new AmbientLight(0xffffff, 1.0); // soft white light
  scene.add(light);

  const hemiLight = new HemisphereLight(0xffffff, 0xbbbbff, 3);
  hemiLight.position.set(0.5, 1, 0.25);
  scene.add(hemiLight);

  renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate); // requestAnimationFrame() replacement, compatible with XR 
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);


  const xrButton = XRButton.createButton(renderer, {});
  xrButton.style.backgroundColor = 'skyblue';
  document.body.appendChild(xrButton);

  const controls = new OrbitControls(camera, renderer.domElement);
  //controls.listenToKeyEvents(window); // optional
  controls.target.set(0, 1.6, 0);
  controls.update();

  // Handle input: see THREE.js webxr_ar_cones

  const geometry = new CylinderGeometry(0, 0.05, 0.2, 32).rotateX(Math.PI / 2);

  const onSelect = (event) => {
    if (placed === 0) {
      const loader = new GLTFLoader();
      loader.load('/three_vite_xr/assets/models/Brain.glb', (gltf) => {
        setupBrainModel(gltf);
  
        // Démarrer le jeu après 5 secondes
        if (!gameActive) {
          startGame();
        }
      });
      placed++;
    }
  };

  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);


  window.addEventListener('resize', onWindowResize, false);

}

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
  const scale = 5 / (maxDim * 4);

  brainModel.scale.set(scale, scale, scale);
  brainModel.position.set(0, 0, -1).applyMatrix4(controller.matrixWorld);
  brainModel.quaternion.setFromRotationMatrix(controller.matrixWorld);
  
  scene.add(brainModel);
};

init();

//


function loadData() {
  new GLTFLoader()
    .setPath('three_vite_xr/assets/models')
    .load('Brain.glb', gltfReader);
}


function gltfReader(gltf) {
  let testModel = null;

  testModel = gltf.scene;

  if (testModel != null) {
    console.log("Model loaded:  " + testModel);
    scene.add(gltf.scene);
  } else {
    console.log("Load FAILED.  ");
  }
}

loadData();



// camera.position.z = 3;


function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

};
