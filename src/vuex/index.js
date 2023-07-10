import { inject, reactive } from "vue"

const storeKey = 'store'

const forEachValue = function (obj, fn) {
    return Object.keys(obj).forEach((key) => {
        fn(obj[key], key)
    })
}

class Module{
    constructor(modules){
        this._raw = modules
        this.state = modules.state
        this.children = {}
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
    }
}

function installModules(store,modules,path){
    if(path.length===0){
        store.state = modules.state
    }else{
        const parent = path.slice(0,-1).reduce((result,current) =>{
            return result[current]
        },store.state)
        
        parent[path[path.length-1]] = modules.state
    }
    if(modules.children){
        Object.keys(modules.children).forEach((key) =>{
            installModules(store,modules.children[key],path.concat(key))
        })
    }
}

class Store {
    constructor(options) {
        const store = this

        
        // 收集模块，将用户写的嵌套modules格式化，创造父子关系
        store._modules = new moduleCollection(options)
        console.log(store._modules)
        
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
        installModules(store,store._modules.root,[])
        console.log(store.state)
        
        store._store = reactive({data:store.state})
        store.state = store._store.data

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