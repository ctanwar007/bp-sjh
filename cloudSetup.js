class CloudSetup {
  constructor() {
    this.apiKey = ''; // To be set during setup
    this.clientId = '786164300452-51e4gn1sdl6gdn5v3ricbf4p5iakhd7l.apps.googleusercontent.com'; // To be set during setup
    this.discoveryDoc = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
    this.scopes = 'https://www.googleapis.com/auth/drive.file';
    this.redirectUri = 'https://bp-sjh.netlify.app/'; // Will be set dynamically based on deployment
    this.authInstance = null;
  }

  // Initialize the Google API client with credentials
  async initializeClient() {
    await gapi.load('client:auth2', () => {
      gapi.client.init({
        apiKey: this.apiKey,
        clientId: this.clientId,
        discoveryDocs: [this.discoveryDoc],
        scope: this.scopes,
        prompt: 'consent'
      }).then(() => {
        this.authInstance = gapi.auth2.getAuthInstance();
      });
    });
  }

  // Sign in to Google Drive
  async signIn() {
    if (!this.authInstance) await this.initializeClient();
    try {
      const user = await this.authInstance.signIn();
      console.log('Signed in as', user.getBasicProfile().getEmail());
      document.dispatchEvent(new CustomEvent('cloudSignedIn'));
      // Enable backup buttons
      document.getElementById('cloudBackupBtn').disabled = false;
      document.getElementById('googleSignInBtn').style.display='none';
      document.getElementById('googleSignOutBtn').style.display='';
    } catch (err) {
      console.error('Error during sign-in', err);
    }
  }

  // Sign out from Google Drive
  async signOut() {
    if (!this.authInstance) await this.initializeClient();
    try {
      await this.authInstance.signOut();
      console.log('Signed out');
      // Disable backup buttons
      document.getElementById('cloudBackupBtn').disabled = true;
      document.getElementById('googleSignInBtn').style.display='';
      document.getElementById('googleSignOutBtn').style.display='none';
    } catch (err) {
      console.error('Error during sign-out', err);
    }
  }

  // List existing backups in Drive folder (you can extend this)
  async listBackups() {
    const folderName = 'Ward22A_Backups';
    const response = await gapi.client.drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });
    if (response.result.files && response.result.files.length > 0) {
      return { success: true, backups: response.result.files };
    } else {
      return { success: false, error: 'No backup folder found' };
    }
  }

  // Ensure the Backup Folder exists or create it
  async ensureBackupFolder() {
    const folderName = 'Ward22A_Backups';
    // Check if folder exists
    const response = await gapi.client.drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });
    if (response.result.files && response.result.files.length > 0) {
      return response.result.files[0].id; // Folder exists
    } else {
      // Create folder
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      };
      const createResponse = await gapi.client.drive.files.create({
        resource: fileMetadata,
        fields: 'id'
      });
      return createResponse.result.id;
    }
  }

  // Upload backup data (encrypted JSON)
  async uploadBackup(dataString, encryptionPassword) {
    try {
      const folderId = await this.ensureBackupFolder();
      const filename = `backup_${new Date().toISOString()}.json`;
      const media = {
        mimeType: 'application/json',
        body: dataString
      };
      const response = await gapi.client.drive.files.create({
        resource: {
          name: filename,
          parents: [folderId]
        },
        media: media,
        fields: 'id'
      });
      return { success: true, fileId: response.result.id };
    } catch (err) {
      console.error('Upload error:', err);
      return { success: false, error: err.message };
    }
  }

  // Download specific backup file (by filename or ID)
  async downloadBackup(fileId) {
    const response = await gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media'
    });
    return response.body; // Blob or JSON string
  }
}

// Usage must include setting apiKey, clientId, and redirectUri
// Example:
const cloudSetup = new CloudSetup();
// Set your API credentials for your project
// cloudSetup.apiKey = 'YOUR_API_KEY';
// cloudSetup.clientId = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
// cloudSetup.redirectUri = 'https://<your-deployment-url>';

export { CloudSetup };
