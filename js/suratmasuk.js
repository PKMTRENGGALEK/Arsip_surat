// =================================================================
// LOGIKA UNTUK HALAMAN SURAT MASUK (SERVER-SIDE DATATABLES & MODAL)
// =================================================================

function initSuratMasukPage() {
  console.log("Initializing Surat Masuk page...");

  // --- 1. INISIALISASI DATATABLES ---
  if (typeof $ === "undefined") {
    console.error("jQuery tidak ditemukan.");
    return;
  }
  if (typeof $.fn.DataTable === "undefined") {
    console.error("DataTables tidak ditemukan.");
    return;
  }
  if (!$("#suratMasukTable").length) {
    console.error("Elemen tabel #suratMasukTable tidak ditemukan.");
    return;
  }

  const suratTable = $("#suratMasukTable").DataTable({
    processing: true,
    serverSide: true,
    responsive: true,
    pageLength: 10,
    ajax: {
      url: "https://script.google.com/macros/s/AKfycbwMOakn0M2r7qwy-j2DhcT581Ia0X_-8Gs2I3l6M1w3KCNzRQR00A-cKNbUJZ8TvwMH/exec",
      type: "GET",
      data: {
        action: "getSuratMasukDT",
      },
      dataSrc: function (json) {
        if (json.error) {
          console.error("Error from server:", json.error);
          return [];
        }
        return json.data;
      },
    },
    columns: [
      // {
      //   data: "Tgl_terima_surat",
      //   title: "Tanggal Terima Surat",
      //   render: function (data) {
      //     return data ? new Date(data).toLocaleDateString("id-ID") : "N/A";
      //   },
      // },
      { data: "No_Surat", title: "No. Surat" },
      {
        data: "Tgl_Surat",
        title: "Tanggal Surat",
        render: function (data) {
          return data ? new Date(data).toLocaleDateString("id-ID") : "N/A";
        },
      },
      { data: "Asal_surat", title: "Asal Surat" },
      { data: "Perihal", title: "Perihal" },
      {
        data: "Prioritas",
        title: "Prioritas",
        render: function (data) {
          if (String(data).toLowerCase() === "tinggi") {
            return '<span class="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full">Tinggi</span>';
          }
          return '<span class="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-full">Sedang/Rendah</span>';
        },
      },
      {
        data: null,
        title: "Aksi",
        orderable: false,
        render: function (data, type, row) {
          return `
                <div class="flex justify-center gap-2">
                  <button class="text-blue-600 hover:text-blue-800 transition-colors" title="Lihat Detail">
                    <span class="material-symbols-rounded">visibility</span>
                  </button>
                  <button class="text-green-600 hover:text-green-800 transition-colors" title="Edit">
                    <span class="material-symbols-rounded">edit</span>
                  </button>
                  <button class="text-red-600 hover:text-red-800 transition-colors" title="Hapus">
                    <span class="material-symbols-rounded">delete</span>
                  </button>
                </div>
              `;
        },
      },
    ],
    language: {
      url: "https://cdn.datatables.net/plug-ins/1.13.6/i18n/id.json",
    },
  });

  // --- 2. LOGIKA MODAL TAMBAH SURAT ---

  // Pilih semua elemen yang dibutuhkan
  const modal = document.getElementById("addLetterModal");
  const openModalBtn = document.getElementById("openModalBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelModalBtn = document.getElementById("cancelModalBtn");
  const saveLetterBtn = document.getElementById("saveLetterBtn");
  const addLetterForm = document.getElementById("addLetterForm");

  // Pastikan semua elemen modal ditemukan sebelum menambahkan event listener
  if (
    !modal ||
    !openModalBtn ||
    !closeModalBtn ||
    !cancelModalBtn ||
    !saveLetterBtn ||
    !addLetterForm
  ) {
    console.error(
      "Salah satu elemen modal tidak ditemukan. Pastikan HTML sudah benar."
    );
    return;
  }

  // Fungsi untuk membuka modal
  function openModal() {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  // Fungsi untuk menutup modal
  function closeModal() {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    addLetterForm.reset(); // Kosongkan form saat modal ditutup
  }

  // Tambahkan event listener untuk membuka modal
  openModalBtn.addEventListener("click", openModal);

  // Tambahkan event listener untuk menutup modal
  closeModalBtn.addEventListener("click", closeModal);
  cancelModalBtn.addEventListener("click", closeModal);

  // Opsional: Tutup modal jika mengklik area di luar kotak modal
  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      closeModal();
    }
  });

  // Logika untuk tombol "Simpan"
  // ... (kode sebelumnya tetap sama) ...

  // 6. Logika untuk tombol "Simpan"
  saveLetterBtn.addEventListener("click", function (event) {
    event.preventDefault();

    // Validasi sederhana
    const requiredFields = addLetterForm.querySelectorAll("[required]");
    let isValid = true;
    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        isValid = false;
        field.classList.add("border-red-500");
      } else {
        field.classList.remove("border-red-500");
      }
    });

    if (!isValid) {
      alert("Harap lengkapi semua field yang wajib diisi!");
      return;
    }

    // --- KIRIM DATA KE SERVER ---
    // Ubah tombol ke state loading
    saveLetterBtn.disabled = true;
    saveLetterBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Menyimpan...
    `;

    // Siapkan data untuk dikirim menggunakan FormData
    const formData = new FormData(addLetterForm);
    // Tambahkan parameter action untuk memandu App Script
    formData.append("action", "addSuratMasuk");

    // Ganti dengan URL Web App Anda
    const scriptUrl =
      "https://script.google.com/macros/s/AKfycbwMOakn0M2r7qwy-j2DhcT581Ia0X_-8Gs2I3l6M1w3KCNzRQR00A-cKNbUJZ8TvwMH/exec";

    fetch(scriptUrl, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        // Kembalikan tombol ke state normal
        saveLetterBtn.disabled = false;
        saveLetterBtn.innerHTML = "Simpan";

        if (data.success) {
          alert(data.message);
          closeModal();
          // Refresh tabel untuk menampilkan data baru
          suratTable.ajax.reload();
        } else {
          alert("Gagal menyimpan surat: " + data.error);
        }
      })
      .catch((error) => {
        // Kembalikan tombol ke state normal
        saveLetterBtn.disabled = false;
        saveLetterBtn.innerHTML = "Simpan";

        console.error("Error:", error);
        alert(
          "Terjadi kesalahan saat mengirim data. Periksa konsol untuk detail."
        );
      });
  });
}

// Pastikan fungsi diekspor agar bisa dipanggil dari index.html
window.initSuratMasukPage = initSuratMasukPage;
