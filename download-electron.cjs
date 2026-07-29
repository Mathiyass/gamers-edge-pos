const { downloadArtifact } = require('@electron/get');
const extract = require('extract-zip');
const path = require('path');
const fs = require('fs');

async function go() {
  const electronPkg = require('./node_modules/electron/package.json');
  const version = electronPkg.version;
  console.log(`Downloading Electron v${version}...`);
  const zipPath = await downloadArtifact({ version, artifactName: 'electron', platform: process.platform, arch: process.arch });
  const distPath = path.resolve(__dirname, 'node_modules', 'electron', 'dist');
  console.log('Extracting to', distPath);
  await extract(zipPath, { dir: distPath });
  fs.writeFileSync(path.resolve(__dirname, 'node_modules', 'electron', 'path.txt'), process.platform === 'win32' ? 'electron.exe' : 'electron');
  console.log('Successfully installed Electron binary!');
}
go().catch(err => {
  console.error(err);
  process.exit(1);
});
