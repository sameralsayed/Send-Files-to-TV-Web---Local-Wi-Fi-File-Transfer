// script.js
let selectedFiles = [];
let discoveredDevices = [
    { id: 1, name: "Samsung TV - Living Room", type: "tv", ip: "192.168.1.45" },
    { id: 2, name: "LG OLED TV - Bedroom", type: "tv", ip: "192.168.1.67" },
    { id: 3, name: "Windows PC - Office", type: "pc", ip: "192.168.1.22" },
    { id: 4, name: "Android Tablet", type: "tablet", ip: "192.168.1.89" }
];
let receivedFiles = [];
let transferHistory = JSON.parse(localStorage.getItem('sendFilesHistory')) || [];
let currentTransferDevice = null;
let transferInterval = null;

$(document).ready(function () {
    console.log('%c📡 Send Files to TV Web – Fully functional local transfer demo by SAMER SAEID', 'color:#00b4d8; font-weight:bold');
    
    renderRecentTransfers();
    renderDevices();
    renderReceivedFiles();
    renderHistory();
    
    // Drag & Drop handlers
    const dropZone = document.getElementById('dropZone');
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
    
    document.getElementById('fileInput').addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
});

function switchTab(n) {
    $('.tab-panel').removeClass('active');
    $('#tab-' + n).addClass('active');
    if (n === 2) renderDevices();
    if (n === 3) renderReceivedFiles();
    if (n === 4) renderHistory();
}

function handleFiles(files) {
    selectedFiles = Array.from(files);
    renderSelectedFiles();
    // Auto-show send button if devices exist
    if (selectedFiles.length > 0) $('#sendBtn').removeClass('d-none');
}

function renderSelectedFiles() {
    let html = '<h6 class="mb-3">Selected Files (' + selectedFiles.length + ')</h6>';
    selectedFiles.forEach((file, i) => {
        const size = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
        html += `
        <div class="file-pill d-flex align-items-center justify-content-between bg-black border border-primary rounded-3 p-3 mb-2">
            <div class="d-flex align-items-center">
                <i class="bi bi-file-earmark me-3 fs-4 text-primary"></i>
                <div>
                    <div>${file.name}</div>
                    <small class="text-white-50">${size}</small>
                </div>
            </div>
            <button onclick="removeSelectedFile(${i});" class="btn btn-sm text-danger">×</button>
        </div>`;
    });
    $('#selectedFiles').html(html);
}

function removeSelectedFile(i) {
    selectedFiles.splice(i, 1);
    renderSelectedFiles();
    if (selectedFiles.length === 0) $('#sendBtn').addClass('d-none');
}

function scanNetwork() {
    const btnText = $('button:contains("Scan Network")').html();
    $('button:contains("Scan Network")').html('<span class="spinner-border spinner-border-sm me-2"></span>Scanning...');
    
    setTimeout(() => {
        // Simulate finding more devices
        if (discoveredDevices.length < 6) {
            discoveredDevices.push({ id: Date.now(), name: "New Device " + Math.floor(Math.random()*99), type: "tv", ip: "192.168.1." + (10 + Math.floor(Math.random()*80)) });
        }
        renderDevices();
        renderFullDeviceList();
        $('button:contains("Scanning...")').html('<i class="bi bi-arrow-repeat me-1"></i>Scan Network');
        alert('✅ Network scan complete!\n' + discoveredDevices.length + ' devices found on your Wi-Fi.');
    }, 1600);
}

function renderDevices() {
    let html = '';
    discoveredDevices.forEach(device => {
        const icon = device.type === 'tv' ? 'bi-tv' : device.type === 'pc' ? 'bi-pc-display' : 'bi-tablet';
        html += `
        <div onclick="selectDevice(${device.id})" class="list-group-item list-group-item-action bg-black border-primary d-flex align-items-center">
            <i class="bi ${icon} fs-3 me-3 text-primary"></i>
            <div class="flex-grow-1">
                <div>${device.name}</div>
                <small class="text-white-50">${device.ip}</small>
            </div>
            <span class="badge bg-primary">Ready</span>
        </div>`;
    });
    $('#deviceList').html(html || '<div class="text-center py-4 text-white-50">No devices yet.<br>Tap Scan Network above.</div>');
}

function renderFullDeviceList() {
    let html = '';
    discoveredDevices.forEach(device => {
        const icon = device.type === 'tv' ? 'bi-tv' : device.type === 'pc' ? 'bi-pc-display' : 'bi-tablet';
        html += `
        <div class="list-group-item bg-black border-primary d-flex align-items-center">
            <i class="bi ${icon} fs-3 me-3 text-primary"></i>
            <div class="flex-grow-1">
                <div>${device.name}</div>
                <small class="text-white-50">${device.ip}</small>
            </div>
        </div>`;
    });
    $('#fullDeviceList').html(html);
}

function selectDevice(id) {
    currentTransferDevice = discoveredDevices.find(d => d.id === id);
    $('#sendBtn').removeClass('d-none').html(`<i class="bi bi-send me-2"></i>SEND TO ${currentTransferDevice.name.toUpperCase()}`);
}

