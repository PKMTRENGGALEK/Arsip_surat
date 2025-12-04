// =================================================================
// LOGIKA UNTUK DASHBOARD - VERSI MODULAR (dashboard.js)
// =================================================================

// Gunakan IIFE (Immediately Invoked Function Expression) untuk mencegah
// pencemaran global scope dan membuat variabel/func ini privat untuk file ini.
(function () {
  "use strict";

  /**
   * Helper: Konversi berbagai format tanggal string ke objek Date.
   * Mendukung format: DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD.
   * @param {string} dateStr - String tanggal yang akan dikonversi.
   * @returns {Date|null} - Objek Date jika berhasil, null jika gagal.
   */
  function parseDate(dateStr) {
    if (!dateStr) return null;
    const cleanDate = String(dateStr).trim();

    // Coba format DD-MM-YYYY atau YYYY-MM-DD
    let parts = cleanDate.split("-");
    if (parts.length === 3) {
      const [part1, part2, part3] = parts;
      let d, m, y;

      // Deteksi apakah formatnya YYYY-MM-DD (bagian pertama adalah tahun)
      if (part1.length === 4) {
        y = part1;
        m = part2;
        d = part3;
      } else {
        // Asumsikan format DD-MM-YYYY
        d = part1;
        m = part2;
        y = part3;
      }

      const iso = `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(
        2,
        "0"
      )}`;
      const dt = new Date(iso);
      if (!isNaN(dt.getTime())) return dt;
    }

    // Coba format DD/MM/YYYY
    parts = cleanDate.split("/");
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const iso = `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(
        2,
        "0"
      )}`;
      const dt = new Date(iso);
      if (!isNaN(dt.getTime())) return dt;
    }

    // Coba parsing langsung (untuk format ISO atau lainnya yang dikenali browser)
    const dt = new Date(cleanDate);
    if (!isNaN(dt.getTime())) return dt;

    return null;
  }

  /**
   * Loader data menggunakan metode JSONP untuk menghindari masalah CORS.
   * @param {string} url - URL endpoint data.
   * @param {function} callback - Fungsi yang akan dipanggil setelah data berhasil dimuat.
   */
  function getJSONP(url, callback) {
    const oldScript = document.querySelector(
      `script[src*="${url.split("?")[0]}"]`
    );
    if (oldScript) oldScript.remove();

    const script = document.createElement("script");
    const callbackName = `callback_${Date.now()}`;

    window[callbackName] = function (data) {
      callback(data);
      delete window[callbackName];
      script.remove();
    };

    const separator = url.includes("?") ? "&" : "?";
    script.src = url + separator + "callback=" + callbackName;
    script.onerror = () => {
      console.error("JSONP load error:", script.src);
      const tbody = document.getElementById("activity_body");
      if (tbody)
        tbody.innerHTML =
          '<tr><td colspan="4" class="text-center py-4 text-red-500">Gagal memuat data.</td></tr>';
      script.remove();
    };
    document.body.appendChild(script);
  }

  /**
   * Callback utama untuk memproses data surat dan memperbarui UI dashboard.
   * @param {Array} data - Array objek surat yang diterima dari server.
   */
  function handleSurat(data) {
    try {
      console.log("DATA MASUK (LIHAT DI CONSOLE):", data);
      if (!Array.isArray(data)) {
        console.warn("Response bukan array:", data);
        return;
      }

      if (data.length > 0) {
        console.log("Contoh data pertama:", data[0]);
        console.log("Field yang tersedia:", Object.keys(data[0]));
      }

      const elTotal = document.getElementById("stat_total");
      const elToday = document.getElementById("stat_today");
      const elWeek = document.getElementById("stat_week");
      const elHighPriority = document.getElementById("stat_priority");
      const tbody = document.getElementById("activity_body");

      if (!elTotal || !elToday || !elWeek || !tbody) {
        console.warn(
          "Elemen dashboard tidak ditemukan. Pastikan fungsi ini dipanggil setelah HTML dimuat."
        );
        return;
      }

      let suratHariIni = 0;
      let suratMingguIni = 0;
      let prioritasTinggi = 0;

      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const todayEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      const weekAgo = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 7
      );

      data.forEach((d, index) => {
        const dateFields = [
          "Tgl_terima_surat",
          "tanggal",
          "tgl_surat",
          "date",
          "tgl_diterima",
          "received_date",
        ];
        let tgl = null;
        let fieldName = null;

        for (const field of dateFields) {
          if (d[field]) {
            tgl = parseDate(d[field]);
            if (tgl) {
              fieldName = field;
              break;
            }
          }
        }

        if (tgl) {
          console.log(
            `[${index}] Memeriksa tanggal: "${d[fieldName]}" (dari field: ${fieldName}) -> Hasil parse Date:`,
            tgl
          );
          if (tgl >= todayStart && tgl < todayEnd) {
            suratHariIni++;
            console.log(`  -> DITEMUKAN: Cocok dengan hari ini!`);
          }
          if (tgl >= weekAgo) {
            suratMingguIni++;
          }
        } else {
          console.warn(
            `[${index}] Tidak dapat mem-parsing tanggal dari data:`,
            d
          );
        }

        const priorityFields = ["Prioritas", "priority", "tingkat_prioritas"];
        for (const field of priorityFields) {
          if (d[field] && String(d[field]).toLowerCase() === "tinggi") {
            prioritasTinggi++;
            break;
          }
        }
      });

      elTotal.textContent = data.length;
      elToday.textContent = suratHariIni;
      elWeek.textContent = suratMingguIni;
      if (elHighPriority) {
        elHighPriority.textContent = prioritasTinggi;
      }

      tbody.innerHTML = "";
      const sortedData = [...data].sort((a, b) => {
        const dateA = parseDate(
          a.Tgl_terima_surat || a.tanggal || a.tgl_surat || a.date
        );
        const dateB = parseDate(
          b.Tgl_terima_surat || b.tanggal || b.tgl_surat || b.date
        );
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB - dateA;
      });

      sortedData.slice(0, 10).forEach((r) => {
        const tgl =
          r.Tgl_terima_surat || r.tanggal || r.tgl_surat || r.date || "N/A";
        const asal = r.Asal_surat || r.asal || r.dari || "N/A";
        const perihal = r.Perihal || r.hal || r.subjek || r.subject || "N/A";

        tbody.insertAdjacentHTML(
          "beforeend",
          `
            <tr class="border-b hover:bg-gray-50">
              <td class="py-2 px-2">${tgl}</td>
              <td class="py-2 px-2">${asal}</td>
              <td class="py-2 px-2">${perihal}</td>
              <td class="py-2 px-2 text-blue-600 font-semibold">Masuk</td>
            </tr>
          `
        );
      });
      // ... di dalam fungsi handleSurat, setelah kode tabel ...

      // --- LOGIKA UNTUK GRAFIK ---
      const chartCanvas = document.getElementById("suratChart");
      if (chartCanvas) {
        // 1. Siapkan data untuk grafik (contoh: jumlah surat per bulan)
        const suratPerBulan = {};
        data.forEach((item) => {
          const tgl = parseDate(
            item.Tgl_terima_surat || item.tanggal || item.tgl_surat || item.date
          );
          if (tgl) {
            const tahunBulan = `${tgl.getFullYear()}-${String(
              tgl.getMonth() + 1
            ).padStart(2, "0")}`;
            suratPerBulan[tahunBulan] = (suratPerBulan[tahunBulan] || 0) + 1;
          }
        });

        // 2. Urutkan bulan dari yang terlama ke terbaru
        const sortedLabels = Object.keys(suratPerBulan).sort();
        const sortedData = sortedLabels.map((label) => suratPerBulan[label]);

        // 3. Hancurkan grafik lama jika ada (untuk saat refresh data)
        if (window.suratChartInstance) {
          window.suratChartInstance.destroy();
        }

        // 4. Buat grafik baru
        // 4. Buat grafik baru
        const ctx = chartCanvas.getContext("2d");
        window.suratChartInstance = new Chart(ctx, {
          type: "line", // 1. UBAH TIPE GRAFIK MENJADI 'line'
          data: {
            labels: sortedLabels, // Label di sumbu X (contoh: "2024-10", "2024-11", "2024-12")
            datasets: [
              {
                label: "Jumlah Surat Masuk",
                data: sortedData, // Data di sumbu Y

                // --- Konfigurasi untuk tampilan "Wave" ---
                fill: true, // 2. ISI area di bawah garis
                backgroundColor: "rgba(59, 130, 246, 0.2)", // Warna isian (lebih transparan)
                borderColor: "rgba(59, 130, 246, 1)", // Warna garis
                borderWidth: 2, // Buat garis lebih tebal
                tension: 0.4, // 3. INI ADALAH RAHASIANYA: buat garis melengkung (wave)
                pointBackgroundColor: "rgba(59, 130, 246, 1)", // Warna titik data
                pointBorderColor: "#fff", // Warna border titik data
                pointHoverBackgroundColor: "#fff", // Warna titik saat hover
                pointHoverBorderColor: "rgba(59, 130, 246, 1)", // Warna border titik saat hover
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true, // Mulai sumbu Y dari 0
                ticks: {
                  stepSize: 1, // Pastikan angka di sumbu Y adalah bilangan bulat
                },
              },
            },
            plugins: {
              legend: {
                display: false, // Sembunyikan legend karena hanya ada satu dataset
              },
              tooltip: {
                mode: "index",
                intersect: false,
              },
            },
          },
        });
      }
      // --- AKHIR LOGIKA GRAFIK ---
    } catch (err) {
      console.error("Terjadi kesalahan di fungsi handleSurat:", err);
      const tbody = document.getElementById("activity_body");
      if (tbody)
        tbody.innerHTML =
          '<tr><td colspan="4" class="text-center py-4 text-red-500">Terjadi kesalahan saat memproses data.</td></tr>';
    }
  }

  /**
   * Fungsi untuk memulai proses loading data dashboard.
   */
  function loadSuratJSONP() {
    const url =
      "https://script.google.com/macros/s/AKfycbwMOakn0M2r7qwy-j2DhcT581Ia0X_-8Gs2I3l6M1w3KCNzRQR00A-cKNbUJZ8TvwMH/exec?action=getSurat";

    const elTotal = document.getElementById("stat_total");
    const elToday = document.getElementById("stat_today");
    const elWeek = document.getElementById("stat_week");
    const elHighPriority = document.getElementById("stat_priority");
    const tbody = document.getElementById("activity_body");

    if (elTotal) elTotal.textContent = "...";
    if (elToday) elToday.textContent = "...";
    if (elWeek) elWeek.textContent = "...";
    if (elHighPriority) elHighPriority.textContent = "...";
    if (tbody)
      tbody.innerHTML =
        '<tr><td colspan="4" class="text-center py-4">Memuat data...</td></tr>';

    getJSONP(url, handleSurat);
  }

  /**
   * Fungsi inisialisasi khusus untuk halaman dashboard.
   * Ini adalah satu-satunya fungsi yang kita ekspos ke global scope.
   */
  function initDashboard() {
    console.log("Dashboard loaded, initializing...");
    loadSuratJSONP();
  }

  // Ekspos fungsi initDashboard ke window object agar bisa dipanggil dari HTML
  window.initDashboard = initDashboard;
})();
// =================================================================
// AKHIR LOGIKA DASHBOARD
// =================================================================
