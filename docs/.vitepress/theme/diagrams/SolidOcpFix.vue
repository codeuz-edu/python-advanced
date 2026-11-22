<script setup>
// Open/Closed lesson, the fix: Triangle is one new class and nothing that exists is edited.
import { computed } from 'vue'
import { useData } from 'vitepress'
import Diagram from './Diagram.vue'
import DClass from './DClass.vue'
import DArrow from './DArrow.vue'
import DStep from './DStep.vue'
const { lang } = useData()
const t = computed(() => lang.value?.startsWith('uz') ? {
 label: 'Triangle qöşiş: töğri yondaşuv', cost: '1 joy özgaradi',
 alt: 'Rectangle, Circle va Triangle klasslari Shape dan meros oladi. Har biri öz area metodiga ega. total_area har bir şakl uçun bir xil metodni çaqiradi.',
 uses: 'foydalanadi', added: 'yangi klass', kept: ['tahrirlanmaydi:', 'Shape, Rectangle, Circle, total_area'], lesson: 'yangi şakl - bitta yangi klass; mavjud kod qayta oçilmaydi'
} : {
 label: 'Add Triangle: the fix', cost: '1 place changes',
 alt: 'Shape is an abstract class with an area method. Rectangle and Circle implement it, and total_area works with any Shape. Adding Triangle is one new class, and nothing that already exists is edited.',
 uses: 'uses', added: 'new class', kept: ['not edited:', 'Shape, Rectangle, Circle, total_area'], lesson: 'a new shape is one new class; nothing that exists is reopened'
})
</script>

<template>
 <Diagram :label="t.label" :cost="t.cost" :width="640" :height="290" :alt="t.alt">
  <DArrow :from="[135, 166]" :via="[[135, 130]]" :to="[320, 130]" :head="false" />
  <DArrow :from="[320, 166]" :to="[320, 91]" />
  <DArrow :from="[505, 166]" :via="[[505, 130]]" :to="[320, 130]" kind="accent" :head="false" />
  <DArrow :from="[160, 50]" :to="[243, 50]" /><text class="dg-note" x="201" y="42">{{ t.uses }}</text>
  <DClass :x="14" :y="26" :w="146" name="total_area" :members="['sum of s.area()']" state="muted" />
  <DClass :x="245" :y="22" name="Shape" tag="abstract" :members="['area()']" />
  <DClass :x="60" :y="168" name="Rectangle" :members="['width', 'height', 'area()']" />
  <DClass :x="245" :y="168" name="Circle" :members="['radius', 'area()']" />
  <DClass :x="430" :y="168" name="Triangle" :members="['base', 'height', 'area()']" state="new" />
  <DStep :x="505" :y="148" :n="1" /><text class="dg-note is-accent start" x="520" y="152">{{ t.added }}</text>
  <text class="dg-note start" x="420" y="46">{{ t.kept[0] }}</text><text class="dg-note start" x="420" y="62">{{ t.kept[1] }}</text>
  <text class="dg-note" x="320" y="278">{{ t.lesson }}</text>
 </Diagram>
</template>
