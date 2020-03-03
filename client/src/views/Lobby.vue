<template>
  <div>
    <p>Welcome to lobby!</p>
    <div>
        <input v-model="newRoomName" type="text" placeholder="Name of new room">
        <button @click="addRoom" v-if="!userHasRoom()" type="submit">Add Room!</button>
    </div>
    <RoomCard
        v-for="room in roomList"
        :key="room.id"
        :room="room"
    />
  </div>
</template>

<script>
import RoomCard from './RoomCard.vue';

export default {
    components: {
        RoomCard,
    },
    data: () => ({
        roomList: [],
        newRoomName: '',
        canAddRoom: false,
    }),
    created() {
        this.socket = this.$root.socket;
        this.socket.on('newRoom', (newRoom) => {
            this.roomList = [...this.roomList, newRoom];
            // this.canAddRoom = !this.userHasRoom();
        });
        this.socket.on('updatedRoomList', (rooms) => {
            console.log(`Rooms array on updating: ${JSON.stringify(rooms)}`);
            this.roomList = rooms;
            // this.canAddRoom = !this.userHasRoom();
        });
        this.getActiveRooms();
    },
    methods: {
        userHasRoom() {
            return this.roomList.some(room => room.creator === this.$store.state.isAuthenticated);
        },
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
                // this.canAddRoom = !this.userHasRoom();
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
                this.canAddRoom = false;
                // Clear name of 'new Room'
                this.newRoomName = '';
            }).catch((err) => {
                console.error(err);
            });
        },
    },
};
</script>

<style scoped>
</style>
