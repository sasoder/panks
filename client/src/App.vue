<template>
  <div id="app">
    <header>
      <h1>PANKS</h1>
    </header>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  beforeCreate() {
      this.socket = this.$root.socket;
      console.log("app.vue", this.socket);

      this.socket.on('logout', () => {
        this.logout();
      });
  },
  mounted() {
  },
  beforeDestroy() {
    // Removing sockets (just to be sure!)
    this.socket.off('logout');
  },
  methods: {
    logout() {
      // Clear "store variable"
      this.$store.commit('setIsAuthenticated', null);
      // Go back to homescreen
      this.$router.push('/login');
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
