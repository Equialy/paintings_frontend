// Выбор элементов
const galleryBtn = document.getElementById('gallery-btn');
const cartBtn = document.getElementById('cart-btn');
const authBtn = document.getElementById('auth-btn');
const mainContent = document.getElementById('main-content');

// Функция для отображения галереи
function showGallery() {
    mainContent.innerHTML = `
    <h2>Галерея</h2>
    <p>Ознакомьтесь с нашей коллекцией красивых картин.</p>
  `;
}

// Функция для отображения корзины
function showCart() {
    mainContent.innerHTML = `
    <h2>Корзина</h2>
    <p>Ваша корзина пуста.</p>
  `;
}

// Функция для отображения формы логина
function showLogin() {
    mainContent.innerHTML = `
    <h2>Вход</h2>
    <form>
      <label for="username">Имя пользователя:</label>
      <input type="text" id="username" name="username"><br>
      <label for="password">Пароль:</label>
      <input type="password" id="password" name="password"><br>
      <button type="button" onclick="handleLogin()">Войти</button>
    </form>
  `;
}

// Функция обработки логина
function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    alert(`Вход с именем: ${username} и паролем: ${password}`);
}

// Слушатели событий для кнопок
galleryBtn.addEventListener('click', showGallery);
cartBtn.addEventListener('click', showCart);
authBtn.addEventListener('click', showLogin);

// Начальное отображение
showGallery();

// Войти через Google

function loginWithGoogle() {
    window.location.href = "http://localhost:8000/api/v1/google/url"
}

