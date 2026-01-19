class CloudBackup {
    constructor() {
        this.folderName = 'Ward22A_Backups';
        this.discoveryDoc = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
        this.scopes = 'https://www.googleapis.com/auth/drive.file';
        this.authInstance = null;
        this.isSignedIn = false;
        this.encryption = window.DataEncryption ? new DataEncryption() : null;
    }

    async ensureGapiLoaded() {
        if (window.gapi) {
            return;
        }

        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Google API script'));
            document.head.appendChild(script);
        });
    }

    getConfig() {
        const stored = localStorage.getItem('ward22a_cloud_config');
        if (!stored) {
            throw new Error('Cloud backup not configured');
        }
        const config = JSON.parse(stored);
        if (!config.apiKey || !config.clientId) {
            throw new Error('Cloud backup API key or client ID missing');
        }
        return config;
    }

    async initializeGoogleDrive() {
        await this.ensureGapiLoaded();
        const config = this.getConfig();

        await new Promise((resolve, reject) => {
            gapi.load('client:auth2', () => {
                gapi.client.init({
                    apiKey: config.apiKey,
                    clientId: config.clientId,
                    discoveryDocs: [this.discoveryDoc],
                    scope: this.scopes,
                    prompt: 'consent'
                }).then(resolve).catch(reject);
            });
        });

        this.authInstance = gapi.auth2.getAuthInstance();
        this.isSignedIn = this.authInstance.isSignedIn.get();
        this.authInstance.isSignedIn.listen((signedIn) => {
            this.isSignedIn = signedIn;
        });
    }

    async signIn() {
        if (!this.authInstance) {
            await this.initializeGoogleDrive();
        }
        await this.authInstance.signIn();
        this.isSignedIn = true;
    }

    async signOut() {
        if (!this.authInstance) {
            await this.initializeGoogleDrive();
        }
        await this.authInstance.signOut();
        this.isSignedIn = false;
    }

    async ensureBackupFolder() {
        const response = await gapi.client.drive.files.list({
            q: `name='${this.folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)'
        });

        if (response.result.files && response.result.files.length > 0) {
            return response.result.files[0].id;
        }

        const createResponse = await gapi.client.drive.files.create({
            resource: {
                name: this.folderName,
                mimeType: 'application/vnd.google-apps.folder'
            },
            fields: 'id'
        });

        return createResponse.result.id;
    }

    formatBytes(bytes) {
        if (!bytes) return '0 Bytes';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }

    async uploadBackup(data, encryptionPassword) {
        if (!this.encryption) {
            throw new Error('Encryption system not available');
        }

        const folderId = await this.ensureBackupFolder();
        const payload = {
            hospitalData: data,
            metadata: {
                exportDate: new Date().toISOString(),
                deviceId: localStorage.getItem('ward22a_device_id') || 'unknown'
            }
        };

        const encrypted = await this.encryption.encryptData(payload, encryptionPassword);
        const filename = this.encryption.generateBackupFilename();

        const response = await gapi.client.drive.files.create({
            resource: {
                name: filename,
                parents: [folderId]
            },
            media: {
                mimeType: 'text/plain',
                body: encrypted
            },
            fields: 'id, name, size'
        });

        return {
            success: true,
            fileId: response.result.id,
            filename: response.result.name,
            size: this.formatBytes(parseInt(response.result.size || '0', 10))
        };
    }

    async listBackups() {
        const folderId = await this.ensureBackupFolder();
        const response = await gapi.client.drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, createdTime, modifiedTime, size, description)',
            orderBy: 'modifiedTime desc'
        });

        const backups = (response.result.files || []).map((file) => ({
            id: file.id,
            name: file.name,
            created: file.modifiedTime || file.createdTime,
            size: this.formatBytes(parseInt(file.size || '0', 10)),
            description: file.description || 'Encrypted backup'
        }));

        return {
            success: true,
            backups
        };
    }

    async downloadBackup(fileId, encryptionPassword) {
        if (!this.encryption) {
            throw new Error('Encryption system not available');
        }

        const response = await gapi.client.drive.files.get({
            fileId,
            alt: 'media'
        });

        const decrypted = await this.encryption.decryptData(response.body, encryptionPassword);
        return {
            success: true,
            data: decrypted
        };
    }

    async deleteBackup(fileId) {
        await gapi.client.drive.files.delete({ fileId });
        return { success: true };
    }

    setupAutoBackup(hours = 24) {
        const intervalMs = hours * 60 * 60 * 1000;
        setInterval(() => {
            if (!this.isSignedIn) return;
            const config = JSON.parse(localStorage.getItem('ward22a_cloud_config') || '{}');
            const password = config.encryptionPassword;
            if (!password || !window.hms) return;
            this.uploadBackup(window.hms.hospitalData, password).catch((error) => {
                console.error('Auto backup failed:', error);
            });
        }, intervalMs);
    }
}

window.CloudBackup = CloudBackup;
