const API_URL = `${CONFIG.SB_URL}/rest/v1/produk`;

function handleLogin() {
    const e = document.getElementById('loginEmail').value;
    const p = document.getElementById('loginPw').value;
    if(e === CONFIG.ADMIN_AUTH.email && p === CONFIG.ADMIN_AUTH.pw) {
        localStorage.setItem('snzmart_token', 'active');
        window.location.href = 'dashboard.html';
    } else {
        Swal.fire({ icon: 'error', title: 'Akses Gagal', text: 'Email atau Password salah!', background: '#111827', color: '#fff' });
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

function toggleFields() {
    const kat = document.getElementById('kat').value;
    document.getElementById('field_akun').classList.toggle('hidden', kat !== 'AKUN');
    document.getElementById('field_item').classList.toggle('hidden', kat !== 'ITEM');
}

function generateID(kategori) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${kategori.toUpperCase()}-${randomNum}`;
}

async function uploadImage(file) {
    const fileName = `${Date.now()}_${file.name}`;
    const uploadPath = `${CONFIG.SB_URL}/storage/v1/object/${CONFIG.BUCKET_NAME}/${fileName}`;
    const publicUrl = `${CONFIG.SB_URL}/storage/v1/object/public/${CONFIG.BUCKET_NAME}/${fileName}`;
    const res = await fetch(uploadPath, {
        method: 'POST',
        headers: {
            'apikey': CONFIG.SB_KEY,
            'Authorization': `Bearer ${CONFIG.SB_KEY}`
        },
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
    toggleFields();
    if (item.kategori === 'AKUN') {
        document.getElementById('bulk_akun').value = `${item.email}|${item.pw}`;
    } else {
        document.getElementById('link_data').value = item.link || '';
    }
    const btnSave = document.getElementById('btn_save');
    btnSave.innerText = "UPDATE PRODUCT DATA";
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
    document.getElementById('bulk_akun').value = '';
    document.getElementById('link_data').value = '';
    document.getElementById('foto_file').value = '';
    const btnSave = document.getElementById('btn_save');
    btnSave.innerText = "UPLOAD PRODUCT";
    btnSave.classList.replace('bg-green-600', 'bg-blue-600');
    document.getElementById('btn_cancel').classList.add('hidden');
}

async function saveProduct() {
    const editId = document.getElementById('edit_id').value;
    const fileInput = document.getElementById('foto_file');
    const kat = document.getElementById('kat').value;
    const nama = document.getElementById('nama').value;
    const harga = document.getElementById('harga').value;
    if (!nama || !harga) return Swal.fire('Error', 'Nama & Harga wajib isi', 'error');
    let imgUrl = "";
    if (fileInput.files.length > 0) {
        Swal.fire({ title: 'Processing Image...', background: '#111827', color: '#fff', didOpen: () => Swal.showLoading() });
        imgUrl = await uploadImage(fileInput.files[0]);
    }
    const basePayload = {
        kategori: kat,
        nama: nama,
        variant: document.getElementById('variant').value,
        harga: parseInt(harga),
        deskripsi: document.getElementById('deskripsi').value,
        link: document.getElementById('link_data').value
    };
    if (imgUrl) basePayload.foto_url = imgUrl;
    if (kat === 'AKUN' && !editId) {
        const lines = document.getElementById('bulk_akun').value.trim().split('\n');
        for (let line of lines) {
            if (!line.includes('|')) continue;
            const [email, pw] = line.split('|');
            const payload = { ...basePayload, id: generateID(kat), email: email.trim(), pw: pw.trim() };
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'apikey': CONFIG.SB_KEY, 'Authorization': `Bearer ${CONFIG.SB_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
    } else {
        const payload = { ...basePayload };
        if (kat === 'AKUN') {
            const acc = document.getElementById('bulk_akun').value.split('|');
            payload.email = acc[0] ? acc[0].trim() : '';
            payload.pw = acc[1] ? acc[1].trim() : '';
        }
        const method = editId ? 'PATCH' : 'POST';
        const url = editId ? `${API_URL}?id=eq.${editId}` : API_URL;
        if (!editId) payload.id = generateID(kat);
        await fetch(url, {
            method: method,
            headers: { 'apikey': CONFIG.SB_KEY, 'Authorization': `Bearer ${CONFIG.SB_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    }
    Swal.fire('Success', 'Inventory Updated', 'success');
    resetForm();
    loadData();
}

async function loadData() {
    const res = await fetch(`${API_URL}?select=*&order=created_at.desc`, {
        headers: { 'apikey': CONFIG.SB_KEY, 'Authorization': `Bearer ${CONFIG.SB_KEY}` }
    });
    const data = await res.json();
    const table = document.getElementById('productTableBody');
    if(!table) return;
    table.innerHTML = '';
    data.forEach(item => {
        table.innerHTML += `
            <tr class="border-b border-gray-900 hover:bg-gray-900/50 transition">
                <td class="p-4">
                    <div class="font-bold uppercase tracking-tight">${item.nama}</div>
                    <div class="text-[10px] text-blue-500 font-mono">${item.variant || '-'}</div>
                    <div class="text-[9px] text-gray-600 font-mono">${item.id}</div>
                </td>
                <td class="p-4 text-xs font-black text-gray-500 text-center">${item.kategori}</td>
                <td class="p-4 text-green-500 font-mono">Rp${parseInt(item.harga).toLocaleString()}</td>
                <td class="p-4 text-center">
                    <button onclick='prepareEdit(${JSON.stringify(item)})' class="text-blue-400 text-xs font-bold uppercase mx-1">Edit</button>
                    <button onclick="deleteData('${item.id}')" class="text-red-600 text-xs font-bold uppercase mx-1">Del</button>
                </td>
            </tr>
        `;
    });
}

async function deleteData(id) {
    const ask = await Swal.fire({ title: 'Delete?', text: id, background: '#111827', color: '#fff', showCancelButton: true });
    if(ask.isConfirmed) {
        await fetch(`${API_URL}?id=eq.${id}`, {
            method: 'DELETE',
            headers: { 'apikey': CONFIG.SB_KEY, 'Authorization': `Bearer ${CONFIG.SB_KEY}` }
        });
        loadData();
    }
}
