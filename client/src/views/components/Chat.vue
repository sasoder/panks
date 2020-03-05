<template>
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
</template>

<script>
export default {
  props: {
    roomID: {
      required: true,
    },
    messages: {
      required: true,
    },
  },
  data: () => ({
    newMessage: '',
  }),
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
    scrollChat() {
      const container = this.$el.querySelector('#chat-text-container');
      container.scrollTop = container.scrollHeight;
    },
  },
};
</script>

<style scoped>

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
