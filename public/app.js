const API = '/api/v1';

const UNITS = {
    LENGTH: ['INCH', 'FEET', 'YARD', 'CM'],
    VOLUME: ['ML', 'LITRE', 'GALLON'],
    WEIGHT: ['GRAM', 'KG', 'TONNE'],
    TEMPERATURE: ['CELSIUS', 'FAHRENHEIT', 'KELVIN'],
};

const ALL_UNITS = Object.values(UNITS).flat();

let token = sessionStorage.getItem('token');
let userName = sessionStorage.getItem('userName');

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

async function api(method, path, body = null) {
    const opts = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API}${path}`, opts);
    const data = await res.json();
    return { status: res.status, data };
}

function toast(msg, type = 'success') {
    const el = $('#toast');
    el.textContent = msg;
    el.className = `toast toast-${type}`;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
}

function populateSelects() {
    const selects = [
        '#convertFrom', '#convertTo',
        '#cmpUnit1', '#cmpUnit2',
        '#calcUnit1', '#calcUnit2', '#calcTarget',
    ];

    selects.forEach(sel => {
        const el = $(sel);
        el.innerHTML = '';
        Object.entries(UNITS).forEach(([type, units]) => {
            const group = document.createElement('optgroup');
            group.label = type;
            units.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u;
                opt.textContent = u;
                group.appendChild(opt);
            });
            el.appendChild(group);
        });
    });
}

function showAuth() {
    $('#authView').style.display = '';
    $('#mainView').style.display = 'none';
    $('#navUser').style.display = 'none';
}

function showMain() {
    $('#authView').style.display = 'none';
    $('#mainView').style.display = '';
    $('#navUser').style.display = '';
    $('#navUserName').textContent = userName || '';
    populateSelects();
    loadFavorites();
}

function switchSection(name) {
    $$('.section').forEach(s => s.style.display = 'none');
    $(`#${name}Section`).style.display = '';
    $$('.sidebar-btn').forEach(b => b.classList.toggle('active', b.dataset.section === name));
    if (name === 'history') loadHistory(1);
    if (name === 'favorites') loadFavorites();
}

$$('.auth-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
        $$('.auth-tabs .tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const isLogin = tab.dataset.tab === 'login';
        $('#loginForm').style.display = isLogin ? '' : 'none';
        $('#registerForm').style.display = isLogin ? 'none' : '';
        $('#authError').style.display = 'none';
    });
});

$('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#loginEmail').value.trim();
    const password = $('#loginPassword').value;
    const { status, data } = await api('POST', '/auth/login', { email, password });

    if (status === 200 && data.success) {
        token = data.data.accessToken;
        userName = data.data.user.firstName;
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('userName', userName);
        showMain();
    } else {
        $('#authError').textContent = data.error?.message || 'Login failed';
        $('#authError').style.display = '';
    }
});

$('#registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        firstName: $('#regFirstName').value.trim(),
        lastName: $('#regLastName').value.trim(),
        email: $('#regEmail').value.trim(),
        password: $('#regPassword').value,
    };
    const { status, data } = await api('POST', '/auth/register', body);

    if (status === 201 && data.success) {
        toast('Account created! Please sign in.');
        $$('.auth-tabs .tab')[0].click();
        $('#loginEmail').value = body.email;
        $('#loginPassword').value = '';
    } else {
        $('#authError').textContent = data.error?.message || data.message || 'Registration failed';
        $('#authError').style.display = '';
    }
});

$('#btnLogout').addEventListener('click', () => {
    token = null;
    userName = null;
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userName');
    showAuth();
});

$$('.sidebar-btn').forEach(btn => {
    btn.addEventListener('click', () => switchSection(btn.dataset.section));
});

$('#btnSwapUnits').addEventListener('click', () => {
    const from = $('#convertFrom');
    const to = $('#convertTo');
    const temp = from.value;
    from.value = to.value;
    to.value = temp;
});

