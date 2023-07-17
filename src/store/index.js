import { createStore } from '@/vuex'

export default createStore({
  // strict: true,
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
      setTimeout(() => {
        commit('mutationsAdd', preload)
      }, 1000);
    }
  },
  modules: {
    aCount: {
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
