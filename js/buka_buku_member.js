console.log("📖 buka_buku_member.js loaded");

// Ambil ID buku dari URL
const params = new URLSearchParams(window.location.search);
const bookId = params.get("id");

// Elemen detail
const detailCover = document.getElementById("detail-cover");
const detailTitle = document.getElementById("detail-title");
const detailAuthor = document.getElementById("detail-author");
const detailTahun = document.getElementById("detail-tahun");
const detailKategori = document.getElementById("detail-kategori");
const detailGenre = document.getElementById("detail-genre");
const detailJenis = document.getElementById("detail-jenis");
const detailSynopsis = document.getElementById("detail-synopsis");
const stockDisplay = document.getElementById("detail-stock");

const btnPinjam = document.getElementById("btn-pinjam");
const btnBaca = document.getElementById("btn-baca");
const bookmarkBtn = document.getElementById("bookmark-btn");

let isBookmarked = false;
let currentBook = null;

// Load detail buku
if (!bookId) {
    alert("ID buku tidak ditemukan!");
} else {
    loadBookDetail();
}

async function loadBookDetail() {
    try {
        const res = await fetch("/books");
        const books = await res.json();
        const book = books.find((b) => b.id == bookId);
        if (!book) return alert("Buku tidak ditemukan!");

        currentBook = book;

        detailCover.src = book.coverFile ? "/" + book.coverFile : "/img/default_book.png";
        detailTitle.textContent = book.title;
        detailAuthor.textContent = book.author;
        detailTahun.textContent = book.year || "-";
        detailKategori.textContent = book.category || "-";
        detailGenre.textContent = book.genre || "-";
        detailJenis.textContent = `Tipe: ${book.type}`;
        detailSynopsis.textContent = book.description || "Tidak ada sinopsis.";

        if (book.type === "Buku Fisik" || book.type === "Fisik & Ebook") {
            stockDisplay.textContent = `Stok tersedia: ${book.stock || 0}`;
        } else {
            stockDisplay.textContent = "";
        }

        // Tombol pinjam/baca
        btnPinjam.dataset.bookId = book.id;
        if (book.type === "Ebook") {
            btnBaca.classList.remove("hidden");
            btnPinjam.classList.add("hidden");
        } else if (book.type === "Fisik & Ebook") {
            btnBaca.classList.remove("hidden");
            btnPinjam.classList.remove("hidden");
        } else if (book.type === "Buku Fisik") {
            btnBaca.classList.add("hidden");
            btnPinjam.classList.remove("hidden");
        } else {
            btnBaca.classList.add("hidden");
            btnPinjam.classList.add("hidden");
        }

        setupButtonActions(book);
        loadBookmarkStatus();

    } catch (err) {
        console.error(err);
        alert("Gagal memuat detail buku.");
    }
}

// ======= Bookmark =======
async function loadBookmarkStatus() {
    try {
        const res = await fetch(`/bookmark?bookId=${bookId}`);
        const data = await res.json();
        isBookmarked = data.bookmarked;
        updateBookmarkUI();
    } catch (err) {
        console.error("Error load bookmark:", err);
    }
}

bookmarkBtn.addEventListener("click", async () => {
    if (!currentBook) return;
    const method = isBookmarked ? "DELETE" : "POST";

    try {
        const res = await fetch("/bookmark", {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookId: currentBook.id }),
            credentials: "include"
        });
        const data = await res.json();
        if (data.success) {
            isBookmarked = !isBookmarked;
            updateBookmarkUI();
            console.log(data.message);
        } else {
            alert("Gagal update bookmark: " + data.message);
        }
    } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan saat update bookmark.");
    }
});

function updateBookmarkUI() {
    if (isBookmarked) {
        bookmarkBtn.classList.add("text-yellow-400");
        bookmarkBtn.classList.remove("text-gray-400");
    } else {
        bookmarkBtn.classList.add("text-gray-400");
        bookmarkBtn.classList.remove("text-yellow-400");
    }
}

// ======= Pinjam / Baca =======
function setupButtonActions(book) {
    btnBaca.onclick = () => {
        if (!book.ebookFile) return alert("Ebook belum tersedia.");
        window.open("/" + book.ebookFile, "_blank");
    };

    btnPinjam.onclick = async () => {
        if (!confirm(`Yakin ingin meminjam buku ini?`)) return;
        try {
            const res = await fetch("/pinjambuku", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ book_id: book.id }),
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                alert(`Berhasil meminjam buku: ${data.title}`);
                if (book.type !== "Ebook") stockDisplay.textContent = `Stok tersedia: ${data.stock}`;
                book.stock = data.stock;
            } else alert("Gagal meminjam: " + data.message);
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan saat meminjam buku.");
        }
    };
}
