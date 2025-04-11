const { ipcRenderer } = require('electron');

async function scanPackages() {
  const list = document.getElementById('packageList');
  list.innerHTML = '<p>Scanning...</p>';
  const packages = await ipcRenderer.invoke('scan-packages');
  list.innerHTML = '';

  packages.forEach((pkg) => {
    const div = document.createElement('div');
    div.className = 'package-item';
    div.innerHTML = `
      <strong>${pkg.name}</strong> (${pkg.manager})<br/>
      <span class="reason">Reason: ${pkg.reason}</span><br/>
      <button class="btn-delete" onclick="alert('Manual deletion recommended for: ${pkg.name}')">Delete</button>
    `;
    list.appendChild(div);
  });
}