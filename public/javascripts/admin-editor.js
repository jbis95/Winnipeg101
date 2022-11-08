const selectBox = document.getElementById('board');
const categoriesBox = document.getElementById('category');

const rewriteCategories = async (categories) => {
  let line = ``;
  categories.forEach(c => {
    line += `<option value="${c.id}">${c.title}</option>`
  });
  categoriesBox.innerHTML = line;
};

const deleteCategories = async (categories) => {
  let line = ``;
  categoriesBox.outerHTML = line;
};

const getCategories = (selected) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/getCategories');
    xhr.onload = () => {
      const result = JSON.parse(xhr.responseText);
      resolve(result);
    };
    const data = {
      selected,
    };
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ data }));
  });
};

selectBox.addEventListener('load', async () => {
  const selected = selectBox.value;
  const categories = await getCategories(selected);
  rewriteCategories(categories);
});

selectBox.addEventListener('change', async () => {
  const selected = selectBox.value;
  // console.log(selected);
  const categories = await getCategories(selected);
  if (categories) {
    rewriteCategories(categories);
  } else {
    deleteCategories();
  }
});

const main = async () => {
  try {
    const selected = selectBox.value;
    const categories = await getCategories(selected);
    rewriteCategories(categories);
  } catch (e) {
    console.log(e);
  }
};

main();