const fs = require('fs');
const path = require('path');
const axios = require('axios').default;
const pool = require('./database');

class youtubeClass {
  constructor () {
    this.channelId = null;
    this.apiKey = null;
    this.status = true;
    this.timer = 0;
    this.timerLimit = 15;
    this.statusParse = true;
    this.timerParse = 0;
    this.timerParseLimit = 1;
    this.youtubeLive = null;
  }
  setChannelId (channelId) {
    this.channelId = channelId;
  }
  setApiKey (apiKey) {
    this.apiKey = apiKey;
  }
  async startTimer () {
    const time = setInterval(() => {
      this.timer += 1;
      // console.log(`timer: ${this.timer}`);
    }, 1000);
    setTimeout(() => {
      clearInterval(time);
      this.status = true;
      this.timer = 0;
      this.getLive();
    }, this.timerLimit * 1000 * 60);
  }
  async startTimerParse () {
    const time = setInterval(() => {
      this.timerParse += 1;
      // console.log(`timerParse: ${this.timerParse}`);
    }, 1000);
    setTimeout(() => {
      clearInterval(time);
      this.statusParse = true;
      this.timerParse = 0;
      this.getLiveParse();
    }, this.timerParseLimit * 1000 * 60);
  }
  async getYoutubeInfo () {
    const conn = await pool.getConnection();
    try {
      const [youtubeResult, ] = await conn.query(`SELECT * FROM plugin_youtube ORDER BY id DESC LIMIT 1`);
      if (youtubeResult.length) {
        const youtubeInfo = youtubeResult[0];
        return youtubeInfo;
      } else {
        return null;
      }
    } finally {
      conn.release();
    }
  }
  async getLive () {
    try {
      if (this.status) {
        this.status = false;
        const youtubeInfo = await this.getYoutubeInfo();
        this.setChannelId(youtubeInfo.channelId);
        this.setApiKey(youtubeInfo.apiKey);
        return new Promise((resolve, reject) => {
          let videoId = null;
          let youtubeUrl = null;
          axios.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${this.channelId}&type=video&eventType=live&key=${this.apiKey}`)
            .catch(e => {
              console.log('Youtube API Error');
              // console.log(e);
            })
            .then(response => {
              if (response && response.data && response.data.items && response.data.items.length) {
                videoId = response.data.items[0].id.videoId;
              }
            })
            .finally(async (videoId) => {
              if (videoId) {
                youtubeUrl = `https://www.youtube.com/embed/${videoId}`;
              } else {
                youtubeUrl = null;
              }
              // if (!youtubeUrl) {
              //   youtubeUrl = await this.getLiveParse();
              // }
              this.startTimer();
              resolve(youtubeUrl);
            });
        });
      }
    } catch (e) {
      console.log(e);
    }
  }
  async getLiveParse () {
    try {
      if (this.statusParse) {
        this.statusParse = false;
        const youtubeInfo = await this.getYoutubeInfo();
        this.setChannelId(youtubeInfo.channelId);
        this.setApiKey(youtubeInfo.apiKey);
        const response = await axios.get(`https://www.youtube.com/embed/live_stream?channel=${this.channelId}`);
        const html = response.data;
        let youtubeUrl = null;
        let videoId = null;
        const videoIdMatch = new RegExp(/{\\"videoId\\":\\"([A-z0-9-]+)\\"}/);
        if (html.match(videoIdMatch)) {
          videoId = html.match(videoIdMatch)[1];
          youtubeUrl = `https://www.youtube.com/embed/${videoId}`;
        }
        const videoNonShareMatch = new RegExp(/http:\/\/www.youtube.com\/watch\?v\\u003d([A-z0-9-]+)\\/);
        if (html.match(videoNonShareMatch)) {
          videoId = html.match(videoNonShareMatch)[1];
          youtubeUrl = `https://www.youtube.com/embed/${videoId}`;
        }
        this.youtubeLive = youtubeUrl;
        this.startTimerParse();
        return youtubeUrl;
      } else {
        return false;
      }
    } catch (e) {
      console.log(e);
    }
  }
  getYoutubeLive () {
    return this.youtubeLive;
  }
  getVideoId () {
    if (this.youtubeLive) {
      return this.youtubeLive.replace('https://www.youtube.com/embed/', '');
    } else {
      return null;
    }
  }
}

const youtube = new youtubeClass();

module.exports = youtube;