const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.handle('scan-packages', async () => {
  const results = [];

  // NPM packages
  const npmOutput = await new Promise((resolve) => {
    exec('npm list -g --depth=0 --json', (err, stdout) => {
      try {
        const parsed = JSON.parse(stdout).dependencies || {};
        Object.entries(parsed).forEach(([name, details]) => {
          results.push({
            name,
            version: details.version,
            manager: 'npm',
            reason: 'Check usage manually (no last used date)',
          });
        });
        resolve();
      } catch (e) {
        resolve();
      }
    });
  });

  // PIP packages
  await new Promise((resolve) => {
    exec('pip list --format=json', (err, stdout) => {
      try {
        const pipPackages = JSON.parse(stdout);
        pipPackages.forEach((pkg) => {
          results.push({
            name: pkg.name,
            version: pkg.version,
            manager: 'pip',
            reason: 'No usage data, recommend manual check',
          });
        });
      } catch (e) {}
      resolve();
    });
  });

  // Chocolatey packages
  await new Promise((resolve) => {
    exec('choco list -l', (err, stdout) => {
      const lines = stdout.split('\n');
      lines.forEach((line) => {
        const match = line.match(/^(.*)\s(\d+\.\d+\.\d+)/);
        if (match) {
          results.push({
            name: match[1],
            version: match[2],
            manager: 'choco',
            reason: 'Installed via choco, check if still needed',
          });
        }
      });
      resolve();
    });
  });

  // Winget
  await new Promise((resolve) => {
    exec('winget list', (err, stdout) => {
      const lines = stdout.split('\n').slice(1);
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.length > 0) {
          results.push({
            name: trimmed,
            manager: 'winget',
            reason: 'Windows package - manual check advised',
          });
        }
      });
      resolve();
    });
  });

  return results;
});