import ts from 'typescript';import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';import path from 'node:path';import {createWorker} from 'tesseract.js';
const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/recipe-ocr.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {parseRecipeText}=exports;
const recipe=`Gâteau de famille
Pour 4 personnes
Préparation : 15 min
Cuisson : 30 min
Ingrédients
200 g de farine
100 g de sucre
2 œufs
Préparation
1. Préchauffez le four à 180 °C.
2. Mélangez la farine et le sucre.
3. Ajoutez les œufs et mélangez.
4. Enfournez pendant 30 minutes.`;
const parsed=parseRecipeText(recipe);assert.equal(parsed.title,'Gâteau de famille');assert.equal(parsed.servings,4);assert.equal(parsed.ingredients.split('\n').length,3);assert.equal(parsed.steps.split('\n').length,4);assert.match(parsed.time,/30 min/);assert.equal(parsed.warnings.length,0);
const missing=parseRecipeText('Soupe maison\nIngrédients\n2 carottes',42);assert.equal(missing.steps,'');assert.equal(missing.servings,null);assert(missing.warnings.some(x=>x.includes('incertaine')));assert(!missing.ingredients.includes('eau'));
const fallback=parseRecipeText('Salade rapide\n2 tomates\n1 concombre\nCoupez les légumes.\nServez frais.');assert.equal(fallback.ingredients.split('\n').length,2);assert.equal(fallback.steps.split('\n').length,2);
assert.equal(parseRecipeText('').ingredients,'');assert.equal(parseRecipeText('').steps,'');
if(process.argv[2]){const worker=await createWorker('fra',1,{langPath:path.resolve('public/ocr/lang'),cacheMethod:'none'});try{const {data}=await worker.recognize(process.argv[2]);const got=parseRecipeText(data.text,data.confidence);assert.match(got.title,/Gâteau de famille/);assert.equal(got.servings,4);assert.match(got.ingredients,/200 g de farine/);assert.match(got.ingredients,/100 g de sucre/);assert.match(got.steps,/180/);assert.match(got.steps,/Enfournez pendant 30 minutes/);console.log('PASS: actual French OCR image → title, servings, ingredients and steps; confidence '+Math.round(data.confidence)+'%.');}finally{await worker.terminate()}}
console.log('PASS: sections, fallback, missing values, low-confidence warnings and no invented ingredients.');
const decorated=parseRecipeText('Dessert maison\n— **200g de fromage frais**\n— **3 cuillères de sucre**\n— Cacao\nDans un bol mélanger avec le\nsucre\nTremper les biscuits\nSaupoudrer cacao');assert.equal(decorated.ingredients.split('\n').length,3);assert.equal(decorated.steps.split('\n').length,3);assert(!decorated.ingredients.includes('**'));assert.match(decorated.steps,/avec le sucre/);
console.log('PASS: decorated ingredients and unnumbered wrapped instructions.');
