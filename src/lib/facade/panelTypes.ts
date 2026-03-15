/**
 * Panel Types — Predefined perforation patterns and material presets
 *
 * Panel A: Solid / sparse grid — clean rectangular perforations (like screenshot 0% icon)
 * Panel B: Diagonal slash — angled slot perforations (like screenshot \ icon)
 * Panel C: Cross / X pattern — intersecting diagonal lines (like screenshot ✕ icon)
 */

export interface PatternSlot {
	x: number;      // normalized 0–1 within panel
	y: number;      // normalized 0–1 within panel
	width: number;  // normalized fraction of panel width
	height: number; // normalized fraction of panel height
	rotation: number; // radians
}

export interface MaterialPreset {
	color: number;
	roughness: number;
	metalness: number;
}

export type MaterialPresetName = 'steel' | 'aluminium' | 'titanium' | 'bronze';

export const MATERIAL_PRESETS: Record<MaterialPresetName, MaterialPreset> = {
	steel:     { color: 0x7A7A7A, roughness: 0.30, metalness: 1.0 },
	aluminium: { color: 0xBFC1C2, roughness: 0.25, metalness: 1.0 },
	titanium:  { color: 0x8F8F8F, roughness: 0.35, metalness: 1.0 },
	bronze:    { color: 0x8C6239, roughness: 0.40, metalness: 0.9 },
};

export const PANEL_TYPE_INFO = {
	A: { name: 'Panel A', description: 'Grid', icon: '▦' },
	B: { name: 'Panel B', description: 'Diagonal', icon: '╲' },
	C: { name: 'Panel C', description: 'Cross', icon: '╳' },
} as const;

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

/**
 * Generate perforation pattern slots for a panel type.
 * All coordinates are normalized 0–1 within the panel face.
 */
export function generatePanelPattern(
	type: 'A' | 'B' | 'C',
	density: number,
	holeSizeMm: number,
	panelWidthMm: number,
	panelHeightMm: number,
	scale: number
): PatternSlot[] {
	// Normalized hole dimensions
	const normW = (holeSizeMm * scale) / panelWidthMm;
	const normH = (holeSizeMm * scale) / panelHeightMm;
	const margin = 0.04;

	switch (type) {
		case 'A': return gridPattern(density, normW, normH, margin);
		case 'B': return diagonalPattern(density, normW, normH, margin);
		case 'C': return crossPattern(density, normW, normH, margin);
	}
}

/**
 * Grid pattern — regular rows/columns of small square perforations.
 * Matches the ▦ icon (dense grid of small holes).
 */
function gridPattern(density: number, w: number, h: number, margin: number): PatternSlot[] {
	const slots: PatternSlot[] = [];
	const slotW = w * 1.2;
	const slotH = h * 1.2;
	const gapFactor = lerp(4, 0.3, density);
	const spacingX = slotW + slotW * gapFactor;
	const spacingY = slotH + slotH * gapFactor;

	for (let y = margin + slotH / 2; y < 1 - margin; y += spacingY) {
		for (let x = margin + slotW / 2; x < 1 - margin; x += spacingX) {
			slots.push({ x, y, width: slotW, height: slotH, rotation: 0 });
		}
	}
	return slots;
}

/**
 * Diagonal pattern — angled slash perforations at ~45°.
 * Matches the ╲ icon (diagonal lines across the panel).
 */
function diagonalPattern(density: number, w: number, h: number, margin: number): PatternSlot[] {
	const slots: PatternSlot[] = [];
	const slotW = w * 0.5;
	const slotH = h * 3;
	const gapFactor = lerp(4, 0.3, density);
	const spacing = Math.max(slotW, slotH) * (1 + gapFactor * 0.5);
	const angle = Math.PI / 4; // 45°

	for (let y = margin; y < 1 - margin; y += spacing) {
		for (let x = margin; x < 1 - margin; x += spacing) {
			slots.push({ x, y, width: slotW, height: slotH, rotation: angle });
		}
	}
	return slots;
}

/**
 * Cross / X pattern — intersecting diagonal lines forming triangulated mesh.
 * Matches the ╳ icon (X-shaped perforations like a facade screen).
 */
function crossPattern(density: number, w: number, h: number, margin: number): PatternSlot[] {
	const slots: PatternSlot[] = [];
	const slotW = w * 0.5;
	const slotH = h * 3;
	const gapFactor = lerp(4, 0.3, density);
	const spacing = Math.max(slotW, slotH) * (1 + gapFactor * 0.5);
	const angle = Math.PI / 4;

	for (let y = margin; y < 1 - margin; y += spacing) {
		for (let x = margin; x < 1 - margin; x += spacing) {
			// Forward slash + backward slash = X
			slots.push({ x, y, width: slotW, height: slotH, rotation: angle });
			slots.push({ x, y, width: slotW, height: slotH, rotation: -angle });
		}
	}
	return slots;
}
