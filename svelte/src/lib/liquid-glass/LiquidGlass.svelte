<script lang="ts" module>
	import {
		buildDisplacementMap,
		buildInteriorMask,
		buildSpecularMap,
		imageDataToUrl,
		type SurfaceProfile
	} from './maps';

	type Maps = {
		displacement: string;
		specular: string;
		mask: string;
		scale: number;
		width: number;
		height: number;
	};

	const mapCache: Record<string, Maps> = {};
	const mapKeys: string[] = [];
	let nextFilterId = 0;

	const rememberMaps = (key: string, value: Maps) => {
		mapCache[key] = value;
		mapKeys.push(key);
		if (mapKeys.length <= 64) return;
		const oldest = mapKeys.shift();
		if (oldest) delete mapCache[oldest];
	};

	const createFilterId = () => {
		nextFilterId += 1;
		return `lg-${nextFilterId}`;
	};
	let chromiumCache: boolean | undefined;

	const supportsSvgBackdrop = () => {
		if (chromiumCache !== undefined) return chromiumCache;
		if (typeof navigator === 'undefined') return false;
		const ua = navigator.userAgent;
		chromiumCache = /Chrome\/\d+/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
		return chromiumCache;
	};
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import './liquid-glass.css';

	let {
		children,
		radius = 32,
		bezel: bezelProp,
		thickness: thicknessProp,
		tint = 'light',
		ior = 1.5,
		profile = 'squircle' as SurfaceProfile,
		refraction = 1,
		dispersion = 0.06,
		blur = 3,
		saturation = 1.5,
		specular = 1,
		lightAngle = -135,
		interactive = false,
		class: className = ''
	}: {
		children?: Snippet;
		radius?: number;
		bezel?: number;
		thickness?: number;
		tint?: 'light' | 'dark' | (string & {});
		ior?: number;
		profile?: SurfaceProfile;
		refraction?: number;
		dispersion?: number;
		blur?: number;
		saturation?: number;
		specular?: number;
		lightAngle?: number;
		interactive?: boolean;
		class?: string;
	} = $props();

	const filterId = createFilterId();
	let el = $state<HTMLDivElement | null>(null);
	let size = $state<{ w: number; h: number } | null>(null);
	let svgSupported = $state(false);
	let pressed = $state(false);

	$effect(() => {
		const node = el;
		if (!node) return;
		svgSupported = supportsSvgBackdrop();
		let width = 0;
		let height = 0;
		const update = () => {
			const nextWidth = Math.round(node.offsetWidth);
			const nextHeight = Math.round(node.offsetHeight);
			if (nextWidth === width && nextHeight === height) return;
			width = nextWidth;
			height = nextHeight;
			size = { w: width, h: height };
		};
		update();
		const observer = new ResizeObserver(update);
		observer.observe(node, { box: 'border-box' });
		return () => observer.disconnect();
	});

	$effect(() => {
		const node = el;
		if (!node || !interactive) return;
		const down = (event: PointerEvent) => {
			setPointer(event);
			pressed = true;
		};
		const move = (event: PointerEvent) => setPointer(event);
		const up = () => (pressed = false);
		node.addEventListener('pointerdown', down);
		node.addEventListener('pointermove', move);
		node.addEventListener('pointerup', up);
		node.addEventListener('pointerleave', up);
		node.addEventListener('pointercancel', up);
		return () => {
			node.removeEventListener('pointerdown', down);
			node.removeEventListener('pointermove', move);
			node.removeEventListener('pointerup', up);
			node.removeEventListener('pointerleave', up);
			node.removeEventListener('pointercancel', up);
		};
	});

	const maps = $derived.by(() => {
		if (!size || size.w < 2 || size.h < 2) return null;
		const minSide = Math.min(size.w, size.h);
		const bezel =
			bezelProp ?? Math.max(6, Math.min(minSide * 0.25, Math.min(radius, minSide / 2), 56));
		const thickness = thicknessProp ?? bezel * 1.5;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		const key = [size.w, size.h, radius, bezel, thickness, ior, profile, lightAngle, dpr].join('|');
		let base = mapCache[key];
		if (!base) {
			const shape = { width: size.w, height: size.h, radius };
			const displacement = buildDisplacementMap(shape, { bezel, thickness, ior, profile });
			const highlight = buildSpecularMap(
				shape,
				{
					angle: lightAngle,
					rimWidth: 1.2,
					glowWidth: Math.min(20, Math.max(4, bezel * 0.6))
				},
				dpr
			);
			base = {
				displacement: imageDataToUrl(displacement),
				specular: imageDataToUrl(highlight),
				mask: imageDataToUrl(buildInteriorMask(shape, bezel, 1)),
				scale: displacement.scale,
				width: displacement.width,
				height: displacement.height
			};
			rememberMaps(key, base);
		}
		return { ...base, scale: base.scale * refraction };
	});

	const useSvg = $derived(svgSupported && maps !== null);
	const backdrop = $derived(
		useSvg
			? `blur(${blur}px) url(#${filterId}) saturate(${saturation}) brightness(1.04)`
			: `blur(${Math.max(blur, 8)}px) saturate(${saturation}) brightness(1.05)`
	);
	const customTint = $derived(tint !== 'light' && tint !== 'dark' ? tint : null);

	const setPointer = (event: PointerEvent) => {
		if (!el) return;
		const rect = el.getBoundingClientRect();
		el.style.setProperty('--lg-px', `${((event.clientX - rect.left) / rect.width) * 100}%`);
		el.style.setProperty('--lg-py', `${((event.clientY - rect.top) / rect.height) * 100}%`);
	};
