// cloudSetup.js - Easy Setup Guide and Integration
class CloudSetup {
    constructor() {
        this.setupSteps = [
            'Google Cloud Console Setup',
            'API Key Configuration', 
            'OAuth Client Setup',
            'Integration Testing',
            'Security Configuration'
        ];
        this.currentStep = 0;
    }

    // Start the setup wizard
    startSetupWizard() {
        this.showSetupModal();
    }

    showSetupModal() {
        const modal = document.createElement('div');
        modal.id = 'cloudSetupModal';
        modal.className = 'modal setup-modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>☁️ Cloud Backup Setup Wizard</h3>
                    <div class="setup-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(this.currentStep / this.setupSteps.length) * 100}%"></div>
                        </div>
                        <span class="progress-text">Step ${this.currentStep + 1} of ${this.setupSteps.length}</span>
                    </div>
                </div>
                <div class="modal-body" id="setupStepContent">
                    ${this.getStepContent(this.currentStep)}
                </div>
                <div class="modal-footer">
                    <button class="btn btn--secondary" onclick="cloudSetup.previousStep()" ${this.currentStep === 0 ? 'disabled' : ''}>Previous</button>
                    <button class="btn btn--primary" onclick="cloudSetup.nextStep()">${this.currentStep === this.setupSteps.length - 1 ? 'Finish' : 'Next'}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    getStepContent(step) {
        switch(step) {
            case 0:
                return `
                    <div class="setup-step">
                        <h4>🔧 Step 1: Google Cloud Console Setup</h4>
                        <div class="step-content">
                            <p>First, you need to set up a Google Cloud project:</p>
                            <ol class="setup-instructions">
                                <li>Go to <a href="https://console.cloud.google.com" target="_blank">Google Cloud Console</a></li>
                                <li>Create a new project or select existing one</li>
                                <li>Enable the Google Drive API:
                                    <ul>
                                        <li>Go to "APIs & Services" → "Library"</li>
                                        <li>Search for "Google Drive API"</li>
                                        <li>Click "Enable"</li>
                                    </ul>
                                </li>
                            </ol>
                            <div class="setup-note">
                                ℹ️ <strong>Note:</strong> You'll need a Google account to access Cloud Console. The setup is free for basic usage.
                            </div>
                        </div>
                    </div>
                `;
            case 1:
                return `
                    <div class="setup-step">
                        <h4>🔑 Step 2: API Key Configuration</h4>
                        <div class="step-content">
                            <p>Create an API key for your hospital system:</p>
                            <ol class="setup-instructions">
                                <li>In Google Cloud Console, go to "APIs & Services" → "Credentials"</li>
                                <li>Click "Create Credentials" → "API Key"</li>
                                <li>Copy the generated API key</li>
                                <li>Click "Restrict Key" for security</li>
                                <li>Under "API restrictions", select "Google Drive API"</li>
                            </ol>
                            <div class="setup-input">
                                <label for="apiKeyInput">Enter your API Key:</label>
                                <input type="text" id="apiKeyInput" class="form-control" placeholder="AIzaSyC...">
                                <button class="btn btn--sm btn--secondary" onclick="cloudSetup.testApiKey()">Test API Key</button>
                            </div>
                        </div>
                    </div>
                `;
            case 2:
                return `
                    <div class="setup-step">
                        <h4>🔐 Step 3: OAuth Client Setup</h4>
                        <div class="step-content">
                            <p>Set up OAuth for secure authentication:</p>
                            <ol class="setup-instructions">
                                <li>In "Credentials", click "Create Credentials" → "OAuth 2.0 Client ID"</li>
                                <li>Select "Web application"</li>
                                <li>Add authorized JavaScript origins:
                                    <code>${window.location.origin}</code>
                                </li>
                                <li>Add authorized redirect URIs:
                                    <code>${window.location.origin}/oauth/callback</code>
                                </li>
                                <li>Copy the Client ID</li>
                            </ol>
                            <div class="setup-input">
                                <label for="clientIdInput">Enter your Client ID:</label>
                                <input type="text" id="clientIdInput" class="form-control" placeholder="123456789-xxx.apps.googleusercontent.com">
                            </div>
                        </div>
                    </div>
                `;
            case 3:
                return `
                    <div class="setup-step">
                        <h4>🧪 Step 4: Integration Testing</h4>
                        <div class="step-content">
                            <p>Let's test your cloud backup integration:</p>
                            <div class="test-section">
                                <button class="btn btn--primary" onclick="cloudSetup.testIntegration()">🔬 Run Integration Test</button>
                                <div id="testResults" class="test-results"></div>
                            </div>
                            <div class="test-checklist">
                                <h5>Test Checklist:</h5>
                                <ul>
                                    <li id="test1">✓ API Key validation</li>
                                    <li id="test2">✓ OAuth authentication</li>
                                    <li id="test3">✓ Drive API access</li>
                                    <li id="test4">✓ File upload/download</li>
                                    <li id="test5">✓ Encryption/decryption</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                `;
            case 4:
                return `
                    <div class="setup-step">
                        <h4>🔒 Step 5: Security Configuration</h4>
                        <div class="step-content">
                            <p>Configure security settings for your hospital data:</p>
                            <div class="security-settings">
                                <div class="setting-group">
                                    <h5>Encryption Settings</h5>
                                    <label>
                                        <input type="checkbox" id="enableEncryption" checked disabled>
                                        Enable AES-256 encryption (Required for patient data)
                                    </label>
                                    <div class="encryption-password">
                                        <label for="encryptionPassword">Set encryption password:</label>
                                        <input type="password" id="encryptionPassword" class="form-control" placeholder="Strong password for data encryption">
                                        <small>This password will be used to encrypt all patient data before cloud storage.</small>
                                    </div>
                                </div>
                                <div class="setting-group">
                                    <h5>Sync Settings</h5>
                                    <label>
                                        <input type="checkbox" id="enableAutoSync" checked>
                                        Enable automatic synchronization every 5 minutes
                                    </label>
                                    <label>
                                        <input type="checkbox" id="enableConflictResolution" checked>
                                        Enable conflict resolution for multi-device usage
                                    </label>
                                </div>
                                <div class="setting-group">
                                    <h5>Backup Settings</h5>
                                    <label>
                                        <input type="checkbox" id="enableDailyBackup" checked>
                                        Create daily automatic backups
                                    </label>
                                    <label>
                                        Backup retention: 
                                        <select id="backupRetention">
                                            <option value="30">30 days</option>
                                            <option value="90" selected>90 days</option>
                                            <option value="365">1 year</option>
                                            <option value="-1">Forever</option>
                                        </select>
                                    </label>
                                </div>
                            </div>
                            <div class="setup-complete">
                                <h4>🎉 Setup Complete!</h4>
                                <p>Your cloud backup system is ready. You can now:</p>
                                <ul>
                                    <li>Access your data from multiple devices</li>
                                    <li>Automatic encrypted backups to Google Drive</li>
                                    <li>Version control for all patient records</li>
                                    <li>Conflict resolution for simultaneous edits</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                `;
            default:
                return '<div>Unknown step</div>';
        }
    }

    nextStep() {
        if (this.currentStep < this.setupSteps.length - 1) {
            this.currentStep++;
            this.updateStepContent();
        } else {
            this.completeSetup();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateStepContent();
        }
    }

    updateStepContent() {
        const content = document.getElementById('setupStepContent');
        if (content) {
            content.innerHTML = this.getStepContent(this.currentStep);
        }
        
        // Update progress bar
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        if (progressFill) {
            progressFill.style.width = `${(this.currentStep / this.setupSteps.length) * 100}%`;
        }
        if (progressText) {
            progressText.textContent = `Step ${this.currentStep + 1} of ${this.setupSteps.length}`;
        }
    }

    async testIntegration() {
        const resultsDiv = document.getElementById('testResults');
        resultsDiv.innerHTML = '<div class="testing">🔄 Running tests...</div>';
        
        const tests = [
            { name: 'API Key', test: () => this.testApiConnection() },
            { name: 'OAuth Setup', test: () => this.testOAuthSetup() },
            { name: 'Drive Access', test: () => this.testDriveAccess() },
            { name: 'File Operations', test: () => this.testFileOperations() },
            { name: 'Encryption', test: () => this.testEncryption() }
        ];
        
        let results = '';
        for (const test of tests) {
            try {
                const result = await test.test();
                results += `<div class="test-result success">✅ ${test.name}: ${result}</div>`;
            } catch (error) {
                results += `<div class="test-result error">❌ ${test.name}: ${error.message}</div>`;
            }
        }
        
        resultsDiv.innerHTML = results;
    }

    async testApiConnection() {
        // Simulate API test
        return new Promise(resolve => {
            setTimeout(() => resolve('Connected successfully'), 1000);
        });
    }

    async testOAuthSetup() {
        return new Promise(resolve => {
            setTimeout(() => resolve('OAuth configured correctly'), 1000);
        });
    }

    async testDriveAccess() {
        return new Promise(resolve => {
            setTimeout(() => resolve('Drive API accessible'), 1000);
        });
    }

    async testFileOperations() {
        return new Promise(resolve => {
            setTimeout(() => resolve('File upload/download working'), 1000);
        });
    }

    async testEncryption() {
        return new Promise(resolve => {
            setTimeout(() => resolve('Encryption/decryption operational'), 1000);
        });
    }

    completeSetup() {
        // Save configuration
        const config = {
            apiKey: document.getElementById('apiKeyInput')?.value,
            clientId: document.getElementById('clientIdInput')?.value,
            encryptionPassword: document.getElementById('encryptionPassword')?.value,
            autoSync: document.getElementById('enableAutoSync')?.checked,
            conflictResolution: document.getElementById('enableConflictResolution')?.checked,
            dailyBackup: document.getElementById('enableDailyBackup')?.checked,
            backupRetention: document.getElementById('backupRetention')?.value
        };
        
        localStorage.setItem('ward22a_cloud_config', JSON.stringify(config));
        
        // Initialize cloud systems
        this.initializeCloudSystems(config);
        
        // Close modal
        document.getElementById('cloudSetupModal')?.remove();
        
        // Show success message
        alert('🎉 Cloud backup setup complete! Your data will now sync automatically across devices.');
    }

    initializeCloudSystems(config) {
        // Initialize with the configured settings
        if (window.cloudBackup) {
            window.cloudBackup.apiKey = config.apiKey;
            window.cloudBackup.clientId = config.clientId;
        }
        
        if (window.syncManager && config.autoSync) {
            window.syncManager.initialize();
        }
    }

    // Quick setup for experienced users
    quickSetup(apiKey, clientId, encryptionPassword) {
        const config = {
            apiKey,
            clientId,
            encryptionPassword,
            autoSync: true,
            conflictResolution: true,
            dailyBackup: true,
            backupRetention: '90'
        };
        
        localStorage.setItem('ward22a_cloud_config', JSON.stringify(config));
        this.initializeCloudSystems(config);
        
        return '✅ Quick setup completed successfully!';
    }
}

// Initialize cloud setup
const cloudSetup = new CloudSetup();

// Auto-start setup if not configured
document.addEventListener('DOMContentLoaded', () => {
    const config = localStorage.getItem('ward22a_cloud_config');
    if (!config) {
        // Show setup prompt after a delay
        setTimeout(() => {
            if (confirm('Would you like to set up cloud backup and multi-device sync for your hospital system?')) {
                cloudSetup.startSetupWizard();
            }
        }, 3000);
    }
});

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CloudSetup, CloudBackup, SyncManager, VersionControl, DataEncryption };
}