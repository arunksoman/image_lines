/**
 * Facade Scene Manager — Three.js scene for the facade panel layout page.
 *
 * Manages model display, plane selection (raycasting), panel grid rendering
 * via InstancedMesh, material presets, and GLB export.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import type { FacadePlane } from '$lib/facade/planeSelector';
import { detectPlane } from '$lib/facade/planeSelector';
import { computePanelLayout } from '$lib/facade/panelLayout';
import { generatePanelPattern, MATERIAL_PRESETS, type MaterialPresetName } from '$lib/facade/panelTypes';
import type { PanelTypeWeights } from '$lib/stores/facadeSettings.svelte';

export interface PanelUpdateResult {
	panels: number;
	perforations: number;
}

export interface FacadeSceneManager {
	dispose: () => void;
	resize: (width: number, height: number) => void;
	setTheme: (theme: 'dark' | 'light') => void;
	loadModel: (model: THREE.Group, name: string) => void;
	enableSelection: (callback: (plane: FacadePlane) => void) => void;
	disableSelection: () => void;
	updateAllPanels: (
		planes: FacadePlane[],
		panelTypeWeights: PanelTypeWeights,
		panelWidthMm: number,
		panelHeightMm: number,
		panelThicknessMm: number,
		density: number,
		holeSize: number,
		patternScale: number
	) => PanelUpdateResult;
	addHighlight: (plane: FacadePlane) => void;
	clearHighlights: () => void;
	clearPanels: () => void;
	setMaterial: (preset: MaterialPresetName) => void;
	captureImage: () => string;
	exportGlb: () => Promise<void>;
	getCanvas: () => HTMLCanvasElement;
}

export function createFacadeSceneManager(canvas: HTMLCanvasElement): FacadeSceneManager {
	// ── Renderer ──
	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: true,
		alpha: false,
		powerPreference: 'high-performance',
		preserveDrawingBuffer: true,
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.1;

	// ── Scene ──
	const scene = new THREE.Scene();
	let facadeTheme: 'dark' | 'light' = 'dark';
	scene.background = new THREE.Color(0x1a1a2e);
	scene.fog = new THREE.FogExp2(0x1a1a2e, 0.006);

	// ── Camera ──
	const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
	camera.position.set(18, 12, 22);

	// ── Controls ──
	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true;
	controls.dampingFactor = 0.08;
	controls.minDistance = 3;
	controls.maxDistance = 150;
	controls.target.set(0, 5, 0);

	// ── Lights ──
	const ambient = new THREE.AmbientLight(0x404060, 0.8);
	scene.add(ambient);

	const dirLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
	dirLight.position.set(20, 30, 15);
	dirLight.castShadow = true;
	dirLight.shadow.mapSize.set(2048, 2048);
	dirLight.shadow.camera.near = 1;
	dirLight.shadow.camera.far = 100;
	dirLight.shadow.camera.left = -30;
	dirLight.shadow.camera.right = 30;
	dirLight.shadow.camera.top = 30;
	dirLight.shadow.camera.bottom = -30;
	scene.add(dirLight);

	const fillLight = new THREE.DirectionalLight(0x8090ff, 0.5);
	fillLight.position.set(-10, 5, -10);
	scene.add(fillLight);

	// ── Ground ──
	const groundGeom = new THREE.PlaneGeometry(200, 200);
	const groundMat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 1, metalness: 0 });
	const ground = new THREE.Mesh(groundGeom, groundMat);
	ground.rotation.x = -Math.PI / 2;
	ground.receiveShadow = true;
	scene.add(ground);

	const grid = new THREE.GridHelper(40, 20, 0x2a2a40, 0x1a1a30);
	grid.position.y = 0.01;
	scene.add(grid);

	// ── State ──
	let facadeModel: THREE.Group | null = null;
	let highlightMeshes: THREE.Mesh[] = [];
	let panelGroup: THREE.Group | null = null;
	let selectionEnabled = false;
	let selectionCallback: ((plane: FacadePlane) => void) | null = null;
	let currentMaterial: MaterialPresetName = 'steel';

	// ── Click handler for plane selection ──
	function handleClick(event: MouseEvent) {
		if (!selectionEnabled || !facadeModel) return;
		const rect = canvas.getBoundingClientRect();
		const plane = detectPlane(event, camera, facadeModel, rect);
		if (plane && selectionCallback) {
			addHighlight(plane);
			selectionCallback(plane);
		}
	}
	canvas.addEventListener('click', handleClick);

	function addHighlight(plane: FacadePlane) {
		const geom = new THREE.PlaneGeometry(plane.width, plane.height);
		const mat = new THREE.MeshBasicMaterial({
			color: 0x4488ff,
			transparent: true,
			opacity: 0.12,
			side: THREE.DoubleSide,
			depthWrite: false,
		});
		const mesh = new THREE.Mesh(geom, mat);
		mesh.position.copy(plane.origin).addScaledVector(plane.normal, 0.02);
		mesh.quaternion.copy(plane.quaternion);
		mesh.renderOrder = 1;
		scene.add(mesh);
		highlightMeshes.push(mesh);
	}

	function clearHighlights() {
		for (const mesh of highlightMeshes) {
			scene.remove(mesh);
			mesh.geometry.dispose();
			(mesh.material as THREE.Material).dispose();
		}
		highlightMeshes = [];
	}

	// ── Panel management ──
	function disposePanelGroup() {
		if (!panelGroup) return;
		panelGroup.traverse((obj) => {
			if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
				obj.geometry.dispose();
				const mat = obj.material;
				if (Array.isArray(mat)) mat.forEach(m => m.dispose());
				else mat.dispose();
			}
		});
		scene.remove(panelGroup);
		panelGroup = null;
	}

	function clearPanels() {
		disposePanelGroup();
	}

	function updateAllPanels(
		planes: FacadePlane[],
		panelTypeWeights: PanelTypeWeights,
		panelWidthMm: number,
		panelHeightMm: number,
		panelThicknessMm: number,
		density: number,
		holeSize: number,
		patternScale: number
	): PanelUpdateResult {
		disposePanelGroup();
		panelGroup = new THREE.Group();
		panelGroup.name = 'panelSystem';

		let totalPanels = 0;
		let totalPerfs = 0;

		for (const plane of planes) {
			const instances = computePanelLayout(plane, panelWidthMm, panelHeightMm, panelTypeWeights);
			if (instances.length === 0) continue;

			const panelW = panelWidthMm / 1000;
			const panelH = panelHeightMm / 1000;
			const panelT = panelThicknessMm / 1000;
			const preset = MATERIAL_PRESETS[currentMaterial];
			const dummy = new THREE.Object3D();

			// Group instances by panel type
			const byType: Record<string, typeof instances> = {};
			for (const inst of instances) {
				(byType[inst.panelType] ??= []).push(inst);
			}

			for (const [type, typeInstances] of Object.entries(byType)) {
				// Panel boxes — one InstancedMesh per type
				const panelGeom = new THREE.BoxGeometry(panelW, panelH, panelT);
				const panelMat = new THREE.MeshStandardMaterial({
					color: preset.color,
					roughness: preset.roughness,
					metalness: preset.metalness,
					side: THREE.DoubleSide,
				});
				const panelMesh = new THREE.InstancedMesh(panelGeom, panelMat, typeInstances.length);
				panelMesh.castShadow = true;
				panelMesh.receiveShadow = true;
				panelMesh.frustumCulled = false;
				panelMesh.name = `panels_${type}`;

				for (let i = 0; i < typeInstances.length; i++) {
					const inst = typeInstances[i];
					dummy.position.copy(inst.position);
					dummy.quaternion.copy(inst.quaternion);
					dummy.scale.set(1, 1, 1);
					dummy.updateMatrix();
					panelMesh.setMatrixAt(i, dummy.matrix);
				}
				panelMesh.instanceMatrix.needsUpdate = true;
				panelGroup.add(panelMesh);

				// Perforations — InstancedMesh of PlaneGeometry
				const pattern = generatePanelPattern(
					type as 'A' | 'B' | 'C',
					density, holeSize, panelWidthMm, panelHeightMm, patternScale
				);
				if (pattern.length === 0) continue;

				const perfCount = typeInstances.length * pattern.length;
				totalPerfs += perfCount;

				const perfGeom = new THREE.PlaneGeometry(1, 1);
				const perfMat = new THREE.MeshBasicMaterial({
					color: facadeTheme === 'light' ? 0xe8ecf0 : 0x1a1a2e,
					side: THREE.DoubleSide,
				});
				const perfMesh = new THREE.InstancedMesh(perfGeom, perfMat, perfCount);
				perfMesh.frustumCulled = false;
				perfMesh.name = `perfs_${type}`;

				let idx = 0;
				for (const inst of typeInstances) {
					for (const slot of pattern) {
						// Local position on panel face (panel is in XY plane, front at +Z)
						const localPos = new THREE.Vector3(
							(slot.x - 0.5) * panelW,
							(slot.y - 0.5) * panelH,
							panelT / 2 + 0.001
						);
						// Transform to world
						const worldPos = localPos.applyQuaternion(inst.quaternion).add(inst.position);
						dummy.position.copy(worldPos);
						dummy.quaternion.copy(inst.quaternion);
						dummy.scale.set(slot.width * panelW, slot.height * panelH, 1);
						dummy.updateMatrix();
						perfMesh.setMatrixAt(idx, dummy.matrix);
						idx++;
					}
				}
				perfMesh.instanceMatrix.needsUpdate = true;
				panelGroup.add(perfMesh);
			}

			totalPanels += instances.length;
		}

		scene.add(panelGroup);
		return { panels: totalPanels, perforations: totalPerfs };
	}

	function setMaterial(preset: MaterialPresetName) {
		currentMaterial = preset;
		if (!panelGroup) return;
		const p = MATERIAL_PRESETS[preset];
		panelGroup.traverse((obj) => {
			if (obj instanceof THREE.InstancedMesh && obj.name.startsWith('panels_')) {
				const mat = obj.material as THREE.MeshStandardMaterial;
				mat.color.setHex(p.color);
				mat.roughness = p.roughness;
				mat.metalness = p.metalness;
				mat.needsUpdate = true;
			}
		});
	}

	// ── Model management ──
	function loadModel(model: THREE.Group, _name: string) {
		if (facadeModel) {
			scene.remove(facadeModel);
			facadeModel.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					child.geometry.dispose();
					const mat = child.material;
					if (Array.isArray(mat)) mat.forEach(m => m.dispose());
					else mat.dispose();
				}
			});
		}
		clearPanels();
		clearHighlights();

		facadeModel = model;
		scene.add(facadeModel);

		// Fit camera to model
		const box = new THREE.Box3().setFromObject(model);
		const center = box.getCenter(new THREE.Vector3());
		const size = box.getSize(new THREE.Vector3());
		const maxDim = Math.max(size.x, size.y, size.z);

		controls.target.copy(center);
		camera.position.set(
			center.x + maxDim * 0.8,
			center.y + maxDim * 0.4,
			center.z + maxDim * 1.2
		);
		controls.update();
	}

	// ── Export ──
	function captureImage(): string {
		renderer.render(scene, camera);
		return canvas.toDataURL('image/png');
	}

	async function exportGlb(): Promise<void> {
		// Temporarily hide non-exportable objects
		ground.visible = false;
		grid.visible = false;
		for (const hm of highlightMeshes) hm.visible = false;

		const exporter = new GLTFExporter();
		return new Promise<void>((resolve, reject) => {
			exporter.parse(
				scene,
				(result) => {
					ground.visible = true;
					grid.visible = true;
					for (const hm of highlightMeshes) hm.visible = true;

					if (result instanceof ArrayBuffer) {
						const blob = new Blob([result], { type: 'application/octet-stream' });
						const url = URL.createObjectURL(blob);
						const a = document.createElement('a');
						a.href = url;
						a.download = 'facade-panels.glb';
						a.click();
						URL.revokeObjectURL(url);
					}
					resolve();
				},
				(error) => {
					ground.visible = true;
					grid.visible = true;
					for (const hm of highlightMeshes) hm.visible = true;
					reject(error);
				},
				{ binary: true }
			);
		});
	}

	// ── Animation loop ──
	let animationId: number;
	let disposed = false;

	function animate() {
		if (disposed) return;
		animationId = requestAnimationFrame(animate);
		controls.update();
		renderer.render(scene, camera);
	}
	animate();

	// ── Public API ──
	return {
		dispose() {
			disposed = true;
			cancelAnimationFrame(animationId);
			canvas.removeEventListener('click', handleClick);
			clearPanels();
			clearHighlights();
			if (facadeModel) scene.remove(facadeModel);
			controls.dispose();
			renderer.dispose();
		},
		resize(width: number, height: number) {
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			renderer.setSize(width, height);
		},
		setTheme(theme: 'dark' | 'light') {
			facadeTheme = theme;
			const isLight = theme === 'light';
			const bg = isLight ? 0xe8ecf0 : 0x1a1a2e;
			scene.background = new THREE.Color(bg);
			(scene.fog as THREE.FogExp2).color.set(bg);
			groundMat.color.set(isLight ? 0xd0d0d8 : 0x111122);
			ambient.intensity = isLight ? 1.2 : 0.8;
			ambient.color.set(isLight ? 0xffffff : 0x404060);
			dirLight.intensity = isLight ? 2.5 : 2.2;
			fillLight.intensity = isLight ? 0.8 : 0.5;
			grid.material = new THREE.LineBasicMaterial({ color: isLight ? 0xc0c0d0 : 0x2a2a40 });
			// Update perforation material colors
			if (panelGroup) {
				panelGroup.traverse((obj) => {
					if (obj instanceof THREE.InstancedMesh && obj.name.startsWith('perfs_')) {
						(obj.material as THREE.MeshBasicMaterial).color.setHex(bg);
					}
				});
			}
		},
		loadModel,
		enableSelection(callback: (plane: FacadePlane) => void) {
			selectionEnabled = true;
			selectionCallback = callback;
			canvas.style.cursor = 'crosshair';
		},
		disableSelection() {
			selectionEnabled = false;
			selectionCallback = null;
			canvas.style.cursor = 'default';
		},
		updateAllPanels,
		addHighlight,
		clearHighlights,
		clearPanels,
		setMaterial,
		captureImage,
		exportGlb,
		getCanvas: () => canvas,
	};
}
