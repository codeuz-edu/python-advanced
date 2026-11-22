<script setup>
// Dependency Inversion lesson, the violation: the rules point down at the details, so accepting
// cash adds CashPayment and also forces an edit of PaymentProcessor.
import { computed } from 'vue'
import { useData } from 'vitepress'
import Diagram from './Diagram.vue'
import DClass from './DClass.vue'
import DArrow from './DArrow.vue'
import DStep from './DStep.vue'
const { lang } = useData()
const t = computed(() => lang.value?.startsWith('uz') ? {
 label: 'Naqd pul qabul qiliş: notöğri yondaşuv', cost: '2 joy özgaradi',
 alt: 'PaymentProcessor karta uçun CreditCardPayment, naqd pul uçun CashPayment yaratadi. Tölov usulini tanlaydigan şart protsessor ichida, boğliqliklar undan ikki klassga qarab ketgan.',
 high: 'yuqori daraja', low: 'quyi daraja', creates: 'yaratadi',
 added: 'yangi klass', edit: ['tahrirlaş kerak:', 'klassni if zanjiri tanlaydi'],
 lesson: 'qoidalar tafsilotlarga qaragan: har bir yangi tölov usuli PaymentProcessor ni tahrirlaydi'
} : {
 label: 'Accept cash: the violation', cost: '2 places change',
 alt: 'PaymentProcessor holds the rules and sits above the line as high-level code; CreditCardPayment is a low-level detail below it. The processor creates CreditCardPayment itself, so the arrow points down at the detail. Accepting cash adds a CashPayment class and forces an edit of PaymentProcessor, which now picks the class with an if chain and points down at both details.',
 high: 'high level', low: 'low level', creates: 'creates',
 added: 'new class', edit: ['must be edited:', 'an if chain picks the class'],
 lesson: 'the rules point down at the details: each new payment method edits PaymentProcessor'
})
</script>

<template>
 <Diagram :label="t.label" :cost="t.cost" :width="640" :height="314" :alt="t.alt">
  <line class="dg-grid" x1="20" y1="146" x2="620" y2="146" />
  <text class="dg-label start" x="20" y="138">{{ t.high }}</text>
  <text class="dg-label start" x="20" y="162">{{ t.low }}</text>
  <DArrow :from="[270, 112]" :to="[270, 184]" /><text class="dg-note start" x="278" y="134">{{ t.creates }}</text>
  <DArrow :from="[150, 112]" :to="[150, 184]" kind="accent" /><text class="dg-note start" x="158" y="134">{{ t.creates }}</text>
  <DClass :x="110" :y="22" :w="180" name="PaymentProcessor" :members="['payment', '__init__(method)', 'process(amount)']" state="done" />
  <DClass :x="30" :y="186" name="CashPayment" :members="['pay(amount)']" state="new" />
  <DClass :x="225" :y="186" :w="190" name="CreditCardPayment" :members="['pay(amount)']" />
  <DStep :x="39" :y="263" :n="1" /><text class="dg-note is-accent start" x="55" y="267">{{ t.added }}</text>
  <DStep :x="304" :y="50" :n="2" /><text class="dg-note is-accent start" x="320" y="46">{{ t.edit[0] }}</text><text class="dg-note is-accent start" x="320" y="62">{{ t.edit[1] }}</text>
  <text class="dg-note" x="320" y="300">{{ t.lesson }}</text>
 </Diagram>
</template>