$('#btnConvert').addEventListener('click', async () => {
    const value = parseFloat($('#convertValue').value);
    const sourceUnit = $('#convertFrom').value;
    const targetUnit = $('#convertTo').value;

    if (isNaN(value)) { toast('Enter a value', 'error'); return; }

    const { status, data } = await api('POST', '/measure/convert', { value, sourceUnit, targetUnit });

    if (status === 200 && data.success) {
        const r = data.data;
        const el = $('#convertResult');
        el.innerHTML = `
            <div class="result-value">${r.resultValue} ${r.resultUnit}</div>
            <div class="result-label">${value} ${sourceUnit} = ${r.resultValue} ${r.resultUnit}</div>
        `;
        el.style.display = '';
        $('#btnSaveFav').style.display = '';
    } else {
        toast(data.error?.message || 'Conversion failed', 'error');
    }
});

$('#btnSaveFav').addEventListener('click', () => {
    const sourceUnit = $('#convertFrom').value;
    const targetUnit = $('#convertTo').value;
    $('#favModalInfo').textContent = `${sourceUnit} \u2192 ${targetUnit}`;
    $('#favLabel').value = '';
    $('#favModal').style.display = '';
    $('#favLabel').focus();
});

$('#btnFavCancel').addEventListener('click', () => {
    $('#favModal').style.display = 'none';
});

$('#favModal').addEventListener('click', (e) => {
    if (e.target === $('#favModal')) $('#favModal').style.display = 'none';
});

$('#btnFavSave').addEventListener('click', async () => {
    const label = $('#favLabel').value.trim();
    if (!label) { toast('Enter a label', 'error'); return; }

    const sourceUnit = $('#convertFrom').value;
    const targetUnit = $('#convertTo').value;

    const { status, data } = await api('POST', '/users/me/favorites', { label, sourceUnit, targetUnit });

    if (status === 201 && data.success) {
        toast('Saved to favorites');
        $('#favModal').style.display = 'none';
        $('#btnSaveFav').style.display = 'none';
    } else {
        toast(data.error?.message || 'Save failed', 'error');
    }
});

$('#btnCompare').addEventListener('click', async () => {
    const val1 = parseFloat($('#cmpVal1').value);
    const val2 = parseFloat($('#cmpVal2').value);
    const unit1 = $('#cmpUnit1').value;
    const unit2 = $('#cmpUnit2').value;

    if (isNaN(val1) || isNaN(val2)) { toast('Enter both values', 'error'); return; }

    const body = {
        qty1: { value: val1, unit: unit1 },
        qty2: { value: val2, unit: unit2 },
    };

    const { status, data } = await api('POST', '/measure/compare', body);

    if (status === 200 && data.success) {
        const isEqual = data.data.result === 'Equal';
        const el = $('#compareResult');
        el.innerHTML = `
            <div class="result-value ${isEqual ? 'result-equal' : 'result-not-equal'}">
                <i class="fa-solid ${isEqual ? 'fa-equals' : 'fa-not-equal'}"></i>
                ${data.data.result}
            </div>
            <div class="result-label">${val1} ${unit1} ${isEqual ? '=' : '\u2260'} ${val2} ${unit2}</div>
        `;
        el.style.display = '';
    } else {
        toast(data.error?.message || 'Comparison failed', 'error');
    }
});

let selectedOp = 'ADD';
$$('.op-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        $$('.op-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedOp = btn.dataset.op;
    });
});

$('#btnCalc').addEventListener('click', async () => {
    const val1 = parseFloat($('#calcVal1').value);
    const val2 = parseFloat($('#calcVal2').value);
    const unit1 = $('#calcUnit1').value;
    const unit2 = $('#calcUnit2').value;
    const targetUnit = $('#calcTarget').value;

    if (isNaN(val1) || isNaN(val2)) { toast('Enter both values', 'error'); return; }

    const body = {
        op: selectedOp,
        qty1: { value: val1, unit: unit1 },
        qty2: { value: val2, unit: unit2 },
        targetUnit,
    };

    const { status, data } = await api('POST', '/measure/calculate', body);

    if (status === 200 && data.success) {
        const opSymbol = { ADD: '+', SUBTRACT: '\u2212', MULTIPLY: '\u00D7', DIVIDE: '\u00F7' }[selectedOp];
        const el = $('#calcResult');
        el.innerHTML = `
            <div class="result-value">${data.data.resultValue} ${data.data.resultUnit}</div>
            <div class="result-label">${val1} ${unit1} ${opSymbol} ${val2} ${unit2} = ${data.data.resultValue} ${data.data.resultUnit}</div>
        `;
        el.style.display = '';
    } else {
        toast(data.error?.message || 'Calculation failed', 'error');
    }
});

