<template>
  <div id="app">
    <header>
      <h1>PANKS</h1>
    </header>
    <!-- Try 'slide-right' -->
    <transition name="fade">
      <router-view></router-view>
    </transition>
  </div>
</template>

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
