<!--
  +page.svelte — Main application page
  
  Orchestrates the full ImageLines pipeline:
  Image → Grayscale → Line Field → Perforations → 3D Preview
-->

<svelte:head>
	<title>ImageLines Playground — Generative Perforated Facade Designer</title>
	<meta name="description" content="Convert images into flowing perforated slot patterns for architectural metal panels. Real-time 3D visualization with SVG and GLB export." />
</svelte:head>

<script lang="ts">
	import ControlPanel from '$lib/components/ControlPanel.svelte';
	import CanvasView from '$lib/components/CanvasView.svelte';
	import { createSettings, type PanelSettings } from '$lib/stores/settings.svelte';
	import { loadImage } from '$lib/image/sampler';
	import { toBrightnessMap, type BrightnessMap } from '$lib/image/grayscale';
	import { generateLineField, type FlowLine } from '$lib/algorithms/lineField';
	import { generatePerforations, type Slot } from '$lib/algorithms/perforation';
	import { generateSvg, downloadSvg } from '$lib/export/svgExport';
	import { exportGlb } from '$lib/export/gltfExport';
	import { onMount } from 'svelte';

	const settings = createSettings();

	/**
	 * Generate a procedural demo image — radial gradient with some structure
	 */
	function generateDemoImage(size: number): ImageData {
		const canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext('2d')!;

		// Background
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, size, size);

		// Radial dark center
		const gradient = ctx.createRadialGradient(
			size * 0.5, size * 0.45, size * 0.05,
			size * 0.5, size * 0.45, size * 0.45
		);
		gradient.addColorStop(0, '#000000');
		gradient.addColorStop(0.4, '#333333');
		gradient.addColorStop(0.7, '#888888');
		gradient.addColorStop(1, '#ffffff');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, size, size);

		// Add some geometric shapes for visual interest
		ctx.globalCompositeOperation = 'multiply';

		// Horizontal bands
		for (let i = 0; i < 8; i++) {
			const y = (i / 8) * size;
			const alpha = 0.1 + Math.sin(i * 0.8) * 0.15;
			ctx.fillStyle = `rgba(0,0,0,${Math.max(0, alpha)})`;
			ctx.fillRect(0, y, size, size / 16);
		}

		// Circular accent
		ctx.globalCompositeOperation = 'screen';
		const g2 = ctx.createRadialGradient(
			size * 0.35, size * 0.4, 0,
			size * 0.35, size * 0.4, size * 0.2
		);
		g2.addColorStop(0, 'rgba(60,60,60,0.5)');
		g2.addColorStop(1, 'rgba(0,0,0,0)');
		ctx.fillStyle = g2;
		ctx.fillRect(0, 0, size, size);

		return ctx.getImageData(0, 0, size, size);
	}

	function loadDemo() {
		isProcessing = true;
		const res = settings.value.workingResolution;
		const imageData = generateDemoImage(res);
		settings.update({ imageData, imageName: 'Demo Pattern' });
		brightnessMap = toBrightnessMap(imageData);
		regenerate();
	}

	let brightnessMap: BrightnessMap | null = $state(null);
	let lines: FlowLine[] = $state([]);
	let slots: Slot[] = $state([]);
	let isProcessing = $state(false);

	// Debounce timer for regeneration
	let regenerateTimer: ReturnType<typeof setTimeout> | null = null;

	function scheduleRegenerate() {
		if (regenerateTimer) clearTimeout(regenerateTimer);
		regenerateTimer = setTimeout(() => {
			regenerate();
		}, 120);
	}

	function regenerate() {
		if (!brightnessMap) return;

		isProcessing = true;

		// Use requestAnimationFrame to keep UI responsive
		requestAnimationFrame(() => {
			const s = settings.value;

			// Generate line field
			lines = generateLineField(brightnessMap!, {
				lineDensity: s.lineDensity,
				lineCurvature: s.lineCurvature,
				noiseAmount: s.noiseAmount,
				noiseScale: s.noiseScale,
				flowDirection: s.flowDirection,
				resolution: s.workingResolution,
			});

			// Generate perforations
			slots = generatePerforations(lines, {
				slotMinWidth: s.slotMinWidth,
				slotMaxWidth: s.slotMaxWidth,
				slotLength: s.slotLength,
				slotSpacing: s.slotSpacing,
				panelWidth: s.panelWidth,
				panelHeight: s.panelHeight,
			});

			isProcessing = false;
		});
	}

	async function handleImageUpload(file: File) {
		isProcessing = true;
		try {
			const imageData = await loadImage(file, settings.value.workingResolution);
			settings.update({ imageData, imageName: file.name });
			brightnessMap = toBrightnessMap(imageData);
			regenerate();
		} catch (err) {
			console.error('Failed to load image:', err);
			isProcessing = false;
		}
	}

	function handleUpdate(partial: Partial<PanelSettings>) {
		settings.update(partial);
		// Don't regenerate for visual mode changes
		if (!('visualMode' in partial)) {
			scheduleRegenerate();
		}
	}

	function handleReset() {
		settings.reset();
		scheduleRegenerate();
	}

	function handleExportSvg() {
		if (slots.length === 0) return;
		const svg = generateSvg({
			panelWidth: settings.value.panelWidth,
			panelHeight: settings.value.panelHeight,
			slots,
			includePanel: true,
		});
		downloadSvg(svg);
	}

	async function handleExportGlb() {
		if (slots.length === 0) return;
		try {
			await exportGlb({
				panelWidth: settings.value.panelWidth,
				panelHeight: settings.value.panelHeight,
				panelThickness: settings.value.panelThickness,
				slots,
			});
		} catch (err) {
			console.error('GLB export failed:', err);
		}
	}
</script>

<div class="app-layout" id="app-layout">
	<ControlPanel
		settings={settings.value}
		slotCount={slots.length}
		{isProcessing}
		onUpdate={handleUpdate}
		onReset={handleReset}
		onExportSvg={handleExportSvg}
		onExportGlb={handleExportGlb}
		onImageUpload={handleImageUpload}
	/>
	<CanvasView
		{slots}
		panelWidth={settings.value.panelWidth}
		panelHeight={settings.value.panelHeight}
		panelThickness={settings.value.panelThickness}
		visualMode={settings.value.visualMode}
		hasImage={!!brightnessMap}
	/>
</div>

<style>
	.app-layout {
		display: flex;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}
</style>
