'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);

function mount(changes={},locale){
  const start={norm:'87',w:'1000',ie:'1',fx:'25',fy:'35',loc87:'ground',
    cat:'III',zone:'2',soil:'C',equipment:'electrical-mechanical',duct:'ductile',
    loc2369:'ground',height:'',zk:'',loc88:'ground',vertical:'rigid',...changes};
  const nodes={},saved={files:[],printed:0,payload:null,printedView:null};
  const element=id=>nodes[id]||(nodes[id]={id,value:start[id]??'',hidden:false,disabled:false,
    innerHTML:'',textContent:'',className:'',events:{},
    addEventListener(name,fn){this.events[name]=fn},remove(){},click(){}});
  const ids=[...html.matchAll(/<(?:input|select)\s+id="([^"]+)"/g)].map(x=>x[1]);
  const localNumbers=[...html.matchAll(/data-local-number="([^"]+)" data-decimals="([^"]+)"/g)]
    .map(match=>({dataset:{localNumber:match[1],decimals:match[2]},textContent:match[1]}));
  const document={getElementById:element,querySelectorAll(query){
    if(query==='input,select')return ids.map(element);
    if(query==='[data-local-number]')return localNumbers;
    return [];
  },body:{appendChild(){}},createElement(){
    return {href:'',download:'',click(){saved.files.push(this.download)},remove(){}};
  }};
  const baseIntl=Intl.NumberFormat;
  const localeIntl={NumberFormat:function(ignored,options){return new baseIntl(locale,options)}};
  class BlobCapture{constructor(parts){saved.payload=parts.join('')}}
  const context=vm.createContext({document,window:{print(){
    saved.printed++;saved.printedView=element('globalReport').innerHTML;
  }},URL:{createObjectURL(){return'blob://test'},revokeObjectURL(){}},
    Blob:BlobCapture,setTimeout(){},console,Intl:localeIntl});
  for(const script of scripts)vm.runInContext(script,context,{timeout:3000});
  function set(id,value,event='input'){element(id).value=value;element(id).events[event]?.()}
  return {nodes,saved,set,localNumbers};
}

test('Contrato: PDF global único, TXT detallado único, sin niveles ni JSON',()=>{
  assert.equal(scripts.length,2);
  for(const old of ['pdfLevel','txtLevel','printHost','pdfPreview','saveJson'])
    assert.doesNotMatch(html,new RegExp('id="'+old+'"'));
  assert.match(html,/id="globalReport"/);
  assert.match(html,/Guardar PDF global/);
  assert.match(html,/Descargar TXT detallado/);
  assert.match(html,/@media print[\s\S]*?main\{display:block!important/);
});

test('Art. 87: pantalla global idéntica al contenido enviado a impresión',()=>{
  const d=mount();
  assert.equal(d.nodes.pdfButton.disabled,false);
  const f=new Intl.NumberFormat(undefined,{minimumFractionDigits:1,maximumFractionDigits:1,useGrouping:false}).format(1012.5);
  assert.ok(d.nodes.globalReport.innerHTML.includes(f));
  assert.match(d.nodes.globalReport.innerHTML,/Antecedentes y factores principales/);
  assert.match(d.nodes.globalReport.innerHTML,/Fuerzas sísmicas finales/);
  assert.doesNotMatch(d.nodes.globalReport.innerHTML,/Ecuaciones y resultados principales/);
  d.nodes.pdfButton.events.click();
  assert.equal(d.saved.printed,1);
  assert.equal(d.saved.printedView,d.nodes.globalReport.innerHTML);
});

test('TXT: siempre detallado con parámetros, ecuaciones y resultados',()=>{
  const d=mount();
  d.nodes.txtButton.events.click();
  assert.equal(d.saved.files.length,1);
  assert.match(d.saved.files[0],/_detallado\.txt$/);
  for(const section of ['1. ANTECEDENTES','2. PARÁMETROS Y FACTORES','3. ECUACIONES PRINCIPALES','4. RESULTADOS'])
    assert.ok(d.saved.payload.includes(section));
  assert.match(d.saved.payload,/Frecuencia X/);
  assert.match(d.saved.payload,/Ex =/);
});

test('Art. 88: tabla IE/R a la vista y fila del equipo destacada',()=>{
  const d=mount({norm:'88',vertical:'flex',loc88:'floor'});
  assert.equal(d.nodes.pdfButton.disabled,false);
  assert.match(html,/<section class="reference-block" aria-label="Tabla 4 de referencia"/);
  assert.match(html,/<tr class="applied"><td>Equipo eléctrico general/);
  assert.doesNotMatch(html,/<details><summary>Ver Tabla 4/);
  assert.match(d.nodes.globalReport.innerHTML,/IE \(Tabla 4\)/);
  assert.match(d.nodes.globalReport.innerHTML,/R \(Tabla 4\)/);
  assert.match(d.nodes.globalReport.innerHTML,/Sa,máx\/g/);
  assert.match(d.nodes.txtPreview.textContent,/Fb =/);
});

test('NCh2369 basal y elevada: resultados y bloqueo de entradas inválidas',()=>{
  const d=mount({norm:'2369'});
  assert.equal(d.nodes.pdfButton.disabled,false);
  d.set('loc2369','elevated');
  assert.equal(d.nodes.pdfButton.disabled,true);
  d.set('height','5');d.set('zk','2');
  assert.equal(d.nodes.pdfButton.disabled,false);
  assert.match(d.nodes.globalReport.innerHTML,/Rp/);
});

test('Art. 87: entradas inválidas borran resultados anteriores y bloquean ambos formatos',()=>{
  const d=mount();d.set('fx','19.99');
  assert.equal(d.nodes.pdfButton.disabled,true);
  assert.equal(d.nodes.txtButton.disabled,true);
  assert.match(d.nodes.status.textContent,/inferior a 20/);
  assert.doesNotMatch(d.nodes.globalReport.innerHTML,/Fuerzas sísmicas finales/);
  assert.equal(d.saved.printed,0);
});

test('Formato local: coma o punto decimal, sin separador de miles, en ambas salidas',()=>{
  for(const [locale,separator] of [['es-CL',','],['en-US','.'],['de-DE',',']]){
    const d=mount({w:'1000000',fx:'35',fy:'35'},locale);
    const one=new Intl.NumberFormat(locale,{minimumFractionDigits:1,maximumFractionDigits:1,useGrouping:false}).format(750000);
    assert.ok(one.includes(separator));
    assert.ok(d.nodes.globalReport.innerHTML.includes(one));
    assert.ok(d.nodes.txtPreview.textContent.includes(one));
    d.nodes.txtButton.events.click();
    assert.ok(d.saved.payload.includes(one));
    assert.equal(d.nodes.pdfButton.disabled,false);
    assert.equal(d.nodes.txtButton.disabled,false);
  }
});
