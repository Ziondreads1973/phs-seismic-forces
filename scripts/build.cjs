'use strict';
/* Genera HTML autónomo desde la fuente modular; no instala dependencias. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const template=read('src/template.html');
const engine=read('src/motor.js'),ui=read('src/ui.js');
if(engine.includes('</script>')||ui.includes('</script>'))throw Error('Script contiene cierre HTML no escapado');
if(!template.includes('/*__PHS_MOTOR__*/')||!template.includes('/*__PHS_UI__*/'))throw Error('Marcadores faltantes');
const output=template.replace('/*__PHS_MOTOR__*/',engine).replace('/*__PHS_UI__*/',ui);
fs.writeFileSync(path.join(root,'index.html'),output,'utf8');
console.log('HTML autónomo generado:',path.join(root,'index.html'));
