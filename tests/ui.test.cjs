'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
function mount(changes={},locale){
 const start={norm:'87',w:'1000',ie:'1',fx:'25',fy:'35',loc87:'ground',cat:'III',zone:'2',soil:'C',
 equipment:'electrical-mechanical',duct:'ductile',loc2369:'ground',height:'',zk:'',loc88:'ground',vertical:'rigid',
 pdfLevel:'global',txtLevel:'detallado',...changes};
 const nodes={},saved={files:[],printed:0};
 const element=id=>nodes[id]||(nodes[id]={id,value:start[id]??'',hidden:false,disabled:false,
  innerHTML:'',textContent:'',className:'',events:{},
  addEventListener(name,fn){this.events[name]=fn},remove(){},click(){}});
 const ids=[...html.matchAll(/(?:<input|<select)\s+id="([^"]+)"/g)].map(x=>x[1]);
 const document={getElementById:element,querySelectorAll(){return ids.map(element)},
  body:{appendChild(){}},createElement(){return {href:'',download:'',click(){saved.files.push(this.download)},remove(){}}}};
 const numberFormatter=Intl.NumberFormat;
 const localeIntl={NumberFormat:function(ignored,options){return new numberFormatter(locale,options)}};
 const context=vm.createContext({document,window:{print(){saved.printed++}},URL:{createObjectURL(){return'blob://test'},revokeObjectURL(){}},
 Blob:global.Blob,setTimeout(){},console,Intl:localeIntl});
 for(const script of scripts)vm.runInContext(script,context,{timeout:3000});
 function set(id,value,event='input'){element(id).value=value;element(id).events[event]?.()}
 return {nodes,saved,set};
}
test('HTML autónomo: dos scripts inline y sin exportación JSON',()=>{
 assert.equal(scripts.length,2);assert.doesNotMatch(html,/id="saveJson"/);
 assert.match(html,/id="pdfLevel"/);assert.match(html,/id="txtLevel"/);
});
test('Art87: fuerzas distintas y reporte global/detallado independiente',()=>{
 const d=mount();
 assert.equal(d.nodes.pdfButton.disabled,false);
 assert.match(d.nodes.forces.innerHTML,new RegExp(new Intl.NumberFormat(undefined,{minimumFractionDigits:1,maximumFractionDigits:1,useGrouping:false}).format(1012.5)));
 assert.match(d.nodes.pdfPreview.innerHTML,/Resumen de fuerzas/);
 d.set('pdfLevel','detallado','change');
 assert.match(d.nodes.pdfPreview.innerHTML,/Ecuaciones y resultados/);
 d.set('txtLevel','global','change');
 assert.match(d.nodes.txtPreview.textContent,/RESULTADOS/);
 assert.doesNotMatch(d.nodes.txtPreview.textContent,/ECUACIONES PRINCIPALES/);
 d.nodes.pdfButton.events.click();assert.equal(d.saved.printed,1);
 d.nodes.txtButton.events.click();assert.equal(d.saved.files.length,1);
 assert.match(d.saved.files[0],/global.txt$/);
});
test('Art87: invalidación inmediata de archivo anterior',()=>{
 const d=mount();d.set('fx','19.99');
 assert.equal(d.nodes.pdfButton.disabled,true);
 assert.equal(d.nodes.txtButton.disabled,true);
 assert.match(d.nodes.status.textContent,/inferior a 20/);
});
test('Art88: modelo vertical flexible y piso superior',()=>{
 const d=mount({norm:'88',vertical:'flex',loc88:'floor'});
 assert.equal(d.nodes.pdfButton.disabled,false);
 assert.match(d.nodes.pdfPreview.innerHTML,/CNE/);
 assert.match(d.nodes.forces.innerHTML,/Ex/);
});
test('NCh2369: basal sin alturas y elevación inválida',()=>{
 const d=mount({norm:'2369'});
 assert.equal(d.nodes.pdfButton.disabled,false);
 d.set('loc2369','elevated');
 assert.equal(d.nodes.pdfButton.disabled,true);
 d.set('height','5');d.set('zk','2');
 assert.equal(d.nodes.pdfButton.disabled,false);
});

test('Formato decimal por configuración regional; sin separador de miles, pantalla y reportes',()=>{
 for(const [locale,separator] of [['es-CL',','],['en-US','.'],['de-DE',',']]){
   const d=mount({w:'1000000',fx:'35',fy:'35'},locale);
   const one=new Intl.NumberFormat(locale,{minimumFractionDigits:1,maximumFractionDigits:1,useGrouping:false}).format(750000);
   const two=new Intl.NumberFormat(locale,{minimumFractionDigits:3,maximumFractionDigits:3,useGrouping:false}).format(1.25);
   assert.match(d.nodes.forces.innerHTML,new RegExp(one.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
   assert.match(d.nodes.pdfPreview.innerHTML,new RegExp(one.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
   assert.match(d.nodes.txtPreview.textContent,new RegExp(one.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
   assert.equal(new Intl.NumberFormat(locale,{minimumFractionDigits:3,maximumFractionDigits:3,useGrouping:false}).format(1.25),two);
   assert.ok(one.includes(separator));
 }
});
