<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import LiquidChrome from '#lib/components/LiquidChrome.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="relative isolate min-h-dvh bg-black text-white">
	<div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
		<LiquidChrome
			color="#ffffff"
			speed={0.2}
			amplitude={0.3}
			detail={4}
			thickness={1}
			interactive
			frequencyX={3}
			frequencyY={3}
			depth={1}
			roughness={0.3}
			exposure={1}
			rippleStrength={1}
			rippleSize={1}
			tilt={1}
			intro
			lightMode={false}
			opaque
		/>
	</div>
	{@render children()}
</div>
