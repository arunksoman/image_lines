/**
 * Sampler — Load and resize images to working resolution using Canvas API
 */

/**
 * Load an image file and return resized ImageData at the target resolution.
 */
export async function loadImage(file: File, targetSize: number): Promise<ImageData> {
	const bitmap = await createImageBitmap(file);
	const canvas = new OffscreenCanvas(targetSize, targetSize);
	const ctx = canvas.getContext('2d')!;

	// Calculate aspect-fill dimensions
	const aspect = bitmap.width / bitmap.height;
	let drawW: number, drawH: number, offsetX: number, offsetY: number;

	if (aspect > 1) {
		drawH = targetSize;
		drawW = targetSize * aspect;
		offsetX = -(drawW - targetSize) / 2;
		offsetY = 0;
	} else {
		drawW = targetSize;
		drawH = targetSize / aspect;
		offsetX = 0;
		offsetY = -(drawH - targetSize) / 2;
	}

	ctx.drawImage(bitmap, offsetX, offsetY, drawW, drawH);
	return ctx.getImageData(0, 0, targetSize, targetSize);
}

/**
 * Load image from a URL (for demo/testing).
 */
export async function loadImageFromUrl(url: string, targetSize: number): Promise<ImageData> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = targetSize;
			canvas.height = targetSize;
			const ctx = canvas.getContext('2d')!;

			const aspect = img.width / img.height;
			let drawW: number, drawH: number, offsetX: number, offsetY: number;

			if (aspect > 1) {
				drawH = targetSize;
				drawW = targetSize * aspect;
				offsetX = -(drawW - targetSize) / 2;
				offsetY = 0;
			} else {
				drawW = targetSize;
				drawH = targetSize / aspect;
				offsetX = 0;
				offsetY = -(drawH - targetSize) / 2;
			}

			ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
			resolve(ctx.getImageData(0, 0, targetSize, targetSize));
		};
		img.onerror = reject;
		img.src = url;
	});
}
