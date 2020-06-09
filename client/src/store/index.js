import Vue from "vue";
import Vuex from "vuex";
import createMultiTabState from "vuex-multi-tab-state";

Vue.use(Vuex);

// no-param-reassign prevents store.isAuthenticated = isAuthenticated
/* eslint-disable no-param-reassign */
export default new Vuex.Store({
  state: {
    isAuthenticated: null,
  },
  mutations: {
    setIsAuthenticated(store, isAuthenticated) {
      store.isAuthenticated = isAuthenticated;
    },
  },
  actions: {},
  modules: {},
  plugins: [createMultiTabState()],
});
