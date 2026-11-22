<script setup>
// A straight arrow from one point to another. Links are never curved: to go around something,
// list the corner points in `via` and the arrow turns at right angles through them.
// `kind` is accent, muted or removed; a removed link is dashed and has no head.
import { computed } from 'vue'
const props = defineProps({ from: Array, to: Array, via: { type: Array, default: () => [] }, kind: { type: String, default: '' }, head: { type: Boolean, default: true } })
const d = computed(() => 'M' + [props.from, ...props.via, props.to].map(point => point.join(' ')).join('L'))
const marker = computed(() => !props.head || props.kind === 'removed' ? null : `url(#dg-arrow${props.kind ? '-' + props.kind : ''})`)
</script>

<template>
 <path :class="['dg-link', kind && `is-${kind}`]" :d="d" :marker-end="marker" />
</template>
