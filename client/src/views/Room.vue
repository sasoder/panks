<template>
  <div>
    <p>Welcome to Room with ID: {{ this.room }}</p>
  </div>
</template>

<!-- We need to integrate keybutton input somehow... -->
<script>
export default {
  data() {
    // ! - Can't use arrow notation because of the use of route?
    return {
      room: this.$route.params.roomID,
      entries: [],
      socket: null,
    };
  },
  // TODO: Implement with sockets
  created() {
    this.socket = this.$root.socket;
    /* this.socket.on('msg', (msg) => {
      this.entries = [...this.entries, msg];
    });
    fetch(`/api/room/${this.room}/join`)
      .then((resp) => {
        if (!resp.ok) {
          throw new Error(`Unexpected failure when joining room: ${this.room}`);
        }
        return resp.json();
      })
      .catch(console.error)
      .then((data) => {
        this.entries = data.list;
      }); */
  },
};
</script>

<style scoped>
</style>
