const calendarGrid = document.querySelector('.calendar-grid');
const currentMonthYear = document.getElementById('currentMonthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');

// Kontrol Tampilan Panel
const calendarView = document.getElementById('calendar-view');
const schedulePanel = document.getElementById('schedule-panel');
const analysisPanel = document.getElementById('analysis-panel');
const backToCalendarBtn = document.getElementById('back-to-calendar-btn');
const showAnalysisBtn = document.getElementById('show-analysis-btn');

// Schedule Panel Elements
const selectedDateTitle = document.getElementById('selectedDateTitle');
const closePanelBtn = document.getElementById('closePanel');
const dailyScheduleList = document.getElementById('dailyScheduleList');
const addScheduleBtn = document.getElementById('addSchedule');
const scheduleTimeInput = document.getElementById('schedule-time');
const scheduleTitleInput = document.getElementById('schedule-title');
const schedulePlatformInput = document.getElementById('schedule-platform');
const scheduleAccountInput = document.getElementById('schedule-account');
const uploadStatusMsg = document.getElementById('uploadStatus');
const copyScheduleBtn = document.getElementById('copySchedule');
const pasteScheduleBtn = document.getElementById('pasteSchedule');

// Analysis Panel Elements
const analysisPeriodSelect = document.getElementById('analysis-period-select');
const customPeriodInputDiv = document.getElementById('custom-period-input');
const customDaysInput = document.getElementById('custom-days'); 
const runAnalysisBtn = document.getElementById('run-analysis-btn');
const analysisResultsDiv = document.getElementById('analysis-results');
const analysisPeriodLabel = document.getElementById('analysis-period-label');
const analysisTotalUploadEl = document.getElementById('analysis-total-upload');
const platformStatsBody = document.getElementById('platform-stats-body');
const accountStatsBody = document.getElementById('account-stats-body');

// PWA BARU: TOMBOL EKSPOR ANALISIS
const exportAnalysisBtn = document.getElementById('export-analysis-btn'); // BARU

// Modal Edit Elements
const editModal = document.getElementById('editModal');
const editIndexInput = document.getElementById('edit-index');
const editTimeInput = document.getElementById('edit-time');
const editTitleInput = document.getElementById('edit-title');
const editPlatformInput = document.getElementById('edit-platform');
const editAccountInput = document.getElementById('edit-account');
const saveEditBtn = document.getElementById('saveEdit');
const cancelEditBtn = document.getElementById('cancelEdit');
const cancelEditHeaderBtn = document.getElementById('cancelEditHeader');

// VARIABEL BARU UNTUK EKSPOR/IMPOR DATA MENTAH
const exportDataBtn = document.getElementById('export-data-btn');
const importDataBtn = document.getElementById('import-data-btn');
const importDataFile = document.getElementById('import-data-file');

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let selectedFullDate = null; 
let copiedSchedule = null; 
let draggedIndex = null; 

// VARIABEL UNTUK MENYIMPAN HASIL ANALISIS TERSTRUKTUR
let analysisExportData = null; // BARU


// --- Data Storage ---
let scheduleData = JSON.parse(localStorage.getItem('videoScheduleData')) || {};

const saveScheduleData = () => {
    localStorage.setItem('videoScheduleData', JSON.stringify(scheduleData));
};

