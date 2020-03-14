<template>
  <div id="userlist-container">
    <p>Users:</p>
    <p>
      <span v-for="user in users" v-bind:key="user.userID">
        {{ user.userID }} - Total wins: {{user.totalWins}} - Total score: {{user.totalScore}} - Times played: {{user.timesPlayed}}
        <br />
      </span>
    </p>
  </div>
</template>

<script>
export default {
  props: {
    users: {
      required: true
    }
  }
};
</script>

<style scoped>
#userlist-container {
  background: #b1aea9;
  margin: 20px;
  padding: 10px;
  border-radius: 5px;
}
</style>
