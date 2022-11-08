exports.match = {
  ip: new RegExp(/[0-9]+.[0-9]+.[0-9]+.[0-9]+/ig),
  tag: new RegExp(/<[^>]*>/ig),
  imgTag: new RegExp(/<img([\w\W]+?)>/ig),
  domain: new RegExp(/(?:[a-z0-9ㄱ-ㅎㅏ-ㅣ가-힣](?:[a-z0-9-ㄱ-ㅎㅏ-ㅣ가-힣]{0,61}[a-z0-9ㄱ-ㅎㅏ-ㅣ가-힣])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/ig),
};