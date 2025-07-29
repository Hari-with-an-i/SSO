class GoogleDriveManager {
            constructor() {
                this.accessToken = null;
                this.folderIds = null;
                this.tokenClient = null;
            }

            silentConnect() {
                return new Promise((resolve) => {
                    try {
                        this.tokenClient = google.accounts.oauth2.initTokenClient({
                            client_id: '445345031564-qi3unbtf1ube5eo38qitdeud0vhpur0q.apps.googleusercontent.com',
                            scope: 'https://www.googleapis.com/auth/drive.file',
                            callback: async (tokenResponse) => {
                                if (tokenResponse && tokenResponse.access_token) {
                                    this.accessToken = tokenResponse.access_token;
                                    await this.loadFolderIds();
                                    resolve(true);
                                } else {
                                    resolve(false);
                                }
                            },
                        });
                        this.tokenClient.requestAccessToken({ prompt: '' });
                    } catch (error) {
                        console.error("GSI client init failed for silent connect:", error);
                        resolve(false);
                    }
                });
            }

            connectDrive() {
                return new Promise((resolve, reject) => {
                    try {
                        this.tokenClient = google.accounts.oauth2.initTokenClient({
                            client_id: '445345031564-qi3unbtf1ube5eo38qitdeud0vhpur0q.apps.googleusercontent.com',
                            scope: 'https://www.googleapis.com/auth/drive.file',
                            callback: async (tokenResponse) => {
                                if (tokenResponse && tokenResponse.access_token) {
                                    this.accessToken = tokenResponse.access_token;
                                    await this.loadFolderIds();
                                    resolve(true);
                                } else {
                                    reject(false);
                                }
                            },
                        });
                        this.tokenClient.requestAccessToken();
                    } catch (error) {
                        reject(false);
                    }
                });
            }

            async loadFolderIds() {
                try {
                    const storedFolderIds = localStorage.getItem('googleDriveFolderIds');
                    if (storedFolderIds) {
                        this.folderIds = JSON.parse(storedFolderIds);
                    } else {
                        this.folderIds = await this.createFolderStructure(this.accessToken);
                        if (this.folderIds) {
                            localStorage.setItem('googleDriveFolderIds', JSON.stringify(this.folderIds));
                        }
                    }
                } catch (error) {
                    console.error('Error loading folder IDs:', error);
                }
            }

            async createFolder(accessToken, folderName, parentId = null) {
                const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
                const metadata = {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder',
                    ...(parentId && { parents: [parentId] })
                };
                const response = await fetch(DRIVE_API_URL, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(metadata),
                });
                const data = await response.json();
                return response.ok ? data.id : null;
            }

            async findFolder(accessToken, folderName, parentId) {
                const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
                const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentId}' in parents and trashed=false`;
                const response = await fetch(`${DRIVE_API_URL}?q=${encodeURIComponent(query)}&fields=files(id)`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                const data = await response.json();
                return response.ok && data.files.length > 0 ? data.files[0].id : null;
            }
            
            async createFolderStructure(accessToken) {
                let mainFolderId = await this.findFolder(accessToken, 'Serious Studies Only', 'root');
                if (!mainFolderId) mainFolderId = await this.createFolder(accessToken, 'Serious Studies Only');
                if (!mainFolderId) return null;

                const subfolders = ['photos', 'voice_messages', 'doodles_and_drawings', 'stickers_and_assets', 'backups', 'chat_media'];
                const folderIds = { main: mainFolderId };

                for (const folder of subfolders) {
                    let folderId = await this.findFolder(accessToken, folder, mainFolderId);
                    if (!folderId) folderId = await this.createFolder(accessToken, folder, mainFolderId);
                    folderIds[folder] = folderId;
                }
                return folderIds;
            }

            async makeFilePublic(fileId) {
                try {
                    const PERMISSIONS_API_URL = `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`;
                    await fetch(PERMISSIONS_API_URL, {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${this.accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            role: 'reader',
                            type: 'anyone',
                        }),
                    });
                } catch (error) {
                    console.error("Failed to make file public:", error);
                }
            }

            async uploadFile(fileObject, folderName) {
                if (!this.accessToken || !this.folderIds || !this.folderIds[folderName]) {
                    alert("Google Drive not connected or folders not found. Please connect in Settings.");
                    return null;
                }
                
                const UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
                const metadata = {
                    name: fileObject.name,
                    parents: [this.folderIds[folderName]],
                    mimeType: fileObject.type,
                };
                
                const form = new FormData();
                form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
                form.append('file', fileObject);

                try {
                    const response = await fetch(UPLOAD_API_URL, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${this.accessToken}` },
                        body: form,
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        const fileId = data.id;
                        await this.makeFilePublic(fileId);
                        return fileId;
                    } else {
                        console.error("Google Drive API returned an error:", data);
                        return null;
                    }
                } catch (error) {
                    console.error("Error during fetch to Google Drive:", error);
                    return null;
                }
            }

            getPublicViewUrl(fileId) {
                return `https://lh3.googleusercontent.com/d/${fileId}`;
            }
        }
        const googleDriveManager = new GoogleDriveManager();
        export default googleDriveManager;