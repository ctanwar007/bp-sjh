// versionControl.js - Version Control for Patient Records
class VersionControl {
    constructor() {
        this.versions = new Map();
        this.maxVersionsPerRecord = 50; // Keep last 50 versions
        this.compressionEnabled = true;
    }

    // Save a new version of a record
    saveVersion(recordId, recordType, data, userId = 'system') {
        const versionKey = `${recordType}_${recordId}`;
        
        if (!this.versions.has(versionKey)) {
            this.versions.set(versionKey, []);
        }
        
        const versions = this.versions.get(versionKey);
        
        // Create version entry
        const version = {
            id: this.generateVersionId(),
            timestamp: new Date().toISOString(),
            userId: userId,
            data: this.compressionEnabled ? this.compressData(data) : data,
            compressed: this.compressionEnabled,
            changes: versions.length > 0 ? this.calculateChanges(versions[versions.length - 1].data, data) : [],
            hash: this.calculateHash(data)
        };
        
        versions.push(version);
        
        // Keep only the latest versions
        if (versions.length > this.maxVersionsPerRecord) {
            versions.shift(); // Remove oldest version
        }
        
        // Save to localStorage
        this.saveVersionsToStorage();
        
        return version.id;
    }

    // Get all versions of a record
    getVersionHistory(recordId, recordType) {
        const versionKey = `${recordType}_${recordId}`;
        const versions = this.versions.get(versionKey) || [];
        
        return versions.map(version => ({
            id: version.id,
            timestamp: version.timestamp,
            userId: version.userId,
            changes: version.changes,
            hash: version.hash
        }));
    }

    // Restore a specific version
    restoreVersion(recordId, recordType, versionId) {
        const versionKey = `${recordType}_${recordId}`;
        const versions = this.versions.get(versionKey) || [];
        
        const version = versions.find(v => v.id === versionId);
        if (!version) {
            throw new Error('Version not found');
        }
        
        let data = version.data;
        if (version.compressed) {
            data = this.decompressData(data);
        }
        
        return data;
    }

    // Compare two versions
    compareVersions(recordId, recordType, versionId1, versionId2) {
        const data1 = this.restoreVersion(recordId, recordType, versionId1);
        const data2 = this.restoreVersion(recordId, recordType, versionId2);
        
        return this.calculateChanges(data1, data2);
    }

    // Calculate changes between two versions
    calculateChanges(oldData, newData) {
        const changes = [];
        
        // Deep comparison of objects
        this.deepCompare(oldData, newData, '', changes);
        
        return changes;
    }

