import { inject, reactive, watch } from "vue"

const storeKey = 'store'

const forEachValue = function (obj, fn) {
    return Object.keys(obj).forEach((key) => {
        fn(obj[key], key)
    })
}

const isPromise = function(value){
    return Object.prototype.toString.call(value)==='[object Promise]'
}

class Module{
    constructor(modules){
        this._raw = modules
        this.state = modules.state
        this.children = {}
        this.namespaced = modules.namespaced
    }
    getChild(key){
        return this.children[key]
    }
    addChild(key,module){
        this.children[key] = module
    }
}

class moduleCollection{
    constructor(rootModule){
        // root 存储格式化的数据，方便后续安装到 store.state 上
        this.root = null
        this.register(rootModule,[])
    }
    register(rootModule,path){
        // 注册模块，每个模块的格式都是
        // _raw: rootModule,
        // state: rootModule.state,
        // children: {}
        // 所以给传进来的模块都格式化一下
        const newModule = new Module(rootModule)
        // 1.注册根模块
        if(path.length===0){
            this.root = newModule
        }else{
            // 注册子模块，将子模块添加到对应的父模块，通过 path路径可以知道对应的父模块
            // 第一次执行 register时，path 是 [],则代表根模块
            // 再次执行，path 是 [a] ,则代表根模块下添加子模块 a ； 根=>a
            // 再往下，path 是 [a,c]，则代表根模块下的 a 模块添加子模块 c ；根=>a=>c
            // 所以这里先找到子模块对应的父模块，在父模块的 children 下添加子模块
            // [a]的父模块是 根，[a,c]的父模块是 a，所以用 path.slice(0,-1)剔除path最后一个元素，得到的就是父模块的path
            const parent = path.slice(0,-1).reduce((modules,current) =>{
                // 参数 module 代表上一次执行结果，current代表当前元素，初始传入根模块
                // 这里如果 path 是 [a], 传入给 reduce 时是 [] ,那么返回的就是 this.root
                // path 是[a,c],传入给reduce 时是 [a], 当执行下面的 module.getChild(current) 实际上就是 this.root.getChild(a)
                return modules.getChild(current)
            },this.root)
            
            // 找到父模块后，给父模块的 children 添加 modules
            parent.addChild(path[path.length-1],newModule)
        }
        // 2. 如果根模块下还有子模块，则继续递归注册
        if(rootModule.modules){
            Object.keys(rootModule.modules).forEach((key) =>{
                this.register(rootModule.modules[key],path.concat(key))
            })
        }
        return newModule
    }
}

function getCurrentState(state,path){
    return path.reduce((result,current) =>{
        return result[current]
    },state)
}

function getNameSpace(modules,path){
    let root = modules.root
    // 传入的是 根模块
    // 当 path 是[],返回空字符串
    // 2、当 path 是 [aCount] ,根据path，取得根模块下的对应的 aCount , modules.getChild(aCount)
    // 然后判断 aCount 模块下是否定义namespaced，有则返回 aCount/
    // 当 path 是 [aCount,cCount] ,重复2，然后根据步骤2 取得的子模块，再往下找子模块cCount，
    // 然后判断 cCount 模块下是否定义namespaced，有则返回 aCount/cCount/
    // [] => ''  [aCount] => 'aCount/'  [aCount,cCount] => 'aCount/cCount'
    return path.reduce((module,current) =>{
        root = root.children[current]
        return root.namespaced?(module+current+'/'):''  
    },'')
}

function installModules(store,modules,path,rootState){
    const isRoot = !path.length;
    // if(path.length===0){
    //     store.state = modules.state
    // }else{
    // }
    if(!isRoot){
        const parent = path.slice(0,-1).reduce((result,current) =>{
            return result[current]
        },rootState)
        // root.root.state 从根开始找起
        store.withCommit(() =>{
            parent[path[path.length-1]] = modules.state
        })
    }

    // 命名空间
    // 调用方式 store.commit('aCount/cCount/mutationsAdd',1)
    // 所以这里先根据path取得设置了 namespaced 的模块名字，拼接后注册到 mutations，actions的名字上
    const namespace = getNameSpace(store._modules,path)
    console.log(namespace)
    
    if(modules._raw.getters){
        forEachValue(modules._raw.getters,(getters,key) =>{
            store._getters[key] = () =>{
                // 这里的参数不能是 modules._raw.state，没有响应式
                // store.state 是响应式的，需要根据 path 取得store.state里面对应的 state
                return getters(getCurrentState(store.state,path))
            }
        })
    }

    if(modules._raw.mutations){
        forEachValue(modules._raw.mutations,(mutations,key) =>{
            // 在模块里面，可能有多个同名的 mutations，所以这里可能有多个同名 key
            // 需要用数组包装起来
            if(!store._mutations[namespace + key]){
                store._mutations[namespace + key] = []
            }
            store._mutations[namespace + key].push((preload) =>{ // store.commit(key,preload)
                mutations.call(store,getCurrentState(store.state,path),preload)
            })
        })
    }

    if(modules._raw.actions){
        forEachValue(modules._raw.actions,(actions,key) =>{
            if(!store._actions[key]){
                store._actions[key] = []
            }
            store._actions[key].push((preload) =>{
                // store.dispatch({commit},preload)
                // actions执行后返回的是promise
                let res = actions.call(store,store,preload)
                if(!isPromise(res)){
                    return Promise.resolve(res)
                }
                return res
            })
        })
    }

    if(modules.children){
        Object.keys(modules.children).forEach((key) =>{
            installModules(store,modules.children[key],path.concat(key),rootState)
        })
    }
}