</script>

<div
	bind:this={el}
	class="lg {tint === 'dark' ? 'lg--dark' : ''} {interactive ? 'lg--interactive' : ''} {pressed
		? 'lg--pressed'
		: ''} {useSvg ? '' : 'lg--fallback'} {className}"
	style:border-radius="{radius}px"
	style:--lg-specular-opacity={specular}
	style:--lg-tint={customTint}
	style:backdrop-filter={backdrop}
	style:-webkit-backdrop-filter={backdrop}
>
	<div
		class="lg__tint"
		style={maps
			? `mask-image: url("${maps.mask}"); -webkit-mask-image: url("${maps.mask}")`
			: undefined}
	></div>
	{#if maps}
		<div class="lg__specular" style:background-image="url(&quot;{maps.specular}&quot;)"></div>
	{/if}
	<div class="lg__glow"></div>
	<div class="lg__content">
		{@render children?.()}
	</div>

	{#if useSvg && maps}
		<svg class="lg__defs" aria-hidden="true" focusable="false" width="0" height="0">
			<filter
				id={filterId}
				x="0"
				y="0"
				width={maps.width}
				height={maps.height}
				filterUnits="userSpaceOnUse"
				primitiveUnits="userSpaceOnUse"
				color-interpolation-filters="sRGB"
			>
				<feImage
					href={maps.displacement}
					x="0"
					y="0"
					width={maps.width}
					height={maps.height}
					preserveAspectRatio="none"
					result="map"
				/>
				{#if dispersion > 0}
					<feDisplacementMap
						in="SourceGraphic"
						in2="map"
						scale={maps.scale * (1 + dispersion)}
						xChannelSelector="R"
						yChannelSelector="G"
						result="dispR"
					/>
					<feColorMatrix
						in="dispR"
						type="matrix"
						values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
						result="r"
					/>
					<feDisplacementMap
						in="SourceGraphic"
						in2="map"
						scale={maps.scale}
						xChannelSelector="R"
						yChannelSelector="G"
						result="dispG"
					/>
					<feColorMatrix
						in="dispG"
						type="matrix"
						values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
						result="g"
					/>
					<feDisplacementMap
						in="SourceGraphic"
						in2="map"
						scale={maps.scale * (1 - dispersion)}
						xChannelSelector="R"
						yChannelSelector="G"
						result="dispB"
					/>
					<feColorMatrix
						in="dispB"
						type="matrix"
						values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
						result="b"
					/>
					<feComposite in="r" in2="g" operator="arithmetic" k2="1" k3="1" result="rg" />
					<feComposite in="rg" in2="b" operator="arithmetic" k2="1" k3="1" />
				{:else}
					<feDisplacementMap
						in="SourceGraphic"
						in2="map"
						scale={maps.scale}
						xChannelSelector="R"
						yChannelSelector="G"
					/>
				{/if}
			</filter>
		</svg>
	{/if}
</div>
