/**
 * Line Field Generator — Generate continuous flow lines across the image
 *
 * Lines are displaced by simplex noise to create organic, flowing paths.
 * The brightness map is sampled along these lines to determine perforation sizes.
 */

import { createNoise2D, type NoiseFunction2D } from 'simplex-noise';
import type { BrightnessMap } from '../image/grayscale';
import { sampleBrightness } from '../image/grayscale';

export interface LinePoint {
	x: number;   // 0-1 normalized
	y: number;   // 0-1 normalized
	brightness: number;
}

export interface FlowLine {
	points: LinePoint[];
}

export interface LineFieldParams {
	lineDensity: number;     // spacing in pixels (at working resolution)
	lineCurvature: number;   // 0-1
	noiseAmount: number;     // 0-1
	noiseScale: number;      // frequency
	flowDirection: number;   // degrees
	resolution: number;      // working resolution
}

/**
 * Generate a field of flow lines across the brightness map.
 */
export function generateLineField(
	brightnessMap: BrightnessMap,
	params: LineFieldParams
): FlowLine[] {
	const { lineDensity, lineCurvature, noiseAmount, noiseScale, flowDirection, resolution } = params;
	const noise = createNoise2D();

	const lineSpacing = Math.max(2, lineDensity);
	const lineCount = Math.floor(resolution / lineSpacing);
	const pointsPerLine = Math.floor(resolution / 2);
	const radians = (flowDirection * Math.PI) / 180;

	const lines: FlowLine[] = [];

	for (let i = 0; i < lineCount; i++) {
		const baseY = (i + 0.5) * lineSpacing;
		const normalizedBaseY = baseY / resolution;

		const points: LinePoint[] = [];

		for (let j = 0; j <= pointsPerLine; j++) {
			const t = j / pointsPerLine;
			const baseX = t * resolution;

			// Apply noise displacement
			const noiseVal = noise(
				baseX * noiseScale,
				baseY * noiseScale
			);

			const displacement = noiseVal * noiseAmount * lineSpacing * 3;
			const curvatureOffset = Math.sin(t * Math.PI * 2 * (1 + lineCurvature * 3)) * lineCurvature * lineSpacing * 2;

			// Apply flow direction rotation
			const dx = Math.cos(radians) * baseX - Math.sin(radians) * (baseY + displacement + curvatureOffset);
			const dy = Math.sin(radians) * baseX + Math.cos(radians) * (baseY + displacement + curvatureOffset);

			const normX = dx / resolution;
			const normY = dy / resolution;

			// Skip points outside bounds
			if (normX < 0 || normX > 1 || normY < 0 || normY > 1) continue;

			const brightness = sampleBrightness(
				brightnessMap,
				normX * (brightnessMap.width - 1),
				normY * (brightnessMap.height - 1)
			);

			points.push({ x: normX, y: normY, brightness });
		}

		if (points.length > 1) {
			lines.push({ points });
		}
	}

	return lines;
}
