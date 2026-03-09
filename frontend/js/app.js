// ===== DROPZONE APP.JS =====
const API = '';

// ===== AUTH =====
function getToken() { return localStorage.getItem('dz_token'); }
function getUser() { return JSON.parse(localStorage.getItem('dz_user') || 'null'); }
function setAuth(data) {
  localStorage.setItem('dz_token', data.token);
  localStorage.setItem('dz_user', JSON.stringify(data));
}
function logout() {
  localStorage.removeItem('dz_token');
  localStorage.removeItem('dz_user');
  window.location.href = '/';
}

function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` };
}

// ===== INIT NAV =====
function initNav() {
  const user = getUser();
  const authButtons = document.getElementById('authButtons');
  const userMenu = document.getElementById('userMenu');
  const userName = document.getElementById('userName');
  const adminLink = document.getElementById('adminLink');
  const ordersLink = document.getElementById('ordersLink');

  if (user && user.token) {
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (userName) userName.textContent = user.name?.toUpperCase();
    if (ordersLink) ordersLink.style.display = 'block';
    if (adminLink && user.isAdmin) adminLink.style.display = 'block';
  }

  // Hamburger
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  // Scroll effect
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
  });

  // Cart count
  updateCartCount();
}

// ===== CART =====
function getCart() { return JSON.parse(localStorage.getItem('dz_cart') || '[]'); }
function saveCart(cart) { localStorage.setItem('dz_cart', JSON.stringify(cart)); updateCartCount(); }

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((a, b) => a + b.quantity, 0);
  document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
}

function addToCart(product, size, quantity = 1) {
  const cart = getCart();
  const existing = cart.find(i => i._id === product._id && i.size === size);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ ...product, size, quantity });
  }
  saveCart(cart);
  showToast('Added to cart! 🛒');
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}

// ===== PRODUCT CARD TEMPLATE =====
function productCard(p) {
  const img = p.images && p.images[0] ? p.images[0] : '/images/tshirt1.jpeg';
  return `
    <div class="product-card" onclick="window.location='/pages/product.html?id=${p._id}'">
      <span class="product-card-badge">DROP</span>
      <img src="${img}" alt="${p.name}" class="product-card-img" loading="lazy" />
      <div class="product-card-info">
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-price">₹${p.price}</div>
        <button class="product-card-btn" onclick="event.stopPropagation(); quickAdd('${p._id}')">
          ADD TO CART
        </button>
      </div>
    </div>
  `;
}

async function quickAdd(id) {
  try {
    const res = await fetch(`/api/products/${id}`);
    const p = await res.json();
    const size = p.sizes && p.sizes[0] ? p.sizes[0] : 'M';
    addToCart(p, size);
  } catch(e) { showToast('Error adding to cart'); }
}

// ===== TOAST =====
function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ===== API HELPERS =====
async function apiGet(url) {
  const res = await fetch(API + url, { headers: authHeaders() });
  return res.json();
}

async function apiPost(url, data) {
  const res = await fetch(API + url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', initNav);
