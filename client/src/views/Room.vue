<template>
  <div>
    <div id="title-container">
      <h2>Welcome to Room {{ this.roomID }}: {{ this.name }}</h2>
      <button v-on:click="leaveRoom">Leave room</button>
    </div>
    <UserList v-if="!activeGame" :users="users" />
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
    return {
      roomID: this.$route.params.roomID,
      name: null,
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
          this.name = data.name;
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

#title-container {
  display: flex;
  justify-content: space-between;
  margin: 15px 0 30px 0;
}

</style>
