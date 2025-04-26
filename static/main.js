// --- Услуги (пример, можно расширить) ---
let serviceOptions = [
    "Снятие колеса с автомобиля 19.5 - 22.5",
    "Установка колеса на автомобиль 19.5 - 22.5",
    "Снятие сдвоенных колес с автомобиля 19.5 - 22.5",
    "Установка сдвоенных колес на автомобиль 19.5 - 22.5",
    "Демонтаж, снятие шины с диска 19.5 - 22.5",
    "Монтаж, установка шины на диск 19.5 - 22.5",
    "Балансировка колеса 17.5-24 дюйма (включая грузики)",
    "Установка заплаты тип 1",
    "Установка грибка, диаметр до 10 мм (Российск.)"
];

// --- Динамическая подгрузка прайса ---
let priceMap = {};
function loadPrice(file) {
    fetch(file)
        .then(resp => resp.json())
        .then(data => {
            priceMap = data;
            const ul = document.getElementById('priceUl');
            ul.innerHTML = '';
            for (const [service, price] of Object.entries(priceMap)) {
                const li = document.createElement('li');
                li.textContent = service + ' — ' + price + ' руб.';
                ul.appendChild(li);
            }
            serviceOptions = Object.keys(priceMap);
            renderServiceSelectors();
        });
}
loadPrice('/static/price.json');
document.getElementById('payment_method').onchange = function() {
    if (this.value === 'агрегатор') {
        loadPrice('/static/price_ds.json');
        document.querySelector('#priceList h3').innerText = 'Прайс (ДС)';
    } else {
        loadPrice('/static/price.json');
        document.querySelector('#priceList h3').innerText = 'Прайс (нал)';
    }
};

// --- Выбор колёс мышкой ---
function getSelectedWheels() {
    return Array.from(document.querySelectorAll('.wheel-img.selected')).map(div => ({
        type: div.getAttribute('data-type'),
        name: div.getAttribute('data-wheel')
    }));
}
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.wheel-img').forEach(div => {
        div.onclick = function() {
            div.classList.toggle('selected');
            renderServiceSelectors();
        };
    });
});

// --- Рендеринг выбора услуг для выбранных колёс ---
function renderServiceSelectors() {
    const checkedWheels = getSelectedWheels();
    const block = document.getElementById('servicesBlock');
    block.innerHTML = '';
    if (checkedWheels.length === 0) {
        block.innerHTML = '<span style="color:#888;">Сначала выберите колёса для работы</span>';
        return;
    }
    checkedWheels.forEach(wheel => {
        const wheelType = wheel.type === 'tractor' ? 'Тягач' : 'Прицеп';
        const div = document.createElement('div');
        div.className = 'services-for-wheel';
        div.innerHTML = `<b>${wheelType}: ${wheel.name}</b><br>`;
        serviceOptions.forEach(service => {
            div.innerHTML += `<label class="service-checkbox"><input type="checkbox" name="service_${wheelType}_${wheel.name}" value="${service}"> ${service} <span style="color:green;">${priceMap[service] ? priceMap[service] + ' руб.' : ''}</span></label><br>`;
        });
        block.appendChild(div);
    });
}

// --- Кнопки и отправка формы ---
document.getElementById('createOrderBtn').onclick = function() {
    document.getElementById('orderForm').style.display = 'block';
    this.style.display = 'none';
};
document.getElementById('cancelBtn').onclick = function() {
    document.getElementById('orderForm').style.display = 'none';
    document.getElementById('createOrderBtn').style.display = 'inline';
    document.getElementById('orderMessage').innerText = '';
};

document.getElementById('orderForm').onsubmit = async function(e) {
    e.preventDefault();
    const tractor_number = document.getElementById('tractor_number').value.trim();
    const trailer_number = document.getElementById('trailer_number').value.trim();
    const payment_method = document.getElementById('payment_method').value;
    const wheels = getSelectedWheels();
    const wheelServices = {};
    wheels.forEach(wheel => {
        const key = wheel.type + '_' + wheel.name;
        wheelServices[key] = Array.from(document.querySelectorAll(`input[name="service_${wheel.type}_${wheel.name}"]:checked`)).map(cb => cb.value);
    });
    const data = {
        tractor_number,
        trailer_number,
        payment_method,
        wheels: wheelServices
    };
    const resp = await fetch('/orders', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    const result = await resp.json();
    document.getElementById('orderMessage').innerText = result.message || result.error;
    document.getElementById('orderForm').reset();
    document.getElementById('orderForm').style.display = 'none';
    document.getElementById('createOrderBtn').style.display = 'inline';
    document.querySelectorAll('.wheel-img.selected').forEach(div => div.classList.remove('selected'));
    renderServiceSelectors();
    loadOrders();
};

// --- Заказы ---
async function loadOrders() {
    try {
        const resp = await fetch('/orders');
        const orders = await resp.json();
        const tbody = document.querySelector('#ordersTable tbody');
        tbody.innerHTML = '';
        if (Array.isArray(orders) && orders.length > 0) {
            orders.forEach(order => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${order.id || ''}</td>
                    <td>${order.vehicle_number || ''}</td>
                    <td>${order.client_id || ''}</td>
                    <td>${order.service_type || ''}</td>
                    <td>${order.payment_method || ''}</td>
                    <td>${order.client_type || ''}</td>
                    <td>${order.created_at ? order.created_at.replace('T',' ').slice(0,16) : ''}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="color:#888;">Нет данных или ошибка загрузки</td></tr>';
        }
    } catch (e) {
        document.querySelector('#ordersTable tbody').innerHTML = '<tr><td colspan="7" style="color:#888;">Ошибка загрузки</td></tr>';
    }
}
document.addEventListener('DOMContentLoaded', loadOrders);
document.getElementById('refreshOrdersBtn').onclick = loadOrders;

// Инициализация
document.addEventListener('DOMContentLoaded', renderServiceSelectors);