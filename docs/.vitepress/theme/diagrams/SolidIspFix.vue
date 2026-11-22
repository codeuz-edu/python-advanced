<script setup>
// Interface Segregation lesson, the fix: drones add one small interface and one class, and nothing
// that exists is edited; the client assign_task still calls only Workable.
import { computed } from 'vue'
import { useData } from 'vitepress'
import Diagram from './Diagram.vue'
import DClass from './DClass.vue'
import DArrow from './DArrow.vue'
import DStep from './DStep.vue'
const { lang } = useData()
const t = computed(() => lang.value?.startsWith('uz') ? {
 label: 'Drone qöşiş: töğri yondaşuv', cost: '2 joy özgaradi',
 alt: 'Human işlaş, ovqatlaniş va uxlaş interfeyslarini qöllaydi. Robot faqat Workable ni qöllaydi. Drone Workable va Chargeable dan meros oladi. assign_task uçun Workable yetarli.',
 client: 'klient', calls: 'çaqiradi', interface: 'yangi interfeys', added: 'yangi klass',
 kept: ['tahrirlanmaydi:', 'Workable, Eatable, Sleepable,', 'Human, Robot, assign_task'],
 lesson: 'dronlar bitta kiçik interfeys va bitta klass qöşadi; mavjud kod tahrirlanmaydi'
} : {
 label: 'Add Drone: the fix', cost: '2 places change',
 alt: 'Workable, Eatable and Sleepable are three small abstract classes. Human inherits all three and Robot only Workable, and assign_task, the client, calls only Workable. For the drones, a new Chargeable interface and a new Drone class that inherits Workable and Chargeable are added, and nothing that already exists is edited.',
 client: 'client', calls: 'calls', interface: 'new interface', added: 'new class',
 kept: ['not edited:', 'Workable, Eatable, Sleepable,', 'Human, Robot, assign_task'],
 lesson: 'drones add one small interface and one class; nothing that exists is edited'
})
</script>

<template>
 <Diagram :label="t.label" :cost="t.cost" :width="640" :height="406" :alt="t.alt">
  <DArrow :from="[370, 90]" :to="[370, 124]" /><text class="dg-note start" x="378" y="111">{{ t.calls }}</text>
  <DArrow :from="[160, 258]" :via="[[160, 227], [75, 227]]" :to="[75, 195]" />
  <DArrow :from="[210, 258]" :to="[210, 195]" />
  <DArrow :from="[260, 258]" :via="[[260, 227], [340, 227]]" :to="[340, 195]" />
  <DArrow :from="[370, 258]" :to="[370, 195]" />
  <DArrow :from="[500, 258]" :via="[[500, 227], [400, 227]]" :to="[400, 195]" kind="accent" />
  <DArrow :from="[580, 258]" :to="[580, 195]" kind="accent" />
  <DClass :x="300" :y="22" :w="140" name="assign_task" :tag="t.client" :members="['worker.work()']" state="muted" />
  <DClass :x="20" :y="126" :w="110" name="Eatable" tag="abstract" :members="['eat()']" />
  <DClass :x="150" :y="126" :w="120" name="Sleepable" tag="abstract" :members="['sleep()']" />
  <DClass :x="310" :y="126" :w="120" name="Workable" tag="abstract" :members="['work()']" />
  <DClass :x="480" :y="126" :w="140" name="Chargeable" tag="abstract" :members="['charge()']" state="new" />
  <DClass :x="145" :y="260" :w="130" name="Human" :members="['work()', 'eat()', 'sleep()']" />
  <DClass :x="320" :y="260" :w="100" name="Robot" :members="['work()']" />
  <DClass :x="470" :y="260" :w="150" name="Drone" :members="['work()', 'charge()']" state="new" />
  <DStep :x="489" :y="106" :n="1" /><text class="dg-note is-accent start" x="505" y="110">{{ t.interface }}</text>
  <DStep :x="479" :y="354" :n="2" /><text class="dg-note is-accent start" x="495" y="358">{{ t.added }}</text>
  <text class="dg-note start" x="20" y="46">{{ t.kept[0] }}</text><text class="dg-note start" x="20" y="62">{{ t.kept[1] }}</text><text class="dg-note start" x="20" y="78">{{ t.kept[2] }}</text>
  <text class="dg-note" x="320" y="392">{{ t.lesson }}</text>
 </Diagram>
</template>
