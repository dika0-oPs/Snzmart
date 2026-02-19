const API_URL = `${CONFIG.SB_URL}/rest/v1/produk`;

function updateTime() {
    const now = new Date();
    const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    document.getElementById('clock').innerText = `${hours}:${minutes} ${seconds}`;
    document.getElementById('date').innerText = now.toLocaleDateString('id-ID', optionsDate).toUpperCase();
}

function handleLogin() {
    const e = document.getElementById('loginEmail').value;
    const p = document.getElementById('loginPw').value;
    if(e === CONFIG.ADMIN_AUTH.email && p === CONFIG.ADMIN_AUTH.pw) {
        localStorage.setItem('snzmart_token', 'active');
        window.location.href = 'dashboard.html';
    } else {
        Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: 'Email atau password salah!', background: '#111827', color: '#fff' });
    }
}

function handleLogout() {
    localStorage.removeItem('snzmart_token');
    window.location.href = 'index.html';
}

function checkAuth() {
    if(!localStorage.getItem('snzmart_token')) window.location.href = 'index.html';
    loadData();
}

function generateID(kategori) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = kategori.substring(0, 3).replace(/\s/g, '').toUpperCase();
    return `${prefix}-${randomNum}`;
}

async function uploadImage(file) {
    const fileName = `${Date.now()}_${file.name}`;
    const uploadPath = `${CONFIG.SB_URL}/storage/v1/object/${CONFIG.BUCKET_NAME}/${fileName}`;
    const publicUrl = `${CONFIG.SB_URL}/storage/v1/object/public/${CONFIG.BUCKET_NAME}/${fileName}`;
    const res = await fetch(uploadPath, {
        method: 'POST',
        headers: { 'apikey': CONFIG.SB_KEY, 'Authorization': `Bearer ${CONFIG.SB_KEY}` },
        body: file
    });
    return res.ok ? publicUrl : null;
}

function prepareEdit(item) {
    document.getElementById('edit_id').value = item.id;
    document.getElementById('kat').value = item.kategori;
    document.getElementById('nama').value = item.nama;
    document.getElementById('variant').value = item.variant || '';
    document.getElementById('harga').value = item.harga;
    document.getElementById('deskripsi').value = item.deskripsi;
    
    let currentData = "";
    if (item.email && item.pw) {
        currentData = `${item.email}|${item.pw}`;
    } else {
        currentData = item.link || '';
    }
    document.getElementById('bulk_data').value = currentData;
    
    const btnSave = document.getElementById('btn_save');
    btnSave.innerText = "PERBARUI PRODUK";
    btnSave.classList.replace('bg-blue-600', 'bg-green-600');
    document.getElementById('btn_cancel').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
    document.getElementById('edit_id').value = '';
    document.getElementById('nama').value = '';
    document.getElementById('variant').value = '';
    document.getElementById('harga').value = '';
    document.getElementById('deskripsi').value = '';
    document.getElementById('bulk_data').value = '';
    const btnSave = document.getElementById('btn_save');
    btnSave.innerText = "SIMPAN KE SISTEM";
    btnSave.classList.replace('bg-green-600', 'bg-blue-600');
    document.getElementById('btn_cancel').classList.add('hidden');
}

