<template>
  <div id="app">
    <header>
      <h1>PANKS</h1>
    </header>
    <router-view></router-view>
  </div>
</template>

<script>
// TODO: Import this into children later
export default {
  methods: {
    redirect(target) {
      this.$router.push(target);
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
