<template>
  <div id="userlist-container">
    <p>Users:</p>
    <p>
      <span v-for="user in users" v-bind:key="user.userID">
        {{ user }}, Total score: {{user.totalScore}}, Times played: {{user.timesPlayed}}
      </span>
    </p>
  </div>
</template>

<script>
export default {
  props: {
    users: {
      required: true,
    },
  },
};
</script>

<style scoped>

#userlist-container {
  background:lightgray;
  margin:20px;
  padding:5px;
  border-radius:5px;
  border:1px solid black;
}

</style>
