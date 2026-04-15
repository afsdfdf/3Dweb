const fs = require('fs');
const path = require('path');
const root = 'D:/web/payload-local-demo';
const targets = ['.import-previews','.real-previews','.dev-final.err.log','.dev-final.out.log','.meshy-dev.err.log','.meshy-dev.out.log','.s3-dev.err.log','.s3-dev.out.log','.thumb-http.err.log','.thumb-http.out.log','.single-gltf-preview.png','tmp-s3-upload.bin'];
for (const target of targets) {
  const full = path.join(root, target);
  if (fs.existsSync(full)) {
    fs.rmSync(full, { recursive: true, force: true });
    console.log(`removed ${target}`);
  }
}