async function loadFavorites() {
    const { status, data } = await api('GET', '/users/me/favorites');
    const container = $('#favList');

    if (status !== 200 || !data.success || !data.data.length) {
        container.innerHTML = `<div class="empty-state"><i class="fa-regular fa-star"></i><p>No favorites yet</p></div>`;
        return;
    }

    container.innerHTML = data.data.map(f => `
        <div class="list-item">
            <div class="list-item-info">
                <div class="list-item-title">${escHtml(f.label)}</div>
                <div class="list-item-sub">${f.sourceUnit} \u2192 ${f.targetUnit}</div>
            </div>
            <div class="list-item-actions">
                <button class="btn-icon" title="Use this conversion" onclick="useFavorite('${f.sourceUnit}','${f.targetUnit}')">
                    <i class="fa-solid fa-arrow-right"></i>
                </button>
                <button class="btn-icon" title="Remove" onclick="deleteFavorite('${f.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

window.useFavorite = function(src, tgt) {
    switchSection('convert');
    $('#convertFrom').value = src;
    $('#convertTo').value = tgt;
    $('#convertValue').focus();
};

window.deleteFavorite = async function(id) {
    const { status } = await api('DELETE', `/users/me/favorites/${id}`);
    if (status === 200) {
        toast('Favorite removed');
        loadFavorites();
    } else {
        toast('Failed to remove', 'error');
    }
};

let historyPage = 1;

async function loadHistory(page = 1) {
    historyPage = page;
    const { status, data } = await api('GET', `/users/me/history?page=${page}&limit=15`);
    const container = $('#historyList');
    const pagEl = $('#historyPagination');

    if (status !== 200 || !data.success || !data.data.length) {
        container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-clock-rotate-left"></i><p>No history yet</p></div>`;
        pagEl.innerHTML = '';
        return;
    }

    container.innerHTML = data.data.map(r => {
        const op = r.operation;
        const badgeClass = `badge-${op.toLowerCase()}`;
        let detail = '';

        if (op === 'CONVERT') {
            detail = `${r.input1Value} ${r.input1Unit} \u2192 ${r.resultValue} ${r.resultUnit}`;
        } else if (op === 'COMPARE') {
            detail = `${r.input1Value} ${r.input1Unit} vs ${r.input2Value} ${r.input2Unit}: ${r.resultString}`;
        } else {
            const sym = { ADD: '+', SUBTRACT: '\u2212', MULTIPLY: '\u00D7', DIVIDE: '\u00F7' }[op] || op;
            detail = `${r.input1Value} ${r.input1Unit} ${sym} ${r.input2Value} ${r.input2Unit} = ${r.resultValue} ${r.resultUnit}`;
        }

        const time = new Date(r.createdAt).toLocaleString();

        return `
            <div class="list-item">
                <div class="list-item-info">
                    <div class="list-item-title">
                        <span class="badge ${badgeClass}">${op}</span>
                    </div>
                    <div class="list-item-sub">${escHtml(detail)}</div>
                </div>
                <div class="list-item-sub">${time}</div>
            </div>
        `;
    }).join('');

    const p = data.pagination;
    if (p.totalPages > 1) {
        pagEl.innerHTML = `
            <button ${p.page <= 1 ? 'disabled' : ''} onclick="loadHistory(${p.page - 1})">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            <span>Page ${p.page} of ${p.totalPages}</span>
            <button ${p.page >= p.totalPages ? 'disabled' : ''} onclick="loadHistory(${p.page + 1})">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        `;
    } else {
        pagEl.innerHTML = '';
    }
}

window.loadHistory = loadHistory;

function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

if (token) {
    showMain();
} else {
    showAuth();
}
