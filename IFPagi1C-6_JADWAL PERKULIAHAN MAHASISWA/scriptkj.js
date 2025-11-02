// === Navbar Popup Logic ===
const menuIcon = document.querySelector('.menu-icon');
const userIcon = document.querySelector('.user-icon');
const menuPopup = document.getElementById('menuPopup');
const userPopup = document.getElementById('userPopup');

menuIcon.addEventListener('click', () => {
  menuPopup.style.display = menuPopup.style.display === 'block' ? 'none' : 'block';
  userPopup.style.display = 'none';
});

userIcon.addEventListener('click', () => {
  userPopup.style.display = userPopup.style.display === 'block' ? 'none' : 'block';
  menuPopup.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (
    !menuPopup.contains(e.target) &&
    !menuIcon.contains(e.target) &&
    !userPopup.contains(e.target) &&
    !userIcon.contains(e.target)
  ) {
    menuPopup.style.display = 'none';
    userPopup.style.display = 'none';
  }
});

const searchInput = document.getElementById("searchInput");
const suggestions = document.getElementById("suggestions");

const keywords = [
  { words: ["edit jadwal", "ubah jadwal", "tanggal", "kalender jadwal", "tambah catatan", "catatan jadwal"], page: "kelolajadwal.html", label: "Kelola Jadwal" },
  { words: ["jadwal utama", "jadwal default", "jadwal mata kuliah"], page: "jadwalutama.html", label: "Jadwal Utama" },
  { words: ["beranda", "dashboard", "home"], page: "dashboard.html", label: "Dashboard" }
];

let currentFocus = -1;
let selectableItems = [];

searchInput.addEventListener("input", function () {
  const inputValue = this.value.toLowerCase();
  suggestions.innerHTML = "";
  if (!inputValue) {
    suggestions.style.display = "none";
    return;
  }

  let keywordMatches = [];
  let pageMatches = new Map();

  keywords.forEach(group => {
    let hasKeyword = false;
    group.words.forEach(word => {
      if (word.toLowerCase().includes(inputValue)) {
        keywordMatches.push({ word, page: group.page });
        hasKeyword = true;
      }
    });
    if (hasKeyword) pageMatches.set(group.page, group.label);
  });

  if (keywordMatches.length > 0) {
    suggestions.style.display = "block";

    // list keyword
    keywordMatches.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item.word;
      li.dataset.page = item.page;
      li.addEventListener("click", () => {
        window.location.href = item.page;
      });
      suggestions.appendChild(li);
    });

    // divider
    const divider = document.createElement("li");
    divider.style.borderTop = "1px solid #ddd";
    divider.style.margin = "5px 0";
    divider.style.cursor = "default";
    divider.style.background = "#f9f9f9";
    suggestions.appendChild(divider);

    // tampilkan nama halaman (bukan nama file)
    pageMatches.forEach((label, page) => {
      const li = document.createElement("li");
      li.innerHTML = `<span style="color:#777;">→ ${label}</span>`;
      li.style.fontSize = "13px";
      li.style.textAlign = "center";
      li.dataset.page = page;
      li.addEventListener("click", () => {
        window.location.href = page;
      });
      suggestions.appendChild(li);
    });

    selectableItems = Array.from(suggestions.querySelectorAll("li")).filter(
      li => li.style.cursor !== "default"
    );
  } else {
    suggestions.style.display = "none";
  }

  currentFocus = -1;
});

searchInput.addEventListener("keydown", function (e) {
  if (!suggestions.style.display || suggestions.style.display === "none") return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    currentFocus++;
    addActive(selectableItems);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    currentFocus--;
    addActive(selectableItems);
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (currentFocus > -1 && selectableItems[currentFocus]) {
      selectableItems[currentFocus].click();
    }
  }
});

function addActive(items) {
  if (!items.length) return;
  removeActive(items);
  if (currentFocus >= items.length) currentFocus = 0;
  if (currentFocus < 0) currentFocus = items.length - 1;
  items[currentFocus].classList.add("active");
  items[currentFocus].scrollIntoView({ block: "nearest" });
}

