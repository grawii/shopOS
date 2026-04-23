/* script.js - Part 1 */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzhKY9MXntcaKDvijcrdp6I_jflWX2fseXmg5zPoo6376wDdJGNiNZS4KJLz0hvsXUZ/exec";

let products = JSON.parse(localStorage.getItem('angun_cache')) || [];
let cart = {}; 
let isAdmin = false;
let currentPass = "1234";

function initDecors() {
    const container = document.getElementById('deco-container');
    const svgs = [
        `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/></svg>`,
        `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
    ];
    const pos = [{t:10,l:5},{t:15,l:85},{t:40,l:10},{t:45,l:92},{t:70,l:5},{t:75,l:80},{t:25,l:45},{t:90,l:40}];
    if(container) container.innerHTML = pos.map((p, i) => `<div class="floating-deco" style="top:${p.t}%; left:${p.l}%; color:var(--pj-bg); animation-delay:${i*0.4}s">${svgs[i%2]}</div>`).join('');
    const logo = document.getElementById('wave-logo');
    if(logo) logo.innerHTML = "ANGUN WAN".split('').map((c, i) => `<span class="wave-letter" style="--i:${i}">${c===' '?'&nbsp;':c}</span>`).join('');
}

function updateDropdowns(dropdownData) {
    if(!dropdownData) return;
    const fill = (id, items) => {
        const el = document.getElementById(id);
        if(el) {
            el.innerHTML = items
                .filter(x => x && x !== "TaskTypes" && x !== "TaskTypes2" && x !== "Channels")
                .map(item => `<option value="${item}">`).join('');
        }
    };
    fill('list-cat', dropdownData.mainCats);
    fill('list-sub', dropdownData.subCats);
    fill('list-net', dropdownData.channels);
}

// 🛠 แก้ไข: ปุ่มดูตัวอย่าง (ปรับให้ Class และ Icon ชัดเจน)
function renderCard(p) {
    const rowId = Number(p.row);
    const qty = cart[rowId] || 0; 
    const finalPrice = p.price - (p.discount || 0);
    const isLimit = p.limitOne === true || p.limitOne === "YES";

    // 🔍 ปรับใหม่: เช็คว่ามีข้อมูลลิงก์จริงๆ (รองรับทั้ง preview หรือ p[9] จาก index)
    const previewLink = p.preview || "";
    const hasPreview = previewLink.length > 5;

    return `
        <div class="product-card border border-pj-brown-light/10 shadow-sm">
            ${p.discount > 0 ? `<div class="sale-badge">SALE</div>` : ''}
            <div class="aspect-square rounded-[22px] overflow-hidden mb-3 bg-pj-blue-light/50">
                <img src="${p.image}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/400?text=AngunWan'">
            </div>
            <h4 class="text-[11px] font-bold truncate px-1">${p.name}</h4>
            
            ${hasPreview ? `
                <a href="${previewLink}" target="_blank" class="mt-2 mb-2 p-2 bg-pj-blue-light/80 rounded-lg flex items-center justify-center gap-2 text-[10px] text-pj-brown-dark font-bold hover:bg-pj-brown-light/20 transition-all border border-pj-brown-light/10">
                    <i data-lucide="eye" class="w-3.5 h-3.5"></i> ดูตัวอย่าง
                </a>
            ` : '<div class="h-[2px]"></div>'}

            <div class="mt-1 px-1 flex items-center gap-1 font-bold">
                <span class="text-xs text-pj-brown-dark">${finalPrice}.-</span>
                ${p.discount > 0 ? `<span class="text-[9px] line-through opacity-30">${p.price}.-</span>` : ''}
            </div>
            <div class="mt-3">
                ${qty === 0 ? 
                    `<button onclick="updateCart(${rowId}, 1, ${isLimit})" class="w-full py-2 btn-pj-main rounded-xl text-[10px] shadow-md">ใส่ตะกร้า</button>` :
                    `<div class="flex items-center justify-between bg-pj-blue-light/60 p-1 rounded-xl">
                        <button onclick="updateCart(${rowId}, -1, ${isLimit})" class="btn-qty-action btn-minus-style">✕</button>
                        <span class="text-xs font-bold">${qty} ชุด</span>
                        <button onclick="updateCart(${rowId}, 1, ${isLimit})" class="btn-qty-action btn-plus-style ${isLimit ? 'opacity-20 pointer-events-none' : ''}">＋</button>
                    </div>`
                }
            </div>
        </div>`;
}

// 🛠 แก้ไข: ฟังก์ชันแจ้งเตือนสินค้าจำกัด 1 ชิ้น
function updateCart(rowId, change, limitOne) {
    const id = Number(rowId);
    const currentQty = cart[id] || 0;
    const newQty = currentQty + change;

    if (newQty <= 0) {
        delete cart[id];
    } else if (limitOne && change > 0 && currentQty >= 1) {
        alert("มีสินค้านี้ในตะกร้าแล้ว (จำกัดซื้อได้เพียง 1 ชิ้นจ้า)");
    } else {
        cart[id] = newQty;
    }
    
    refreshUI();
    if(document.getElementById('cart-modal').classList.contains('active')) renderCartItems();
}

function refreshUI() {
    const badge = document.getElementById('cart-badge');
    const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
    if(badge) {
        badge.innerText = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    renderHome();
    const catTitle = document.getElementById('cat-header-title');
    if(!document.getElementById('page-subcat').classList.contains('hidden-page') && catTitle) {
        handleGroupClick(catTitle.innerText, true); 
    }
    // 💡 สั่งวาดไอคอนดวงตา (สำคัญมาก)
    setTimeout(() => { if(window.lucide) lucide.createIcons(); }, 100);
}

function renderNetworks(cat, sub) {
    const container = document.getElementById('networks-list-view');
    let items = products.filter(p => p.cat === cat);
    if(sub !== 'รวมทั้งหมด') items = items.filter(p => p.sub === sub);
    const nets = [...new Set(items.map(p => p.network))];
    container.innerHTML = nets.map(net => {
        const netItems = items.filter(p => p.network === net);
        return `<div class="bg-white/40 p-5 rounded-[40px] mb-8 shadow-sm">
            <div class="flex justify-between items-center mb-5 border-l-4 border-pj-brown-main pl-3 text-pj-brown-dark">
                <h4 class="font-bold">เครือ: ${net || 'ทั่วไป'}</h4>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-5">${netItems.slice(0, 6).map(p => renderCard(p)).join('')}</div>
        </div>`;
    }).join('');
    // 💡 สั่งวาดไอคอนดวงตาสำหรับหน้าหมวดหมู่
    setTimeout(() => { if(window.lucide) lucide.createIcons(); }, 100);
}

/* script.js - Part 2 (หน้า Checkout และ Admin) */
function showPage(id) {
    const mainHeader = document.getElementById('main-header');
    document.querySelectorAll('.page-container').forEach(p => p.classList.add('hidden-page'));
    const el = document.getElementById('page-'+id);
    if(el) {
        el.classList.remove('hidden-page');
        if(id === 'checkout') {
            if(mainHeader) mainHeader.style.display = 'none';
            window.scrollTo(0, 0);
        } else {
            if(mainHeader) mainHeader.style.display = 'block';
        }
    }
    if (window.lucide) lucide.createIcons();
}

function proceedToCheckout() {
    if (Object.keys(cart).length === 0) return alert("ตะกร้าว่างเปล่าจ้า");
    toggleCartModal(false);
    showPage('checkout');
    
    const itemsList = document.getElementById('checkout-items-list');
    const calcList = document.getElementById('checkout-summary-calc');
    const inputContainer = document.getElementById('checkout-input-container');
    
    let totalNormal = 0;
    let totalDiscount = 0;
    let hasGroupProduct = false;
    let hasDigitalProduct = false; // เพิ่มตัวแปรเช็คสินค้าทั่วไป (ฟอนต์, ลายน้ำ ฯลฯ)

    itemsList.innerHTML = Object.keys(cart).map(rowId => {
        const p = products.find(x => Number(x.row) === Number(rowId));
        const qty = cart[rowId];
        const price = p.price * qty;
        const discount = (p.discount || 0) * qty;
        totalNormal += price;
        totalDiscount += discount;
        
        // เช็คประเภทสินค้าในตะกร้า
        if (p.cat === 'กลุ่ม' || p.cat === 'รวมกลุ่ม') {
            hasGroupProduct = true;
        } else {
            hasDigitalProduct = true;
        }

        return `
            <div class="flex justify-between items-center p-2 border-b border-pj-brown-light/10">
                <div class="flex flex-col">
                    <span class="text-xs font-bold">${p.name}</span>
                    <span class="text-[10px] opacity-60">จำนวน ${qty} ชุด</span>
                </div>
                <span class="text-xs font-bold">${p.price - (p.discount || 0)}.-</span>
            </div>
        `;
    }).join('');

    calcList.innerHTML = `
        <div class="flex justify-between"><span>ราคาปกติ</span><span>${totalNormal}.-</span></div>
        <div class="flex justify-between text-red-500"><span>ส่วนลดทั้งหมด</span><span>-${totalDiscount}.-</span></div>
    `;
    
    document.getElementById('checkout-final-sum').innerText = totalNormal - totalDiscount;

    // 🛠 แก้ไขจุดนี้: ให้แสดงช่องกรอกตามสินค้าที่มีในตะกร้าจริงๆ
    let inputHtml = "";
    
    // ถ้ามีสินค้าทั่วไป ให้โชว์ช่องอีเมล
    if (hasDigitalProduct) {
        inputHtml += `<input type="email" id="cust-email" placeholder="กรอกอีเมล (สกุล @gmail.com เท่านั้น)" class="admin-input mb-3">`;
    }
    
    // ถ้ามีสินค้ากลุ่ม ให้โชว์ช่องไอดีไลน์
    if (hasGroupProduct) {
        inputHtml += `<input type="text" id="cust-line" placeholder="ไอดีไลน์ หรือ ลิ้งค์ไลน์ (สำหรับดึงเข้ากลุ่ม)" class="admin-input">`;
    }
    
    inputContainer.innerHTML = inputHtml;
    lucide.createIcons();
}

function confirmPurchase() {
    const emailInput = document.getElementById('cust-email');
    const lineInput = document.getElementById('cust-line');
    let infoParts = [];

    // ตรวจสอบอีเมลถ้ามีช่องให้กรอก
    if (emailInput) {
        if (!emailInput.value.includes('@gmail.com')) return alert("กรุณาใช้อีเมล @gmail.com สำหรับส่งไฟล์จ้า");
        infoParts.push("📧 Email: " + emailInput.value);
    }
    
    // ตรวจสอบไอดีไลน์ถ้ามีช่องให้กรอก
    if (lineInput) {
        if (lineInput.value.length < 3) return alert("กรุณากรอกไอดีไลน์ให้ถูกต้องสำหรับเข้ากลุ่มจ้า");
        infoParts.push("🆔 Line: " + lineInput.value);
    }

    if (infoParts.length === 0) return alert("กรุณากรอกข้อมูลผู้ซื้อให้ครบถ้วนจ้า");

    // สร้างข้อความสรุป
    let message = "🛒 *รายการสั่งซื้อใหม่*\n------------------\n";
    Object.keys(cart).forEach(rowId => {
        const p = products.find(x => Number(x.row) === Number(rowId));
        message += `- ${p.name} (x${cart[rowId]})\n`;
    });
    message += `------------------\n💰 *ยอดรวม:* ${document.getElementById('checkout-final-sum').innerText} บาท\n👤 *ข้อมูลผู้ซื้อ:* \n${infoParts.join('\n')}`;

    // คัดลอกและไปไลน์
    navigator.clipboard.writeText(message).then(() => {
        alert("สรุปรายการสำเร็จ! ระบบคัดลอกข้อมูลให้แล้ว กำลังส่งคุณไปที่ LINE ร้านเพื่อส่งข้อมูลจ้า");
        window.location.href = "https://line.me/ti/p/@309ranuu";
    });
}

async function syncData() {
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        if(data.status === 'success') {
            products = data.products;
            localStorage.setItem('angun_cache', JSON.stringify(products));
            if(data.settings) {
                if(data.settings.profileImg) document.getElementById('shop-profile-img').src = data.settings.profileImg;
                if(data.settings.shopName) document.getElementById('shop-name-display').innerText = data.settings.shopName;
                currentPass = data.settings.adminPass;
            }
            refreshUI();
            renderAdminItems();
        }
    } catch(e) { console.warn("Offline Mode"); refreshUI(); }
}

function renderHome() {
    const grid = document.getElementById('home-grid');
    if(grid) grid.innerHTML = products.filter(p => p.recommended).map(p => renderCard(p)).join('');
}

function initNav() {
    const groups = ['ฟอนต์', 'ลายน้ำ', 'BG', 'ไฟล์ตกแต่ง', 'อื่นๆ', 'รวมกลุ่ม'];
    const container = document.getElementById('group-nav-list');
    if(container) container.innerHTML = groups.map(g => `<button onclick="handleGroupClick('${g}')" class="category-pill shadow-sm">${g}</button>`).join('');
}

function handleGroupClick(g, isRefresh = false) {
    const categoryProducts = products.filter(p => p.cat === (g === 'รวมกลุ่ม' ? 'กลุ่ม' : g));
    const uniqueSubs = [...new Set(categoryProducts.map(p => p.sub).filter(s => s))];
    const subList = ['รวมทั้งหมด', ...uniqueSubs];
    let sheetCategory = g === 'รวมกลุ่ม' ? 'กลุ่ม' : g;
    if (!isRefresh) showPage('subcat');
    document.getElementById('cat-header-title').innerText = g;
    document.getElementById('sub-nav-list').innerHTML = subList.map(s => 
        `<button onclick="renderNetworks('${sheetCategory}', '${s}')" class="category-pill border-pj-brown-light shadow-sm transition-transform active:scale-95">${s}</button>`
    ).join('');
    renderNetworks(sheetCategory, 'รวมทั้งหมด');
}

function renderNetworks(cat, sub) {
    const container = document.getElementById('networks-list-view');
    let items = products.filter(p => p.cat === cat);
    if(sub !== 'รวมทั้งหมด') items = items.filter(p => p.sub === sub);
    const nets = [...new Set(items.map(p => p.network))];
    container.innerHTML = nets.map(net => {
        const netItems = items.filter(p => p.network === net);
        return `<div class="bg-white/40 p-5 rounded-[40px] mb-8 shadow-sm">
            <div class="flex justify-between items-center mb-5 border-l-4 border-pj-brown-main pl-3 text-pj-brown-dark">
                <h4 class="font-bold">เครือ: ${net || 'ทั่วไป'}</h4>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-5">${netItems.slice(0, 6).map(p => renderCard(p)).join('')}</div>
        </div>`;
    }).join('');
    if (window.lucide) lucide.createIcons();
}

function checkAdminStatus() { isAdmin ? showPage('admin-panel') : showPage('admin-login'); }
function handleAdminLogin() {
    const val = document.getElementById('admin-pass-input').value;
    if(val == currentPass) { isAdmin = true; showPage('admin-panel'); } else alert("รหัสผ่านผิดจ้า");
}
function logoutAdmin() { isAdmin = false; location.reload(); }
function toggleCartModal(show) { document.getElementById('cart-modal').classList.toggle('active', show); if(show) renderCartItems(); }

function renderCartItems() {
    const list = document.getElementById('cart-list-items');
    let sum = 0;
    list.innerHTML = Object.keys(cart).map(rowId => {
        const p = products.find(x => Number(x.row) === Number(rowId));
        if(!p) return '';
        const qty = cart[rowId];
        const pricePerUnit = p.price - (p.discount || 0);
        const totalPrice = pricePerUnit * qty;
        const isLimit = p.limitOne === true || p.limitOne === "YES";
        sum += totalPrice;
        return `
            <div class="flex flex-col bg-pj-blue-light/40 p-4 rounded-3xl mb-2 shadow-sm">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[11px] font-bold">${p.name}</span>
                    <button onclick="updateCart(${p.row}, -${qty}, ${isLimit})" class="btn-qty-action btn-del-style">✕</button>
                </div>
                <div class="flex justify-between items-center border-t border-white/50 pt-2">
                    <div class="flex items-center gap-3 bg-white/50 rounded-xl px-2 py-1">
                        <button onclick="updateCart(${p.row}, -1, ${isLimit})" class="btn-qty-action btn-minus-style">-</button>
                        <span class="text-xs font-bold w-8 text-center">${qty}</span>
                        <button onclick="updateCart(${p.row}, 1, ${isLimit})" class="btn-qty-action btn-plus-style ${isLimit ? 'opacity-20 pointer-events-none' : ''}">+</button>
                    </div>
                    <span class="text-xs font-bold text-pj-brown-dark">${totalPrice}.-</span>
                </div>
            </div>`;
    }).join('') || '<p class="text-center py-10 opacity-30">ไม่มีสินค้าในตะกร้า</p>';
    document.getElementById('cart-sum').innerText = sum;
}

function renderAdminItems() {
    const container = document.getElementById('admin-items-grid');
    if(!container) return;
    container.innerHTML = products.map(p => `
        <div class="flex justify-between items-center p-3 bg-pj-blue-light/30 rounded-xl border border-white mb-2 shadow-sm">
            <span class="text-[11px] font-bold truncate w-2/3">${p.name}</span>
            <button onclick="editProduct(${p.row})" class="text-[10px] btn-edit-style px-3 py-1 rounded-lg">แก้ไข</button>
        </div>
    `).join('');
}

function resetAdminForm() {
    document.getElementById('edit-row').value = "";
    document.querySelectorAll('.admin-input').forEach(i => i.value = '');
    document.getElementById('new-recommended').checked = false;
    document.getElementById('new-limitOne').checked = false;
    document.getElementById('admin-form-title').innerText = "➕ เพิ่มสินค้าใหม่";
    document.getElementById('btn-cancel-edit').classList.add('hidden');
}

async function addNewProductToSheet() {
    const btn = document.getElementById('btn-save-sheet');
    const data = {
        row: document.getElementById('edit-row').value,
        name: document.getElementById('new-name').value,
        price: Number(document.getElementById('new-price').value),
        discount: Number(document.getElementById('new-discount').value) || 0,
        cat: document.getElementById('new-cat').value,
        sub: document.getElementById('new-sub').value,
        network: document.getElementById('new-net').value,
        image: document.getElementById('new-img').value,
        preview: document.getElementById('new-preview').value,
        recommended: document.getElementById('new-recommended').checked,
        limitOne: document.getElementById('new-limitOne').checked
    };
    if(!data.name || !data.price) return alert("กรุณากรอกชื่อและราคา");
    btn.innerText = "กำลังบันทึก..."; btn.disabled = true;
    try {
        await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'saveProduct', product: data }) });
        alert(data.row ? "แก้ไขสำเร็จ!" : "บันทึกสำเร็จ!");
        resetAdminForm();
        syncData();
    } catch(e) { alert("เกิดข้อผิดพลาด"); }
    finally { btn.innerText = "บันทึกข้อมูลสินค้า"; btn.disabled = false; }
}

function editProduct(rowId) {
    const p = products.find(prod => Number(prod.row) === Number(rowId));
    if (!p) return;
    document.getElementById('edit-row').value = p.row;
    document.getElementById('new-name').value = p.name;
    document.getElementById('new-price').value = p.price;
    document.getElementById('new-discount').value = p.discount;
    document.getElementById('new-cat').value = p.cat;
    document.getElementById('new-sub').value = p.sub;
    document.getElementById('new-net').value = p.network;
    document.getElementById('new-img').value = p.image;
    document.getElementById('new-preview').value = p.preview || '';
    document.getElementById('new-recommended').checked = p.recommended;
    document.getElementById('new-limitOne').checked = p.limitOne;
    document.getElementById('admin-form-title').innerText = "📝 แก้ไขรายการสินค้า";
    document.getElementById('btn-cancel-edit').classList.remove('hidden');
    window.scrollTo({ top: document.getElementById('page-admin-panel').offsetTop, behavior: 'smooth' });
}

initDecors(); initNav(); syncData();

// 1. รายการข้อความเตือนแบบคละกัน
const warnings = [
    "หยุดนะ! อย่าพยายามแกะโค้ดเลยจ้า ✨",
    "เตือนครั้งที่ 1: ห้ามเข้าถึงหน้าพัฒนาซอฟต์แวร์นะ!",
    "สงสัยอะไรทักถาม @309ranuu ได้เลยจ้า ไม่ต้องแกะเอง",
    "โค้ดนี้ได้รับลิขสิทธิ์โดย องุ่นหวาน | Grawii Studio ห้ามคัดลอก!"
];

// 2. รายการลิงก์สุ่ม (เช่น คลิปผี หรือหน้าเว็บอื่นๆ)
const prankLinks = [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Rickroll (หลอกให้กด)
    "https://www.youtube.com/results?search_query=ghost+scary+video" // ลิงก์ค้นหาคลิปผี
];

function triggerSecurityAction() {
    // สุ่มข้อความเตือน
    const randomText = warnings[Math.floor(Math.random() * warnings.length)];
    alert(randomText);
    
    // สุ่มการ Redirect (ส่งไปหน้าอื่น)
    const randomLink = prankLinks[Math.floor(Math.random() * prankLinks.length)];
    window.location.href = randomLink;
}

// 3. ตรวจสอบการกดปุ่ม (F12, Ctrl+Shift+I, ฯลฯ)
document.onkeydown = function(e) {
    if (e.keyCode == 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode == 'I'.charCodeAt(0) || e.keyCode == 'J'.charCodeAt(0))) || 
        (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0))) {
        triggerSecurityAction();
        return false;
    }
};

// 🛠️ โหมดนักพัฒนา (สวิตช์ควบคุมระบบป้องกัน)
// เปลี่ยนเป็น true = ปิดระบบป้องกัน (เพื่อแก้ไขงาน/ดู Error)
// เปลี่ยนเป็น false = เปิดระบบป้องกัน (เพื่อใช้งานจริง/กันคนแกะ)
const isDevMode = false; 

if (!isDevMode) {
    // 1. รายการข้อความเตือนแบบคละกัน
    const warnings = [
        "หยุดนะ! อย่าพยายามแกะโค้ดเลยจ้า ✨",
        "เตือนครั้งที่ 1: ห้ามเข้าถึงหน้าพัฒนาซอฟต์แวร์นะ!",
        "สงสัยอะไรทักถาม @309ranuu ได้เลยจ้า ไม่ต้องแกะเอง",
        "โค้ดนี้ได้รับลิขสิทธิ์โดย องุ่นหวาน | Grawii Studio ห้ามคัดลอก!"
    ];

    // 2. รายการลิงก์สุ่ม
    const prankLinks = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://www.youtube.com/results?search_query=ghost+scary+video"
    ];

    const triggerSecurityAction = () => {
        const randomText = warnings[Math.floor(Math.random() * warnings.length)];
        alert(randomText);
        const randomLink = prankLinks[Math.floor(Math.random() * prankLinks.length)];
        window.location.href = randomLink;
    };

    // 3. ป้องกันการกดปุ่ม (F12, Ctrl+Shift+I, U)
    document.onkeydown = function(e) {
        if (e.keyCode == 123 || 
            (e.ctrlKey && e.shiftKey && (e.keyCode == 'I'.charCodeAt(0) || e.keyCode == 'J'.charCodeAt(0))) || 
            (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0))) {
            triggerSecurityAction();
            return false;
        }
    };

    // 4. ตรวจสอบจากการลากแถบ DevTools
    setInterval(function() {
        const threshold = 160;
        const isDevToolsOpen = window.outerWidth - window.innerWidth > threshold || 
                               window.outerHeight - window.innerHeight > threshold;
        if (isDevToolsOpen) {
            document.body.innerHTML = "<h1 style='text-align:center; margin-top:20%; font-family:sans-serif;'>Security Alert: DevTools Detected!</h1>";
            setTimeout(triggerSecurityAction, 500);
        }
    }, 1000);

    // 5. ป้องกันคลิกขวา
    document.addEventListener('contextmenu', event => event.preventDefault());
}
