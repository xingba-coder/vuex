import { createApp } from 'vue'
import App from './App.vue'
import store from './store'

createApp(App).use(store).mount('#app')


/* 
    createApp(App).use(store)
    在根组件上绑定了 store，子组件要用到 store
    根组件需要 provide 出去，子组件 inject 接收
*/