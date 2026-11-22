<script setup>
// A row (or a column, with `vertical`) of array cells.
//   values:  what each cell holds; null draws an empty cell
//   states:  per cell, by index: new, hit, done, ghost or muted
//   indices: true to number the cells from 0, or a list of labels
//   marks:   pointer labels by index, for example { 0: 'front', 3: 'rear' }
// Horizontal: cell i covers x + i * w to x + (i + 1) * w, with its top edge at y.
// Vertical: cell 0 is the bottom one at y, and cell i sits i * h above it.
defineProps({
 x: Number, y: Number,
 values: { type: Array, required: true },
 states: { type: [Array, Object], default: () => ({}) },
 indices: { type: [Boolean, Array], default: false },
 marks: { type: Object, default: () => ({}) },
 w: { type: Number, default: 48 }, h: { type: Number, default: 40 },
 vertical: Boolean, small: Boolean
})
</script>

<template>
 <g>
  <g v-for="(value, i) in values" :key="i" :class="states[i] && `is-${states[i]}`" :transform="vertical ? `translate(${x} ${y - i * h})` : `translate(${x + i * w} ${y})`">
   <rect class="dg-box" :width="w" :height="h" />
   <text v-if="value !== null && value !== undefined" :class="['dg-value', small && 'is-small']" :x="w / 2" :y="h / 2">{{ value }}</text>
   <text v-if="indices" class="dg-index" :x="vertical ? -14 : w / 2" :y="vertical ? h / 2 : h + 13">{{ indices === true ? i : indices[i] }}</text>
   <template v-if="marks[i]">
    <template v-if="vertical">
     <line class="dg-link is-accent" :x1="w + 30" :y1="h / 2" :x2="w + 5" :y2="h / 2" marker-end="url(#dg-arrow-accent)" />
     <text class="dg-label is-accent start" :x="w + 36" :y="h / 2 + 4">{{ marks[i] }}</text>
    </template>
    <template v-else>
     <text class="dg-label is-accent" :x="w / 2" y="-24">{{ marks[i] }}</text>
     <line class="dg-link is-accent" :x1="w / 2" y1="-18" :x2="w / 2" y2="-4" marker-end="url(#dg-arrow-accent)" />
    </template>
   </template>
  </g>
 </g>
</template>
