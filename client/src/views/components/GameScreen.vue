<template>
  <div>
    <p>Good luck!</p>
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
      required: true,
    },
  },
  data() {
    return {
      gameState: null,
      socket: null,
      canvas: null,
      ctx: null,

      // variables independent of game that shouldn't be in gameState
      hudBarLen: 100,
      hudBarHeight: 20,
      barFillThickness: 3,
      infoPadding: 30,
    };
  },

  async mounted() {
    // Set up vue data
    // TODO cleanup, drawing of screen buggy!
    this.canvas = this.$refs.gameCanvas;
    this.ctx = this.canvas.getContext('2d');
    this.gameState = await this.getGameState(this.roomID);
    this.$refs.gameCanvas.setAttribute('width', this.gameState.width);
    this.$refs.gameCanvas.setAttribute('height', this.gameState.height);
    this.draw(this.gameState);

    console.log(this.$refs.gameCanvas);

    // TODO set up eventlisteners correctly (this is mostly copypasted from game model)
    // Event listeners
        this.keys = {
          up: 38,
            down: 40,
            left: 37,
            right: 39,
            space: 32,
            o: 79,
            p: 80,
        };
        this.keydownListener = this.keydownListener.bind(this);
        this.keyupListener = this.keyupListener.bind(this);

        window.addEventListener('keydown', this.keydownListener);
        window.addEventListener('keyup', this.keyupListener);

    this.socket = this.$root.socket;
    // TODO update screen on a regular interval on the server
    // change gameState when something is emitted
    this.socket.on('gameUpdate', (gameState) => {
      this.gameState = gameState;
      // draw screen with new gamestate
      this.draw(gameState);
    });
  },
  methods: {
    // for getting initial gamestate
   getGameState(roomID) {
      return fetch(`/api/game/gameState/${roomID}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then(res => res.json())
            .then((data) => {
              console.log(data.gameState);
                return data.gameState;
            })
            .catch(console.error);
    },
    updateGameState(roomID) {
      fetch(`/api/game/updateGameState/${roomID}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .catch(console.error);
    },
    // draw everything with the current gamestate
    draw(gameState) {
        this.drawTerrain(gameState);
        this.drawBullets(gameState);
        this.drawPlayers(gameState);
        this.drawHud(gameState);
    },
    drawPlayers(gamestate) {
      const { players } = gamestate;
        players.forEach((p) => {
            this.drawPlayer(p);
        });
    },

    // draw function from player.js
    drawPlayer(p) {
        if (p.hp > 0) {
            this.ctx.translate(p.x + p.width / 2, p.y);

            this.ctx.rotate(-this.degreeToRad(p.shootAngle - 90));

            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(-p.barrelThickness / 2, -p.barrelLen, p.barrelThickness, p.barrelLen);

            this.ctx.rotate(this.degreeToRad(p.shootAngle - 90));

            this.ctx.translate(-(p.x + p.width / 2), -(p.y));
            this.ctx.fillStyle = p.colour;
            this.ctx.fillRect(p.x, p.y, p.width, p.height);
        }
    },

    drawBullets(gameState) {
      const { bullets } = gameState;
        bullets.forEach((b) => {
            this.drawBullet(b);
        });
    },

    drawBullet(bullet) {
        this.ctx.fillStyle = bullet.colour;
        this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
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

        if (this.gameState.gameScreen[x + 1][y]) { // there is a pixel beside current to the right
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
      const {
        players, infoPadding, barFillThickness, hudBarLen,
        } = gameState;
      players.forEach((p, i) => {
          this.ctx.textAlign = 'right';
          this.ctx.font = '15px Arial';
          if (p === this.currentPlayer) this.ctx.fillStyle = 'red';
          else this.ctx.fillStyle = 'black';

          this.ctx.fillText(`${(p.id === this.currentPlayer.id ? '> ' : '') + p.name} ${Math.round(p.score)} pts`,
            this.width - hudBarLen - infoPadding,
            infoPadding + infoPadding * i);

          this.ctx.fillStyle = 'grey';
          this.ctx.fillRect(this.width - hudBarLen - infoPadding / 2,
            infoPadding / 2 + infoPadding * i,
            hudBarLen,
            this.hudBarHeight);

          this.ctx.fillStyle = p.colour;
          this.ctx.fillRect(this.width - hudBarLen - infoPadding / 2 + barFillThickness,
            infoPadding / 2 + infoPadding * i + barFillThickness,
            (hudBarLen - barFillThickness * 2) * (p.hp / 100),
            this.hudBarHeight - barFillThickness * 2);
      });

      // Fuel
      this.ctx.fillStyle = 'black';
      this.ctx.fillRect(infoPadding * 2, infoPadding / 2, hudBarLen, this.hudBarHeight);

      this.ctx.textAlign = 'left';
      this.ctx.fillText('Fuel', infoPadding / 2, infoPadding);

      this.ctx.fillStyle = 'green';
      this.ctx.fillRect(infoPadding * 2 + barFillThickness,
        infoPadding / 2 + barFillThickness,
        (hudBarLen - barFillThickness * 2)
          * (this.currentPlayer.fuel / this.currentPlayer.maxFuel),
        this.hudBarHeight - barFillThickness * 2);

      // Shoot power
      this.ctx.fillStyle = 'black';
      this.ctx.fillRect(infoPadding * 2,
        infoPadding / 2 + infoPadding,
        hudBarLen,
        this.hudBarHeight);

      this.ctx.textAlign = 'left';
      this.ctx.fillText('Pwr', infoPadding / 2, infoPadding + infoPadding);
      this.ctx.fillText(this.currentPlayer.shootPower,
        infoPadding * 5 / 2 + hudBarLen,
        infoPadding * 2);

      this.ctx.fillStyle = 'red';
      this.ctx.fillRect(infoPadding * 2 + barFillThickness,
        infoPadding / 2 + barFillThickness + infoPadding,
        (hudBarLen - barFillThickness * 2)
        * (this.currentPlayer.shootPower / this.currentPlayer.maxShootPower),
        this.hudBarHeight - barFillThickness * 2);
    },

    degreeToRad(degree) {
        return (degree * Math.PI / 180);
    },
  // Eventlisteners
  // TODO set up eventlisteners correctly (this is mostly copypasted from game model)
  keydownListener(e) {
        const mT = this.currentPlayer.moveTank;
        switch (e.keyCode) {
            case this.keys.down:
                mT.barrelLeft = true;
                break;
            case this.keys.up:
                mT.barrelRight = true;
                break;
            case this.keys.left:
                mT.tankLeft = true;
                mT.tankRight = false;
                break;
            case this.keys.right:
                mT.tankRight = true;
                mT.tankLeft = false;
                break;
            case this.keys.space:
                if (this.bullets.length === 0) {
                    this.bullets.push(this.currentPlayer.shoot());
                }
                break;
            case this.keys.o:
                this.currentPlayer.powerDir.down = true;
                this.currentPlayer.powerDir.up = false;
                break;
            case this.keys.p:
                this.currentPlayer.powerDir.down = false;
                this.currentPlayer.powerDir.up = true;
        }
    },

    keyupListener(e) {
        const mT = this.currentPlayer.moveTank;
        switch (e.keyCode) {
            case this.keys.down:
                mT.barrelLeft = false;
                break;
            case this.keys.up:
                mT.barrelRight = false;
                break;
            case this.keys.left:
                mT.tankLeft = false;
                break;
            case this.keys.right:
                mT.tankRight = false;
                break;
            case this.keys.o:
                this.currentPlayer.powerDir.down = false;
                break;
            case this.keys.p:
                this.currentPlayer.powerDir.up = false;
        }
    },
  },

  computed: {
  currentPlayer() {
    const { players, currentPlayerIndex } = this.gameState;
      return players[currentPlayerIndex];
  },
  },
};
</script>

<style scoped>
</style>
