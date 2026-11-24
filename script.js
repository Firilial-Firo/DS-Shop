const API_URL = 'https://6ab3d801217e436588316c91.mockapi.io/Items';
const REVIEWS_URL = 'https://6ab3d801217e436588316c91.mockapi.io/Otziv';

// переменная для хранения активного товара
let currentProduct = null;

// элементы окна товара
const productModal = document.querySelector('.product-modal');
const closeProductBtn = document.querySelector('.close-product-btn');
const modalProductTitle = document.querySelector('.modal-product-title');
const modalProductImg = document.querySelector('.modal-product-img');
const modalProductPrice = document.querySelector('.modal-product-price');
const modalProductBuyBtn = document.querySelector('.modal-product-buy-btn');
const modalVideoSection = document.querySelector('.modal-video-section');
const modalVideoContainer = document.querySelector('.modal-video-container');
const productReviewsContainer = document.querySelector('.product-reviews-container');
const productReviewForm = document.querySelector('.product-review-form');

// функция закрытия модалки товара (с остановкой видео)
function closeProductModal() {
  productModal.style.display = 'none';
  currentProduct = null;
  // очистка плеера, чтобы звук не продолжал воспроизводиться в фоне
  modalVideoContainer.innerHTML = '';
}

closeProductBtn.addEventListener('click', closeProductModal);

window.addEventListener('click', (e) => {
  if (e.target === productModal) {
    closeProductModal();
  }
});

// загрузка товаров
async function loadProducts() {
  const container = document.querySelector('.products-container');

  try {
    const response = await fetch(API_URL);
    const products = await response.json();

    container.innerHTML = '';

    products.forEach(item => {
      const card = document.createElement('div');
      card.style.cursor = 'pointer';

      card.innerHTML = `
        <img src="${item.imgUrl}" alt="${item.name}">
        <h3>${item.name}</h3>
        <p>${item.price} душ</p>
        <button class="buy-btn">Купить</button>
      `;

      // клик по кнопке "Купить" кладет в инвентарь
      card.querySelector('.buy-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(item.name, item.price);
      });

      // клик по карточке открывает окно товара с отзывами
      card.addEventListener('click', () => {
        openProductModal(item);
      });

      container.appendChild(card);
    });

  } catch (error) {
    console.error('Ошибка загрузки:', error);
    container.innerHTML = '<p style="color: red; grid-column: 1/-1; text-align: center;">Не удалось загрузить товары.</p>';
  }
}

// открытие модалки конкретного товара
function openProductModal(item) {
  currentProduct = item;

  modalProductTitle.textContent = item.name;
  modalProductImg.src = item.imgUrl;
  modalProductImg.alt = item.name;
  modalProductPrice.textContent = `${Number(item.price).toLocaleString()} душ`;

  // покупка из модалки
  modalProductBuyBtn.onclick = () => addToCart(item.name, item.price);

  // видеообзор
  if (item.videoUrl && item.videoUrl.trim() !== '') {
    modalVideoSection.style.display = 'block';

    let videoSrc = item.videoUrl;

    if (videoSrc.includes('watch?v=')) {
      videoSrc = videoSrc.replace('watch?v=', 'embed/');
    } else if (videoSrc.includes('youtu.be/')) {
      videoSrc = videoSrc.replace('youtu.be/', 'www.youtube.com/embed/');
    }

    if (videoSrc.includes('youtube.com')) {
      modalVideoContainer.innerHTML = `
        <iframe 
          src="${videoSrc}" 
          title="Видеообзор ${item.name}" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      `;
    } else {
      modalVideoContainer.innerHTML = `<video controls src="${videoSrc}"></video>`;
    }
  } else {
    modalVideoSection.style.display = 'none';
    modalVideoContainer.innerHTML = '';
  }

  // загрузка отзывов по ID предмета из MockAPI
  loadReviewsForProduct(item.id);

  productModal.style.display = 'flex';
}

