const more = document.querySelectorAll('.more')
const domainSellListContainer = document.querySelectorAll('.domainSellListContainer');

const getDomain = (id, domainName) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/domain/getDomain');
    xhr.onload = () => {
      const result = JSON.parse(xhr.responseText);
      resolve(result);
    };
    const data = {
      id,
      domainName,
    };
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ data }));
  });
};

const domainBuy = (id, buyerName, buyerPhone, buyerEmail, content) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/domain/buy');
    xhr.onload = () => {
      const result = JSON.parse(xhr.responseText);
      resolve(result);
    };
    const data = {
      id,
      buyerName,
      buyerPhone,
      buyerEmail,
      content,
    };
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ data }));
  });
};

const modalContainer = document.querySelector('.modalContainer');
const modal = document.querySelector('.modal');
const modalBackground = document.querySelector('.modalBackground');
const modalClose = modal.querySelector('.close');
modalBackground.addEventListener('click', () => {
  modalContainer.style.display = 'none';
});
modalClose.addEventListener('click', () => {
  modalContainer.style.display = 'none';
});

const button = modal.querySelector('button');
button.addEventListener('click', async () => {
  const id = modal.id;
  const buyerName = modal.querySelector('.buyerName').value;
  const buyerPhone = modal.querySelector('.buyerPhone').value;
  const buyerEmail = modal.querySelector('.buyerEmail').value;
  const content = modal.querySelector('.content').value;

  if (!buyerName || !buyerPhone || !buyerEmail || !content) {
    alert('입력란을 모두 입력해주세요');
  } else {
    const result = await domainBuy(id, buyerName, buyerPhone, buyerEmail, content);
    if (result) {
      modalContainer.style.display = 'none';
      alert('성공적으로 신청이 완료되었습니다\n입금대기는 2일입니다\n카카오뱅크 3333014553521 석희경');
    } else {
      modal.style.display = 'none';
      alert('신청이 실패하였습니다');
    }
  }
});

const getDomainList = (type) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/domain/getDomainList');
    xhr.onload = () => {
      const result = JSON.parse(xhr.responseText);
      resolve(result);
    };
    const data = {
      type,
    };
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ data }));
  });
};

const rewriteDomainList = (type, domainList) => {
  const array = [];
  Object.entries(domainSellListContainer).forEach(o => {
    array.push(o[1]);
  });
  const list = array.find(a => a.id === type);
  let line = '';
  line += `<div class="domainSellList">`;
  domainList.forEach(d => {
    line += `<div class="domainInfo" id="${d.id}" status="${d.status}">`;
      line += `<div class="domainName">${d.domainName}</div>`;
      line += `<div class="domainPrice">${Number(d.domainPrice).toLocaleString()}원</div>`;
      if (d.status === 2) {
        line += `<div class="status blue"><입금대기중></div>`;
      } else if (d.status === 0) {
        line += `<div class="status green"><판매완료></div>`;
      }
    line += `</div>`;
  });
  line += `</div>`;
  list.innerHTML = line;
  addEvent();
};

more.forEach(m => {
  m.addEventListener('click', async () => {
    const domainList = await getDomainList(m.id);
    rewriteDomainList(m.id, domainList);
  });
});

const addEvent = () => {
  const domainInfos = document.querySelectorAll('.domainInfo');
  
  domainInfos.forEach(d => {
    d.addEventListener('click', async () => {
      const status = d.getAttribute('status');
      if (status == 1) { // 판매완료가 아니면
        const id = d.id;
        const result = await getDomain(id);
        modalContainer.style.display = 'flex';
        modal.id = result.id;
    
        const domainName = modal.querySelector('.domainName');
        const domainPrice = modal.querySelector('.domainPrice');
    
        const buyerName = modal.querySelector('.buyerName');
        const buyerPhone = modal.querySelector('.buyerPhone');
        const buyerEmail = modal.querySelector('.buyerEmail');
        const content = modal.querySelector('.content');
        buyerName.value = '';
        buyerPhone.value = '';
        buyerEmail.value = '';
        content.value = '';
        
        domainName.innerHTML = `${result.domainName}`;
        domainPrice.innerHTML = `판매가격 ${Number(result.domainPrice).toLocaleString()}원`;
      } else { // 판매완료 된 도메인 이면
        alert('판매완료 된 도메인입니다');
      }
    });
  });
};

const domainLoad = async () => {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  if (params.domain) {
    const result = await getDomain(null, params.domain);
    if (result.status == 1) { // 판매완료가 아니면
      modalContainer.style.display = 'flex';
      modal.id = result.id;
  
      const domainName = modal.querySelector('.domainName');
      const domainPrice = modal.querySelector('.domainPrice');
  
      const buyerName = modal.querySelector('.buyerName');
      const buyerPhone = modal.querySelector('.buyerPhone');
      const buyerEmail = modal.querySelector('.buyerEmail');
      const content = modal.querySelector('.content');
      buyerName.value = '';
      buyerPhone.value = '';
      buyerEmail.value = '';
      content.value = '';
      
      domainName.innerHTML = `${result.domainName}`;
      domainPrice.innerHTML = `판매가격 ${Number(result.domainPrice).toLocaleString()}원`;
    } else { // 판매완료 된 도메인 이면
      alert('판매완료 된 도메인입니다');
    }
  }
};

domainLoad();

addEvent();