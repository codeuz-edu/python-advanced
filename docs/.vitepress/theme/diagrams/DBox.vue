<script setup>
// A plain labelled box. `small` switches to the smaller text used for words.
defineProps({ x: Number, y: Number, w: { type: Number, default: 84 }, h: { type: Number, default: 36 }, text: [String, Number], state: { type: String, default: '' }, small: Boolean })
</script>

<template>
 <g :class="state && `is-${state}`" :transform="`translate(${x} ${y})`">
  <rect class="dg-box" :width="w" :height="h" />
  <text :class="['dg-value', small && 'is-small']" :x="w / 2" :y="h / 2">{{ text }}</text>
 </g>
</template>
