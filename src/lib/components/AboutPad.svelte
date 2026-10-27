<script lang="ts">
	import banner from '#lib/assets/banner.jpg';
	import profile from '#lib/assets/profile.jpg';
	import LiquidGlass from '#lib/liquid-glass/LiquidGlass.svelte';

	let { class: className = '' }: { class?: string } = $props();
</script>

<div class="relative min-w-0 {className}">
	<img
		src={banner}
		alt=""
		class="pointer-events-none absolute inset-x-0 top-0 z-0 h-1/5 w-full rounded-t-[40px] object-cover"
	/>
	<LiquidGlass radius={40} blur={2} tint="rgba(255,255,255,0.06)" class="relative z-10 h-full">
		<div class="[container-type:size] relative h-full min-h-0 overflow-hidden">
			<article class="flex h-full min-h-0 flex-col [--avatar:clamp(5rem,18cqh,8rem)]">
				<div class="h-1/5 shrink-0" aria-hidden="true"></div>

				<div class="flex h-4/5 min-h-0 flex-col">
					<div class="h-[calc(var(--avatar)/2+1.15rem)] shrink-0" aria-hidden="true"></div>
					<div
						class="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-5 pb-6 text-center [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]"
					>
						<h1 class="text-2xl font-semibold tracking-tight text-white">JC Kawin</h1>
						<p class="mt-1 text-sm text-white/80">3D Artist</p>
						<p class="mt-1 text-[0.7rem] tracking-[0.16em] text-white/55 uppercase">
							Inizh · India
						</p>

						<h2 class="mt-6 text-[0.7rem] font-medium tracking-[0.2em] text-white/50 uppercase">
							About
						</h2>
						<p class="mt-2 max-w-[34ch] text-sm leading-relaxed text-pretty text-white/90">
							I make images and the tools around them, from the inizh raytracer to Open-PhysX. I use
							Arch, by the way.
						</p>
					</div>
				</div>

				<img
					src={profile}
					alt="Profile photo of JC Kawin"
					width="420"
					height="420"
					class="absolute top-1/5 left-1/2 z-10 aspect-square w-[var(--avatar)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black object-cover shadow-[0_12px_28px_rgba(0,0,0,0.5)] ring-[3px] ring-white/90"
				/>
			</article>
		</div>
	</LiquidGlass>
</div>
