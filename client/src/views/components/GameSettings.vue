<template>
  <div id="gamesettings-container">
    <p><b>Choose your settings:</b></p>
    <div class="slidecontainer">
      <p>Amplitude of terrain: {{ this.amplitude }}</p>
      <input
        class="slider"
        v-model="amplitude"
        type="range"
        placeholder="terrain amplitude"
        min="0"
        max="750"
      />
      <p>Gamescreen width: {{ this.width }}</p>
      <input class="slider" v-model="width" type="range" placeholder="width" min="100" max="2000" />
      <p>Gamescreen height: {{ this.height }}</p>
      <input class="slider" v-model="height" type="range" placeholder="height" min="100" max="1500" />
    </div>
    <br />
    <button v-on:click="startGame">Start game</button>
    <p id="message"><b>{{startGameMsg}}</b></p>
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

<style scoped>

#gamesettings-container {
  margin-top:50px;
}

.slidecontainer {
  width: 75%;
}

.slidecontainer p {
  margin: 15px 0 10px 0;
}

.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 15px;
  border-radius: 5px;
  background: #b1aea9;
  outline: none;
  -webkit-transition: 0.2s;
  transition: opacity 0.2s;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background: #30336b;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background: #30336b;
  cursor: pointer;
}

#message {
  margin-top:15px;
}
</style>
