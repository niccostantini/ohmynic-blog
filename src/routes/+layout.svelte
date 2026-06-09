<script lang="ts">
	import favicon from '$lib/assets/favicon.ico';
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme, themeColor } from '$lib/stores/theme';
	import { highContrast } from '$lib/stores/highContrast';

	let { children } = $props();

	onMount(() => {
		theme.initTheme();
		themeColor.initThemeColor();
		highContrast.initHighContrast();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
