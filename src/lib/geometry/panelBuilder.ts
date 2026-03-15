/**
 * Panel Builder — Create the base metal panel geometry
 */

import * as THREE from 'three';

/**
 * Build a panel mesh (flat rectangular box).
 */
export function buildPanel(
	panelWidth: number,
	panelHeight: number,
	panelThickness: number
): THREE.Mesh {
	const geometry = new THREE.BoxGeometry(panelWidth, panelHeight, panelThickness);
	const material = new THREE.MeshStandardMaterial({
		color: 0x8c8c8c,
		roughness: 0.45,
		metalness: 0.85,
		side: THREE.DoubleSide,
	});

	const mesh = new THREE.Mesh(geometry, material);
	mesh.name = 'panel';
	mesh.castShadow = true;
	mesh.receiveShadow = true;

	return mesh;
}

/**
 * Build a backlight plane behind the panel for night mode visualization.
 */
export function buildBacklightPlane(
	panelWidth: number,
	panelHeight: number
): THREE.Mesh {
	const geometry = new THREE.PlaneGeometry(panelWidth * 1.1, panelHeight * 1.1);
	const material = new THREE.MeshBasicMaterial({
		color: 0xfff5e6,
		side: THREE.DoubleSide,
		transparent: true,
		opacity: 0.8,
	});

	const mesh = new THREE.Mesh(geometry, material);
	mesh.position.z = -10;
	mesh.name = 'backlightPlane';
	mesh.visible = false;

	return mesh;
}
