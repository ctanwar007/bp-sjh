// encryption.js - Real AES-256 Encryption for Patient Data
class DataEncryption {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
    }

    // Generate encryption key from password using PBKDF2
    async generateKey(password, salt) {
        const encoder = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );

        return window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode(salt),
                iterations: 100000, // 100k iterations for security
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: this.algorithm, length: this.keyLength },
            true,
            ['encrypt', 'decrypt']
        );
    }

    // Encrypt hospital data with AES-256-GCM
    async encryptData(data, password) {
        try {
            const salt = window.crypto.getRandomValues(new Uint8Array(16));
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const key = await this.generateKey(password, salt);
            
            const encoder = new TextEncoder();
            const encodedData = encoder.encode(JSON.stringify(data));
            
            const encryptedData = await window.crypto.subtle.encrypt(
                { name: this.algorithm, iv: iv },
                key,
                encodedData
            );

            // Combine salt + iv + encrypted data
            const result = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
            result.set(salt);
            result.set(iv, salt.length);
            result.set(new Uint8Array(encryptedData), salt.length + iv.length);
            
            // Return as base64 string
            return btoa(String.fromCharCode(...result));
        } catch (error) {
            throw new Error('Encryption failed: ' + error.message);
        }
    }

    // Decrypt hospital data
    async decryptData(encryptedBase64, password) {
        try {
            const encryptedArray = new Uint8Array(
                atob(encryptedBase64).split('').map(char => char.charCodeAt(0))
            );
            
            const salt = encryptedArray.slice(0, 16);
            const iv = encryptedArray.slice(16, 28);
            const data = encryptedArray.slice(28);
            
            const key = await this.generateKey(password, salt);
            
            const decryptedData = await window.crypto.subtle.decrypt(
                { name: this.algorithm, iv: iv },
                key,
                data
            );
            
            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decryptedData));
        } catch (error) {
            throw new Error('Decryption failed: Wrong password or corrupted data');
        }
    }

    // Generate secure backup filename
    generateBackupFilename() {
        const date = new Date().toISOString().split('T')[0];
        const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
        const random = Math.random().toString(36).substr(2, 5);
        return `Ward22A_Backup_${date}_${time}_${random}.hms`;
    }

    // Test encryption/decryption
    async testEncryption() {
        const testData = { test: "Hospital Management System", date: new Date().toISOString() };
        const password = "test_password_123";
        
        try {
            const encrypted = await this.encryptData(testData, password);
            const decrypted = await this.decryptData(encrypted, password);
            
            return JSON.stringify(testData) === JSON.stringify(decrypted);
        } catch (error) {
            console.error('Encryption test failed:', error);
            return false;
        }
    }
}

// Export for global use
window.DataEncryption = DataEncryption;
