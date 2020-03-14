<template>
  <div>
    <p>{{gameMsg}}</p>
    <p v-if="!gameHasEnded">{{timeLeft}} seconds left on the turn!</p>
    <p v-if="gameHasEnded">Destroying game screen in {{timeLeftUntilDestroy}} seconds...</p>
    <div id="screen">
      <canvas ref="gameCanvas" id="gameScreen"></canvas>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    roomID: {
      required: true
    }
  },
  data() {
    return {
      gameMsg:
        "Use all four arrow keys to control your tank. Space to shoot. 'O' and 'P' to lower/higher your shoot power. Your fuel refills 10% every turn. \nGood luck!",
      gameState: null,
      socket: null,
      // bullet interval
      interval: null,
      canvas: null,
      ctx: null,
      timeLeft: null,
      gameHasEnded: false,
      timeLeftUntilDestroy: null,
      destroyGameTimer: null,

      hudBarLen: null,
      hudBarHeight: null,
      infoPadding: null,

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

  beforeDestroy() {
    this.socket.off("updatePlayer");
    this.socket.off("gameOver");
    this.socket.off("changeTurn");
    this.socket.off("newShot");
    this.socket.off("explosion");
    clearInterval(this.interval);
    // Remove event listeners when component is destroyed
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  },

  async mounted() {
    this.socket = this.$root.socket;

    // TODO should not be able to shoot when typing
    this.keys = {
      up: 38,
      down: 40,
      left: 37,
      right: 39,
      space: 32,
      o: 79,
      p: 80
    };
    // GET INITIAL GAME STATE
    this.gameState = await this.getInitGameState(this.roomID);

    // SET UP CANVAS
    this.canvas = this.$refs.gameCanvas;
    this.ctx = this.canvas.getContext("2d");

    // Set up event listening
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

    // Save variables for easier access
    this.hudBarLen = this.gameState.hudBarLen;
    this.barrelThickness = this.gameState.barrelThickness;
    this.infoPadding = this.gameState.infoPadding;
    this.hudBarHeight = this.gameState.hudBarHeight;
    this.width = this.gameState.width;
    this.height = this.gameState.height;
    this.timeLeft = this.gameState.turnLength;
    this.timeLeftUntilDestroy = this.gameState.gameEndTimer;
    this.$refs.gameCanvas.setAttribute("width", this.width);
    this.$refs.gameCanvas.setAttribute("height", this.height);
    this.draw(this.gameState);

    let turnInterval = setInterval(this.decrementTimer, 1000);

    // SETUP SOCKETS
    this.socket.on("updatePlayer", player => {
      // find the player to change values of
      const changePlayer = this.gameState.players.find(p => p.id === player.id);
      changePlayer.x = player.pos.x;
      changePlayer.y = player.pos.y;
      changePlayer.shootAngle = player.shootAngle;
      changePlayer.shootPower = player.shootPower;
      changePlayer.hp = player.hp;
      changePlayer.score = player.score;
      changePlayer.fuel = player.fuel;
      // Draw screen with new gamestate
      this.draw(this.gameState);
    });

    this.socket.on("gameOver", id => {
      this.gameMsg = `${id} won the game!!!!`;
      if (!this.gameHasEnded) {
        this.destroyGameTimer = setInterval(() => {
          this.timeLeftUntilDestroy--;
          if (this.destroyGameTimer == null) {
            clearInterval(this.destroyGameTimer);
          }
        }, 1000);
      }
      this.gameHasEnded = true;
    });

    this.socket.on("changeTurn", currentPlayerIndex => {
      this.gameState.currentPlayerIndex = currentPlayerIndex;
      console.log(this.gameState.currentPlayerIndex);
      console.log("now its player turn: ", this.currentPlayer);
      clearInterval(turnInterval);
      this.timeLeft = this.gameState.turnLength;
      turnInterval = setInterval(this.decrementTimer, 1000);
      this.draw(this.gameState);
    });

    this.socket.on("newShot", bullet => {
      console.log("new shot!", bullet);
      this.interval = setInterval(() => {
        this.animateBulletShot(bullet);
      }, 1000 / 30);
    });

    this.socket.on("explosion", gameScreen => {
      // don't animate bullet anymore
      clearInterval(this.interval);
      this.gameState.gameScreen = gameScreen;

      this.draw(this.gameState);
    });
  },

  /*  ---  ****  ---  ****  ---  ---   HANDLING COMPONENT   ---  ---  ****  ---  ****  ---  */

  methods: {
    decrementTimer() {
      this.timeLeft--;
    },

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
      if (this.currentPlayer.id === this.$store.state.isAuthenticated) {
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
      // If the bullet is in the terrain, don't draw
      if (this.isOutOfBounds(bullet)) {
        return;
      }
      if (
        this.gameState.gameScreen[Math.round(bullet.pos.x)][
          Math.round(bullet.pos.y)
        ]
      ) {
        clearInterval(this.interval);
      }
      this.ctx.fillStyle = bullet.colour;
      this.ctx.fillRect(
        bullet.pos.x,
        bullet.pos.y,
        bullet.width,
        bullet.height
      );
    },

    isOutOfBounds(entity) {
      return entity.pos.x >= this.width || entity.pos.x < 0 || entity.pos.y < 0;
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
        console.log("drawing hud, current player:", this.currentPlayer.id);
        if (p.id === this.currentPlayer.id) this.ctx.fillStyle = "red";
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
          this.width - this.hudBarLen - this.infoPadding / 2,
          this.infoPadding / 2 + this.infoPadding * i,
          this.hudBarLen * (p.hp / 100),
          this.hudBarHeight
        );
      });
      // Fuel
      if (this.currentPlayer.id === this.$store.state.isAuthenticated) {
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
          this.infoPadding * 2,
          this.infoPadding / 2,
          this.hudBarLen *
            (this.currentPlayer.fuel / this.currentPlayer.maxFuel),
          this.hudBarHeight
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
          this.infoPadding * 2,
          this.infoPadding / 2 + this.infoPadding,
          this.hudBarLen *
            (this.currentPlayer.shootPower / this.currentPlayer.maxShootPower),
          this.hudBarHeight
        );
      }
    }
  }
};
</script>

<style>
#gameScreen {
  border: 2px;
  border-color: black;
}
</style>
