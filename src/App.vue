<template>
  <!-- 数量：{{count}} 
  数量：{{$store.state.count}}
  <br>
  double:{{double}}
  double:{{$store.getters.double}}
  <br>
  <button @click="$store.state.count++">错误增加</button>
  <br>
  <button @click="mutationsAdd">正确增加 mutation</button>
  <br>
  <button @click="actionAdd">正确增加 action</button> -->
  <!-- 数量：{{count}}  -->
  数量（根模块）：{{$store.state.count}}  
  <button @click="$store.state.count++">增加</button>
  <br>
  数量（aCount模块）：{{$store.state.aCount.count}} 
  <button @click="$store.state.aCount.count++">增加</button>
  <br>
  数量（cCount模块）：{{$store.state.aCount.cCount.count}} 
  <button @click="$store.state.aCount.cCount.count++">增加</button>
  <br>
</template>

<script>
import { computed } from "vue";
import { useStore } from "@/vuex";
export default {
  name: 'App',
  setup(){
    const store = useStore()
    console.log(store);
    const mutationsAdd = () =>{
      store.commit('mutationsAdd',1)
    }
    const actionAdd = () =>{
      store.dispatch('actionAdd',1)
    }
    return {
      count:computed(() => store.state.count),
      double:computed(() => store.getters.double),
      mutationsAdd,
      actionAdd,
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
