import Game from './game.js'

document.getElementById("start-btn").addEventListener("click", () => start(document.getElementById("num-players").value,
                                                                            document.getElementById("width").value,
                                                                            document.getElementById("height").value,
                                                                            document.getElementById("amp").value))


// eslint-disable-next-line no-unused-vars
function start(n, width, height, amp) {
    new Game(n, width, height, amp) //TODO 100 is amplitude, change this to input from user
}
