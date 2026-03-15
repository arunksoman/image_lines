/**
 * Perforation Generator — Convert flow lines + brightness into slot perforations
 *
 * Dark areas → large slots (more material removed)
 * Light areas → small slots (less material removed)
 */

import type { FlowLine } from './lineField';

export interface Slot {
	x: number;         // center x, normalized 0-1
	y: number;         // center y, normalized 0-1
	width: number;     // mm
	length: number;    // mm
	rotation: number;  // radians — aligned to local line tangent
}

export interface PerforationParams {
	slotMinWidth: number;   // mm
	slotMaxWidth: number;   // mm
	slotLength: number;     // mm
	slotSpacing: number;    // mm
	panelWidth: number;     // mm
	panelHeight: number;    // mm
}

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

function distance(x1: number, y1: number, x2: number, y2: number): number {
	return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Generate perforation slots along the flow lines.
 */
export function generatePerforations(
	lines: FlowLine[],
	params: PerforationParams
): Slot[] {
	const { slotMinWidth, slotMaxWidth, slotLength, slotSpacing, panelWidth, panelHeight } = params;
	const slots: Slot[] = [];

	// Slot spacing in normalized coordinates
	const totalSlotPitch = slotLength + slotSpacing;
	const normalizedPitch = totalSlotPitch / panelWidth;

	for (const line of lines) {
		const { points } = line;
		if (points.length < 2) continue;

		// Walk along the line, placing slots at regular intervals
		let accumDist = 0;
		let nextSlotDist = normalizedPitch / 2; // Start offset

		for (let i = 1; i < points.length; i++) {
			const prev = points[i - 1];
			const curr = points[i];
			const segDist = distance(prev.x, prev.y, curr.x, curr.y);

			if (segDist < 1e-8) continue;

			let segProgress = 0;

			while (accumDist + (segDist - segProgress) >= nextSlotDist) {
				const remaining = nextSlotDist - accumDist + segProgress * 0; // simplified
				const t = (nextSlotDist - accumDist) / segDist + segProgress / segDist;

				if (t < 0 || t > 1) {
					accumDist += segDist - segProgress;
					break;
				}

				const slotX = lerp(prev.x, curr.x, t);
				const slotY = lerp(prev.y, curr.y, t);

				// Skip slots too close to edges
				if (slotX < 0.02 || slotX > 0.98 || slotY < 0.02 || slotY > 0.98) {
					accumDist = 0;
					nextSlotDist = normalizedPitch;
					break;
				}

				// Sample brightness at slot position (interpolate from neighbors)
				const brightness = lerp(prev.brightness, curr.brightness, t);

				// Dark → large slot, Light → small slot
				// Invert: low brightness (dark) = large slot
				const slotWidth = lerp(slotMaxWidth, slotMinWidth, brightness);

				// Skip very small slots
				if (slotWidth < 0.5) {
					accumDist = 0;
					nextSlotDist = normalizedPitch;
					segProgress = t * segDist;
					continue;
				}

				// Calculate tangent angle
				const dx = curr.x - prev.x;
				const dy = curr.y - prev.y;
				const rotation = Math.atan2(dy, dx);

				slots.push({
					x: slotX,
					y: slotY,
					width: slotWidth,
					length: slotLength,
					rotation
				});

				accumDist = 0;
				nextSlotDist = normalizedPitch;
				segProgress = t * segDist;
			}

			accumDist += segDist;
		}
	}

	return slots;
}
