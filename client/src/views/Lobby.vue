<template>
  <div>
    <p>Welcome to lobby!</p>
    <button @click="addRoom">Add Room!</button>
    <RoomItem v-for="room in roomList" :key="room.id" :room="room" @removeRoom="removeRoomByID"/>
  </div>
</template>

<script>
import RoomItem from './RoomItem.vue';

export default {
    data: () => ({
        idCounter: 0,
        roomList: [],
    }),
    components: {
        RoomItem,
    },
    methods: {
        // TODO: Implement fetching of active rooms.
        getActiveRooms() {
            console.log('Later this fetches rooms...');
        },
        // TODO: Implement adding a room
        addRoom() {
            console.log('Simulating adding a room...');
            this.roomList.push({
                id: this.idCounter += 1,
            });
        },
        // Testing emitting from child component
        removeRoomByID(roomID) {
            this.roomList = this.roomList
                .filter(room => room.id !== roomID);
        },
    },
};
</script>

<style scoped>
</style>
