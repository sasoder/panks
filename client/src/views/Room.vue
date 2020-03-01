<template>
  <div>
    <p>Welcome to Room with ID: {{ this.roomID }}</p>
  </div>
</template>

<!-- We need to integrate keybutton input somehow... -->
<script>
export default {
  data() {
    // ! - Can't use arrow notation because of the use of route?
    return {
      roomID: this.$route.params.roomID,
      entries: [],
      socket: null,
    };
  },
  // TODO: Set up join endpoint
  created() {
    this.socket = this.$root.socket;
    // TODO: Socket for fetching messages
    // TODO: Socket for fetching game state
    fetch(`/api/room/${this.roomID}/join`)
      .then((resp) => {
        if (!resp.ok) {
          throw new Error(`Unexpected failure when joining room: ${this.roomID}`);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  },
};
</script>

<style scoped>
</style>
