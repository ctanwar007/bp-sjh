// Ward 22A Hospital Management System - Complete Updated Version
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
    const config = localStorage.getItem('ward22a_cloud_config');
    
    if (!config) {
        const setupChoice = confirm(
            '☁️ Cloud Backup Setup Required\n\n' +
            'You need Google API credentials to enable cloud backup.\n\n' +
            'Click OK for setup, or Cancel to continue without cloud backup.'
        );
        
        if (setupChoice) {
            showQuickCloudSetup();
        } else {
            showToast('Working in local mode only', 'info');
        }
        return;
    }
    
    if (!window.CloudBackup) {
        showToast('⚠️ Cloud backup files not loaded. Working locally.', 'warning');
        return;
    }
    
    if (cloudBackup) {
        cloudBackup.signIn();
    } else {
        initializeCloudFeatures().then(() => {
            if (cloudBackup) {
                cloudBackup.signIn();
            }
        });
    }
}

function showQuickCloudSetup() {
    const modal = document.createElement('div');
    modal.className = 'modal quick-setup-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>☁️ Quick Cloud Setup</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div class="modal-body">
                <div style="background: #e7f3ff; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                    <h4>🔧 Enable Google Drive Backup</h4>
                    <p>Enter your Google Cloud credentials to enable encrypted cloud backup:</p>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Google API Key:</label>
                    <input type="text" id="simpleApiKey" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px;" placeholder="AIzaSyC...">
                    <small style="color: #666; font-size: 0.8rem;">From Google Cloud Console → APIs & Services → Credentials</small>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">OAuth Client ID:</label>
                    <input type="text" id="simpleClientId" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px;" placeholder="xxx.apps.googleusercontent.com">
                    <small style="color: #666; font-size: 0.8rem;">OAuth 2.0 Client ID from Google Cloud Console</small>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Encryption Password:</label>
                    <input type="password" id="simplePassword" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px;" placeholder="Strong password for encryption">
                    <small style="color: #666; font-size: 0.8rem;">This encrypts your data before cloud storage</small>
                </div>
                
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button class="btn btn--secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button class="btn btn--primary" onclick="saveSimpleSetup()">Save Configuration</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function saveSimpleSetup() {
    const apiKey = document.getElementById('simpleApiKey').value.trim();
    const clientId = document.getElementById('simpleClientId').value.trim();
    const password = document.getElementById('simplePassword').value;
    
    if (!apiKey || !clientId || !password) {
        alert('⚠️ Please fill in all fields');
        return;
    }
    
    if (password.length < 6) {
        alert('⚠️ Password should be at least 6 characters');
        return;
    }
    
    // Save configuration
    const config = {
        apiKey: apiKey,
        clientId: clientId,
        encryptionPassword: password,
        autoSync: true,
        dailyBackup: true,
        setupDate: new Date().toISOString()
    };
    
    localStorage.setItem('ward22a_cloud_config', JSON.stringify(config));
    
    // Close modal
    document.querySelector('.quick-setup-modal').remove();
    
    showToast('✅ Cloud backup configured!', 'success');
}

