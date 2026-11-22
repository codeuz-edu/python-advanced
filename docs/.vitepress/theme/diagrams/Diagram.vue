<script setup>
// The frame every diagram sits in: a small label, an optional cost badge, and the drawing.
// The drawing goes in the default slot as SVG, on a canvas of `width` x `height` units.
defineProps({
 label: { type: String, default: '' },
 cost: { type: String, default: '' },
 alt: { type: String, required: true },
 width: { type: Number, default: 720 },
 height: { type: Number, required: true }
})
</script>

<template>
 <figure class="dg">
  <span class="dg-tick tl" /><span class="dg-tick tr" /><span class="dg-tick bl" /><span class="dg-tick br" />
  <figcaption v-if="label || cost" class="dg-head">
   <span class="dg-eyebrow">{{ label }}</span>
   <span v-if="cost" class="dg-cost">{{ cost }}</span>
  </figcaption>
  <div class="dg-scroll">
   <svg :viewBox="`0 0 ${width} ${height}`" :width="width" :height="height" role="img" :aria-label="alt">
    <defs>
     <marker id="dg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-head-ink" d="M0 1L10 5L0 9L3 5z" /></marker>
     <marker id="dg-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="dg-head-accent" d="M0 1L10 5L0 9L3 5z" /></marker>
     <marker id="dg-arrow-muted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-head-muted" d="M0 1L10 5L0 9L3 5z" /></marker>
    </defs>
    <slot />
   </svg>
  </div>
 </figure>
</template>
