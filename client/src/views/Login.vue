<template>
  <div>
    <h1>Log in:</h1>
    <form v-on:submit.prevent="login()">
      <p>Username</p>
      <input type="text" v-model="name" required autofocus />
      <br>
      <p>Password</p>
      <input type="password" v-model="password" required />
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
  name: 'Login',
  components: {},
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
              return resp;
            case 401: // Unauthorized
              message = 'Invalid login';
              break;
            case 403: // Forbidden
              message = 'User is already logged in';
              break;
             case 404: // Not Found
              message = 'User doesn\'t exist';
              break;
            default: // Other faulting case
              message = 'Something unexpected went wrong.';
          }
          // Set status message according to response status
          this.statusMessage = message;
          this.$store.commit('setIsAuthenticated', false);
          throw new Error('Invalid login');
        })
        .then(() => {
          this.$store.commit('setIsAuthenticated', true);
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
          if (resp.ok) return resp;
          this.statusMessage = 'Registration failed';
        })
        .then(() => {
          this.statusMessage = 'Registration successful';
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
