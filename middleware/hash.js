const hash = (number) => {
  if (number === 0) {
    return undefined;
  } else if (number <= 1) {
    return Math.random().toString(36).substr(2, number);
  } else if (number < 4) {
    while (true) {
      let totalNumber = 0;
      let totalString = 0;
      const result = Math.random().toString(36).substr(2, number);
      for (let i = 0; i < result.length; i ++) {
        // console.log(result[i], result[i].match(/[0-9]/) !== null);
        result[i].match(/[0-9]/) !== null ? totalNumber += 1 : totalString += 1;
      }
      if (totalNumber >= 1 && totalString >= 1) return result;
    }
  } else {
    while (true) {
      let totalNumber = 0;
      let totalString = 0;
      // const result = Math.random().toString(36).substr(2, number);
      const result = Math.random().toString(36).substr(2, number);
      // console.log(result);
      for (let i = 0; i < result.length; i ++) {
        // console.log(result[i], result[i].match(/[0-9]/) !== null);
        result[i].match(/[0-9]/) !== null ? totalNumber += 1 : totalString += 1;
      }
      if (totalNumber >= 2 && totalString >= 2) return result;
    }
  }
};

module.exports = hash;