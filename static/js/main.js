const API_BASE = 'http://localhost:8000/api/v1';

let currentUser = null;
let authToken = localStorage.getItem('authToken');
let isLogin = true;
let pictures = [];
let cart = [];
let currentOffset = 0;
let currentLimit = 6;

document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    loadPictures();
    loadCart();

});

function checkAuth() {
    if (authToken) {
        fetch(`${API_BASE}/users/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Token invalid');
                }
            })
            .then(user => {
                currentUser = user;
                updateAuthUI();
            })
            .catch(error => {
                localStorage.removeItem('authToken');
                authToken = null;
            });
    }
}

function buttonLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (currentUser) {
        logoutBtn.onclick = logout;
    }
}

// Изменение кнопок Войти и Выйти
function updateAuthUI() {
    const authBtn = document.getElementById('authBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (currentUser) {
        authBtn.innerHTML = `<i class="fas fa-user-circle"></i> ${currentUser.username}`;
        authBtn.onclick      = null;
        logoutBtn.style.display = '';
        logoutBtn.onclick = logout;
    } else {
        authBtn.innerHTML = '<i class="fas fa-user"></i> Войти';
        authBtn.onclick = openAuthModal;
        logoutBtn.style.display = 'none';
        logoutBtn.onclick      = null;

    }
}

function openAuthModal() {
    document.getElementById('authModal').style.display = 'block';
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function toggleAuthMode() {
    isLogin = !isLogin;
    const title = document.getElementById('authTitle');
    const submitText = document.getElementById('authSubmitText');
    const switchText = document.getElementById('authSwitchText');
    const switchLink = document.getElementById('authSwitch');
    const emailGroup = document.getElementById('emailGroup');
    const emailInput = document.getElementById('email');
    const password2Group = document.getElementById('password2Group');
    const password2Input = document.getElementById('password2');

    if (isLogin) {
        title.textContent = 'Вход';
        submitText.textContent = 'Войти';
        switchText.textContent = 'Нет аккаунта?';
        switchLink.textContent = 'Зарегистрироваться';
        emailGroup.style.display = 'none';
        emailInput.required = false;
        password2Group.style.display = 'none';
        password2Input.required = false;

    } else {
        title.textContent = 'Регистрация';
        submitText.textContent = 'Зарегистрироваться';
        switchText.textContent = 'Уже есть аккаунт?';
        switchLink.textContent = 'Войти';
        emailGroup.style.display = 'block';
        password2Group.style.display = 'block';
        password2Input.required = true;
    }
}

// Аутентификация пользователя и настройка LocalStorage
document.getElementById('authForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const password2 = document.getElementById('password2').value;
    const email = document.getElementById('email').value;

    if (isLogin) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        fetch(`${API_BASE}/login`, {
            method: 'POST',
            body: formData
        })
            .then(async response => {
                const data = await response.json();
                if (!response.ok) {
                    // Формируем строку из деталей ошибки:
                    return Promise.reject(data);
                }
                // Успех
                authToken = data.access_token;
                localStorage.setItem('authToken', authToken);
                closeAuthModal();
                checkAuth();
                showMessage('Вход выполнен!', 'success');
            })
            .catch(err => {
                // Даже сетевую ошибку можно показать пользователю
                const text = err.detail || err.toString();
                showMessage(`${text}`, 'error');
            });
    } else {
        fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password,
                password2: password2
            })
        })
            .then(async response => {
                const data = await response.json();
                if (!response.ok) {
                    // Формируем строку из деталей ошибки:
                    return Promise.reject(data);
                }
                // Успех
                authToken = data.access_token;
                localStorage.setItem('authToken', authToken);
                closeAuthModal();
                checkAuth();
                showMessage('Регистрация успешна!', 'success');
            })
            .catch(err => {
                // Даже сетевую ошибку можно показать пользователю
                const text = err.detail || err.toString();
                showMessage(`${text}`, 'error');
            });
    }
});

function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    updateAuthUI();
    cart = [];
    updateCartUI();
    showMessage('Вы вышли из системы', 'success');
}

function loadPictures(reset = true) {
    if (reset) {
        currentOffset = 0;
    }

    const sortBy = document.getElementById('sortBy').value;
    const order = document.getElementById('order').value;
    const limit = parseInt(document.getElementById('limit').value);
    currentLimit = limit;

    const loading = document.getElementById('loading');
    loading.classList.remove('hidden');

    const params = new URLSearchParams({
        offset: currentOffset,
        limit: limit,
        sort_by: sortBy,
        order: order
    });

    fetch(`${API_BASE}/pictures?${params}`)
        .then(response => response.json())
        .then(data => {
            if (reset) {
                pictures = data;
                renderPictures(data, true);
            } else {
                pictures = [...pictures, ...data];
                renderPictures(data, false);
            }

            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (data.length === limit) {
                loadMoreBtn.style.display = 'block';
                currentOffset += limit;
            } else {
                loadMoreBtn.style.display = 'none';
            }
            refreshCart();
        })
        .catch(error => {
            showMessage('Ошибка загрузки картин', 'error');
        })
        .finally(() => {
            loading.classList.add('hidden');
        });
}

function refreshCart() {
    cart = cart.map(item => {
        const picture = pictures.find(p => p.id === item.pictureId);
        return {...item, picture};
    });
    updateCartUI();
}

function loadMorePictures() {
    loadPictures(false);
}

function renderPictures(pics, clearGrid) {
    const grid = document.getElementById('picturesGrid');
    if (clearGrid) {
        grid.innerHTML = '';
    }
    const BACKEND = 'http://127.0.0.1:8000';
    pics.forEach(picture => {
        const card = document.createElement('div');
        card.className = 'picture-card';
        card.innerHTML = `
          <div class="picture-image">
            ${BACKEND + picture.imageUrl ?
            `<img src="${BACKEND + picture.imageUrl}" alt="${picture.title}" style="width: 100%; height: 100%; object-fit: cover;">` :
            '<i class="fas fa-image"></i>'
        }
          </div>
          <div class="picture-info">
            <div class="picture-title">${picture.title}</div>
            <div class="picture-author">Автор: ${picture.author}</div>
            <div class="picture-description">${picture.description || 'Описание не указано'}</div>
            <div class="picture-price">${picture.price} $</div>
            <div class="picture-actions">
              <button class="btn btn-primary btn-small" onclick="addToCart(${picture.id})">
                <i class="fas fa-cart-plus"></i>
                В корзину
              </button>
              <button class="btn btn-secondary btn-small" onclick="viewPicture(${picture.id})">
                <i class="fas fa-eye"></i>
                Подробнее
              </button>
            </div>
          </div>
        `;
        grid.appendChild(card);
    });
}

function viewPicture(pictureId) {
    const picture = pictures.find(p => p.id === pictureId);
    if (!picture) return;

    document.getElementById('pictureTitle').textContent = picture.title;
    const details = document.getElementById('pictureDetails');
    details.innerHTML = `
        <img src="${picture.imageUrl}" alt="${picture.title}" style="width: 100%; border-radius: 10px; margin-bottom: 1rem;">
        <p><strong>Автор:</strong> ${picture.author}</p>
        <p><strong>Описание:</strong> ${picture.description || 'Нет описания'}</p>
        <p><strong>Цена:</strong> ${picture.price} ₽</p>
      `;
    document.getElementById('pictureModal').style.display = 'block';
}

function closePictureModal() {
    document.getElementById('pictureModal').style.display = 'none';
}

function loadCart() {
    if (!authToken) {
        cart = [];
        updateCartUI();
        return;
    }

    fetch(`${API_BASE}/cart`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
        .then(response => response.json())
        .then(data => {
            cart = data || [];
            const pictureIds = cart.map(item => item.pictureId);
            loadMissingPictures(pictureIds);
            updateCartUI();
        })
        .catch(error => {
            console.error('Error loading cart:', error);
        });
}

function loadMissingPictures(ids) {
    const missingIds = ids.filter(id => !pictures.some(p => p.id === id));

    if (missingIds.length === 0) return;

    fetch(`${API_BASE}/pictures?ids=${missingIds.join(',')}`)
        .then(response => response.json())
        .then(data => {
            pictures = [...pictures, ...data];
        });
}

function addToCart(pictureId) {
    if (!authToken) {
        showMessage('Необходимо войти в систему', 'error');
        openAuthModal();
        return;
    }

    fetch(`${API_BASE}/cart`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            picture_id: pictureId,
            quantity: 1
        })
    })
        .then(response => response.json())
        .then(data => {
            if (!pictures.some(p => p.id === pictureId)) {
                const newPicture = data.picture; // Предполагаем, что сервер возвращает объект картины
                if (newPicture) {
                    pictures.push(newPicture);
                }
            }
            loadCart();
            showMessage('Товар добавлен в корзину!', 'success');
        })
        .catch(error => {
            showMessage('Ошибка добавления в корзину', 'error');
        });
}

function updateCartQuantity(itemId, quantity) {
    if (quantity <= 0) {
        removeFromCart(itemId);
        return;
    }

    fetch(`${API_BASE}/cart/${itemId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({quantity: quantity})
    })
        .then(response => {
            if (response.ok) {
                loadCart();
            } else {
                showMessage('Ошибка обновления количества', 'error');
            }
        })
        .catch(error => {
            showMessage(error.message);
        });
}

function removeFromCart(itemId) {
    fetch(`${API_BASE}/cart/${itemId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
        .then(response => {
            if (response.ok) {
                loadCart();
                showMessage('Товар удален из корзины', 'success');
            } else {
                showMessage('Ошибка удаления товара', 'error');
            }
        })
        .catch(error => {
            showMessage('Ошибка удаления товара', 'error');
        });
}

function updateCartUI() {
    const cartContent = document.getElementById('cartContent');
    const cartTotal = document.getElementById('cartTotal');
    const totalAmount = document.getElementById('totalAmount');
    const cartBadge = document.getElementById('cartBadge');

    if (cart.length === 0) {
        cartContent.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">Корзина пуста</p>';
        cartTotal.style.display = 'none';
        cartBadge.textContent = '0';
        return;
    }

    let total = 0;
    cartContent.innerHTML = cart.map(item => {
        // Находим картину по ID в глобальном массиве pictures
        const picture = pictures.find(p => p.id === item.pictureId);

        if (!picture) {
            return `<div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-title">Неизвестная картина (ID: ${item.pictureId})</div>
        </div>
      </div>`;
        }

        const itemTotal = picture.price * item.quantity;
        total += itemTotal;

        return `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-title">${picture.title}</div>
          <div class="cart-item-price">${picture.price} ₽ x ${item.quantity}</div>
          <div class="quantity-controls">
            <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">-</button>
            <span>${item.quantity}</span>
            <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
          </div>
        </div>
        <button class="btn btn-secondary btn-small" onclick="removeFromCart(${item.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    }).join('');

    totalAmount.textContent = `${total} ₽`;
    cartTotal.style.display = 'block';
    cartBadge.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

function openCart() {
    document.getElementById('cartSidebar').classList.add('open');
}

function closeCart() {
    document.getElementById('cartSidebar').classList.remove('open');
}

function checkout() {
    if (!authToken) {
        showMessage('Необходимо войти в систему', 'error');
        openAuthModal();
        return;
    }
    openOrderModal();

    fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
        .then(response => {
            if (response.ok) {
                showMessage('Заказ успешно оформлен!', 'success');
                clearCart();
            } else {
                showMessage('Ошибка оформления заказа', 'error');
            }
        })
        .catch(error => {
            showMessage('Ошибка оформления заказа', 'error');
        });
}

function openOrderModal() {
    const missingPictures = cart.some(item => !pictures.find(p => p.id === item.pictureId));
    if (missingPictures) {
        showMessage('Загружаем информацию о товарах...', 'info');
        loadPictures(true); // Загружаем картины заново
        setTimeout(() => openOrderModal(), 1000); // Повторяем попытку через 1 секунду
        return;
    }

    let total = 0;
    let itemsHTML = '';


    cart.forEach(item => {
        const picture = pictures.find(p => p.id === item.pictureId);
        if (!picture) return;

        const itemTotal = picture.price * item.quantity;
        total += itemTotal;

        itemsHTML += `
      <div class="order-summary-item">
        <span>${picture.title}</span>
        <span>${item.quantity} x ${picture.price} ₽</span>
      </div>
    `;
    });

    // Добавляем блок с товарами в форму
    const orderForm = document.getElementById('orderForm');
    orderForm.innerHTML = `
    <div class="order-summary">
      <h3>Ваш заказ</h3>
      ${itemsHTML}
      <div class="order-summary-item" style="font-weight: bold; border-top: 1px solid #eee; padding-top: 0.5rem;">
        <span>Итого:</span>
        <span>${total} ₽</span>
      </div>
    </div>
    <div class="form-group">
      <label for="address">Адрес доставки</label>
      <input type="text" class="form-control" id="address" required>
    </div>
    <div class="form-group">
      <label for="phone">Телефон</label>
      <input type="tel" class="form-control" id="phone" required>
    </div>
    <button type="submit" class="btn btn-primary" style="width: 100%;">
      <i class="fas fa-check"></i>
      Подтвердить заказ
    </button>
  `;
    document.getElementById('orderModal').style.display = 'block';

}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
}

// Обработчик формы заказа
document.getElementById('orderForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const address = document.getElementById('address').value;
    const phone = document.getElementById('phone').value;

    // Формируем данные заказа
    const orderData = {
        address: address,
        phone: phone,
        items: cart.map(item => {
            const picture = pictures.find(p => p.id === item.pictureId);
            return {
                picture_id: item.pictureId,
                quantity: item.quantity,
                price: picture ? picture.price : 0
            };
        })
    };

    const submitBtn = this.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обработка...';
    submitBtn.disabled = true;

    // Отправляем запрос на создание заказа
    // Отправляем запрос на создание заказа
    fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(orderData)
    })
        .then(async response => {
            if (response.ok) {
                return response.json();
            } else {
                // Пытаемся получить сообщение об ошибке из ответа сервера
                let errorMessage = 'Ошибка оформления заказа';
                try {
                    const errorData = await response.json();
                    if (errorData.detail) {
                        // Если сервер вернул детализированное сообщение
                        errorMessage = errorData.detail;
                    } else if (errorData.err) {
                        // Если сервер вернул сообщение в поле 'err'
                        errorMessage = errorData.err;
                    }
                } catch (e) {
                    // Не удалось распарсить JSON, используем стандартное сообщение
                }
                throw new Error(errorMessage);
            }
        })
        .then(data => {
            showMessage('Заказ успешно оформлен!', 'success');
            clearCart();
            closeOrderModal();
            closeCart();
        })
        .catch(error => {
            showMessage(error.detail, 'error');
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Подтвердить заказ';
            submitBtn.disabled = false;
        });
});

function clearCart() {
    return fetch(`${API_BASE}/cart`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
        .then(response => {
            if (response.ok) {
                cart = [];
                updateCartUI();
                return true;
            } else {
                throw new Error('Ошибка очистки корзины');
            }
        })
        .catch(error => {
            showMessage(error.message, 'error');
            reject(error);
        })
        ;
}

function showMessage(text, type = 'success') {
    const container = document.getElementById('messageContainer');
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    container.appendChild(message);
    container.classList.remove('hidden');

    setTimeout(() => {
        message.style.opacity = '0';
        setTimeout(() => {
            container.removeChild(message);
            if (container.children.length === 0) {
                container.classList.add('hidden');
            }
        }, 500);
    }, 5000);
}
