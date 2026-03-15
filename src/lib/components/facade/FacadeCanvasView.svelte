<!--
  FacadeCanvasView.svelte — Three.js canvas container for the facade page.
  Creates and manages the FacadeSceneManager lifecycle.
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { createFacadeSceneManager, type FacadeSceneManager } from '$lib/three/facadeScene';

	interface Props {
		selectionMode: boolean;
		onSceneReady: (manager: FacadeSceneManager) => void;
	}

	let { selectionMode, onSceneReady }: Props = $props();

	let containerEl: HTMLDivElement;
	let canvasEl: HTMLCanvasElement;

	onMount(() => {
		const manager = createFacadeSceneManager(canvasEl);

		// Apply initial theme
		const initialTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
		manager.setTheme(initialTheme);

		// Observe theme changes
		const themeObserver = new MutationObserver(() => {
			const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
			manager.setTheme(theme);
		});
		themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

		const rect = containerEl.getBoundingClientRect();
		manager.resize(rect.width, rect.height);

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				manager.resize(width, height);
			}
		});
		observer.observe(containerEl);

		onSceneReady(manager);

		return () => {
			themeObserver.disconnect();
			observer.disconnect();
			manager.dispose();
		};
	});
</script>

<div class="facade-canvas-container" class:selection-mode={selectionMode} bind:this={containerEl}>
	<canvas bind:this={canvasEl}></canvas>

	{#if selectionMode}
		<div class="selection-banner">
			<span class="pulse"></span>
			Click on a building surface to select a facade plane
		</div>
	{/if}
</div>

<style>
	.facade-canvas-container {
		flex: 1;
		height: 100%;
		position: relative;
		overflow: hidden;
	}
	.facade-canvas-container.selection-mode {
		outline: 2px solid var(--accent-blue-border);
		outline-offset: -2px;
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
	.selection-banner {
		position: absolute;
		top: 16px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--bg-overlay);
		backdrop-filter: blur(8px);
		border: 1px solid var(--accent-blue-border);
		border-radius: 8px;
		padding: 8px 18px;
		font-size: 13px;
		color: var(--accent-blue-text);
		display: flex;
		align-items: center;
		gap: 8px;
		pointer-events: none;
	}
	.pulse {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent-blue);
		animation: pulse-anim 1.2s ease-in-out infinite;
	}
	@keyframes pulse-anim {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.4; transform: scale(0.7); }
	}
</style>
