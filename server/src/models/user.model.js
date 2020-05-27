/**
 * @class User
 */
class User {
  constructor(userID, ip) {
    this.userID = userID;
    // fyller inget syfte?
    this.ip = ip;
    this.socket = null;
    this.currentRoom = null;
    this.timesPlayed = 0;
    this.totalScore = 0;
    this.totalWins = 0;
  }
  setStats(timesPlayed, totalScore, totalWins) {
    this.timesPlayed = timesPlayed;
    this.totalScore = totalScore;
    this.totalWins = totalWins;
  }
  getData() {
    return {
      userID: this.userID,
      currentRoom: this.currentRoom,
      timesPlayed: this.timesPlayed,
      totalScore: this.totalScore,
      totalWins: this.totalWins,
    };
  }
}

module.exports = User;
