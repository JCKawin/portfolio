<script lang="ts">
	import { untrack } from 'svelte';
	import { attachLiquidChrome, resolveSettings, type LiquidChromeProps } from '../liquid-chrome';

	let {
		color = '#ffffff',
		speed = 0.2,
		amplitude = 0.3,
		frequencyX = 3,
		frequencyY = 3,
		detail = 4,
		thickness = 1,
		depth = 1,
		roughness = 0.3,
		exposure = 1,
		interactive = true,
		rippleStrength = 1,
		rippleSize = 1,
		tilt = 1,
		intro = true,
		lightMode = false,
		opaque = false,
		maxDevicePixelRatio = 2,
		class: className = ''
	}: LiquidChromeProps = $props();

	let container = $state<HTMLDivElement | null>(null);
	let canvas = $state<HTMLCanvasElement | null>(null);
	let wake = () => {};

	const snapshot = () =>
		resolveSettings({
			color,
			speed,
			amplitude,
			frequencyX,
			frequencyY,
			detail,
			thickness,
			depth,
			roughness,
			exposure,
			interactive,
			rippleStrength,
			rippleSize,
			tilt,
			intro,
			lightMode,
			opaque,
			maxDevicePixelRatio
		});

	let settings = snapshot();
	const readSettings = () => settings;

	$effect(() => {
		const element = container;
		const surface = canvas;
		if (!element || !surface) return;
		const handle = untrack(() => attachLiquidChrome(element, surface, readSettings));
		wake = handle.wake;
		return () => {
			wake = () => {};
			handle.destroy();
		};
	});

	$effect(() => {
		settings = snapshot();
		untrack(() => wake());
	});
</script>

<div bind:this={container} class="relative h-full w-full overflow-hidden {className}">
	<canvas bind:this={canvas} class="absolute inset-0 block h-full w-full" aria-hidden="true"
	></canvas>
</div>
