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
  if (!menuPopup.contains(e.target) && !menuIcon.contains(e.target) &&
    !userPopup.contains(e.target) && !userIcon.contains(e.target)) {
    menuPopup.style.display = 'none';
    userPopup.style.display = 'none';
  }
});

// Contoh: klik baris untuk menampilkan alert detail
document.querySelectorAll(".jadwal-table tbody tr").forEach(row => {
  row.addEventListener("click", () => {
    const mataKuliah = row.cells[3]?.textContent;
    const dosen = row.cells[4]?.textContent;
    if (mataKuliah && dosen) {
      alert(`Mata Kuliah: ${mataKuliah}\nDosen: ${dosen}`);
    }
  });
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