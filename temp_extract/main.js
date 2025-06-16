const { app, BrowserWindow, Tray, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const log = require('electron-log');
const Store = require('electron-store');
const ThermalPrinter = require('node-thermal-printer').printer;
const PrinterTypes = require('node-thermal-printer').types;
const fs = require('fs');
const os = require('os');

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';
log.info('Fiscal Flow Printer starting...');

// Config store
const store = new Store({
  schema: {
    supabaseUrl: {
      type: 'string',
      default: 'https://rfssfovxxldywtklxveu.supabase.co'
    },
    supabaseKey: {
      type: 'string',
      default: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmc3Nmb3Z4eGxkeXd0a2x4dmV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk5NjgzMzUsImV4cCI6MjAxNTU0NDMzNX0.SWDpUGZcXLTaV_YXNgX_i2q-jn8EnCYkl0oZgc05iDc'
    },
    printerName: {
      type: 'string',
      default: 'HP DESKJET 2700 SERIES'
    },
    userId: {
      type: 'string',
      default: ''
    },
    autoStart: {
      type: 'boolean',
      default: true
    },
    checkInterval: {
      type: 'number',
      default: 5000
    }
  }
});

let mainWindow = null;
let tray = null;
let supabase = null;
let printCheckInterval = null;
let lastPrintedId = null;
let statusConnected = false;
let currentDeviceId = null;
let multipleDevicesDetected = false;

// Gera ID único para este dispositivo
function generateDeviceId() {
  const hostName = os.hostname();
  const username = os.userInfo().username;
  return `${hostName}-${username}`;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 850,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'assets/icon.ico')
  });

  mainWindow.loadFile('index.html');
  
  // Hide menu bar
  mainWindow.setMenuBarVisibility(false);
  
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  // Connect to Supabase
  initializeSupabase();
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'assets/icon.ico'));
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Status: Desconectado',
      id: 'status',
      enabled: false
    },
    { type: 'separator' },
    { 
      label: 'Abrir Fiscal Flow Printer', 
      click: () => {
        mainWindow.show();
      } 
    },
    { type: 'separator' },
    { 
      label: 'Sair', 
      click: () => {
        app.isQuitting = true;
        app.quit();
      } 
    }
  ]);

  tray.setToolTip('Fiscal Flow Printer');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow.show();
  });
}

function initializeSupabase() {
  try {
    supabase = createClient(
      store.get('supabaseUrl'),
      store.get('supabaseKey')
    );
    
    log.info('Supabase initialized');
    
    // Test connection
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        log.error('Supabase connection error:', error);
        updateStatus(false);
      } else {
        log.info('Supabase connected');
        updateStatus(true);
        
        // Inicializa o ID do dispositivo
        currentDeviceId = generateDeviceId();
        registerDevice();
        checkForMultipleDevices();
        startPrintMonitoring();
      }
    });
  } catch (error) {
    log.error('Failed to initialize Supabase:', error);
    updateStatus(false);
  }
}

// Registra este dispositivo na tabela de dispositivos ativos
async function registerDevice() {
  try {
    const userId = store.get('userId');
    if (!userId || !currentDeviceId) return;
    
    await supabase
      .from('active_devices')
      .upsert({
        user_id: userId,
        device_id: currentDeviceId,
        last_active: new Date().toISOString()
      }, { onConflict: 'device_id' });
    
    log.info(`Device registered: ${currentDeviceId}`);
    
    // Configura intervalo para atualizar status do dispositivo
    setInterval(updateDeviceActivity, 30000);
  } catch (error) {
    log.error('Error registering device:', error);
  }
}

// Atualiza o timestamp da última atividade
async function updateDeviceActivity() {
  try {
    const userId = store.get('userId');
    if (!userId || !currentDeviceId) return;
    
    await supabase
      .from('active_devices')
      .update({ last_active: new Date().toISOString() })
      .eq('device_id', currentDeviceId)
      .eq('user_id', userId);
      
    // Verifica dispositivos múltiplos a cada atualização
    checkForMultipleDevices();
  } catch (error) {
    log.error('Error updating device activity:', error);
  }
}

