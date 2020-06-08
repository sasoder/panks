<template>
  <div>
    <h2>Log in:</h2>
    <form v-on:submit.prevent="login()">
      <div id="login-inputs">
        <p>Username</p>
        <input type="text" autocomplete="username" v-model="name" required />
        <br />
        <p>Password</p>
        <input type="password" autocomplete="current-password" v-model="password" required />
      </div>
      <button type="submit">Login</button>
    </form>
    <button id="register" v-on:click="register()">Register with given credentials</button>
    <h4 id="message">{{ statusMessage }}</h4>
  </div>
</template>

<script>
export default {
  data: () => ({
    name: "",
    password: "",
    statusMessage: ""
  }),
  methods: {
    login() {
      fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: this.name,
          password: this.password
        })
      })
        .then(resp => {
          let message = "";
          switch (resp.status) {
            case 200: // OK
              return resp.json();
            case 401: // Unauthorized
              message = "Invalid login";
              break;
            case 403: // Forbidden
              message =
                "Looks like you're already logged in from somewhere else...";
              break;
            case 404: // Not Found
              message = "User doesn't exist";
              break;
            default:
              // Other faulting case
              message = "Something unexpected went wrong.";
          }
          // Set status message according to response status
          this.statusMessage = message;
          this.$store.commit("setIsAuthenticated", null);
          throw new Error("Invalid login");
        })
        .then(data => {
          this.$store.commit("setIsAuthenticated", data.userID);
          // // edge case
          // this.socket.emit("updateUserID", data.userID);

          console.log("LOBBY766667 TIME");
          if (data.room) {
            this.$router.push(`/room/${data.room}`);
          } else {
            console.log("LOBBY TIME");
            this.$router.push({
              path: "/lobby"
            });
          }
        })
        .catch(err => {
          console.error(`Authentication failed unexpectedly: ${err}`);
        });
    },
    register() {
      // Is user allowed to add?
      if (this.name === "" || this.password === "") {
        this.statusMessage = "Invalid registration: Fill in all fields";
        return;
      }
      fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: this.name,
          password: this.password
        })
      }).then(resp => {
        if (resp.ok) {
          this.statusMessage = "Registration successful";
        } else {
          this.statusMessage = "Registration failed";
        }
      });
    }
  }
};
</script>

<style scoped>
h2 {
  margin: 40px;
  text-align: center;
}

form {
  text-align: center;
}

#login-inputs {
  margin-bottom: 20px;
}

form p {
  margin: 10px;
}

button {
  margin-bottom: 50px;
}

#register {
  display: block;
  margin: auto;
  margin-bottom: 50px;
}

#message {
  text-align: center;
}
</style>
