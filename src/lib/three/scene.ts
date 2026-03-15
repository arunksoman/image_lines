/**
 * Three.js Scene Manager
 *
 * Manages the complete Three.js scene lifecycle including camera, lighting,
 * controls, and render loop. Uses a perforated-panel-aware rendering approach
 * where slots are rendered as cutouts through the panel via stencil buffer technique.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Slot } from '../algorithms/perforation';
import { buildPanel, buildBacklightPlane } from '../geometry/panelBuilder';

export interface SceneManager {
	dispose: () => void;
	resize: (width: number, height: number) => void;
	updateSlots: (slots: Slot[], panelWidth: number, panelHeight: number, panelThickness: number) => void;
	setVisualMode: (mode: 'day' | 'daylight' | 'night' | 'distance') => void;
	getScene: () => THREE.Scene;
	getRenderer: () => THREE.WebGLRenderer;
}

export function createSceneManager(canvas: HTMLCanvasElement): SceneManager {
	// -- Renderer --
	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: true,
		alpha: false,
		powerPreference: 'high-performance',
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.2;

	// -- Scene --
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x0d0d14);

	// Environment — subtle fog for depth
	scene.fog = new THREE.FogExp2(0x0d0d14, 0.00015);

	// -- Camera --
	const camera = new THREE.PerspectiveCamera(45, 1, 1, 50000);
	camera.position.set(0, 0, 2500);

	// -- Controls --
	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true;
	controls.dampingFactor = 0.08;
	controls.minDistance = 200;
	controls.maxDistance = 15000;
	controls.enablePan = true;
	controls.autoRotate = false;

	// -- Lighting setup --
	const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
	scene.add(ambientLight);

	const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.8);
	dirLight.position.set(1500, 2000, 3000);
	dirLight.castShadow = true;
	dirLight.shadow.mapSize.set(2048, 2048);
	dirLight.shadow.camera.near = 100;
	dirLight.shadow.camera.far = 10000;
	dirLight.shadow.camera.left = -2000;
	dirLight.shadow.camera.right = 2000;
	dirLight.shadow.camera.top = 2000;
	dirLight.shadow.camera.bottom = -2000;
	scene.add(dirLight);

	const fillLight = new THREE.DirectionalLight(0x8090ff, 0.4);
	fillLight.position.set(-1000, -500, 1000);
	scene.add(fillLight);

	const rimLight = new THREE.DirectionalLight(0xffccaa, 0.3);
	rimLight.position.set(0, 0, -2000);
	scene.add(rimLight);

	// -- Ground plane (subtle) --
	const groundGeom = new THREE.PlaneGeometry(20000, 20000);
	const groundMat = new THREE.MeshStandardMaterial({
		color: 0x0a0a12,
		roughness: 1.0,
		metalness: 0.0,
	});
	const ground = new THREE.Mesh(groundGeom, groundMat);
	ground.rotation.x = -Math.PI / 2;
	ground.position.y = -800;
	ground.receiveShadow = true;
	scene.add(ground);

	// -- Grid helper --
	const gridHelper = new THREE.GridHelper(4000, 20, 0x1a1a30, 0x111120);
	gridHelper.position.y = -799;
	scene.add(gridHelper);

	// -- Panel objects --
	let panelMesh: THREE.Mesh | null = null;
	let backlightPlane: THREE.Mesh | null = null;
	let slotInstancedMesh: THREE.InstancedMesh | null = null;
	let currentMode: 'day' | 'daylight' | 'night' | 'distance' = 'day';

	function clearPanelObjects() {
		if (panelMesh) {
			scene.remove(panelMesh);
			panelMesh.geometry.dispose();
			(panelMesh.material as THREE.Material).dispose();
			panelMesh = null;
		}
		if (backlightPlane) {
			scene.remove(backlightPlane);
			backlightPlane.geometry.dispose();
			(backlightPlane.material as THREE.Material).dispose();
			backlightPlane = null;
		}
		if (slotInstancedMesh) {
			scene.remove(slotInstancedMesh);
			slotInstancedMesh.geometry.dispose();
			(slotInstancedMesh.material as THREE.Material).dispose();
			slotInstancedMesh = null;
		}
	}

	function updateSlots(slots: Slot[], panelWidth: number, panelHeight: number, panelThickness: number) {
		clearPanelObjects();

		if (slots.length === 0) return;

		// Create panel
		panelMesh = buildPanel(panelWidth, panelHeight, panelThickness);
		scene.add(panelMesh);

		// Create backlight
		backlightPlane = buildBacklightPlane(panelWidth, panelHeight);
		scene.add(backlightPlane);

		// Create slot instanced mesh — rendered as dark cutout rectangles on the front face
		const slotGeometry = new THREE.PlaneGeometry(1, 1);
		const slotMaterial = new THREE.MeshBasicMaterial({
			color: currentMode === 'night' ? 0xfff5e6 : 0x0d0d14,
			side: THREE.DoubleSide,
			transparent: false,
			depthWrite: true,
		});

		slotInstancedMesh = new THREE.InstancedMesh(slotGeometry, slotMaterial, slots.length);
		const dummy = new THREE.Object3D();
		const halfThick = panelThickness / 2 + 0.1;

		for (let i = 0; i < slots.length; i++) {
			const slot = slots[i];
			const x = (slot.x - 0.5) * panelWidth;
			const y = (0.5 - slot.y) * panelHeight;

			dummy.position.set(x, y, halfThick);
			dummy.rotation.set(0, 0, slot.rotation);
			dummy.scale.set(slot.length, slot.width, 1);
			dummy.updateMatrix();
			slotInstancedMesh.setMatrixAt(i, dummy.matrix);
		}

		slotInstancedMesh.instanceMatrix.needsUpdate = true;
		slotInstancedMesh.name = 'slotInstances';
		slotInstancedMesh.frustumCulled = false;
		scene.add(slotInstancedMesh);

		// Apply current visual mode
		applyVisualMode(currentMode);

		// Fit camera
		const maxDim = Math.max(panelWidth, panelHeight);
		camera.position.set(0, 0, maxDim * 1.3);
		controls.target.set(0, 0, 0);
		controls.update();
	}

	function applyVisualMode(mode: 'day' | 'daylight' | 'night' | 'distance') {
		currentMode = mode;

		switch (mode) {
			case 'day':
				scene.background = new THREE.Color(0x0d0d14);
				scene.fog = new THREE.FogExp2(0x0d0d14, 0.00015);
				ambientLight.intensity = 0.6;
				ambientLight.color.set(0x404060);
				dirLight.intensity = 1.8;
				dirLight.color.set(0xfff5e6);
				fillLight.intensity = 0.4;
				if (backlightPlane) backlightPlane.visible = false;
				if (slotInstancedMesh) {
					(slotInstancedMesh.material as THREE.MeshBasicMaterial).color.set(0x0d0d14);
				}
				if (panelMesh) {
					(panelMesh.material as THREE.MeshStandardMaterial).color.set(0x8c8c8c);
					(panelMesh.material as THREE.MeshStandardMaterial).metalness = 0.85;
					(panelMesh.material as THREE.MeshStandardMaterial).roughness = 0.45;
				}
				ground.visible = true;
				groundMat.color.set(0x0a0a12);
				gridHelper.visible = true;
				break;

			case 'daylight':
				scene.background = new THREE.Color(0xf0f4f8);
				scene.fog = new THREE.FogExp2(0xf0f4f8, 0.00008);
				ambientLight.intensity = 1.2;
				ambientLight.color.set(0xffffff);
				dirLight.intensity = 2.0;
				dirLight.color.set(0xfffbe8);
				fillLight.intensity = 0.8;
				if (backlightPlane) backlightPlane.visible = false;
				if (slotInstancedMesh) {
					(slotInstancedMesh.material as THREE.MeshBasicMaterial).color.set(0xf0f4f8);
				}
				if (panelMesh) {
					(panelMesh.material as THREE.MeshStandardMaterial).color.set(0xb0b0b0);
					(panelMesh.material as THREE.MeshStandardMaterial).metalness = 0.7;
					(panelMesh.material as THREE.MeshStandardMaterial).roughness = 0.35;
				}
				ground.visible = true;
				groundMat.color.set(0xe0e0e0);
				gridHelper.visible = true;
				break;

			case 'night':
				scene.background = new THREE.Color(0x020208);
				scene.fog = new THREE.FogExp2(0x020208, 0.0002);
				ambientLight.intensity = 0.1;
				dirLight.intensity = 0.2;
				fillLight.intensity = 0.1;
				if (backlightPlane) backlightPlane.visible = true;
				if (slotInstancedMesh) {
					(slotInstancedMesh.material as THREE.MeshBasicMaterial).color.set(0xfff5e6);
				}
				if (panelMesh) {
					(panelMesh.material as THREE.MeshStandardMaterial).color.set(0x1a1a1a);
					(panelMesh.material as THREE.MeshStandardMaterial).metalness = 0.3;
				}
				ground.visible = false;
				gridHelper.visible = false;
				break;

			case 'distance':
				scene.background = new THREE.Color(0xd4d8e0);
				scene.fog = new THREE.FogExp2(0xd4d8e0, 0.0003);
				ambientLight.intensity = 1.0;
				dirLight.intensity = 1.2;
				dirLight.color.set(0xffffff);
				fillLight.intensity = 0.6;
				if (backlightPlane) backlightPlane.visible = false;
				if (slotInstancedMesh) {
					(slotInstancedMesh.material as THREE.MeshBasicMaterial).color.set(0xd4d8e0);
				}
				if (panelMesh) {
					(panelMesh.material as THREE.MeshStandardMaterial).color.set(0x606068);
					(panelMesh.material as THREE.MeshStandardMaterial).metalness = 0.7;
				}
				ground.visible = true;
				gridHelper.visible = false;
				// Push camera back for distance viewing
				const dist = camera.position.length();
				if (dist < 5000) {
					camera.position.normalize().multiplyScalar(6000);
					controls.update();
				}
				break;
		}
	}

	// -- Animation loop --
	let animationId: number;
	let disposed = false;

	function animate() {
		if (disposed) return;
		animationId = requestAnimationFrame(animate);
		controls.update();
		renderer.render(scene, camera);
	}

	animate();

	// -- Public API --
	return {
		dispose() {
			disposed = true;
			cancelAnimationFrame(animationId);
			clearPanelObjects();
			controls.dispose();
			renderer.dispose();
		},

		resize(width: number, height: number) {
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			renderer.setSize(width, height);
		},

		updateSlots,
		setVisualMode: applyVisualMode,
		getScene: () => scene,
		getRenderer: () => renderer,
	};
}
