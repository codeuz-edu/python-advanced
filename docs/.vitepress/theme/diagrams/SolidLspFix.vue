<script setup>
// Liskov Substitution lesson, the fix: Square is one new Shape. Every class print_area can receive
// keeps area(), and Square can no longer reach resize_rectangle.
import { computed } from 'vue'
import { useData } from 'vitepress'
import Diagram from './Diagram.vue'
import DClass from './DClass.vue'
import DArrow from './DArrow.vue'
import DStep from './DStep.vue'
const { lang } = useData()
const t = computed(() => lang.value?.startsWith('uz') ? {
 label: 'Square qöşiş: töğri yondaşuv', cost: '1 joy özgaradi',
 alt: 'Rectangle va Square umumiy area metodini taklif qiladi. print_area ikkala şaklni qabul qiladi. resize_rectangle esa tomonlari alohida özgaradigan Rectangle ni kutadi.',
 uses: 'foydalanadi', inherits: 'meros oladi', added: 'yangi klass', kept: ['tahrirlanmaydi:', 'Shape, Rectangle, resize_rectangle'],
 rejected: 'Square endi Rectangle emas: mypy uni rad etadi', lesson: 'çaqiruvçi oladigan har bir klass u tayangan vaʼdani bajaradi'
} : {
 label: 'Add Square: the fix', cost: '1 place changes',
 alt: 'Shape is an abstract class with one method, area. Rectangle and Square both inherit from it, and print_area works with any Shape because both keep that promise. resize_rectangle still takes only a Rectangle; Square is no longer one, so mypy rejects passing it. Adding Square is one new class, and nothing that already exists is edited.',
 uses: 'uses', inherits: 'inherits', added: 'new class', kept: ['not edited:', 'Shape, Rectangle, resize_rectangle'],
 rejected: 'Square is no longer a Rectangle: mypy rejects it', lesson: 'every class a caller can receive keeps the promise it relies on'
})
</script>

<template>
 <Diagram :label="t.label" :cost="t.cost" :width="640" :height="342" :alt="t.alt">
  <DArrow :from="[170, 50]" :to="[258, 50]" /><text class="dg-note" x="214" y="42">{{ t.uses }}</text>
  <DArrow :from="[176, 184]" :to="[258, 184]" /><text class="dg-note" x="217" y="176">{{ t.uses }}</text>
  <DArrow :from="[335, 166]" :to="[335, 91]" /><text class="dg-note end" x="327" y="116">{{ t.inherits }}</text>
  <DArrow :from="[545, 166]" :via="[[545, 130]]" :to="[335, 130]" kind="accent" :head="false" />
  <DArrow :from="[545, 242]" :via="[[545, 280]]" :to="[98, 280]" kind="removed" />
  <DArrow :from="[98, 280]" :to="[98, 225]" kind="removed" />
  <DClass :x="20" :y="26" name="print_area" :members="['shape.area()']" />
  <DClass :x="260" :y="22" name="Shape" tag="abstract" :members="['area()']" />
  <DClass :x="20" :y="168" :w="156" name="resize_rectangle" :members="['rect: Rectangle']" state="muted" />
  <DClass :x="260" :y="168" name="Rectangle" :members="['width', 'height', 'area()']" />
  <DClass :x="470" :y="168" name="Square" :members="['side', 'area()']" state="new" />
  <DStep :x="545" :y="148" :n="1" /><text class="dg-note is-accent start" x="560" y="152">{{ t.added }}</text>
  <text class="dg-note start" x="430" y="46">{{ t.kept[0] }}</text><text class="dg-note start" x="430" y="62">{{ t.kept[1] }}</text>
  <text class="dg-note" x="320" y="298">{{ t.rejected }}</text>
  <text class="dg-note" x="320" y="330">{{ t.lesson }}</text>
 </Diagram>
</template>
