import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

// no-param-reassign prevents store.isAuthenticated = isAuthenticated
/* eslint-disable no-param-reassign */
export default new Vuex.Store({
    state: {
        isAuthenticated: null,
    },
    mutations: {
        setIsAuthenticated(store, isAuthenticated) {
            console.log('lalallalala', isAuthenticated);
            store.isAuthenticated = isAuthenticated;
        },
    },
    actions: {
    },
    modules: {
    },
});
