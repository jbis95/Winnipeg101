// Password
const changePassword = () => {
  if (!frm.oldPassword.value || !frm.password.value || !frm.passwordCheck.value) {
    alert('입력란을 모두 입력해주세요');
    return false;
  }
  if (frm.password.value !== frm.passwordCheck.value) {
    alert('비밀번호가 서로 다릅니다');
    return false;
  }
};

// Phone
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
    if (frm.phoneNumber.value) {
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

// My Article & Comment
const all = document.querySelector('.all');
const checkBoxes = document.querySelectorAll('.checkbox');
if (all) {
  all.addEventListener('click', () => {
    if (all.checked === true) {
      checkBoxes.forEach(c => {
        c.checked = true;
      });
    } else {
      checkBoxes.forEach(c => {
        c.checked = false;
      });
    }
  });
}