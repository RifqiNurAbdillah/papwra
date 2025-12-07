document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search-input");
    const searchBtn = document.getElementById("search-button");
    const bookListContainer = document.getElementById("book-list-container");

    const statuses = ['DIAJUKAN', 'DIPINJAM','DITOLAK','DIKEMBALIKAN','HILANG', 'DIBATALKAN'];
    const adminStatuses = ['DIPINJAM','DITOLAK','DIKEMBALIKAN','HILANG'];

    let adminStatusFilter = "";

    async function loadDaftarPinjam(searchQuery = '') {
        bookListContainer.innerHTML = `<p class="text-center text-gray-500">Memuat daftar...</p>`;

        try {
            const res = await fetch("http://localhost:8080/api/admin/daftar-pinjam/", {
                credentials: "include"
            });
            if (!res.ok) throw new Error("Gagal memuat data");

            const data = await res.json();
            bookListContainer.innerHTML = '';

            if (!data || data.length === 0) {
                bookListContainer.innerHTML = `<p class="text-center text-gray-500">Belum ada pengajuan</p>`;
                return;
            }

            const filtered = data.filter(item =>
                item.id.toString().includes(searchQuery)
            );


            filtered.forEach(item => {
                const card = document.createElement("div");
                card.className = "bg-white p-4 rounded-lg shadow-md flex flex-row gap-4 items-start";

                // Sampul
                const img = document.createElement("img");
                img.src = item.coverFile ? "/" + item.coverFile : "/uploads/default_book.png";
                img.alt = item.bookTitle;
                img.className = "w-24 h-32 object-cover rounded flex-shrink-0";
                card.appendChild(img);

                // Info
                const info = document.createElement("div");
                info.className = "flex flex-col gap-1 flex-1";

                                // 🔥 Tambahkan ID Transaksi
                const trxId = document.createElement("p");
                trxId.textContent = `ID Transaksi: ${item.id}`;
                trxId.className = "text-xs text-gray-500";
                info.appendChild(trxId);

                const user = document.createElement("h3");
                user.innerHTML = `Peminjam: <b>${item.userName}</b>`;
                user.className = "font-bold text-sm text-gray-700";
                info.appendChild(user);

                const title = document.createElement("p");
                title.textContent = `Judul: ${item.bookTitle}`;
                title.className = "text-lg truncate";
                info.appendChild(title);

                const dateRequested = document.createElement("p");
                const reqDate = new Date(item.dateRequested);
                dateRequested.textContent = `Tanggal Diajukan: ${reqDate.toLocaleDateString()} ${reqDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
                dateRequested.className = "text-sm text-gray-600";
                info.appendChild(dateRequested);

                // 🔹 Tanggal Berakhir / dateDue
                // Tanggal Berakhir / dateDue + hitung keterlambatan
                const dateDue = document.createElement("p");

                if (item.dateDue) {
                    const dueDate = new Date(item.dateDue);
                    dateDue.textContent = `Tanggal Berakhir: ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;

                    // Hitung keterlambatan
                    const now = new Date();
                    const lateMs = now - dueDate; // selisih dalam ms
                    if (lateMs > 0) {
                        const lateDays = Math.floor(lateMs / (1000 * 60 * 60 * 24));
                        dateDue.textContent += ` (Terlambat: ${lateDays} hari)`;
                    }
                } else {
                    dateDue.textContent = "Tanggal Berakhir: -";
                }

                dateDue.className = "text-sm text-gray-600";
                info.appendChild(dateDue);


                // Status dropdown
                const statusWrapper = document.createElement("div");
                statusWrapper.className = "flex flex-col mt-2";

                const statusLabel = document.createElement("label");
                statusLabel.textContent = "Status:";
                statusLabel.className = "text-sm font-semibold";
                statusWrapper.appendChild(statusLabel);

                const select = document.createElement("select");
                select.className = "border rounded px-2 py-1 w-48";

                // Jika status saat ini DIAJUKAN/DIBATALKAN, tambahkan sebagai hidden option
                if (['DIAJUKAN', 'DIBATALKAN'].includes(item.status)) {
                    const hiddenOption = document.createElement("option");
                    hiddenOption.value = item.status;
                    hiddenOption.textContent = item.status;
                    hiddenOption.selected = true;
                    hiddenOption.style.display = "none"; // hilang dari dropdown
                    select.appendChild(hiddenOption);
                }

                // Tambahkan semua status yang bisa admin ubah
                adminStatuses.forEach(s => {
                    const opt = document.createElement("option");
                    opt.value = s;
                    opt.textContent = s;

                    // Jika status saat ini DITOLAK atau DIBATALKAN, disable dropdown
                    if (['DITOLAK', 'DIBATALKAN', 'DIKEMBALIKAN', 'HILANG'].includes(item.status)) {
                        select.disabled = true;
                    }

                    if (s === item.status) opt.selected = true;
                    select.appendChild(opt);
                });

                statusWrapper.appendChild(select);

                // Event update status
                select.addEventListener("change", async () => {
                    const newStatus = select.value;
                    if (['DITOLAK', 'DIBATALKAN',  'DIKEMBALIKAN', 'HILANG'].includes(item.status)) {
                        alert("Status ini tidak bisa diubah");
                        select.value = item.status;
                        return;
                    }

                    try {
                        const res = await fetch(`http://localhost:8080/api/admin/daftar-pinjam/${item.id}`, {
                            method: "PATCH",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: newStatus })
                        });
                        if (!res.ok) throw new Error("Gagal update status");

                        await loadDaftarPinjam(searchInput.value.trim());
                        alert(`Status berhasil diubah menjadi ${newStatus}`);
                    } catch (err) {
                        alert("Gagal update status");
                        console.error(err);
                        select.value = item.status; // rollback
                    }
                });

                info.appendChild(statusWrapper);

                // 🔥 FOOTER DENDA DI POJOK KANAN BAWAH
                const footer = document.createElement("div");
                footer.className = "mt-3 text-right";

                const fine = document.createElement("p");
                fine.className = "text-sm font-semibold text-red-600";
                fine.textContent = `Denda: Rp ${Number(item.fineTotal).toLocaleString("id-ID")}`;

                footer.appendChild(fine);
                info.appendChild(footer);

                // Tambahkan info ke kartu
                card.appendChild(info);
                bookListContainer.appendChild(card);

            });

        } catch (err) {
            console.error(err);
            bookListContainer.innerHTML = `<p class="text-center text-red-500">Gagal memuat daftar.</p>`;
        }
    }


    function applyAdminStatusFilter() {
    const cards = bookListContainer.querySelectorAll("div.bg-white");

    cards.forEach(card => {
        const statusSelect = card.querySelector("select");
        if (!statusSelect) return;

        const status = statusSelect.value.trim();

        if (adminStatusFilter === "" || status === adminStatusFilter) {
            card.classList.remove("hidden");
        } else {
            card.classList.add("hidden");
        }
    });
}


const adminFilterButtons = document.querySelectorAll("#admin-filter-options button");

adminFilterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        adminStatusFilter = btn.dataset.status || "";

        // Hilangkan opacity untuk efek smooth
        bookListContainer.classList.add("opacity-0");

        // Cukup apply filter tanpa load ulang dari server
        setTimeout(() => {
            applyAdminStatusFilter();
            bookListContainer.classList.remove("opacity-0");
        }, 150);
    });
});

    function performSearch() {
        loadDaftarPinjam(searchInput.value.trim());
    }

    searchBtn.addEventListener("click", performSearch);
    searchInput.addEventListener("keyup", e => { if (e.key === "Enter") performSearch(); });

    loadDaftarPinjam();
});
