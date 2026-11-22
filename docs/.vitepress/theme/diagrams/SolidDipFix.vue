<script setup>
// Dependency Inversion lesson, the fix: Payment sits with the rules, every detail points up at it,
// and accepting cash is one new class.
import { computed } from 'vue'
import { useData } from 'vitepress'
import Diagram from './Diagram.vue'
import DClass from './DClass.vue'
import DArrow from './DArrow.vue'
import DStep from './DStep.vue'
const { lang } = useData()
const t = computed(() => lang.value?.startsWith('uz') ? {
 label: 'Naqd pul qabul qiliş: töğri yondaşuv', cost: '1 joy özgaradi',
 alt: 'PaymentProcessor Payment interfeysiga tayanadi. Karta, naqd pul va kriptovalyuta klasslari şu interfeysga mos. Kerakli tölov obyektini çaqiruvçi uzatadi.',
 high: 'yuqori daraja', low: 'quyi daraja', uses: 'foydalanadi', implements: 'amalga oşiradi',
 added: 'yangi klass', kept: ['tahrirlanmaydi:', 'PaymentProcessor, Payment, CreditCardPayment, CryptoPayment'],
 lesson: 'endi tafsilotlar yuqoriga, qoidalarga tegişli Payment ga qaragan'
} : {
 label: 'Accept cash: the fix', cost: '1 place changes',
 alt: 'PaymentProcessor and the abstract Payment class both sit above the line with the high-level rules. PaymentProcessor uses Payment, and CashPayment, CreditCardPayment and CryptoPayment implement it, so the arrow that crosses the line now points up from the details to the abstraction. Accepting cash is the one new CashPayment class, and nothing that exists is edited.',
 high: 'high level', low: 'low level', uses: 'uses', implements: 'implements',
 added: 'new class', kept: ['not edited:', 'PaymentProcessor, Payment, CreditCardPayment, CryptoPayment'],
 lesson: 'the details now point up at Payment, which belongs to the rules'
})
</script>

<template>
 <Diagram :label="t.label" :cost="t.cost" :width="640" :height="330" :alt="t.alt">
  <line class="dg-grid" x1="20" y1="146" x2="620" y2="146" />
  <text class="dg-label start" x="20" y="138">{{ t.high }}</text>
  <text class="dg-label start" x="20" y="162">{{ t.low }}</text>
  <DArrow :from="[290, 50]" :to="[368, 50]" /><text class="dg-note" x="330" y="42">{{ t.uses }}</text>
  <DArrow :from="[270, 184]" :via="[[270, 166]]" :to="[445, 166]" kind="accent" :head="false" />
  <DArrow :from="[535, 184]" :via="[[535, 166]]" :to="[445, 166]" kind="accent" :head="false" />
  <DArrow :from="[150, 184]" :via="[[150, 166], [445, 166]]" :to="[445, 91]" kind="accent" />
  <text class="dg-note end" x="437" y="128">{{ t.implements }}</text>
  <DClass :x="110" :y="22" :w="180" name="PaymentProcessor" :members="['payment: Payment', 'process(amount)']" />
  <DClass :x="370" :y="22" name="Payment" tag="abstract" :members="['pay(amount)']" />
  <DClass :x="30" :y="186" name="CashPayment" :members="['pay(amount)']" state="new" />
  <DClass :x="225" :y="186" :w="190" name="CreditCardPayment" :members="['pay(amount)']" />
  <DClass :x="460" :y="186" name="CryptoPayment" :members="['pay(amount)']" />
  <DStep :x="39" :y="263" :n="1" /><text class="dg-note is-accent start" x="55" y="267">{{ t.added }}</text>
  <text class="dg-note start" x="225" y="263">{{ t.kept[0] }}</text><text class="dg-note start" x="225" y="279">{{ t.kept[1] }}</text>
  <text class="dg-note" x="320" y="316">{{ t.lesson }}</text>
 </Diagram>
</template>
