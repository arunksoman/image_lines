/**
 * Plane Selector — Detect facade planes via raycasting.
 *
 * When the user clicks on the 3D model, this module:
 * 1. Raycasts from the camera through the click position
 * 2. Detects which face was hit and its world-space normal
 * 3. Snaps the normal to the nearest axis for clean panel alignment
 * 4. Computes the plane extent from the model's bounding box
 * 5. Returns a FacadePlane describing where panels should be placed
 */

import * as THREE from 'three';

export interface FacadePlane {
	origin: THREE.Vector3;         // center of the selected surface (world space)
	normal: THREE.Vector3;         // outward-facing unit normal (axis-snapped)
	width: number;                 // meters — extent along the plane's local X
	height: number;                // meters — extent along the plane's local Y
	quaternion: THREE.Quaternion;  // rotation that maps +Z to the surface normal
}

/**
 * Detect a facade plane from a mouse click event.
 */
export function detectPlane(
	event: MouseEvent,
	camera: THREE.Camera,
	model: THREE.Object3D,
	canvasRect: DOMRect
): FacadePlane | null {
	const mouse = new THREE.Vector2(
		((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1,
		-((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1
	);

	const raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(mouse, camera);

	const intersects = raycaster.intersectObject(model, true);
	if (intersects.length === 0 || !intersects[0].face) return null;

	const hit = intersects[0];

	// Get face normal in world space
	const faceNormal = hit.face!.normal.clone();
	const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
	faceNormal.applyMatrix3(normalMatrix).normalize();

	// Snap to nearest axis for clean panel alignment
	const absX = Math.abs(faceNormal.x);
	const absY = Math.abs(faceNormal.y);
	const absZ = Math.abs(faceNormal.z);

	const snapped = new THREE.Vector3();
	if (absX >= absY && absX >= absZ) {
		snapped.set(Math.sign(faceNormal.x), 0, 0);
	} else if (absY >= absX && absY >= absZ) {
		snapped.set(0, Math.sign(faceNormal.y), 0);
	} else {
		snapped.set(0, 0, Math.sign(faceNormal.z));
	}

	// Compute bounding box of the model for plane dimensions
	const box = new THREE.Box3().setFromObject(model);
	const boxCenter = box.getCenter(new THREE.Vector3());
	const boxSize = box.getSize(new THREE.Vector3());

	// Project bounding box center onto the hit surface to find plane center
	const diff = new THREE.Vector3().subVectors(boxCenter, hit.point);
	const dist = diff.dot(snapped);
	const planeCenter = boxCenter.clone().sub(snapped.clone().multiplyScalar(dist));

	// Determine plane dimensions from the bounding box projection
	let width: number, height: number;
	if (absX >= absY && absX >= absZ) {
		width = boxSize.z;
		height = boxSize.y;
	} else if (absY >= absX && absY >= absZ) {
		width = boxSize.x;
		height = boxSize.z;
	} else {
		width = boxSize.x;
		height = boxSize.y;
	}

	// Quaternion that rotates +Z to align with the snapped normal
	const quaternion = new THREE.Quaternion();
	quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), snapped);

	return { origin: planeCenter, normal: snapped, width, height, quaternion };
}