// --- Fungsi Navigasi Tampilan ---
const showView = (viewId) => {
    [calendarView, schedulePanel, analysisPanel].forEach(panel => panel.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');

    if (viewId === 'calendar-view') {
        backToCalendarBtn.classList.add('hidden');
        showAnalysisBtn.classList.remove('hidden');
        renderCalendar(currentYear, currentMonth); 
    } else {
        backToCalendarBtn.classList.remove('hidden');
        showAnalysisBtn.classList.add('hidden');
    }
};

const showSchedulePanel = (date) => {
    selectedFullDate = date;
    const dateObj = new Date(date + 'T00:00:00'); 
    selectedDateTitle.textContent = dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
    pasteScheduleBtn.disabled = copiedSchedule === null;

    renderDailySchedule(date);
    showView('schedule-panel');
};

const closeSchedulePanel = () => {
    showView('calendar-view');
};


// --- Fungsi Kalender & Navigasi Bulan ---
const renderCalendar = (year, month) => {
    calendarGrid.querySelectorAll('.date-cell').forEach(cell => cell.remove()); 
    
    const date = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = date.getDay(); 
    
    currentMonthYear.textContent = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    for (let i = 0; i < startDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('date-cell', 'inactive');
        calendarGrid.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const cell = document.createElement('div');
        cell.classList.add('date-cell');
        cell.dataset.date = fullDate;

        const today = new Date();
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            cell.classList.add('today');
        }

        cell.innerHTML = `<div class="date-number">${day}</div>`;

        const dailySchedules = scheduleData[fullDate] || [];
        if (dailySchedules.length > 0) {
            const uploadedCount = dailySchedules.filter(s => s.isUploaded).length;
            const totalCount = dailySchedules.length;
            const countTag = document.createElement('span');
            countTag.classList.add('upload-count');
            countTag.textContent = `${uploadedCount}/${totalCount}`;
            cell.appendChild(countTag);
        }

        cell.addEventListener('click', (e) => {
            if (!e.currentTarget.classList.contains('inactive')) {
                showSchedulePanel(fullDate);
            }
        });
        calendarGrid.appendChild(cell);
    }
};

const changeMonth = (delta) => {
    currentMonth += delta;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar(currentYear, currentMonth);
};


// --- Fungsi Jadwal Harian (Termasuk Drag & Drop) ---
const renderDailySchedule = (date) => {
    dailyScheduleList.innerHTML = '';
    const schedules = scheduleData[date] || [];

    uploadStatusMsg.textContent = '';

    if (schedules.length === 0) {
        dailyScheduleList.innerHTML = '<p class="text-center">Belum ada jadwal upload hari ini.</p>';
        copyScheduleBtn.disabled = true;
        
    } else {
        copyScheduleBtn.disabled = false;

        const uploadedCount = schedules.filter(s => s.isUploaded).length;
        uploadStatusMsg.textContent = `Status: ${uploadedCount} dari ${schedules.length} video sudah di-upload.`;

        schedules.forEach((schedule, index) => {
            const listItem = document.createElement('li');
            listItem.setAttribute('draggable', 'true');
            listItem.dataset.index = index; 
            
            listItem.innerHTML = `
                <div class="schedule-details">
                    <span class="main-info">
                        <strong>${schedule.time}</strong> - 
                        <span class="platform-tag platform-${schedule.platform}">${schedule.platform.toUpperCase()}</span>
                        ${schedule.title}
                    </span>
                    <small>Akun: ${schedule.account || 'Tidak Ada'}</small>
                </div>
                <div class="schedule-actions">
                    <button class="action-btn edit-btn" data-index="${index}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="action-btn delete-btn" data-index="${index}"><i class="fas fa-trash-alt"></i> Hapus</button>
                </div>
                <div class="upload-status-toggle ${schedule.isUploaded ? 'completed' : ''}" data-index="${index}" title="Tandai Selesai"></div>
            `;
            dailyScheduleList.appendChild(listItem);
        });

        document.querySelectorAll('.upload-status-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => toggleUploadStatus(date, parseInt(e.target.dataset.index)));
        });
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => openEditModal(date, parseInt(e.target.dataset.index)));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => deleteSchedule(date, parseInt(e.target.dataset.index)));
        });

        // Event listener Drag and Drop
        dailyScheduleList.querySelectorAll('li').forEach(item => {
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('drop', handleDrop);
            item.addEventListener('dragend', handleDragEnd);
        });
    }
};

const addNewSchedule = () => {
    if (!selectedFullDate) return;

    const time = scheduleTimeInput.value.trim();
    const title = scheduleTitleInput.value.trim();
    const platform = schedulePlatformInput.value;
    const account = scheduleAccountInput.value.trim();

    if (!time || !title) {
        alert("Jam dan Judul harus diisi!");
        return;
    }

    const dailySchedules = scheduleData[selectedFullDate] || [];

    const newSchedule = { time, title, platform, account, isUploaded: false };

    dailySchedules.push(newSchedule);
    scheduleData[selectedFullDate] = dailySchedules;
    
    saveScheduleData();
    renderDailySchedule(selectedFullDate);

    // Reset input
    scheduleTimeInput.value = '';
    scheduleTitleInput.value = '';
    scheduleAccountInput.value = '';
};

