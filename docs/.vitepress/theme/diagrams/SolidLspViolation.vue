<script setup>
// Liskov Substitution lesson, the violation: Square passes as a Rectangle, so resize_rectangle,
// which used to work, gets 100 where it expects 50 and would need an isinstance patch.
import { computed } from 'vue'
import { useData } from 'vitepress'
import Diagram from './Diagram.vue'
import DClass from './DClass.vue'
import DArrow from './DArrow.vue'
import DStep from './DStep.vue'
import DBox from './DBox.vue'
const { lang } = useData()
const t = computed(() => lang.value?.startsWith('uz') ? {
 label: 'Square qöşiş: notöğri yondaşuv', cost: '2 joy özgaradi',
 alt: 'resize_rectangle kenglikni 5, balandlikni 10 qiladi va yuza 50 bölişini kutadi. Square da balandlik özgarsa, kenglik ham özgaradi. Natijada yuza 100 böladi.',
 uses: 'foydalanadi', inherits: 'meros oladi', expects: 'kutadi', gives: 'Square beradi', side: ['set_height(10)', 'widthʼni ham özgartiradi'],
 added: 'yangi subklass', edit: ['tahrirlaş kerak:', 'isinstance(rect, Square) qöşiş'], lesson: 'Square Rectangle vaʼdasini buzadi: avval işlagan çaqiruvçi endi xato beradi'
} : {
 label: 'Add Square: the violation', cost: '2 places change',
 alt: 'resize_rectangle takes a Rectangle, sets the width to 5 and the height to 10, and asserts that the area is 50. The new Square inherits from Rectangle and overrides both setters, so set_height(10) also sets the width and the area comes back as 100. To pass, resize_rectangle itself would have to be edited with an isinstance(rect, Square) check.',
 uses: 'uses', inherits: 'inherits', expects: 'expects', gives: 'Square gives', side: ['set_height(10)', 'also sets the width'],
 added: 'new subclass', edit: ['must be edited:', 'add isinstance(rect, Square)'], lesson: 'Square breaks a promise of Rectangle, so a caller that worked now fails'
})
</script>

<template>
 <Diagram :label="t.label" :cost="t.cost" :width="640" :height="274" :alt="t.alt">
  <DArrow :from="[210, 38]" :to="[438, 38]" /><text class="dg-note" x="324" y="30">{{ t.uses }}</text>
  <DArrow :from="[520, 160]" :to="[520, 113]" kind="accent" /><text class="dg-note end" x="510" y="141">{{ t.inherits }}</text>
  <DClass :x="24" :y="22" :w="186" name="resize_rectangle" :members="['rect.set_width(5)', 'rect.set_height(10)', 'assert area() == 50']" state="done" />
  <DClass :x="440" :y="22" :w="160" name="Rectangle" :members="['set_width()', 'set_height()', 'area()']" />
  <DClass :x="440" :y="162" :w="160" name="Square" :members="['set_width()', 'set_height()']" state="new" />
  <text class="dg-note end" x="104" y="153">{{ t.expects }}</text>
  <DBox :x="112" :y="134" :w="98" :h="30" text="5 × 10 = 50" state="ghost" small />
  <text class="dg-note end" x="104" y="193">{{ t.gives }}</text>
  <DBox :x="112" :y="174" :w="98" :h="30" text="10 × 10 = 100" small />
  <text class="dg-note end" x="426" y="192">{{ t.side[0] }}</text><text class="dg-note end" x="426" y="208">{{ t.side[1] }}</text>
  <DStep :x="520" :y="137" :n="1" /><text class="dg-note is-accent start" x="535" y="141">{{ t.added }}</text>
  <DStep :x="224" :y="70" :n="2" /><text class="dg-note is-accent start" x="240" y="66">{{ t.edit[0] }}</text><text class="dg-note is-accent start" x="240" y="82">{{ t.edit[1] }}</text>
  <text class="dg-note" x="320" y="262">{{ t.lesson }}</text>
 </Diagram>
</template>
