import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'

import App from './App.vue'
import router from './router'
import 'primeicons/primeicons.css'

const app = createApp(App)
const pinia = createPinia() // Crear UNA sola instancia

app.use(pinia) // Usar ESA instancia
app.use(router)

app.mount('#app')
