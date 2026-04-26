/* script.js - Part 1: Core Logic */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx3cgPz1YWymqGxYQKzYCeoaBFWHnS09fJ5h8QEJ8EC9V8SZ8yOJJnB1P41Ix2yahBE/exec";

let products = JSON.parse(localStorage.getItem('angun_cache')) || [];
let cart = {}; 
let isAdmin = false;
let currentPass = "1234";

// 🛠 ฟังก์ชันแปลงลิงก์ Google Drive ให้เป็น Direct Link (แก้ไข Syntax ${} ให้ถูกต้อง)
function formatDriveLink(url) {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('drive.google.com')) {
        let fileId = "";
        if (url.includes('id=')) { 
            fileId = url.split('id=')[1].split('&')[0]; 
        } else if (url.includes('/d/')) { 
            fileId = url.split('/d/')[1].split('/')[0]; 
        }
        // แก้ไขแล้ว: ใช้ ` และ ${fileId} เพื่อให้ดึงค่าตัวแปรมาใช้ได้จริง
        return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : url;
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
/* script.js - Part 2: Display & Cart */
function renderCard(p) {
    const rowId = Number(p.row);
    const qty = cart[rowId] || 0; 
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
    const currentQty = cart[id] || 0;
    const newQty = currentQty + change;
    if (newQty <= 0) { delete cart[id]; } 
    else if (limitOne && change > 0 && currentQty >= 1) { alert("มีสินค้านี้ในตะกร้าแล้ว (จำกัดซื้อได้เพียง 1 ชิ้นจ้า)"); } 
    else { cart[id] = newQty; }
    refreshUI();
}

function refreshUI() {
    const badge = document.getElementById('cart-badge');
    const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
    if(badge) { badge.innerText = totalItems; badge.style.display = totalItems > 0 ? 'flex' : 'none'; }
    renderHome();
    const catTitle = document.getElementById('cat-header-title');
    if(!document.getElementById('page-subcat').classList.contains('hidden-page') && catTitle) { handleGroupClick(catTitle.innerText, true); }
    setTimeout(() => { if(window.lucide) { lucide.createIcons(); } }, 100);
}

function showPage(id) {
    const mainHeader = document.getElementById('main-header');
    document.querySelectorAll('.page-container').forEach(p => p.classList.add('hidden-page'));
    const el = document.getElementById('page-'+id);
    if(el) {
        el.classList.remove('hidden-page');
        if(id === 'checkout') { if(mainHeader) mainHeader.style.display = 'none'; window.scrollTo(0, 0); } else { if(mainHeader) mainHeader.style.display = 'block'; }
    }
    if (window.lucide) lucide.createIcons();
}
/* script.js - Part 3: Database & Profile Admin */

async function syncData() {
    try {
        const res = await fetch(SCRIPT_URL); 
        const data = await res.json();
        if(data.status === 'success') {
            products = data.products.map(p => {
                p.image = formatDriveLink(p.image);
                return p;
            });
            localStorage.setItem('angun_cache', JSON.stringify(products));
            
            if(data.settings) {
                const imgEl = document.getElementById('shop-profile-img');
                if(data.settings.profileImg && imgEl) { 
                    imgEl.src = formatDriveLink(data.settings.profileImg); 
                }
                const nameEl = document.getElementById('shop-name-display');
                if(data.settings.shopName && nameEl) { nameEl.innerText = data.settings.shopName; }
                currentPass = data.settings.adminPass || "1234";
                if(data.settings.dropdowns) updateDropdowns(data.settings.dropdowns);
            }
            refreshUI(); 
            renderAdminItems();
        }
    } catch(e) { console.warn("Offline Mode"); refreshUI(); }
}

async function updateProfileImage() {
    const input = document.getElementById('new-profile-url');
    const btn = document.querySelector('#profile-modal .btn-pj-main');
    let rawUrl = input.value.trim();
    if (!rawUrl) return alert("กรุณาวางลิงก์รูปก่อนจ้า");
    
    const originalText = btn.innerText; 
    btn.innerText = "กำลังบันทึกข้อมูล..."; 
    btn.disabled = true;

    try {
        // ส่งคำสั่งเซฟไปที่ Google Script ลิงก์ใหม่
        await fetch(SCRIPT_URL, { 
            method: 'POST', 
            mode: 'no-cors', 
            body: JSON.stringify({ action: 'saveProfile', url: rawUrl }) 
        });

        document.getElementById('shop-profile-img').src = formatDriveLink(rawUrl);
        alert("✨ บันทึกสำเร็จ! รูปจะแสดงผลถาวรในทุกเครื่องจ้า");
        input.value = ""; closeProfileModal();
        setTimeout(syncData, 1500); 

    } catch (e) { alert("บันทึกไม่สำเร็จ"); } 
    finally { btn.innerText = originalText; btn.disabled = false; }
}

function handleAdminLogin() { 
    const val = document.getElementById('admin-pass-input').value; 
    if(val == currentPass) { isAdmin = true; showPage('admin-panel'); } 
    else alert("รหัสผ่านผิดจ้า"); 
}

function logoutAdmin() { isAdmin = false; location.reload(); }
function checkAdminStatus() { isAdmin ? showPage('admin-panel') : showPage('admin-login'); }
function openProfileModal() { if (!isAdmin) { alert("ส่วนนี้สำหรับ Admin เท่านั้นจ้า ✨"); return; } document.getElementById('profile-modal').classList.add('active'); }
function closeProfileModal() { document.getElementById('profile-modal').classList.remove('active'); }

window.addEventListener('DOMContentLoaded', () => { 
    initDecors(); 
    initNav(); 
    syncData(); 
});

/* --- ส่วนเสริมนำทางและจัดการสินค้าแอดมิน --- */
function renderHome() { const grid = document.getElementById('home-grid'); if(grid) grid.innerHTML = products.filter(p => p.recommended).map(p => renderCard(p)).join(''); }
function initNav() {
    const groups = ['ฟอนต์', 'ลายน้ำ', 'BG', 'ไฟล์ตกแต่ง', 'อื่นๆ', 'รวมกลุ่ม']; const container = document.getElementById('group-nav-list');
    if(container) container.innerHTML = groups.map(g => `<button onclick="handleGroupClick('${g}')" class="category-pill shadow-sm">${g}</button>`).join('');
}
function handleGroupClick(g, isRefresh = false) {
    const categoryProducts = products.filter(p => p.cat === (g === 'รวมกลุ่ม' ? 'กลุ่ม' : g));
    const uniqueSubs = [...new Set(categoryProducts.map(p => p.sub).filter(s => s))];
    const subList = ['รวมทั้งหมด', ...uniqueSubs]; let sheetCategory = g === 'รวมกลุ่ม' ? 'กลุ่ม' : g;
    if (!isRefresh) showPage('subcat'); document.getElementById('cat-header-title').innerText = g;
    document.getElementById('sub-nav-list').innerHTML = subList.map(s => `<button onclick="renderNetworks('${sheetCategory}', '${s}')" class="category-pill border-pj-brown-light shadow-sm transition-transform active:scale-95">${s}</button>`).join('');
    renderNetworks(sheetCategory, 'รวมทั้งหมด');
}
function renderNetworks(cat, sub) {
    const container = document.getElementById('networks-list-view'); let items = products.filter(p => p.cat === cat); if(sub !== 'รวมทั้งหมด') items = items.filter(p => p.sub === sub);
    const nets = [...new Set(items.map(p => p.network))];
    container.innerHTML = nets.map(net => {
        const netItems = items.filter(p => p.network === net);
        return `<div class="bg-white/40 p-5 rounded-[40px] mb-8 shadow-sm"><div class="flex justify-between items-center mb-5 border-l-4 border-pj-brown-main pl-3 text-pj-brown-dark"><h4 class="font-bold">เครือ: ${net || 'ทั่วไป'}</h4></div><div class="grid grid-cols-2 md:grid-cols-3 gap-5">${netItems.slice(0, 6).map(p => renderCard(p)).join('')}</div></div>`;
    }).join('');
    if (window.lucide) lucide.createIcons();
}
function toggleCartModal(show) { document.getElementById('cart-modal').classList.toggle('active', show); if(show) renderCartItems(); }
function renderAdminItems() {
    const container = document.getElementById('admin-items-grid'); if(!container) return;
    container.innerHTML = products.map(p => `<div class="flex justify-between items-center p-3 bg-pj-blue-light/30 rounded-xl border border-white mb-2 shadow-sm"><span class="text-[11px] font-bold truncate w-2/3">${p.name}</span><button onclick="editProduct(${p.row})" class="text-[10px] btn-edit-style px-3 py-1 rounded-lg">แก้ไข</button></div>`).join('');
}
function resetAdminForm() { document.getElementById('edit-row').value = ""; document.querySelectorAll('.admin-input').forEach(i => i.value = ''); document.getElementById('new-recommended').checked = false; document.getElementById('new-limitOne').checked = false; document.getElementById('admin-form-title').innerText = "➕ เพิ่มสินค้าใหม่"; document.getElementById('btn-cancel-edit').classList.add('hidden'); }
async function addNewProductToSheet() {
    const btn = document.getElementById('btn-save-sheet');
    const data = { row: document.getElementById('edit-row').value, name: document.getElementById('new-name').value, price: Number(document.getElementById('new-price').value), discount: Number(document.getElementById('new-discount').value) || 0, cat: document.getElementById('new-cat').value, sub: document.getElementById('new-sub').value, network: document.getElementById('new-net').value, image: formatDriveLink(document.getElementById('new-img').value), preview: document.getElementById('new-preview').value, recommended: document.getElementById('new-recommended').checked, limitOne: document.getElementById('new-limitOne').checked };
    if(!data.name || !data.price) return alert("กรุณากรอกชื่อและราคา"); btn.innerText = "กำลังบันทึก..."; btn.disabled = true;
    try { await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'saveProduct', product: data }) }); alert(data.row ? "แก้ไขสำเร็จ!" : "บันทึกสำเร็จ!"); resetAdminForm(); syncData(); } catch(e) { alert("เกิดข้อผิดพลาด"); } finally { btn.innerText = "บันทึกข้อมูลสินค้า"; btn.disabled = false; }
}
function editProduct(rowId) {
    const p = products.find(prod => Number(prod.row) === Number(rowId)); if (!p) return;
    document.getElementById('edit-row').value = p.row; document.getElementById('new-name').value = p.name; document.getElementById('new-price').value = p.price; document.getElementById('new-discount').value = p.discount; document.getElementById('new-cat').value = p.cat; document.getElementById('new-sub').value = p.sub; document.getElementById('new-net').value = p.network; document.getElementById('new-img').value = p.image; document.getElementById('new-preview').value = p.preview || ''; document.getElementById('new-recommended').checked = p.recommended; document.getElementById('new-limitOne').checked = p.limitOne; document.getElementById('admin-form-title').innerText = "📝 แก้ไขรายการสินค้า"; document.getElementById('btn-cancel-edit').classList.remove('hidden'); window.scrollTo({ top: document.getElementById('page-admin-panel').offsetTop, behavior: 'smooth' });
}