const toggleUploadStatus = (date, index) => {
    if (scheduleData[date] && scheduleData[date][index] !== undefined) {
        scheduleData[date][index].isUploaded = !scheduleData[date][index].isUploaded;
        saveScheduleData();
        renderDailySchedule(date);
        renderCalendar(currentYear, currentMonth); 
    }
};

const deleteSchedule = (date, index) => {
    if (confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
        if (scheduleData[date] && scheduleData[date][index] !== undefined) {
            scheduleData[date].splice(index, 1); 
            if (scheduleData[date].length === 0) {
                delete scheduleData[date]; 
            }
            saveScheduleData();
            renderDailySchedule(date);
            renderCalendar(currentYear, currentMonth); 
        }
    }
};

// Drag and Drop Logic
const handleDragStart = (e) => {
    draggedIndex = parseInt(e.target.dataset.index);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
        e.target.classList.add('dragging');
    }, 0);
};

const handleDragOver = (e) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
    const draggingElement = document.querySelector('.dragging');
    if (e.target.closest('li') && e.target.closest('li') !== draggingElement) {
        const targetElement = e.target.closest('li');
        const rect = targetElement.getBoundingClientRect();
        const next = (e.clientY - rect.top) / rect.height > 0.5;
        dailyScheduleList.insertBefore(draggingElement, next ? targetElement.nextSibling : targetElement);
    }
};

const handleDrop = (e) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const schedules = scheduleData[selectedFullDate];
    const draggedItem = schedules[draggedIndex];
    const currentListItems = Array.from(dailyScheduleList.children);
    
    let newIndex = currentListItems.indexOf(document.querySelector('.dragging'));
    
    schedules.splice(draggedIndex, 1); 
    schedules.splice(newIndex, 0, draggedItem); 
    
    saveScheduleData();
    renderDailySchedule(selectedFullDate); 
};

const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    draggedIndex = null;
};

// Fungsi Edit Modal
const openEditModal = (date, index) => {
    const schedule = scheduleData[date][index];
    
    editIndexInput.value = index;
    
    editTimeInput.value = schedule.time;
    editTitleInput.value = schedule.title;
    editPlatformInput.value = schedule.platform;
    editAccountInput.value = schedule.account || ''; 
    
    editModal.classList.remove('hidden');
};

const saveEditedSchedule = () => {
    const index = parseInt(editIndexInput.value);
    const date = selectedFullDate; 
    
    const time = editTimeInput.value.trim();
    const title = editTitleInput.value.trim();
    const platform = editPlatformInput.value;
    const account = editAccountInput.value.trim();

    if (!time || !title) {
        alert("Jam dan Judul harus diisi!");
        return;
    }

    if (scheduleData[date] && scheduleData[date][index] !== undefined) {
        scheduleData[date][index].time = time;
        scheduleData[date][index].title = title;
        scheduleData[date][index].platform = platform;
        scheduleData[date][index].account = account;
        
        saveScheduleData();
        renderDailySchedule(date);
        closeEditModal();
    }
};

const closeEditModal = () => {
    editModal.classList.add('hidden');
};

// Fungsi Salin dan Tempel
const copyScheduleHandler = () => {
    if (!selectedFullDate || !scheduleData[selectedFullDate] || scheduleData[selectedFullDate].length === 0) {
        alert("Tidak ada jadwal yang bisa disalin di hari ini.");
        copiedSchedule = null;
        pasteScheduleBtn.disabled = true;
        return;
    }

    copiedSchedule = JSON.parse(JSON.stringify(scheduleData[selectedFullDate]));
    pasteScheduleBtn.disabled = false;
    alert(`Berhasil menyalin ${copiedSchedule.length} jadwal dari ${selectedFullDate}.`);
};

