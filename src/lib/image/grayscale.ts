/**
 * Grayscale — Convert image to brightness map
 *
 * Uses the perceptual luminance formula:
 *   brightness = (0.299 * R + 0.587 * G + 0.114 * B) / 255
 */

export interface BrightnessMap {
	width: number;
	height: number;
	data: Float32Array;           // row-major, [y * width + x]
}

/**
 * Convert an ImageData to a brightness map.
 */
export function toBrightnessMap(imageData: ImageData): BrightnessMap {
	const { width, height, data } = imageData;
	const brightness = new Float32Array(width * height);

	for (let i = 0; i < width * height; i++) {
		const r = data[i * 4];
		const g = data[i * 4 + 1];
		const b = data[i * 4 + 2];
		brightness[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	}

	return { width, height, data: brightness };
}

/**
 * Sample brightness at fractional coordinates with bilinear interpolation.
 */
export function sampleBrightness(map: BrightnessMap, x: number, y: number): number {
	const x0 = Math.floor(x);
	const y0 = Math.floor(y);
	const x1 = Math.min(x0 + 1, map.width - 1);
	const y1 = Math.min(y0 + 1, map.height - 1);

	const fx = x - x0;
	const fy = y - y0;

	const cx0 = Math.max(0, Math.min(x0, map.width - 1));
	const cy0 = Math.max(0, Math.min(y0, map.height - 1));

	const v00 = map.data[cy0 * map.width + cx0];
	const v10 = map.data[cy0 * map.width + x1];
	const v01 = map.data[y1 * map.width + cx0];
	const v11 = map.data[y1 * map.width + x1];

	return v00 * (1 - fx) * (1 - fy)
		 + v10 * fx * (1 - fy)
		 + v01 * (1 - fx) * fy
		 + v11 * fx * fy;
}
