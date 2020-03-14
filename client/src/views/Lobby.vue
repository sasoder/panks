<template>
  <div>
    <button @click="logout">Logout</button>
    <p>Welcome to the lobby, {{this.$store.state.isAuthenticated}}!</p>
    <p>These are your stats:</p>
    <br />
    <p>Total score: {{ parseInt(totalScore) }}</p>
    <br />
    <p>Times played: {{timesPlayed}}</p>

    <form v-on:submit.prevent="addRoom">
      <input v-model="newRoomName" type="text" placeholder="Name of new room" />
      <!-- Only display "add button" if user is not currently hosting a room -->
      <button v-if="!userHasRoom()" type="submit">Create Room!</button>
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
    totalScore: null,
    timesPlayed: null
  }),
  mounted() {
    this.socket = this.$root.socket;
    this.socket.on("newRoom", newRoom => {
      console.log("added new room socket moment");
      this.roomList = [...this.roomList, newRoom];
    });
    this.socket.on("updatedRoomList", rooms => {
      console.log(`Rooms array on updating: ${JSON.stringify(rooms)}`);
      this.roomList = rooms;
    });
    this.socket.on("activeGame", newRoomID => {
      console.log("roomlist", this.roomList);
      console.log("id", newRoomID);
      const room = this.roomList.find(r => r.id == newRoomID);
      console.log("h", room);
      room.activeGame = true;
      // TODO Force rerender, can do this more beautifully
      const temp = this.roomList;
      this.roomList = [];
      this.roomList = temp;
    });

    this.socket.on("inactiveGame", roomID => {
      console.log("blabla", this.roomList);
      console.log("hahaha", roomID);
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
        })
        .catch(console.error);
    },

    userHasRoom() {
      return this.roomList.some(
        room => room.creator === this.$store.state.isAuthenticated
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
          console.log("h", this.roomList);
          console.log("b", data.rooms);
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
</style>
