// cloudBackup.js - Google Drive Backup Integration
class CloudBackup {
    constructor() {
        this.encryption = new DataEncryption();
        this.apiKey = 'YOUR_GOOGLE_API_KEY'; // Get from Google Cloud Console
        this.clientId = '786164300452-51e4gn1sdl6gdn5v3ricbf4p5iakhd7l.apps.googleusercontent.com';
        this.discoveryDoc = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
        this.scopes = 'https://www.googleapis.com/auth/drive.file';
        this.isInitialized = false;
        this.isSignedIn = false;
    }

    // Initialize Google Drive API
    async initializeGoogleDrive() {
        try {
            await gapi.load('auth2', () => {
                gapi.auth2.init({
                    client_id: this.clientId,
                    scope: this.scopes
                });
            });

            await gapi.load('client', async () => {
                await gapi.client.init({
                    apiKey: this.apiKey,
                    clientId: this.clientId,
                    discoveryDocs: [this.discoveryDoc],
                    scope: this.scopes
                });
                
                this.isInitialized = true;
                this.updateSignInStatus();
            });
        } catch (error) {
            console.error('Error initializing Google Drive:', error);
            throw error;
        }
    }

    // Check if user is signed in
    updateSignInStatus() {
        const authInstance = gapi.auth2.getAuthInstance();
        this.isSignedIn = authInstance.isSignedIn.get();
        
        // Update UI based on sign-in status
        this.updateUI();
    }

    // Sign in to Google
    async signIn() {
        if (!this.isInitialized) {
            await this.initializeGoogleDrive();
        }
        
        const authInstance = gapi.auth2.getAuthInstance();
        await authInstance.signIn();
        this.updateSignInStatus();
    }

    // Sign out from Google
    async signOut() {
        const authInstance = gapi.auth2.getAuthInstance();
        await authInstance.signOut();
        this.updateSignInStatus();
    }