function resetStore(store,state){
    // 将收集到的 state 响应式注册
    store._store = reactive({data:state})
    // store.state = store._store.data
    
    // 将收集到的 _getters 响应式注册
    store.getters = Object.create(null)
    forEachValue(store._getters,(fn,key) => {
        Object.defineProperty(store.getters,key,{
            get:fn
        })
    })

    // 是否严格模式
    // 正确改变数据状态应该是通过 mutations，而不是直接 store.state.count++
    // 所以如果是严格模式，这里需要监听 store.state 的变化，并且定义一个状态 isCommiting 
    // 在调用 mutations 时改变这个状态
    if(store.strict){
        watch(() =>store._store.data,() =>{
            console.assert(store.isCommiting,'do not mutate vuex store state outside mutation handlers.')
        },{deep:true,flush:'sync'})
    }

}

class Store {
    constructor(options) {
        const store = this
        
        // 收集模块，将用户写的嵌套modules格式化，创造父子关系
        store._modules = new moduleCollection(options)
        // console.log(store._modules)
        
        // 得到格式化options后，将模块 state 安装在 store.state 上
        // 以便之后调用：$store.state.aCount.cCount.count
        // 格式化后的样子应该是
        // state:{
        //     count:1,
        //     aCount:{
        //         count:1,
        //         cCount:{
        //             count:1
        //         }
        //     },
        //     bCount:{
        //         count:1
        //     }
        // }
        // 安装模块，包括 getters,actions,mutations
        store._getters = Object.create(null)
        store._mutations = Object.create(null)
        store._actions = Object.create(null)
        installModules(store,store._modules.root,[],store._modules.root.state)
        // console.log(store.state)
        
        store.strict = options.strict
        store.isCommiting = false

        resetStore(store,store._modules.root.state)
        
        store._subscribe = []
        store.subscribe = (fn) =>{
            store._subscribe.push(fn)
        }

        const plugins = options.plugins
        plugins.forEach(fn => {
            fn(store)
        });

        store.commit = (type,preload) =>{
            this.withCommit(() =>{
                if(store._mutations[type]){
                    store._mutations[type].forEach((fn) =>{
                        fn(preload)
                    })
                    store._subscribe.forEach(fn => {
                        fn({type:type,preload:preload},store.state)
                    });
                }
            })
        }
        store.dispatch = (type,preload) =>{
            const arr = []
            // map 返回一个新数组
            return Promise.all(store._actions[type].map((fn) =>{
                fn(preload)
            }))
        }

        // 这一步需要放在最后
        // store.state = store._store.data
    }
    get state(){
        return this._store.data
    }
    // 动态注册模块
    // 动态注册的模块无法执行插件上的方法，比如插件定义了持久化，动态注册的模块不具备持久化
    registerModules(path,modules){
        const store = this
        // 把新增的模块格式化，安装在对应的父级元素上
        let newModule = store._modules.register(modules,path)

        // 格式化后的模块的 state 注册到 store.state 上
        installModules(store,newModule,path,store.state)
        // 重新给 state，getters 注册响应式
        // 将收集到的 state 响应式注册
        resetStore(store,store.state)
    }
    replaceState(newState){
        this.withCommit(() =>{
            this._store.data = newState
        })
    }
    withCommit(fn){
        this.isCommiting = true
        fn()
        this.isCommiting = false
    }
    install(app, name) {
        // app 是vue3暴露的对象
        app.provide(name || storeKey, this)
        app.config.globalProperties.$store = this
    }
}

// 创建 store
export function createStore(options) {
    return new Store(options)
}

// 使用 store
export function useStore(name) {
    // inject 去找父组件的 provide 的东西
    return inject(name !== undefined ? name : storeKey)
}


// 用户传进来的数据
// state: {
//     count: 1
// },
// modules:{
//     aCount:{
//         state: {
//             count: 1
//         },
//         modules:{
//             cCount:{
//                 state: {
//                     count: 1
//                 },
//             },
//         }
//     },
//     bCount:{
//         state: {
//             count: 1
//         },
//     }
// }
// store.state.aCount.count

// 构造后的数据对象
// const _root = {
//   _raw: rootModule,
//   state: rootModule.state,
//   children: {
//     aCount: {
//         _raw: aModule,
//         state: aModule.state,
//         children: {
//             cCount: {
//                 _raw: cModule,
//                 state: cModule.state,
//                 children: {}
//             },
//         }
//     },
//     bCount: {
//         _raw: bModule,
//         state: bModule.state,
//         children: {}
//     },
//   }
// }