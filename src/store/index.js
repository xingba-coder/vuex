import { createStore } from '@/vuex'

const customPlugin = (store) =>{
  const local = sessionStorage.getItem('vuexState')
  if(local){
    store.replaceState(JSON.parse(local))
  }
  store.subscribe((mutation,state) =>{
    // console.log(mutation,state)
    sessionStorage.setItem('vuexState',JSON.stringify(state))
  })
}

const store = createStore({
  strict: true,
  plugins:[customPlugin],
  state: {
    count: 1
  },
  getters: {
    double(state) {
      return state.count * 2
    }
  },
  mutations: {
    mutationsAdd(state, preload) {
      state.count += preload
    }
  },
  actions: {
    actionAdd({ commit }, preload) {
      return new Promise((resolve,reject) =>{
        setTimeout(() => {
          commit('mutationsAdd', preload)
          resolve()
        }, 1000);
      })
    }
  },
  modules: {
    aCount: {
      namespaced:true,
      state: {
        count: 1
      },
      mutations: {
        mutationsAdd(state, preload) {
          state.count += preload
        }
      },
      actions: {
        actionAdd({ commit }, preload) {
          return new Promise((resolve,reject) =>{
            setTimeout(() => {
              commit('aCount/mutationsAdd', preload)
              resolve()
            }, 1000);
          })
        }
      },
      // modules: {
      //   cCount: {
      //     namespaced:true,
      //     state: {
      //       count: 100
      //     },
      //     mutations: {
      //       mutationsAdd(state, preload) {
      //         state.count += preload
      //       }
      //     },
      //     actions: {
      //       actionAdd({ commit }, preload) {
      //         return new Promise((resolve,reject) =>{
      //           setTimeout(() => {
      //             commit('aCount/cCount/mutationsAdd', preload)
      //             resolve()
      //           }, 1000);
      //         })
      //       }
      //     },
      //   },
      // }
    },
    bCount: {
      namespaced:true,
      state: {
        count: 1
      },
      mutations: {
        mutationsAdd(state, preload) {
          state.count += preload
        }
      },
      actions: {
        actionAdd({ commit }, preload) {
          return new Promise((resolve,reject) =>{
            setTimeout(() => {
              commit('bCount/mutationsAdd', preload)
              resolve()
            }, 1000);
          })
        }
      },
    }
  }
})

store.registerModules(['aCount','cCount'],{
  namespaced:true,
  state: {
    count: 100
  },
  mutations: {
    mutationsAdd(state, preload) {
      state.count += preload
    }
  },
  actions: {
    actionAdd({ commit }, preload) {
      return new Promise((resolve,reject) =>{
        setTimeout(() => {
          commit('aCount/cCount/mutationsAdd', preload)
          resolve()
        }, 1000);
      })
    }
  },
})

export default store