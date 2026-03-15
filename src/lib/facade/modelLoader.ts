/**
 * Model Loader — Load OBJ / GLB / GLTF facade models, or create a default building.
 *
 * Models are centered and scaled to fit a ~20-unit bounding box (≈ 20 meters at
 * architectural scale). Panel dimensions are expressed in millimeters and converted
 * to meters (÷ 1000) at the rendering boundary.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

/**
 * Load a model file, center it, and scale to fit within ~20 units.
 */
export async function loadModelFromFile(file: File): Promise<THREE.Group> {
	const url = URL.createObjectURL(file);
	const ext = file.name.split('.').pop()?.toLowerCase();

	try {
		let model: THREE.Group;

		if (ext === 'glb' || ext === 'gltf') {
			const loader = new GLTFLoader();
			const gltf = await loader.loadAsync(url);
			model = gltf.scene;
		} else if (ext === 'obj') {
			const loader = new OBJLoader();
			model = await loader.loadAsync(url);
		} else {
			throw new Error(`Unsupported format: .${ext}. Use GLB, GLTF, or OBJ.`);
		}

		normalizeModel(model);
		return model;
	} finally {
		URL.revokeObjectURL(url);
	}
}

/**
 * Create a simple box building as a default facade model.
 */
export function createDefaultBuilding(): THREE.Group {
	const group = new THREE.Group();
	group.name = 'defaultBuilding';

	const mat = new THREE.MeshStandardMaterial({
		color: 0xd0d0d0,
		roughness: 0.8,
		metalness: 0.1,
		side: THREE.DoubleSide,
	});

	// Main body
	const body = new THREE.Mesh(new THREE.BoxGeometry(14, 10, 7), mat);
	body.position.y = 5;
	body.castShadow = true;
	body.receiveShadow = true;
	group.add(body);

	// Upper setback
	const upper = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 5), mat.clone());
	upper.position.set(0, 12, -1);
	upper.castShadow = true;
	upper.receiveShadow = true;
	group.add(upper);

	return group;
}

/**
 * Center and scale a model group to fit within ~20 units.
 */
function normalizeModel(model: THREE.Group): void {
	const box = new THREE.Box3().setFromObject(model);
	const center = box.getCenter(new THREE.Vector3());
	const size = box.getSize(new THREE.Vector3());

	// Center horizontally, keep base at y=0
	model.position.x -= center.x;
	model.position.z -= center.z;
	model.position.y -= box.min.y;

	const maxDim = Math.max(size.x, size.y, size.z);
	if (maxDim > 0 && maxDim > 25) {
		const scale = 20 / maxDim;
		model.scale.multiplyScalar(scale);
	}

	// Enable shadows on all mesh children
	model.traverse((child) => {
		if (child instanceof THREE.Mesh) {
			child.castShadow = true;
			child.receiveShadow = true;
		}
	});
}