const pasteScheduleHandler = () => {
    if (!selectedFullDate || !copiedSchedule) {
        alert("Tidak ada jadwal yang disalin!");
        return;
    }

    const dailySchedules = scheduleData[selectedFullDate] || [];
    const pastedSchedules = copiedSchedule.map(s => ({ ...s, isUploaded: false }));

    scheduleData[selectedFullDate] = dailySchedules.concat(pastedSchedules);
    saveScheduleData();
    renderDailySchedule(selectedFullDate); 
    renderCalendar(currentYear, currentMonth);
    alert(`Jadwal berhasil ditempel di ${selectedFullDate}!`);
};


// --- Fungsi Analisis Kustom (FINAL LOGIC) ---

const showAnalysisPanel = () => {
    showView('analysis-panel');
    // Set default ke 7 hari terakhir dan jalankan analisis
    analysisPeriodSelect.value = '7';
    customPeriodInputDiv.classList.add('hidden'); // Sembunyikan input kustom
    runAnalysis(); 
};

/**
 * Mengambil jumlah hari analisis dari input kustom atau pilihan cepat.
 */
const getAnalysisPeriod = () => {
    const selectedOption = analysisPeriodSelect.value;
    
    if (selectedOption === 'custom') {
        const customDays = parseInt(customDaysInput.value);
        if (isNaN(customDays) || customDays <= 0) {
            alert("Harap masukkan jumlah hari kustom yang valid (angka > 0).");
            return null;
        }
        return customDays;
    } else {
        return parseInt(selectedOption);
    }
};

const getSchedulesInPeriod = (days) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days); 
    startDate.setHours(0, 0, 0, 0);

    const allUploadedSchedules = [];
    
    for (const dateString in scheduleData) {
        const scheduleDate = new Date(dateString + 'T00:00:00'); 
        
        if (scheduleDate > startDate && scheduleDate <= today) {
            const uploadedSchedules = scheduleData[dateString].filter(s => s.isUploaded);
            // Tambahkan tanggal ke objek schedule agar bisa diekspor
            uploadedSchedules.forEach(s => allUploadedSchedules.push({ ...s, date: dateString }));
        }
    }
    return allUploadedSchedules;
};

const runAnalysis = () => {
    const period = getAnalysisPeriod();
    if (period === null) return; 

    const uploadedSchedules = getSchedulesInPeriod(period);
    
    // Sembunyikan tombol ekspor analisis saat analisis dijalankan
    exportAnalysisBtn.classList.add('hidden'); 
    
    if (uploadedSchedules.length === 0) {
        analysisResultsDiv.classList.add('hidden');
        platformStatsBody.innerHTML = '<tr><td colspan="2">Tidak ada data upload berhasil dalam periode ini.</td></tr>';
        accountStatsBody.innerHTML = '<tr><td colspan="3">Tidak ada data upload berhasil dalam periode ini.</td></tr>';
        analysisTotalUploadEl.textContent = 0;
        analysisPeriodLabel.textContent = `(${period} Hari Terakhir)`;
        analysisExportData = null; // Reset data analisis
        return;
    }

    analysisResultsDiv.classList.remove('hidden');

    // 1. Statistik Platform
    const platformStats = uploadedSchedules.reduce((acc, s) => {
        acc[s.platform] = (acc[s.platform] || 0) + 1;
        return acc;
    }, {});
    
    // 2. Statistik Akun & Platform
    const accountStats = uploadedSchedules.reduce((acc, s) => {
        const key = s.account || 'Tidak Ada Akun';
        acc[key] = acc[key] || { platforms: {}, total: 0 };
        
        acc[key].total += 1;
        // BUG FIX: Memastikan platform dihitung per akun
        acc[key].platforms[s.platform] = (acc[key].platforms[s.platform] || 0) + 1;
        
        return acc;
    }, {});

    // ==========================================================
    // 3. SIMPAN HASIL ANALISIS UNTUK EKSPOR (LANGKAH KRITIS)
    // ==========================================================
    analysisExportData = {
        period: `${period} Hari Terakhir`,
        totalUploads: uploadedSchedules.length,
        platformStats: platformStats,
        accountStats: accountStats, 
        // Hanya simpan data penting dari jadwal mentah
        rawSchedules: uploadedSchedules.map(s => ({
            time: s.time, 
            date: s.date, 
            platform: s.platform, 
            account: s.account
        }))
    };
    
    // 4. RENDER KE HTML
    analysisPeriodLabel.textContent = `(${period} Hari Terakhir)`;
    analysisTotalUploadEl.textContent = uploadedSchedules.length;

    platformStatsBody.innerHTML = '';
    const sortedPlatform = Object.entries(platformStats).sort(([, countA], [, countB]) => countB - countA);

    sortedPlatform.forEach(([platform, count]) => {
        const row = platformStatsBody.insertRow();
        row.innerHTML = `
            <td><span class="platform-tag platform-${platform}">${platform.toUpperCase()}</span></td>
            <td>${count}</td>
        `;
    });
    
    accountStatsBody.innerHTML = '';
    const sortedAccountKeys = Object.keys(accountStats).sort();

    sortedAccountKeys.forEach(accountName => {
        const accountData = accountStats[accountName];
        
        const sortedPlatforms = Object.entries(accountData.platforms).sort(([, countA], [, countB]) => countB - countA);

        sortedPlatforms.forEach(([platform, count]) => {
            const row = accountStatsBody.insertRow();
            row.innerHTML = `
                <td><strong>${accountName}</strong></td>
                <td><span class="platform-tag platform-${platform}">${platform.toUpperCase()}</span></td>
                <td>${count}</td>
            `;
        });
        
        const totalRow = accountStatsBody.insertRow();
        totalRow.style.fontWeight = 'bold';
        totalRow.style.backgroundColor = '#e9ecef';
        totalRow.innerHTML = `
            <td colspan="2">Total Upload Akun ${accountName}:</td>
            <td>${accountData.total}</td>
        `;
    });
    
    // 5. Tampilkan tombol ekspor
    exportAnalysisBtn.classList.remove('hidden'); 
};


