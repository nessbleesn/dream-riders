import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const canvas = document.querySelector("#footer-ride, #boomerang-model");

if (canvas) {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 4.1, 11.2);

  const root = new THREE.Group();
  root.rotation.x = -0.11;
  scene.add(root);

  scene.add(new THREE.AmbientLight(0xffffff, 1.15));

  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(3, 6, 5);
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x65e7ff, 1.2);
  fill.position.set(-5, 3, -4);
  scene.add(fill);

  const trackMaterial = new THREE.MeshStandardMaterial({
    color: 0x19bfa8,
    roughness: 0.35,
    metalness: 0.15,
    emissive: 0x063d36,
    emissiveIntensity: 0.18,
  });

  const supportMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4f0e7,
    roughness: 0.5,
    metalness: 0.05,
  });

  const carMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4d2e,
    roughness: 0.38,
    metalness: 0.1,
    emissive: 0x4a0902,
    emissiveIntensity: 0.12,
  });

  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x8edb64,
    roughness: 0.75,
  });

  const points = [];

  for (let i = 0; i <= 16; i += 1) {
    const t = i / 16;
    points.push(new THREE.Vector3(-7 + t * 2.6, -0.2 + t * 4.4, 0));
  }

  for (let i = 1; i <= 16; i += 1) {
    const t = i / 16;
    points.push(new THREE.Vector3(-4.4 + t * 2.2, 4.2 - t * 4.1, 0.18 * Math.sin(t * Math.PI)));
  }

  const center = new THREE.Vector3(0.3, 1.75, 0);
  const radius = 1.65;
  for (let i = 0; i <= 44; i += 1) {
    const angle = -Math.PI / 2 + (i / 44) * Math.PI * 2;
    points.push(new THREE.Vector3(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius, 0.12 * Math.sin(angle * 2)));
  }

  for (let i = 1; i <= 22; i += 1) {
    const t = i / 22;
    points.push(new THREE.Vector3(2 + t * 5.2, 0.55 + Math.sin(t * Math.PI * 1.4) * 1.15, 0.3 * Math.sin(t * Math.PI * 2)));
  }

  const baseCurve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.42);

  const makeRailCurve = (offset) => {
    const railPoints = points.map((point) => point.clone().add(new THREE.Vector3(0, 0, offset)));
    return new THREE.CatmullRomCurve3(railPoints, false, "catmullrom", 0.42);
  };

  const railA = new THREE.Mesh(new THREE.TubeGeometry(makeRailCurve(-0.18), 260, 0.045, 10, false), trackMaterial);
  const railB = new THREE.Mesh(new THREE.TubeGeometry(makeRailCurve(0.18), 260, 0.045, 10, false), trackMaterial);
  root.add(railA, railB);

  const crossbarMaterial = new THREE.MeshStandardMaterial({ color: 0x109885, roughness: 0.4, metalness: 0.08 });
  const tieGeometry = new THREE.BoxGeometry(0.1, 0.08, 0.48);
  for (let i = 4; i < 92; i += 5) {
    const t = i / 96;
    const point = baseCurve.getPointAt(Math.min(t, 0.98));
    const tangent = baseCurve.getTangentAt(Math.min(t, 0.98)).normalize();
    const tie = new THREE.Mesh(tieGeometry, crossbarMaterial);
    tie.position.copy(point);
    tie.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tangent);
    root.add(tie);
  }

  const cylinderBetween = (start, end, radiusValue, material) => {
    const midpoint = start.clone().add(end).multiplyScalar(0.5);
    const direction = end.clone().sub(start);
    const length = direction.length();
    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(radiusValue, radiusValue, length, 12), material);
    cylinder.position.copy(midpoint);
    cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return cylinder;
  };

  for (let i = 7; i < 88; i += 9) {
    const t = i / 96;
    const point = baseCurve.getPointAt(Math.min(t, 0.98));
    const groundLeft = new THREE.Vector3(point.x - 0.38, -1, point.z - 0.42);
    const groundRight = new THREE.Vector3(point.x + 0.38, -1, point.z + 0.42);
    root.add(cylinderBetween(groundLeft, point.clone().add(new THREE.Vector3(-0.08, -0.08, -0.16)), 0.055, supportMaterial));
    root.add(cylinderBetween(groundRight, point.clone().add(new THREE.Vector3(0.08, -0.08, 0.16)), 0.055, supportMaterial));
  }

  const ground = new THREE.Mesh(new THREE.CircleGeometry(9.6, 96), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.05;
  ground.position.z = 0;
  root.add(ground);

  const car = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.32, 0.48), carMaterial);
  body.position.y = 0.08;
  car.add(body);

  const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x25212d, roughness: 0.5 });
  for (let i = -1; i <= 1; i += 2) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.18), seatMaterial);
    seat.position.set(i * 0.16, 0.34, -0.06);
    car.add(seat);
  }

  const riderMaterial = new THREE.MeshStandardMaterial({ color: 0xffcf21, roughness: 0.38 });
  for (let i = -1; i <= 1; i += 2) {
    const rider = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), riderMaterial);
    rider.position.set(i * 0.16, 0.52, -0.06);
    car.add(rider);
  }

  root.add(car);

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(rect.height, 1);
    camera.updateProjectionMatrix();
  };

  window.addEventListener("resize", resize);
  resize();

  const clock = new THREE.Clock();

  const render = () => {
    const elapsed = clock.getElapsedTime();
    const progress = (elapsed * 0.072) % 1;
    const point = baseCurve.getPointAt(progress);
    const tangent = baseCurve.getTangentAt(progress).normalize();
    car.position.copy(point).add(new THREE.Vector3(0, 0.18, 0));
    car.lookAt(point.clone().add(tangent));
    car.rotateY(Math.PI);
    root.rotation.y = Math.sin(elapsed * 0.22) * 0.16;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };

  render();
}
