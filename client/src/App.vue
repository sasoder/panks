<template>
  <div id="app">
    <h1>TANKS</h1>
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
</style>
