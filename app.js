// ============================================================
// Umred Canteen 3D — app.js
// Ralph Loop Iteration 3: Order Modal + New Order Form + Toasts
// ============================================================

// ── State ──────────────────────────────────────────────────
let appData = {};
let currentView = 'dashboard';

// ── Three.js ───────────────────────────────────────────────
let scene, camera, renderer, particles;
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

// ── Toast Queue ────────────────────────────────────────────
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>${message}`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ── Init ───────────────────────────────────────────────────
async function initApp() {
    try {
        const cached = localStorage.getItem('canteen_data');
        let rawData;
        if (cached) {
            rawData = JSON.parse(cached);
        } else {
            const response = await fetch('data.json');
            rawData = await response.json();
            localStorage.setItem('canteen_data', JSON.stringify(rawData));
        }

        // Self-Healing Schema Check
        appData = {
            website:    rawData.website    || { currency_symbol: '₹' },
            clients:    rawData.clients    || [],
            categories: rawData.categories || [],
            products:   rawData.products   || [],
            orders:     rawData.orders     || []
        };

        initThreeJS();
        setupNavigation();
        renderView('dashboard');

        window.addEventListener('resize', onWindowResize);
        document.addEventListener('mousemove', onDocumentMouseMove);
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('content-container').innerHTML =
            `<p style="color:red;padding:2rem;">Error loading application data: ${error.message}</p>`;
    }
}

// ── Three.js Background ────────────────────────────────────
function initThreeJS() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.002);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 1000;

    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 2000; i++) {
        vertices.push(
            2000 * Math.random() - 1000,
            2000 * Math.random() - 1000,
            2000 * Math.random() - 1000
        );
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({
        color: 0xff7b00, size: 5, transparent: true, opacity: 0.6, sizeAttenuation: true
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    animate();
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
}

function animate() { requestAnimationFrame(animate); renderThreeJS(); }

function renderThreeJS() {
    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);
    const time = Date.now() * 0.00005;
    particles.rotation.y = time;
    particles.rotation.z = time * 0.5;

    const colorMap = {
        products:   0x228b22,
        orders:     0xffcc00,
        clients:    0x8b4513,
        categories: 0x4169e1
    };
    particles.material.color.setHex(colorMap[currentView] || 0xff7b00);
    renderer.render(scene, camera);
}

// ── Navigation ─────────────────────────────────────────────
function setupNavigation() {
    document.querySelectorAll('.nav-menu li').forEach(item => {
        item.addEventListener('click', e => {
            document.querySelectorAll('.nav-menu li').forEach(n => n.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const view = e.currentTarget.getAttribute('data-view');
            currentView = view;
            gsap.to(camera.position, { z: 500, duration: 0.5, yoyo: true, repeat: 1, ease: 'power2.inOut' });
            renderView(view);
        });
    });
}

// ── View Router ────────────────────────────────────────────
function renderView(view) {
    const container = document.getElementById('content-container');
    const title = document.getElementById('page-title');
    const titleMap = {
        dashboard: 'Dashboard', products: 'Menu (मेन्यू)',
        categories: 'Categories', orders: 'Orders (ऑर्डर्स)', clients: 'Customers (ग्राहक)'
    };
    title.innerText = titleMap[view] || view;
    container.innerHTML = '';
    container.classList.remove('fade-in');
    void container.offsetWidth;
    container.classList.add('fade-in');

    const views = { dashboard: renderDashboard, products: renderProducts, categories: renderCategories, orders: renderOrders, clients: renderClients };
    (views[view] || (() => {}))(container);
}

// ── Dashboard ──────────────────────────────────────────────
function renderDashboard(container) {
    const totalRevenue = appData.orders.reduce((s, o) => s + o.grandTotal, 0);
    const avgOrder = appData.orders.length ? (totalRevenue / appData.orders.length) : 0;
    const topProduct = getTopProduct();
    const sym = appData.website.currency_symbol;

    container.innerHTML = `
        <div class="dashboard-grid">
            <div class="stat-card" style="--accent:#ff7b00">
                <div class="stat-icon">💰</div>
                <h3>Total Revenue</h3>
                <div class="value">${sym}${totalRevenue.toFixed(2)}</div>
                <div class="stat-sub">All time earnings</div>
            </div>
            <div class="stat-card" style="--accent:#228b22">
                <div class="stat-icon">📦</div>
                <h3>Total Orders</h3>
                <div class="value">${appData.orders.length}</div>
                <div class="stat-sub">Orders placed</div>
            </div>
            <div class="stat-card" style="--accent:#4169e1">
                <div class="stat-icon">🍛</div>
                <h3>Menu Items</h3>
                <div class="value">${appData.products.length}</div>
                <div class="stat-sub">${appData.categories.length} categories</div>
            </div>
            <div class="stat-card" style="--accent:#8b4513">
                <div class="stat-icon">🙏</div>
                <h3>Customers</h3>
                <div class="value">${appData.clients.length}</div>
                <div class="stat-sub">Registered clients</div>
            </div>
        </div>

        <div class="dashboard-row">
            <div class="data-table-container dash-table">
                <div class="section-header">
                    <h3>Recent Orders</h3>
                    <button class="btn-primary" onclick="openNewOrderModal()">+ New Order</button>
                </div>
                <table style="margin-top:15px">
                    <thead><tr><th>Order ID</th><th>Client</th><th>Date</th><th>Amount</th><th>Action</th></tr></thead>
                    <tbody>
                        ${appData.orders.slice(-5).reverse().map(o => `
                        <tr>
                            <td><strong>#${o.id}</strong></td>
                            <td>${getClientName(o.clientId)}</td>
                            <td>${o.date}</td>
                            <td><strong>${sym}${o.grandTotal.toFixed(2)}</strong></td>
                            <td><button class="btn-view" onclick="openOrderModal(${o.id})">View</button></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>

            <div class="data-table-container dash-info">
                <h3>Quick Stats</h3>
                <div class="quick-stats">
                    <div class="qs-row"><span>Avg Order Value</span><strong>${sym}${avgOrder.toFixed(2)}</strong></div>
                    <div class="qs-row"><span>Top Item</span><strong>${topProduct}</strong></div>
                    <div class="qs-row"><span>Active Products</span><strong>${appData.products.filter(p => p.active === 1).length}</strong></div>
                    <div class="qs-row"><span>Active Categories</span><strong>${appData.categories.filter(c => c.active === 1).length}</strong></div>
                </div>
                <h3 style="margin-top:1.5rem">Category Breakdown</h3>
                <div class="cat-bars">
                    ${appData.categories.map(cat => {
                        const count = appData.products.filter(p => p.categoryId === cat.id).length;
                        const pct = appData.products.length ? Math.round((count / appData.products.length) * 100) : 0;
                        return `<div class="cat-bar-row">
                            <span>${cat.name}</span>
                            <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${pct}%"></div></div>
                            <span>${count}</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

function getTopProduct() {
    const counts = {};
    appData.orders.forEach(o => o.items.forEach(item => {
        counts[item.productId] = (counts[item.productId] || 0) + item.quantity;
    }));
    const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const p = appData.products.find(p => p.id === Number(topId));
    return p ? p.name : 'N/A';
}

function getClientName(id) {
    const c = appData.clients.find(c => c.id === id);
    return c ? c.name : 'Unknown';
}

// ── Products ───────────────────────────────────────────────
function renderProducts(container) {
    const sym = appData.website.currency_symbol;
    container.innerHTML = `
        <div class="data-table-container">
            <div class="section-header">
                <h3>Menu Items</h3>
                <div class="search-wrap"><input id="product-search" type="text" placeholder="Search menu…" oninput="filterProducts()" class="search-input"></div>
            </div>
            <div id="products-list">
                ${renderProductsTable(appData.products, sym)}
            </div>
        </div>`;
}

function renderProductsTable(products, sym) {
    if (!products.length) return `<p style="padding:2rem;text-align:center;color:var(--text-muted)">No items found.</p>`;
    const getCatName = id => (appData.categories.find(c => c.id === id) || {}).name || 'Unknown';
    return `<table style="margin-top:15px">
        <thead><tr><th>#</th><th>Name</th><th>Category</th><th>Qty</th><th>Rate</th><th>Status</th></tr></thead>
        <tbody>
            ${products.map(p => `<tr>
                <td>${p.id}</td>
                <td><strong>${p.name}</strong></td>
                <td><span class="cat-tag">${getCatName(p.categoryId)}</span></td>
                <td>${p.quantity}</td>
                <td>${sym}${p.rate}</td>
                <td><span class="status-badge ${p.active === 1 ? 'status-active' : 'status-inactive'}">${p.active === 1 ? 'Active' : 'Inactive'}</span></td>
            </tr>`).join('')}
        </tbody>
    </table>`;
}

function filterProducts() {
    const q = document.getElementById('product-search').value.toLowerCase();
    const filtered = appData.products.filter(p => p.name.toLowerCase().includes(q));
    document.getElementById('products-list').innerHTML = renderProductsTable(filtered, appData.website.currency_symbol);
}

// ── Categories ─────────────────────────────────────────────
function renderCategories(container) {
    container.innerHTML = `
        <div class="data-table-container">
            <div class="section-header"><h3>Categories</h3></div>
            <table style="margin-top:15px">
                <thead><tr><th>ID</th><th>Category Name</th><th>Items</th><th>Status</th></tr></thead>
                <tbody>
                    ${appData.categories.map(c => `<tr>
                        <td>${c.id}</td>
                        <td><strong>${c.name}</strong></td>
                        <td>${appData.products.filter(p => p.categoryId === c.id).length} items</td>
                        <td><span class="status-badge ${c.active === 1 ? 'status-active' : 'status-inactive'}">${c.active === 1 ? 'Active' : 'Inactive'}</span></td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

// ── Orders ─────────────────────────────────────────────────
function renderOrders(container) {
    const sym = appData.website.currency_symbol;
    container.innerHTML = `
        <div class="data-table-container">
            <div class="section-header">
                <h3>All Orders</h3>
                <button class="btn-primary" onclick="openNewOrderModal()">+ New Order</button>
            </div>
            <table style="margin-top:15px">
                <thead><tr><th>Order ID</th><th>Client</th><th>Date</th><th>Items</th><th>Grand Total</th><th>Action</th></tr></thead>
                <tbody>
                    ${appData.orders.slice().reverse().map(o => `<tr>
                        <td><strong>#${o.id}</strong></td>
                        <td>${getClientName(o.clientId)}</td>
                        <td>${o.date}</td>
                        <td>${o.items.length} items</td>
                        <td><strong>${sym}${o.grandTotal.toFixed(2)}</strong></td>
                        <td>
                            <button class="btn-view" onclick="openOrderModal(${o.id})">View</button>
                            <button class="btn-danger" onclick="deleteOrder(${o.id})">Delete</button>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

// ── Clients ────────────────────────────────────────────────
function renderClients(container) {
    container.innerHTML = `
        <div class="data-table-container">
            <div class="section-header">
                <h3>Customers (ग्राहक)</h3>
                <button class="btn-primary" onclick="openAddClientModal()">+ Add Customer</button>
            </div>
            <table style="margin-top:15px">
                <thead><tr><th>Name</th><th>Gender</th><th>Contact</th><th>Address</th><th>Orders</th></tr></thead>
                <tbody>
                    ${appData.clients.map(c => `<tr>
                        <td><strong>${c.name}</strong></td>
                        <td>${c.gender || '-'}</td>
                        <td>${c.contact}</td>
                        <td>${c.address}</td>
                        <td>${appData.orders.filter(o => o.clientId === c.id).length}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

// ── Order Detail Modal ─────────────────────────────────────
function openOrderModal(orderId) {
    const order = appData.orders.find(o => o.id === orderId);
    if (!order) return;
    const sym = appData.website.currency_symbol;
    const getProductName = id => (appData.products.find(p => p.id === id) || {}).name || 'Unknown';

    const html = `
        <div class="modal-overlay" id="modal-overlay" onclick="closeModal()">
            <div class="modal glass-effect" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>Order #${order.id}</h2>
                    <button class="modal-close" onclick="closeModal()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="order-meta">
                        <div class="meta-item"><label>Client</label><span>${getClientName(order.clientId)}</span></div>
                        <div class="meta-item"><label>Date</label><span>${order.date}</span></div>
                        <div class="meta-item"><label>Sub Total</label><span>${sym}${order.subTotal.toFixed(2)}</span></div>
                        <div class="meta-item"><label>VAT</label><span>${sym}${order.vat.toFixed(2)}</span></div>
                    </div>
                    <h3 style="margin:1.5rem 0 1rem">Order Items</h3>
                    <table>
                        <thead><tr><th>Product</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead>
                        <tbody>
                            ${order.items.map(item => `<tr>
                                <td>${getProductName(item.productId)}</td>
                                <td>${item.quantity}</td>
                                <td>${sym}${item.rate}</td>
                                <td><strong>${sym}${item.total.toFixed(2)}</strong></td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                    <div class="grand-total-row">
                        <span>Grand Total</span>
                        <strong class="grand-total-value">${sym}${order.grandTotal.toFixed(2)}</strong>
                    </div>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    gsap.fromTo('#modal-overlay .modal', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
}

// ── New Order Modal ────────────────────────────────────────
function openNewOrderModal() {
    const today = new Date().toISOString().split('T')[0];
    const sym = appData.website.currency_symbol;

    const html = `
        <div class="modal-overlay" id="modal-overlay" onclick="closeModal()">
            <div class="modal glass-effect modal-large" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>🧾 New Order</h2>
                    <button class="modal-close" onclick="closeModal()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Client</label>
                            <select id="order-client" class="form-control">
                                <option value="">Select client…</option>
                                ${appData.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Date</label>
                            <input type="date" id="order-date" value="${today}" class="form-control">
                        </div>
                    </div>

                    <h3 style="margin:1.5rem 0 1rem">Add Items</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Product</label>
                            <select id="item-product" class="form-control">
                                <option value="">Select product…</option>
                                ${appData.products.filter(p => p.active === 1).map(p =>
                                    `<option value="${p.id}" data-rate="${p.rate}">${p.name} (${sym}${p.rate})</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Quantity</label>
                            <input type="number" id="item-qty" value="1" min="1" class="form-control">
                        </div>
                        <div class="form-group" style="align-self:flex-end">
                            <button class="btn-primary" onclick="addOrderItem()">+ Add Item</button>
                        </div>
                    </div>

                    <div id="order-items-list" style="margin-top:1rem"></div>

                    <div class="grand-total-row" id="order-total-display" style="display:none">
                        <span>Grand Total (incl. 5% VAT)</span>
                        <strong class="grand-total-value" id="order-total-value">${sym}0.00</strong>
                    </div>

                    <div style="margin-top:1.5rem;text-align:right">
                        <button class="btn-cancel" onclick="closeModal()">Cancel</button>
                        <button class="btn-primary" onclick="submitOrder()" style="margin-left:1rem">✅ Place Order</button>
                    </div>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    gsap.fromTo('#modal-overlay .modal', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
}

// Temporary cart for new order
let orderCart = [];

function addOrderItem() {
    const sel = document.getElementById('item-product');
    const productId = Number(sel.value);
    const qty = Number(document.getElementById('item-qty').value);
    if (!productId || qty < 1) { showToast('Please select a product and quantity.', 'error'); return; }

    const product = appData.products.find(p => p.id === productId);
    const existing = orderCart.find(i => i.productId === productId);
    if (existing) {
        existing.quantity += qty;
        existing.total = existing.quantity * existing.rate;
    } else {
        orderCart.push({ productId, quantity: qty, rate: product.rate, total: qty * product.rate, name: product.name });
    }
    renderOrderCart();
}

function removeOrderItem(productId) {
    orderCart = orderCart.filter(i => i.productId !== productId);
    renderOrderCart();
}

function renderOrderCart() {
    const sym = appData.website.currency_symbol;
    const list = document.getElementById('order-items-list');
    const totalDisplay = document.getElementById('order-total-display');
    const totalValue = document.getElementById('order-total-value');

    if (!orderCart.length) {
        list.innerHTML = '';
        totalDisplay.style.display = 'none';
        return;
    }

    const subTotal = orderCart.reduce((s, i) => s + i.total, 0);
    const vat = subTotal * 0.05;
    const grand = subTotal + vat;

    list.innerHTML = `<table>
        <thead><tr><th>Product</th><th>Qty</th><th>Rate</th><th>Total</th><th></th></tr></thead>
        <tbody>
            ${orderCart.map(item => `<tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${sym}${item.rate}</td>
                <td><strong>${sym}${item.total.toFixed(2)}</strong></td>
                <td><button class="btn-danger btn-sm" onclick="removeOrderItem(${item.productId})">✕</button></td>
            </tr>`).join('')}
        </tbody>
    </table>`;

    totalDisplay.style.display = 'flex';
    totalValue.textContent = `${sym}${grand.toFixed(2)}`;
}

function submitOrder() {
    const clientId = Number(document.getElementById('order-client').value);
    const date = document.getElementById('order-date').value;

    if (!clientId) { showToast('Please select a client.', 'error'); return; }
    if (!date) { showToast('Please select a date.', 'error'); return; }
    if (!orderCart.length) { showToast('Please add at least one item.', 'error'); return; }

    const subTotal = orderCart.reduce((s, i) => s + i.total, 0);
    const vat = parseFloat((subTotal * 0.05).toFixed(2));
    const grandTotal = parseFloat((subTotal + vat).toFixed(2));
    const newId = Math.max(...appData.orders.map(o => o.id), 0) + 1;

    const newOrder = {
        id: newId,
        date,
        clientId,
        subTotal,
        vat,
        grandTotal,
        items: orderCart.map(i => ({ productId: i.productId, quantity: i.quantity, rate: i.rate, total: i.total }))
    };

    appData.orders.push(newOrder);
    orderCart = [];
    saveData();
    closeModal();
    showToast(`Order #${newId} placed successfully! ₹${grandTotal}`, 'success');

    // Refresh current view
    if (currentView === 'orders' || currentView === 'dashboard') {
        renderView(currentView);
    }
}

function deleteOrder(orderId) {
    if (!confirm(`Delete Order #${orderId}? This cannot be undone.`)) return;
    appData.orders = appData.orders.filter(o => o.id !== orderId);
    saveData();
    showToast(`Order #${orderId} deleted.`, 'info');
    renderView('orders');
}

// ── Add Client Modal ───────────────────────────────────────
function openAddClientModal() {
    const html = `
        <div class="modal-overlay" id="modal-overlay" onclick="closeModal()">
            <div class="modal glass-effect" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>🙏 Add Customer</h2>
                    <button class="modal-close" onclick="closeModal()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-group"><label>Name</label><input type="text" id="c-name" class="form-control" placeholder="Customer name"></div>
                    <div class="form-group"><label>Gender</label>
                        <select id="c-gender" class="form-control">
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group"><label>Contact</label><input type="text" id="c-contact" class="form-control" placeholder="10-digit mobile"></div>
                    <div class="form-group"><label>Address</label><input type="text" id="c-address" class="form-control" placeholder="Street, City"></div>
                    <div style="margin-top:1.5rem;text-align:right">
                        <button class="btn-cancel" onclick="closeModal()">Cancel</button>
                        <button class="btn-primary" onclick="submitClient()" style="margin-left:1rem">✅ Save Customer</button>
                    </div>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    gsap.fromTo('#modal-overlay .modal', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
}

function submitClient() {
    const name    = document.getElementById('c-name').value.trim();
    const gender  = document.getElementById('c-gender').value;
    const contact = document.getElementById('c-contact').value.trim();
    const address = document.getElementById('c-address').value.trim();

    if (!name || !contact || !address) { showToast('Please fill all fields.', 'error'); return; }

    const newId = Math.max(...appData.clients.map(c => c.id), 0) + 1;
    appData.clients.push({ id: newId, name, gender, contact, address });
    saveData();
    closeModal();
    showToast(`Customer "${name}" added!`, 'success');
    renderView('clients');
}

// ── Modal Helpers ──────────────────────────────────────────
function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;
    gsap.to(overlay.querySelector('.modal'), {
        opacity: 0, y: 30, duration: 0.25, ease: 'power2.in',
        onComplete: () => { overlay.remove(); orderCart = []; }
    });
}

// ── Persistence ────────────────────────────────────────────
function saveData() {
    localStorage.setItem('canteen_data', JSON.stringify(appData));
}

// ── Start ──────────────────────────────────────────────────
window.onload = initApp;
