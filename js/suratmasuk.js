// =================================================================
// LOGIKA UNTUK HALAMAN SURAT MASUK (SERVER-SIDE DATATABLES)
// =================================================================

(function () {
  "use strict";

  function initSuratMasukPage() {
    console.log("Initializing Surat Masuk page...");

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

    $("#suratMasukTable").DataTable({
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
  }

  window.initSuratMasukPage = initSuratMasukPage;
})();
