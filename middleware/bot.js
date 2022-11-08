const axios = require('axios').default;
const HttpsProxyAgent = require('https-proxy-agent');
const pool = require('./database');

const USER_AGENT = [
  `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15`,
];

class botClass {
  constructor () {
    this.status = false;
    this.proxies = [];
  }
  async setProxies () {
    const conn = await pool.getConnection();
    try {
      const [result, ] = await conn.query(`SELECT * FROM plugin_bot ORDER BY id DESC LIMIT 1`);
      if (result.length) {
        const proxiesInfo = result[0];
        const proxiesRaw = proxiesInfo.proxies;
        const proxyId = proxiesInfo.proxyId;
        const proxyPassword = proxiesInfo.proxyPassword;
        const proxyList = proxiesRaw.split('\r\n');
        let proxies = [];
        proxyList.forEach(p => {
          proxies.push({
            host: p.replace(/([0-9]+.[0-9]+.[0-9]+.[0-9]+):[0-9]+/, '$1'),
            port: p.replace(/[0-9]+.[0-9]+.[0-9]+.[0-9]+:([0-9]+)/, '$1'),
            id: proxyId,
            password: proxyPassword,
          });
        });
        this.proxies = proxies;
      }
    } finally {
      conn.release();
    }
  }
  getProxies () {
    return this.proxies;
  }
  async start () {
    this.status = true;
    await this.setProxies();
    await this.connect();
  }
  stop () {
    this.status = false;
  }
  testConnect () {
    const proxy = this.proxies[0];
    const agent = new HttpsProxyAgent(`http://${proxy.id}:${proxy.password}@${proxy.ip}:${proxy.port}`)
    axios.get(`https://api.my-ip.io/ip`, {
      httpsAgent: agent,
    })
    .then(response => {
      const data = response.data;
      console.log(data);
    })
    .catch(error => {
      console.log(error);
      console.log(error.response.status);
    });
  }
  connect () {
    const proxy = this.proxies[0];
    const httpsAgent = new HttpsProxyAgent(`sockts5://${proxy.host}:${proxy.port}`);
    axios.get('https://api.my-ip.io/ip', {
      httpsAgent,
    })
    .then(response => {
      const data = response.data;
      console.log(`result: ${data}`);
    })
    .catch(error => {
      console.log('error');
      // console.log(error);
    })
    .finally(() => {
      console.log('end');
    });
  }
}

const bot = new botClass();

module.exports = bot;