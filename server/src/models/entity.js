class Entity {
    constructor() {
    }
    // returns the y-val of the entity (to make up for it falling too hard into the terrain)
    moveToTop(gameScreen) {
        let x = Math.round(this.x + this.width / 2)
        let y = Math.round(this.y + this.height)
        while (gameScreen[x][y]) {
            y--
        }
        this.y = y - this.height + 1
    }

    canMoveRight(gameWidth) {
        return this.x + this.width / 2 < gameWidth - 1
    }
    canMoveLeft() {
        return this.x - 1 + this.width / 2 > 0
    }

    getData() {
        return {
            pos: {
                x: this.x,
                y: this.y,
            }
        }
    }
}

module.exports = Entity;