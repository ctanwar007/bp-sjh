// syncManager.js - Multi-Device Synchronization
class SyncManager {
    constructor(hospitalSystem) {
        this.hms = hospitalSystem;
        this.cloudBackup = new CloudBackup();
        this.syncInterval = 5 * 60 * 1000; // 5 minutes
        this.lastSyncTime = null;
        this.isSyncing = false;
        this.conflictResolver = new ConflictResolver();
        this.deviceId = this.generateDeviceId();
    }

    // Generate unique device ID
    generateDeviceId() {
        let deviceId = localStorage.getItem('ward22a_device_id');
        if (!deviceId) {
            deviceId = 'DEVICE_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('ward22a_device_id', deviceId);
        }
        return deviceId;
    }

    // Initialize sync system
    async initialize() {
        await this.cloudBackup.initializeGoogleDrive();
        this.setupAutoSync();
        this.setupConflictDetection();
        
        // Load last sync time
        this.lastSyncTime = localStorage.getItem('ward22a_last_sync');
        
        // Check for updates on startup
        await this.checkForUpdates();
    }

    // Setup automatic sync
    setupAutoSync() {
        setInterval(async () => {
            if (!this.isSyncing && this.cloudBackup.isSignedIn) {
                await this.performSync();
            }
        }, this.syncInterval);

        // Sync when window gains focus (switching between devices)
        window.addEventListener('focus', async () => {
            if (!this.isSyncing && this.cloudBackup.isSignedIn) {
                await this.checkForUpdates();
            }
        });

        // Sync before page unload
        window.addEventListener('beforeunload', async () => {
            if (this.cloudBackup.isSignedIn) {
                await this.quickSync();
            }
        });
    }

    // Perform full synchronization
    async performSync() {
        if (this.isSyncing) return;
        
        this.isSyncing = true;
        this.showSyncStatus('Synchronizing...', 'info');

        try {
            // 1. Upload current changes
            await this.uploadChanges();
            
            // 2. Check for remote updates
            await this.downloadUpdates();
            
            // 3. Resolve any conflicts
            await this.resolveConflicts();
            
            // 4. Update last sync time
            this.lastSyncTime = new Date().toISOString();
            localStorage.setItem('ward22a_last_sync', this.lastSyncTime);
            
            this.showSyncStatus('✅ Sync completed', 'success');
            
        } catch (error) {
            console.error('Sync error:', error);
            this.showSyncStatus('❌ Sync failed', 'error');
        } finally {
            this.isSyncing = false;
        }
    }

    // Quick sync (for page unload)
    async quickSync() {
        try {
            const syncData = this.prepareSyncData();
            const encryptionPassword = this.getEncryptionPassword();
            
            await this.cloudBackup.uploadBackup(syncData, encryptionPassword);
        } catch (error) {
            console.error('Quick sync failed:', error);
        }
    }

    // Upload local changes to cloud
    async uploadChanges() {
        const localData = this.hms.hospitalData;
        const syncMetadata = {
            deviceId: this.deviceId,
            timestamp: new Date().toISOString(),
            version: this.getDataVersion(),
            checksum: this.calculateChecksum(localData)
        };

        const syncData = {
            hospitalData: localData,
            metadata: syncMetadata
        };

        const encryptionPassword = this.getEncryptionPassword();
        const result = await this.cloudBackup.uploadBackup(syncData, encryptionPassword);
        
        if (result.success) {
            localStorage.setItem('ward22a_last_upload', result.uploadTime);
        }
        
        return result;
    }

    // Download remote updates
    async downloadUpdates() {
        const backupList = await this.cloudBackup.listBackups();
        
        if (!backupList.success || backupList.backups.length === 0) {
            return;
        }

        // Get the most recent backup
        const latestBackup = backupList.backups[0];
        const lastUpload = localStorage.getItem('ward22a_last_upload');
        
        // Check if there are newer changes
        if (lastUpload && new Date(latestBackup.created) <= new Date(lastUpload)) {
            return; // No newer changes
        }

        // Download and apply updates
        const encryptionPassword = this.getEncryptionPassword();
        const result = await this.cloudBackup.downloadBackup(latestBackup.id, encryptionPassword);
        
        if (result.success) {
            await this.applyRemoteChanges(result.data);
        }
    }

