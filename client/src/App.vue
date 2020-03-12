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
  created() {
      this.socket = this.$root.socket;
      this.socket.on('logout', () => {
        this.logout();
      });
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
