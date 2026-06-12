<script lang="ts">
  import { getPlaceholderProps, TAG_COLORS, TAG_COLORS_LIGHT, GRADIENT_COLORS } from '$lib/utils/placeholder';

  let {
    slug,
    tagSlug = 'default',
    aspectRatio = '16/9',
  }: {
    slug: string;
    tagSlug?: string;
    aspectRatio?: string;
  } = $props();

  const p       = $derived(getPlaceholderProps(slug));
  const colors  = $derived(TAG_COLORS[tagSlug]        ?? TAG_COLORS.default);
  const lightBg = $derived(TAG_COLORS_LIGHT[tagSlug]  ?? TAG_COLORS_LIGHT.default);
  const grad    = $derived(GRADIENT_COLORS[tagSlug]   ?? GRADIENT_COLORS.default);

  // layer2_shape must never equal layer1_shape
  const l1shape = $derived(p.layer1_shape);
  const l2shape = $derived(
    p.layer2_shape === p.layer1_shape ? (p.layer2_shape + 1) % 4 : p.layer2_shape
  );
  const l3shape = $derived(p.layer3_shape);

  // Layer centres
  const cx1 = $derived(160 + p.offsetX1);
  const cy1 = $derived(90  + p.offsetY1);
  const cx2 = $derived(160 + p.offsetX2);
  const cy2 = $derived(90  + p.offsetY2);
  const cx3 = $derived(160 - p.offsetX2);
  const cy3 = $derived(90  - p.offsetY2);

  // Layer 3 scale (smaller)
  const scale3 = $derived(Math.round(p.scale2 * 0.6));

  // Gradient anchor in userSpaceOnUse px
  const gradCxPx = $derived(Math.round(parseInt(p.grad_cx) / 100 * 320));
  const gradCyPx = $derived(Math.round(parseInt(p.grad_cy) / 100 * 180));

  // Opacity values (dark + pre-doubled for light)
  const op1  = $derived((p.opacity1 / 100).toFixed(3));
  const op1l = $derived(Math.min(1, p.opacity1 * 2 / 100).toFixed(3));
  const op2  = $derived((p.opacity2 / 100).toFixed(3));
  const op2l = $derived(Math.min(1, p.opacity2 * 2 / 100).toFixed(3));
  const op3  = $derived((p.opacity2 * 0.6 / 100).toFixed(3));
  const op3l = $derived(Math.min(1, p.opacity2 * 1.2 / 100).toFixed(3));

  // Dot grid helper (7×4 matrix)
  function makeDotGrid(cx: number, cy: number, scale: number) {
    const spacing = Math.max(6, Math.round(scale / 6));
    return Array.from({ length: 28 }, (_, i) => ({
      cx: Math.round(cx + (i % 7 - 3) * spacing),
      cy: Math.round(cy + (Math.floor(i / 7) - 1.5) * spacing),
    }));
  }

  const dotGrid1 = $derived(makeDotGrid(cx1, cy1, p.scale1));
  const dotGrid2 = $derived(makeDotGrid(cx2, cy2, p.scale2));
  const dotGrid3 = $derived(makeDotGrid(cx3, cy3, scale3));

  // Equilateral triangle points centred at origin, pointing up
  function triPts(s: number): string {
    const h = +(s * 0.866).toFixed(1);
    const h2 = +(s * 0.5).toFixed(1);
    return `0,${-s} ${h},${h2} ${-h},${h2}`;
  }
</script>

<svg
  class="article-placeholder"
  viewBox="0 0 320 180"
  preserveAspectRatio="xMidYMid slice"
  xmlns="http://www.w3.org/2000/svg"
  style="
    --ph-bg-light:{lightBg};
    --l1-op:{op1}; --l1-op-l:{op1l};
    --l2-op:{op2}; --l2-op-l:{op2l};
    --l3-op:{op3}; --l3-op-l:{op3l};
    width:100%; aspect-ratio:{aspectRatio}; display:block;
  "
  aria-hidden="true"