    // Apply remote changes with conflict detection
    async applyRemoteChanges(remoteData) {
        const localData = this.hms.hospitalData;
        const conflicts = this.detectConflicts(localData, remoteData.hospitalData);
        
        if (conflicts.length > 0) {
            // Store conflicts for resolution
            localStorage.setItem('ward22a_sync_conflicts', JSON.stringify(conflicts));
            await this.showConflictResolutionUI(conflicts);
        } else {
            // No conflicts, apply changes directly
            this.hms.hospitalData = remoteData.hospitalData;
            this.hms.saveDataToStorage();
            this.hms.renderAllRegisters();
            this.hms.renderBeds();
            this.hms.updateDashboardStats();
        }
    }

    // Detect conflicts between local and remote data
    detectConflicts(localData, remoteData) {
        const conflicts = [];
        
        // Check for patient record conflicts
        localData.patients.forEach(localPatient => {
            const remotePatient = remoteData.patients.find(p => p.id === localPatient.id);
            if (remotePatient) {
                const localModified = new Date(localPatient.lastModified || 0);
                const remoteModified = new Date(remotePatient.lastModified || 0);
                
                if (Math.abs(localModified - remoteModified) > 1000) { // More than 1 second difference
                    if (JSON.stringify(localPatient) !== JSON.stringify(remotePatient)) {
                        conflicts.push({
                            type: 'patient',
                            id: localPatient.id,
                            localVersion: localPatient,
                            remoteVersion: remotePatient,
                            field: 'entire_record'
                        });
                    }
                }
            }
        });

        return conflicts;
    }