// Verifica se existem múltiplos dispositivos ativos
async function checkForMultipleDevices() {
  try {
    const userId = store.get('userId');
    if (!userId) return;
    
    // Busca dispositivos ativos nos últimos 2 minutos
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('active_devices')
      .select('device_id')
      .eq('user_id', userId)
      .gt('last_active', twoMinutesAgo);
      
    if (error) {
      log.error('Error checking for multiple devices:', error);
      return;
    }
    
    const wasMultipleDevices = multipleDevicesDetected;
    multipleDevicesDetected = data && data.length > 1;
    
    // Se o estado mudou, notifica a interface
    if (wasMultipleDevices !== multipleDevicesDetected) {
      if (multipleDevicesDetected) {
        log.info(`Multiple devices detected: ${data.length}`);
      } else {
        log.info('Single device mode');
      }
      
      // Envia estado atualizado para a interface
      if (mainWindow) {
        mainWindow.webContents.send('multiple-devices-update', multipleDevicesDetected);
      }
    }
  } catch (error) {
    log.error('Error in checkForMultipleDevices:', error);
  }
}

function startPrintMonitoring() {
  if (printCheckInterval) {
    clearInterval(printCheckInterval);
  }
  
  const interval = store.get('checkInterval');
  log.info(`Starting print monitoring with interval: ${interval}ms`);
  
  printCheckInterval = setInterval(checkForPrintJobs, interval);
}

async function checkForPrintJobs() {
  try {
    if (!supabase) {
      log.warn('Supabase not initialized');
      return;
    }
    
    const userId = store.get('userId');
    if (!userId) {
      log.warn('User ID not set');
      return;
    }
    
    // Query for new print jobs
    const { data, error } = await supabase
      .from('print_jobs')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (error) {
      log.error('Error fetching print jobs:', error);
      return;
    }
    
    if (data && data.length > 0) {
      log.info(`Found ${data.length} print jobs`);
      for (const job of data) {
        await processPrintJob(job);
      }
    }
  } catch (error) {
    log.error('Error in checkForPrintJobs:', error);
  }
}

async function processPrintJob(job) {
  log.info(`Processing print job: ${job.id}`);
  
  try {
    // Mark job as processing
    await supabase
      .from('print_jobs')
      .update({ status: 'processing' })
      .eq('id', job.id);
    
    // Try to print
    const success = await printDocument(job);
    
    // Update status based on print result
    await supabase
      .from('print_jobs')
      .update({ 
        status: success ? 'completed' : 'failed',
        processed_at: new Date().toISOString()
      })
      .eq('id', job.id);
    
    log.info(`Print job ${job.id} ${success ? 'completed' : 'failed'}`);
  } catch (error) {
    log.error(`Error processing print job ${job.id}:`, error);
    
    // Update status to failed if there was an error
    await supabase
      .from('print_jobs')
      .update({ 
        status: 'failed',
        processed_at: new Date().toISOString()
      })
      .eq('id', job.id);
  }
}

async function printDocument(job) {
  try {
    const printerName = store.get('printerName');
    log.info(`Printing to ${printerName}`);
    
    // Set up thermal printer
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: `printer:${printerName}`,
      options: {
        timeout: 5000
      }
    });

    // Check if printer is connected
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      log.error('Printer not connected');
      return false;
    }

    // Process print data
    printer.alignCenter();
    printer.bold(true);
    printer.println("FISCAL FLOW");
    printer.bold(false);
    printer.println("--------------------------");
    
    // Parse document data
    const document = job.document_data;
    
    if (document.header) {
      printer.alignCenter();
      printer.println(document.header);
      printer.println("");
    }
    
    if (document.customer) {
      printer.alignLeft();
      printer.println(`Cliente: ${document.customer.name}`);
      if (document.customer.document) {
        printer.println(`Documento: ${document.customer.document}`);
      }
      printer.println("");
    }
    
    if (document.items && document.items.length > 0) {
      printer.alignLeft();
      printer.println("ITENS:");
      printer.println("--------------------------");
      
      for (const item of document.items) {
        printer.println(`${item.quantity}x ${item.name}`);
        printer.alignRight();
        printer.println(`R$ ${item.price.toFixed(2)}`);
        printer.alignLeft();
      }
      
      printer.println("--------------------------");
      printer.bold(true);
      printer.println(`TOTAL: R$ ${document.total.toFixed(2)}`);
      printer.bold(false);
      printer.println("");
    }
    
    if (document.payment) {
      printer.alignLeft();
      printer.println(`Forma de pagamento: ${document.payment.method}`);
      printer.println("");
    }
    
    if (document.footer) {
      printer.alignCenter();
      printer.println(document.footer);
    }
    
    printer.cut();
    
    // Execute print
    await printer.execute();
    log.info('Print successful');
    return true;
  } catch (error) {
    log.error('Print error:', error);
    return false;
  }
}

