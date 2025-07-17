import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Ping機能
ipcMain.handle('ping', async (event, host: string) => {
  try {
    const isWindows = process.platform === 'win32';
    const command = isWindows 
      ? `ping -n 4 ${host}` 
      : `ping -c 4 ${host}`;
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      return { success: false, error: stderr };
    }
    
    const stats = parseOutput(stdout, isWindows);
    
    return { 
      success: true, 
      output: stdout,
      stats
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Unknown error occurred' 
    };
  }
});

// ポートチェック機能
ipcMain.handle('check-port', async (event, host: string, port: number) => {
  try {
    const isWindows = process.platform === 'win32';
    const command = isWindows
      ? `powershell -command "Test-NetConnection -ComputerName ${host} -Port ${port}"`
      : `nc -zv -w 2 ${host} ${port} 2>&1`;
    
    const { stdout, stderr } = await execAsync(command);
    
    if (isWindows) {
      const success = stdout.includes('TcpTestSucceeded : True');
      return { 
        success, 
        message: success ? `Port ${port} is open` : `Port ${port} is closed`,
        output: stdout
      };
    } else {
      const output = stdout || stderr;
      const success = output.includes('succeeded') || output.includes('open');
      return { 
        success,
        message: success ? `Port ${port} is open` : `Port ${port} is closed`,
        output
      };
    }
  } catch (error: any) {
    return { 
      success: false, 
      message: `Port ${port} is closed or unreachable`,
      error: error.message 
    };
  }
});

// traceroute機能
ipcMain.handle('traceroute', async (event, host: string) => {
  try {
    const isWindows = process.platform === 'win32';
    const command = isWindows 
      ? `tracert ${host}` 
      : `traceroute ${host}`;
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('Warning')) {
      return { success: false, error: stderr };
    }
    
    return { 
      success: true, 
      output: stdout
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Unknown error occurred' 
    };
  }
});

function parseOutput(output: string, isWindows: boolean): any {
  const stats: any = {};
  
  if (isWindows) {
    const packetMatch = output.match(/Packets: Sent = (\d+), Received = (\d+), Lost = (\d+)/);
    if (packetMatch) {
      stats.sent = parseInt(packetMatch[1]);
      stats.received = parseInt(packetMatch[2]);
      stats.lost = parseInt(packetMatch[3]);
      stats.lossPercent = (stats.lost / stats.sent) * 100;
    }
    
    const rtMatch = output.match(/Minimum = (\d+)ms, Maximum = (\d+)ms, Average = (\d+)ms/);
    if (rtMatch) {
      stats.min = parseInt(rtMatch[1]);
      stats.max = parseInt(rtMatch[2]);
      stats.avg = parseInt(rtMatch[3]);
    }
  } else {
    const packetMatch = output.match(/(\d+) packets transmitted, (\d+) (?:packets )?received, ([\d.]+)% packet loss/);
    if (packetMatch) {
      stats.sent = parseInt(packetMatch[1]);
      stats.received = parseInt(packetMatch[2]);
      stats.lossPercent = parseFloat(packetMatch[3]);
      stats.lost = stats.sent - stats.received;
    }
    
    const rtMatch = output.match(/min\/avg\/max\/(?:mdev|stddev) = ([\d.]+)\/([\d.]+)\/([\d.]+)/);
    if (rtMatch) {
      stats.min = parseFloat(rtMatch[1]);
      stats.avg = parseFloat(rtMatch[2]);
      stats.max = parseFloat(rtMatch[3]);
    }
  }
  
  return stats;
}