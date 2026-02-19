const checkAuth = () => {
    const session = localStorage.getItem("snzmart_session");
    if (!session && !window.location.href.includes("index.html")) {
        window.location.href = "index.html";
    }
};

const handleLogout = () => {
    localStorage.removeItem("snzmart_session");
    window.location.href = "index.html";
};

const updateTime = () => {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    if (document.getElementById('clock')) {
        document.getElementById('clock').textContent = now.toLocaleTimeString('en-US', { hour12: false });
        document.getElementById('date').textContent = now.toLocaleDateString('id-ID', options);
    }
};

async function loadData() {
    const tableBody = document.getElementById('productTableBody');
    if (!tableBody) return;
    try {
        const res = await fetch(`${CONFIG.SB_URL}/rest/v1/produk?select=*&order=created_at.desc`, {
            method: 'GET',
            headers: {
                'apikey': CONFIG.SB_KEY,
                'Authorization': `Bearer ${CONFIG.SB_KEY}`
            }
        });
        const data = await res.json();
        tableBody.innerHTML = '';
        data.forEach((item, index) => {
            const row = `
                <tr class="border-b border-gray-800 hover:bg-white/5 transition">
                    <td class="p-4 text-xs text-gray-500">${index + 1}</td>
                    <td class="p-4">
                        <div class="flex items-center gap-3">
                            <img src="${item.foto_url || 'https://placehold.co/40x40?text=No+Img'}" class="w-10 h-10 rounded-lg object-cover border border-gray-700">
                            <div>
                                <div class="text-sm font-bold text-white">${item.nama}</div>
                                <div class="text-[10px] text-gray-500 tracking-widest uppercase">${item.id}</div>
                            </div>
                        </div>
                    </td>
                    <td class="p-4">
                        <span class="bg-blue-500/10 text-blue-500 text-[10px] font-bold px-2 py-1 rounded-md border border-blue-500/20">${item.kategori}</span>
                    </td>
                    <td class="p-4 text-sm font-bold text-green-400">Rp ${Number(item.harga).toLocaleString('id-ID')}</td>
                    <td class="p-4">
                        <div class="text-xs text-gray-300">${item.variant || '-'}</div>
                        <div class="text-[10px] text-gray-500">${item.email || ''}</div>
                    </td>
                    <td class="p-4">
                        <button onclick="deleteProduct('${item.id}')" class="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    } catch (err) {
        console.error(err);
    }
}

async function saveProduct(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Memproses...';
    const payload = {
        id: document.getElementById('p_id').value,
        nama: document.getElementById('p_nama').value,
        harga: parseInt(document.getElementById('p_harga').value),
        kategori: document.getElementById('p_kategori').value.toUpperCase(),
        variant: document.getElementById('p_variant').value,
        email: document.getElementById('p_email').value,
        pw: document.getElementById('p_pw').value,
        link: document.getElementById('p_link').value,
        foto_url: document.getElementById('p_foto').value,
        deskripsi: document.getElementById('p_desc').value
    };
    try {
        const res = await fetch(`${CONFIG.SB_URL}/rest/v1/produk`, {
            method: 'POST',
            headers: {
                'apikey': CONFIG.SB_KEY,
                'Authorization': `Bearer ${CONFIG.SB_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            alert('Produk Berhasil Ditambahkan!');
            window.location.reload();
        } else {
            const errorData = await res.json();
            alert('Gagal menyimpan: ' + (errorData.message || 'Cek SQL Policy Supabase'));
        }
    } catch (err) {
        alert('Terjadi kesalahan jaringan!');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function deleteProduct(id) {
    if (!confirm('Hapus produk ini?')) return;
    try {
        const res = await fetch(`${CONFIG.SB_URL}/rest/v1/produk?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': CONFIG.SB_KEY,
                'Authorization': `Bearer ${CONFIG.SB_KEY}`
            }
        });
        if (res.ok) {
            loadData();
        } else {
            alert('Gagal menghapus produk. Pastikan Policy DELETE aktif.');
        }
    } catch (err) {
        console.error(err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    updateTime();
    setInterval(updateTime, 1000);
    const pForm = document.getElementById('productForm');
    if (pForm) {
        pForm.addEventListener('submit', saveProduct);
    }
    loadData();
});
