<template>
  <div>
    <p>Choose your settings on room {{ this.roomID }}:</p>
    <br />
    <p>Amplitude of terrain: {{ this.amplitude }}</p>
    <input v-model="amplitude" type="range" placeholder="terrain amplitude" min="0" max="750" />
    <p>Gamescreen width: {{ this.width }}</p>
    <input v-model="width" type="range" placeholder="width" min="100" max="2000" />
    <p>Gamescreen height: {{ this.height }}</p>
    <input v-model="height" type="range" placeholder="height" min="100" max="1500" />
    <br />
    <button v-on:click="startGame">Start game</button>
    <p>{{startGameMsg}}</p>
  </div>
</template>

<script>
export default {
  props: {
    roomID: {
      required: true
    }
  },
  data: () => ({
    amplitude: 100,
    width: 800,
    height: 500,
    startGameMsg: ""
  }),
  methods: {
    startGame() {
      // Check valid input
      if (
        this.invalidRange(this.amplitude, 0, 750) ||
        this.invalidRange(this.width, 100, 2000) ||
        this.invalidRange(this.height, 100, 1500)
      ) {
        console.error("Insufficient input data!");
        return;
      }
      // Make gamescreen with inputs
      fetch("/api/game/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          roomID: this.roomID,
          amplitude: this.amplitude,
          width: this.width,
          height: this.height,
          users: this.users
        })
      })
        .then(resp => {
          if (!resp.ok) {
            this.startGameMsg =
              "Could not start game. Remember, you can't play alone :(";
            throw new Error("Could not create game... Sad gamer moment!");
          }
        })
        .catch(err => {
          console.error(err);
        });
    },
    invalidRange(input, lower, upper) {
      return input < lower && input > upper;
    }
  }
};
</script>