function removeActive(items) {
  items.forEach(item => item.classList.remove("active"));
}

// =================================================================
// === Calendar & Local Storage Logic ===
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
  const calendarGrid = document.querySelector('.calendar-grid');
  const currentMonthYear = document.getElementById('currentMonthYear');
  const prevMonth = document.getElementById('prevMonth');
  const nextMonth = document.getElementById('nextMonth');
  const jadwalInputPopup = document.getElementById('jadwalInputPopup');
  const kirimBtn = document.getElementById('kirimJadwal');
  const batalBtn = document.getElementById('batalJadwal');
  const mainNotesTable = document.getElementById('mainNotesTable');
  const saveMainNotesBtn = document.getElementById('saveMainNotes');

  let currentDate = new Date();
  let activeDay = null;

  // 1. FUNGSI SIMPAN KE LOCAL STORAGE
  function saveSchedules() {
    const rows = Array.from(mainNotesTable.querySelectorAll('.notes-row:not(.header-row)'));
    const schedules = rows.map(row => {
      // Ambil data dari setiap kolom
      const dataId = row.getAttribute('data-id');
      return {
        id: dataId,
        tanggal: row.querySelector('.notes-col:nth-child(1)').textContent,
        waktu: row.querySelector('.notes-col:nth-child(2)').textContent,
        ruangan: row.querySelector('.notes-col:nth-child(3)').textContent,
        matkul: row.querySelector('.notes-col:nth-child(4)').textContent,
        dosen: row.querySelector('.notes-col:nth-child(5)').textContent,
        // Ambil teks dari elemen catatan yang bisa diedit (contenteditable)
        catatan: row.querySelector('.notes-col.catatan').textContent,
      };
    });
    // Menyimpan array objek ke localStorage setelah diubah menjadi string JSON
    localStorage.setItem('studentSchedules', JSON.stringify(schedules));
    console.log('Jadwal disimpan ke Local Storage.');
  }

  // 2. FUNGSI RENDER SATU BARIS JADWAL
  function renderScheduleRow(schedule) {
    const newRow = document.createElement('div');
    newRow.classList.add('notes-row', 'editable-row');
    // Tambahkan data-id agar baris dapat diidentifikasi saat dihapus/disimpan
    newRow.setAttribute('data-id', schedule.id);
    newRow.innerHTML = `
      <div class="notes-col">${schedule.tanggal}</div>
      <div class="notes-col">${schedule.waktu}</div>
      <div class="notes-col">${schedule.ruangan}</div>
      <div class="notes-col">${schedule.matkul}</div>
      <div class="notes-col">${schedule.dosen}</div>
      <div class="notes-col catatan" contenteditable="true">${schedule.catatan}</div>
      <div class="notes-col delete-btn" style="text-align:center; cursor:pointer;">🗑️</div>
    `;

    // Event listener untuk hapus
    newRow.querySelector('.delete-btn').addEventListener('click', () => {
      newRow.remove();
      saveSchedules(); // Simpan perubahan setelah penghapusan
    });

    // Event listener untuk menyimpan catatan saat selesai diedit (blur)
    newRow.querySelector('.notes-col.catatan').addEventListener('blur', () => {
      saveSchedules();
    });

    mainNotesTable.appendChild(newRow);
  }

  // 3. FUNGSI MUAT DARI LOCAL STORAGE
  function loadSchedules() {
    const storedSchedules = localStorage.getItem('studentSchedules');
    if (storedSchedules) {
      // Mengubah string JSON menjadi array objek
      const schedules = JSON.parse(storedSchedules);
      schedules.forEach(renderScheduleRow);
    }
  }

  // Panggil saat DOMContentLoaded untuk memuat data saat halaman dibuka
  loadSchedules();

  // =================================================================
  // === Kalender & Logic Lainnya ===
  // =================================================================

  function renderCalendar(date) {
    calendarGrid.innerHTML = `
      <div class="day-name">SUN</div>
      <div class="day-name">MON</div>
      <div class="day-name">TUE</div>
      <div class="day-name">WED</div>
      <div class="day-name">THU</div>
      <div class="day-name">FRI</div>
      <div class="day-name">SAT</div>
    `;

    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    currentMonthYear.textContent = `${date.toLocaleString('id-ID', { month: 'long' })} ${year}`;

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      empty.classList.add('calendar-day', 'empty');
      calendarGrid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = document.createElement('div');
      d.classList.add('calendar-day');
      d.textContent = day;
      d.addEventListener('click', () => {
        if (activeDay) activeDay.classList.remove('active');
        d.classList.add('active');
        activeDay = d;
        jadwalInputPopup.style.display = 'flex';
      });
      calendarGrid.appendChild(d);
    }
  }

  // === Render awal kalender ===
  renderCalendar(currentDate);

  // === FUNGSI KASIH TANDA TANGGAL YANG ADA JADWAL ===
  function highlightScheduledDates() {
    const storedSchedules = JSON.parse(localStorage.getItem('studentSchedules')) || [];
    const dateNumbers = storedSchedules.map(schedule => {
      const tanggalSplit = schedule.tanggal.split(' ');
      return parseInt(tanggalSplit[0]); // ambil angka tanggal aja
    });

    document.querySelectorAll('.calendar-day').forEach(day => {
      const dayNum = parseInt(day.textContent);
      if (dateNumbers.includes(dayNum)) {
        day.classList.add('has-schedule');
      }
    });
  }

  // === Jalankan pas pertama kali halaman dimuat ===
  highlightScheduledDates();

  // === Tombol bulan sebelumnya ===
  prevMonth.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
    highlightScheduledDates(); // biar tetep ada highlight setelah ganti bulan
  });

  // === Tombol bulan berikutnya ===
  nextMonth.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
    highlightScheduledDates();
  });

  // === Popup batal ===
  batalBtn.addEventListener('click', () => {
    jadwalInputPopup.style.display = 'none';
  });

  // === LOGIKA KIRIM JADWAL ===
  kirimBtn.addEventListener('click', () => {
    const matkul = document.getElementById('mataKuliahSelect').value;
    const dosen = document.getElementById('dosenSelect').value;
    const ruangan = document.getElementById('ruanganSelect').value;
    const waktu = document.getElementById('waktuSelect').value;
    const catatan = document.getElementById('catatanInput').value || '-';

    if (!matkul || !dosen || !ruangan || !waktu) {
      alert('Lengkapi semua field (Mata Kuliah, Dosen, Ruangan, Waktu) sebelum mengirim.');
      return;
    }

    const tanggalText = activeDay ? `${activeDay.textContent} ${currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}` : 'Tanggal Tidak Dipilih';

    const newSchedule = {
      id: Date.now().toString(),
      tanggal: tanggalText,
      waktu: waktu,
      ruangan: ruangan,
      matkul: matkul,
      dosen: dosen,
      catatan: catatan,
    };

    renderScheduleRow(newSchedule);
    saveSchedules();

    // kasih tanda ke tanggal yang dipilih
    if (activeDay) {
      activeDay.classList.add('has-schedule');
    }

    // reset input dan tutup popup
    document.getElementById('mataKuliahSelect').value = '';
    document.getElementById('dosenSelect').value = '';
    document.getElementById('ruanganSelect').value = '';
    document.getElementById('waktuSelect').value = '';
    document.getElementById('catatanInput').value = '';
    if (activeDay) activeDay.classList.remove('active');
    activeDay = null;

    jadwalInputPopup.style.display = 'none';
    alert('Jadwal berhasil ditambahkan dan disimpan!');

    // update tanda jadwal
    highlightScheduledDates();
  });

  // === Close popup kalau klik di luar ===
  jadwalInputPopup.addEventListener('click', (e) => {
    if (e.target === jadwalInputPopup) jadwalInputPopup.style.display = 'none';
  });

  // === Tombol simpan catatan ===
  saveMainNotesBtn.addEventListener('click', () => {
    saveSchedules();
    alert('Catatan berhasil disimpan!');
  });

});
