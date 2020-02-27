<template>
  <div>
    <h1>Log in:</h1>
    <form v-on:submit.prevent="done()">
      <input type="text" v-model="name" required autofocus />
      <input class="form-control" type="password" v-model="password" required autofocus />
      <input type="submit" value="Login" />
    </form>
    <button v-on:click.prevent="register()">Click to register a new account</button>
    <br />
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
    done() {
      fetch('/api/authenticate', {
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
        })
        .then(() => {
          this.$store.commit('setIsAuthenticated', true);
          this.$router.push({
            path: '/user/timeSlotList',
          });
        })
        .catch((error) => {
          console.error('Authentication failed unexpectedly');
          throw error;
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
