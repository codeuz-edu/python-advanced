<script setup>
// Single Responsibility lesson, the fix: each group's requests reach its own class, and the cart
// preview is two calls to existing classes, with nothing edited or saved.
import { computed } from 'vue'
import { useData } from 'vitepress'
import Diagram from './Diagram.vue'
import DClass from './DClass.vue'
import DArrow from './DArrow.vue'
import DStep from './DStep.vue'
const { lang } = useData()
const t = computed(() => lang.value?.startsWith('uz') ? {
 label: 'Savatdagi summa: töğri yondaşuv', cost: '1 joy özgaradi',
 alt: 'PriceCalculator narxni hisoblaydi, DiscountApplier çegirmani qöllaydi, OrderRepository esa buyurtmani saqlaydi. Savat sahifasi dastlabki ikki amalni çaqiradi. Buyurtmani saqlaş alohida qoladi.',
 who: 'özgarişni kim söraydi', actors: [['buyurtmani', 'rasmiylaştiriş jarayoni'], ['moliya bölimi'], ['marketing'], ['platforma jamoasi']], cart: 'savat sahifasi',
 added: ['yangi: ikkita çaqiruv,', 'heç narsa saqlanmaydi'], kept: ['tahrirlanmaydi:', 'törttala klass'], lesson: 'endi har bir guruh faqat öz klassidan özgariş söraydi'
} : {
 label: 'Cart preview: the fix', cost: '1 place changes',
 alt: 'Each group asks its own class for changes: the checkout flow asks Order, finance asks PriceCalculator, marketing asks DiscountApplier and the platform team asks OrderRepository. Order uses the other three. The new cart page calls PriceCalculator.total and DiscountApplier.apply, so nothing is saved and no class is edited.',
 who: 'who asks for changes', actors: [['the checkout flow'], ['finance'], ['marketing'], ['the platform team']], cart: 'cart page',
 added: ['new: two calls,', 'nothing saved'], kept: ['not edited:', 'all four classes'], lesson: 'each group now asks only its own class for changes'
})
// The class column, top to bottom, and the y of the arrow each group sends into its class.
const rows = [56, 169, 248, 327]
</script>

<template>
 <Diagram :label="t.label" :cost="t.cost" :width="640" :height="408" :alt="t.alt">
  <DArrow v-for="y in rows" :key="y" :from="[182, y]" :to="[224, y]" />
  <DArrow :from="[301, 129]" :to="[301, 151]" kind="muted" />
  <DArrow :from="[376, 100]" :via="[[620, 100], [620, 327]]" :to="[378, 327]" kind="muted" />
  <DArrow :from="[620, 276]" :to="[378, 276]" kind="muted" />
  <DArrow :from="[414, 169]" :to="[378, 169]" kind="accent" />
  <DArrow :from="[440, 217]" :via="[[440, 248]]" :to="[378, 248]" kind="accent" />
  <text class="dg-label end" x="176" y="24">{{ t.who }}</text>
  <template v-for="(actor, i) in t.actors" :key="i">
   <text v-for="(line, j) in actor" :key="line" class="dg-value is-small end" x="176" :y="rows[i] + 16 * j - 8 * (actor.length - 1)">{{ line }}</text>
  </template>
  <DClass :x="226" :y="40" name="Order" :members="['items', 'total_price', 'finalize()']" state="muted" />
  <DClass :x="226" :y="153" name="PriceCalculator" :members="['total()']" />
  <DClass :x="226" :y="232" name="DiscountApplier" :members="['apply()']" />
  <DClass :x="226" :y="311" name="OrderRepository" :members="['save()']" state="muted" />
  <DClass :x="414" :y="145" :w="186" :name="t.cart" :members="['PriceCalculator.total()', 'DiscountApplier.apply()']" state="new" />
  <DStep :x="429" :y="122" :n="1" /><text class="dg-note is-accent start" x="444" y="118">{{ t.added[0] }}</text><text class="dg-note is-accent start" x="444" y="134">{{ t.added[1] }}</text>
  <text class="dg-note start" x="414" y="52">{{ t.kept[0] }}</text><text class="dg-note start" x="414" y="68">{{ t.kept[1] }}</text>
  <text class="dg-note" x="320" y="396">{{ t.lesson }}</text>
 </Diagram>
</template>
