<template>
  <div>
    <p>Welcome to lobby!</p>
    <form v-on:submit.prevent="addRoom">
        <input v-model="newRoomName" type="text" placeholder="Name of new room">
        <button type="submit">Add Room!</button>
    </form>
    <RoomItem
        v-for="room in roomList"
        :key="room.id"
        :room="room"
        @removeRoom="removeRoomByID"
        @joinRoom="joinRoomByID"
    />
  </div>
</template>

<script>
import RoomItem from './RoomItem.vue';

export default {
    components: {
        RoomItem,
    },
    data: () => ({
        roomList: [],
        newRoomName: '',
    }),
    created() {
        this.socket = this.$root.socket;
        this.socket.on('newRoom', (newRoom) => {
            this.roomList = [...this.roomList, newRoom];
        });
        this.socket.on('updatedRoomList', (rooms) => {
            this.roomList = rooms;
        });
        this.getActiveRooms();
    },
    methods: {
        getActiveRooms() {
            fetch('/api/user/roomList', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then(res => res.json())
            .then((data) => {
                this.roomList = data.rooms;
            })
            .catch(console.error);
        },
        addRoom() {
            if (this.newRoomName === '') {
                console.log('Insufficient input data!');
                return;
            }
            fetch('api/user/addRoom', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomName: this.newRoomName,
                }),
            })
            .then((resp) => {
                // We don't have to add to RoomList here since
                // the emit-socket-event takes care of that
                if (!resp.ok) {
                    throw new Error('Error with adding new room...');
                }
                // Clear name of 'new Room'
                this.newRoomName = '';
            }).catch((err) => {
                console.error(err);
            });
        },
        // Emitting event from child component
        // TODO: Implement joining a room
        joinRoomByID(roomID) {
            console.log(`Trying to join Room with ID: ${roomID}`);
        },
        // Emitting event from child component
        // TODO: Add so that only creater of room can remove?
        removeRoomByID(roomID) {
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
</style>
