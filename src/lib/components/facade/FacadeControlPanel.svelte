<!--
  FacadeControlPanel.svelte — Control sidebar for the facade panel layout page.
  Sections: Model upload, Plane selection, Panel type, Perforation, Material, Export.
-->

<script lang="ts">
	import type { FacadeSettings } from '$lib/stores/facadeSettings.svelte';
	import { PANEL_TYPE_INFO, MATERIAL_PRESETS, type MaterialPresetName } from '$lib/facade/panelTypes';
	import type { PanelTypeWeights } from '$lib/stores/facadeSettings.svelte';

	interface Props {
		settings: FacadeSettings;
		panelCount: number;
		perfCount: number;
		isProcessing: boolean;
		onUpdate: (partial: Partial<FacadeSettings>) => void;
		onReset: () => void;
		onModelUpload: (file: File) => void;
		onLoadDefault: () => void;
		onSelectPlane: () => void;
		onDoneSelecting: () => void;
		onCancelSelection: () => void;
		onClearPlanes: () => void;
		onExportImage: () => void;
		onExportGlb: () => void;
	}

	let {
		settings,
		panelCount,
		perfCount,
		isProcessing,
		onUpdate,
		onReset,
		onModelUpload,
		onLoadDefault,
		onSelectPlane,
		onDoneSelecting,
		onCancelSelection,
		onClearPlanes,
		onExportImage,
		onExportGlb,
	}: Props = $props();

	let fileInput = $state<HTMLInputElement>(undefined!);
	let isDragging = $state(false);

	function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files?.[0]) onModelUpload(input.files[0]);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const file = e.dataTransfer?.files[0];
		if (file) onModelUpload(file);
	}

	function updateTypeWeight(type: keyof PanelTypeWeights, value: number) {
		onUpdate({ panelTypeWeights: { ...settings.panelTypeWeights, [type]: value } });
	}

	function randomizeWeights() {
		const rA = Math.floor(Math.random() * 100);
		const rB = Math.floor(Math.random() * 100);
		const rC = Math.floor(Math.random() * 100);
		onUpdate({ panelTypeWeights: { A: rA, B: rB, C: rC } });
	}

	const materialEntries = Object.entries(MATERIAL_PRESETS) as [MaterialPresetName, typeof MATERIAL_PRESETS[MaterialPresetName]][];

	// Section collapse state
	let sectionsOpen = $state({
		model: true,
		plane: true,
		panels: true,
		perfs: true,
		material: true,
		exportSec: true,
	});
	function toggleSection(key: keyof typeof sectionsOpen) {
		sectionsOpen[key] = !sectionsOpen[key];
	}
</script>