function startTransfer() {
    if (!currentTransferDevice || selectedFiles.length === 0) return;
    
    const modal = new bootstrap.Modal(document.getElementById('transferModal'));
    document.getElementById('transferTitle').innerHTML = `Sending to <strong>${currentTransferDevice.name}</strong>`;
    
    let progressHTML = '';
    selectedFiles.forEach((file, i) => {
        progressHTML += `
        <div class="mb-4">
            <div class="d-flex justify-content-between small mb-1">
                <span>${file.name}</span>
                <span id="progressText${i}">0%</span>
            </div>
            <div class="transfer-bar"><div id="progressBar${i}" class="transfer-progress" style="width:0%"></div></div>
        </div>`;
    });
    document.getElementById('transferProgressContainer').innerHTML = progressHTML;
    
    modal.show();
    
    // Simulate transfer
    let fileIndex = 0;
    transferInterval = setInterval(() => {
        if (fileIndex >= selectedFiles.length) {
            clearInterval(transferInterval);
            finishTransfer(modal);
            return;
        }
        
        let progress = 0;
        const bar = document.getElementById('progressBar' + fileIndex);
        const text = document.getElementById('progressText' + fileIndex);
        
        const interval2 = setInterval(() => {
            progress += Math.random() * 18;
            if (progress > 100) progress = 100;
            bar.style.width = progress + '%';
            text.textContent = Math.floor(progress) + '%';
            
            if (progress >= 100) {
                clearInterval(interval2);
                fileIndex++;
            }
        }, 120);
    }, 800);
}

function finishTransfer(modal) {
    // Add to received and history
    selectedFiles.forEach(file => {
        const transfer = {
            id: Date.now(),
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
            device: currentTransferDevice.name,
            time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
            type: 'sent'
        };
        transferHistory.unshift(transfer);
        receivedFiles.unshift(transfer);
    });
    
    saveToStorage();
    renderReceivedFiles();
    renderHistory();
    renderRecentTransfers();
    
    modal.hide();
    alert(`✅ Transfer complete!\n${selectedFiles.length} file(s) sent to ${currentTransferDevice.name}`);
    
    // Reset
    selectedFiles = [];
    currentTransferDevice = null;
    $('#sendBtn').addClass('d-none');
    $('#selectedFiles').html('');
}

function cancelTransfer() {
    if (transferInterval) clearInterval(transferInterval);
    bootstrap.Modal.getInstance(document.getElementById('transferModal')).hide();
}

function renderReceivedFiles() {
    let html = '';
    receivedFiles.forEach(file => {
        html += `
        <div class="list-group-item bg-black border-primary d-flex align-items-center">
            <i class="bi bi-file-earmark-arrow-down fs-4 me-3 text-primary"></i>
            <div class="flex-grow-1">
                <div>${file.name}</div>
                <small class="text-white-50">${file.size} • ${file.time}</small>
            </div>
            <button onclick="openReceivedFile('${file.name}')" class="btn btn-sm btn-primary">Open</button>
        </div>`;
    });
    $('#receivedFilesList').html(html);
    $('#emptyReceived').toggle(receivedFiles.length === 0);
}

function openReceivedFile(name) {
    alert(`📂 Opened ${name}\n(Preview / Play would launch in real app)`);
}

function renderHistory() {
    let html = '';
    transferHistory.forEach(item => {
        const icon = item.type === 'sent' ? 'bi-send' : 'bi-download';
        html += `
        <div class="list-group-item bg-black border-primary d-flex align-items-center">
            <i class="bi ${icon} me-3 text-primary"></i>
            <div class="flex-grow-1">
                <div>${item.name}</div>
                <small class="text-white-50">${item.device} • ${item.time}</small>
            </div>
            <span class="badge bg-secondary">${item.size}</span>
        </div>`;
    });
    $('#historyList').html(html || '<div class="text-center py-5 text-white-50">No transfers yet</div>');
}

function renderRecentTransfers() {
    const recent = transferHistory.slice(0, 3);
    let html = '';
    recent.forEach(item => {
        html += `
        <div class="col-md-4">
            <div class="card bg-black border-primary h-100">
                <div class="card-body text-center">
                    <i class="bi bi-send fs-1 text-primary mb-3"></i>
                    <h6>${item.name}</h6>
                    <small class="text-white-50">${item.device}</small>
                </div>
            </div>
        </div>`;
    });
    $('#recentTransfers').html(html || '<div class="col-12 text-center text-white-50 py-4">Your recent transfers will appear here</div>');
}

function addManualDevice() {
    const name = prompt("Enter device name (e.g. My Smart TV):", "New Smart TV");
    if (name) {
        discoveredDevices.unshift({
            id: Date.now(),
            name: name,
            type: "tv",
            ip: "192.168.1." + Math.floor(Math.random() * 99)
        });
        renderDevices();
        renderFullDeviceList();
    }
}

function clearHistory() {
    if (confirm('Clear all transfer history?')) {
        transferHistory = [];
        receivedFiles = [];
        saveToStorage();
        renderHistory();
        renderReceivedFiles();
        renderRecentTransfers();
    }
}

function saveToStorage() {
    localStorage.setItem('sendFilesHistory', JSON.stringify(transferHistory));
}

// Global exposure
window.switchTab = switchTab;
window.scanNetwork = scanNetwork;
window.handleFiles = handleFiles;
window.removeSelectedFile = removeSelectedFile;
window.selectDevice = selectDevice;
window.startTransfer = startTransfer;
window.cancelTransfer = cancelTransfer;
window.openReceivedFile = openReceivedFile;
window.addManualDevice = addManualDevice;
window.clearHistory = clearHistory;
