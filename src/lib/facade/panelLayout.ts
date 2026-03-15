/**
 * Panel Layout — Compute a grid of panel instances on a facade plane.
 *
 * Panels are rigid flat sheets — they translate and rotate but never bend.
 * Panel dimensions (mm) are converted to meters internally.
 * Panel types are distributed randomly according to per-type weights.
 */

import * as THREE from 'three';
import type { FacadePlane } from './planeSelector';
import type { PanelTypeWeights } from '$lib/stores/facadeSettings.svelte';

export interface PanelInstance {
	position: THREE.Vector3;
	quaternion: THREE.Quaternion;
	panelType: 'A' | 'B' | 'C';
}

/**
 * Simple seeded pseudo-random number generator (mulberry32).
 * Produces deterministic results so regeneration with the same seed gives the same layout.
 */
function createRng(seed: number) {
	let state = seed | 0;
	return () => {
		state = (state + 0x6D2B79F5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * Build a weighted selection function from panel type weights.
 * Returns a function that, given a random 0–1 value, picks a panel type.
 */
function buildWeightedPicker(weights: PanelTypeWeights): (rand: number) => 'A' | 'B' | 'C' {
	const types: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
	const total = weights.A + weights.B + weights.C;
	if (total === 0) {
		// Fallback: all equal
		return (rand) => types[Math.floor(rand * 3)] ?? 'A';
	}
	const cumulative: { type: 'A' | 'B' | 'C'; threshold: number }[] = [];
	let running = 0;
	for (const t of types) {
		const w = weights[t];
		if (w > 0) {
			running += w / total;
			cumulative.push({ type: t, threshold: running });
		}
	}
	return (rand: number) => {
		for (const entry of cumulative) {
			if (rand < entry.threshold) return entry.type;
		}
		return cumulative[cumulative.length - 1].type;
	};
}

/**
 * Compute panel grid on the given facade plane.
 * Panel types are assigned randomly based on weights for a natural scattered look.
 */
export function computePanelLayout(
	plane: FacadePlane,
	panelWidthMm: number,
	panelHeightMm: number,
	weights: PanelTypeWeights,
	seed?: number
): PanelInstance[] {
	const total = weights.A + weights.B + weights.C;
	if (total === 0) return [];

	// Convert mm → meters (scene units)
	const panelW = panelWidthMm / 1000;
	const panelH = panelHeightMm / 1000;

	const cols = Math.max(1, Math.floor(plane.width / panelW));
	const rows = Math.max(1, Math.floor(plane.height / panelH));

	// Compute local axes on the plane surface
	const worldUp = new THREE.Vector3(0, 1, 0);
	let right = new THREE.Vector3().crossVectors(worldUp, plane.normal).normalize();
	if (right.lengthSq() < 0.001) {
		// Normal is parallel to world up — fall back to world-right
		right.set(1, 0, 0);
	}
	const up = new THREE.Vector3().crossVectors(plane.normal, right).normalize();

	const totalW = cols * panelW;
	const totalH = rows * panelH;
	const startRight = -totalW / 2 + panelW / 2;
	const startUp = -totalH / 2 + panelH / 2;

	// Seeded RNG for deterministic random layout
	const rng = createRng(seed ?? 42);
	const pick = buildWeightedPicker(weights);

	const instances: PanelInstance[] = [];

	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			const offsetRight = startRight + c * panelW;
			const offsetUp = startUp + r * panelH;

			const position = plane.origin.clone()
				.add(right.clone().multiplyScalar(offsetRight))
				.add(up.clone().multiplyScalar(offsetUp))
				.add(plane.normal.clone().multiplyScalar(0.015)); // slight offset from surface

			instances.push({
				position,
				quaternion: plane.quaternion.clone(),
				panelType: pick(rng()),
			});
		}
	}

	return instances;
}
