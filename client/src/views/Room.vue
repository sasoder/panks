<template>
  <div>
    <p>Welcome to Room with ID: {{ this.roomID }}</p>
    <button v-on:click="leaveRoom">Leave room</button>
    <form v-on:submit.prevent="sendMessage">
        <input v-model="newMessage" type="text" placeholder="Tell us something...">
    </form>
    <ul>
      <li v-for="user in users" v-bind:key="user.userID">
        {{ user }}
      </li>
    </ul>
    <GameSettings :roomID="this.roomID"/>
    <GameScreen/>
    <ul>
      <li v-for="(message, index) in messages" v-bind:key="index">
        {{ message }}
      </li>
    </ul>
  </div>
</template>

<script>
import GameSettings from './GameSettings.vue';
import GameScreen from './GameScreen.vue';

export default {
  // TODO: Show GameSettings only for creator
  // TODO: Show GameScreen once creator has set
  components: {
    // TODO: Does these need any props or emits?
    GameSettings,
    GameScreen,
  },
  data() {
    // ! - Can't use arrow notation with data because of the use of route?
    return {
      roomID: this.$route.params.roomID,
      messages: [],
      users: [],
      newMessage: '',
      socket: null,
    };
  },
  created() {
    this.socket = this.$root.socket;
    this.socket.on('msg', (msg) => {
      this.messages = [...this.messages, msg];
    });
    this.socket.on('updatedUserList', (users) => {
      this.users = users;
    });
    this.socket.on('deletedRoom', () => {
      this.$router.push('/lobby');
    });
    this.initRoom();
  },
  methods: {
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
        this.messages = data.list;
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
  },
};
</script>

<style scoped>
</style>
