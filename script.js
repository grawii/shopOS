/* script.js - Part 1: Global State & Image Engine */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx3cgPz1YWymqGxYQKzYCeoaBFWHnS09fJ5h8QEJ8EC9V8SZ8yOJJnB1P41Ix2yahBE/exec";

// 📦 Global State (จำลองแบบ React)
let state = {
    products: JSON.parse(localStorage.getItem('angun_cache')) || [],
    cart: {},
    isAdmin: false,
    currentPass: "1234",
    settings: {
        profileImg: "",
        shopName: "ร้านองุ่นหวาน"
    },
    dropdowns: {
        mainCats: [],
        subCats: [],
        channels: []
    },
    isLoading: true
};

// 🛠 ฟังก์ชันแปลงลิงก์ Drive (ซ่อม Syntax $ ครบถ้วน)
function formatDriveLink(url) {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('drive.google.com')) {
        let fileId = "";
        if (url.includes('id=')) { 
            fileId = url.split('id=')[1].split('&')[0]; 
        } else if (url.includes('/d/')) { 
            fileId = url.split('/d/')[1].split('/')[0]; 
        }
        return fileId ? `https://lh3.googleusercontent.com/d/$${fileId}` : url;
    }
    return url;
}

function initDecors() {
    const container = document.getElementById('deco-container');
    const svgs = [
        `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/></svg>`,
        `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
    ];
    const pos = [{t:10,l:5},{t:15,l:85},{t:40,l:10},{t:45,l:92},{t:70,l:5},{t:75,l:80},{t:25,l:45},{t:90,l:40}];
    if(container) container.innerHTML = pos.map((p, i) => `<div class="floating-deco" style="top:${p.t}%; left:${p.l}%; color:var(--pj-bg); animation-delay:${i*0.4}s">${svgs[i%2]}</div>`).join('');
    const logo = document.getElementById('wave-logo');
    if(logo) logo.innerHTML = "ANGUN WAN".split('').map((c, i) => `<span class="wave-letter" style="--i:${i}">${c===' '?' ':c}</span>`).join('');
}

function updateDropdowns(dropdownData) {
    if(!dropdownData) return;
    const fill = (id, items) => {
        const el = document.getElementById(id);
        if(el) { el.innerHTML = items.filter(x => x && x !== "TaskTypes" && x !== "TaskTypes2" && x !== "Channels").map(item => `<option value="${item}">`).join(''); }
    };
    fill('list-cat', dropdownData.mainCats);
    fill('list-sub', dropdownData.subCats);
    fill('list-net', dropdownData.channels);
}
/* script.js - Part 2: Display & Cart Logic */

function renderCard(p) {
    const rowId = Number(p.row);
    const qty = state.cart[rowId] || 0; 
    const finalPrice = p.price - (p.discount || 0);
    const isLimit = p.limitOne === true || p.limitOne === "YES";
    const previewLink = p.preview || "";
    const hasPreview = previewLink.length > 5;

    return `
        <div class="product-card border border-pj-brown-light/10 shadow-sm">
            ${p.discount > 0 ? `<div class="sale-badge">SALE</div>` : ''}
            <div class="aspect-square rounded-[22px] overflow-hidden mb-3 bg-pj-blue-light/50">
                <img src="${p.image}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/400?text=AngunWan'">
            </div>
            <h4 class="text-[11px] font-bold truncate px-1">${p.name}</h4>
            ${hasPreview ? `<a href="${previewLink}" target="_blank" class="mt-2 mb-2 p-2 bg-pj-blue-light/80 rounded-lg flex items-center justify-center gap-2 text-[10px] text-pj-brown-dark font-bold hover:bg-pj-brown-light/20 transition-all border border-pj-brown-light/10"><i data-lucide="eye" class="w-3.5 h-3.5"></i> ดูตัวอย่าง</a>` : '<div class="h-[2px]"></div>'}
            <div class="mt-1 px-1 flex items-center gap-1 font-bold">
                <span class="text-xs text-pj-brown-dark">${finalPrice}.-</span>
                ${p.discount > 0 ? `<span class="text-[9px] line-through opacity-30">${p.price}.-</span>` : ''}
            </div>
            <div class="mt-3">
                ${qty === 0 ? `<button onclick="updateCart(${rowId}, 1, ${isLimit})" class="w-full py-2 btn-pj-main rounded-xl text-[10px] shadow-md">ใส่ตะกร้า</button>` :
                `<div class="flex items-center justify-between bg-pj-blue-light/60 p-1 rounded-xl">
                    <button onclick="updateCart(${rowId}, -1, ${isLimit})" class="btn-qty-action btn-minus-style">✕</button>
                    <span class="text-xs font-bold">${qty} ชุด</span>
                    <button onclick="updateCart(${rowId}, 1, ${isLimit})" class="btn-qty-action btn-plus-style ${isLimit ? 'opacity-20 pointer-events-none' : ''}">＋</button>
                </div>`}
            </div>
        </div>`;
}

function updateCart(rowId, change, limitOne) {
    const id = Number(rowId);
    const currentQty = state.cart[id] || 0;
    const newQty = currentQty + change;
    if (newQty <= 0) { delete state.cart[id]; } 
    else if (limitOne && change > 0 && currentQty >= 1) { alert("มีสินค้านี้ในตะกร้าแล้ว (จำกัดซื้อได้เพียง 1 ชิ้นจ้า)"); } 
    else { state.cart[id] = newQty; }
    refreshUI();
    if(document.getElementById('cart-modal').classList.contains('active')) renderCartItems();
}

function renderCartItems() {
    const list = document.getElementById('cart-list-items'); let sum = 0;
    list.innerHTML = Object.keys(state.cart).map(rowId => {
        const p = state.products.find(x => Number(x.row) === Number(rowId)); if(!p) return '';
        const qty = state.cart[rowId]; const pricePerUnit = p.price - (p.discount || 0); const totalPrice = pricePerUnit * qty; sum += totalPrice;
        return `<div class="flex flex-col bg-pj-blue-light/40 p-4 rounded-3xl mb-2 shadow-sm"><div class="flex justify-between items-start mb-2"><span class="text-[11px] font-bold">${p.name}</span><button onclick="updateCart(${p.row}, -${qty}, false)" class="btn-qty-action btn-del-style">✕</button></div><div class="flex justify-between items-center border-t border-white/50 pt-2"><div class="flex items-center gap-3 bg-white/50 rounded-xl px-2 py-1"><button onclick="updateCart(${p.row}, -1, false)" class="btn-qty-action btn-minus-style">-</button><span class="text-xs font-bold w-8 text-center">${qty}</span><button onclick="updateCart(${p.row}, 1, false)" class="btn-qty-action btn-plus-style">+</button></div><span class="text-xs font-bold text-pj-brown-dark">${totalPrice}.-</span></div></div>`;
    }).join('') || '<p class="text-center py-10 opacity-30">ไม่มีสินค้าในตะกร้า</p>';
    document.getElementById('cart-sum').innerText = sum;
}

function refreshUI() {
    const totalItems = Object.values(state.cart).reduce((a, b) => a + b, 0);
    const badge = document.getElementById('cart-badge');
    if (badge) {
        badge.innerText = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    renderHome();
    if (window.lucide) lucide.createIcons();
}
/* script.js - Part 3: Sync, Checkout & Admin Management */

async function syncData() {
    try {
        const res = await fetch(SCRIPT_URL);
        const response = await res.json();
        if (response.status === 'success') {
            state.products = response.products.map(p => ({ ...p, image: formatDriveLink(p.image) }));
            localStorage.setItem('angun_cache', JSON.stringify(state.products));
            if (response.settings) {
                const s = response.settings;
                state.settings.profileImg = formatDriveLink(s.ProfileImage || s.profileImg);
                state.settings.shopName = s.ShopName || state.settings.shopName;
                state.currentPass = s.AdminPassword || s.adminPass || state.currentPass;
                if (s.dropdowns) { state.dropdowns = s.dropdowns; updateDropdowns(state.dropdowns); }
            }
            applyStateToUI();
        }
    } catch (e) { console.warn("Sync Error", e); }
}

function applyStateToUI() {
    const imgEl = document.getElementById('shop-profile-img');
    if (imgEl && state.settings.profileImg) imgEl.src = state.settings.profileImg;
    const nameEl = document.getElementById('shop-name-display');
    if (nameEl) nameEl.innerText = state.settings.shopName;
    refreshUI(); 
    renderAdminItems(); // วาดรายการในหน้าแอดมินใหม่
}

function proceedToCheckout() {
    if (Object.keys(state.cart).length === 0) return alert("ตะกร้าว่างเปล่าจ้า");
    toggleCartModal(false); showPage('checkout');
    const itemsList = document.getElementById('checkout-items-list');
    const calcList = document.getElementById('checkout-summary-calc');
    const inputContainer = document.getElementById('checkout-input-container');
    let totalNormal = 0; let totalDiscount = 0; let hasGroupProduct = false; let hasDigitalProduct = false;
    itemsList.innerHTML = Object.keys(state.cart).map(rowId => {
        const p = state.products.find(x => Number(x.row) === Number(rowId));
        const qty = state.cart[rowId]; totalNormal += p.price * qty; totalDiscount += (p.discount || 0) * qty;
        if (p.cat === 'กลุ่ม' || p.cat === 'รวมกลุ่ม') hasGroupProduct = true; else hasDigitalProduct = true;
        return `<div class="flex justify-between items-center p-2 border-b border-pj-brown-light/10"><div class="flex flex-col"><span class="text-xs font-bold">${p.name}</span><span class="text-[10px] opacity-60">จำนวน ${qty} ชุด</span></div><span class="text-xs font-bold">${p.price - (p.discount || 0)}.-</span></div>`;
    }).join('');
    calcList.innerHTML = `<div class="flex justify-between"><span>ราคาปกติ</span><span>${totalNormal}.-</span></div><div class="flex justify-between text-red-500"><span>ส่วนลดทั้งหมด</span><span>-${totalDiscount}.-</span></div>`;
    document.getElementById('checkout-final-sum').innerText = totalNormal - totalDiscount;
    let inputHtml = "";
    if (hasDigitalProduct) inputHtml += `<input type="email" id="cust-email" placeholder="กรอกอีเมล (สกุล @gmail.com เท่านั้น)" class="admin-input mb-3">`;
    if (hasGroupProduct) inputHtml += `<input type="text" id="cust-line" placeholder="ไอดีไลน์ หรือ ลิ้งค์ไลน์ (สำหรับดึงเข้ากลุ่ม)" class="admin-input">`;
    inputContainer.innerHTML = inputHtml;
}

function confirmPurchase() {
    const emailInput = document.getElementById('cust-email'); const lineInput = document.getElementById('cust-line'); let infoParts = [];
    if (emailInput) { if (!emailInput.value.includes('@gmail.com')) return alert("กรุณาใช้อีเมล @gmail.com จ้า"); infoParts.push("📧 Email: " + emailInput.value); }
    if (lineInput) { if (lineInput.value.length < 3) return alert("กรุณากรอกไอดีไลน์จ้า"); infoParts.push("🆔 Line: " + lineInput.value); }
    let message = "🛒 *รายการสั่งซื้อใหม่*\n------------------\n";
    Object.keys(state.cart).forEach(rowId => { const p = state.products.find(x => Number(x.row) === Number(rowId)); message += `- ${p.name} (x${state.cart[rowId]})\n`; });
    message += `------------------\n💰 *ยอดรวม:* ${document.getElementById('checkout-final-sum').innerText} บาท\n👤 *ข้อมูลผู้ซื้อ:* \n${infoParts.join('\n')}`;
    navigator.clipboard.writeText(message).then(() => { alert("สรุปรายการสำเร็จ! ระบบคัดลอกข้อมูลให้แล้ว กำลังส่งคุณไปที่ LINE จ้า"); window.location.href = "https://line.me/ti/p/@309ranuu"; });
}

async function updateProfileImage() {
    const input = document.getElementById('new-profile-url'); const btn = document.querySelector('#profile-modal .btn-pj-main');
    if (!input.value.trim()) return alert("กรุณาวางลิงก์ก่อนจ้า");
    btn.innerText = "กำลังบันทึก..."; btn.disabled = true;
    try {
        await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'saveProfile', url: input.value.trim() }) });
        alert("✨ บันทึกรูปโปรไฟล์ถาวรสำเร็จ!"); closeProfileModal(); setTimeout(syncData, 1500);
    } catch (e) { alert("Error!"); } finally { btn.innerText = "บันทึกรูปภาพ"; btn.disabled = false; }
}

function showPage(id) {
    document.querySelectorAll('.page-container').forEach(p => p.classList.add('hidden-page'));
    const el = document.getElementById('page-'+id); if(el) el.classList.remove('hidden-page');
    const header = document.getElementById('main-header');
    if(id === 'checkout') header.style.display = 'none'; else header.style.display = 'block';
}

function checkAdminStatus() { state.isAdmin ? showPage('admin-panel') : showPage('admin-login'); }
function handleAdminLogin() { if(document.getElementById('admin-pass-input').value === state.currentPass) { state.isAdmin = true; showPage('admin-panel'); } else alert("รหัสผ่านผิดจ้า"); }
function logoutAdmin() { state.isAdmin = false; location.reload(); }
function toggleCartModal(s) { document.getElementById('cart-modal').classList.toggle('active', s); if(s) renderCartItems(); }
function openProfileModal() { if (!state.isAdmin) return; document.getElementById('profile-modal').classList.add('active'); }
function closeProfileModal() { document.getElementById('profile-modal').classList.remove('active'); }

window.addEventListener('DOMContentLoaded', () => { initDecors(); initNav(); syncData(); });

function renderHome() { const g = document.getElementById('home-grid'); if(g) g.innerHTML = state.products.filter(p => p.recommended).map(p => renderCard(p)).join(''); }

function renderAdminItems() { 
    const g = document.getElementById('admin-items-grid'); 
    if(g) g.innerHTML = state.products.map(p => `<div class="flex justify-between items-center p-3 bg-pj-blue-light/30 rounded-xl border border-white mb-2 shadow-sm"><span class="text-[11px] font-bold truncate w-2/3">${p.name}</span><button onclick="editProduct(${p.row})" class="text-[10px] btn-edit-style px-3 py-1 rounded-lg">แก้ไข</button></div>`).join(''); 
}

function initNav() {
    const groups = ['ฟอนต์', 'ลายน้ำ', 'BG', 'ไฟล์ตกแต่ง', 'อื่นๆ', 'รวมกลุ่ม'];
    document.getElementById('group-nav-list').innerHTML = groups.map(g => `<button onclick="handleGroupClick('${g}')" class="category-pill shadow-sm">${g}</button>`).join('');
}

function handleGroupClick(g, isRefresh = false) {
    const items = state.products.filter(p => p.cat === (g === 'รวมกลุ่ม' ? 'กลุ่ม' : g));
    const subList = ['รวมทั้งหมด', ...new Set(items.map(p => p.sub).filter(s => s))];
    if (!isRefresh) showPage('subcat'); document.getElementById('cat-header-title').innerText = g;
    document.getElementById('sub-nav-list').innerHTML = subList.map(s => `<button onclick="renderNetworks('${g === 'รวมกลุ่ม' ? 'กลุ่ม' : g}', '${s}')" class="category-pill shadow-sm">${s}</button>`).join('');
    renderNetworks(g === 'รวมกลุ่ม' ? 'กลุ่ม' : g, 'รวมทั้งหมด');
}

function renderNetworks(cat, sub) {
    let items = state.products.filter(p => p.cat === cat); if(sub !== 'รวมทั้งหมด') items = items.filter(p => p.sub === sub);
    const nets = [...new Set(items.map(p => p.network))];
    document.getElementById('networks-list-view').innerHTML = nets.map(net => {
        const netItems = items.filter(p => p.network === net);
        return `<div class="bg-white/40 p-5 rounded-[40px] mb-8 shadow-sm"><h4 class="font-bold border-l-4 border-pj-brown-main pl-3 mb-5">${net || 'ทั่วไป'}</h4><div class="grid grid-cols-2 md:grid-cols-3 gap-5">${netItems.map(p => renderCard(p)).join('')}</div></div>`;
    }).join('');
}

async function addNewProductToSheet() {
    const btn = document.getElementById('btn-save-sheet');
    const data = { row: document.getElementById('edit-row').value, name: document.getElementById('new-name').value, price: Number(document.getElementById('new-price').value), discount: Number(document.getElementById('new-discount').value) || 0, cat: document.getElementById('new-cat').value, sub: document.getElementById('new-sub').value, network: document.getElementById('new-net').value, image: formatDriveLink(document.getElementById('new-img').value), preview: document.getElementById('new-preview').value, recommended: document.getElementById('new-recommended').checked, limitOne: document.getElementById('new-limitOne').checked };
    if(!data.name || !data.price) return alert("กรุณากรอกข้อมูล");
    btn.innerText = "กำลังบันทึก..."; btn.disabled = true;
    try { await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'saveProduct', product: data }) }); alert("บันทึกสำเร็จ!"); resetAdminForm(); syncData(); } catch(e) { alert("Error!"); } finally { btn.innerText = "บันทึกข้อมูลสินค้า"; btn.disabled = false; }
}

function editProduct(rowId) {
    const p = state.products.find(prod => Number(prod.row) === Number(rowId));
    if(!p) return;
    document.getElementById('edit-row').value = p.row; document.getElementById('new-name').value = p.name; document.getElementById('new-price').value = p.price; document.getElementById('new-discount').value = p.discount || 0; document.getElementById('new-cat').value = p.cat; document.getElementById('new-sub').value = p.sub; document.getElementById('new-net').value = p.network; document.getElementById('new-img').value = p.image; document.getElementById('new-preview').value = p.preview || ''; document.getElementById('new-recommended').checked = p.recommended; document.getElementById('new-limitOne').checked = p.limitOne; document.getElementById('admin-form-title').innerText = "📝 แก้ไขรายการสินค้า"; document.getElementById('btn-cancel-edit').classList.remove('hidden'); window.scrollTo({ top: document.getElementById('page-admin-panel').offsetTop, behavior: 'smooth' });
}

function resetAdminForm() { 
    document.getElementById('edit-row').value = ""; 
    document.querySelectorAll('.admin-input').forEach(i => i.value = ''); 
    document.getElementById('admin-form-title').innerText = "➕ เพิ่มสินค้าใหม่";
    document.getElementById('btn-cancel-edit').classList.add('hidden');
}
