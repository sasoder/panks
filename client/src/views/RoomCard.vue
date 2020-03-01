<template>
  <div id="roomContainer">
    <p>ROOM:
      <br>ID: {{ room.id }}
      <br>Name: {{ room.name }}
      <br>Players: {{ room.players.length }}
    </p>
    <button @click="joinRoom(room.id)">Join room</button>
    <button @click="removeRoom(room.id)">Remove room</button>
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
  methods: {
    // Emitting event from child component
    // TODO: Implement joining a room
    joinRoom(roomID) {
        console.log(`Trying to join Room with ID: ${roomID}`);
        this.$router.push(`/room/${roomID}`);
    },
    // Emitting event from child component
    // TODO: Add so that only creater of room can remove?
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

#roomContainer {
  background:lightgrey;
  margin:20px;
  padding:10px;
  border-radius:5px;
  border:1px solid black;
}

</style>
