// Header
const navbar = document.querySelector('nav');
const toggleBtn = document.querySelector('.toggleBtn');

toggleBtn.addEventListener('click', () => {
  navbar.classList.toggle('active');
});