const fs = require('fs');

const html = fs.readFileSync('middleware/aaa.html', 'utf-8');

const match = new RegExp(/http:\/\/www.youtube.com\/watch\?v\\u003d([A-z0-9-]+)\\/)
console.log(html.match(match)[1]);