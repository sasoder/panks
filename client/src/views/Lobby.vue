<template>
  <div>
    <button @click="logout" id="logout-button">Logout</button>
    <p>Welcome to the lobby, {{this.$store.state.isAuthenticated}}!</p>
    <p>These are your stats:</p>
    <div id="stats-box">
      <p>Total wins: {{totalWins}}</p>
      <p>Total score: {{ parseInt(totalScore) }}</p>
      <p>Times played: {{timesPlayed}}</p>
    </div>
    <form v-if="!userHasRoom()" v-on:submit.prevent="addRoom" id="create-box">
      <input v-model="newRoomName" type="text" placeholder="Name of new room" />
      <!-- Only display "add button" if user is not currently hosting a room -->
      <br />
      <button type="submit">Create Room!</button>
    </form>
    <RoomCard ref="roomCard" v-for="room in roomList" :key="room.id" :room="room" />
  </div>
</template>

<script>
import RoomCard from "./components/RoomCard.vue";

export default {
  components: {
    RoomCard
  },
  data: () => ({
    roomList: [],
    newRoomName: "",
    totalScore: 0,
    timesPlayed: 0,
    totalWins: 0
  }),
  mounted() {
    this.socket = this.$root.socket;

    this.socket.on("newRoom", newRoom => {
      this.roomList = [...this.roomList, newRoom];
      // TODO change this to be handled on the server
      if (newRoom.host == this.$store.state.isAuthenticated) {
        this.$router.push(`/room/${newRoom.id}`);
      }
    });

    this.socket.on("joinedRoom", newRoom => {
      this.$router.push(`/room/${newRoom}`);
    });

    this.socket.on("updatedRoomList", rooms => {
      this.roomList = rooms;
    });
    this.socket.on("activeGame", newRoomID => {
      const room = this.roomList.find(r => r.id == newRoomID);
      room.activeGame = true;
      const temp = this.roomList;
      this.roomList = [];
      this.roomList = temp;
    });

    this.socket.on("inactiveGame", roomID => {
      const room = this.roomList.find(r => r.id == roomID);
      room.activeGame = false;
      const temp = this.roomList;
      this.roomList = [];
      this.roomList = temp;
    });

    this.getUserInfo();
    this.getActiveRooms();
  },
  beforeDestroy() {
    // Removing sockets
    this.socket.off("newRoom");
    this.socket.off("updatedRoomList");
    this.socket.off("inactiveGame");
    this.socket.off("activeGame");
    this.socket.off("joinedRoom");
  },
  methods: {
    getUserInfo() {
      fetch("api/user/userInfo", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then(res => res.json())
        .then(data => {
          this.totalScore = data.totalScore;
          this.timesPlayed = data.timesPlayed;
          this.totalWins = data.totalWins;
        })
        .catch(console.error);
    },

    userHasRoom() {
      return this.roomList.some(
        room => room.host === this.$store.state.isAuthenticated
      );
    },
    getActiveRooms() {
      fetch("/api/user/roomList", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then(res => res.json())
        .then(data => {
          this.roomList = data.rooms;
        })
        .catch(console.error);
    },
    addRoom() {
      // Is user allowed to add?
      if (this.userHasRoom()) {
        console.error("You already have a room bro!");
        return;
      }
      // Check input
      if (this.newRoomName === "") {
        this.newRoomName = `Room ${this.roomList.length}`;
      }
      fetch("api/user/addRoom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          roomName: this.newRoomName
        })
      })
        .then(resp => {
          // We don't have to add to RoomList here since
          // the emit-socket-event takes care of that
          if (!resp.ok) {
            throw new Error("Error with adding new room...");
          }
          // Clear name of 'new Room'
          this.newRoomName = "";
        })
        .catch(err => {
          console.error(err);
        });
    },
    logout() {
      fetch("api/user/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then(resp => {
          // If something on server side went wrong...
          if (!resp.ok) {
            throw new Error("Error while logging out...");
          }
        })
        .catch(err => {
          console.error(err);
        });
    }
  }
};
</script>

<style scoped>
#logout-button {
  margin: 20px 0 40px 0;
}

#stats-box {
  background: #2d3436;
  width: fit-content;
  margin: 15px 0 45px 0;
  padding: 10px 20px 5px 15px;
  color: whitesmoke;
  border: 1px solid black;
  border-radius: 5px;
}

#create-box {
  margin-bottom: 40px;
}

#create-box button {
  margin: 15px 0 0 0;
}

#create-box input {
  padding: 8px;
}
</style>
