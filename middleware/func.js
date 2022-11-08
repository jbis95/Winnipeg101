const menuArrayAlign = (menusOrigin) => {
  let basket = [];
  while (menusOrigin.length !== 0) {
    const shift = menusOrigin.shift();
    if (!shift.parentId) {
      basket.push(shift);
      const children = menusOrigin.filter(c => c.parentId === shift.id);
      if (children.length) {
        children.forEach(c => {
          basket.push(c);
        });
      }
    }
  }
  return basket;
};

const menuArrayAlignOld = async (menusOrigin) => {
  let basket = [];
  while (menusOrigin.length !== 0) {
    const shift = menusOrigin.shift();
    if (!shift.parentId) {
      basket.push(shift);
      const children = menusOrigin.filter(c => c.parentId === shift.id);
      if (children.length) {
        children.forEach(c => {
          basket.push(c);
        });
      }
    }
  }
  return basket;
};

module.exports = {
  menuArrayAlign,
};