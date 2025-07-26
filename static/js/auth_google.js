document.addEventListener('DOMContentLoaded', function () {
    AuthGoogle();
});


// Получение данных из Google Drive


function AuthGoogle() {
    if (!window.location.pathname.startsWith('/auth/google')) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) {
        document.getElementById('root').textContent = 'Ошибка: код не получен';
        return;
    }

    fetch("http://localhost:8000/api/v1/google/callback", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ code }),
        redirect: "follow"
    })
        .then(res => {
            if (!res.ok) throw new Error('Ошибка при обмене кода');
            // При redirect: 'follow' браузер перейдёт на frontend_url автоматически.
            return res.json();
        })
        .then(data => {
            console.log(data);
            const user = data.user;
            const files = data.files;

            if (!files) {
                root.innerHTML = 'Ошибка: файлы не получены';
                return;
            }


            // Рендерим профиль
            root.innerHTML = `
              <div id="profile">
                <div class="name">${user.name || 'Без имени'}</div>
                <div class="email">${user.email || ''}</div>
                <div class="files">
                  <ul>
                    ${files.map(name => `<li>${name}</li>`).join('')}
                  </ul>
                </div>
              </div>
            `;


        })
        .catch(err => {
            document.getElementById('root').textContent = `Ошибка: ${err.message}`;
        });
}


