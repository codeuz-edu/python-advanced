<script setup>
// A numbered circle that marks the order of the pointer changes.
defineProps({ x: Number, y: Number, n: [String, Number] })
</script>

<template>
 <g class="dg-step"><circle :cx="x" :cy="y" r="9" /><text :x="x" :y="y">{{ n }}</text></g>
</template>
