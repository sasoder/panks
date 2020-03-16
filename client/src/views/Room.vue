<template>
  <div>
    <div id="title-container">
      <h2>Welcome to Room {{ this.roomID }}: {{ this.name }}</h2>
      <button v-on:click="leaveRoom">Leave room</button>
    </div>
    <transition name="slower-fade">
      <GameScreen v-if="activeGame" :roomID="roomID" />
    </transition>
    <transition name="slower-fade">
      <UserList v-if="showUsers" :users="users" />
    </transition>
    <GameSettings v-if="isHost && !activeGame" :roomID="roomID" />
    <p v-else-if="!activeGame">Waiting for host to set game settings...</p>
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
      socket: null,
      showUsers: true
    };
  },
  mounted() {
    // Set up context
    this.socket = this.$root.socket;
    this.initRoom();

    // Set up sockets
    this.socket.on("updatedUserList", data => {
      this.users = data.users;
      this.host = data.host;
    });
    this.socket.on("startGame", () => {
      this.activeGame = true;
      this.showUsers = false;
      setTimeout(() => {
        this.activeGame = true;
      }, 250);
      setTimeout(() => {
        this.showUsers = true;
      }, 750);
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
          this.$router.push({
            path: "/lobby"
          });
        })
        .catch(err => {
          console.error(err);
        });
    }
  },
  computed: {
    isHost() {
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

.slower-fade-enter-active,
.slower-fade-leave-active {
  transition: all 1s ease;
}

.slower-fade-enter,
.slower-fade-leave-to {
  opacity: 0;
}
</style>
