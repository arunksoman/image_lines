<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	let { children } = $props();

	let dark = $state(true);

	if (browser) {
		const saved = localStorage.getItem('theme');
		const isDark = saved ? saved === 'dark' : true;
		dark = isDark;
		document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
	}

	function toggleTheme() {
		dark = !dark;
		const theme = dark ? 'dark' : 'light';
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
	}
</script>

<nav class="app-nav">
	<a href="/" class="nav-item">
		<span class="nav-icon">◆</span>
		<span>ImageLines</span>
	</a>
	<span class="nav-sep">|</span>
	<a href="/facade" class="nav-item">
		<span class="nav-icon">🏢</span>
		<span>Facade Layout</span>
	</a>
	<span class="nav-sep">|</span>
	<button class="theme-toggle" onclick={toggleTheme} title={dark ? 'Switch to light theme' : 'Switch to dark theme'}>
		{dark ? '☀️' : '🌙'}
	</button>
</nav>

{@render children()}

<style>
	.app-nav {
		position: fixed;
		top: 12px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 10000;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 16px;
		background: var(--nav-bg);
		backdrop-filter: blur(12px);
		border: 1px solid var(--nav-border);
		border-radius: 20px;
		font-size: 12px;
		font-family: var(--font-sans, system-ui, sans-serif);
		pointer-events: auto;
		transition: background var(--transition-fast), border var(--transition-fast);
	}
	.nav-item {
		color: var(--nav-text);
		text-decoration: none;
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 3px 10px;
		border-radius: 12px;
		transition: all 0.2s;
		white-space: nowrap;
	}
	.nav-item:hover {
		color: var(--nav-text-hover);
		background: var(--nav-item-hover-bg);
	}
	.nav-sep {
		color: var(--nav-sep);
		user-select: none;
	}
	.nav-icon {
		font-size: 10px;
	}
	.theme-toggle {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 14px;
		padding: 2px 6px;
		border-radius: 8px;
		transition: background 0.2s;
		line-height: 1;
	}
	.theme-toggle:hover {
		background: var(--nav-item-hover-bg);
	}
</style>
