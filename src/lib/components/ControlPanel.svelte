<!--
  ControlPanel.svelte — Parameter control sidebar with image upload,
  sliders, mode toggles, and export buttons.

  Uses Svelte 5 runes for reactivity.
-->

<script lang="ts">
	import type { PanelSettings } from '$lib/stores/settings.svelte';

	interface Props {
		settings: PanelSettings;
		slotCount: number;
		isProcessing: boolean;
		onUpdate: (partial: Partial<PanelSettings>) => void;
		onReset: () => void;
		onExportSvg: () => void;
		onExportGlb: () => void;
		onImageUpload: (file: File) => void;
	}

	let {
		settings,
		slotCount,
		isProcessing,
		onUpdate,
		onReset,
		onExportSvg,
		onExportGlb,
		onImageUpload,
	}: Props = $props();

	let fileInput = $state<HTMLInputElement>(undefined!);
	let isDragging = $state(false);

	function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files?.[0]) {
			onImageUpload(input.files[0]);
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const file = e.dataTransfer?.files[0];
		if (file && file.type.startsWith('image/')) {
			onImageUpload(file);
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	// Section collapse state
	let sectionsOpen = $state({
		image: true,
		lines: true,
		slots: true,
		panel: false,
		visual: true,
		export: true,
	});

	function toggleSection(key: keyof typeof sectionsOpen) {
		sectionsOpen[key] = !sectionsOpen[key];
	}
</script>

<aside class="control-panel" id="control-panel">
	<header class="panel-header">
		<div class="logo">
			<div class="logo-icon">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
					<rect x="2" y="4" width="3" height="16" rx="1.5" fill="currentColor" opacity="0.4"/>
					<rect x="7" y="2" width="3" height="20" rx="1.5" fill="currentColor" opacity="0.6"/>
					<rect x="12" y="6" width="3" height="12" rx="1.5" fill="currentColor" opacity="0.8"/>
					<rect x="17" y="3" width="3" height="18" rx="1.5" fill="currentColor"/>
				</svg>
			</div>
			<div class="logo-text">
				<h1>ImageLines</h1>
				<span class="subtitle">Facade Designer</span>
			</div>
		</div>
	</header>

	<div class="panel-body">
		<!-- Image Upload Section -->
		<section class="section">
			<button class="section-header" onclick={() => toggleSection('image')} id="section-image-toggle">
				<span class="section-icon">📷</span>
				<span class="section-title">Source Image</span>
				<span class="chevron" class:open={sectionsOpen.image}>▸</span>
			</button>
			{#if sectionsOpen.image}
				<div class="section-content">
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="dropzone"
						class:dragging={isDragging}
						class:has-image={!!settings.imageName}
						ondrop={handleDrop}
						ondragover={handleDragOver}
						ondragleave={handleDragLeave}
						onclick={() => fileInput.click()}
						role="button"
						tabindex="0"
						onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); }}
						id="image-dropzone"
					>
						{#if settings.imageName}
							<div class="dropzone-loaded">
								<span class="check-icon">✓</span>
								<span class="filename">{settings.imageName}</span>
								<span class="dropzone-hint">Click to change</span>
							</div>
						{:else}
							<div class="dropzone-empty">
								<span class="upload-icon">⬆</span>
								<span class="dropzone-label">Drop image here</span>
								<span class="dropzone-hint">or click to browse</span>
							</div>
						{/if}
					</div>
					<input
						bind:this={fileInput}
						type="file"
						accept="image/*"
						onchange={handleFileChange}
						class="sr-only"
						id="image-file-input"
					/>
				</div>
			{/if}
		</section>

		<!-- Line Field Section -->
		<section class="section">
			<button class="section-header" onclick={() => toggleSection('lines')} id="section-lines-toggle">
				<span class="section-icon">〰️</span>
				<span class="section-title">Line Field</span>
				<span class="chevron" class:open={sectionsOpen.lines}>▸</span>
			</button>
			{#if sectionsOpen.lines}
				<div class="section-content">
					<div class="control-group">
						<label class="control-label" for="line-density">
							<span>Line Density</span>
							<span class="value">{settings.lineDensity.toFixed(0)}px</span>
						</label>
						<input
							id="line-density"
							type="range"
							min="3"
							max="30"
							step="1"
							value={settings.lineDensity}
							oninput={(e) => onUpdate({ lineDensity: +e.currentTarget.value })}
						/>
					</div>

					<div class="control-group">
						<label class="control-label" for="line-curvature">
							<span>Curvature</span>
							<span class="value">{settings.lineCurvature.toFixed(2)}</span>
						</label>
						<input
							id="line-curvature"
							type="range"
							min="0"
							max="1"
							step="0.01"
							value={settings.lineCurvature}
							oninput={(e) => onUpdate({ lineCurvature: +e.currentTarget.value })}
						/>
					</div>

					<div class="control-group">
						<label class="control-label" for="noise-amount">
							<span>Noise Amount</span>
							<span class="value">{settings.noiseAmount.toFixed(2)}</span>
						</label>
						<input
							id="noise-amount"
							type="range"
							min="0"
							max="1"
							step="0.01"
							value={settings.noiseAmount}
							oninput={(e) => onUpdate({ noiseAmount: +e.currentTarget.value })}
						/>
					</div>

					<div class="control-group">
						<label class="control-label" for="flow-direction">
							<span>Flow Direction</span>
							<span class="value">{settings.flowDirection.toFixed(0)}°</span>
						</label>
						<input
							id="flow-direction"
							type="range"
							min="0"
							max="360"
							step="1"
							value={settings.flowDirection}
							oninput={(e) => onUpdate({ flowDirection: +e.currentTarget.value })}
						/>
					</div>
				</div>
			{/if}
		</section>

		<!-- Perforation Section -->
		<section class="section">
			<button class="section-header" onclick={() => toggleSection('slots')} id="section-slots-toggle">
				<span class="section-icon">⬜</span>
				<span class="section-title">Perforations</span>
				<span class="chevron" class:open={sectionsOpen.slots}>▸</span>
			</button>
			{#if sectionsOpen.slots}
				<div class="section-content">
					<div class="control-group">
						<label class="control-label" for="slot-min-width">
							<span>Min Width</span>
							<span class="value">{settings.slotMinWidth.toFixed(1)}mm</span>
						</label>
						<input
							id="slot-min-width"
							type="range"
							min="0.5"
							max="10"
							step="0.5"
							value={settings.slotMinWidth}
							oninput={(e) => onUpdate({ slotMinWidth: +e.currentTarget.value })}
						/>
					</div>

					<div class="control-group">
						<label class="control-label" for="slot-max-width">
							<span>Max Width</span>
							<span class="value">{settings.slotMaxWidth.toFixed(1)}mm</span>
						</label>
						<input
							id="slot-max-width"
							type="range"
							min="2"
							max="30"
							step="0.5"
							value={settings.slotMaxWidth}
							oninput={(e) => onUpdate({ slotMaxWidth: +e.currentTarget.value })}
						/>
					</div>

					<div class="control-group">
						<label class="control-label" for="slot-length">
							<span>Slot Length</span>
							<span class="value">{settings.slotLength.toFixed(0)}mm</span>
						</label>
						<input
							id="slot-length"
							type="range"
							min="5"
							max="60"
							step="1"
							value={settings.slotLength}
							oninput={(e) => onUpdate({ slotLength: +e.currentTarget.value })}
						/>
					</div>

					<div class="control-group">
						<label class="control-label" for="slot-spacing">
							<span>Spacing</span>
							<span class="value">{settings.slotSpacing.toFixed(0)}mm</span>
						</label>
						<input
							id="slot-spacing"
							type="range"
							min="1"
							max="20"
							step="1"
							value={settings.slotSpacing}
							oninput={(e) => onUpdate({ slotSpacing: +e.currentTarget.value })}
						/>
					</div>
				</div>
			{/if}
		</section>

		<!-- Panel Dimensions Section -->
		<section class="section">
			<button class="section-header" onclick={() => toggleSection('panel')} id="section-panel-toggle">
				<span class="section-icon">📐</span>
				<span class="section-title">Panel Dimensions</span>
				<span class="chevron" class:open={sectionsOpen.panel}>▸</span>
			</button>
			{#if sectionsOpen.panel}
				<div class="section-content">
					<div class="control-group">
						<label class="control-label" for="panel-width">
							<span>Width</span>
							<span class="value">{settings.panelWidth}mm</span>
						</label>
						<input
							id="panel-width"
							type="range"
							min="500"
							max="5000"
							step="100"
							value={settings.panelWidth}
							oninput={(e) => onUpdate({ panelWidth: +e.currentTarget.value })}
						/>
					</div>

					<div class="control-group">
						<label class="control-label" for="panel-height">
							<span>Height</span>
							<span class="value">{settings.panelHeight}mm</span>
						</label>
						<input
							id="panel-height"
							type="range"
							min="500"
							max="3000"
							step="100"
							value={settings.panelHeight}
							oninput={(e) => onUpdate({ panelHeight: +e.currentTarget.value })}
						/>
					</div>

					<div class="control-group">
						<label class="control-label" for="panel-thickness">
							<span>Thickness</span>
							<span class="value">{settings.panelThickness}mm</span>
						</label>
						<input
							id="panel-thickness"
							type="range"
							min="1"
							max="10"
							step="0.5"
							value={settings.panelThickness}
							oninput={(e) => onUpdate({ panelThickness: +e.currentTarget.value })}
						/>
					</div>
				</div>
			{/if}
		</section>

		<!-- Visual Mode Section -->
		<section class="section">
			<button class="section-header" onclick={() => toggleSection('visual')} id="section-visual-toggle">
				<span class="section-icon">🎨</span>
				<span class="section-title">Visual Mode</span>
				<span class="chevron" class:open={sectionsOpen.visual}>▸</span>
			</button>
			{#if sectionsOpen.visual}
				<div class="section-content">
					<div class="mode-switcher">
						<button
							class="mode-btn"
							class:active={settings.visualMode === 'day'}
							onclick={() => onUpdate({ visualMode: 'day' })}
							id="mode-day"
						>
							<span class="mode-icon">☀️</span>
							<span>Day</span>
						</button>
						<button
							class="mode-btn"
							class:active={settings.visualMode === 'daylight'}
							onclick={() => onUpdate({ visualMode: 'daylight' })}
							id="mode-daylight"
						>
							<span class="mode-icon">🌤️</span>
							<span>Daylight</span>
						</button>
						<button
							class="mode-btn"
							class:active={settings.visualMode === 'night'}
							onclick={() => onUpdate({ visualMode: 'night' })}
							id="mode-night"
						>
							<span class="mode-icon">🌙</span>
							<span>Night</span>
						</button>
						<button
							class="mode-btn"
							class:active={settings.visualMode === 'distance'}
							onclick={() => onUpdate({ visualMode: 'distance' })}
							id="mode-distance"
						>
							<span class="mode-icon">🏢</span>
							<span>Distance</span>
						</button>
					</div>
				</div>
			{/if}
		</section>

		<!-- Export Section -->
		<section class="section">
			<button class="section-header" onclick={() => toggleSection('export')} id="section-export-toggle">
				<span class="section-icon">📤</span>
				<span class="section-title">Export</span>
				<span class="chevron" class:open={sectionsOpen.export}>▸</span>
			</button>
			{#if sectionsOpen.export}
				<div class="section-content">
					<div class="export-actions">
						<button
							class="export-btn svg-btn"
							onclick={onExportSvg}
							disabled={slotCount === 0}
							id="export-svg"
						>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M14 3v4a1 1 0 0 0 1 1h4"/>
								<path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/>
							</svg>
							<span>Export SVG</span>
							<span class="export-hint">Fabrication</span>
						</button>
						<button
							class="export-btn glb-btn"
							onclick={onExportGlb}
							disabled={slotCount === 0}
							id="export-glb"
						>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
								<path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"/>
							</svg>
							<span>Export GLB</span>
							<span class="export-hint">3D Model</span>
						</button>
					</div>
				</div>
			{/if}
		</section>
	</div>

	<!-- Footer stats -->
	<footer class="panel-footer">
		<div class="stats">
			<div class="stat">
				<span class="stat-label">Perforations</span>
				<span class="stat-value">{slotCount.toLocaleString()}</span>
			</div>
			{#if isProcessing}
				<div class="processing-indicator">
					<div class="spinner"></div>
					<span>Processing…</span>
				</div>
			{/if}
		</div>
		<button class="reset-btn" onclick={onReset} id="reset-parameters">
			Reset Parameters
		</button>
	</footer>
</aside>

<style>
	.control-panel {
		width: var(--panel-width);
		height: 100%;
		background: var(--bg-panel);
		border-right: 1px solid var(--border-primary);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		flex-shrink: 0;
	}

	/* Header */
	.panel-header {
		padding: var(--space-lg) var(--space-xl);
		border-bottom: 1px solid var(--border-primary);
		background: linear-gradient(180deg, var(--accent-glow-subtle) 0%, transparent 100%);
	}
	.logo {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}
	.logo-icon {
		color: var(--accent-primary);
		display: flex;
		align-items: center;
	}
	.logo-text h1 {
		font-size: 16px;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.2;
	}
	.subtitle {
		font-size: 11px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-weight: 500;
	}

	/* Body */
	.panel-body {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-sm) 0;
	}

	/* Section */
	.section {
		border-bottom: 1px solid var(--border-primary);
	}
	.section-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		width: 100%;
		padding: var(--space-md) var(--space-xl);
		background: none;
		border: none;
		color: var(--text-primary);
		font-family: var(--font-sans);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: background var(--transition-fast);
	}
	.section-header:hover {
		background: var(--bg-hover);
	}
	.section-icon {
		font-size: 14px;
		width: 20px;
		text-align: center;
	}
	.section-title {
		flex: 1;
		text-align: left;
	}
	.chevron {
		color: var(--text-muted);
		transition: transform var(--transition-fast);
		font-size: 12px;
	}
	.chevron.open {
		transform: rotate(90deg);
	}

	.section-content {
		padding: var(--space-sm) var(--space-xl) var(--space-lg);
	}

	/* Control group */
	.control-group {
		margin-bottom: var(--space-md);
	}
	.control-label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 12px;
		color: var(--text-secondary);
		margin-bottom: var(--space-xs);
		font-weight: 500;
	}
	.value {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-accent);
		background: var(--accent-glow-subtle);
		padding: 1px 6px;
		border-radius: var(--radius-sm);
	}

	/* Range input */
	input[type="range"] {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 4px;
		background: var(--bg-active);
		border-radius: var(--radius-full);
		outline: none;
		cursor: pointer;
	}
	input[type="range"]::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--accent-primary);
		cursor: pointer;
		border: 2px solid var(--bg-panel);
		box-shadow: 0 0 8px var(--accent-glow);
		transition: transform var(--transition-fast), box-shadow var(--transition-fast);
	}
	input[type="range"]::-webkit-slider-thumb:hover {
		transform: scale(1.2);
		box-shadow: 0 0 14px var(--accent-glow);
	}
	input[type="range"]::-moz-range-thumb {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--accent-primary);
		cursor: pointer;
		border: 2px solid var(--bg-panel);
	}

	/* Dropzone */
	.dropzone {
		border: 2px dashed var(--border-hover);
		border-radius: var(--radius-md);
		padding: var(--space-xl);
		text-align: center;
		cursor: pointer;
		transition: all var(--transition-normal);
		background: var(--bg-input);
	}
	.dropzone:hover, .dropzone.dragging {
		border-color: var(--accent-primary);
		background: var(--accent-glow-subtle);
	}
	.dropzone.has-image {
		border-color: var(--accent-success);
		border-style: solid;
	}
	.dropzone-empty, .dropzone-loaded {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-xs);
	}
	.upload-icon {
		font-size: 24px;
		opacity: 0.6;
	}
	.check-icon {
		font-size: 20px;
		color: var(--accent-success);
	}
	.dropzone-label {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-secondary);
	}
	.filename {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-primary);
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.dropzone-hint {
		font-size: 11px;
		color: var(--text-muted);
	}

	/* Mode switcher */
	.mode-switcher {
		display: flex;
		gap: var(--space-sm);
	}
	.mode-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-md) var(--space-sm);
		background: var(--bg-input);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-family: var(--font-sans);
		font-size: 11px;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	.mode-btn:hover {
		background: var(--bg-hover);
		border-color: var(--border-hover);
	}
	.mode-btn.active {
		background: var(--accent-glow-subtle);
		border-color: var(--accent-primary);
		color: var(--text-primary);
		box-shadow: var(--shadow-glow);
	}
	.mode-icon {
		font-size: 18px;
	}

	/* Export buttons */
	.export-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.export-btn {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-md) var(--space-lg);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
		background: var(--bg-input);
		color: var(--text-primary);
		font-family: var(--font-sans);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	.export-btn:hover:not(:disabled) {
		background: var(--bg-hover);
		border-color: var(--border-hover);
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}
	.export-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
	.export-hint {
		margin-left: auto;
		font-size: 10px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	.svg-btn:hover:not(:disabled) {
		border-color: var(--accent-warm);
	}
	.glb-btn:hover:not(:disabled) {
		border-color: var(--accent-success);
	}

	/* Footer */
	.panel-footer {
		padding: var(--space-md) var(--space-xl) var(--space-lg);
		border-top: 1px solid var(--border-primary);
		background: var(--bg-secondary);
	}
	.stats {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-md);
	}
	.stat {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.stat-label {
		font-size: 10px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	.stat-value {
		font-family: var(--font-mono);
		font-size: 18px;
		font-weight: 600;
		color: var(--accent-secondary);
	}
	.processing-indicator {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: 12px;
		color: var(--accent-warm);
	}
	.spinner {
		width: 14px;
		height: 14px;
		border: 2px solid var(--accent-warm);
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* Reset button */
	.reset-btn {
		width: 100%;
		padding: var(--space-sm) var(--space-lg);
		background: transparent;
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
		color: var(--text-muted);
		font-family: var(--font-sans);
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	.reset-btn:hover {
		background: var(--accent-danger-bg);
		border-color: var(--accent-danger);
		color: var(--accent-danger);
	}
</style>
