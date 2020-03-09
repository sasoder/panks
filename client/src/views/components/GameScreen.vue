<template>
  <div>
    <p>{{gameMsg}}</p>
    <div id="screen">
      <canvas ref="gameCanvas"></canvas>
    </div>
  </div>
</template>

<!-- We need to integrate keybutton input somehow... -->
<script>
export default {
  props: {
    roomID: {
      required: true
    }
  },
  data() {
    return {
      gameMsg: "Good luck",
      gameState: null,
      socket: null,
      interval: null,
      canvas: null,
      ctx: null,

      // Variables independent of game that shouldn't be in gameState
      hudBarLen: 100,
      hudBarHeight: 20,
      barFillThickness: 3,
      infoPadding: 30,

      // Variables for easier accessing in functions
      width: null,
      height: null,
      keys: null
    };
  },
  computed: {
    currentPlayer() {
      const { players, currentPlayerIndex } = this.gameState;
      return players[currentPlayerIndex];
    }
  },

  /*  ---  */

  /*  ---  */

  /*  ---  ****  ---  ****  ---  ---   ENVIRONMENT OF COMPONENT   ---  ---  ****  ---  ****  ---  */

  created() {
    this.socket = this.$root.socket;

    // TODO: Many more specific updates
    // TODO: updatePlayer(id, "newdata")
    // This should just recieve: position
    // TODO: shootBullet("newdata")
    // Not interested in id?
    // This should just recieve: position, power & direction (client draws parabola)
    // TODO: updateMap or updateState?
    // Since Map will update on bullet collision (when player has finished their turn),
    // maybe we can update the map along side the other gamestate data that we should emit
    // between each turn?

    // Change gameState when something is emitted
    // TODO: Remove this...

    // Set up event listening
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    this.keys = {
      up: 38,
      down: 40,
      left: 37,
      right: 39,
      space: 32,
      o: 79,
      p: 80
    };
    console.log("game created! epic!");
  },
  destroyed() {
    // Remove event listeners when component is destroyed
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  },
  async mounted() {
    // GET INITIAL GAME STATE
    this.gameState = await this.getInitGameState(this.roomID);

    // SET UP CANVAS
    this.canvas = this.$refs.gameCanvas;
    this.ctx = this.canvas.getContext("2d");

    // Save variables for easier access
    this.hudBarLen = this.gameState.hudBarLen;
    this.barrelThickness = this.gameState.barrelThickness;
    this.infoPadding = this.gameState.infoPadding;
    this.hudBarHeight = this.gameState.hudBarHeight;
    this.width = this.gameState.width;
    this.height = this.gameState.height;
    this.$refs.gameCanvas.setAttribute("width", this.width);
    this.$refs.gameCanvas.setAttribute("height", this.height);
    this.draw(this.gameState);

    // SETUP SOCKETS
    this.socket.on("updatePlayer", player => {
      // find the player to change values of
      console.log("hahaha", player.id);
      const changePlayer = this.gameState.players.find(p => p.id === player.id);
      changePlayer.x = player.pos.x;
      changePlayer.y = player.pos.y;
      changePlayer.shootAngle = player.shootAngle;
      changePlayer.shootPower = player.shootPower;
      changePlayer.hp = player.hp;
      changePlayer.score = player.score;
      // Draw screen with new gamestate
      console.log("draw moment");
      this.draw(this.gameState);
    });

    this.socket.on("gameOver", id => {
      // TODO tell who won
      this.gameMsg = `${id} won the game`;
    });

    // interval for animating bullets
    let interval = null;

    this.socket.on("newShot", bullet => {
      // TODO epic do bullet logic, this in incomplete

      interval = setInterval(() => {
        this.animateBulletShot(bullet);
      }, 1000 / 30);
    });

    this.socket.on("explosion", gameScreen => {
      this.gameState.gameScreen = gameScreen;

      clearInterval(interval);
    });
  },

  /*  ---  */

  /*  ---  */

  /*  ---  ****  ---  ****  ---  ---   HANDLING COMPONENT   ---  ---  ****  ---  ****  ---  */

  methods: {
    // for getting initial gamestate
    getInitGameState(roomID) {
      return fetch(`/api/game/gameState/${roomID}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then(res => res.json())
        .then(data => data.gameState)
        .catch(console.error);
    },

    animateBulletShot(bullet) {
      console.log("drawing bullet", bullet.pos.x, bullet.pos.y);
      bullet.velY += this.gameState.gravity;
      bullet.pos.y += bullet.velY;
      bullet.pos.x += bullet.velX;
      this.draw(this.gameState);
      this.drawBullet(bullet);
    },

    // draw everything with the current gamestate
    draw(gameState) {
      this.drawTerrain(gameState);
      this.drawPlayers(gameState);
      this.drawHud(gameState);
    },

    // Eventlisteners
    handleKeyDown(e) {
      const playerBools = {
        barrelRight: false,
        barrelLeft: false,
        tankLeft: false,
        tankRight: false,
        pwrUp: false,
        pwrDown: false,
        up: false,
        down: false,
        space: false
      };
      console.log("Some key is down!");
      if (this.currentPlayer.id === this.$store.state.isAuthenticated) {
        console.log("your turn also");
        switch (e.keyCode) {
          case this.keys.down:
            playerBools.barrelLeft = true;
            playerBools.barrelRight = false;
            break;
          case this.keys.up:
            playerBools.barrelRight = true;
            playerBools.barrelLeft = false;
            break;
          case this.keys.left:
            playerBools.tankLeft = true;
            playerBools.tankRight = false;
            break;
          case this.keys.right:
            playerBools.tankRight = true;
            playerBools.tankLeft = false;
            break;
          case this.keys.space:
            playerBools.space = true;
            break;
          case this.keys.o:
            playerBools.pwrDown = true;
            playerBools.pwrUp = false;
            break;
          case this.keys.p:
            playerBools.pwrUp = true;
            playerBools.pwrDown = false;
        }
        this.socket.emit("playerBools", {
          roomID: this.roomID,
          id: this.currentPlayer.id,
          playerBools
        });
      }
    },

    handleKeyUp(e) {
      const playerBools = {
        barrelRight: false,
        barrelLeft: false,
        tankLeft: false,
        tankRight: false,
        pwrUp: false,
        pwrDown: false,
        up: false,
        down: false,
        space: false
      };
      if (this.currentPlayer.id === this.$store.state.isAuthenticated) {
        console.log("your turn also");
        switch (e.keyCode) {
          case this.keys.down:
            playerBools.barrelLeft = false;
            break;
          case this.keys.up:
            playerBools.barrelRight = false;
            break;
          case this.keys.left:
            playerBools.tankLeft = false;
            break;
          case this.keys.right:
            playerBools.tankRight = false;
            break;
          case this.keys.space:
            playerBools.space = false;
            break;
          case this.keys.o:
            playerBools.pwrDown = false;
            break;
          case this.keys.p:
            playerBools.pwrUp = false;
        }
        this.socket.emit("playerBools", {
          roomID: this.roomID,
          id: this.currentPlayer.id,
          playerBools
        });
      }
    },
    /*  ---  ****  ---  ****  ---  ---   HELPER METHODS   ---  ---  ****  ---  ****  ---  */

    degreeToRad(degree) {
      return (degree * Math.PI) / 180;
    },

    drawPlayers(gamestate) {
      const { players } = gamestate;
      players.forEach(p => {
        this.drawPlayer(p);
      });
    },

    /*  ---  ****  ---  ****  ---  ---   HELPER METHODS   ---  ---  ****  ---  ****  ---  */

    drawPlayer(p) {
      if (p.hp > 0) {
        this.ctx.translate(p.x + p.width / 2, p.y);

        this.ctx.rotate(-this.degreeToRad(p.shootAngle - 90));

        this.ctx.fillStyle = "black";
        this.ctx.fillRect(
          -p.barrelThickness / 2,
          -p.barrelLen,
          p.barrelThickness,
          p.barrelLen
        );

        this.ctx.rotate(this.degreeToRad(p.shootAngle - 90));

        this.ctx.translate(-(p.x + p.width / 2), -p.y);
        this.ctx.fillStyle = p.colour;
        this.ctx.fillRect(p.x, p.y, p.width, p.height);
      }
    },

    drawBullet(bullet) {
      this.ctx.fillStyle = bullet.colour;
      this.ctx.fillRect(
        bullet.pos.x,
        bullet.pos.y,
        bullet.width,
        bullet.height
      );
    },

    drawTerrain(gameState) {
      const { gameScreen } = gameState;
      this.ctx.fillStyle = gameState.skyColour;
      this.ctx.fillRect(0, 0, gameState.width, gameState.height);
      this.ctx.fillStyle = gameState.groundColor;

      let highest = [0, 0];

      // find first terrain occurence in first column
      highest[1] = gameScreen[0].indexOf(1);
      const highestFirstX = highest[1]; // for the finishing line

      this.ctx.beginPath();
      this.ctx.moveTo(highest[0], highest[1]);

      // follow the path
      while (highest[0] < this.width - 1) {
        highest = this.findNextCoords(highest);
        this.ctx.lineTo(highest[0], highest[1]);
      }

      // edge case
      this.ctx.lineTo(this.width, highest[1]);

      // go to bottom
      while (highest[1] < this.height) {
        highest[1]++;
      }
      this.ctx.lineTo(this.width, this.height);
      this.ctx.lineTo(0, this.height);
      this.ctx.lineTo(0, highestFirstX);
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.fill();
    },

    // help function for drawing terrain
    findNextCoords([x, y]) {
      // up right
      // if last draw was at height 800, we need to decrement it for gameScreen's 0-799 indices
      if (y === this.gameState.height) y--;

      if (this.gameState.gameScreen[x + 1][y]) {
        // there is a pixel beside current to the right
        while (this.gameState.gameScreen[x + 1][y - 1]) {
          y--;
        }
        return [x + 1, y]; // return the highest one
      }

      // down right
      if (!this.gameState.gameScreen[x + 1][y]) {
        while (!this.gameState.gameScreen[x + 1][y]) {
          y++;
          if (y >= this.gameState.height) {
            return [x + 1, this.gameState.height];
          }
        }
        return [x + 1, y];
      }
    },

    drawHud(gameState) {
      const { players } = gameState;
      players.forEach((p, i) => {
        this.ctx.textAlign = "right";
        this.ctx.font = "15px Arial";
        if (p === this.currentPlayer) this.ctx.fillStyle = "red";
        else this.ctx.fillStyle = "black";

        this.ctx.fillText(
          `${(p.id === this.currentPlayer.id ? "> " : "") + p.id} ${Math.round(
            p.score
          )} pts`,
          this.width - this.hudBarLen - this.infoPadding,
          this.infoPadding + this.infoPadding * i
        );

        this.ctx.fillStyle = "grey";
        this.ctx.fillRect(
          this.width - this.hudBarLen - this.infoPadding / 2,
          this.infoPadding / 2 + this.infoPadding * i,
          this.hudBarLen,
          this.hudBarHeight
        );

        this.ctx.fillStyle = p.colour;
        this.ctx.fillRect(
          this.width -
            this.hudBarLen -
            this.infoPadding / 2 +
            this.barFillThickness,
          this.infoPadding / 2 + this.infoPadding * i + this.barFillThickness,
          (this.hudBarLen - this.barFillThickness * 2) * (p.hp / 100),
          this.hudBarHeight - this.barFillThickness * 2
        );
      });

      // Fuel
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(
        this.infoPadding * 2,
        this.infoPadding / 2,
        this.hudBarLen,
        this.hudBarHeight
      );

      this.ctx.textAlign = "left";
      this.ctx.fillText("Fuel", this.infoPadding / 2, this.infoPadding);

      this.ctx.fillStyle = "green";
      this.ctx.fillRect(
        this.infoPadding * 2 + this.barFillThickness,
        this.infoPadding / 2 + this.barFillThickness,
        (this.hudBarLen - this.barFillThickness * 2) *
          (this.currentPlayer.fuel / this.currentPlayer.maxFuel),
        this.hudBarHeight - this.barFillThickness * 2
      );

      // Shoot power
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(
        this.infoPadding * 2,
        this.infoPadding / 2 + this.infoPadding,
        this.hudBarLen,
        this.hudBarHeight
      );

      this.ctx.textAlign = "left";
      this.ctx.fillText(
        "Pwr",
        this.infoPadding / 2,
        this.infoPadding + this.infoPadding
      );
      this.ctx.fillText(
        this.currentPlayer.shootPower,
        (this.infoPadding * 5) / 2 + this.hudBarLen,
        this.infoPadding * 2
      );

      this.ctx.fillStyle = "red";
      this.ctx.fillRect(
        this.infoPadding * 2 + this.barFillThickness,
        this.infoPadding / 2 + this.barFillThickness + this.infoPadding,
        (this.hudBarLen - this.barFillThickness * 2) *
          (this.currentPlayer.shootPower / this.currentPlayer.maxShootPower),
        this.hudBarHeight - this.barFillThickness * 2
      );
    }
  }
};
</script>

<style scoped>
</style>
