// Delete Button Confirm
const deleteBtn = document.querySelectorAll('button[value="delete"]');
deleteBtn.forEach(b => {
  b.addEventListener('click', (e) => {
    if (!confirm('삭제 확인')) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  });
});

const withdrawBtn = document.querySelector('button[value="withdraw"]');
if (withdrawBtn) {
  withdrawBtn.addEventListener('click', (e) => {
    if (!confirm('탈퇴 확인')) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  });
}

const getUser = () => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/getUser');
    xhr.onload = () => {
      const result = JSON.parse(xhr.responseText);
      resolve(result);
    };
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();
  });
};

const getLang = async () => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        const result = JSON.parse(xhr.responseText);
        resolve(result);
      } else {
        console.error(xhr.responseText);
      }
    };
    xhr.open('GET', '/api/getLang');
    xhr.send();
  });
};

const getCountryCode = async () => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        const result = xhr.responseText;
        resolve(result);
      } else {
        console.error(xhr.responseText);
      }
    };
    xhr.open('GET', '/api/getCountryCode');
    xhr.send();
  });
};

const usePermissionImage = async () => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        const result = JSON.parse(xhr.responseText);
        resolve(result);
      } else {
        console.error(xhr.responseText);
      }
    };
    xhr.open('GET', '/api/usePermissionImage');
    xhr.send();
  });
};