import { h, watch } from 'vue'
import { inBrowser, useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Playground from './Playground.vue'
import Difficulty from './Difficulty.vue'
import Mark from './Mark.vue'
import Quiz from './Quiz.vue'
import CodeEnhancer from './CodeEnhancer.vue'
import CourseHome from './CourseHome.vue'
import FlowDiagram from './FlowDiagram.vue'
import './style.css'

// Every file in theme/diagrams is a component named after its file, so a lesson can write
// <AdvDecoratorStack /> without importing anything.
const diagrams = import.meta.glob('./diagrams/*.vue', { eager: true })

export default {
 extends: DefaultTheme,
 // CodeEnhancer adds Run buttons to code blocks and Check editors to exercises.
 Layout: () => h(DefaultTheme.Layout, null, { 'doc-after': () => h(CodeEnhancer) }),
 // Remember the last lesson opened and every lesson opened so far, so the landing page can
 // offer to continue and show progress. This stays in the learner's browser.
 setup() {
  const route = useRoute()
  if (!inBrowser) return
  watch(() => route.path, path => {
   const lesson = path.match(/\/(?:en|uz)\/lessons\/([a-z0-9-]+)/)
   if (!lesson) return
   try {
    localStorage.setItem('python-advanced:last-lesson', lesson[1])
    const opened = new Set(JSON.parse(localStorage.getItem('python-advanced:opened') || '[]'))
    localStorage.setItem('python-advanced:opened', JSON.stringify([...opened.add(lesson[1])]))
   } catch { /* storage is blocked */ }
  }, { immediate: true })
 },
 enhanceApp({ app }) {
  app.component('PythonPlayground', Playground)
  app.component('Difficulty', Difficulty)
  app.component('Quiz', Quiz)
  app.component('CourseHome', CourseHome)
  app.component('FlowDiagram', FlowDiagram)
  for (const [path, module] of Object.entries(diagrams)) app.component(path.match(/([^/]+)\.vue$/)[1], module.default)
  app.component('Yes', { render: () => h(Mark, { ok: true }) })
  app.component('No', { render: () => h(Mark, { ok: false }) })
 }
}