async function saveProduct() {
    const editId = document.getElementById('edit_id').value;
    const fileInput = document.getElementById('foto_file');
    const kat = document.getElementById('kat').value;
    const nama = document.getElementById('nama').value;
    const harga = document.getElementById('harga').value;
    const bulkInput = document.getElementById('bulk_data').value.trim();

    if (!nama || !harga || !bulkInput) return Swal.fire('Error', 'Lengkapi data produk!', 'error');

    let imgUrl = "";
    if (fileInput && fileInput.files.length > 0) {
        Swal.fire({ title: 'Mengunggah Gambar...', background: '#111827', color: '#fff', didOpen: () => Swal.showLoading() });
        imgUrl = await uploadImage(fileInput.files[0]);
    }

    const basePayload = {
        kategori: kat,
        nama: nama,
        variant: document.getElementById('variant').value,
        harga: parseInt(harga),
        deskripsi: document.getElementById('deskripsi').value
    };

    if (imgUrl) basePayload.foto_url = imgUrl;

    const lines = bulkInput.split('\n');

    if (!editId) {
        Swal.fire({ title: 'Memproses Data...', background: '#111827', color: '#fff', didOpen: () => Swal.showLoading() });
        for (let line of lines) {
            const currentLine = line.trim();
            if (!currentLine) continue;
            const payload = { ...basePayload, id: generateID(kat) };
            if (currentLine.includes('|')) {
                const parts = currentLine.split('|');
                payload.email = parts[0].trim();
                payload.pw = parts[1].trim();
            } else {
                payload.link = currentLine;
            }
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'apikey': CONFIG.SB_KEY, 'Authorization': `Bearer ${CONFIG.SB_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
    } else {
        const payload = { ...basePayload };
        const singleLine = lines[0].trim();
        if (singleLine.includes('|')) {
            const parts = singleLine.split('|');
            payload.email = parts[0].trim();
            payload.pw = parts[1].trim();
            payload.link = null;
        } else {
            payload.link = singleLine;
            payload.email = null;
            payload.pw = null;
        }
        await fetch(`${API_URL}?id=eq.${editId}`, {
            method: 'PATCH',
            headers: { 'apikey': CONFIG.SB_KEY, 'Authorization': `Bearer ${CONFIG.SB_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    }

    Swal.fire('Berhasil', 'Inventori telah diperbarui', 'success');
    resetForm();
    loadData();
}

async function loadData() {
    const res = await fetch(`${API_URL}?select=*&order=kategori.asc,nama.asc`, {
        headers: { 'apikey': CONFIG.SB_KEY, 'Authorization': `Bearer ${CONFIG.SB_KEY}` }
    });
    const data = await res.json();
    const table = document.getElementById('productTableBody');
    const countLabel = document.getElementById('productCount');
    if(!table) return;
    table.innerHTML = '';
    if(countLabel) countLabel.innerText = `${data.length} Produk`;
    
    data.forEach(item => {
        table.innerHTML += `
            <tr class="hover:bg-blue-500/[0.02] transition-all">
                <td class="p-6">
                    <div class="flex flex-col">
                        <span class="text-[9px] font-black text-blue-500 uppercase tracking-tighter mb-1">${item.kategori}</span>
                        <span class="text-base font-bold text-white uppercase tracking-tight">${item.nama}</span>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="bg-gray-800 text-gray-400 text-[9px] px-2 py-0.5 rounded-md font-bold border border-gray-700">VAR: ${item.variant || 'STANDARD'}</span>
                            <span class="text-[9px] text-gray-600 font-mono">#${item.id}</span>
                        </div>
                    </div>
                </td>
                <td class="p-6">
                    <div class="text-green-500 font-black font-mono text-base">Rp${parseInt(item.harga).toLocaleString()}</div>
                </td>
                <td class="p-6 text-center">
                    <div class="flex items-center justify-center gap-4">
                        <button onclick='prepareEdit(${JSON.stringify(item)})' class="bg-blue-500/10 text-blue-500 p-2 rounded-xl hover:bg-blue-500 hover:text-white transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onclick="deleteData('${item.id}')" class="bg-red-500/10 text-red-500 p-2 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
}

async function deleteData(id) {
    const ask = await Swal.fire({ title: 'Hapus Produk?', text: `ID: ${id}`, icon: 'warning', background: '#111827', color: '#fff', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal' });
    if(ask.isConfirmed) {
        await fetch(`${API_URL}?id=eq.${id}`, {
            method: 'DELETE',
            headers: { 'apikey': CONFIG.SB_KEY, 'Authorization': `Bearer ${CONFIG.SB_KEY}` }
        });
        loadData();
    }
}
