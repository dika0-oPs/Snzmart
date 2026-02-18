const API_URL = `${CONFIG.SB_URL}/rest/v1/produk`;

function handleLogin() {
    const e = document.getElementById('loginEmail').value;
    const p = document.getElementById('loginPw').value;
    if(e === CONFIG.ADMIN_AUTH.email && p === CONFIG.ADMIN_AUTH.pw) {
        localStorage.setItem('snzmart_token', 'active');
        window.location.href = 'dashboard.html';
    } else {
        Swal.fire({ icon: 'error', title: 'Akses Gagal', background: '#111827', color: '#fff' });
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
    document.getElementById('harga').value = item.harga;
    document.getElementById('deskripsi').value = item.deskripsi;
    
    toggleFields();

    if (item.kategori === 'AKUN') {
        document.getElementById('email_data').value = item.email || '';
        document.getElementById('pw_data').value = item.pw || '';
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
    const editId = document.getElementById('edit_id');
    if(editId) editId.value = '';
    
    document.getElementById('nama').value = '';
    document.getElementById('harga').value = '';
    document.getElementById('deskripsi').value = '';
    document.getElementById('email_data').value = '';
    document.getElementById('pw_data').value = '';
    document.getElementById('link_data').value = '';
    document.getElementById('foto_file').value = '';
    
    const btnSave = document.getElementById('btn_save');
    btnSave.innerText = "UPLOAD TO SNZMART";
    btnSave.classList.replace('bg-green-600', 'bg-blue-600');
    document.getElementById('btn_cancel').classList.add('hidden');
}

async function saveProduct() {
    const editIdInput = document.getElementById('edit_id');
    const editId = editIdInput ? editIdInput.value : null;
    const fileInput = document.getElementById('foto_file');
    const nama = document.getElementById('nama').value;
    const harga = document.getElementById('harga').value;

    if (!nama || !harga) {
        return Swal.fire({ icon: 'warning', title: 'Data Belum Lengkap', background: '#111827', color: '#fff' });
    }

    let imgUrl = "";
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file.size > 2 * 1024 * 1024) {
            return Swal.fire({ icon: 'error', title: 'File Terlalu Besar', text: 'Maksimal 2MB', background: '#111827', color: '#fff' });
        }
        Swal.fire({ title: 'Processing...', background: '#111827', color: '#fff', didOpen: () => Swal.showLoading() });
        imgUrl = await uploadImage(file);
    }

    const payload = {
        kategori: document.getElementById('kat').value,
        nama: nama,
        harga: parseInt(harga),
        email: document.getElementById('email_data').value,
        pw: document.getElementById('pw_data').value,
        link: document.getElementById('link_data').value,
        deskripsi: document.getElementById('deskripsi').value
    };

    if (imgUrl) payload.foto_url = imgUrl;

    let res;
    if (editId) {
        res = await fetch(`${API_URL}?id=eq.${editId}`, {
            method: 'PATCH',
            headers: {
                'apikey': CONFIG.SB_KEY,
                'Authorization': `Bearer ${CONFIG.SB_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    } else {
        payload.id = generateID(payload.kategori);
        res = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'apikey': CONFIG.SB_KEY,
                'Authorization': `Bearer ${CONFIG.SB_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    }

    if(res.ok) {
        Swal.fire({ icon: 'success', title: editId ? 'Data Updated' : 'Product Uploaded', background: '#111827', color: '#fff' });
        resetForm();
        loadData();
    }
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
                    <div class="text-[9px] text-gray-600 font-mono">${item.id}</div>
                </td>
                <td class="p-4 text-xs font-black text-blue-500">${item.kategori}</td>
                <td class="p-4 text-green-500 font-mono">Rp${parseInt(item.harga).toLocaleString()}</td>
                <td class="p-4 text-center">
                    <button onclick='prepareEdit(${JSON.stringify(item)})' class="text-blue-400 text-xs font-bold uppercase mx-2">Edit</button>
                    <button onclick='viewDetail(${JSON.stringify(item)})' class="text-gray-400 text-xs font-bold uppercase mx-2">Detail</button>
                    <button onclick="deleteData('${item.id}')" class="text-red-600 text-xs font-bold uppercase mx-2">Delete</button>
                </td>
            </tr>
        `;
    });
}

async function deleteData(id) {
    const ask = await Swal.fire({ title: 'Delete Product?', text: id, background: '#111827', color: '#fff', showCancelButton: true });
    if(ask.isConfirmed) {
        await fetch(`${API_URL}?id=eq.${id}`, {
            method: 'DELETE',
            headers: { 'apikey': CONFIG.SB_KEY, 'Authorization': `Bearer ${CONFIG.SB_KEY}` }
        });
        loadData();
    }
}

function viewDetail(p) {
    document.getElementById('previewModal').classList.remove('hidden');
    document.getElementById('p_nama').innerText = p.nama;
    document.getElementById('p_foto').src = p.foto_url || 'https://via.placeholder.com/400x200?text=No+Image';
    let html = `<p class="mb-1 text-gray-500 text-[10px] font-mono">ID: ${p.id}</p>`;
    html += `<p class="mb-2 uppercase text-white font-black">Price: Rp${parseInt(p.harga).toLocaleString()}</p><p>${p.deskripsi}</p>`;
    if(p.kategori === 'AKUN') {
        html += `<div class="bg-black p-4 mt-4 rounded-2xl border border-gray-800 font-mono text-xs"><p class="text-blue-400">EMAIL: ${p.email}</p><p class="text-blue-400">PASS: ${p.pw}</p></div>`;
    } else {
        html += `<div class="bg-black p-4 mt-4 rounded-2xl border border-gray-800 font-mono text-xs"><p class="text-blue-400 break-all">LINK: ${p.link}</p></div>`;
    }
    document.getElementById('detailArea').innerHTML = html;
}

function closePreview() {
    document.getElementById('previewModal').classList.add('hidden');
}
