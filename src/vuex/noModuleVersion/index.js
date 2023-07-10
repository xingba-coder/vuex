import { inject,reactive } from "vue"

const storeKey = 'store'

const forEachValue = function(obj,fn){
    return Object.keys(obj).forEach((key) =>{
        fn(obj[key],key)
    })
}

class Store{
    constructor(options){
        // 这里创建一个 store 变量保存 this 是方便之后嵌套函数里面访问当前 this
        let store = this
        // 这里给options.state加了一层，用 data 包裹是为了重新赋值的时候
        // 可以直接 this._store.data = 。。。 ，而不用再使用 reactive
        this._store = reactive({data:options.state})
        this.state = this._store.data

        this.getters = {}
        forEachValue(options.getters,(fn,key) => {
            // 当模板解析 $store.getters.double 时，
            // 去执行 options.getters里面对应属性的函数,并将函数结果赋予该属性
            Object.defineProperty(this.getters,key,{
                // vue3.2之前的vuex中不能使用计算属性 computed，导致每次访问的时候都会执行函数引发潜在性能问题
                // vue3.2修复了这个bug
                get:() => {
                    return fn(this.state)
                }
            })
        })

        this._mutations = options.mutations
        this.commit = function(name,preload){
            if(store._mutations[name]!==undefined){
                store._mutations[name](store.state,preload)
            }
        }

        this._actions = options.actions
        this.dispatch = function(name,preload){
            if(store._actions[name]!==undefined){
                store._actions[name].apply(store,[store].concat(preload))
            }
        }
    }
    // commit(type,preload){
    //     this._mutations[type](preload)
    // }
    // dispatch(type,preload){
    //     this._actions[type](preload)
    // }
    // createApp(App).use(store,name)会调用store的install方法
    install(app,name){
        // app 是vue3暴露的对象
        app.provide(name || storeKey,this)
        app.config.globalProperties.$store = this
    }
}

// 创建 store
export function createStore(options){
    return new Store(options)
}

// 使用 store
export function useStore(name){
    // inject 去找父组件的 provide 的东西
    return inject(name!==undefined?name:storeKey)
}