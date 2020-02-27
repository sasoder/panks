import Vue from 'vue';
import VueRouter from 'vue-router';
import LobbyView from '../views/Lobby.vue';
import LoginView from '../views/Login.vue';
import RegisterView from '../views/Register.vue';
import RoomView from '../views/Room.vue';

import store from '../store';

Vue.use(VueRouter);

const routes = [
    { path: '/', redirect: '/login' },
    { path: '/lobby', component: LobbyView },
    { path: '/login', component: LoginView },
    { path: '/register', component: RegisterView },
    { path: '/room/:roomName', component: RoomView },
];

const router = new VueRouter({
    mode: 'hash',
    base: process.env.BASE_URL,
    routes,
});

// Setup Authentication guard
router.beforeEach((to, from, next) => {
    if (store.state.isAuthenticated || to.path === '/login') {
        next();
    } else {
        console.info('Unauthenticated user. Redirecting to login page.');
        next('/login');
    }
});

export default router;