// ====================================================================
// FUNGSI EKSPOR DAN IMPOR DATA MENTAH (BACKUP)
// ====================================================================

const exportData = () => {
    // Ambil data dari localStorage yang disimpan di variabel scheduleData
    if (Object.keys(scheduleData).length === 0) {
        alert('Tidak ada data jadwal untuk diekspor!');
        return;
    }

    // Mengambil data mentah (scheduleData)
    const dataToSave = JSON.stringify(scheduleData, null, 2);
    const blob = new Blob([dataToSave], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Membuat tautan download dinamis
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `JadwalUpload_${date}_Backup.json`; // Nama file
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Data mentah berhasil diekspor! Harap periksa folder Download Anda.');
};

const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);

            // Verifikasi format data sederhana
            if (typeof importedData === 'object' && importedData !== null) {
                
                scheduleData = importedData; // Ganti data lama dengan data impor
                saveScheduleData(); // Simpan ke localStorage
                renderCalendar(currentYear, currentMonth); // Muat ulang kalender
                alert('Data berhasil diimpor dan kalender diperbarui!');
            } else {
                alert('Gagal impor: File JSON tidak dikenali sebagai data jadwal.');
            }
        } catch (error) {
            alert('Gagal impor: Terjadi kesalahan saat membaca file atau file rusak.');
            console.error(error);
        }
    };
    reader.readAsText(file);
};


