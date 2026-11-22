<script setup>
// A class drawn as a box: its name on top, its attributes and methods listed under a thin line.
//   state: new (filled blue: added), done (blue outline: has to be edited), ghost (dashed: removed),
//          muted (grey: not involved)
//   tag:   a small word above the name, for example "abstract"
// The box is `w` wide and 34 + 17 per member tall (12 more with a tag). Its top centre is
// (x + w / 2, y) and its bottom centre (x + w / 2, y + height).
import { computed } from 'vue'
const props = defineProps({ x: Number, y: Number, w: { type: Number, default: 150 }, name: String, members: { type: Array, default: () => [] }, state: { type: String, default: '' }, tag: { type: String, default: '' } })
const head = computed(() => props.tag ? 42 : 30)
const height = computed(() => head.value + (props.members.length ? props.members.length * 17 + 8 : 4))
</script>

<template>
 <g :class="state && `is-${state}`" :transform="`translate(${x} ${y})`">
  <rect class="dg-box" :width="w" :height="height" />
  <text v-if="tag" class="dg-label" :x="w / 2" y="14">{{ tag }}</text>
  <text class="dg-name" :x="w / 2" :y="tag ? 28 : 16">{{ name }}</text>
  <line v-if="members.length" class="dg-split" x1="0" :y1="head" :x2="w" :y2="head" />
  <text v-for="(member, i) in members" :key="member" class="dg-code start" x="12" :y="head + 14 + 17 * i">{{ member }}</text>
 </g>
</template>
