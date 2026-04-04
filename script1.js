// ── Smooth scroll for nav links ──
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

// ── Hero slider dots ──
const dots = document.querySelectorAll('.hero-dots span');
let current = 0;

function setDot(index) {
  dots.forEach(d => d.classList.remove('on'));
  if (dots[index]) dots[index].classList.add('on');
  current = index;
}

document.querySelector('.hero-nav .nav-btn:last-child')?.addEventListener('click', () => {
  setDot((current + 1) % dots.length);
});

document.querySelector('.hero-nav .nav-btn:first-child')?.addEventListener('click', () => {
  setDot((current - 1 + dots.length) % dots.length);
});

// ── Contact form validation ──
document.querySelectorAll('.c-input').forEach(input => {
  input.addEventListener('focus', () => {
    input.style.borderColor = 'rgba(78,203,196,0.7)';
    input.style.background = 'rgba(210,242,244,0.75)';
  });
  input.addEventListener('blur', () => {
    input.style.borderColor = '';
    input.style.background = '';
  });
});

// ── Pricing book now buttons ──
document.querySelectorAll('.btn-book').forEach(btn => {
  btn.addEventListener('click', function() {
    const pkg = this.closest('.price-card').querySelector('.price-name').textContent;
    this.textContent = 'Booked!';
    this.style.background = '#4ecbc4';
    setTimeout(() => {
      this.textContent = 'book now';
      this.style.background = '';
    }, 2000);
  });
});

// ── Scroll reveal animation ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.feat-card, .price-card, .contact-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// ── PRE-ORDER button pulse ──
const preorder = document.querySelector('.btn-preorder');
if (preorder) {
  preorder.addEventListener('click', () => {
    preorder.textContent = 'Added to Waitlist!';
    preorder.style.background = '#38b2ac';
    preorder.style.letterSpacing = '0.06em';
    setTimeout(() => {
      preorder.textContent = 'PRE-ORDER';
      preorder.style.background = '';
      preorder.style.letterSpacing = '';
    }, 2500);
  });
}
