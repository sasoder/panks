<template>
  <div>
    <p>Welcome to Room with ID: {{ this.roomID }}</p>
    <button v-on:click="leaveRoom">Leave room</button>
    <ul>
      <li v-for="user in users" v-bind:key="user.userID">
        {{ user }}
      </li>
    </ul>
    <GameSettings v-if="isCreator() && !this.activeGame" :roomID="this.roomID"/>
    <GameScreen v-if="this.activeGame"/>
    <!-- // TODO: Extract Chat -->
    <div id="chat">
      <div id="chat-text-container">
        <p v-for="(message, index) in messages" v-bind:key="index">
          {{ message }}
        </p>
      </div>
      <form v-on:submit.prevent="sendMessage">
        <input v-model="newMessage" type="text" placeholder="Tell us something...">
      </form>
    </div>
  </div>
</template>

<script>
import GameSettings from './GameSettings.vue';
import GameScreen from './GameScreen.vue';

export default {
  // TODO: Extract Chat into seperate component (see further todo's - 'Extract Chat')
  components: {
    // TODO: Does these need any props or emits?
    GameSettings,
    GameScreen,
  },
  data() {
    // ! - Can't use arrow notation with data because of the use of route?
    return {
      roomID: this.$route.params.roomID,
      creator: null,
      messages: [],
      users: [],
      newMessage: '',
      activeGame: '',
      socket: null,
    };
  },
  created() {
    this.socket = this.$root.socket;
    this.socket.on('msg', (msg) => {
      this.messages = [...this.messages, msg];
      // TODO: Extract Chat
      this.scrollChat();
    });
    this.socket.on('updatedUserList', (users) => {
      this.users = users;
    });
    this.socket.on('startGame', () => {
      this.activeGame = true;
    });
    this.socket.on('newCreator', (creator) => {
      this.creator = creator;
    });
    this.socket.on('deletedRoom', () => {
      this.$router.push('/lobby');
    });
    this.initRoom();
  },
  methods: {
    isCreator() {
      return this.creator === this.$store.state.isAuthenticated;
    },
    // TODO: Extract Chat
    sendMessage() {
      if (this.newMessage === '') {
        console.log('Insufficient input message!');
        return;
      }
      fetch(`/api/user/${this.roomID}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: this.newMessage,
        }),
      })
        .then((resp) => {
          if (!resp.ok) {
            throw new Error('You may only send messages in rooms you are partaking in.');
          }
          this.newMessage = '';
        })
        .catch((err) => {
          console.error(err);
        });
    },
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
      })
      .catch((err) => {
        console.error(err);
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
    // TODO: Extract Chat
    scrollChat() {
      const container = this.$el.querySelector('#chat-text-container');
      container.scrollTop = container.scrollHeight;
    },
  },
};
</script>

<style scoped>

/* //TODO: Extract Chat */
#chat {
  position:fixed;
  bottom:10px;
  left:10px;
  width:150px;
}

#chat input {
  width:150px;
  border:1px solid black;
  border-top:0;
  padding:4px;
}

#chat-text-container {
  height:300px;
  padding:5px 5px 25px 5px;
  border:1px solid black;
  overflow-y:auto;
}

</style>
