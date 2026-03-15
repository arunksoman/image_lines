/**
 * Slot Builder — Convert slot data into InstancedMesh for high-performance rendering.
 *
 * Uses Three.js InstancedMesh to handle 10,000–50,000 slots efficiently.
 */

import * as THREE from 'three';
import type { Slot } from '../algorithms/perforation';

/**
 * Build an InstancedMesh from slot data.
 *
 * @param slots - Array of slot definitions
 * @param panelWidth - Panel width in mm
 * @param panelHeight - Panel height in mm
 * @param panelThickness - Panel thickness in mm
 * @returns InstancedMesh of all slots
 */
export function buildSlotInstances(
	slots: Slot[],
	panelWidth: number,
	panelHeight: number,
	panelThickness: number
): THREE.InstancedMesh {
	// Slot geometry — a box for each slot hole
	// We'll use a unit box and scale via the instance matrix
	const geometry = new THREE.BoxGeometry(1, 1, 1);
	const material = new THREE.MeshStandardMaterial({
		color: 0x000000,
		roughness: 0.9,
		metalness: 0.0,
		transparent: true,
		opacity: 0.0,
		side: THREE.DoubleSide,
		depthWrite: false,
	});

	const count = slots.length;
	const mesh = new THREE.InstancedMesh(geometry, material, count);

	const dummy = new THREE.Object3D();
	const thicknessScale = panelThickness * 1.2; // slightly larger to ensure full cut-through

	// Convert mm to scene units (1 unit = 1mm for preview)
	const scaleX = panelWidth;
	const scaleY = panelHeight;

	for (let i = 0; i < count; i++) {
		const slot = slots[i];

		// Convert normalized position to panel coordinates, centered at origin
		const x = (slot.x - 0.5) * scaleX;
		const y = (0.5 - slot.y) * scaleY; // flip Y so top of image = top of panel
		const z = 0;

		dummy.position.set(x, y, z);
		dummy.rotation.set(0, 0, slot.rotation);
		dummy.scale.set(slot.length, slot.width, thicknessScale);
		dummy.updateMatrix();

		mesh.setMatrixAt(i, dummy.matrix);
	}

	mesh.instanceMatrix.needsUpdate = true;
	mesh.name = 'slotInstances';
	mesh.frustumCulled = false;

	return mesh;
}

/**
 * Build slot meshes as actual geometry cutouts for visualization.
 * Uses a different approach — renders slots as dark rectangles on the panel.
 */
export function buildSlotOverlay(
	slots: Slot[],
	panelWidth: number,
	panelHeight: number
): THREE.InstancedMesh {
	const geometry = new THREE.PlaneGeometry(1, 1);
	const material = new THREE.MeshBasicMaterial({
		color: 0x000000,
		side: THREE.DoubleSide,
	});

	const count = slots.length;
	const mesh = new THREE.InstancedMesh(geometry, material, count);

	const dummy = new THREE.Object3D();

	for (let i = 0; i < count; i++) {
		const slot = slots[i];

		const x = (slot.x - 0.5) * panelWidth;
		const y = (0.5 - slot.y) * panelHeight;

		dummy.position.set(x, y, 0.01); // slightly in front
		dummy.rotation.set(0, 0, slot.rotation);
		dummy.scale.set(slot.length, slot.width, 1);
		dummy.updateMatrix();

		mesh.setMatrixAt(i, dummy.matrix);
	}

	mesh.instanceMatrix.needsUpdate = true;
	mesh.name = 'slotOverlay';
	mesh.frustumCulled = false;

	return mesh;
}
