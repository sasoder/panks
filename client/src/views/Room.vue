<template>
  <div>
    <div style="display: flex; justify-content: space-between;">
      <h2>Welcome to Room with ID: {{ this.roomID }}</h2>
      <button v-on:click="leaveRoom">Leave room</button>
    </div>
    <UserList :users="users" />
    <GameSettings v-if="isHost && !activeGame" :roomID="roomID" />
    <p v-else-if="!activeGame">Waiting for host to set game settings...</p>
    <GameScreen v-if="activeGame" :roomID="roomID" />
    <Chat :roomID="roomID" :messages="messages" />
  </div>
</template>

<script>
import UserList from "./components/UserList.vue";
import GameSettings from "./components/GameSettings.vue";
import GameScreen from "./components/GameScreen.vue";
import Chat from "./components/Chat.vue";

export default {
  components: {
    UserList,
    GameSettings,
    GameScreen,
    Chat
  },
  data() {
    // ! - Can't use arrow notation with data because of the use of route?
    return {
      roomID: this.$route.params.roomID,
      host: null,
      messages: [],
      users: [],
      activeGame: null,
      socket: null
    };
  },
  mounted() {
    // Set up context
    this.socket = this.$root.socket;
    this.initRoom();

    // Set up sockets
    this.socket.on("updatedUserList", data => {
      console.log("in room, emitting:", data);
      this.users = data.users;
      this.host = data.host;
    });
    this.socket.on("startGame", () => {
      this.activeGame = true;
    });
    this.socket.on("destroyGame", () => {
      this.activeGame = false;
    });
    this.socket.on("msg", msg => {
      this.messages = [...this.messages, msg];
    });
  },
  beforeDestroy() {
    // Removing sockets
    this.socket.off("updatedUserList");
    this.socket.off("startGame");
    this.socket.off("destroyGame");
    this.socket.off("msg");
  },
  methods: {
    initRoom() {
      fetch(`/api/user/${this.roomID}/init`)
        .then(resp => {
          if (!resp.ok) {
            throw new Error(
              `Unexpected failure when joining room: ${this.roomID}`
            );
          }
          return resp.json();
        })
        .then(data => {
          this.host = data.host;
          this.messages = data.messages;
          this.users = data.users;
          this.activeGame = data.activeGame;
        })
        .catch(err => {
          console.error(err);
          // Reroute back to lobby
          this.$router.push({
            path: "/lobby"
          });
        });
    },
    leaveRoom() {
      fetch(`/api/user/${this.roomID}/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then(resp => {
          if (!resp.ok) {
            throw new Error("Could not leave room. You're here forever :)");
          }
          console.log("before reroute");
          this.$router.push({
            path: "/lobby"
          });
          console.log("after reroute");
        })
        .catch(err => {
          console.error(err);
        });
    }
  },
  computed: {
    isHost() {
      console.log(this.host);
      return this.host === this.$store.state.isAuthenticated;
    }
  }
};
</script>

<style scoped>
</style>