>
  <defs>
    <radialGradient
      id="phg-{slug}"
      cx={gradCxPx}
      cy={gradCyPx}
      r="300"
      gradientUnits="userSpaceOnUse"
    >
      <stop offset="0%" stop-color={grad.stop0} />
      <stop offset="100%" stop-color={grad.stop1} />
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect class="ph-bg" width="320" height="180" fill="url(#phg-{slug})" />

  <!-- Diagonal line -->
  <line
    class="ph-diag"
    x1="-10" y1="90" x2="330" y2="90"
    transform="rotate({p.diag_angle}, 160, 90)"
    stroke={colors.stroke} stroke-width="0.4"
  />

  <!-- Layer 1 — main shape -->
  <g class="ph-l1">
    {#if l1shape === 0}
      <circle cx={cx1} cy={cy1} r={p.scale1}
        fill={colors.stroke} stroke={colors.stroke} stroke-width="0.8" />
    {:else if l1shape === 1}
      <polygon
        points={triPts(p.scale1)}
        transform="translate({cx1},{cy1}) rotate({p.rotation1})"
        fill={colors.stroke} stroke={colors.stroke} stroke-width="0.8"
      />
    {:else if l1shape === 2}
      {#each dotGrid1 as d (`${d.cx},${d.cy}`)}
        <circle cx={d.cx} cy={d.cy} r="1.5" fill={colors.stroke} />
      {/each}
    {:else}
      <circle cx={cx1} cy={cy1} r={+(p.scale1 * 0.4).toFixed(1)}
        fill="none" stroke={colors.stroke} stroke-width="0.8" />
      <circle cx={cx1} cy={cy1} r={+(p.scale1 * 0.7).toFixed(1)}
        fill="none" stroke={colors.stroke} stroke-width="0.6" />
      <circle cx={cx1} cy={cy1} r={p.scale1}
        fill="none" stroke={colors.stroke} stroke-width="0.4" />
    {/if}
  </g>

  <!-- Layer 2 — secondary shape (always different type from layer 1) -->
  <g class="ph-l2">
    {#if l2shape === 0}
      <circle cx={cx2} cy={cy2} r={p.scale2}
        fill={colors.stroke} stroke={colors.stroke} stroke-width="0.6" />
    {:else if l2shape === 1}
      <polygon
        points={triPts(p.scale2)}
        transform="translate({cx2},{cy2}) rotate({p.rotation2})"
        fill={colors.stroke} stroke={colors.stroke} stroke-width="0.6"
      />
    {:else if l2shape === 2}
      {#each dotGrid2 as d (`${d.cx},${d.cy}`)}
        <circle cx={d.cx} cy={d.cy} r="1.5" fill={colors.stroke} />
      {/each}
    {:else}
      <circle cx={cx2} cy={cy2} r={+(p.scale2 * 0.4).toFixed(1)}
        fill="none" stroke={colors.stroke} stroke-width="0.6" />
      <circle cx={cx2} cy={cy2} r={+(p.scale2 * 0.7).toFixed(1)}
        fill="none" stroke={colors.stroke} stroke-width="0.5" />
      <circle cx={cx2} cy={cy2} r={p.scale2}
        fill="none" stroke={colors.stroke} stroke-width="0.4" />
    {/if}
  </g>

  <!-- Layer 3 — optional third layer, smaller and more transparent -->
  {#if p.layers === 3}
    <g class="ph-l3">
      {#if l3shape === 0}
        <circle cx={cx3} cy={cy3} r={scale3}
          fill={colors.stroke} stroke={colors.stroke} stroke-width="0.5" />
      {:else if l3shape === 1}
        <polygon
          points={triPts(scale3)}
          transform="translate({cx3},{cy3}) rotate({(p.rotation1 + p.rotation2) % 360})"
          fill={colors.stroke} stroke={colors.stroke} stroke-width="0.5"
        />
      {:else if l3shape === 2}
        {#each dotGrid3 as d (`${d.cx},${d.cy}`)}
          <circle cx={d.cx} cy={d.cy} r="1.5" fill={colors.stroke} />
        {/each}
      {:else}
        <circle cx={cx3} cy={cy3} r={+(scale3 * 0.4).toFixed(1)}
          fill="none" stroke={colors.stroke} stroke-width="0.5" />
        <circle cx={cx3} cy={cy3} r={+(scale3 * 0.7).toFixed(1)}
          fill="none" stroke={colors.stroke} stroke-width="0.4" />
        <circle cx={cx3} cy={cy3} r={scale3}
          fill="none" stroke={colors.stroke} stroke-width="0.3" />
      {/if}
    </g>
  {/if}

  <!-- Focal point — fixed at centre of main layer -->
  <circle class="ph-focal" cx={cx1} cy={cy1} r="3"
    fill={colors.stroke} fill-opacity="0.25" />
</svg>

<style>
  .article-placeholder {
    display: block;
  }

  .ph-l1   { opacity: var(--l1-op, 0.12); }
  .ph-l2   { opacity: var(--l2-op, 0.08); }
  .ph-l3   { opacity: var(--l3-op, 0.05); }
  .ph-diag { opacity: 0.17; }

  /* Light mode */
  :global([data-theme='light']) .article-placeholder .ph-bg {
    fill: var(--ph-bg-light);
  }
  :global([data-theme='light']) .article-placeholder .ph-l1 {
    opacity: var(--l1-op-l, 0.24);
  }
  :global([data-theme='light']) .article-placeholder .ph-l2 {
    opacity: var(--l2-op-l, 0.16);
  }
  :global([data-theme='light']) .article-placeholder .ph-l3 {
    opacity: var(--l3-op-l, 0.10);
  }
  :global([data-theme='light']) .article-placeholder .ph-diag {
    opacity: 0.34;
  }
</style>