    // Upload encrypted backup to Google Drive
    async uploadBackup(hospitalData, encryptionPassword) {
        if (!this.isSignedIn) {
            throw new Error('Please sign in to Google Drive first');
        }

        try {
            // Encrypt the hospital data
            const encryptedData = await this.encryption.encryptData(hospitalData, encryptionPassword);
            const filename = this.encryption.generateBackupFilename();
            
            // Create backup metadata
            const metadata = {
                'name': filename,
                'description': 'Ward 22A Hospital Management System Backup',
                'mimeType': 'application/octet-stream',
                'parents': [await this.getOrCreateBackupFolder()]
            };

            // Upload to Google Drive
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
            form.append('file', new Blob([encryptedData], {type: 'application/octet-stream'}));

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: new Headers({
                    'Authorization': `Bearer ${gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
                }),
                body: form
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Backup uploaded successfully:', result);
                return {
                    success: true,
                    fileId: result.id,
                    filename: filename,
                    uploadTime: new Date().toISOString()
                };
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Backup upload error:', error);
            return { success: false, error: error.message };
        }
    }

    // Download and decrypt backup from Google Drive
    async downloadBackup(fileId, encryptionPassword) {
        if (!this.isSignedIn) {
            throw new Error('Please sign in to Google Drive first');
        }

        try {
            const response = await gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });

            const encryptedData = response.body;
            const decryptedData = await this.encryption.decryptData(encryptedData, encryptionPassword);
            
            return {
                success: true,
                data: decryptedData,
                downloadTime: new Date().toISOString()
            };
        } catch (error) {
            console.error('Backup download error:', error);
            return { success: false, error: error.message };
        }
    }

    // List all backups from Google Drive
    async listBackups() {
        if (!this.isSignedIn) {
            return { success: false, error: 'Not signed in' };
        }

        try {
            const response = await gapi.client.drive.files.list({
                q: "name contains 'Ward22A_Backup_' and mimeType='application/octet-stream'",
                orderBy: 'createdTime desc',
                fields: 'files(id,name,createdTime,size)'
            });

            return {
                success: true,
                backups: response.result.files.map(file => ({
                    id: file.id,
                    name: file.name,
                    created: new Date(file.createdTime).toLocaleString(),
                    size: this.formatFileSize(file.size)
                }))
            };
        } catch (error) {
            console.error('Error listing backups:', error);
            return { success: false, error: error.message };
        }
    }

    // Get or create backup folder
    async getOrCreateBackupFolder() {
        const folderName = 'Ward22A_Backups';
        
        // Check if folder exists
        const response = await gapi.client.drive.files.list({
            q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
            fields: 'files(id, name)'
        });

        if (response.result.files.length > 0) {
            return response.result.files[0].id;
        }

        // Create folder if it doesn't exist
        const folderMetadata = {
            'name': folderName,
            'mimeType': 'application/vnd.google-apps.folder'
        };

        const folderResponse = await gapi.client.drive.files.create({
            resource: folderMetadata
        });

        return folderResponse.result.id;
    }

    // Auto backup every 24 hours
    setupAutoBackup(hospitalData, encryptionPassword) {
        const autoBackupInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        setInterval(async () => {
            if (this.isSignedIn) {
                try {
                    const result = await this.uploadBackup(hospitalData, encryptionPassword);
                    if (result.success) {
                        console.log('Auto backup completed:', result.filename);
                        this.showNotification('✅ Auto backup completed successfully', 'success');
                    } else {
                        console.error('Auto backup failed:', result.error);
                        this.showNotification('❌ Auto backup failed', 'error');
                    }
                } catch (error) {
                    console.error('Auto backup error:', error);
                }
            }
        }, autoBackupInterval);
    }

    // Format file size for display
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Update UI based on sign-in status
    updateUI() {
        const signInBtn = document.getElementById('googleSignInBtn');
        const signOutBtn = document.getElementById('googleSignOutBtn');
        const backupBtn = document.getElementById('cloudBackupBtn');
        const restoreBtn = document.getElementById('cloudRestoreBtn');

        if (this.isSignedIn) {
            if (signInBtn) signInBtn.style.display = 'none';
            if (signOutBtn) signOutBtn.style.display = 'inline-block';
            if (backupBtn) backupBtn.disabled = false;
            if (restoreBtn) restoreBtn.disabled = false;
        } else {
            if (signInBtn) signInBtn.style.display = 'inline-block';
            if (signOutBtn) signOutBtn.style.display = 'none';
            if (backupBtn) backupBtn.disabled = true;
            if (restoreBtn) restoreBtn.disabled = true;
        }
    }

    // Show notification to user
    showNotification(message, type) {
        // This should integrate with your existing toast notification system
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// OneDrive Integration Alternative
class OneDriveBackup {
    constructor() {
        this.encryption = new DataEncryption();
        this.clientId = 'YOUR_ONEDRIVE_CLIENT_ID';
        this.redirectUri = window.location.origin;
        this.scopes = ['files.readwrite'];
        this.accessToken = null;
    }

    // Authenticate with OneDrive
    async authenticate() {
        const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
            `client_id=${this.clientId}&` +
            `response_type=token&` +
            `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
            `scope=${this.scopes.join('%20')}&` +
            `response_mode=fragment`;

        window.location.href = authUrl;
    }

    // Upload to OneDrive
    async uploadBackup(hospitalData, encryptionPassword) {
        if (!this.accessToken) {
            throw new Error('Please authenticate with OneDrive first');
        }

        const encryptedData = await this.encryption.encryptData(hospitalData, encryptionPassword);
        const filename = this.encryption.generateBackupFilename();

        const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:/${filename}:/content`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/octet-stream'
            },
            body: encryptedData
        });

        if (response.ok) {
            const result = await response.json();
            return { success: true, fileId: result.id, filename: filename };
        } else {
            throw new Error('OneDrive upload failed');
        }
    }
}
// In cloudBackup.js, update these lines:
constructor() {
    this.encryption = new DataEncryption();
    this.apiKey = 'YOUR_API_KEY_HERE'; // Paste your API key
    this.clientId = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com'; // Paste your Client ID
    this.discoveryDoc = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
    this.scopes = 'https://www.googleapis.com/auth/drive.file';
    this.redirectUri = window.location.origin; // This will be http://localhost:8000
}
