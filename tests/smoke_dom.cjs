'use strict';
/* Compatibilidad con comando anterior: comprobar integridad de HTML y ejecutar pruebas actuales. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const file=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
const scripts=[...file.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
assert.equal(scripts.length,2,'Se esperan motor y UI embebidos');
scripts.forEach((s)=>new Function(s));
assert.ok(file.includes('id="pdfButton"')&&file.includes('id="txtButton"'));
assert.ok(!file.includes('id="saveJson"'));
console.log('HTML autónomo: sintaxis válida, motores embebidos, PDF/TXT disponibles.');
console.log('Pruebas numéricas e interfaz: node --test tests/*.test.cjs');