    // Show conflict resolution UI
    async showConflictResolutionUI(conflicts) {
        const modal = document.createElement('div');
        modal.className = 'modal sync-conflict-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔄 Sync Conflicts Detected</h3>
                </div>
                <div class="modal-body">
                    <p>The following conflicts were found during synchronization:</p>
                    <div class="conflicts-list">
                        ${conflicts.map((conflict, index) => `
                            <div class="conflict-item">
                                <h4>Patient: ${conflict.localVersion.patientName}</h4>
                                <div class="conflict-options">
                                    <div class="option local">
                                        <h5>Local Version (This Device)</h5>
                                        <p>Last modified: ${new Date(conflict.localVersion.lastModified || 0).toLocaleString()}</p>
                                        <button class="btn btn--primary" onclick="resolveConflict(${index}, 'local')">Use This Version</button>
                                    </div>
                                    <div class="option remote">
                                        <h5>Remote Version (Other Device)</h5>
                                        <p>Last modified: ${new Date(conflict.remoteVersion.lastModified || 0).toLocaleString()}</p>
                                        <button class="btn btn--secondary" onclick="resolveConflict(${index}, 'remote')">Use This Version</button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="conflict-actions">
                        <button class="btn btn--warning" onclick="resolveAllConflicts('local')">Use All Local</button>
                        <button class="btn btn--info" onclick="resolveAllConflicts('remote')">Use All Remote</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.classList.remove('hidden');
    }

    // Resolve individual conflict
    resolveConflict(conflictIndex, resolution) {
        const conflicts = JSON.parse(localStorage.getItem('ward22a_sync_conflicts'));
        const conflict = conflicts[conflictIndex];
        
        if (resolution === 'local') {
            // Keep local version, mark as resolved
            conflict.resolved = 'local';
        } else {
            // Use remote version
            const patientIndex = this.hms.hospitalData.patients.findIndex(p => p.id === conflict.id);
            if (patientIndex !== -1) {
                this.hms.hospitalData.patients[patientIndex] = conflict.remoteVersion;
            }
            conflict.resolved = 'remote';
        }
        
        // Update conflicts in storage
        localStorage.setItem('ward22a_sync_conflicts', JSON.stringify(conflicts));
        
        // Check if all conflicts are resolved
        if (conflicts.every(c => c.resolved)) {
            this.finalizeSyncAfterConflictResolution();
        }
    }

    // Finalize sync after all conflicts are resolved
    finalizeSyncAfterConflictResolution() {
        // Update UI
        this.hms.saveDataToStorage();
        this.hms.renderAllRegisters();
        this.hms.renderBeds();
        this.hms.updateDashboardStats();
        
        // Clear conflicts
        localStorage.removeItem('ward22a_sync_conflicts');
        
        // Close conflict modal
        const modal = document.querySelector('.sync-conflict-modal');
        if (modal) {
            modal.remove();
        }
        
        this.showSyncStatus('✅ Conflicts resolved, sync completed', 'success');
    }

    // Check for updates without full sync
    async checkForUpdates() {
        if (!this.cloudBackup.isSignedIn) return;
        
        try {
            const backupList = await this.cloudBackup.listBackups();
            if (backupList.success && backupList.backups.length > 0) {
                const latestBackup = backupList.backups[0];
                const lastSync = this.lastSyncTime ? new Date(this.lastSyncTime) : new Date(0);
                
                if (new Date(latestBackup.created) > lastSync) {
                    this.showUpdateAvailable();
                }
            }
        } catch (error) {
            console.error('Error checking for updates:', error);
        }
    }

    // Show update available notification
    showUpdateAvailable() {
        const notification = document.createElement('div');
        notification.className = 'sync-notification update-available';
        notification.innerHTML = `
            <div class="notification-content">
                <h4>🔄 Updates Available</h4>
                <p>Changes were made on another device. Sync to get the latest data.</p>
                <div class="notification-actions">
                    <button class="btn btn--primary" onclick="syncManager.performSync()">Sync Now</button>
                    <button class="btn btn--secondary" onclick="this.parentElement.parentElement.parentElement.remove()">Later</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 30000);
    }

    // Utility functions
    prepareSyncData() {
        return {
            hospitalData: this.hms.hospitalData,
            deviceId: this.deviceId,
            timestamp: new Date().toISOString(),
            version: this.getDataVersion()
        };
    }

    getDataVersion() {
        const dataString = JSON.stringify(this.hms.hospitalData);
        return this.calculateChecksum(dataString);
    }

    calculateChecksum(data) {
        const str = typeof data === 'string' ? data : JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    getEncryptionPassword() {
        // This should be securely obtained from user or derived from their credentials
        return prompt('Enter encryption password for cloud backup:') || 'default_hospital_password';
    }

    showSyncStatus(message, type) {
        // Update sync status in UI
        const syncStatus = document.getElementById('syncStatus');
        if (syncStatus) {
            syncStatus.textContent = message;
            syncStatus.className = `sync-status ${type}`;
        }
        
        // Also show as toast notification
        if (this.hms && this.hms.showToast) {
            this.hms.showToast(message, type);
        }
    }
}

// Conflict Resolution Helper
class ConflictResolver {
    constructor() {
        this.resolutionStrategies = {
            'timestamp': this.resolveByTimestamp,
            'user_choice': this.resolveByUserChoice,
            'merge': this.mergeChanges
        };
    }

    resolveByTimestamp(localData, remoteData) {
        const localTime = new Date(localData.lastModified || 0);
        const remoteTime = new Date(remoteData.lastModified || 0);
        
        return localTime > remoteTime ? localData : remoteData;
    }

    resolveByUserChoice(localData, remoteData, userChoice) {
        return userChoice === 'local' ? localData : remoteData;
    }

    mergeChanges(localData, remoteData) {
        // Implement intelligent merging logic
        // This is a simplified version - you'd want more sophisticated merging
        return { ...remoteData, ...localData };
    }
}