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

async function saveProduct() {
    const fileInput = document.getElementById('foto_file');
    let imgUrl = "";

    if (fileInput.files.length > 0) {
        Swal.fire({ title: 'Processing Image...', background: '#111827', color: '#fff', didOpen: () => Swal.showLoading() });
        imgUrl = await uploadImage(fileInput.files[0]);
    }

    const payload = {
        kategori: document.getElementById('kat').value,
        nama: document.getElementById('nama').value,
        harga: document.getElementById('harga').value,
        email: document.getElementById('email_data').value,
        pw: document.getElementById('pw_data').value,
        link: document.getElementById('link_data').value,
        deskripsi: document.getElementById('deskripsi').value,
        foto_url: imgUrl
    };

    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'apikey': CONFIG.SB_KEY,
            'Authorization': `Bearer ${CONFIG.SB_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if(res.ok) {
        Swal.fire({ icon: 'success', title: 'Inventory Updated', background: '#111827', color: '#fff' });
        loadData();
        document.querySelectorAll('input, textarea').forEach(i => i.value = '');
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
                <td class="p-4 font-bold uppercase tracking-tight">${item.nama}</td>
                <td class="p-4 text-xs font-black text-blue-500">${item.kategori}</td>
                <td class="p-4 text-green-500 font-mono">Rp${parseInt(item.harga).toLocaleString()}</td>
                <td class="p-4 text-center">
                    <button onclick='viewDetail(${JSON.stringify(item)})' class="text-blue-400 text-xs font-bold uppercase mx-2 tracking-widest">Detail</button>
                    <button onclick="deleteData('${item.id}')" class="text-red-600 text-xs font-bold uppercase mx-2 tracking-widest">Delete</button>
                </td>
            </tr>
        `;
    });
}

async function deleteData(id) {
    const ask = await Swal.fire({ title: 'Delete Product?', background: '#111827', color: '#fff', showCancelButton: true });
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
    
    let html = `<p class="mb-2 uppercase text-white font-black">Price: Rp${parseInt(p.harga).toLocaleString()}</p><p>${p.deskripsi}</p>`;
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