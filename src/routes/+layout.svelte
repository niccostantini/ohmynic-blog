<script lang="ts">
	import favicon from '$lib/assets/favicon.ico';
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme, themeColor } from '$lib/stores/theme';

	let { children } = $props();

	onMount(() => {
		theme.initTheme();
		themeColor.initThemeColor();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
