console.log("bookmark.js loaded");

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('book-list-container');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-button');
    const kategoriBukuOptions = document.getElementById('kategori-buku-options');
    const jenisBukuOptions = document.getElementById('jenis-buku-options');

    // State filter
    let currentType = '';
    let currentCategory = '';

    // Pilih jenis buku
    if(jenisBukuOptions) {
        jenisBukuOptions.querySelectorAll('.jenis-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // toggle selected style
                jenisBukuOptions.querySelectorAll('.jenis-btn').forEach(b => b.classList.remove('bg-green-200'));
                btn.classList.add('bg-green-200');

                currentType = btn.dataset.type;
                loadBookmarks(searchInput.value.trim(), currentType, currentCategory);
            });
        });
    }

    // Pilih kategori buku
    if(kategoriBukuOptions) {
        kategoriBukuOptions.querySelectorAll('.kategori-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // toggle selected style
                kategoriBukuOptions.querySelectorAll('.kategori-btn').forEach(b => b.classList.remove('bg-green-200'));
                btn.classList.add('bg-green-200');

                currentCategory = btn.dataset.category;
                loadBookmarks(searchInput.value.trim(), currentType, currentCategory);
            });
        });
    }

    // Event search
    searchBtn.addEventListener('click', () => {
        loadBookmarks(searchInput.value.trim(), currentType, currentCategory);
    });

    searchInput.addEventListener('keyup', e => {
        if(e.key === 'Enter') loadBookmarks(searchInput.value.trim(), currentType, currentCategory);
    });

    // Fungsi load daftar bookmark
    async function loadBookmarks(searchQuery = '', type = '', category = '') {
        container.innerHTML = '<p class="text-center text-gray-500">Memuat daftar bookmark...</p>';

        try {
            let url = '/api/bookmarks';
            const params = new URLSearchParams();
            if(searchQuery) params.append('search', searchQuery);
            if(type) params.append('type', type);
            if(category) params.append('category', category);
            if([...params].length > 0) url += '?' + params.toString();

            const res = await fetch(url, { credentials: 'include' });
            if(!res.ok) throw new Error('Gagal fetch data bookmark');

            const books = await res.json();

            container.innerHTML = '';
            if(!books || books.length === 0) {
                container.innerHTML = '<p class="text-center text-gray-500">Belum ada bookmark.</p>';
                return;
            }

            // layout vertical
            books.forEach(book => {
                const card = document.createElement('div');
                card.className = 'bg-white p-4 rounded-lg shadow mb-4 flex flex-row gap-4 cursor-pointer hover:shadow-lg transition items-start';
                card.addEventListener('click', () => {
                    window.location.href = `/buka_buku_member.html?id=${book.id}`;
                });

                const img = document.createElement('img');
                img.src = book.coverFile ? '/' + book.coverFile : '/uploads/default_book.png';
                img.alt = book.title;
                img.className = 'w-24 h-36 object-cover rounded flex-shrink-0';
                card.appendChild(img);

                const info = document.createElement('div');
                info.className = 'flex-1 flex flex-col';

                const title = document.createElement('h3');
                title.textContent = book.title;
                title.className = 'font-bold text-lg mb-1 truncate';
                info.appendChild(title);

                const author = document.createElement('p');
                author.textContent = `${book.author} (${book.year})`;
                author.className = 'text-sm text-gray-600 mb-1';
                info.appendChild(author);

                const categoryEl = document.createElement('p');
                categoryEl.textContent = book.category;
                categoryEl.className = 'text-gray-700 text-sm line-clamp-3';
                info.appendChild(categoryEl);

                card.appendChild(info);
                container.appendChild(card);
            });

        } catch(err) {
            console.error(err);
            container.innerHTML = '<p class="text-center text-red-500">Gagal memuat bookmark.</p>';
        }
    }

    // Load awal bookmark
    loadBookmarks();
});
