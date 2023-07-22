import { createStore } from '@/vuex'

export default createStore({
  strict: true,
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
      modules: {
        cCount: {
          namespaced:true,
          state: {
            count: 1
          },
          mutations: {
            mutationsAdd(state, preload) {
              state.count += preload
            }
          },
        },
      }
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
    }
  }
})
