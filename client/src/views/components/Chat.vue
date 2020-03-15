<template>
  <div id="chat">
    <div id="chat-text-container">
      <p v-for="(message, index) in messages" v-bind:key="index">{{ message }}</p>
    </div>
    <form v-on:submit.prevent="sendMessage">
      <input ref="chat" v-model="newMessage" type="text" placeholder="Tell us something..." />
    </form>
  </div>
</template>

<script>
export default {
  props: {
    roomID: {
      required: true
    },
    messages: {
      required: true
    }
  },
  updated() {
    const container = this.$el.querySelector("#chat-text-container");
    container.scrollTop = container.scrollHeight - container.clientHeight;
  },
  mounted() {
    this.$refs.chat.addEventListener("keydown", this.preventFunc);
    this.$refs.chat.addEventListener("keyup", this.preventFunc);
  },
  beforeDestroy() {
    this.$refs.chat.removeEventListener("keydown", this.preventFunc);
    this.$refs.chat.removeEventListener("keyup", this.preventFunc);
  },
  data: () => ({
    newMessage: ""
  }),
  methods: {
    preventFunc(e) {
      e.stopPropagation();
    },
    sendMessage() {
      if (this.newMessage === "") {
        console.log("Insufficient input message!");
        return;
      }
      fetch(`/api/user/${this.roomID}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: this.newMessage
        })
      })
        .then(resp => {
          if (!resp.ok) {
            throw new Error(
              "You may only send messages in rooms you are partaking in."
            );
          }
          this.newMessage = "";
        })
        .catch(err => {
          console.error(err);
        });
    }
  }
};
</script>

<style scoped>
#chat {
  position: fixed;
  bottom: 10px;
  right: 10px;
  width: 175px;
  color: whitesmoke;
  border-radius: 5px;
  opacity: 0.6;
  transition: opacity 0.5s ease-out;
  -moz-transition: opacity 0.5s ease-out;
  -webkit-transition: opacity 0.5s ease-out;
  -o-transition: opacity 0.5s ease-out;
}

#chat:hover {
  opacity: 1;
}

#chat input {
  width: 175px;
  border: none;
  border-top: 0;
  padding: 8px;
  border-top-right-radius: 0px;
  border-top-left-radius: 0px;
}

#chat-text-container {
  background: #333;
  height: 300px;
  padding: 8px 8px 0px 8px;
  border: none;
  overflow-y: auto;
  border-radius: 5px;
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
}
</style>
