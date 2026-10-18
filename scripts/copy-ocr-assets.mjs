import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';
const req=createRequire(import.meta.url);const tess=path.dirname(req.resolve('tesseract.js/package.json'));const core=path.dirname(createRequire(path.join(tess,'package.json')).resolve('tesseract.js-core/package.json'));const lang=path.dirname(req.resolve('@tesseract.js-data/fra/package.json'));const dir='public/ocr';await fs.mkdir(dir+'/core',{recursive:true});await fs.mkdir(dir+'/lang',{recursive:true});
for(const file of ['tesseract.min.js','worker.min.js','tesseract.min.js.LICENSE.txt','worker.min.js.LICENSE.txt'])await fs.copyFile(path.join(tess,'dist',file),path.join(dir,file));
for(const file of ['tesseract-core.wasm.js','tesseract-core-simd.wasm.js','tesseract-core-lstm.wasm.js','tesseract-core-simd-lstm.wasm.js','LICENSE'])await fs.copyFile(path.join(core,file),path.join(dir,'core',file));
await fs.copyFile(path.join(lang,'4.0.0_best_int/fra.traineddata.gz'),path.join(dir,'lang/fra.traineddata.gz'));
console.log('OCR assets: client, worker, 4 WASM engines and French language copied.');