// загрузка отзывов по itemId из MockAPI
async function loadReviewsForProduct(itemId) {
  productReviewsContainer.innerHTML = '<p style="text-align: center; color: #888;">Считывание знаков...</p>';

  try {
    const res = await fetch(REVIEWS_URL);
    const reviews = await res.json();

    productReviewsContainer.innerHTML = '';

    const productReviews = reviews.filter(rev => String(rev.itemId) === String(itemId));

    if (productReviews.length === 0) {
      productReviewsContainer.innerHTML = '<p style="text-align: center; color: #777;">Пока никто не начертал послание об этом реликте.</p>';
      return;
    }

    productReviews.reverse().forEach(rev => {
      const item = document.createElement('div');
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <strong style="color: #c49a45;">${rev.author}</strong>
          <span>${'⭐'.repeat(Number(rev.rating) || 5)}</span>
        </div>
        <p style="margin: 0; font-size: 14px; line-height: 1.4;">${rev.text}</p>
      `;
      productReviewsContainer.appendChild(item);
    });
  } catch (err) {
    console.error('Ошибка загрузки отзывов:', err);
    productReviewsContainer.innerHTML = '<p style="color: #ff5555; text-align: center;">Не удалось загрузить отзывы.</p>';
  }
}

// отправка отзыва
productReviewForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentProduct) return;

  const authorInput = e.target.querySelector('.review-author');
  const textInput = e.target.querySelector('.review-text');
  const ratingInput = e.target.querySelector('.review-rating');

  const reviewObject = {
    itemId: currentProduct.id,
    author: authorInput.value,
    text: textInput.value,
    rating: ratingInput.value
  };

  try {
    const res = await fetch(REVIEWS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewObject)
    });

    if (res.ok) {
      authorInput.value = '';
      textInput.value = '';
      loadReviewsForProduct(currentProduct.id);
    }
  } catch (err) {
    console.error('Ошибка отправки отзыва:', err);
  }
});

// корзина
let cart = JSON.parse(localStorage.getItem('ds_cart')) || [];

function saveCart() {
  localStorage.setItem('ds_cart', JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const count = cart.length;
  const total = cart.reduce((sum, item) => sum + Number(item.price), 0);

  document.querySelector('.cart-count').textContent = count;
  document.querySelector('.cart-total').textContent = total.toLocaleString();
  document.querySelector('.modal-cart-total').textContent = `${total.toLocaleString()} душ`;

  const listContainer = document.querySelector('.cart-items-list');
  listContainer.innerHTML = '';

  if (cart.length === 0) {
    listContainer.innerHTML = '<p style="text-align: center; color: #777;">Инвентарь пуст</p>';
    return;
  }

  cart.forEach((item, index) => {
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: #222; padding: 8px 12px; border-radius: 4px;';
    row.innerHTML = `
      <span>${item.name}</span>
      <div style="display: flex; gap: 10px; align-items: center;">
        <span style="color: #c49a45;">${Number(item.price).toLocaleString()} душ</span>
        <button onclick="removeFromCart(${index})" style="background: none; border: none; color: #ff5555; cursor: pointer;">✕</button>
      </div>
    `;
    listContainer.appendChild(row);
  });
}

function addToCart(name, price) {
  cart.push({ name, price });
  saveCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
}

// Модалка инвентаря
const cartModal = document.querySelector('.cart-modal');
document.querySelector('.open-cart-btn').addEventListener('click', () => cartModal.style.display = 'flex');
document.querySelector('.close-cart-btn').addEventListener('click', () => cartModal.style.display = 'none');
document.querySelector('.clear-cart-btn').addEventListener('click', () => {
  cart = [];
  saveCart();
});
document.querySelector('.checkout-btn').addEventListener('click', () => {
  if (cart.length === 0) return alert('Ваш инвентарь пуст!');
  alert('Сделка совершена! Души обращены в снаряжение.');
  cart = [];
  saveCart();
  cartModal.style.display = 'none';
});

// Закрытие корзины по клику вне окна
window.addEventListener('click', (e) => {
  if (e.target === cartModal) cartModal.style.display = 'none';
});

// Инициализация
updateCartUI();
loadProducts();