const fs = require('fs');
const https = require('https');
const path = require('path');

const dir = path.join(__dirname, 'public', 'logos');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

async function downloadLogo(url, filename) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  
  if (!response.ok) {
    console.error(`Failed to download ${filename}: ${response.status} ${response.statusText}`);
    return;
  }
  
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(path.join(dir, filename), Buffer.from(buffer));
  console.log(`Downloaded ${filename}`);
}

async function main() {
  await downloadLogo('https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Tata_Consultancy_Services_Logo.svg/512px-Tata_Consultancy_Services_Logo.svg.png', 'tcs.png');
  await downloadLogo('https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/HCLTech_logo.svg/512px-HCLTech_logo.svg.png', 'hcltech.png');
  await downloadLogo('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/LTIMindtree_Logo.svg/512px-LTIMindtree_Logo.svg.png', 'ltimindtree.png');
}

main();
