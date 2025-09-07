// Ward 22A Hospital Management System - Final Version
// Safdarjung Hospital Burns & Plastic Surgery Department
// Built for VMMC & Safdarjung Hospital, New Delhi

let hms = null;
let cloudBackup = null;
let syncManager = null;
let versionControl = null;

// ===== GLOBAL FUNCTIONS (Called from HTML) =====

function selectMode(mode) {
    console.log('Mode selected:', mode);
    
    const modeSelection = document.getElementById('modeSelection');
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    // Hide all screens
    modeSelection.classList.add('hidden');
    loginScreen.classList.add('hidden');
    mainApp.classList.add('hidden');
    
    if (mode === 'view') {
        // View mode - skip login
        mainApp.classList.remove('hidden');
        updateModeDisplay('view');
        initializeHMS();
    } else if (mode === 'admin') {
        // Admin mode - show login
        loginScreen.classList.remove('hidden');
    }
}

function backToModeSelection() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('modeSelection').classList.remove('hidden');
}

function attemptLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    // Final credentials
    const defaultUser = 'ward22a';
    const defaultPass = 'zxcv123';
    
    if (username === defaultUser && password === defaultPass) {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        updateModeDisplay('admin');
        initializeHMS();
    } else {
        errorDiv.textContent = 'Invalid username or password';
        errorDiv.classList.remove('hidden');
    }
}

function logout() {
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('modeSelection').classList.remove('hidden');
    // Clear login form
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) errorDiv.classList.add('hidden');
}

function showRegister(num) {
    // Hide all register contents
    const registerContents = document.querySelectorAll('.register-content');
    registerContents.forEach(el => el.classList.remove('active'));
    
    // Show selected register
    const selectedRegister = document.getElementById('register-' + num);
    if (selectedRegister) {
        selectedRegister.classList.add('active');
    }
    
    // Update navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));
    
    const activeButton = document.querySelector('[data-register="' + num + '"]');
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Render content for specific registers
    if (hms) {
        hms.renderRegisterContent(num);
    }
}

function saveData() {
    if (hms) {
        hms.saveData();
    }
}

function showAdmissionForm() {
    if (hms) {
        hms.showAdmissionForm();
    }
}

function closeAdmissionModal() {
    if (hms) {
        hms.closeAdmissionModal();
    }
}

function closeBedModal() {
    if (hms) {
        hms.closeBedModal();
    }
}

function showPatientListModal() {
    if (hms) {
        hms.showPatientListModal();
    }
}

function closePatientListModal() {
    if (hms) {
        hms.closePatientListModal();
    }
}

function printPatientList() {
    if (hms) {
        hms.printPatientList();
    }
}

function downloadPatientList() {
    if (hms) {
        hms.downloadPatientList();
    }
}

function exportData() {
    if (hms) {
        hms.exportData();
    }
}

function exportRegister(num) {
    if (hms) {
        hms.exportRegister(num);
    }
}

function generateCensusReport() {
    if (hms) {
        hms.generateCensusReport();
    }
}

function deleteEntry(type, id) {
    if (hms) {
        hms.deleteEntry(type, id);
    }
}

function toggleOtherTransfer(select) {
    const otherGroup = document.getElementById('otherTransferGroup');
    if (otherGroup) {
        otherGroup.style.display = select.value === 'Other' ? 'block' : 'none';
    }
}

function changeLoginCredentials() {
    if (hms) {
        hms.changeLoginCredentials();
    }
}

function closeCredentialsModal() {
    if (hms) {
        hms.closeCredentialsModal();
    }
}

function updateCredentials() {
    if (hms) {
        hms.updateCredentials();
    }
}

// ===== CLOUD BACKUP FUNCTIONS =====

function cloudSignIn() {
    if (cloudBackup && window.CloudBackup) {
        cloudBackup.signIn();
    } else {
        showToast('⚠️ Cloud backup not configured. Please run setup first.', 'warning');
        setTimeout(() => {
            if (window.cloudSetup && typeof cloudSetup.startSetupWizard === 'function') {
                cloudSetup.startSetupWizard();
            }
        }, 1000);
    }
}

function cloudSignOut() {
    if (cloudBackup && window.CloudBackup) {
        cloudBackup.signOut();
    } else {
        showToast('Cloud backup not configured', 'info');
    }
}

