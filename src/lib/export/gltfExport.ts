/**
 * GLTF/GLB Export — Export 3D perforated panel model
 *
 * Exports the panel + slot geometry as a binary glTF (.glb) file.
 * Converts millimeters to meters for glTF compliance.
 */

import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import type { Slot } from '../algorithms/perforation';

export interface GltfExportOptions {
	panelWidth: number;    // mm
	panelHeight: number;   // mm
	panelThickness: number; // mm
	slots: Slot[];
}

/**
 * Export a 3D panel with slot perforations as GLB.
 */
export async function exportGlb(options: GltfExportOptions): Promise<void> {
	const { panelWidth, panelHeight, panelThickness, slots } = options;

	// glTF uses meters, so convert from mm
	const scale = 0.001;
	const pw = panelWidth * scale;
	const ph = panelHeight * scale;
	const pt = panelThickness * scale;

	// Create export scene
	const exportScene = new THREE.Scene();

	// Panel
	const panelGeom = new THREE.BoxGeometry(pw, ph, pt);
	const panelMat = new THREE.MeshStandardMaterial({
		color: 0x8c8c8c,
		roughness: 0.45,
		metalness: 0.85,
	});
	const panelMesh = new THREE.Mesh(panelGeom, panelMat);
	panelMesh.name = 'PerforatedPanel';
	exportScene.add(panelMesh);

	// Slot instances — merged into a single geometry for export
	if (slots.length > 0) {
		const slotGeom = new THREE.PlaneGeometry(1, 1);
		const slotMat = new THREE.MeshBasicMaterial({
			color: 0x000000,
			side: THREE.DoubleSide,
		});

		const mergedGeom = new THREE.BufferGeometry();
		const positions: number[] = [];
		const normals: number[] = [];
		const indices: number[] = [];

		const dummy = new THREE.Object3D();
		const basePositions = slotGeom.attributes.position.array;
		const baseNormals = slotGeom.attributes.normal.array;
		const baseIndices = slotGeom.index!.array;
		const vertexCount = basePositions.length / 3;

		for (let i = 0; i < slots.length; i++) {
			const slot = slots[i];
			const x = (slot.x - 0.5) * pw;
			const y = (0.5 - slot.y) * ph;
			const z = pt / 2 + 0.0001;

			dummy.position.set(x, y, z);
			dummy.rotation.set(0, 0, slot.rotation);
			dummy.scale.set(slot.length * scale, slot.width * scale, 1);
			dummy.updateMatrix();

			const mat = dummy.matrix;
			const offset = i * vertexCount;

			for (let v = 0; v < vertexCount; v++) {
				const pos = new THREE.Vector3(
					basePositions[v * 3],
					basePositions[v * 3 + 1],
					basePositions[v * 3 + 2]
				).applyMatrix4(mat);

				positions.push(pos.x, pos.y, pos.z);

				const norm = new THREE.Vector3(
					baseNormals[v * 3],
					baseNormals[v * 3 + 1],
					baseNormals[v * 3 + 2]
				).transformDirection(mat);

				normals.push(norm.x, norm.y, norm.z);
			}

			for (let idx = 0; idx < baseIndices.length; idx++) {
				indices.push(baseIndices[idx] + offset);
			}
		}

		mergedGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
		mergedGeom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
		mergedGeom.setIndex(indices);

		const slotMesh = new THREE.Mesh(mergedGeom, slotMat);
		slotMesh.name = 'SlotPerforations';
		exportScene.add(slotMesh);

		slotGeom.dispose();
	}

	// Add metadata as userData
	exportScene.userData = {
		generator: 'ImageLines Playground',
		panelWidth: panelWidth,
		panelHeight: panelHeight,
		panelThickness: panelThickness,
		slotCount: slots.length,
		units: 'meters (converted from mm)',
	};

	// Export
	const exporter = new GLTFExporter();

	return new Promise((resolve, reject) => {
		exporter.parse(
			exportScene,
			(result) => {
				if (result instanceof ArrayBuffer) {
					saveArrayBuffer(result, 'imagelines-panel.glb');
				}
				// Clean up
				panelGeom.dispose();
				panelMat.dispose();
				resolve();
			},
			(error) => reject(error),
			{ binary: true }
		);
	});
}

function saveArrayBuffer(buffer: ArrayBuffer, filename: string) {
	const blob = new Blob([buffer], { type: 'application/octet-stream' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