// ====================================================================
// FUNGSI EKSPOR HASIL ANALISIS (KHUSUS PERMINTAAN ANDA)
// ====================================================================
const exportAnalysisData = () => {
    if (!analysisExportData) {
        alert('Jalankan analisis terlebih dahulu sebelum mengekspor!');
        return;
    }

    // Mengambil data analisis yang sudah terstruktur
    const dataToSave = JSON.stringify(analysisExportData, null, 2);
    const blob = new Blob([dataToSave], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    
    // Memberi nama file yang informatif
    const filenameBase = analysisExportData.period.replace(/ /g, '_');
    a.download = `AnalisisJadwal_${filenameBase}_${new Date().toISOString().slice(0, 10)}.json`; 
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Data Analisis berhasil diekspor!');
};


// --- Event Listeners & Inisialisasi ---
prevMonthBtn.addEventListener('click', () => changeMonth(-1));
nextMonthBtn.addEventListener('click', () => changeMonth(1));
closePanelBtn.addEventListener('click', closeSchedulePanel);
addScheduleBtn.addEventListener('click', addNewSchedule);
copyScheduleBtn.addEventListener('click', copyScheduleHandler);
pasteScheduleBtn.addEventListener('click', pasteScheduleHandler);

// Navigasi Tampilan
showAnalysisBtn.addEventListener('click', showAnalysisPanel);
backToCalendarBtn.addEventListener('click', () => showView('calendar-view'));

// Kontrol Analisis Kustom
analysisPeriodSelect.addEventListener('change', () => {
    if (analysisPeriodSelect.value === 'custom') {
        customPeriodInputDiv.classList.remove('hidden');
    } else {
        customPeriodInputDiv.classList.add('hidden');
    }
});
runAnalysisBtn.addEventListener('click', runAnalysis);

// EVENT LISTENER BARU UNTUK EKSPOR ANALISIS
exportAnalysisBtn.addEventListener('click', exportAnalysisData); 

// Modal Edit
saveEditBtn.addEventListener('click', saveEditedSchedule);
cancelEditBtn.addEventListener('click', closeEditModal);
cancelEditHeaderBtn.addEventListener('click', closeEditModal);

// Event listener untuk tombol Ekspor/Impor data mentah
exportDataBtn.addEventListener('click', exportData);
importDataBtn.addEventListener('click', () => importDataFile.click());
importDataFile.addEventListener('change', importData);


// Inisialisasi: Mulai dengan tampilan kalender
renderCalendar(currentYear, currentMonth);
showView('calendar-view');

// ====================================================================
// REGISTRASI PWA SERVICE WORKER (AKTIVASI PWA)
// ====================================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Daftarkan service-worker.js
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registered successfully. Scope:', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed:', error);
      });
  });
}

// script.js

// Fungsi untuk menyimpan data ke Firebase
function simpanJadwalKeFirebase(tanggal, kegiatan, waktu) {
  // Kirim data ke koleksi 'jadwal_video'
  db.collection("jadwal_video").add({
    tanggal: tanggal,
    kegiatan: kegiatan,
    waktu: waktu,
    timestamp: firebase.firestore.FieldValue.serverTimestamp() // Untuk waktu pencatatan
  })
  .then((docRef) => {
    console.log("Data berhasil disimpan dengan ID: ", docRef.id);
    alert("Jadwal berhasil disimpan!");
  })
  .catch((error) => {
    console.error("Error saat menyimpan: ", error);
    alert("Gagal menyimpan jadwal.");
  });
}

// --- Contoh integrasi dengan tombol di situs Anda ---
document.getElementById('tombol-simpan').addEventListener('click', () => {
  // Asumsi Anda mendapatkan data dari input/tabel di HTML
  const inputTanggal = document.getElementById('input-tanggal').value;
  const inputKegiatan = document.getElementById('input-kegiatan').value;
  const inputWaktu = document.getElementById('input-waktu').value;
  
  simpanJadwalKeFirebase(inputTanggal, inputKegiatan, inputWaktu);
});

// script.js (Lanjutan)

// Fungsi untuk memuat data dari Firebase saat situs dimuat
function muatJadwalDariFirebase() {
  db.collection("jadwal_video").orderBy("tanggal", "asc").get()
    .then((querySnapshot) => {
      // Membersihkan tabel/kalender yang lama
      
      querySnapshot.forEach((doc) => {
        // Mendapatkan data dari Firebase
        const dataJadwal = doc.data();
        
        // --- LOGIKA MENAMPILKAN DATA KE KALENDER/TABEL ANDA ---
        console.log("Data dimuat:", dataJadwal.tanggal, dataJadwal.kegiatan);
        
        // Di sini Anda akan menambahkan kode JS Anda untuk mengisi tabel HTML
        // dengan dataJadwal.tanggal dan dataJadwal.kegiatan
      });
    })
    .catch((error) => {
      console.log("Error saat memuat data: ", error);
    });
}

// Panggil fungsi saat halaman selesai dimuat
window.onload = muatJadwalDariFirebase;
