const { downloadArtifact } = require('@electron/get');
const extract = require('extract-zip');
const path = require('path');
const fs = require('fs');

async function go() {
  console.log('Downloading electron...');
  const zipPath = await downloadArtifact({ version: '32.0.0', artifactName: 'electron', platform: 'win32', arch: 'x64' });
  const distPath = path.join(__dirname, 'node_modules', 'electron', 'dist');
  console.log('Extracting to', distPath);
  await extract(zipPath, { dir: distPath });
  fs.writeFileSync(path.join(__dirname, 'node_modules', 'electron', 'path.txt'), 'electron.exe');
  console.log('Done!');
}
go().catch(console.error);
