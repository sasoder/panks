<template>
  <div id="app">
    <header>
      <h1>PANKS</h1>
      <button v-if="userIsLoggedIn()" @click="logout">Logout</button>
    </header>
    <!-- Try 'slide-right' -->
    <transition appear name="fade">
      <router-view></router-view>
    </transition>
  </div>
</template>

<script>
export default {
    methods: {
        userIsLoggedIn() {
            return this.$store.state.isAuthenticated !== null;
        },
        logout() {
          // TODO: Remove once we know it works
          console.debug('Logout!');
          fetch('api/user/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
          })
          .then((resp) => {
              // If something on server side went wrong...
              if (!resp.ok) {
                  throw new Error('Error while logging out...');
              }
              // Clear "store variable"
              this.$store.commit('setIsAuthenticated', null);
              // Go back to homescreen
              // TODO: Doesn't work...
              this.$router.push('/login');
          }).catch((err) => {
              console.error(err);
          });
        },
    },
};
</script>

<style>
html,
body {
  margin: 0;
  padding: 0;
}

header {
  background:grey;
  color:white;
}
</style>
