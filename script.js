const API_URL = `${CONFIG.SB_URL}/rest/v1/produk`;
let categories = JSON.parse(localStorage.getItem('snz_categories')) || [];
let activeCategory = "";

function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    if(document.getElementById('clock')) document.getElementById('clock').innerText = `${hours}:${minutes} ${seconds}`;
}

function handleLogout() {
    localStorage.removeItem('snzmart_token');
    window.location.href = 'dashboard.html';
}

function addCategory() {
    Swal.fire({
        title: 'Buat Folder Baru',
        input: 'text',
        inputPlaceholder: 'Contoh: AI CHATGPT',
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#2563eb',
        showCancelButton: true
    }).then((res) => {
        if (res.value) {
            const name = res.value.toUpperCase();
            if(!categories.includes(name)) {
                categories.push(name);
                localStorage.setItem('snz_categories', JSON.stringify(categories));
                renderCategories();
            }
        }
    });
}

async function deleteCategory(index, catName) {
    const ask = await Swal.fire({
        title: 'Hapus Folder & Data?',
        text: `Ini akan menghapus folder ${catName} dan SEMUA produk di dalamnya dari database!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        background: '#111827',
        color: '#fff'
    });

    if (ask.isConfirmed) {
        try {
            Swal.fire({ title: 'Menghapus dari DB...', background: '#111827', color: '#fff', didOpen: () => Swal.showLoading() });

            await fetch(`${API_URL}?kategori=eq.${catName}`, {
                method: 'DELETE',
                headers: { 
                    'apikey': CONFIG.SB_KEY, 
                    'Authorization': `Bearer ${CONFIG.SB_KEY}` 
                }
            });

            categories.splice(index, 1);
            localStorage.setItem('snz_categories', JSON.stringify(categories));

            if (activeCategory === catName) {
                activeCategory = "";
                document.getElementById('productTableBody').innerHTML = '';
                resetForm();
            }

            renderCategories();
            Swal.fire({ icon: 'success', title: 'Terhapus!', text: `Kategori ${catName} dan isinya bersih.`, background: '#111827', color: '#fff' });

        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Gagal Hapus', text: e.message });
        }
    }
}

function renderCategories() {
    const list = document.getElementById('categoryList');
    list.innerHTML = '';
    categories.forEach((cat, index) => {
        const isActive = activeCategory === cat;
        list.innerHTML += `
            <div onclick="selectCategory('${cat}')" class="folder-item flex justify-between items-center p-4 bg-[#0b0f1a] border ${isActive ? 'active-folder border-blue-600' : 'border-gray-800'} rounded-2xl cursor-pointer">
                <div class="flex items-center gap-3">
                    <button onclick="event.stopPropagation(); deleteCategory(${index}, '${cat}')" class="text-gray-600 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <span class="text-[11px] font-black uppercase tracking-tight ${isActive ? 'text-blue-400' : 'text-gray-300'}">${cat}</span>
                </div>
                <button onclick="event.stopPropagation(); openEditor('${cat}')" class="text-[9px] bg-blue-600 text-white px-2 py-1 rounded-md font-black italic shadow-lg shadow-blue-600/20">ADD</button>
            </div>
        `;
    });
    
    if (activeCategory) loadData();
}

function selectCategory(cat) {
    activeCategory = cat;
    renderCategories();
}

function openEditor(cat) {
    activeCategory = cat;
    document.getElementById('editorForm').classList.remove('hidden');
    document.getElementById('currentFolderName').innerText = cat;
    document.getElementById('btn_cancel').classList.remove('hidden');
    renderCategories();
}

function resetForm() {
    document.getElementById('edit_id').value = '';
    document.getElementById('custom_id').value = '';
    document.getElementById('nama').value = '';
    document.getElementById('variant').value = '';
    document.getElementById('harga').value = '';
    document.getElementById('stok_produk').value = '';
    document.getElementById('deskripsi').value = '';
    document.getElementById('bulk_data').value = '';
    document.getElementById('editorForm').classList.add('hidden');
    const btn = document.getElementById('btn_save');
    btn.innerText = "SIMPAN KE SISTEM";
    btn.classList.replace('bg-green-600', 'bg-blue-600');
}

async function saveProduct() {
    const editId = document.getElementById('edit_id').value;
    const cid = document.getElementById('custom_id').value.trim().toLowerCase();
    const nama = document.getElementById('nama').value;
    const vari = document.getElementById('variant').value;
    const hrg = document.getElementById('harga').value;
    const stk = document.getElementById('stok_produk').value;
    const dsk = document.getElementById('deskripsi').value;
    const bulk = document.getElementById('bulk_data').value.trim();
    if (!cid || !nama || !hrg) return Swal.fire({ icon: 'warning', title: 'Oops', text: 'ID, Nama, & Harga Wajib Diisi!' });
    const base = { kategori: activeCategory, nama: nama.toUpperCase(), variant: vari, harga: parseInt(hrg), stok: parseInt(stk || 0), deskripsi: dsk };
    const lines = bulk.split('\n');
    try {
        Swal.fire({ title: 'Processing...', background: '#111827', color: '#fff', didOpen: () => Swal.showLoading() });
        if (!editId) {
            let i = 1;
            for (let line of lines) {
                const curLine = line.trim();
                if (!curLine) continue;
                const finalId = lines.length > 1 ? `${cid}-${i}` : cid;
                const payload = { ...base, id: finalId };
                if (curLine.includes('|')) {
                    const p = curLine.split('|');
                    payload.email = p[0].trim();
                    payload.pw = p[1].trim();
                } else {
                    payload.link = curLine;
                }
                await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'apikey': CONFIG.SB_KEY, 'Authorization': `Bearer ${CONFIG.SB_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                i++;
            }
        } else {
            const payload = { ...base, id: cid };
            const l = lines[0].trim();
            if (l.includes('|')) {
                const p = l.split('|');
                payload.email = p[0].trim();
                payload.pw = p[1].trim();
                payload.link = null;
            } else {
                payload.link = l;
                payload.email = null; payload.pw = null;
            }
            await fetch(`${API_URL}?id=eq.${editId}`, {
                method: 'PATCH',
                headers: { 'apikey': CONFIG.SB_KEY, 'Authorization': `Bearer ${CONFIG.SB_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        Swal.fire({ icon: 'success', title: 'Success', background: '#111827', color: '#fff' });
        resetForm();
        loadData();
    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Error', text: e.message });
    }
}

async function loadData() {
    if (!activeCategory) return;
    const res = await fetch(`${API_URL}?kategori=eq.${activeCategory}&order=id.asc`, {
        headers: { 'apikey': CONFIG.SB_KEY, 'Authorization': `Bearer ${CONFIG.SB_KEY}` }
    });
    const data = await res.json();
    const table = document.getElementById('productTableBody');
    table.innerHTML = '';
    document.getElementById('productCount').innerText = `${data.length} Akun`;
    data.forEach(item => {
        const row = document.createElement('tr');
        row.className = "hover:bg-blue-500/[0.02] transition-all group";
        row.innerHTML = `
            <td class="p-6">
                <span class="text-blue-500 font-black text-[11px] tracking-widest uppercase italic font-mono">🔐 ${item.id}</span>
            </td>
            <td class="p-6">
                <p class="font-black text-white italic uppercase text-sm">${item.nama}</p>
                <p class="text-[10px] text-gray-400 font-bold tracking-tight uppercase">${item.variant}</p>
                <p class="text-[9px] text-blue-400/80 mt-1 italic">📝 ${item.deskripsi || 'No Description'}</p>
            </td>
            <td class="p-6">
                <p class="text-green-500 font-black text-sm">Rp${item.harga.toLocaleString()}</p>
                <div class="flex gap-2 mt-1">
                    <span class="text-[9px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">STOK: ${item.stok}</span>
                    <span class="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">SOLD: ${item.terjual || 0}</span>
                </div>
            </td>
            <td class="p-6 text-center">
                <div class="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <button id="edit-${item.id}" class="bg-blue-600/10 text-blue-400 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition-all text-[10px] font-bold">EDIT</button>
                    <button onclick="deleteData('${item.id}')" class="bg-red-600/10 text-red-500 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-all text-[10px] font-bold">HAPUS</button>
                </div>
            </td>
        `;
        table.appendChild(row);
        document.getElementById(`edit-${item.id}`).onclick = () => prepareEdit(item);
    });
}

function prepareEdit(item) {
    activeCategory = item.kategori;
    document.getElementById('editorForm').classList.remove('hidden');
    document.getElementById('currentFolderName').innerText = item.kategori;
    document.getElementById('edit_id').value = item.id;
    document.getElementById('custom_id').value = item.id;
    document.getElementById('nama').value = item.nama;
    document.getElementById('variant').value = item.variant;
    document.getElementById('harga').value = item.harga;
    document.getElementById('stok_produk').value = item.stok;
    document.getElementById('deskripsi').value = item.deskripsi || '';
    document.getElementById('bulk_data').value = item.email ? `${item.email}|${item.pw}` : (item.link || "");
    const btn = document.getElementById('btn_save');
    btn.innerText = "UPDATE DATA";
    btn.classList.replace('bg-blue-600', 'bg-green-600');
    document.getElementById('btn_cancel').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteData(id) {
    const ask = await Swal.fire({ title: 'Hapus?', text: `ID: ${id}`, icon: 'warning', showCancelButton: true, background: '#111827', color: '#fff' });
    if(ask.isConfirmed) {
        await fetch(`${API_URL}?id=eq.${id}`, { method: 'DELETE', headers: { 'apikey': CONFIG.SB_KEY, 'Authorization': `Bearer ${CONFIG.SB_KEY}` } });
        loadData();
    }
}
