console.log("member.js loaded");

// Cek login user
async function checkLogin() {
    try {
        const res = await fetch('/api/check-session');
        const data = await res.json();
        console.log("Login check:", data);

        if (!data.loggedIn) {
            alert('Silakan login terlebih dahulu.');
            window.location.href = '/login';
        }
    } catch (err) {
        console.error("Check login error:", err);
        window.location.href = '/login';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded (member.js)");

    const container = document.getElementById('book-list-container');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-button');
    const kategoriBukuOptions = document.getElementById('kategori-buku-options');
    const jenisBukuOptions = document.getElementById('jenis-buku-options');
    const filterBtn = document.getElementById('filter-button');
    const filterDropdown = document.getElementById('filter-dropdown');
    const currentFilterText = document.getElementById('current-filter-text');

    // --- Toggle Filter Dropdown ---
    if (filterBtn && filterDropdown) {
        filterBtn.addEventListener('click', () => {
            console.log("Filter button clicked");
            filterDropdown.classList.toggle('show');
        });
    }

    // --- Saat klik salah satu filter ---
    if (filterDropdown && currentFilterText) {
        filterDropdown.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                console.log("Filter selected:", a.dataset.filter);
                currentFilterText.textContent = a.textContent;
                filterDropdown.classList.remove('show');

                // tampilkan pilihan jenis buku hanya jika memilih "Jenis Buku"
                if (a.dataset.filter === "jenis_buku" && jenisBukuOptions) {
                    jenisBukuOptions.classList.remove("hidden");
                } else if (jenisBukuOptions) {
                    jenisBukuOptions.classList.add("hidden");
                }

                // tampilkan pilihan kategori buku
                if (a.dataset.filter === "kategori" && kategoriBukuOptions) {
                    kategoriBukuOptions.classList.remove("hidden");
                } else if (kategoriBukuOptions) {
                    kategoriBukuOptions.classList.add("hidden");
                }
            });
        });
    }

    // --- Klik tombol jenis buku ---
    if (jenisBukuOptions) {
        jenisBukuOptions.querySelectorAll('.jenis-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                console.log("Jenis buku dipilih:", type);
                loadBooks('', type);
            });
        });
    }

    // --- Klik tombol kategori ---
    if (kategoriBukuOptions) {
        kategoriBukuOptions.querySelectorAll('.kategori-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                console.log("Kategori buku dipilih:", category);

                kategoriBukuOptions.querySelectorAll('.kategori-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                loadBooks('', '', category);
            });
        });
    }

    // --- Fungsi memuat daftar buku ---
    async function loadBooks(searchQuery = '', type = '', category = '') {
        console.log("loadBooks called with:", { searchQuery, type, category });
        container.innerHTML = '<p class="col-span-full text-center text-gray-500">Memuat daftar...</p>';

        let url = '/books';
        const params = new URLSearchParams();

        if (["Ebook", "Buku Fisik", "Fisik & Ebook"].includes(searchQuery)) {
            params.append('type', searchQuery);
        } else if (searchQuery) {
            params.append('search', searchQuery);
        }

        if (type && !["Ebook", "Buku Fisik", "Fisik & Ebook"].includes(searchQuery)) {
            params.append('type', type);
        }

        if (category) {
            params.append('category', category);
        }

        if ([...params].length > 0) {
            url += '?' + params.toString();
        }

        console.log("Fetch URL:", url);

        try {
            const res = await fetch(url);
            const text = await res.text();
            const books = JSON.parse(text);

            container.innerHTML = '';
            if (!books || books.length === 0) {
                container.innerHTML = '<p class="col-span-full text-center text-gray-500">Belum ada buku.</p>';
                return;
            }

            books.forEach(book => {
                const card = document.createElement('div');
                card.className = 'bg-white p-4 rounded-lg shadow max-w-xs mx-auto flex flex-col cursor-pointer hover:shadow-lg transition';

                // Arahkan ke halaman buka_buku_member.html
                card.addEventListener('click', () => {
                    window.location.href = `/buka_buku_member.html?id=${book.id}`;
                });

                // Gambar cover
                if (book.coverFile) {
                    const img = document.createElement('img');
                    img.src = '/' + book.coverFile;
                    img.alt = book.title;
                    img.className = 'w-full aspect-[2/3] object-cover rounded mb-3';
                    card.appendChild(img);
                } else {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'w-full aspect-[2/3] bg-gray-200 rounded mb-3 flex items-center justify-center';
                    placeholder.innerHTML = '<i class="fas fa-book text-gray-400 text-3xl"></i>';
                    card.appendChild(placeholder);
                }

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

                container.appendChild(card);
            });

        } catch (err) {
            console.error("Load books error:", err);
            container.innerHTML = '<p class="col-span-full text-center text-red-500">Gagal memuat buku.</p>';
        }
    }

    // --- Event search ---
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            console.log("Search button clicked:", query);
            loadBooks(query);
        });

        searchInput.addEventListener('keyup', e => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                console.log("Enter pressed, query:", query);
                loadBooks(query);
            }
        });
    }

    // --- Load buku awal ---
    loadBooks();
});
