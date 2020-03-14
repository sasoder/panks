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

    this.socket.on("logout", () => {
      this.logout();
    });
  },
  mounted() {},
  beforeDestroy() {
    // Removing sockets (just to be sure!)
    this.socket.off("logout");
  },
  methods: {
    logout() {
      // Clear "store variable"
      this.$store.commit("setIsAuthenticated", null);
      // Go back to homescreen
      this.$router.push("/login");
    }
  }
};
</script>

<style>
html,
body {
  margin: 0;
  padding: 10px;
  background: #d3d0cb;
}

h1 {
  background: #2d3436;
  color: white;
  margin-top: 0px;
  padding: none;
}

button {
  padding: 10px 10px;
  background-color: #30336b;
  color: whitesmoke;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  margin-bottom: 0.5rem;
  box-shadow: 0 0.5rem #130f40;
  transition: all 0.1s ease;
  display: inline-block;
  margin: 5px;
  border-radius: 5px;
}
button:hover {
  transform: translateY(0.3rem);
  box-shadow: 0 0.2rem #130f40;
}
</style>
