<template>
  <div id="roomcard-container">
    <p>
      ID: {{ room.id }}
      <br>Created by: {{ room.creator }}
      <br>Name: {{ room.name }}
      <br>Players: {{ room.users.length }}
    </p>
    <button @click="joinRoom(room.id)">Join room</button>
    <button
      v-if="room.creator === this.currentUser"
      @click="removeRoom(room.id)"
    >Remove room</button>
  </div>
</template>

<script>
export default {
  props: {
    room: {
      type: Object,
      required: true,
    },
  },
  data: () => ({
    currentUser: null,
  }),
  created() {
    this.currentUser = this.$store.state.isAuthenticated;
  },
  methods: {
    // Emitting event from child component
    joinRoom(roomID) {
        console.log(`Trying to join Room with ID: ${roomID}`);
        this.$router.push(`/room/${roomID}`);
    },
    // Emitting event from child component
    removeRoom(roomID) {
        fetch('api/user/removeRoom', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                roomID,
            }),
        })
        .then((resp) => {
            // If something on server side went wrong...
            if (!resp.ok) {
                throw new Error('Error with adding new room...');
            }
        }).catch((err) => {
            console.error(err);
        });
    },
  },
};
</script>

<style scoped>

#roomcard-container {
  background:lightgrey;
  margin:20px;
  padding:10px;
  border-radius:5px;
  border:1px solid black;
}

</style>
