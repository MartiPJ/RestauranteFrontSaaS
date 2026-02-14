import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'

import App from './App.vue'
import router from './router'
import 'primeicons/primeicons.css'

const app = createApp(App)
const pinia = createPinia()

app.use(createPinia())
app.use(router)
app.use(pinia)

app.mount('#app')
