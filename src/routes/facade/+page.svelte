<!--
  Facade Layout — +page.svelte
  
  Orchestrates the facade panel placement system:
  Upload model → Select plane → Configure panels → Preview → Export
-->

<svelte:head>
	<title>Facade Layout — Perforated Panel Placement</title>
	<meta name="description" content="Apply perforated metal panels onto 3D building facades. Select surfaces, customize patterns, and export designs." />
</svelte:head>

<script lang="ts">
	import FacadeControlPanel from '$lib/components/facade/FacadeControlPanel.svelte';
	import FacadeCanvasView from '$lib/components/facade/FacadeCanvasView.svelte';
	import { createFacadeSettings, type FacadeSettings } from '$lib/stores/facadeSettings.svelte';
	import { createDefaultBuilding, loadModelFromFile } from '$lib/facade/modelLoader';
	import type { FacadeSceneManager } from '$lib/three/facadeScene';
	import type { FacadePlane } from '$lib/facade/planeSelector';

	const settings = createFacadeSettings();

	let sceneManager: FacadeSceneManager | null = $state(null);
	let selectedPlanes: FacadePlane[] = $state([]);
	let panelCount = $state(0);
	let perfCount = $state(0);
	let isProcessing = $state(false);

	// Debounce timer
	let regenTimer: ReturnType<typeof setTimeout> | null = null;

	function handleSceneReady(manager: FacadeSceneManager) {
		sceneManager = manager;
	}

	function loadDefault() {
		if (!sceneManager) return;
		const building = createDefaultBuilding();
		sceneManager.loadModel(building, 'Default Building');
		settings.update({ modelLoaded: true, modelName: 'Default Building', selectedPlaneCount: 0, selectionMode: false });
		selectedPlanes = [];
		panelCount = 0;
		perfCount = 0;
	}

	async function handleModelUpload(file: File) {
		if (!sceneManager) return;
		isProcessing = true;
		try {
			const model = await loadModelFromFile(file);
			sceneManager.loadModel(model, file.name);
			settings.update({ modelLoaded: true, modelName: file.name, selectedPlaneCount: 0, selectionMode: false });
			selectedPlanes = [];
			panelCount = 0;
			perfCount = 0;
		} catch (err) {
			console.error('Failed to load model:', err);
		}
		isProcessing = false;
	}

	function handleSelectPlane() {
		if (!sceneManager) return;
		settings.update({ selectionMode: true });
		sceneManager.enableSelection((plane) => {
			// Add the new plane to our list
			selectedPlanes = [...selectedPlanes, plane];
			settings.update({ selectedPlaneCount: selectedPlanes.length });
			regeneratePanels();
			// Stay in selection mode so user can click more planes
		});
	}

	function handleDoneSelecting() {
		if (!sceneManager) return;
		sceneManager.disableSelection();
		settings.update({ selectionMode: false });
	}

	function handleCancelSelection() {
		if (!sceneManager) return;
		sceneManager.disableSelection();
		settings.update({ selectionMode: false });
	}

	function handleClearPlanes() {
		if (!sceneManager) return;
		sceneManager.clearPanels();
		sceneManager.clearHighlights();
		selectedPlanes = [];
		panelCount = 0;
		perfCount = 0;
		settings.update({ selectedPlaneCount: 0 });
	}

	function regeneratePanels() {
		if (!sceneManager || selectedPlanes.length === 0) return;
		isProcessing = true;

		requestAnimationFrame(() => {
			const s = settings.value;
			const result = sceneManager!.updateAllPanels(
				selectedPlanes,
				s.panelTypeWeights,
				s.panelWidth,
				s.panelHeight,
				s.panelThickness,
				s.perforationDensity,
				s.holeSize,
				s.patternScale,
			);
			panelCount = result.panels;
			perfCount = result.perforations;
			isProcessing = false;
		});
	}

	function scheduleRegenerate() {
		if (regenTimer) clearTimeout(regenTimer);
		regenTimer = setTimeout(regeneratePanels, 120);
	}

	function handleUpdate(partial: Partial<FacadeSettings>) {
		settings.update(partial);

		// Material-only change: update material without full regeneration
		if ('materialPreset' in partial && Object.keys(partial).length === 1 && sceneManager) {
			sceneManager.setMaterial(partial.materialPreset!);
			return;
		}

		// Skip regen for non-geometry changes
		if ('selectionMode' in partial) return;

		if (selectedPlanes.length > 0) {
			scheduleRegenerate();
		}
	}

	function handleReset() {
		settings.reset();
		selectedPlanes = [];
		panelCount = 0;
		perfCount = 0;
		if (sceneManager) {
			sceneManager.clearPanels();
			sceneManager.clearHighlights();
		}
	}

	function handleExportImage() {
		if (!sceneManager) return;
		const dataUrl = sceneManager.captureImage();
		const a = document.createElement('a');
		a.href = dataUrl;
		a.download = 'facade-render.png';
		a.click();
	}

	async function handleExportGlb() {
		if (!sceneManager) return;
		try {
			await sceneManager.exportGlb();
		} catch (err) {
			console.error('GLB export failed:', err);
		}
	}
</script>

<div class="facade-layout">
	<FacadeControlPanel
		settings={settings.value}
		{panelCount}
		{perfCount}
		{isProcessing}
		onUpdate={handleUpdate}
		onReset={handleReset}
		onModelUpload={handleModelUpload}
		onLoadDefault={loadDefault}
		onSelectPlane={handleSelectPlane}
		onDoneSelecting={handleDoneSelecting}
		onCancelSelection={handleCancelSelection}
		onClearPlanes={handleClearPlanes}
		onExportImage={handleExportImage}
		onExportGlb={handleExportGlb}
	/>
	<FacadeCanvasView
		selectionMode={settings.value.selectionMode}
		onSceneReady={handleSceneReady}
	/>
</div>

<style>
	.facade-layout {
		display: flex;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}
</style>
