const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;
let currentFiles = new Map();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    backgroundColor: '#ffffff'
  });

  mainWindow.loadFile('index.html');
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'MarkBook',
      submenu: [
        { label: 'О программе MarkBook', role: 'about' },
        { type: 'separator' },
        { label: 'Настройки...', accelerator: 'Cmd+,', click: () => mainWindow.webContents.send('show-settings') },
        { type: 'separator' },
        { label: 'Скрыть MarkBook', accelerator: 'Cmd+H', role: 'hide' },
        { label: 'Скрыть остальные', accelerator: 'Cmd+Shift+H', role: 'hideothers' },
        { label: 'Показать все', role: 'unhide' },
        { type: 'separator' },
        { label: 'Выйти', accelerator: 'Cmd+Q', role: 'quit' }
      ]
    },
    {
      label: 'Файл',
      submenu: [
        { label: 'Новый файл', accelerator: 'Cmd+N', click: () => mainWindow.webContents.send('new-file') },
        { label: 'Открыть...', accelerator: 'Cmd+O', click: openFile },
        { type: 'separator' },
        { label: 'Сохранить', accelerator: 'Cmd+S', click: () => mainWindow.webContents.send('save-file') },
        { label: 'Сохранить как...', accelerator: 'Cmd+Shift+S', click: saveFileAs },
        { type: 'separator' },
        { label: 'Закрыть вкладку', accelerator: 'Cmd+W', click: () => mainWindow.webContents.send('close-tab') }
      ]
    },
    {
      label: 'Правка',
      submenu: [
        { label: 'Отменить', accelerator: 'Cmd+Z', role: 'undo' },
        { label: 'Повторить', accelerator: 'Cmd+Shift+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Вырезать', accelerator: 'Cmd+X', role: 'cut' },
        { label: 'Копировать', accelerator: 'Cmd+C', role: 'copy' },
        { label: 'Вставить', accelerator: 'Cmd+V', role: 'paste' },
        { type: 'separator' },
        { label: 'Найти', accelerator: 'Cmd+F', click: () => mainWindow.webContents.send('show-search') }
      ]
    },
    {
      label: 'Окно',
      submenu: [
        { label: 'Свернуть', accelerator: 'Cmd+M', role: 'minimize' },
        { label: 'Закрыть', accelerator: 'Cmd+W', role: 'close' },
        { type: 'separator' },
        { label: 'Перенести все на передний план', role: 'front' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function openFile() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Markdown файлы', extensions: ['md', 'markdown', 'txt'] },
      { name: 'Все файлы', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    mainWindow.webContents.send('file-opened', { 
      path: filePath, 
      content: content, 
      name: fileName 
    });
  }
}

async function saveFileAs() {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'Markdown файлы', extensions: ['md'] },
      { name: 'Текстовые файлы', extensions: ['txt'] }
    ]
  });

  if (!result.canceled) {
    mainWindow.webContents.send('save-file-as', result.filePath);
  }
}

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
