<template>
  <div id="app">
    <header>
      <h1>PANKS</h1>
    </header>
    <transition name="fade" mode="out-in">
      <router-view></router-view>
    </transition>
  </div>
</template>

<script>
export default {
  beforeCreate() {
    this.socket = this.$root.socket;

    this.socket.on("logout", () => {
      this.logout();
    });

    this.socket.on("invalidate", () => {
      // Go back to homescreen
      this.logout();
      alert(
        "This tab has been invalidated because you logged in on another tab or window"
      );
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
  font-family: "Baloo Chettan 2", cursive;
  margin: 0;
  padding: 10px;
  background: #d3d0cb;
}

h1 {
  background: #2d3436;
  color: whitesmoke;
  margin: 0;
  padding: 8px;
  border-radius: 5px;
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

input {
  background-color: #333;
  color: whitesmoke;
  border: none;
  border-radius: 5px;
  padding-left: 5px;
  padding-top: 5px;
  padding-bottom: 5px;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-leave-active {
  transition: all 0.1s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