<aside class="facade-panel">
	<header class="panel-header">
		<div class="logo">
			<div class="logo-text">
				<h1>Facade Layout</h1>
				<span class="subtitle">Panel Placement</span>
			</div>
		</div>
		<a href="/" class="back-link">← ImageLines</a>
	</header>

	<div class="panel-body">
		<!-- Model Upload -->
		<section class="section">
			<button class="section-header" onclick={() => toggleSection('model')}>
				<span class="section-icon">📦</span>
				<span class="section-title">Facade Model</span>
				<span class="chevron" class:open={sectionsOpen.model}>▸</span>
			</button>
			{#if sectionsOpen.model}
				<div class="section-content">
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="dropzone"
						class:dragging={isDragging}
						class:has-model={settings.modelLoaded}
						ondrop={handleDrop}
						ondragover={(e) => { e.preventDefault(); isDragging = true; }}
						ondragleave={() => isDragging = false}
						onclick={() => fileInput.click()}
						role="button"
						tabindex="0"
						onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); }}
					>
						{#if settings.modelLoaded}
							<div class="dz-loaded">
								<span class="check">✓</span>
								<span class="filename">{settings.modelName}</span>
								<span class="hint">Click to change</span>
							</div>
						{:else}
							<div class="dz-empty">
								<span class="upload-icon">⬆</span>
								<span>Drop OBJ / GLB / GLTF</span>
								<span class="hint">or click to browse</span>
							</div>
						{/if}
					</div>
					<input bind:this={fileInput} type="file" accept=".obj,.glb,.gltf" onchange={handleFileChange} class="sr-only" />
					<button class="btn btn-secondary" onclick={onLoadDefault}>Load Default Building</button>
				</div>
			{/if}
		</section>

		<!-- Plane Selection -->
		<section class="section">
			<button class="section-header" onclick={() => toggleSection('plane')}>
				<span class="section-icon">🎯</span>
				<span class="section-title">Select Plane</span>
				<span class="chevron" class:open={sectionsOpen.plane}>▸</span>
			</button>
			{#if sectionsOpen.plane}
				<div class="section-content">
					{#if settings.selectionMode}
						<button class="btn btn-selection-active" onclick={onDoneSelecting}>
							<span class="pulse-dot"></span>
							Click surfaces… ({settings.selectedPlaneCount} selected) — Done
						</button>
					{:else if settings.selectedPlaneCount > 0}
						<div class="status-ok">
							<span>✓ {settings.selectedPlaneCount} plane{settings.selectedPlaneCount > 1 ? 's' : ''} selected</span>
						</div>
						<div class="plane-actions">
							<button class="btn btn-sm" onclick={onSelectPlane}>Add More</button>
							<button class="btn btn-sm btn-danger-sm" onclick={onClearPlanes}>Clear All</button>
						</div>
					{:else}
						<button class="btn btn-primary" onclick={onSelectPlane} disabled={!settings.modelLoaded}>
							Select Facade Planes
						</button>
						{#if !settings.modelLoaded}
							<p class="hint-text">Load a model first</p>
						{/if}
					{/if}
				</div>
			{/if}
		</section>

		<!-- Panel Type -->
		<section class="section">
			<button class="section-header" onclick={() => toggleSection('panels')}>
				<span class="section-icon">🧱</span>
				<span class="section-title">Panel Type</span>
				<span class="chevron" class:open={sectionsOpen.panels}>▸</span>
			</button>
			{#if sectionsOpen.panels}
				<div class="section-content">
					<p class="hint-text" style="margin-bottom:10px">Adjust % weight of each panel type — randomly distributed.</p>
					<div class="type-sliders">
						{#each (['A', 'B', 'C'] as const) as type}
							<div class="type-slider-row">
								<span class="type-icon">{PANEL_TYPE_INFO[type].icon}</span>
								<span class="type-label">{PANEL_TYPE_INFO[type].description}</span>
								<input type="range" min="0" max="100" step="5"
									value={settings.panelTypeWeights[type]}
									oninput={(e) => updateTypeWeight(type, +e.currentTarget.value)} />
								<span class="type-pct">{settings.panelTypeWeights[type]}%</span>
							</div>
						{/each}
					</div>
					<button class="btn btn-sm" style="margin-top:8px" onclick={randomizeWeights}>🎲 Random Mix</button>

					<div class="control-group">
						<label class="control-label" for="f-panel-width">
							<span>Panel Width</span>
							<span class="value">{settings.panelWidth}mm</span>
						</label>
						<input id="f-panel-width" type="range" min="300" max="3000" step="50"
							value={settings.panelWidth}
							oninput={(e) => onUpdate({ panelWidth: +e.currentTarget.value })} />
					</div>
					<div class="control-group">
						<label class="control-label" for="f-panel-height">
							<span>Panel Height</span>
							<span class="value">{settings.panelHeight}mm</span>
						</label>
						<input id="f-panel-height" type="range" min="300" max="3000" step="50"
							value={settings.panelHeight}
							oninput={(e) => onUpdate({ panelHeight: +e.currentTarget.value })} />
					</div>
					<div class="control-group">
						<label class="control-label" for="f-panel-thick">
							<span>Thickness</span>
							<span class="value">{settings.panelThickness}mm</span>
						</label>
						<input id="f-panel-thick" type="range" min="1" max="10" step="0.5"
							value={settings.panelThickness}
							oninput={(e) => onUpdate({ panelThickness: +e.currentTarget.value })} />
					</div>
				</div>
			{/if}
		</section>

		<!-- Perforation -->
		<section class="section">
			<button class="section-header" onclick={() => toggleSection('perfs')}>
				<span class="section-icon">⊞</span>
				<span class="section-title">Perforation</span>
				<span class="chevron" class:open={sectionsOpen.perfs}>▸</span>
			</button>
			{#if sectionsOpen.perfs}
				<div class="section-content">
					<div class="control-group">
						<label class="control-label" for="f-perf-density">
							<span>Density</span>
							<span class="value">{(settings.perforationDensity * 100).toFixed(0)}%</span>
						</label>
						<input id="f-perf-density" type="range" min="0.05" max="1" step="0.05"
							value={settings.perforationDensity}
							oninput={(e) => onUpdate({ perforationDensity: +e.currentTarget.value })} />
					</div>
					<div class="control-group">
						<label class="control-label" for="f-hole-size">
							<span>Hole Size</span>
							<span class="value">{settings.holeSize}mm</span>
						</label>
						<input id="f-hole-size" type="range" min="2" max="30" step="1"
							value={settings.holeSize}
							oninput={(e) => onUpdate({ holeSize: +e.currentTarget.value })} />
					</div>
					<div class="control-group">
						<label class="control-label" for="f-pat-scale">
							<span>Pattern Scale</span>
							<span class="value">{settings.patternScale.toFixed(1)}×</span>
						</label>
						<input id="f-pat-scale" type="range" min="0.3" max="3" step="0.1"
							value={settings.patternScale}
							oninput={(e) => onUpdate({ patternScale: +e.currentTarget.value })} />
					</div>
				</div>
			{/if}
		</section>

		<!-- Material -->
		<section class="section">
			<button class="section-header" onclick={() => toggleSection('material')}>
				<span class="section-icon">🪩</span>
				<span class="section-title">Material</span>
				<span class="chevron" class:open={sectionsOpen.material}>▸</span>
			</button>
			{#if sectionsOpen.material}
				<div class="section-content">
					<div class="material-grid">
						{#each materialEntries as [name, preset]}
							<button
								class="material-btn"
								class:active={settings.materialPreset === name}
								onclick={() => onUpdate({ materialPreset: name })}
							>
								<span class="material-swatch" style="background:#{preset.color.toString(16).padStart(6,'0')}"></span>
								<span class="material-name">{name}</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</section>

		<!-- Export -->
		<section class="section">
			<button class="section-header" onclick={() => toggleSection('exportSec')}>
				<span class="section-icon">💾</span>
				<span class="section-title">Export</span>
				<span class="chevron" class:open={sectionsOpen.exportSec}>▸</span>
			</button>
			{#if sectionsOpen.exportSec}
				<div class="section-content">
					<button class="btn btn-export" onclick={onExportImage} disabled={!settings.modelLoaded}>
						📸 Export Image
					</button>
					<button class="btn btn-export" onclick={onExportGlb} disabled={panelCount === 0}>
						📦 Export GLB
					</button>
				</div>
			{/if}
		</section>

		<!-- Stats & Reset -->
		<div class="stats-bar">
			{#if panelCount > 0}
				<span class="stat">{panelCount} panels</span>
				<span class="stat">{perfCount.toLocaleString()} perfs</span>
			{/if}
			{#if isProcessing}
				<span class="processing">Processing…</span>
			{/if}
		</div>

		<div class="reset-row">
			<button class="btn btn-danger" onclick={onReset}>Reset All</button>
		</div>
	</div>
</aside>

<style>
	.facade-panel {
		width: 320px;
		min-width: 320px;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: var(--bg-panel, #14141e);
		border-right: 1px solid var(--border-primary, rgba(255,255,255,0.06));
		overflow: hidden;
	}
	.panel-header {
		padding: 16px;
		border-bottom: 1px solid var(--border-primary, rgba(255,255,255,0.06));
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.logo h1 {
		margin: 0;
		font-size: 16px;
		font-weight: 700;
		color: var(--text-primary, #e8e8f0);
	}
	.subtitle {
		font-size: 11px;
		color: var(--text-muted, #5a5a73);
	}
	.back-link {
		font-size: 12px;
		color: var(--text-secondary, #9898b0);
		text-decoration: none;
		padding: 4px 8px;
		border-radius: 6px;
		transition: all 0.15s;
	}
	.back-link:hover {
		color: var(--text-primary, #e8e8f0);
		background: var(--bg-hover, #252538);
	}

	.panel-body {
		flex: 1;
		overflow-y: auto;
		padding-bottom: 16px;
	}

	/* Sections */
	.section { border-bottom: 1px solid var(--border-primary, rgba(255,255,255,0.06)); }
	.section-header {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-primary, #e8e8f0);
		font-size: 13px;
		font-weight: 600;
		transition: background 0.15s;
	}
	.section-header:hover { background: var(--bg-hover, #252538); }
	.section-icon { font-size: 14px; }
	.section-title { flex: 1; text-align: left; }
	.chevron { font-size: 11px; color: var(--text-muted); transition: transform 0.2s; }
	.chevron.open { transform: rotate(90deg); }
	.section-content { padding: 8px 16px 16px; }

	/* Dropzone */
	.dropzone {
		border: 1.5px dashed var(--border-dashed);
		border-radius: 8px;
		padding: 16px;
		text-align: center;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 13px;
		color: var(--text-secondary);
		margin-bottom: 8px;
	}
	.dropzone:hover, .dropzone.dragging {
		border-color: var(--accent-blue-border);
		background: var(--accent-blue-subtle);
	}
	.dropzone.has-model { border-color: var(--accent-success, #10b981); border-style: solid; }
	.dz-loaded, .dz-empty { display: flex; flex-direction: column; gap: 2px; align-items: center; }
	.check { color: var(--accent-success); font-size: 18px; }
	.filename { color: var(--text-primary); font-weight: 500; word-break: break-all; }
	.upload-icon { font-size: 20px; margin-bottom: 4px; }
	.hint { font-size: 11px; color: var(--text-muted); }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }

	/* Buttons */
	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		width: 100%;
		padding: 8px 12px;
		border: 1px solid var(--border-primary);
		border-radius: 8px;
		background: var(--bg-input, #1e1e2e);
		color: var(--text-primary);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
		margin-top: 6px;
	}
	.btn:hover:not(:disabled) { background: var(--bg-hover); border-color: var(--border-hover); }
	.btn:disabled { opacity: 0.4; cursor: not-allowed; }
	.btn-primary { background: var(--accent-blue-subtle); border-color: var(--accent-blue-border); color: var(--accent-blue-text); }
	.btn-primary:hover:not(:disabled) { background: var(--accent-blue-border); }
	.btn-secondary { background: none; color: var(--text-secondary); }
	.btn-danger { background: var(--accent-danger-bg); border-color: var(--accent-danger-border); color: var(--accent-danger-text); }
	.btn-danger:hover { background: var(--accent-danger-border) !important; }
	.btn-export { margin-top: 6px; }
	.btn-sm { padding: 4px 10px; font-size: 12px; width: auto; margin: 0; }
	.btn-selection-active {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 8px 12px;
		border: 1px solid var(--accent-blue-border);
		border-radius: 8px;
		background: var(--accent-blue-subtle);
		color: var(--accent-blue-text);
		font-size: 13px;
		cursor: pointer;
	}
	.pulse-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent-blue);
		animation: pulse 1.2s ease-in-out infinite;
	}
	@keyframes pulse {
		0%,100% { opacity: 1; }
		50% { opacity: 0.3; }
	}

	/* Plane actions */
	.plane-actions {
		display: flex;
		gap: 6px;
		margin-top: 6px;
	}
	.plane-actions .btn-sm {
		flex: 1;
	}
	.btn-danger-sm {
		background: var(--accent-danger-bg) !important;
		border-color: var(--accent-danger-border) !important;
		color: var(--accent-danger-text) !important;
	}

	/* Status */
	.status-ok { display: flex; align-items: center; justify-content: space-between; color: var(--accent-success); font-size: 13px; }
	.hint-text { font-size: 11px; color: var(--text-muted); margin-top: 6px; }

	/* Panel type sliders */
	.type-sliders { display: flex; flex-direction: column; gap: 8px; }
	.type-slider-row {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.type-icon {
		font-size: 16px;
		width: 20px;
		text-align: center;
		color: var(--text-primary, #e8e8f0);
	}
	.type-label {
		font-size: 11px;
		width: 52px;
		color: var(--text-secondary, #9898b0);
	}
	.type-slider-row input[type="range"] {
		flex: 1;
		min-width: 0;
	}
	.type-pct {
		font-size: 11px;
		width: 32px;
		text-align: right;
		font-family: var(--font-mono);
		color: var(--text-primary, #e8e8f0);
	}

	/* Sliders */
	.control-group { margin-top: 10px; }
	.control-label {
		display: flex;
		justify-content: space-between;
		font-size: 12px;
		color: var(--text-secondary);
		margin-bottom: 4px;
	}
	.value { color: var(--text-primary); font-weight: 500; font-family: var(--font-mono); font-size: 11px; }
	input[type="range"] {
		width: 100%;
		height: 4px;
		-webkit-appearance: none;
		appearance: none;
		background: var(--bg-tertiary);
		border-radius: 2px;
		outline: none;
	}
	input[type="range"]::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--accent-primary, #6c63ff);
		cursor: pointer;
	}

	/* Materials */
	.material-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
	.material-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 10px;
		border: 1.5px solid var(--border-primary);
		border-radius: 8px;
		background: var(--bg-input);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s;
		font-size: 12px;
		text-transform: capitalize;
	}
	.material-btn:hover { border-color: var(--border-hover); }
	.material-btn.active { border-color: var(--border-accent); background: var(--accent-glow-subtle); color: var(--text-primary); }
	.material-swatch {
		width: 18px;
		height: 18px;
		border-radius: 4px;
		border: 1px solid var(--border-hover);
	}
	.material-name { font-weight: 500; }

	/* Stats */
	.stats-bar {
		padding: 8px 16px;
		display: flex;
		gap: 12px;
		font-size: 11px;
		color: var(--text-muted);
	}
	.stat { font-family: var(--font-mono); }
	.processing { color: var(--accent-warm, #f59e0b); }
	.reset-row { padding: 4px 16px 16px; }
</style>
