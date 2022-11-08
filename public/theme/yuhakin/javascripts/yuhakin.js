const body = document.querySelector('body');
// Header
const navbar = document.querySelector('nav');
const toggleBtn = document.querySelector('.toggleBtn');
const modalBackground = document.querySelector('.modalBackground');
const modal = document.querySelector('.navBarContainer');

toggleBtn.addEventListener('click', () => {
  modal.classList.toggle('active');
  body.classList.toggle('modalOpen');
});

modalBackground.addEventListener('click', () => {
  modal.classList.toggle('active');
  if (body.className === 'modalOpen') {
    body.className = '';
  }
});

const modalMainMenu = document.querySelectorAll('.navbarMenu li');
modalMainMenu.forEach(m => {
  m.addEventListener('click', () => {
    const subMenu = m.querySelector('.sub');
    subMenu.classList.toggle('active');
  });
});