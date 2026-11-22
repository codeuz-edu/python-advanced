<script setup>
// Single Responsibility lesson, the violation: three groups send their requests into one Order,
// and the cart preview can only stop saving by editing that shared class.
import { computed } from 'vue'
import { useData } from 'vitepress'
import Diagram from './Diagram.vue'
import DClass from './DClass.vue'
import DArrow from './DArrow.vue'
import DStep from './DStep.vue'
const { lang } = useData()
const t = computed(() => lang.value?.startsWith('uz') ? {
 label: 'Savatdagi summa: notöğri yondaşuv', cost: '2 joy özgaradi',
 alt: 'Order narxni hisoblaydi, çegirma beradi va buyurtmani saqlaydi. Moliya, marketing va platforma jamoalari turli sabab bilan bitta klassni özgartiradi. Savat sahifasiga çegirmali narx kerak, ammo Order yaratilgan zahoti buyurtmani saqlaydi.',
 who: 'özgarişni kim söraydi', actors: ['moliya bölimi', 'marketing', 'platforma jamoasi'], cart: 'savat sahifasi',
 added: 'yangi: saqlamasligi kerak', edit: ['tahrirlaş kerak:', 'save=False bayroği'], lesson: 'bitta klass uç guruhga xizmat qiladi: har bir talab uni qayta oçadi'
} : {
 label: 'Cart preview: the violation', cost: '2 places change',
 alt: 'Order holds the items and the total and has three methods: calculate_total, apply_discount and save. Finance asks for changes to calculate_total, marketing to apply_discount and the platform team to save, so all three groups edit the same class. The new cart page needs the discounted total without saving, but building an Order saves it, so Order itself would have to be edited with a save=False flag.',
 who: 'who asks for changes', actors: ['finance', 'marketing', 'the platform team'], cart: 'cart page',
 added: 'new: must not save', edit: ['must be edited:', 'a save=False flag'], lesson: 'one class answers to three groups, so every request reopens it'
})
</script>

<template>
 <Diagram :label="t.label" :cost="t.cost" :width="640" :height="207" :alt="t.alt">
  <DArrow :from="[182, 118]" :to="[224, 118]" />
  <DArrow :from="[182, 135]" :to="[224, 135]" />
  <DArrow :from="[182, 152]" :to="[224, 152]" />
  <DArrow :from="[446, 126]" :to="[378, 126]" kind="accent" />
  <text class="dg-label end" x="176" y="98">{{ t.who }}</text>
  <text v-for="(actor, i) in t.actors" :key="actor" class="dg-value is-small end" x="176" :y="118 + 17 * i">{{ actor }}</text>
  <DClass :x="226" :y="40" name="Order" :members="['items', 'total_price', 'calculate_total()', 'apply_discount()', 'save()']" state="done" />
  <DClass :x="446" :y="110" :name="t.cart" :members="['Order(cart)']" state="new" />
  <DStep :x="461" :y="94" :n="1" /><text class="dg-note is-accent start" x="476" y="98">{{ t.added }}</text>
  <DStep :x="390" :y="56" :n="2" /><text class="dg-note is-accent start" x="406" y="52">{{ t.edit[0] }}</text><text class="dg-note is-accent start" x="406" y="68">{{ t.edit[1] }}</text>
  <text class="dg-note" x="320" y="195">{{ t.lesson }}</text>
 </Diagram>
</template>
