const frm = document.frm;

// Step 1
const allAgreement = document.querySelector('#allAgreement');
if (allAgreement) {
  allAgreement.addEventListener('click', () => {
    if (allAgreement.checked === true) {
      frm.terms.checked = true;
      frm.privacy.checked = true;
      frm.marketing.checked = true;
    } else {
      frm.terms.checked = false;
      frm.privacy.checked = false;
      frm.marketing.checked = false;
    }
  });
}
const checkFormStep1 = () => {
  if (!frm.terms.checked || !frm.privacy.checked) {
    frm.terms.focus();
    alert('필수 동의를 체크해주세요');
    return false;
  }
};

// Step 2
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

let step2Timeout = null;
const step2uId = document.querySelector('#step2 #uId');
const step2uIdGuide = document.querySelector('#step2IdGuide');
const step2Btn = document.querySelector('#step2Btn');
if (step2uId) {
  step2uId.addEventListener('keyup', async () => {
    clearTimeout(step2Timeout);
  
    step2Timeout = setTimeout(async () => {
      const result = await uIdCheck(frm.uId.value);
      if (frm.uId.value.length >= 6) {
        if (result) {
          step2IdGuide.innerHTML = '생성가능한 아이디 입니다';
          step2Btn.disabled = false;
        } else {
          step2IdGuide.innerHTML = '중복된 아이디 입니다';
          step2Btn.disabled = true;
        }
      } else {
        step2IdGuide.innerHTML = '아이디는 6~15자의 영문소문자, 숫자 입니다';
        step2Btn.disabled = true;
      }
    }, 500);
  });
}

const checkFormStep2 = () => {
  if (!frm.uId.value || !frm.password.value || !frm.passwordCheck.value) {
    alert('입력란을 모두 입력해주세요');
    return false;
  }
  if (frm.password.value !== frm.passwordCheck.value) {
    alert('비밀번호가 서로 다릅니다');
    return false;
  }
  if (frm.uId.value.length < 6 || frm.uId.value.length > 15) {
    alert('아이디는 6~15자의 영문소문자, 숫자를 입력해주세요');
    return false;
  }
  if (frm.password.value.length < 8 || frm.password.value.length > 20) {
    alert('패스워드는 8~20자의 영문소문자, 숫자를 입력해주세요');
    return false;
  }
  return true;
};

// Step 3
const phoneVerifySendMessage = (phoneNumber) => {
  const data = {
    phoneNumber,
  };
  const xhr = new XMLHttpRequest();
  xhr.onload = () => {
    if (xhr.status === 200 || xhr.status === 201) {
      const result = JSON.parse(xhr.responseText);
    } else {
      console.error(xhr.responseText);
    }
  };
  xhr.open('POST', '/api/phoneVerify');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify(data));
};

const phoneVerifyComplete = (verifyNumber) => {
  return new Promise((resolve, reject) => {
    const data = {
      verifyNumber,
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
    xhr.open('POST', '/api/phoneVerify/complete');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
  });
};

const phoneVerifyBtn = document.querySelector('.phoneVerifyBtn');
const verifyNumber = document.querySelector('.verifyNumber');
const phoneVerifyCompleteBtn = document.querySelector('.phoneVerifyCompleteBtn');
const phoneNextBtn = document.querySelector('.phoneNextBtn');
if (phoneVerifyBtn) {
  phoneVerifyBtn.addEventListener('click', () => {
    if (frm.phoneNumber.value.length) {
      verifyNumber.className = 'verifyNumber active';
      phoneVerifySendMessage(frm.phoneNumber.value);
      const phoneVerifyCompleteBtn = document.querySelector('.phoneVerifyCompleteBtn');
      phoneVerifyCompleteBtn.className = 'phoneVerifyCompleteBtn active';
    } else {
      alert('휴대폰 번호를 입력해주세요');
    }
  });
}
if (phoneVerifyCompleteBtn) {
  phoneVerifyCompleteBtn.addEventListener('click', async () => {
    const result = await phoneVerifyComplete(verifyNumber.value);
    if (result) {
      phoneNextBtn.className = 'phoneNextBtn active';
    }
  });
}
const checkFormStep3 = () => {
  return true;
};

// Step 4
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

let step4Timeout = null;
const step4NickName = document.querySelector('#step4 #nickName input');
const step4NickNameGuide = document.querySelector('#step4 #nickName .guide');
const step4Btn = document.querySelector('#step4Btn');
if (step4NickName) {
  step4NickName.addEventListener('keyup', async () => {
    clearTimeout(step4Timeout);
  
    step4Timeout = setTimeout(async () => {
      const result = await nickNameCheck(frm.nickName.value);
      if (result) {
        step4NickNameGuide.innerHTML = '생성가능한 닉네임 입니다';
        step4Btn.disabled = false;
      } else {
        step4NickNameGuide.innerHTML = '중복된 닉네임 입니다';
        step4Btn.disabled = true;
      }
    }, 500);
  });
}

const checkFormStep4 = () => {
  if (!frm.nickName.value || !frm.email.value) {
    alert('입력란을 모두 입력해주세요');
    return false;
  }
  const emailRegex = /[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]$/ig
  if (!frm.email.value.match(emailRegex)) {
    alert('올바른 이메일을 입력해주세요');
    return false;
  }
  return true;
};

// Step 5
const checkFormStep5 = () => {
  if (!frm.permission.value || !frm.file.value) {
    alert('입력란을 모두 입력해주세요');
    return false;
  }
};