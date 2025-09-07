// encryption.js - Secure Patient Data Encryption
class DataEncryption {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
    }

    // Generate encryption key from password
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
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: this.algorithm, length: this.keyLength },
            true,
            ['encrypt', 'decrypt']
        );
    }

    // Encrypt hospital data
    async encryptData(data, password) {
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

        // Combine salt, iv, and encrypted data
        const result = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
        result.set(salt);
        result.set(iv, salt.length);
        result.set(new Uint8Array(encryptedData), salt.length + iv.length);
        
        return btoa(String.fromCharCode(...result));
    }

    // Decrypt hospital data
    async decryptData(encryptedBase64, password) {
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
    }

    // Generate secure backup filename
    generateBackupFilename() {
        const date = new Date().toISOString().split('T')[0];
        const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
        return `Ward22A_Backup_${date}_${time}.hms`;
    }
}