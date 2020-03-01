<template>
  <div id="roomContainer">
    <p>ROOM:
      <br>ID: {{ room.id }}
      <br>Name: {{ room.name }}
      <br>Players: {{ room.players.length }}
    </p>
    <button @click="$emit('joinRoom', room.id)">Join room</button>
    <button @click="$emit('removeRoom', room.id)">Remove room</button>
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
