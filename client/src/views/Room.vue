<template>
  <div>
    <p>Welcome to Room with ID: {{ this.roomID }}</p>
    <button v-on:click="leaveRoom">Leave room</button>
    <UserList
      :users="users"
    />
    <GameSettings v-if="isCreator && !activeGame"
      :roomID="roomID"
    />
    <p v-else-if="!activeGame">Host is changing game settings...</p>
    <GameScreen v-if="activeGame"
      :roomID="roomID"
    />
    <Chat
      ref="chat"
      :roomID="roomID"
      :messages="messages"
    />
  </div>
</template>

<script>
import UserList from './components/UserList.vue';
import GameSettings from './components/GameSettings.vue';
import GameScreen from './components/GameScreen.vue';
import Chat from './components/Chat.vue';

export default {
  components: {
    UserList,
    GameSettings,
    GameScreen,
    Chat,
  },
  data() {
    // ! - Can't use arrow notation with data because of the use of route?
    return {
      roomID: this.$route.params.roomID,
      creator: null,
      messages: [],
      users: [],
      activeGame: null,
      socket: null,
    };
  },
  mounted() {
    this.socket = this.$root.socket;
    this.socket.on('updatedUserList', (users) => {
      this.users = users;
    });
    this.socket.on('startGame', () => {
      this.activeGame = true;
    });
    this.socket.on('deletedRoom', () => {
      this.$router.push('/lobby');
    });
    this.socket.on('destroyGame', () => {
      this.activeGame = false;
    });
    this.initRoom();
    // this is in mounted because it tries to access
    // the chat ref which may not be finished @ created
    this.socket.on('msg', (msg) => {
      this.messages = [...this.messages, msg];
      // Scroll down in chat component on new messages
      // TODO: this is undefined when entering room 2nd time and after
      console.log(this.$refs);
      this.$refs.chat.scrollChat();
    });
  },
  destroyed() {
    console.log('why are you here');
    this.socket.off('updatedUserList');
    this.socket.off('startGame');
    this.socket.off('deletedRoom');
    this.socket.off('destroyGame');
  },
  methods: {
    initRoom() {
      fetch(`/api/user/${this.roomID}/init`)
      .then((resp) => {
        if (!resp.ok) {
          throw new Error(`Unexpected failure when joining room: ${this.roomID}`);
        }
        return resp.json();
      })
      .then((data) => {
        this.creator = data.creator;
        this.messages = data.messages;
        this.users = data.users;
        this.activeGame = data.activeGame;
      })
      .catch((err) => {
        console.error(err);
        // Reroute back to lobby
        this.$router.push('/lobby');
      });
    },
    leaveRoom() {
      fetch(`/api/user/${this.roomID}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then((resp) => {
        if (!resp.ok) {
          throw new Error('Could not leave room. You\'re here forever :)');
        }
        this.$router.push('/lobby');
      }).catch((err) => {
        console.error(err);
      });
    },
  },
  computed: {
    isCreator() {
      return this.creator === this.$store.state.isAuthenticated;
    },
  },
};
</script>

<style scoped>

</style>
