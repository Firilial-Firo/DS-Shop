const API_URL = 'https://6ab3d801217e436588316c91.mockapi.io/Items';
const REVIEWS_URL = 'https://6ab3d801217e436588316c91.mockapi.io/Otziv';

// 2. Функция, которая запрашивает товары с сервера и рисует их на странице
async function loadProducts() {
  const container = document.getElementById('products-container');

  try {
    // Запрос к MockAPI
    const response = await fetch(API_URL);
    const products = await response.json();

    // Очищаем надпись "Загрузка товаров"
    container.innerHTML = '';

    // По каждому товару и создаем карточку
    products.forEach(item => {
      const card = document.createElement('div');
      
      // Стили для карточки
      card.style.background = '#2c2c2c';
      card.style.border = '1px solid #2c2c2c';
      card.style.borderRadius = '8px';
      card.style.padding = '16px';
      card.style.width = '200px';
      card.style.textAlign = 'center';
      card.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';

      // Внутреннее содержимое карточки
    card.innerHTML = `
  <img src="${item.imgUrl}" alt="${item.name}">
  <h3 style="font-size: 16px; margin: 10px 0;">${item.name}</h3>
  <p style="color: #c5a059; margin-bottom: 10px;">${item.price} душ</p>
  <button onclick="addToCart('${item.name}', ${item.price})">Купить</button>
`;

      container.appendChild(card);
    });

  } catch (error) {
    console.error('Ошибка загрузки:', error);
    container.innerHTML = '<p style="color: red;">Не удалось загрузить товары.</p>';
  }
}
// Функция загрузки и отображения отзывов
async function loadReviews() {
  const container = document.getElementById('reviews-container');

  try {
    const res = await fetch(REVIEWS_URL);
    const reviews = await res.json();

    container.innerHTML = '';

    reviews.reverse().forEach(rev => {
      const item = document.createElement('div');
      item.style.background = '#1a1a1a';
      item.style.border = '1px solid #333';
      item.style.borderRadius = '6px';
      item.style.padding = '12px';
      item.style.color = '#ddd';

      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <strong style="color: #c49a45;">${rev.author}</strong>
          <span>${'⭐'.repeat(Number(rev.rating) || 5)}</span>
        </div>
        <p style="margin: 0; font-size: 14px; line-height: 1.4;">${rev.text}</p>
      `;
      container.appendChild(item);
    });
  } catch (err) {
    console.error('Ошибка загрузки отзывов:', err);
  }
}

// Обработка формы: сборка объекта и отправка методом POST
document.getElementById('review-form').addEventListener('submit', async (e) => {
  e.preventDefault(); // Предотвращаем перезагрузку страницы при отправке

  const authorInput = document.getElementById('review-author');
  const textInput = document.getElementById('review-text');
  const ratingInput = document.getElementById('review-rating');

  // Собираем данные в JavaScript-объект
  const reviewObject = {
    author: authorInput.value,
    text: textInput.value,
    rating: ratingInput.value
  };

  try {
    // Отправляем объект на сервер
    const res = await fetch(REVIEWS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewObject) // превращаем объект в JSON-строку
    });

    if (res.ok) {
      // Очищаем поля формы
      authorInput.value = '';
      textInput.value = '';

      // Перерисовываем список отзывов, чтобы новый сразу появился на экране
      loadReviews();
    }
  } catch (err) {
    console.error('Ошибка отправки отзыва:', err);
  }
});

// Хранилище корзины
let cart = JSON.parse(localStorage.getItem('ds_cart')) || [];

function saveCart() {
  localStorage.setItem('ds_cart', JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const count = cart.length;
  const total = cart.reduce((sum, item) => sum + Number(item.price), 0);

  document.getElementById('cart-count').textContent = count;
  document.getElementById('cart-total').textContent = total.toLocaleString();
  document.getElementById('modal-cart-total').textContent = `${total.toLocaleString()} душ`;

  const listContainer = document.getElementById('cart-items-list');
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

// Управление модальным окном
const modal = document.getElementById('cart-modal');
document.getElementById('open-cart-btn').addEventListener('click', () => modal.style.display = 'flex');
document.getElementById('close-cart-btn').addEventListener('click', () => modal.style.display = 'none');
document.getElementById('clear-cart-btn').addEventListener('click', () => {
  cart = [];
  saveCart();
});
document.getElementById('checkout-btn').addEventListener('click', () => {
  if (cart.length === 0) return alert('Ваш инвентарь пуст!');
  alert('Сделка совершена! Души обращены в снаряжение.');
  cart = [];
  saveCart();
  modal.style.display = 'none';
});

// Первичная отрисовка при загрузке страницы
updateCartUI();

// Запускаем загрузку отзывов вместе со страницей
loadReviews();

// Запускаем функцию при открытии страницы
loadProducts();