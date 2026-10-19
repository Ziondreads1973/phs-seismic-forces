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

test('Contrato: PDF y TXT de entradas y fuerzas sin selectores ni JSON',()=>{
  assert.equal(scripts.length,2);
  for(const old of ['pdfLevel','txtLevel','printHost','pdfPreview','saveJson'])
    assert.doesNotMatch(html,new RegExp('id="'+old+'"'));
  assert.match(html,/id="globalReport"/);
  assert.match(html,/Guardar PDF global/);
  assert.match(html,/Descargar TXT</);
  assert.match(html,/@media print[\s\S]*?main\{display:block!important/);
});

test('Art. 87: pantalla global idéntica al contenido enviado a impresión',()=>{
  const d=mount();
  assert.equal(d.nodes.pdfButton.disabled,false);
  const f=new Intl.NumberFormat(undefined,{minimumFractionDigits:1,maximumFractionDigits:1,useGrouping:false}).format(1012.5);
  assert.ok(d.nodes.globalReport.innerHTML.includes(f));
  assert.match(d.nodes.globalReport.innerHTML,/Datos y factores de diseño/);
  assert.match(d.nodes.globalReport.innerHTML,/Fuerzas sísmicas finales/);
  assert.doesNotMatch(d.nodes.globalReport.innerHTML,/Ecuaciones y resultados principales/);
  d.nodes.pdfButton.events.click();
  assert.equal(d.saved.printed,1);
  assert.equal(d.saved.printedView,d.nodes.globalReport.innerHTML);
});

test('TXT: desarrollo completo de factores, sustituciones y fuerzas finales',()=>{
  const d=mount();
  d.nodes.txtButton.events.click();
  assert.equal(d.saved.files.length,1);
  assert.match(d.saved.files[0],/_detallado\.txt$/);
  for(const section of ['1. ANTECEDENTES','2. PARÁMETROS Y FACTORES DE DISEÑO','3. DESARROLLO DEL CÁLCULO','4. FUERZAS SÍSMICAS FINALES'])
    assert.ok(d.saved.payload.includes(section));
  for(const fragment of ['Frecuencia X','1000 kgf','Kh ubicación','Kh,X','Ex =','Ey =','Ez =','Ex,a =','Ey,a =','Ez,a ='])
    assert.ok(d.saved.payload.includes(fragment),fragment);
});

test('Art. 88: tabla IE/R a la vista y fila del equipo destacada',()=>{
  const d=mount({norm:'88',vertical:'flex',loc88:'floor'});
  assert.equal(d.nodes.pdfButton.disabled,false);
  assert.match(html,/<section class="reference-block" aria-label="Tabla 4 de referencia"/);
  assert.match(html,/<tr class="applied"><td>Equipo eléctrico general/);
  assert.doesNotMatch(html,/<details><summary>Ver Tabla 4/);
  assert.match(d.nodes.globalReport.innerHTML,/IE \(Tabla 4\)/);
  assert.match(d.nodes.globalReport.innerHTML,/R \(Tabla 4\)/);
  assert.match(d.nodes.globalReport.innerHTML,/A0\/g/);
  assert.match(d.nodes.txtPreview.textContent,/Fb =/);
  assert.match(d.nodes.txtPreview.textContent,/Sa,máx\/g/);
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

test('FS-06-C02: entradas conservan exactamente los decimales introducidos',()=>{
  for(const [locale,decimal] of [['es-CL',','],['en-US','.']]){
    const d=mount({norm:'87',w:'1000.125',ie:'1.20',fx:'29.99',fy:'30'},locale);
    const content=d.nodes.globalReport.innerHTML,txt=d.nodes.txtPreview.textContent;
    for(const label of ['1000'+decimal+'125 kgf','1'+decimal+'20','29'+decimal+'99 Hz','30 Hz']){
      assert.ok(content.includes(label),'Pantalla: '+label);
      assert.ok(txt.includes(label),'TXT: '+label);
    }
    assert.doesNotMatch(content,/29[.,]99\s*Hz[^]*30[.,]00 Hz/);
    assert.match(txt,/DESARROLLO DEL CÁLCULO/);
  }
});

test('FS-06-C02: factores normativos sin ceros sobrantes, fuerzas con un decimal fijo',()=>{
 const c=mount({norm:'2369',w:'1000',loc2369:'elevated',height:'4.25',zk:'2.50'});
 assert.match(c.nodes.globalReport.innerHTML,/Altura H/);
 assert.match(c.nodes.globalReport.innerHTML,/Rp/);
 assert.match(c.nodes.txtPreview.textContent,/ak\/g/);
 assert.match(c.nodes.txtPreview.textContent,/Cp sin limitar/);
 assert.match(c.nodes.txtPreview.textContent,/Cmin =/);
 const e=mount({norm:'88',w:'1000',vertical:'rigid'});
 assert.match(e.nodes.globalReport.innerHTML,/IE \(Tabla 4\)/);
 assert.match(e.nodes.globalReport.innerHTML,/R \(Tabla 4\)/);
 assert.match(e.nodes.globalReport.innerHTML,/A0\/g/);
 assert.match(e.nodes.txtPreview.textContent,/Sa,máx\/g/);
 assert.match(e.nodes.txtPreview.textContent,/Fb =/);
 assert.match(e.nodes.txtPreview.textContent,/Ex =/);
 const val=new Intl.NumberFormat(undefined,{minimumFractionDigits:1,maximumFractionDigits:1,useGrouping:false}).format(360);
 assert.ok(e.nodes.globalReport.innerHTML.includes(val));
 assert.ok(e.nodes.txtPreview.textContent.includes(val));
});

test('FS-06-C02: pantalla y TXT contienen el mismo valor de cada fuerza',()=>{
 for(const norm of ['2369','87','88']){
  const d=mount({norm,w:'2000',fx:'25',fy:'30'});
  const preview=d.nodes.globalReport.innerHTML;
  const txt=d.nodes.txtPreview.textContent;
  for(const line of txt.split('\n').filter(x=>/^E[xyz] \| /.test(x))){
   const values=line.split('|').slice(1).map(x=>x.trim());
   for(const value of values)assert.ok(preview.includes(value),norm+': '+line);
  }
  assert.match(txt,/3\. DESARROLLO DEL CÁLCULO/);
  assert.match(txt,/Ex =/);
  assert.match(txt,/Ey =/);
  assert.match(txt,/Ez =/);
 }
});

test('FS-06-C02: Tabla 4 sin ceros añadidos en referencias, coma y punto decimal',()=>{
 for(const [locale,decimal] of [['es-CL',','],['en-US','.']]){
  const d=mount({norm:'88'},locale);
  const numbers=d.localNumbers.map(x=>x.textContent);
  assert.ok(numbers.includes('1'));
  assert.ok(numbers.includes('1'+decimal+'5'));
  assert.ok(numbers.includes('0'+decimal+'5'));
  assert.ok(!numbers.includes('1'+decimal+'00'));
  assert.ok(!numbers.includes('1'+decimal+'50'));
 }
});


test('TXT NCh2369: ruta basal y elevada contienen límites, Rp, vertical y amplificación',()=>{
 for(const data of [{loc2369:'ground',duct:'ductile'},{loc2369:'elevated',height:'8.50',zk:'4.25',duct:'nonductile'}]){
   const d=mount({norm:'2369',w:'1000',...data});
   const txt=d.nodes.txtPreview.textContent;
   for(const fragment of ['Ar/g','ak/g','Cp sin limitar','Cmin','Cmax','C horizontal',
     'Cv','Kp','Rp','Ex =','Ey =','Ez =','Ex,a =','Ey,a =','Ez,a ='])
     assert.ok(txt.includes(fragment),fragment);
   if(data.loc2369==='elevated')assert.match(txt,/Zk\/H/);
   else assert.match(txt,/Zk = 0/);
   assert.ok(!d.nodes.globalReport.innerHTML.includes('Cp sin limitar'));
   assert.doesNotMatch(d.nodes.globalReport.innerHTML,/Desarrollo del cálculo/);
 }
});

test('TXT Art87: factores por eje, ubicación, sustituciones y demanda vertical',()=>{
 const d=mount({norm:'87',w:'1000',fx:'25',fy:'35',loc87:'floor'});
 const txt=d.nodes.txtPreview.textContent;
 for(const part of ['Kh,X','Kh,Y','Kv ubicación','Coeficiente Cx','Coeficiente Cy',
    'fX = 25 Hz','fY = 35 Hz','Ex =','Ey =','Ez =',
    'Ex,a =','Ey,a =','Ez,a ='])
  assert.ok(txt.includes(part),part);
 const nf=n=>new Intl.NumberFormat(undefined,{minimumFractionDigits:1,maximumFractionDigits:1,useGrouping:false}).format(n);
 for(const v of [1215,900,504,1518.75,1125])
  assert.ok(txt.includes(nf(v)),nf(v));
 assert.doesNotMatch(d.nodes.globalReport.innerHTML,/Coeficiente Cx|Kh ubicación/);
});

test('TXT Art88: desarrollo espectral y ambas hipótesis verticales',()=>{
 for(const vertical of ['rigid','flex']){
  const d=mount({norm:'88',vertical,w:'1000',loc88:'floor'});
  const txt=d.nodes.txtPreview.textContent;
  for(const part of ['Fb =','Sa,máx/g','Kh ubicación','Kv ubicación','R (Tabla 4)',
    'Ex =','Ey =','Ez =','Ex,a =','Ey,a =','Ez,a ='])
    assert.ok(txt.includes(part),part);
  assert.ok(txt.includes(vertical==='rigid'?'V1':'V2'));
  if(vertical==='rigid')assert.doesNotMatch(txt,/Ez = 0[.,]72/);
  else assert.match(txt,/Ez = 0[.,]72/);
  assert.doesNotMatch(d.nodes.globalReport.innerHTML,/Fb =|Desarrollo del cálculo/);
 }
});

test('TXT localización decimal aplica también a constantes y sustituciones',()=>{
 for(const locale of ['es-CL','en-US']){
  const d=mount({norm:'87',w:'1000',fx:'25',fy:'25',loc87:'floor'},locale);
  const txt=d.nodes.txtPreview.textContent;
  const sep=locale==='en-US'?'.':',';
  assert.ok(txt.includes('0'+sep+'6'),locale);
  assert.ok(txt.includes('1'+sep+'25'),locale);
  assert.ok(txt.includes('1'+sep+'35'),locale);
  assert.ok(txt.includes('1518'+sep+'8'),locale);
  assert.doesNotMatch(txt,locale==='en-US'?/\b0,60\b/:/\b0\.60\b/);
  assert.ok(!txt.includes('1'+(sep===','?'.':',')+'25 · Ex'));
 }
});
