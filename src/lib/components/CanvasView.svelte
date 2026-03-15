<!--
  CanvasView.svelte — Three.js WebGL canvas container
  
  Handles canvas lifecycle, resize observation, and scene manager integration.
  Uses Svelte 5 runes.
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { createSceneManager, type SceneManager } from '$lib/three/scene';
	import type { Slot } from '$lib/algorithms/perforation';

	interface Props {
		slots: Slot[];
		panelWidth: number;
		panelHeight: number;
		panelThickness: number;
		visualMode: 'day' | 'daylight' | 'night' | 'distance';
		hasImage: boolean;
	}

	let {
		slots,
		panelWidth,
		panelHeight,
		panelThickness,
		visualMode,
		hasImage
	}: Props = $props();

	let containerEl: HTMLDivElement;
	let canvasEl: HTMLCanvasElement;
	let sceneManager: SceneManager | null = $state(null);

	onMount(() => {
		sceneManager = createSceneManager(canvasEl);

		// Apply initial theme
		const initialTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
		sceneManager.setTheme(initialTheme);

		// Observe theme changes
		const themeObserver = new MutationObserver(() => {
			const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
			sceneManager?.setTheme(theme);
		});
		themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

		// Initial size
		const rect = containerEl.getBoundingClientRect();
		sceneManager.resize(rect.width, rect.height);

		// Observe resize
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				sceneManager?.resize(width, height);
			}
		});
		observer.observe(containerEl);

		return () => {
			themeObserver.disconnect();
			observer.disconnect();
			sceneManager?.dispose();
		};
	});

	// React to slot changes
	$effect(() => {
		if (sceneManager && slots) {
			sceneManager.updateSlots(slots, panelWidth, panelHeight, panelThickness);
		}
	});

	// React to visual mode changes
	$effect(() => {
		if (sceneManager) {
			sceneManager.setVisualMode(visualMode);
		}
	});
</script>

<div class="canvas-container" bind:this={containerEl} id="canvas-container">
	<canvas bind:this={canvasEl} id="three-canvas"></canvas>

	{#if !hasImage}
		<div class="empty-state">
			<div class="empty-graphic">
				<svg width="120" height="120" viewBox="0 0 120 120" fill="none">
					<!-- Panel outline -->
					<rect x="15" y="25" width="90" height="70" rx="4" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
					<!-- Slot lines -->
					<g opacity="0.15">
						<rect x="22" y="34" width="12" height="3" rx="1.5" fill="currentColor"/>
						<rect x="38" y="34" width="8" height="3" rx="1.5" fill="currentColor"/>
						<rect x="50" y="34" width="14" height="3" rx="1.5" fill="currentColor"/>
						<rect x="68" y="34" width="6" height="3" rx="1.5" fill="currentColor"/>
						<rect x="78" y="34" width="20" height="3" rx="1.5" fill="currentColor"/>

						<rect x="22" y="42" width="18" height="3" rx="1.5" fill="currentColor"/>
						<rect x="44" y="42" width="10" height="3" rx="1.5" fill="currentColor"/>
						<rect x="58" y="42" width="16" height="3" rx="1.5" fill="currentColor"/>
						<rect x="78" y="42" width="12" height="3" rx="1.5" fill="currentColor"/>

						<rect x="22" y="50" width="8" height="3" rx="1.5" fill="currentColor"/>
						<rect x="34" y="50" width="14" height="3" rx="1.5" fill="currentColor"/>
						<rect x="52" y="50" width="20" height="3" rx="1.5" fill="currentColor"/>
						<rect x="76" y="50" width="8" height="3" rx="1.5" fill="currentColor"/>

						<rect x="22" y="58" width="16" height="3" rx="1.5" fill="currentColor"/>
						<rect x="42" y="58" width="6" height="3" rx="1.5" fill="currentColor"/>
						<rect x="52" y="58" width="12" height="3" rx="1.5" fill="currentColor"/>
						<rect x="68" y="58" width="18" height="3" rx="1.5" fill="currentColor"/>

						<rect x="22" y="66" width="10" height="3" rx="1.5" fill="currentColor"/>
						<rect x="36" y="66" width="20" height="3" rx="1.5" fill="currentColor"/>
						<rect x="60" y="66" width="8" height="3" rx="1.5" fill="currentColor"/>
						<rect x="72" y="66" width="14" height="3" rx="1.5" fill="currentColor"/>

						<rect x="22" y="74" width="14" height="3" rx="1.5" fill="currentColor"/>
						<rect x="40" y="74" width="12" height="3" rx="1.5" fill="currentColor"/>
						<rect x="56" y="74" width="18" height="3" rx="1.5" fill="currentColor"/>
						<rect x="78" y="74" width="10" height="3" rx="1.5" fill="currentColor"/>

						<rect x="22" y="82" width="6" height="3" rx="1.5" fill="currentColor"/>
						<rect x="32" y="82" width="16" height="3" rx="1.5" fill="currentColor"/>
						<rect x="52" y="82" width="10" height="3" rx="1.5" fill="currentColor"/>
						<rect x="66" y="82" width="14" height="3" rx="1.5" fill="currentColor"/>
						<rect x="84" y="82" width="8" height="3" rx="1.5" fill="currentColor"/>
					</g>

					<!-- Upload arrow -->
					<g transform="translate(60, 60)">
						<circle r="20" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3" stroke-dasharray="4 3"/>
						<path d="M0 8L0 -8M-6 -2L0 -8L6 -2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
					</g>
				</svg>
			</div>
			<h2 class="empty-title">Upload an Image</h2>
			<p class="empty-description">
				Drop an image to generate<br/>
				perforated facade patterns
			</p>
			<div class="empty-hint">
				<span class="key">JPG</span>
				<span class="key">PNG</span>
				<span class="key">WebP</span>
			</div>
		</div>
	{/if}

	<!-- Performance overlay -->
	{#if hasImage && slots.length > 0}
		<div class="info-overlay">
			<span class="info-badge">
				{slots.length.toLocaleString()} slots
			</span>
			<span class="info-badge">
				{panelWidth}×{panelHeight}mm
			</span>
		</div>
	{/if}
</div>

<style>
	.canvas-container {
		flex: 1;
		position: relative;
		overflow: hidden;
		background: var(--bg-primary);
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}

	/* Empty state */
	.empty-state {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-lg);
		pointer-events: none;
		background: radial-gradient(ellipse at center, rgba(108, 99, 255, 0.04) 0%, transparent 70%);
	}
	.empty-graphic {
		color: var(--text-muted);
		animation: float 4s ease-in-out infinite;
	}
	@keyframes float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-10px); }
	}
	.empty-title {
		font-size: 22px;
		font-weight: 600;
		color: var(--text-secondary);
		letter-spacing: -0.01em;
	}
	.empty-description {
		font-size: 14px;
		color: var(--text-muted);
		text-align: center;
		line-height: 1.6;
	}
	.empty-hint {
		display: flex;
		gap: var(--space-sm);
	}
	.key {
		padding: 3px 10px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-muted);
		font-weight: 500;
	}

	/* Info overlay */
	.info-overlay {
		position: absolute;
		bottom: var(--space-lg);
		right: var(--space-lg);
		display: flex;
		gap: var(--space-sm);
	}
	.info-badge {
		padding: 4px 10px;
		background: var(--bg-overlay);
		backdrop-filter: blur(10px);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-full);
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-secondary);
		font-weight: 500;
	}
</style>