    // Deep comparison helper
    deepCompare(obj1, obj2, path, changes) {
        const keys1 = Object.keys(obj1 || {});
        const keys2 = Object.keys(obj2 || {});
        const allKeys = new Set([...keys1, ...keys2]);
        
        for (const key of allKeys) {
            const currentPath = path ? `${path}.${key}` : key;
            const val1 = obj1 ? obj1[key] : undefined;
            const val2 = obj2 ? obj2[key] : undefined;
            
            if (val1 === undefined && val2 !== undefined) {
                changes.push({
                    type: 'added',
                    path: currentPath,
                    newValue: val2
                });
            } else if (val1 !== undefined && val2 === undefined) {
                changes.push({
                    type: 'removed',
                    path: currentPath,
                    oldValue: val1
                });
            } else if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
                this.deepCompare(val1, val2, currentPath, changes);
            } else if (val1 !== val2) {
                changes.push({
                    type: 'modified',
                    path: currentPath,
                    oldValue: val1,
                    newValue: val2
                });
            }
        }
    }

    // Generate unique version ID
    generateVersionId() {
        return 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Calculate hash for data integrity
    calculateHash(data) {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    // Compress data to save storage space
    compressData(data) {
        try {
            // Simple compression using JSON stringify and base64
            const jsonString = JSON.stringify(data);
            return btoa(unescape(encodeURIComponent(jsonString)));
        } catch (error) {
            console.warn('Compression failed, storing uncompressed:', error);
            return data;
        }
    }

    // Decompress data
    decompressData(compressedData) {
        try {
            if (typeof compressedData === 'string') {
                const jsonString = decodeURIComponent(escape(atob(compressedData)));
                return JSON.parse(jsonString);
            }
            return compressedData;
        } catch (error) {
            console.warn('Decompression failed, returning as-is:', error);
            return compressedData;
        }
    }

    // Save versions to localStorage
    saveVersionsToStorage() {
        try {
            const versionsData = {};
            for (const [key, versions] of this.versions.entries()) {
                versionsData[key] = versions;
            }
            localStorage.setItem('ward22a_versions', JSON.stringify(versionsData));
        } catch (error) {
            console.error('Failed to save versions to storage:', error);
        }
    }

    // Load versions from localStorage
    loadVersionsFromStorage() {
        try {
            const versionsData = localStorage.getItem('ward22a_versions');
            if (versionsData) {
                const parsed = JSON.parse(versionsData);
                this.versions = new Map(Object.entries(parsed));
            }
        } catch (error) {
            console.error('Failed to load versions from storage:', error);
        }
    }

    // Clean up old versions (garbage collection)
    cleanupOldVersions(olderThanDays = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        
        let cleanedCount = 0;
        
        for (const [key, versions] of this.versions.entries()) {
            const filteredVersions = versions.filter(version => {
                const versionDate = new Date(version.timestamp);
                return versionDate > cutoffDate;
            });
            
            if (filteredVersions.length !== versions.length) {
                cleanedCount += versions.length - filteredVersions.length;
                this.versions.set(key, filteredVersions);
            }
        }
        
        if (cleanedCount > 0) {
            this.saveVersionsToStorage();
            console.log(`Cleaned up ${cleanedCount} old versions`);
        }
        
        return cleanedCount;
    }

    // Get version statistics
    getVersionStats() {
        let totalVersions = 0;
        let totalRecords = 0;
        let storageSize = 0;
        
        for (const [key, versions] of this.versions.entries()) {
            totalRecords++;
            totalVersions += versions.length;
            
            // Estimate storage size
            const dataSize = JSON.stringify(versions).length;
            storageSize += dataSize;
        }
        
        return {
            totalRecords,
            totalVersions,
            averageVersionsPerRecord: totalRecords > 0 ? Math.round(totalVersions / totalRecords) : 0,
            estimatedStorageSize: this.formatStorageSize(storageSize)
        };
    }

    // Format storage size for display
    formatStorageSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Export version history
    exportVersionHistory(recordId, recordType) {
        const versions = this.getVersionHistory(recordId, recordType);
        const exportData = {
            recordId,
            recordType,
            exportDate: new Date().toISOString(),
            versions: versions
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `version_history_${recordType}_${recordId}.json`;
        link.click();
    }

    // Initialize version control
    initialize() {
        this.loadVersionsFromStorage();
        
        // Setup periodic cleanup
        setInterval(() => {
            this.cleanupOldVersions();
        }, 24 * 60 * 60 * 1000); // Run daily
    }
}

// Integration with Hospital Management System
class VersionControlledHMS extends HospitalManagementSystem {
    constructor() {
        super();
        this.versionControl = new VersionControl();
        this.versionControl.initialize();
    }

    // Override patient update methods to include versioning
    updatePatient(patientId, newData, userId = 'admin') {
        // Save current version before updating
        const currentPatient = this.hospitalData.patients.find(p => p.id === patientId);
        if (currentPatient) {
            this.versionControl.saveVersion(patientId, 'patient', currentPatient, userId);
        }
        
        // Perform the update
        const patientIndex = this.hospitalData.patients.findIndex(p => p.id === patientId);
        if (patientIndex !== -1) {
            this.hospitalData.patients[patientIndex] = { ...newData, lastModified: new Date().toISOString() };
            this.saveDataToStorage();
            return true;
        }
        return false;
    }

    // Show version history for a patient
    showPatientVersionHistory(patientId) {
        const versions = this.versionControl.getVersionHistory(patientId, 'patient');
        
        const modal = document.createElement('div');
        modal.className = 'modal version-history-modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>📚 Version History - Patient ${patientId}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="version-list">
                        ${versions.map((version, index) => `
                            <div class="version-item">
                                <div class="version-header">
                                    <span class="version-date">${new Date(version.timestamp).toLocaleString()}</span>
                                    <span class="version-user">by ${version.userId}</span>
                                    <div class="version-actions">
                                        <button class="btn btn--sm btn--secondary" onclick="this.viewVersion('${patientId}', '${version.id}')">View</button>
                                        <button class="btn btn--sm btn--warning" onclick="this.restoreVersion('${patientId}', '${version.id}')">Restore</button>
                                    </div>
                                </div>
                                <div class="version-changes">
                                    ${version.changes.length > 0 ? 
                                        version.changes.map(change => `
                                            <div class="change-item ${change.type}">
                                                <strong>${change.type}:</strong> ${change.path}
                                                ${change.oldValue ? `<br>From: ${JSON.stringify(change.oldValue)}` : ''}
                                                ${change.newValue ? `<br>To: ${JSON.stringify(change.newValue)}` : ''}
                                            </div>
                                        `).join('') : 
                                        '<div class="no-changes">Initial version</div>'
                                    }
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.classList.remove('hidden');
    }

    // Restore a specific version
    restorePatientVersion(patientId, versionId) {
        if (confirm('Are you sure you want to restore this version? Current changes will be lost.')) {
            try {
                const restoredData = this.versionControl.restoreVersion(patientId, 'patient', versionId);
                this.updatePatient(patientId, restoredData, 'admin_restore');
                this.showToast('Version restored successfully', 'success');
                
                // Refresh UI
                this.renderAllRegisters();
                this.renderBeds();
            } catch (error) {
                this.showToast('Failed to restore version', 'error');
                console.error('Version restore error:', error);
            }
        }
    }
}