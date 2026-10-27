<script lang="ts">
	import LiquidGlass from '#lib/liquid-glass/LiquidGlass.svelte';
</script>

<main
	class="grid min-h-dvh grid-cols-1 gap-3 p-3 sm:gap-4 sm:p-4 md:h-dvh md:grid-cols-3 md:grid-rows-2 md:p-5"
>
	<LiquidGlass
		radius={40}
		blur={0}
		tint="rgba(255,255,255,0.06)"
		class="min-h-80 min-w-0 overflow-hidden md:col-start-1 md:row-span-2 md:row-start-1 md:min-h-0"
	/>
	<LiquidGlass
		radius={40}
		blur={0}
		tint="rgba(255,255,255,0.06)"
		class="min-h-44 min-w-0 overflow-hidden md:col-start-2 md:row-start-1 md:min-h-0"
	/>
	<LiquidGlass
		radius={40}
		blur={0}
		tint="rgba(255,255,255,0.06)"
		class="min-h-44 min-w-0 overflow-hidden md:col-start-2 md:row-start-2 md:min-h-0"
	/>
	<LiquidGlass
		radius={40}
		blur={0}
		tint="rgba(255,255,255,0.06)"
		class="min-h-80 min-w-0 overflow-hidden md:col-start-3 md:row-span-2 md:row-start-1 md:min-h-0"
	/>
</main>
