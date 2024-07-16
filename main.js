const { app, BrowserWindow } = require('electron');
const path = require('path');
const { execFile } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'static/electron-app-icon.png'), 
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadURL('http://localhost:3000'); // Adjust the port if needed

    mainWindow.webContents.on('did-finish-load', () => {
            if (loadingScreen) {
                loadingScreen.close();
            }

            mainWindow.show();
        }
    )

    mainWindow.on('closed', () => {
        mainWindow = null;
        if (serverProcess) {
            serverProcess.kill();
        }
    });
}

function startServer() {
    serverProcess = execFile('node', [path.join(__dirname, 'server-main.js')], (error, stdout, stderr) => {
        if (error) {
            console.error(`Server error: ${error}`);
            return;
        }
        if (stderr) {
            console.error(`Server stderr: ${stderr}`);
            return;
        }
        console.log(`Server stdout: ${stdout}`);
    });
}


const createLoadingScreen = () => {
    loadingScreen = new BrowserWindow({
        width: 100, title: "Wattpad Downloader", height: 100, frame: false, transparent: true, skipTaskbar: true, webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })
    loadingScreen.setResizable(false);
    loadingScreen.loadFile('static/loading.html');
    loadingScreen.on('closed', () => (loadingScreen = null));
    loadingScreen.webContents.on('did-finish-load', () => {
        loadingScreen.show();
    });
};

app.on('ready', () => {
    createLoadingScreen();
    startServer();
    
    setTimeout(() => {
        createWindow();
    }, 3000);

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    })
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('quit', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
});