async function performCloudBackup() {
    if (!cloudBackup || !window.CloudBackup) {
        showToast('⚠️ Cloud backup not configured', 'warning');
        return;
    }
    
    if (!cloudBackup.isSignedIn) {
        showToast('⚠️ Please sign in to Google Drive first', 'warning');
        return;
    }
    
    try {
        // Get encryption password
        const config = JSON.parse(localStorage.getItem('ward22a_cloud_config') || '{}');
        let encryptionPassword = config.encryptionPassword;
        
        if (!encryptionPassword) {
            encryptionPassword = prompt('🔐 Enter encryption password for backup:');
            if (!encryptionPassword) {
                showToast('Backup cancelled', 'info');
                return;
            }
        }
        
        // Show loading state
        const backupBtn = document.getElementById('cloudBackupBtn');
        const originalText = backupBtn?.textContent;
        if (backupBtn) {
            backupBtn.textContent = '⏳ Creating backup...';
            backupBtn.disabled = true;
        }
        
        showToast('⏳ Creating encrypted backup...', 'info');
        
        // Perform actual backup
        const result = await cloudBackup.uploadBackup(hms.hospitalData, encryptionPassword);
        
        // Reset button
        if (backupBtn) {
            backupBtn.textContent = originalText || '☁️ Backup Now';
            backupBtn.disabled = false;
        }
        
        if (result.success) {
            showToast(`✅ Backup completed! File: ${result.filename} (${result.size})`, 'success');
            updateCloudBackupStatus(`Last backup: ${new Date().toLocaleString()}`);
        } else {
            showToast('❌ Backup failed: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('❌ Backup error: ' + error.message, 'error');
        console.error('Cloud backup error:', error);
        
        // Reset button on error
        const backupBtn = document.getElementById('cloudBackupBtn');
        if (backupBtn) {
            backupBtn.textContent = '☁️ Backup Now';
            backupBtn.disabled = false;
        }
    }
}

async function showRestoreOptions() {
    if (!cloudBackup || !window.CloudBackup) {
        showToast('⚠️ Cloud backup not configured', 'warning');
        return;
    }
    
    if (!cloudBackup.isSignedIn) {
        showToast('⚠️ Please sign in to Google Drive first', 'warning');
        return;
    }
    
    try {
        showToast('📥 Loading available backups...', 'info');
        
        const backups = await cloudBackup.listBackups();
        if (!backups.success) {
            showToast('❌ Failed to list backups: ' + backups.error, 'error');
            return;
        }
        
        if (backups.backups.length === 0) {
            showToast('📭 No backups found', 'info');
            return;
        }
        
        // Show backup selection modal with real data
        showBackupSelectionModal(backups.backups);
        
    } catch (error) {
        showToast('❌ Error loading backups: ' + error.message, 'error');
    }
}

function showBackupSelectionModal(backups) {
    const modal = document.createElement('div');
    modal.className = 'modal backup-selection-modal';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3>📥 Restore from Cloud Backup</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="backup-warning">
                    ⚠️ <strong>Warning:</strong> Restoring will replace all current data. 
                    <button class="btn btn--sm btn--secondary" onclick="performCloudBackup()">Backup Current Data First</button>
                </div>
                
                <div class="backup-stats">
                    <strong>Available Backups:</strong> ${backups.length} | 
                    <strong>Latest:</strong> ${backups[0]?.created || 'N/A'}
                </div>
                
                <div class="backup-list">
                    ${backups.map((backup, index) => `
                        <div class="backup-item ${index === 0 ? 'latest' : ''}" onclick="selectBackup('${backup.id}', '${backup.name}')">
                            <div class="backup-info">
                                <div class="backup-name">
                                    <strong>${backup.name}</strong>
                                    ${index === 0 ? '<span class="badge success">Latest</span>' : ''}
                                </div>
                                <div class="backup-details">
                                    📅 Created: ${backup.created}<br>
                                    📊 Size: ${backup.size}<br>
                                    📝 ${backup.description}
                                </div>
                            </div>
                            <div class="backup-actions">
                                <button class="btn btn--primary btn--sm">Restore</button>
                                <button class="btn btn--danger btn--sm" onclick="event.stopPropagation(); deleteBackup('${backup.id}', '${backup.name}')">Delete</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="backup-tips">
                    <h5>💡 Tips:</h5>
                    <ul>
                        <li>Always backup current data before restoring</li>
                        <li>Use the latest backup unless you need older data</li>
                        <li>You'll need the encryption password used when creating the backup</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function selectBackup(backupId, backupName) {
    if (!confirm(`⚠️ Restore from backup "${backupName}"?\n\nThis will replace ALL current data!`)) {
        return;
    }
    
    // Get encryption password
    const config = JSON.parse(localStorage.getItem('ward22a_cloud_config') || '{}');
    let encryptionPassword = config.encryptionPassword;
    
    if (!encryptionPassword) {
        encryptionPassword = prompt('🔐 Enter encryption password for this backup:');
        if (!encryptionPassword) {
            showToast('Restore cancelled', 'info');
            return;
        }
    }
    
    try {
        showToast('⏳ Restoring backup...', 'info');
        
        const result = await cloudBackup.downloadBackup(backupId, encryptionPassword);
        if (result.success) {
            // Verify data structure
            if (!result.data.hospitalData) {
                throw new Error('Invalid backup format');
            }
            
            // Replace current data
            hms.hospitalData = result.data.hospitalData;
            hms.saveDataToStorage();
            
            // Refresh UI completely
            hms.renderBeds();
            hms.updateDashboardStats();
            hms.renderRegisterContent(hms.currentRegister);
            hms.updateSystemInfo();
            
            showToast('✅ Backup restored successfully!', 'success');
            
            // Close modal
            document.querySelector('.backup-selection-modal')?.remove();
            
            // Show restore info
            if (result.data.metadata) {
                const meta = result.data.metadata;
                console.log('📋 Restored backup metadata:', meta);
                showToast(`Restored data from ${meta.exportDate ? new Date(meta.exportDate).toLocaleString() : 'unknown date'}`, 'info');
            }
            
        } else {
            showToast('❌ Restore failed: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('❌ Restore error: ' + error.message, 'error');
        console.error('Restore error:', error);
    }
}

async function deleteBackup(backupId, backupName) {
    if (!confirm(`🗑️ Permanently delete backup "${backupName}"?\n\nThis action cannot be undone!`)) {
        return;
    }
    
    try {
        const result = await cloudBackup.deleteBackup(backupId);
        if (result.success) {
            showToast('🗑️ Backup deleted successfully', 'success');
            
            // Refresh backup list
            document.querySelector('.backup-selection-modal')?.remove();
            setTimeout(() => showRestoreOptions(), 500);
        } else {
            showToast('❌ Delete failed: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('❌ Delete error: ' + error.message, 'error');
    }
}

function exportAllData() {
    if (hms) {
        hms.exportAllData();
    }
}

function importData() {
    showToast('Import data functionality coming soon!', 'info');
}

function clearAllData() {
    if (confirm('⚠️ This will permanently delete all patient data. Are you absolutely sure?')) {
        if (confirm('⚠️ FINAL WARNING: This action cannot be undone. Continue?')) {
            localStorage.clear();
            showToast('All data cleared', 'success');
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    }
}

function updateCloudBackupStatus(message) {
    const statusEl = document.getElementById('syncStatus');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = 'sync-status success';
    }
}

// ===== HMS CLASS =====

class HospitalManagementSystem {
    constructor() {
        console.log('Initializing Ward 22A Hospital Management System...');
        
        this.credentials = {
            admin_username: "ward22a",
            admin_password: "zxcv123",
            security_password: "Chetan@123"
        };
        
        this.currentMode = null;
        this.currentRegister = 0;
        
        this.wardConfig = {
            totalBeds: 32,
            maleBeds: [],
            femaleBeds: [],
            units: [1, 2, 3, 4, 5, 6]
        };
        
        // Generate bed IDs
        for (let i = 1; i <= 16; i++) {
            this.wardConfig.maleBeds.push('M' + String(i).padStart(2, '0'));
            this.wardConfig.femaleBeds.push('F' + String(i).padStart(2, '0'));
        }
        
        this.hospitalData = {
            patients: [],
            dischargedPatients: [],
            transferredPatients: [],
            staffHistory: [],
            dailyCensus: [],
            inventory: [],
            dressingRecords: []
        };
        
        this.init();
    }
    
    init() {
        try {
            this.loadDataFromStorage();
            this.loadSampleData();
            this.updateDateTime();
            this.setupEventListeners();
            console.log('HMS initialized successfully');
        } catch (error) {
            console.error('Error initializing HMS:', error);
        }
    }
    
    // Data Management
    saveDataToStorage() {
        try {
            localStorage.setItem('ward22a_hospital_data', JSON.stringify(this.hospitalData));
            localStorage.setItem('ward22a_last_save', new Date().toISOString());
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }
    
    loadDataFromStorage() {
        try {
            const savedData = localStorage.getItem('ward22a_hospital_data');
            if (savedData) {
                this.hospitalData = JSON.parse(savedData);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }
    
    loadSampleData() {
        if (this.hospitalData.patients.length === 0) {
            this.hospitalData.patients = [
                {
                    id: 'W22A001',
                    patientName: 'Rajesh Kumar',
                    fatherName: 'Suresh Kumar',
                    age: 32,
                    sex: 'Male',
                    mrd: '4235',
                    uhid: '789012',
                    unit: 1,
                    bedNo: 'M01',
                    address: 'Karol Bagh, New Delhi-110005',
                    diagnosis: '30% Chemical burn',
                    mlcStatus: 'MLC',
                    admissionDateTime: '2025-09-04T10:30',
                    transferFrom: 'BOPD/Casualty',
                    status: 'active',
                    onLeave: false,
                    lastModified: new Date().toISOString()
                },
                {
                    id: 'W22A002',
                    patientName: 'Sunita Devi',
                    fatherName: 'Ram Singh',
                    age: 29,
                    sex: 'Female',
                    mrd: '25432',
                    uhid: '890123',
                    unit: 6,
                    bedNo: 'F03',
                    address: 'Rohini, Sector 15, New Delhi-110085',
                    diagnosis: '20% DTB',
                    mlcStatus: 'NMLC',
                    admissionDateTime: '2025-09-05T14:15',
                    transferFrom: 'Ward 23A',
                    status: 'active',
                    onLeave: false,
                    lastModified: new Date().toISOString()
                },
                {
                    id: 'W22A003',
                    patientName: 'Mohan Singh',
                    fatherName: 'Ravi Singh',
                    age: 45,
                    sex: 'Male',
                    mrd: '345678',
                    uhid: '901234',
                    unit: 5,
                    bedNo: null,
                    address: 'Lajpat Nagar, New Delhi-110024',
                    diagnosis: 'Electrical burn both hands',
                    mlcStatus: 'MLC',
                    admissionDateTime: '2025-09-06T08:45',
                    transferFrom: 'BICU',
                    status: 'active',
                    onLeave: true,
                    leaveDate: '2025-09-07',
                    lastModified: new Date().toISOString()
                }
            ];
        }
    }
    
    // Dashboard Methods
    renderBeds() {
        const container = document.getElementById('bedsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        [...this.wardConfig.maleBeds, ...this.wardConfig.femaleBeds].forEach(bedId => {
            const bedElement = this.createBedElement(bedId);
            container.appendChild(bedElement);
        });
    }
    
    createBedElement(bedId) {
        const patient = this.hospitalData.patients.find(p => p.bedNo === bedId && p.status === 'active');
        const bed = document.createElement('div');
        bed.className = 'bed-box';
        bed.onclick = () => this.openBedModal(bedId);
        
        if (patient) {
            if (patient.onLeave) {
                bed.classList.add('onleave');
                bed.innerHTML = `
                    <div class="bed-number">${bedId}</div>
                    <div class="bed-patient">On Leave</div>
                    <div class="bed-patient">${patient.patientName.split(' ')[0]}</div>
                `;
            } else {
                bed.classList.add('occupied');
                bed.innerHTML = `
                    <div class="bed-number">${bedId}</div>
                    <div class="bed-patient">${patient.patientName.split(' ')[0]}</div>
                    <div class="bed-patient">${patient.mlcStatus}</div>
                `;
            }
        } else {
            bed.classList.add('vacant');
            bed.innerHTML = `
                <div class="bed-number">${bedId}</div>
                <div class="bed-patient">Vacant</div>
            `;
        }
        
        return bed;
    }
    
    openBedModal(bedId) {
        const patient = this.hospitalData.patients.find(p => p.bedNo === bedId && p.status === 'active');
        const modal = document.getElementById('bedModal');
        const title = document.getElementById('bedModalTitle');
        const body = document.getElementById('bedModalBody');
        
        if (!modal || !title || !body) return;
        
        title.textContent = 'Bed ' + bedId + ' Details';
        
        if (patient) {
            body.innerHTML = `
                <div class="patient-modal">
                    <h4>Patient Information</h4>
                    <p><strong>Name:</strong> ${patient.patientName}</p>
                    <p><strong>Father's Name:</strong> ${patient.fatherName}</p>
                    <p><strong>Age:</strong> ${patient.age} years</p>
                    <p><strong>Sex:</strong> ${patient.sex}</p>
                    <p><strong>MRD:</strong> ${patient.mrd}</p>
                    <p><strong>UHID:</strong> ${patient.uhid}</p>
                    <p><strong>Unit:</strong> ${patient.unit}</p>
                    <p><strong>Diagnosis:</strong> ${patient.diagnosis}</p>
                    <p><strong>MLC Status:</strong> <span class="badge ${patient.mlcStatus === 'MLC' ? 'danger' : 'success'}">${patient.mlcStatus}</span></p>
                    <p><strong>Admission:</strong> ${new Date(patient.admissionDateTime).toLocaleString()}</p>
                    ${patient.onLeave ? '<p><strong>Status:</strong> <span style="color: orange; font-weight: bold;">On Leave</span></p>' : ''}
                </div>
            `;
        } else {
            body.innerHTML = `
                <div class="empty-bed-modal">
                    <p>Bed ${bedId} is currently vacant.</p>
                    ${this.currentMode === 'admin' ? `<button class="btn btn--primary" onclick="hms.showAdmissionForm('${bedId}')">Add Patient to This Bed</button>` : ''}
                </div>
            `;
        }
        
        modal.classList.remove('hidden');
    }
    
    closeBedModal() {
        const modal = document.getElementById('bedModal');
        if (modal) modal.classList.add('hidden');
    }
    
    updateDashboardStats() {
        const totalPatients = this.hospitalData.patients.filter(p => p.status === 'active').length;
        const occupiedBeds = this.hospitalData.patients.filter(p => p.status === 'active' && !p.onLeave).length;
        const availableBeds = 32 - occupiedBeds;
        const onLeavePatients = this.hospitalData.patients.filter(p => p.onLeave).length;
        const mlcCases = this.hospitalData.patients.filter(p => p.mlcStatus === 'MLC').length;
        
        this.setElementText('totalPatients', totalPatients);
        this.setElementText('availableBeds', availableBeds);
        this.setElementText('onLeavePatients', onLeavePatients);
        this.setElementText('mlcCases', mlcCases);
    }
    
    // Patient List Modal
    showPatientListModal() {
        const modal = document.getElementById('patientListModal');
        const dateEl = document.getElementById('patientListDate');
        
        if (!modal) return;
        
        if (dateEl) {
            const today = new Date();
            const formattedDate = String(today.getDate()).padStart(2, '0') + '/' + 
                               String(today.getMonth() + 1).padStart(2, '0') + '/' + 
                               today.getFullYear();
            dateEl.textContent = formattedDate;
        }
        
        this.renderPatientListTable();
        modal.classList.remove('hidden');
    }
    
    closePatientListModal() {
        const modal = document.getElementById('patientListModal');
        if (modal) modal.classList.add('hidden');
    }
    
    renderPatientListTable() {
        const tbody = document.getElementById('patientListTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const activePatients = this.hospitalData.patients.filter(p => p.status === 'active');
        const allBeds = [...this.wardConfig.maleBeds, ...this.wardConfig.femaleBeds];
        
        allBeds.forEach((bedId, index) => {
            const patient = activePatients.find(p => p.bedNo === bedId);
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${patient ? patient.patientName : ''}</td>
                <td>${patient ? patient.age + ' yr' : ''}</td>
                <td>${patient ? patient.sex.charAt(0) : ''}</td>
                <td>${patient ? patient.mrd : ''}</td>
                <td>${patient ? patient.unit : ''}</td>
                <td>${patient ? patient.diagnosis : ''}</td>
            `;
            
            if (patient) {
                if (patient.onLeave) {
                    row.style.backgroundColor = '#fff3cd';
                    row.style.fontStyle = 'italic';
                }
            } else {
                row.classList.add('empty-row');
            }
        });
    }
    
    // Print Patient List
    printPatientList() {
        const activePatients = this.hospitalData.patients.filter(p => p.status === 'active');
        const today = new Date();
        const formattedDate = String(today.getDate()).padStart(2, '0') + '/' + 
                           String(today.getMonth() + 1).padStart(2, '0') + '/' + 
                           today.getFullYear();
        
        const printWindow = window.open('', '', 'width=800,height=600');
        
        let printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ward 22A Patient List</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .ward-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                .date-title { font-size: 18px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th { background-color: #000; color: white; padding: 12px; text-align: center; border: 1px solid #000; }
                td { padding: 12px; text-align: center; border: 1px solid #000; height: 40px; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .on-leave { background-color: #fff3cd !important; font-style: italic; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="ward-title">Ward -22A</div>
                <div class="date-title">Date - ${formattedDate}</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Bed No.</th>
                        <th>Patient Name</th>
                        <th>Age</th>
                        <th>Sex</th>
                        <th>MRD</th>
                        <th>Unit</th>
                        <th>Diagnosis</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        for (let i = 1; i <= 32; i++) {
            let bedId, patient;
            
            if (i <= 16) {
                bedId = 'M' + String(i).padStart(2, '0');
            } else {
                bedId = 'F' + String(i - 16).padStart(2, '0');
            }
            
            patient = activePatients.find(p => p.bedNo === bedId);
            
            let rowClass = '';
            if (patient && patient.onLeave) {
                rowClass = 'on-leave';
            }
            
            printContent += `
                <tr class="${rowClass}">
                    <td>${i}</td>
                    <td>${patient ? patient.patientName : ''}</td>
                    <td>${patient ? patient.age + ' yr' : ''}</td>
                    <td>${patient ? patient.sex.charAt(0) : ''}</td>
                    <td>${patient ? patient.mrd : ''}</td>
                    <td>${patient ? patient.unit : ''}</td>
                    <td>${patient ? patient.diagnosis : ''}</td>
                </tr>
            `;
        }
        
        printContent += `
                </tbody>
            </table>
        </body>
        </html>
        `;
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        printWindow.onload = function() {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        };
    }
    
    downloadPatientList() {
        const activePatients = this.hospitalData.patients.filter(p => p.status === 'active');
        
        const csvContent = [
            ['Bed No.', 'Patient Name', 'Age', 'Sex', 'MRD', 'Unit', 'Diagnosis'],
            ...activePatients.map(patient => [
                patient.bedNo || 'On Leave',
                patient.patientName,
                patient.age + ' yr',
                patient.sex.charAt(0),
                patient.mrd,
                patient.unit,
                patient.diagnosis
            ])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        
        this.downloadFile(csvContent, `Ward22A_PatientList_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
        this.showToast('Patient list downloaded successfully', 'success');
    }
    
    // Register rendering
    renderRegisterContent(num) {
        switch(parseInt(num)) {
            case 0:
                this.renderBeds();
                this.updateDashboardStats();
                break;
            case 1:
                this.renderAdmissionRegister();
                break;
            case 2:
                this.renderDischargeRegister();
                break;
            case 3:
                this.renderTreatmentRegister();
                break;
            case 4:
                this.renderDailyCensus();
                break;
            case 5:
                this.renderDataManagement();
                break;
            default:
                break;
        }
    }
    
    renderAdmissionRegister() {
        const tbody = document.getElementById('admissionTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.hospitalData.patients.forEach(patient => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${patient.patientName}</td>
                <td>${patient.fatherName}</td>
                <td>${patient.age}</td>
                <td>${patient.sex}</td>
                <td>${patient.mrd}</td>
                <td>${patient.uhid}</td>
                <td>${patient.unit}</td>
                <td>${patient.bedNo || 'On Leave'}</td>
                <td>${patient.address}</td>
                <td>${patient.diagnosis}</td>
                <td><span class="badge ${patient.mlcStatus === 'MLC' ? 'danger' : 'success'}">${patient.mlcStatus}</span></td>
                <td>${new Date(patient.admissionDateTime).toLocaleString()}</td>
                <td>${patient.transferFrom}</td>
                <td>
                    ${this.currentMode === 'admin' ? `
                        <button class="btn btn--sm btn--primary">Edit</button>
                        <button class="delete-btn" onclick="deleteEntry('admission', '${patient.id}')" title="Delete">×</button>
                    ` : 'View Only'}
                </td>
            `;
            
            if (patient.onLeave) {
                row.style.backgroundColor = '#fff3cd';
            }
        });
    }
    
    renderDischargeRegister() {
        const tbody = document.getElementById('dischargeTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.hospitalData.dischargedPatients.forEach(patient => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${patient.patientName}</td>
                <td>${patient.age}</td>
                <td>${patient.sex}</td>
                <td>${patient.bedNo || 'On Leave'}</td>
                <td>${patient.mrd}</td>
                <td>${patient.unit}</td>
                <td>${patient.diagnosis}</td>
                <td><span class="badge ${patient.mlcStatus === 'MLC' ? 'danger' : 'success'}">${patient.mlcStatus}</span></td>
                <td>${new Date(patient.admissionDateTime).toLocaleString()}</td>
                <td>${new Date(patient.dischargeDateTime).toLocaleString()}</td>
                <td><span class="badge info">${patient.dischargeType}</span></td>
                <td>
                    ${this.currentMode === 'admin' ? `
                        <button class="delete-btn" onclick="deleteEntry('discharge', '${patient.id}')" title="Delete">×</button>
                    ` : ''}
                </td>
            `;
        });
    }
    
    renderTreatmentRegister() {
        const container = document.getElementById('currentPatientsList');
        if (!container) return;
        
        container.innerHTML = '<h3>Current Patients in Ward 22A</h3>';
        
        this.hospitalData.patients.forEach(patient => {
            const patientDiv = document.createElement('div');
            patientDiv.className = 'patient-card';
            patientDiv.innerHTML = `
                <div class="patient-header">
                    <div>
                        <strong>${patient.bedNo || 'On Leave'}</strong> - ${patient.patientName} (${patient.age}${patient.sex.charAt(0)}) - Unit ${patient.unit}
                        <span class="badge ${patient.mlcStatus === 'MLC' ? 'danger' : 'success'}">${patient.mlcStatus}</span>
                        ${patient.onLeave ? '<span class="badge" style="background: orange;">ON LEAVE</span>' : ''}
                    </div>
                </div>
                <div class="patient-details">
                    <p><strong>Diagnosis:</strong> ${patient.diagnosis}</p>
                    <p><strong>Status:</strong> ${patient.onLeave ? 'On Leave' : 'In Ward'}</p>
                </div>
            `;
            container.appendChild(patientDiv);
        });
    }
    
    renderDailyCensus() {
        const today = new Date().toISOString().split('T')[0];
        this.setElementValue('censusDate', today);
    }
    
    renderDataManagement() {
        // Update system info when data management is rendered
        this.updateSystemInfo();
    }
    
    generateCensusReport() {
        const selectedDate = this.getElementValue('censusDate');
        const censusData = document.getElementById('censusData');
        
        if (!selectedDate) {
            this.showToast('Please select a date', 'error');
            return;
        }
        
        const totalPatients = this.hospitalData.patients.filter(p => p.status === 'active').length;
        const onLeavePatients = this.hospitalData.patients.filter(p => p.onLeave).length;
        
        if (censusData) {
            censusData.innerHTML = `
                <div class="census-report">
                    <h4>Daily Census Report - ${new Date(selectedDate).toLocaleDateString()}</h4>
                    <div class="census-grid">
                        <div class="census-item">
                            <label>Total Active Patients:</label>
                            <span>${totalPatients}</span>
                        </div>
                        <div class="census-item">
                            <label>Patients On Leave:</label>
                            <span>${onLeavePatients}</span>
                        </div>
                        <div class="census-item">
                            <label>Occupied Beds:</label>
                            <span>${totalPatients - onLeavePatients}</span>
                        </div>
                        <div class="census-item">
                            <label>Available Beds:</label>
                            <span>${32 - (totalPatients - onLeavePatients)}</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    // Admission Form
    showAdmissionForm(preSelectedBed = null) {
        const modal = document.getElementById('admissionModal');
        const bedSelect = document.getElementById('availableBedSelect');
        
        if (!modal || !bedSelect) return;
        
        bedSelect.innerHTML = '<option value="">Select Bed</option>';
        
        // Add on-leave option
        const onLeaveOption = document.createElement('option');
        onLeaveOption.value = 'ON_LEAVE';
        onLeaveOption.textContent = '⚠️ Admit On Leave (No Bed Assignment)';
        bedSelect.appendChild(onLeaveOption);
        
        // Add available beds
        const occupiedBeds = this.hospitalData.patients
            .filter(p => p.status === 'active' && !p.onLeave && p.bedNo)
            .map(p => p.bedNo);
        
        [...this.wardConfig.maleBeds, ...this.wardConfig.femaleBeds].forEach(bedId => {
            if (!occupiedBeds.includes(bedId)) {
                const option = document.createElement('option');
                option.value = bedId;
                option.textContent = bedId;
                if (bedId === preSelectedBed) option.selected = true;
                bedSelect.appendChild(option);
            }
        });
        
        modal.classList.remove('hidden');
    }
    
    closeAdmissionModal() {
        const modal = document.getElementById('admissionModal');
        const form = document.getElementById('admissionForm');
        
        if (modal) modal.classList.add('hidden');
        if (form) form.reset();
    }
    
    // Setup Event Listeners
    setupEventListeners() {
        const admissionForm = document.getElementById('admissionForm');
        if (admissionForm) {
            admissionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addNewPatient();
            });
        }
    }
    
    addNewPatient() {
        const form = document.getElementById('admissionForm');
        if (!form) return;
        
        const formData = new FormData(form);
        const patientData = {};
        
        for (let [key, value] of formData.entries()) {
            patientData[key] = value;
        }
        
        patientData.id = 'W22A' + String(Date.now()).substr(-6);
        patientData.admissionDateTime = new Date().toISOString();
        patientData.status = 'active';
        patientData.lastModified = new Date().toISOString();
        
        if (patientData.bedNo === 'ON_LEAVE') {
            patientData.onLeave = true;
            patientData.leaveDate = new Date().toISOString().split('T')[0];
            patientData.bedNo = null;
        } else {
            patientData.onLeave = false;
        }
        
        if (patientData.transferFrom === 'Other') {
            patientData.transferFrom = patientData.otherTransferFrom || 'Other';
        }
        
        this.hospitalData.patients.push(patientData);
        this.saveDataToStorage();
        this.closeAdmissionModal();
        this.renderBeds();
        this.updateDashboardStats();
        this.renderRegisterContent(this.currentRegister);
        
        if (patientData.onLeave) {
            this.showToast('Patient admitted on leave successfully', 'success');
        } else {
            this.showToast('Patient admitted successfully', 'success');
        }
    }
    
    // Delete Entry
    deleteEntry(type, id) {
        const password = prompt('⚠️ PERMANENT DELETE\n\nEnter security password to confirm:');
        
        if (password !== this.credentials.security_password) {
            if (password !== null) {
                this.showToast('❌ Invalid security password', 'error');
            }
            return;
        }
        
        const confirmDelete = confirm('⚠️ FINAL CONFIRMATION\n\nPermanently delete this entry?');
        if (!confirmDelete) return;
        
        let deleted = false;
        
        switch(type) {
            case 'admission':
                const patientIndex = this.hospitalData.patients.findIndex(p => p.id === id);
                if (patientIndex !== -1) {
                    this.hospitalData.patients.splice(patientIndex, 1);
                    deleted = true;
                }
                break;
            case 'discharge':
                const dischargeIndex = this.hospitalData.dischargedPatients.findIndex(p => p.id === id);
                if (dischargeIndex !== -1) {
                    this.hospitalData.dischargedPatients.splice(dischargeIndex, 1);
                    deleted = true;
                }
                break;
        }
        
        if (deleted) {
            this.saveDataToStorage();
            this.renderBeds();
            this.updateDashboardStats();
            this.renderRegisterContent(this.currentRegister);
            this.showToast('Entry deleted permanently', 'success');
        }
    }
    
    // Export Functions
    exportData() {
        this.showToast('Export functionality available', 'info');
    }
    
    exportRegister(num) {
        let data, filename;
        
        switch(num) {
            case 1:
                data = this.hospitalData.patients;
                filename = 'admission_register.csv';
                break;
            default:
                this.showToast('Export not available for this register', 'info');
                return;
        }
        
        this.downloadCSV(data, filename);
    }
    
    downloadCSV(data, filename) {
        if (!data || data.length === 0) {
            this.showToast('No data to export', 'error');
            return;
        }
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => JSON.stringify(row[header] || '')).join(',')
            )
        ].join('\n');
        
        this.downloadFile(csvContent, filename, 'text/csv');
        this.showToast(filename + ' downloaded successfully', 'success');
    }
    
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
    
    exportAllData() {
        const allData = {
            exportDate: new Date().toISOString(),
            ward: 'Ward 22A',
            hospital: 'VMMC & Safdarjung Hospital',
            hospitalData: this.hospitalData
        };
        
        const dataStr = JSON.stringify(allData, null, 2);
        this.downloadFile(dataStr, `Ward22A_Complete_Backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
        this.showToast('Complete data exported successfully', 'success');
    }
    
    // Save Data
    saveData() {
        this.showLoading('Saving data...');
        setTimeout(() => {
            this.saveDataToStorage();
            this.hideLoading();
            this.showToast('Data saved successfully', 'success');
            this.updateSystemInfo();
        }, 1000);
    }
    
    updateSystemInfo() {
        const lastSave = localStorage.getItem('ward22a_last_save');
        const totalRecords = this.hospitalData.patients.length + this.hospitalData.dischargedPatients.length;
        const dataStr = JSON.stringify(this.hospitalData);
        const storageSize = new Blob([dataStr]).size;
        
        this.setElementText('lastSaveTime', lastSave ? new Date(lastSave).toLocaleString() : 'Never');
        this.setElementText('totalRecords', totalRecords);
        this.setElementText('storageUsed', this.formatStorageSize(storageSize));
    }
    
    formatStorageSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    // Credential Management
    changeLoginCredentials() {
        if (this.currentMode !== 'admin') return;
        const modal = document.getElementById('credentialsModal');
        if (modal) modal.classList.remove('hidden');
    }
    
    closeCredentialsModal() {
        const modal = document.getElementById('credentialsModal');
        if (modal) modal.classList.add('hidden');
    }
    
    updateCredentials() {
        const securityCheck = this.getElementValue('securityPasswordCheck');
        const newUsername = this.getElementValue('newUsername');
        const newPassword = this.getElementValue('newPassword');
        const newSecurityPassword = this.getElementValue('newSecurityPassword');
        
        if (securityCheck !== this.credentials.security_password) {
            this.showToast('Invalid security password', 'error');
            return;
        }
        
        if (!newUsername || !newPassword || !newSecurityPassword) {
            this.showToast('All fields are required', 'error');
            return;
        }
        
        this.credentials.admin_username = newUsername;
        this.credentials.admin_password = newPassword;
        this.credentials.security_password = newSecurityPassword;
        
        localStorage.setItem('ward22a_credentials', JSON.stringify(this.credentials));
        this.closeCredentialsModal();
        this.showToast('Credentials updated successfully', 'success');
    }
    
    // Utility Methods
    updateDateTime() {
        const now = new Date();
        const dateTimeString = now.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        this.setElementText('currentDateTime', dateTimeString);
        setTimeout(() => this.updateDateTime(), 60000);
    }
    
    // Helper Methods
    setElementText(id, text) {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    }
    
    setElementValue(id, value) {
        const element = document.getElementById(id);
        if (element) element.value = value;
    }
    
    getElementValue(id) {
        const element = document.getElementById(id);
        return element ? element.value : '';
    }
    
    showToast(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // Create toast if container exists
        const container = document.getElementById('toastContainer');
        if (container) {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            container.appendChild(toast);
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 3000);
        }
    }
    
    showLoading(message = 'Loading...') {
        const loading = document.getElementById('loadingIndicator');
        if (loading) {
            const loadingText = loading.querySelector('p');
            if (loadingText) loadingText.textContent = message;
            loading.classList.remove('hidden');
        }
    }
    
    hideLoading() {
        const loading = document.getElementById('loadingIndicator');
        if (loading) loading.classList.add('hidden');
    }
}

// ===== CLOUD BACKUP INITIALIZATION =====

async function initializeCloudFeatures() {
    try {
        console.log('🌥️ Initializing cloud backup features...');
        
        // Check if cloud setup is configured
        const config = localStorage.getItem('ward22a_cloud_config');
        if (!config) {
            console.log('☁️ Cloud backup not configured');
            return;
        }
        
        const cloudConfig = JSON.parse(config);
        console.log('📋 Cloud configuration loaded:', {
            hasApiKey: !!cloudConfig.apiKey,
            hasClientId: !!cloudConfig.clientId,
            hasEncryption: !!cloudConfig.encryptionPassword
        });
        
        // Initialize real cloud backup system
        if (window.CloudBackup) {
            cloudBackup = new CloudBackup();
            
            // Initialize Google Drive API
            try {
                await cloudBackup.initializeGoogleDrive();
                console.log('✅ Google Drive API ready');
            } catch (error) {
                console.error('❌ Google Drive initialization failed:', error);
                showToast('⚠️ Cloud backup initialization failed: ' + error.message, 'warning');
            }
        } else {
            console.warn('⚠️ CloudBackup class not available. Make sure cloudBackup.js is loaded.');
        }
        
        // Initialize encryption system
        if (window.DataEncryption) {
            const encryption = new DataEncryption();
            const testResult = await encryption.testEncryption();
            console.log('🔐 Encryption test:', testResult ? 'PASSED' : 'FAILED');
        } else {
            console.warn('⚠️ DataEncryption class not available. Make sure encryption.js is loaded.');
        }
        
        // Update UI to show cloud features are available
        updateCloudUI();
        
        // Setup automatic backup if enabled
        if (cloudBackup && cloudConfig.dailyBackup) {
            cloudBackup.setupAutoBackup(24); // Every 24 hours
            console.log('⏰ Automatic backup enabled');
        }
        
        console.log('✅ Cloud features initialized successfully');
        
    } catch (error) {
        console.error('❌ Cloud initialization failed:', error);
        showToast('❌ Cloud backup initialization failed', 'error');
    }
}

function updateCloudUI() {
    // Enable cloud backup buttons
    const signInBtn = document.getElementById('googleSignInBtn');
    const backupBtn = document.getElementById('cloudBackupBtn');
    const restoreBtn = document.getElementById('cloudRestoreBtn');
    
    if (signInBtn) {
        signInBtn.disabled = false;
        signInBtn.style.opacity = '1';
    }
    
    // Add configured indicator
    const cloudSection = document.querySelector('.cloud-backup-section');
    if (cloudSection && !cloudSection.querySelector('.cloud-configured-indicator')) {
        const indicator = document.createElement('div');
        indicator.className = 'cloud-configured-indicator';
        indicator.innerHTML = '✅ Cloud backup configured and ready';
        indicator.style.cssText = 'background: #d4edda; color: #155724; padding: 1rem; border-radius: 6px; margin-bottom: 1rem; font-weight: 600; text-align: center;';
        cloudSection.insertBefore(indicator, cloudSection.firstChild);
    }
}

// ===== INITIALIZATION =====

function updateModeDisplay(mode) {
    const modeEl = document.getElementById('currentMode');
    const changeCredsBtn = document.getElementById('changeCredsBtn');
    const addPatientBtn = document.getElementById('addPatientBtn');
    const addAdmissionBtn = document.getElementById('addAdmissionBtn');
    const addInventoryBtn = document.getElementById('addInventoryBtn');
    const addDressingBtn = document.getElementById('addDressingBtn');
    
    if (modeEl) {
        if (mode === 'admin') {
            modeEl.textContent = 'Admin Mode';
            modeEl.className = 'mode-badge admin';
        } else {
            modeEl.textContent = 'View Only Mode';
            modeEl.className = 'mode-badge view';
        }
    }
    
    const adminButtons = [changeCredsBtn, addPatientBtn, addAdmissionBtn, addInventoryBtn, addDressingBtn];
    adminButtons.forEach(btn => {
        if (btn) {
            btn.style.display = mode === 'admin' ? 'inline-block' : 'none';
        }
    });
}

function initializeHMS() {
    if (!hms) {
        hms = new HospitalManagementSystem();
        window.hms = hms; // Make available globally
        
        // Set current mode
        const modeEl = document.getElementById('currentMode');
        if (modeEl) {
            hms.currentMode = modeEl.textContent.includes('Admin') ? 'admin' : 'view';
        }
        
        // Initial render
        hms.renderBeds();
        hms.updateDashboardStats();
        hms.updateSystemInfo();
        
        // Initialize cloud features
        setTimeout(() => {
            initializeCloudFeatures();
        }, 1000);
    }
}

// Show toast utility function
function showToast(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    
    const container = document.getElementById('toastContainer');
    if (container) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    } else {
        // Fallback to alert if no toast container
        if (type === 'error') {
            alert('❌ ' + message);
        }
    }
}

// Add CSS for backup modal and improved styling
document.addEventListener('DOMContentLoaded', () => {
    const additionalCSS = `
        <style>
        /* Backup Modal Styles */
        .backup-list {
            max-height: 400px;
            overflow-y: auto;
            margin: 1rem 0;
        }

        .backup-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            margin-bottom: 1rem;
            cursor: pointer;
            transition: all 0.3s;
        }

        .backup-item:hover {
            background: #f8f9fa;
            border-color: #007bff;
        }

        .backup-item.latest {
            border-color: #28a745;
            background: rgba(40, 167, 69, 0.05);
        }

        .backup-info {
            flex: 1;
        }

        .backup-name {
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
        }

        .backup-details {
            font-size: 0.9rem;
            color: #666;
            line-height: 1.4;
        }

        .backup-actions {
            display: flex;
            gap: 0.5rem;
        }

        .backup-warning {
            background: #fff3cd;
            color: #856404;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            border: 1px solid #ffeaa7;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .backup-stats {
            background: #f8f9fa;
            padding: 0.75rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
        }

        .backup-tips {
            background: #e7f3ff;
            padding: 1rem;
            border-radius: 6px;
            margin-top: 1rem;
        }

        .backup-tips ul {
            margin: 0.5rem 0;
            padding-left: 1.5rem;
        }

        .backup-tips li {
            margin-bottom: 0.5rem;
        }
        
        /* Patient Card Styles */
        .patient-card {
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .patient-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .patient-details p {
            margin: 0.25rem 0;
            font-size: 0.9rem;
        }
        
        /* Census Report Styles */
        .census-report {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .census-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .census-item {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .census-item label {
            font-weight: 600;
            color: #495057;
        }
        
        .census-item span {
            font-size: 1.5rem;
            font-weight: bold;
            color: #007bff;
        }

        /* Improved Toast Styles */
        .toast {
            background: #333;
            color: white;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 0.5rem;
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease;
        }
        
        .toast.success {
            background: #28a745;
        }
        
        .toast.error {
            background: #dc3545;
        }
        
        .toast.warning {
            background: #ffc107;
            color: #212529;
        }
        
        .toast.info {
            background: #17a2b8;
        }

        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        /* Mobile Responsiveness */
        @media (max-width: 768px) {
            .backup-item {
                flex-direction: column;
                align-items: stretch;
                gap: 1rem;
            }
            
            .backup-actions {
                justify-content: center;
            }
            
            .census-grid {
                grid-template-columns: 1fr;
            }
            
            .patient-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
            }
        }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', additionalCSS);
    
    console.log('🏥 Ward 22A HMS - Final Version Loading...');
    console.log('📅 Current Date:', new Date().toLocaleString());
    console.log('🔐 Login: ward22a / zxcv123');
    console.log('🔒 Security Password: Chetan@123');
    
    // HMS will be initialized when mode is selected
});