// Nova função para imprimir todas as notas pendentes de uma vez
async function printAllPendingNotes() {
  try {
    if (!supabase) {
      log.warn('Supabase not initialized');
      return { success: false, message: 'Supabase não inicializado' };
    }
    
    const userId = store.get('userId');
    if (!userId) {
      log.warn('User ID not set');
      return { success: false, message: 'ID do usuário não configurado' };
    }
    
    // Busca todas as notas pendentes
    const { data, error } = await supabase
      .from('print_jobs')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (error) {
      log.error('Error fetching print jobs:', error);
      return { success: false, message: 'Erro ao buscar notas pendentes' };
    }
    
    if (!data || data.length === 0) {
      log.info('No pending notes found');
      return { success: false, message: 'Nenhuma nota pendente encontrada' };
    }
    
    log.info(`Printing all ${data.length} pending notes`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Processa todas as notas
    for (const job of data) {
      const success = await processPrintJob(job);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }
    
    const resultMessage = `Impressão concluída: ${successCount} sucesso, ${failCount} falhas`;
    log.info(resultMessage);
    
    return { 
      success: true, 
      message: resultMessage,
      stats: { success: successCount, failed: failCount, total: data.length }
    };
    
  } catch (error) {
    log.error('Error in printAllPendingNotes:', error);
    return { success: false, message: 'Erro ao processar impressões' };
  }
}

function updateStatus(connected) {
  statusConnected = connected;
  
  if (mainWindow) {
    mainWindow.webContents.send('connection-status', connected);
  }
  
  if (tray) {
    const contextMenu = Menu.buildFromTemplate([
      { 
        label: `Status: ${connected ? 'Conectado' : 'Desconectado'}`,
        id: 'status',
        enabled: false
      },
      { type: 'separator' },
      { 
        label: 'Abrir Fiscal Flow Printer', 
        click: () => {
          mainWindow.show();
        } 
      },
      { type: 'separator' },
      { 
        label: 'Sair', 
        click: () => {
          app.isQuitting = true;
          app.quit();
        } 
      }
    ]);
    
    tray.setContextMenu(contextMenu);
  }
}

// Adiciona manipuladores de eventos para as novas funções
ipcMain.handle('print-all-pending', async (event) => {
  return await printAllPendingNotes();
});

ipcMain.handle('check-multiple-devices', async (event) => {
  await checkForMultipleDevices();
  return { multipleDevicesDetected };
});

// IPC handlers
ipcMain.handle('get-settings', () => {
  return {
    supabaseUrl: store.get('supabaseUrl'),
    supabaseKey: store.get('supabaseKey'),
    printerName: store.get('printerName'),
    userId: store.get('userId'),
    autoStart: store.get('autoStart'),
    checkInterval: store.get('checkInterval')
  };
});

ipcMain.handle('save-settings', async (event, settings) => {
  log.info('Saving settings:', settings);
  store.set(settings);
  initializeSupabase();
  startPrintMonitoring();
  return { success: true };
});

ipcMain.handle('test-connection', async () => {
  try {
    if (!supabase) {
      return { success: false, message: 'Supabase não inicializado' };
    }
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return { success: false, message: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('test-printer', async () => {
  try {
    const printerName = store.get('printerName');
    
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: `printer:${printerName}`,
      options: {
        timeout: 5000
      }
    });
    
    const isConnected = await printer.isPrinterConnected();
    
    if (!isConnected) {
      return { success: false, message: 'Impressora não conectada' };
    }
    
    printer.alignCenter();
    printer.bold(true);
    printer.println("TESTE - FISCAL FLOW PRINTER");
    printer.bold(false);
    printer.println(new Date().toLocaleString('pt-BR'));
    printer.drawLine();
    printer.println("Teste de impressão realizado com sucesso!");
    printer.cut();
    
    await printer.execute();
    
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// App events
app.on('ready', () => {
  createWindow();
  createTray();
  
  // Create assets dir if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, 'assets'))) {
    fs.mkdirSync(path.join(__dirname, 'assets'));
  }
});

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

app.on('before-quit', () => {
  app.isQuitting = true;
  if (printCheckInterval) {
    clearInterval(printCheckInterval);
  }
}); 