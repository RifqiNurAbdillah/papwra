document.addEventListener("DOMContentLoaded", () => {
    const ebookBtn = document.getElementById("tab-ebook");
    const historyBtn = document.getElementById("tab-history");
    const searchInput = document.getElementById("search-input");
    const searchBtn = document.getElementById("search-button");
    const bookContainer = document.getElementById('book-list-container');
    const historyContainer = document.getElementById("history-container");

    let activeTab = 'ebook';
    let historyStatusFilter = "";


    // ================= Load Books =================
async function loadBooks(searchQuery = '', type = '', category = '') {
    console.log("loadBooks called with:", { searchQuery, type, category });
    bookContainer.innerHTML = '<p class="col-span-full text-center text-gray-500">Memuat daftar...</p>';

    let url = '/books';
    const params = new URLSearchParams();

    // Search teks
    if (searchQuery && !["Ebook", "Buku Fisik", "Fisik & Ebook"].includes(searchQuery)) {
        params.append('search', searchQuery);
    }

    // Filter jenis buku
    if (type) params.append('type', type);

    // Filter kategori
    if (category) params.append('category', category);

    if ([...params].length > 0) url += '?' + params.toString();
    console.log("Fetch URL:", url);

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("HTTP error " + res.status);
        const books = await res.json();

        bookContainer.innerHTML = '';
        if (!books || books.length === 0) {
            bookContainer.innerHTML = '<p class="col-span-full text-center text-gray-500">Belum ada buku.</p>';
            return;
        }

        books.forEach(book => {
            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded-lg shadow max-w-xs mx-auto flex flex-col cursor-pointer hover:shadow-lg transition';

            card.addEventListener('click', () => {
                window.location.href = `/buka_buku_member.html?id=${book.id}`;
            });

            const img = document.createElement('img');
            img.src = book.coverFile ? '/' + book.coverFile : '/uploads/default_book.png';
            img.alt = book.title;
            img.className = 'w-full aspect-[2/3] object-cover rounded mb-3';
            card.appendChild(img);

            const title = document.createElement('h3');
            title.textContent = book.title;
            title.className = 'font-bold text-lg mb-1 truncate';
            card.appendChild(title);

            const author = document.createElement('p');
            author.textContent = `${book.author} (${book.year})`;
            author.className = 'text-sm text-gray-600 mb-1';
            card.appendChild(author);

            const categoryEl = document.createElement('p');
            categoryEl.textContent = book.category;
            categoryEl.className = 'text-gray-700 text-sm line-clamp-3';
            card.appendChild(categoryEl);

            bookContainer.appendChild(card);
        });

    } catch (err) {
        console.error("Load books error:", err);
        bookContainer.innerHTML = '<p class="col-span-full text-center text-red-500">Gagal memuat buku.</p>';
    }
}


// ================= Load History =================
async function loadHistory(searchQuery = '') {
    historyContainer.innerHTML = '<p class="text-center text-gray-500">Memuat riwayat...</p>';
    try {
        const res = await fetch('/api/riwayat-pinjam');
        const history = await res.json();
        historyContainer.innerHTML = '';

        if (!history || history.length === 0) {
            historyContainer.innerHTML = '<p class="text-center text-gray-500">Belum ada riwayat pinjam.</p>';
            return;
        }

        const filtered = history.filter(item => 
            item.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.id.toString().includes(searchQuery)
        );

        filtered.forEach(item => {
            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded-lg shadow-md flex flex-row gap-4 items-start justify-between';

            // Sampul
            const img = document.createElement('img');
            img.src = item.coverFile ? '/' + item.coverFile : '/uploads/default_book.png';
            img.alt = item.bookTitle;
            img.className = 'w-24 h-32 object-cover rounded flex-shrink-0';
            card.appendChild(img);

            // Info di samping
            const info = document.createElement('div');
            info.className = 'flex flex-col gap-1 flex-1';

            // 🔥 Tambahkan ID Transaksi
            const trxId = document.createElement("p");
            trxId.textContent = `ID Transaksi: ${item.id}`;
            trxId.className = "text-xs text-gray-500";
            info.appendChild(trxId) ;


            const title = document.createElement('h3');
            title.textContent = item.bookTitle;
            title.className = 'font-bold text-lg truncate';
            info.appendChild(title);

            const dateRequested = document.createElement('p');
            const requestedDate = new Date(item.dateRequested);
            dateRequested.textContent = `Tanggal Diajukan: ${requestedDate.toLocaleDateString()} ${requestedDate.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
            dateRequested.className = 'text-sm text-gray-600';
            info.appendChild(dateRequested);

                            // Tanggal Berakhir / dateDue + hitung keterlambatan
            // 🔹 Tanggal Berakhir / dateDue + hitung keterlambatan
            const dateDue = document.createElement("p");

            if (item.dateDue) {
                const dueDate = new Date(item.dateDue);
                dateDue.textContent = `Tanggal Berakhir: ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;

                // Hitung keterlambatan
                const now = new Date();
                const lateMs = now - dueDate;
                if (lateMs > 0) {
                    const lateDays = Math.floor(lateMs / (1000 * 60 * 60 * 24));
                    dateDue.textContent += ` (Terlambat: ${lateDays} hari)`;

                    // Opsional: tambahkan info denda jika ada
                    if (item.finePerDay && item.fineTotal != null) {
                        const fineDue = lateDays * Number(item.finePerDay);
                        dateDue.textContent += ` | Denda sementara: Rp ${fineDue.toLocaleString("id-ID")}`;
                    }
                }
            } else {
                dateDue.textContent = "Tanggal Berakhir: -";
            }

            dateDue.className = "text-sm text-gray-600";
            info.appendChild(dateDue);
            // Status + tombol wrapper
            const statusWrapper = document.createElement('div');
            statusWrapper.className = 'flex items-center gap-2 mt-1';

            const status = document.createElement('span');
            status.textContent = item.status;
            status.className = 'px-2 py-1 rounded font-semibold text-sm';
            switch(item.status) {
                case 'DIAJUKAN':
                    status.classList.add('bg-yellow-100','text-yellow-800');
                    break;
                case 'DIPINJAM':
                    status.classList.add('bg-blue-100','text-blue-800');
                    break;
                case 'SELESAI':
                    status.classList.add('bg-green-100','text-green-800');
                    break;
                case 'DITOLAK':
                    status.classList.add('bg-red-100','text-red-800');
                    break;
            }
            statusWrapper.appendChild(status);

            // Tombol Batalkan untuk member, status DIAJUKAN
            if(item.status === 'DIAJUKAN') {
                const cancelBtn = document.createElement('button');
                cancelBtn.textContent = 'Batalkan';
                cancelBtn.className = 'bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs';
                cancelBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if(confirm('Apakah Anda yakin ingin membatalkan peminjaman ini?')) {
                        try {
                            const res = await fetch(`/api/member/riwayat-pinjam/${item.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({})
                            });
                            if(res.ok) {
                                alert('Peminjaman dibatalkan');
                                loadHistory(searchQuery);
                            } else {
                                const errText = await res.text();
                                alert('Gagal membatalkan peminjaman: ' + errText);
                            }
                        } catch(err) {
                            console.error(err);
                            alert('Terjadi kesalahan saat membatalkan peminjaman');
                        }
                    }
                });
                statusWrapper.appendChild(cancelBtn);
            }

            info.appendChild(statusWrapper);

            // 🔥 FOOTER DENDA DI POJOK KANAN BAWAH
            const footer = document.createElement("div");
            footer.className = "mt-3 text-right";

            const fine = document.createElement("p");
            fine.className = "text-sm font-semibold text-red-600";
            fine.textContent = `Denda: Rp ${Number(item.fineTotal).toLocaleString("id-ID")}`;

            footer.appendChild(fine);
            info.appendChild(footer);

            card.appendChild(info);
            historyContainer.appendChild(card);

            // 🔥 Tombol Invoice PDF
            const invoiceBtn = document.createElement("button");
            invoiceBtn.textContent = "Invoice PDF";
            invoiceBtn.className = "bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 text-xs";
            invoiceBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                generateInvoice(item);
            });
            statusWrapper.appendChild(invoiceBtn);
        });

    } catch (err) {
        console.error(err);
        historyContainer.innerHTML = '<p class="text-center text-red-500">Gagal memuat riwayat.</p>';
    }
}

const filterButtons = document.querySelectorAll("#jenis-pinjam-options button");

filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        historyStatusFilter = btn.dataset.status || "";

        // 🔥 Sembunyikan dulu agar tidak kedip
        historyContainer.classList.add("opacity-0");

        loadHistory(searchInput.value.trim());

        setTimeout(() => {
            applyStatusFilter();
            historyContainer.classList.remove("opacity-0"); 
        }, 150);
    });
});


function applyStatusFilter() {
    const cards = historyContainer.querySelectorAll("div"); // tiap card
    
    cards.forEach(card => {
        const statusEl = card.querySelector("span");
        if (!statusEl) return;

        const status = statusEl.textContent.trim();

        if (historyStatusFilter === "" || status === historyStatusFilter) {
            card.classList.remove("hidden");
        } else {
            card.classList.add("hidden");
        }
    });
}


    // ================= Tab Handling =================
    function resetTabs() {
        ebookBtn.classList.remove("border-indigo-600", "text-indigo-600");
        historyBtn.classList.remove("border-indigo-600", "text-indigo-600");
        bookContainer.classList.add("hidden");
        historyContainer.classList.add("hidden");
    }

    const filterOptions = document.getElementById("jenis-pinjam-options");


    function activateTab(tab) {
        resetTabs();
        
        if(tab === 'ebook') {
            activeTab = 'ebook';
            ebookBtn.classList.add("border-indigo-600","text-indigo-600");
            searchInput.placeholder = "Masukan Judul Buku atau Genre...";
            bookContainer.classList.remove("hidden");

            // sembunyikan filter saat di tab ebook
            filterOptions.classList.add("hidden");

            loadBooks(searchInput.value.trim());
        } 
        
else if(tab === 'history') {
    activeTab = 'history';
    historyBtn.classList.add("border-indigo-600","text-indigo-600");
    searchInput.placeholder = "Cari Berdasarkan ID Transaksi...";
    historyContainer.classList.remove("hidden");

    filterOptions.classList.remove("hidden");

    // 🔥 Sembunyikan semua card sebelum loadHistory selesai (CEGAH BLINK)
    historyContainer.classList.add("opacity-0");

    loadHistory(searchInput.value.trim());

    setTimeout(() => {
        applyStatusFilter();
        historyContainer.classList.remove("opacity-0"); // Tampilkan setelah filter
    }, 150);
}



    }


    ebookBtn.addEventListener('click', () => activateTab('ebook'));
    historyBtn.addEventListener('click', () => activateTab('history'));

    // ================= Search =================
    function performSearch() {
        if(activeTab === 'ebook') loadBooks(searchInput.value.trim());
        else if(activeTab === 'history') loadHistory(searchInput.value.trim());
    }

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', e => { if(e.key === 'Enter') performSearch(); });

    // Load awal
    activateTab('ebook');
});

async function generateInvoice(item) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Invoice Peminjaman Buku", 14, 20);

const reqDate = new Date(item.dateRequested);
    // Tabel (jika ingin rapi)
    doc.autoTable({
        startY: 30,
        head: [["Keterangan", "Detail"]],
        body: [
            ["ID Transaksi", item.id],
            ["Judul Buku", item.bookTitle],
            ["Status", item.status],
            ["Tanggal Diajukan", reqDate.toLocaleDateString()],
            ["Denda", "Rp " + Number(item.fineTotal).toLocaleString("id-ID")],
        ],
    });

    // Simpan PDF
    doc.save(`invoice-${item.id}.pdf`);
}
