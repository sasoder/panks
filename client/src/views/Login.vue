<template>
  <div>
    <h1>Log in:</h1>
    <form v-on:submit.prevent="login()">
      <p>Username</p>
      <input type="text" autocomplete="username" v-model="name" required />
      <br>
      <p>Password</p>
      <input type="password" autocomplete="current-password" v-model="password" required />
      <br>
      <input type="submit" value="Login" />
    </form>
    <button v-on:click="register()">Register with given credentials</button>
    <br>
    <h4 class="statusMessage">{{ statusMessage }}</h4>
  </div>
</template>

<script>
export default {
  data: () => ({
    name: '',
    password: '',
    statusMessage: '',
  }),
  methods: {
    login() {
      fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.name,
          password: this.password,
        }),
      })
        .then((resp) => {
          let message = '';
          switch (resp.status) {
            case 200: // OK
              return resp.json();
            case 401: // Unauthorized
              message = 'Invalid login';
              break;
            case 403: // Forbidden
              message = 'Looks like you\'re already logged in...';
              break;
             case 404: // Not Found
              message = 'User doesn\'t exist';
              break;
            default: // Other faulting case
              message = 'Something unexpected went wrong.';
          }
          // Set status message according to response status
          this.statusMessage = message;
          this.$store.commit('setIsAuthenticated', null);
          throw new Error('Invalid login');
        })
        .then((data) => {
          this.$store.commit('setIsAuthenticated', data.userID);
          this.$router.push({
            path: '/lobby',
          });
        })
        .catch((err) => {
          console.error(`Authentication failed unexpectedly: ${err}`);
        });
    },
    register() {
      fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.name,
          password: this.password,
        }),
      })
        .then((resp) => {
          if (resp.ok) {
            this.statusMessage = 'Registration successful';
          } else {
            this.statusMessage = 'Registration failed';
          }
        });
    },
  },
};
</script>

<style scoped>
  form {
    text-align:center;
    margin-bottom:20px;
  }
</style>
