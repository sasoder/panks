<template>
  <div>
    <button @click="logout">Logout</button>
    <p>Welcome to the lobby, {{this.$store.state.isAuthenticated}}!</p>
    <p>These are your stats:</p>
    <br>
    <p>Total score: {{totalScore}}</p>
    <br>
    <p>Times played: {{timesPlayed}}</p>

    <form v-on:submit.prevent="addRoom">
        <input v-model="newRoomName" type="text" placeholder="Name of new room">
        <!-- Only display "add button" if user is not currently hosting a room -->
        <button v-if="!userHasRoom()" type="submit">Create Room!</button>
    </form>
    <RoomCard
        v-for="room in roomList"
        :key="room.id"
        :room="room"
    />
  </div>
</template>

<script>
import RoomCard from './components/RoomCard.vue';

export default {
    components: {
        RoomCard,
    },
    data: () => ({
        roomList: [],
        newRoomName: '',
        totalScore: null,
        timesPlayed: null,
    }),
    created() {
        this.socket = this.$root.socket;
        this.socket.on('newRoom', (newRoom) => {
            this.roomList = [...this.roomList, newRoom];
        });
        this.socket.on('updatedRoomList', (rooms) => {
            console.log(`Rooms array on updating: ${JSON.stringify(rooms)}`);
            this.roomList = rooms;
        });
        this.getUserInfo();
        this.getActiveRooms();
    },
    methods: {

        getUserInfo() {
            fetch('api/user/userInfo', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then(res => res.json())
            .then((data) => {
                this.totalScore = data.totalScore;
                this.timesPlayed = data.timesPlayed;
            })
            .catch(console.error);
            },

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
            })
            .catch(console.error);
        },
        addRoom() {
            // Is user allowed to add?
            if (this.userHasRoom()) {
                console.error('You already have a room bro!');
                return;
            }
            // Check input
            if (this.newRoomName === '') {
                console.error('Insufficient input data!');
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
        logout() {
          fetch('api/user/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
          })
          .then((resp) => {
              // If something on server side went wrong...
              if (!resp.ok) {
                  throw new Error('Error while logging out...');
              }
              // Clear "store variable"
              this.$store.commit('setIsAuthenticated', null);
              // Go back to homescreen
              this.$router.push('/login');
          }).catch((err) => {
              console.error(err);
          });
        },
    },
};
</script>

<style scoped>
</style>
