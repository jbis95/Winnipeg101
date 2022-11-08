const uIdCheck = (uId) => {
  return new Promise((resolve, reject) => {
    const data = {
      uId,
    };
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        const result = JSON.parse(xhr.responseText);
        resolve(result);
      } else {
        console.error(xhr.responseText);
      }
    };
    xhr.open('POST', '/api/idCheck');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
  });
};

const nickNameCheck = (nickName) => {
  return new Promise((resolve, reject) => {
    const data = {
      nickName,
    };
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        const result = JSON.parse(xhr.responseText);
        resolve(result);
      } else {
        console.error(xhr.responseText);
      }
    };
    xhr.open('POST', '/api/nickNameCheck');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
  });
};

let timeout = null;
const uId = document.querySelector('#uId input');
const nickName = document.querySelector('#nickName input');
const idGuide = document.querySelector('#uId .guide');
const nickNameGuide = document.querySelector('#nickName .guide');
if (uId) {
  uId.addEventListener('keyup', () => {
    clearTimeout(timeout);
    
    timeout = setTimeout(async () => {
      const result = await uIdCheck(frm.uId.value);
      if (frm.uId.value.length >= 6) {
        if (result) {
          idGuide.className = 'guide green marginBottom10';
          idGuide.innerHTML = '생성가능한 아이디 입니다';
          joinBtn.disabled = false;
        } else {
          idGuide.className = 'guide red marginBottom10';
          idGuide.innerHTML = '중복된 아이디 입니다';
          joinBtn.disabled = true;
        }
      } else {
        idGuide.className = 'guide red marginBottom10';
        idGuide.innerHTML = '아이디는 6~15자의 영문소문자, 숫자 입니다';
        joinBtn.disabled = true;
      }
    }, 500);
  });
}

if (nickName) {
  nickName.addEventListener('keyup', () => {
    clearTimeout(timeout);

    timeout = setTimeout(async () => {
      const result = await nickNameCheck(frm.nickName.value);
      if (frm.nickName.value.length >= 6) {
        if (result) {
          nickNameGuide.className = 'guide green marginBottom10';
          nickNameGuide.innerHTML = '생성가능한 닉네임 입니다';
          joinBtn.disabled = false;
        } else {
          nickNameGuide.className = 'guide red marginBottom10';
          nickNameGuide.innerHTML = '중복된 닉네임 입니다';
          joinBtn.disabled = true;
        }
      }
    }, 500);
  });
}

const onSubmit = () => {
  if (!frm.uId.value || !frm.password.value || !frm.passwordCheck.value || !frm.nickName.value || !frm.email.value) {
    alert('입력란을 모두 입력해주세요');
    return false;
  }
  const emailRegex = /[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]$/ig
  if (!frm.email.value.match(emailRegex)) {
    alert('올바른 이메일을 입력해주세요');
    return false;
  }
  if (frm.agreement && !frm.agreement.checked) {
    alert('이용약관 및 개인정보수집 정책에 동의해야 합니다');
    return false;
  }
};