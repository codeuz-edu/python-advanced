<script setup>
// Open/Closed lesson, the violation: adding Triangle also forces an edit of AreaCalculator.
import { computed } from 'vue'
import { useData } from 'vitepress'
import Diagram from './Diagram.vue'
import DClass from './DClass.vue'
import DArrow from './DArrow.vue'
import DStep from './DStep.vue'
const { lang } = useData()
const t = computed(() => lang.value?.startsWith('uz') ? {
 label: 'Triangle qöşiş: notöğri yondaşuv', cost: '2 joy özgaradi',
 alt: 'AreaCalculator Rectangle va Circle ni alohida şart bilan tekşiradi. Triangle ni qöşiş uçun hisoblagiçga uçinçi şart yoziş kerak.',
 added: 'yangi klass', edit: ['tahrirlaş kerak:', 'yana bitta isinstance tarmoği'], lesson: 'har bir yangi şakl AreaCalculator ni qayta oçadi'
} : {
 label: 'Add Triangle: the violation', cost: '2 places change',
 alt: 'AreaCalculator has one branch for Rectangle and one for Circle. To support the new Triangle class, AreaCalculator itself has to be edited to add a third branch.',
 added: 'new class', edit: ['must be edited:', 'one more isinstance branch'], lesson: 'every new shape reopens AreaCalculator'
})
</script>

<template>
 <Diagram :label="t.label" :cost="t.cost" :width="640" :height="262" :alt="t.alt">
  <DArrow :from="[320, 78]" :via="[[320, 118], [135, 118]]" :to="[135, 152]" />
  <DArrow :from="[320, 78]" :to="[320, 152]" />
  <DArrow :from="[320, 78]" :via="[[320, 118], [505, 118]]" :to="[505, 152]" kind="accent" />
  <DClass :x="230" :y="22" :w="180" name="AreaCalculator" :members="['calculate(shape)']" state="done" />
  <DClass :x="60" :y="154" name="Rectangle" :members="['width', 'height']" />
  <DClass :x="245" :y="154" name="Circle" :members="['radius']" />
  <DClass :x="430" :y="154" name="Triangle" :members="['base', 'height']" state="new" />
  <DStep :x="505" :y="134" :n="1" /><text class="dg-note is-accent start" x="520" y="138">{{ t.added }}</text>
  <DStep :x="424" :y="50" :n="2" /><text class="dg-note is-accent start" x="440" y="46">{{ t.edit[0] }}</text><text class="dg-note is-accent start" x="440" y="62">{{ t.edit[1] }}</text>
  <text class="dg-note" x="320" y="250">{{ t.lesson }}</text>
 </Diagram>
</template>