function cloudSignOut() {
    if (cloudBackup && window.CloudBackup) {
        cloudBackup.signOut();
    } else {
        showToast('Cloud backup not configured', 'info');
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

// NEW: Show on-leave patients modal
function showOnLeavePatients() {
    if (hms) {
        hms.showOnLeavePatients();
    }
}

// NEW: Dressing functions
function showDressingForm() {
    if (hms) {
        hms.showDressingForm();
    }
}

function closeDressingModal() {
    if (hms) {
        hms.closeDressingModal();
    }
}

function loadDressingRecords() {
    if (hms) {
        hms.loadDressingRecords();
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
        
        // Updated: 32 beds without gender separation
        this.wardConfig = {
            totalBeds: 32,
            beds: [],
            units: [1, 2, 3, 4, 5, 6]
        };
        
        // Generate bed IDs (B01 to B32)
        for (let i = 1; i <= 32; i++) {
            this.wardConfig.beds.push('B' + String(i).padStart(2, '0'));
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
                    phoneNo: '9876543210',
                    mrd: '4235',
                    uhid: '789012',
                    unit: 1,
                    bedNo: 'B01',
                    address: 'Karol Bagh, New Delhi-110005',
                    diagnosis: '30% Chemical burn',
                    mlcStatus: 'MLC',
                    admissionDate: '2025-09-04',
                    admissionTime: '10:30',
                    transferTime: '14:00',
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
                    phoneNo: '9123456789',
                    mrd: '25432',
                    uhid: '890123',
                    unit: 6,
                    bedNo: 'B15',
                    address: 'Rohini, Sector 15, New Delhi-110085',
                    diagnosis: '20% DTB',
                    mlcStatus: 'NMLC',
                    admissionDate: '2025-09-05',
                    admissionTime: '14:15',
                    transferTime: '16:30',
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
                    phoneNo: '9988776655',
                    mrd: '345678',
                    uhid: '901234',
                    unit: 5,
                    bedNo: null,
                    address: 'Lajpat Nagar, New Delhi-110024',
                    diagnosis: 'Electrical burn both hands',
                    mlcStatus: 'MLC',
                    admissionDate: '2025-09-06',
                    admissionTime: '08:45',
                    transferTime: '10:00',
                    transferFrom: 'BICU',
                    status: 'active',
                    onLeave: true,
                    leaveDate: '2025-09-07',
                    lastModified: new Date().toISOString()
                }
            ];
        }
        
        // Initialize dressing records if empty
        if (!this.hospitalData.dressingRecords) {
            this.hospitalData.dressingRecords = [];
        }
    }
    
    // Dashboard Methods
    renderBeds() {
        const container = document.getElementById('bedsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.wardConfig.beds.forEach(bedId => {
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
                    <p><strong>Phone:</strong> ${patient.phoneNo || 'N/A'}</p>
                    <p><strong>MRD:</strong> ${patient.mrd}</p>
                    <p><strong>UHID:</strong> ${patient.uhid}</p>
                    <p><strong>Unit:</strong> ${patient.unit}</p>
                    <p><strong>Diagnosis:</strong> ${patient.diagnosis}</p>
                    <p><strong>MLC Status:</strong> <span class="badge ${patient.mlcStatus === 'MLC' ? 'danger' : 'success'}">${patient.mlcStatus}</span></p>
                    <p><strong>Admission:</strong> ${patient.admissionDate} at ${patient.admissionTime}</p>
                    ${patient.onLeave ? '<p><strong>Status:</strong> <span style="color: orange; font-weight: bold;">On Leave</span></p>' : ''}
                    
                    ${this.currentMode === 'admin' ? `
                        <div class="patient-actions" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #dee2e6;">
                            <h5>Patient Actions:</h5>
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                <button class="btn btn--sm btn--warning" onclick="hms.sendOnLeave('${patient.id}')">Send on Leave</button>
                                <button class="btn btn--sm btn--info" onclick="hms.transferPatient('${patient.id}')">Transfer</button>
                                <button class="btn btn--sm btn--success" onclick="hms.dischargePatient('${patient.id}')">Discharge</button>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            body.innerHTML = `
                <div class="empty-bed-modal">
                    <p>Bed ${bedId} is currently vacant.</p>
                    ${this.currentMode === 'admin' ? `
                        <div class="bed-actions" style="margin-top: 1rem;">
                            <button class="btn btn--primary" onclick="hms.showAdmissionForm('${bedId}')">Add Patient to This Bed</button>
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        modal.classList.remove('hidden');
    }
    
    closeBedModal() {
        const modal = document.getElementById('bedModal');
        if (modal) modal.classList.add('hidden');
    }
    
    // NEW: Patient Action Functions
    sendOnLeave(patientId) {
        const patient = this.hospitalData.patients.find(p => p.id === patientId);
        if (!patient) return;
        
        if (confirm(`Send ${patient.patientName} on leave?`)) {
            patient.onLeave = true;
            patient.leaveDate = new Date().toISOString().split('T')[0];
            patient.bedNo = null; // Free up the bed
            this.saveDataToStorage();
            this.renderBeds();
            this.updateDashboardStats();
            this.closeBedModal();
            this.showToast(`${patient.patientName} sent on leave`, 'success');
        }
    }
    
    transferPatient(patientId) {
        const patient = this.hospitalData.patients.find(p => p.id === patientId);
        if (!patient) return;
        
        const transferTo = prompt(`Transfer ${patient.patientName} to which ward/department?`);
        if (!transferTo) return;
        
        if (confirm(`Transfer ${patient.patientName} to ${transferTo}?`)) {
            patient.status = 'transferred';
            patient.transferredTo = transferTo;
            patient.transferDate = new Date().toISOString();
            
            // Move to transferred patients
            this.hospitalData.transferredPatients.push(patient);
            this.hospitalData.patients = this.hospitalData.patients.filter(p => p.id !== patientId);
            
            this.saveDataToStorage();
            this.renderBeds();
            this.updateDashboardStats();
            this.closeBedModal();
            this.showToast(`${patient.patientName} transferred to ${transferTo}`, 'success');
        }
    }
    
    dischargePatient(patientId) {
        const patient = this.hospitalData.patients.find(p => p.id === patientId);
        if (!patient) return;
        
        const dischargeType = prompt(
            `Discharge type for ${patient.patientName}:\n\n` +
            '1. LAMA (Leave Against Medical Advice)\n' +
            '2. DOR (Discharge on Request)\n' +
            '3. Death\n' +
            '4. Other\n\n' +
            'Enter option number or type custom discharge type:'
        );
        
        if (!dischargeType) return;
        
        let finalDischargeType;
        switch(dischargeType) {
            case '1': finalDischargeType = 'LAMA'; break;
            case '2': finalDischargeType = 'DOR'; break;
            case '3': finalDischargeType = 'Death'; break;
            case '4': finalDischargeType = prompt('Enter custom discharge type:') || 'Other'; break;
            default: finalDischargeType = dischargeType;
        }
        
        if (confirm(`Discharge ${patient.patientName} as ${finalDischargeType}?`)) {
            patient.status = 'discharged';
            patient.dischargeType = finalDischargeType;
            patient.dischargeDateTime = new Date().toISOString();
            
            // Move to discharged patients
            this.hospitalData.dischargedPatients.push(patient);
            this.hospitalData.patients = this.hospitalData.patients.filter(p => p.id !== patientId);
            
            this.saveDataToStorage();
            this.renderBeds();
            this.updateDashboardStats();
            this.closeBedModal();
            this.showToast(`${patient.patientName} discharged as ${finalDischargeType}`, 'success');
        }
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
        
        // Make on-leave stat clickable
        const onLeaveEl = document.getElementById('onLeavePatients');
        if (onLeaveEl && onLeaveEl.parentElement) {
            onLeaveEl.parentElement.style.cursor = 'pointer';
            onLeaveEl.parentElement.onclick = () => this.showOnLeavePatients();
            onLeaveEl.parentElement.title = 'Click to view on-leave patients';
        }
    }
    
    // NEW: Show on-leave patients modal
    showOnLeavePatients() {
        const onLeavePatients = this.hospitalData.patients.filter(p => p.onLeave);
        
        if (onLeavePatients.length === 0) {
            this.showToast('No patients currently on leave', 'info');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal on-leave-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>👥 Patients on Leave (${onLeavePatients.length})</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="on-leave-list">
                        ${onLeavePatients.map(patient => `
                            <div class="patient-card">
                                <div class="patient-header">
                                    <strong>${patient.patientName}</strong> (${patient.age}${patient.sex.charAt(0)})
                                    <span class="badge ${patient.mlcStatus === 'MLC' ? 'danger' : 'success'}">${patient.mlcStatus}</span>
                                </div>
                                <div class="patient-details">
                                    <p><strong>MRD:</strong> ${patient.mrd} | <strong>Unit:</strong> ${patient.unit}</p>
                                    <p><strong>Diagnosis:</strong> ${patient.diagnosis}</p>
                                    <p><strong>Leave Date:</strong> ${patient.leaveDate}</p>
                                    <p><strong>Phone:</strong> ${patient.phoneNo || 'N/A'}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
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
        
        this.wardConfig.beds.forEach((bedId, index) => {
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
            
            if (patient && patient.onLeave) {
                row.style.backgroundColor = '#fff3cd';
                row.style.fontStyle = 'italic';
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
            const bedId = 'B' + String(i).padStart(2, '0');
            const patient = activePatients.find(p => p.bedNo === bedId);
            
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
            case 6: // NEW: Dressing register
                this.renderDressingRegister();
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
                <td>${patient.phoneNo || 'N/A'}</td>
                <td>${patient.mrd}</td>
                <td>${patient.uhid}</td>
                <td>${patient.unit}</td>
                <td>${patient.bedNo || 'On Leave'}</td>
                <td>${patient.address}</td>
                <td>${patient.diagnosis}</td>
                <td><span class="badge ${patient.mlcStatus === 'MLC' ? 'danger' : 'success'}">${patient.mlcStatus}</span></td>
                <td>${patient.admissionDate} ${patient.admissionTime}</td>
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
                <td>${patient.admissionDate}</td>
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
    
    // NEW: Updated Treatment Register with inline tags
    renderTreatmentRegister() {
        const container = document.getElementById('currentPatientsList');
        if (!container) return;
        
        container.innerHTML = '<h3>Current Patients in Ward 22A</h3>';
        
        const activePatients = this.hospitalData.patients.filter(p => p.status === 'active');
        
        if (activePatients.length === 0) {
            container.innerHTML += '<p>No active patients currently in the ward.</p>';
            return;
        }
        
        // Create inline patient tags
        const patientsContainer = document.createElement('div');
        patientsContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem;';
        
        activePatients.forEach(patient => {
            const patientTag = document.createElement('div');
            patientTag.className = 'patient-tag';
            patientTag.style.cssText = `
                background: ${patient.onLeave ? '#fff3cd' : '#e7f3ff'};
                border: 1px solid ${patient.onLeave ? '#ffeaa7' : '#b3d7ff'};
                border-radius: 20px;
                padding: 0.5rem 1rem;
                margin: 0.25rem;
                font-size: 0.9rem;
                cursor: pointer;
                transition: all 0.3s;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
            `;
            
            patientTag.innerHTML = `
                <div>
                    <strong>${patient.bedNo || 'On Leave'}</strong> - ${patient.patientName} 
                    <span style="color: #666;">(${patient.age}${patient.sex.charAt(0)})</span>
                    <span class="badge ${patient.mlcStatus === 'MLC' ? 'danger' : 'success'}" style="font-size: 0.7rem; margin-left: 0.5rem;">${patient.mlcStatus}</span>
                    ${patient.onLeave ? '<span style="color: orange; font-weight: bold; margin-left: 0.5rem;">ON LEAVE</span>' : ''}
                </div>
            `;
            
            patientTag.onclick = () => {
                this.showPatientDetails(patient);
            };
            
            patientTag.onmouseover = () => {
                patientTag.style.transform = 'scale(1.05)';
                patientTag.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            };
            
            patientTag.onmouseout = () => {
                patientTag.style.transform = 'scale(1)';
                patientTag.style.boxShadow = 'none';
            };
            
            patientsContainer.appendChild(patientTag);
        });
        
        container.appendChild(patientsContainer);
    }
    
    showPatientDetails(patient) {
        const modal = document.createElement('div');
        modal.className = 'modal patient-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>👤 ${patient.patientName} - Details</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="patient-detail-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div><strong>Bed:</strong> ${patient.bedNo || 'On Leave'}</div>
                        <div><strong>Age/Sex:</strong> ${patient.age} years / ${patient.sex}</div>
                        <div><strong>Phone:</strong> ${patient.phoneNo || 'N/A'}</div>
                        <div><strong>MRD:</strong> ${patient.mrd}</div>
                        <div><strong>UHID:</strong> ${patient.uhid}</div>
                        <div><strong>Unit:</strong> ${patient.unit}</div>
                        <div><strong>MLC:</strong> <span class="badge ${patient.mlcStatus === 'MLC' ? 'danger' : 'success'}">${patient.mlcStatus}</span></div>
                        <div><strong>Status:</strong> ${patient.onLeave ? '<span style="color: orange;">On Leave</span>' : '<span style="color: green;">In Ward</span>'}</div>
                    </div>
                    <div style="margin-top: 1rem;">
                        <strong>Diagnosis:</strong> ${patient.diagnosis}
                    </div>
                    <div style="margin-top: 1rem;">
                        <strong>Address:</strong> ${patient.address}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    renderDailyCensus() {
        const today = new Date().toISOString().split('T')[0];
        this.setElementValue('censusDate', today);
    }
    
    renderDataManagement() {
        // Update system info when data management is rendered
        this.updateSystemInfo();
    }
    
    // NEW: Dressing Register
    renderDressingRegister() {
        const container = document.getElementById('dressingContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="dressing-controls">
                <label for="dressingDate">Select Date:</label>
                <input type="date" id="dressingDate" class="form-control" onchange="loadDressingRecords()" value="${new Date().toISOString().split('T')[0]}">
                ${this.currentMode === 'admin' ? '<button class="btn btn--primary" onclick="showDressingForm()">Add Dressing Record</button>' : ''}
            </div>
            <div id="dressingRecords" class="dressing-records" style="margin-top: 1rem;">
                <p>Select a date to view dressing records</p>
            </div>
        `;
        
        // Load today's records by default
        this.loadDressingRecords();
    }
    
    loadDressingRecords() {
        const selectedDate = document.getElementById('dressingDate').value;
        const container = document.getElementById('dressingRecords');
        
        if (!selectedDate || !container) return;
        
        const records = this.hospitalData.dressingRecords.filter(record => 
            record.date === selectedDate
        );
        
        if (records.length === 0) {
            container.innerHTML = `<p>No dressing records found for ${new Date(selectedDate).toLocaleDateString()}</p>`;
            return;
        }
        
        container.innerHTML = `
            <h4>Dressing Records - ${new Date(selectedDate).toLocaleDateString()}</h4>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Bed No.</th>
                            <th>Patient Name</th>
                            <th>Age</th>
                            <th>Sex</th>
                            <th>MRD</th>
                            <th>Unit</th>
                            <th>Dressing Material</th>
                            <th>Dresser</th>
                            <th>Shown To</th>
                            <th>Sample</th>
                            ${this.currentMode === 'admin' ? '<th>Actions</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map(record => `
                            <tr>
                                <td>${record.bedNo}</td>
                                <td>${record.patientName}</td>
                                <td>${record.age}</td>
                                <td>${record.sex}</td>
                                <td>${record.mrd}</td>
                                <td>${record.unit}</td>
                                <td>${record.dressingMaterial}</td>
                                <td>${record.dresser}</td>
                                <td>${record.shownTo || '-'}</td>
                                <td>${record.sample || '-'}</td>
                                ${this.currentMode === 'admin' ? `
                                    <td>
                                        <button class="delete-btn" onclick="hms.deleteDressingRecord('${record.id}')" title="Delete">×</button>
                                    </td>
                                ` : ''}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    showDressingForm() {
        const modal = document.createElement('div');
        modal.className = 'modal dressing-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>➕ Add Dressing Record</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <form id="dressingForm" class="dressing-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Date:</label>
                                <input type="date" name="date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
                            </div>
                            <div class="form-group">
                                <label>Bed No:</label>
                                <select name="bedNo" class="form-control" required onchange="hms.updatePatientInfo(this)">
                                    <option value="">Select Bed</option>
                                    ${this.wardConfig.beds.map(bedId => {
                                        const patient = this.hospitalData.patients.find(p => p.bedNo === bedId && p.status === 'active');
                                        return `<option value="${bedId}" ${patient ? `data-patient='${JSON.stringify(patient)}'` : ''}>${bedId}${patient ? ` - ${patient.patientName}` : ' (Vacant)'}</option>`;
                                    }).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Patient Name:</label>
                                <input type="text" name="patientName" class="form-control" readonly>
                            </div>
                            <div class="form-group">
                                <label>Age:</label>
                                <input type="number" name="age" class="form-control" readonly>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Sex:</label>
                                <input type="text" name="sex" class="form-control" readonly>
                            </div>
                            <div class="form-group">
                                <label>MRD:</label>
                                <input type="text" name="mrd" class="form-control" readonly>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Unit:</label>
                                <input type="number" name="unit" class="form-control" readonly>
                            </div>
                            <div class="form-group">
                                <label>Dressing Material:</label>
                                <input type="text" name="dressingMaterial" class="form-control" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Dresser:</label>
                                <input type="text" name="dresser" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Shown To (Optional):</label>
                                <input type="text" name="shownTo" class="form-control">
                            </div>
                        </div>
                        <div class="form-group full-width">
                            <label>Sample (Optional):</label>
                            <input type="text" name="sample" class="form-control">
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn--secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                            <button type="submit" class="btn btn--primary">Save Dressing Record</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Setup form submission
        document.getElementById('dressingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addDressingRecord();
        });
    }
    
    updatePatientInfo(bedSelect) {
        const selectedOption = bedSelect.options[bedSelect.selectedIndex];
        const patientData = selectedOption.getAttribute('data-patient');
        
        const form = bedSelect.closest('form');
        if (!form) return;
        
        if (patientData) {
            const patient = JSON.parse(patientData);
            form.patientName.value = patient.patientName;
            form.age.value = patient.age;
            form.sex.value = patient.sex;
            form.mrd.value = patient.mrd;
            form.unit.value = patient.unit;
        } else {
            form.patientName.value = '';
            form.age.value = '';
            form.sex.value = '';
            form.mrd.value = '';
            form.unit.value = '';
        }
    }
    
    addDressingRecord() {
        const form = document.getElementById('dressingForm');
        const formData = new FormData(form);
        const recordData = {};
        
        for (let [key, value] of formData.entries()) {
            recordData[key] = value;
        }
        
        recordData.id = 'DR' + Date.now();
        recordData.createdAt = new Date().toISOString();
        
        this.hospitalData.dressingRecords.push(recordData);
        this.saveDataToStorage();
        
        // Close modal
        document.querySelector('.dressing-modal').remove();
        
        // Reload records
        this.loadDressingRecords();
        
        this.showToast('Dressing record added successfully', 'success');
    }
    
    deleteDressingRecord(recordId) {
        const password = prompt('⚠️ DELETE DRESSING RECORD\n\nEnter security password:');
        
        if (password !== this.credentials.security_password) {
            if (password !== null) {
                this.showToast('❌ Invalid security password', 'error');
            }
            return;
        }
        
        if (confirm('Delete this dressing record?')) {
            this.hospitalData.dressingRecords = this.hospitalData.dressingRecords.filter(r => r.id !== recordId);
            this.saveDataToStorage();
            this.loadDressingRecords();
            this.showToast('Dressing record deleted', 'success');
        }
    }
    
    closeDressingModal() {
        const modal = document.querySelector('.dressing-modal');
        if (modal) modal.remove();
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
        
        this.wardConfig.beds.forEach(bedId => {
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

// Add CSS for improved styling
document.addEventListener('DOMContentLoaded', () => {
    const improvedCSS = `
        <style>
        /* Updated bed colors - subtle light green for occupied */
        .bed-box.occupied {
            border-color: #90EE90;
            background: rgba(144, 238, 144, 0.3);
        }
        
        .bed-box.occupied:hover {
            background: rgba(144, 238, 144, 0.5);
        }
        
        /* Patient tags for treatment register */
        .patient-tag:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        /* On-leave modal styles */
        .on-leave-modal .modal-content {
            max-width: 800px;
        }
        
        .on-leave-list {
            max-height: 400px;
            overflow-y: auto;
        }
        
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
        
        /* Dressing form styles */
        .dressing-form .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        
        .dressing-form .form-group.full-width {
            grid-column: span 2;
        }
        
        .dressing-controls {
            display: flex;
            gap: 1rem;
            align-items: center;
            margin-bottom: 1rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 6px;
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
        
        /* Toast improvements */
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
        
        .toast.success { background: #28a745; }
        .toast.error { background: #dc3545; }
        .toast.warning { background: #ffc107; color: #212529; }
        .toast.info { background: #17a2b8; }
        
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        /* Number input styling */
        input[type="number"] {
            -moz-appearance: textfield;
        }
        
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        
        /* Mobile responsiveness */
        @media (max-width: 768px) {
            .dressing-form .form-row {
                grid-template-columns: 1fr;
            }
            
            .dressing-form .form-group.full-width {
                grid-column: span 1;
            }
            
            .patient-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
            }
            
            .patient-tag {
                width: 100%;
                justify-content: center;
            }
            
            .census-grid {
                grid-template-columns: 1fr;
            }
        }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', improvedCSS);
    
    console.log('🏥 Ward 22A HMS - Updated Version Loading...');
    console.log('🔐 Login: ward22a / zxcv123');
    console.log('🔒 Security Password: Chetan@123');
    console.log('🛏️ 32 universal beds (B01-B32)');
    console.log('✨ Features: On-leave click, dressing records, treatment tags, discharge options');
    
    // HMS will be initialized when mode is selected
});
