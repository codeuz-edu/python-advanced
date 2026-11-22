<script setup>
// Interface Segregation lesson, the violation: charge() for drones goes into the one fat Worker,
// so Human and Robot have to be edited and the new Drone still stubs eat() and sleep().
import { computed } from 'vue'
import { useData } from 'vitepress'
import Diagram from './Diagram.vue'
import DClass from './DClass.vue'
import DArrow from './DArrow.vue'
import DStep from './DStep.vue'
const { lang } = useData()
const t = computed(() => lang.value?.startsWith('uz') ? {
 label: 'Drone qöşiş: notöğri yondaşuv', cost: '4 joy özgaradi',
 alt: 'Worker da work, eat, sleep va charge metodlari bor. charge qöşilganda Human va Robot ham bu metodga ega bölişi kerak. Drone esa bajara olmaydigan eat va sleep metodlarini yozişga majbur.',
 charge: 'charge() # yangi', raises: ' # xato beradi', stub: ' # stub', robot: [228, 184],
 added: 'yangi klass', edit: ['tahrirlaş kerak:', 'dronlar uçun charge() qöşiladi'], forced: ['tahrirlaş kerak:', 'charge() qöşiş'],
 lesson: 'Human va Robot faqat dronlarga kerak bölgan metod uçun tahrirlanadi'
} : {
 label: 'Add Drone: the violation', cost: '4 places change',
 alt: 'Worker is one fat abstract class with work, eat, sleep, and now charge for the drones. Human and Robot inherit from it, and Robot\'s eat and sleep only raise errors. Adding charge to Worker forces edits of Human and Robot, which never charge, and the new Drone class still has to stub eat and sleep.',
 charge: 'charge() # new', raises: ' # raises', stub: ' # stub', robot: [245, 150],
 added: 'new class', edit: ['must be edited:', 'charge() added for drones'], forced: ['must be edited:', 'add charge()'],
 lesson: 'Human and Robot are edited for a method only drones use'
})
</script>

<template>
 <Diagram :label="t.label" :cost="t.cost" :width="640" :height="376" :alt="t.alt">
  <DArrow :from="[95, 186]" :via="[[95, 164]]" :to="[320, 164]" :head="false" />
  <DArrow :from="[320, 186]" :to="[320, 142]" />
  <DArrow :from="[540, 186]" :via="[[540, 164]]" :to="[320, 164]" kind="accent" :head="false" />
  <DClass :x="245" :y="22" name="Worker" tag="abstract" :members="['work()', 'eat()', 'sleep()', t.charge]" state="done" />
  <DClass :x="30" :y="188" :w="130" name="Human" :members="['work()', 'eat()', 'sleep()', 'charge()']" state="done" />
  <DClass :x="t.robot[0]" :y="188" :w="t.robot[1]" name="Robot" :members="['work()', 'eat()' + t.raises, 'sleep()' + t.raises, 'charge()']" state="done" />
  <DClass :x="470" :y="188" :w="140" name="Drone" :members="['work()', 'charge()', 'eat()' + t.stub, 'sleep()' + t.stub]" state="new" />
  <DStep :x="409" :y="50" :n="2" /><text class="dg-note is-accent start" x="425" y="46">{{ t.edit[0] }}</text><text class="dg-note is-accent start" x="425" y="62">{{ t.edit[1] }}</text>
  <DStep :x="39" :y="316" :n="3" /><text class="dg-note is-accent start" x="55" y="312">{{ t.forced[0] }}</text><text class="dg-note is-accent start" x="55" y="328">{{ t.forced[1] }}</text>
  <DStep :x="t.robot[0] + 9" :y="316" :n="4" /><text class="dg-note is-accent start" :x="t.robot[0] + 25" y="312">{{ t.forced[0] }}</text><text class="dg-note is-accent start" :x="t.robot[0] + 25" y="328">{{ t.forced[1] }}</text>
  <DStep :x="479" :y="316" :n="1" /><text class="dg-note is-accent start" x="495" y="320">{{ t.added }}</text>
  <text class="dg-note" x="320" y="362">{{ t.lesson }}</text>
 </Diagram>
</template>
