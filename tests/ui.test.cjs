'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../dist/PHS Seismic Forces.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);

const builtSeparator=JSON.parse(html.match(/PHSSeismicReport\.setDecimalSeparator\(("[.,]")\);/)[1]);
function mount(changes={},locale,decimal='.') {
  const start={norm:'87',w:'1000',fx:'25',fy:'35',loc87:'ground',
    cat:'III',zone:'2',soil:'C',equipment:'electrical-mechanical',duct:'7.3.2',
    loc2369:'ground',height:'',zk:'',loc88:'ground',vertical:'',...changes};
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
  const localeIntl={NumberFormat:function(requested,options){return new baseIntl(requested===undefined?locale:requested,options)}};
  class BlobCapture{constructor(parts){saved.payload=parts.join('')}}
  const context=vm.createContext({document,window:{print(){
    saved.printed++;saved.printedView=element('globalReport').innerHTML;
  }},URL:{createObjectURL(){return'blob://test'},revokeObjectURL(){}},
    Blob:BlobCapture,setTimeout(){},console,Intl:localeIntl});
  for(const script of scripts){
    // Simula un HTML generado en PCs con punto/coma aunque las pruebas corran en otro equipo.
    const loaded=decimal===null?script:script.replace(
      /PHSSeismicReport\.setDecimalSeparator\("[.,]"\);/,
      'PHSSeismicReport.setDecimalSeparator('+JSON.stringify(decimal)+');'
    );
    vm.runInContext(loaded,context,{timeout:3000});
  }
  function set(id,value,event='input'){element(id).value=value;element(id).events[event]?.()}
  return {nodes,saved,set,localNumbers};
}

test('Contrato: PDF y TXT de entradas y fuerzas sin selectores ni JSON',()=>{
  assert.equal(scripts.length,4);
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

test('TXT: fórmulas con resultados consecutivos, sin sustituciones numéricas',()=>{
  const d=mount();
  d.nodes.txtButton.events.click();
  assert.equal(d.saved.files.length,1);
  assert.match(d.saved.files[0],/_detallado\.txt$/);
  for(const section of ['1. ANTECEDENTES','2. CÁLCULO DE FUERZAS SÍSMICAS','3. FUERZAS PARA ANCLAJES','4. RESUMEN DE RESULTADOS'])
    assert.ok(d.saved.payload.includes(section));
  for(const fragment of ['Frecuencia X','1000 kgf','Kh ubicación','Kh,X','Ex =','Ey =','Ez =','Ex,a =','Ey,a =','Ez,a ='])
    assert.ok(d.saved.payload.includes(fragment),fragment);
});

test('NCh2369: visibilidad y significado de H y Zk según ubicación',()=>{
 const d=mount({norm:'2369'});
 assert.equal(d.nodes.heightGroup.hidden,true);
 assert.match(html,/Para instalación basal se adopta Zₖ = 0/);
 d.set('loc2369','elevated');
 assert.equal(d.nodes.heightGroup.hidden,false);
 d.set('height','8');
 d.set('zk','0');
 assert.equal(d.nodes.pdfButton.disabled,false);
 assert.match(d.nodes.globalReport.innerHTML,/Altura H/);
 assert.match(d.nodes.globalReport.innerHTML,/Nivel Zk/);
 d.set('loc2369','modular');
 assert.equal(d.nodes.heightGroup.hidden,true);
 assert.equal(d.nodes.pdfButton.disabled,false);
});
test('Art. 87: solo se solicitan frecuencias horizontales fX y fY',()=>{
 assert.match(html,/<label for="fx">Frecuencia horizontal fX/);
 assert.match(html,/<label for="fy">Frecuencia horizontal fY/);
 assert.doesNotMatch(html,/(?:id|for)="f[zZ]"/);
 const d=mount({norm:'87'});
 assert.equal(d.nodes.pdfButton.disabled,false);
 assert.match(d.nodes.txtPreview.textContent,/Kh,X/);
 assert.match(d.nodes.txtPreview.textContent,/Kh,Y/);
});
test('Art. 87: IE=1 fijo y sin campo editable',()=>{
 const d=mount({norm:'87'});
 assert.doesNotMatch(html,/id="ie"/);
 assert.match(d.nodes.globalReport.innerHTML,/IE \(Tabla 4\)/);
 assert.match(d.nodes.txtPreview.textContent,/IE \(Tabla 4\)/);
});
test('Art. 88: exige seleccionar modelo vertical',()=>{
 const d=mount({norm:'88'});
 assert.equal(d.nodes.pdfButton.disabled,true);
 assert.equal(d.nodes.txtButton.disabled,true);
 d.set('vertical','rigid');
 assert.equal(d.nodes.pdfButton.disabled,false);
 d.set('vertical','');
 assert.equal(d.nodes.pdfButton.disabled,true);
 assert.equal(d.nodes.txtButton.disabled,true);
 assert.match(html,/<option value="" selected>Seleccionar comportamiento vertical<\/option>/);
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

test('Pruebas unitarias: simulación de punto y coma sin agrupación',()=>{
 for(const locale of ['es-CL','en-US','de-DE']){
  for(const decimal of ['.',',']){
   const d=mount({w:'1000000',fx:'35',fy:'35'},locale,decimal);
   const output='750000'+decimal+'0';
   assert.ok(d.nodes.globalReport.innerHTML.includes(output),locale+' '+decimal);
   assert.ok(d.nodes.txtPreview.textContent.includes(output),locale+' '+decimal);
   d.nodes.pdfButton.events.click();
   assert.ok(d.saved.printedView.includes(output));
   d.nodes.txtButton.events.click();
   assert.ok(d.saved.payload.includes(output));
   assert.doesNotMatch(d.saved.payload,/750[., ]000/);
   assert.equal(d.nodes.pdfButton.disabled,false);
  }
 }
});

test('FS-06-C02: entradas conservan decimales en las simulaciones',()=>{
 for(const locale of ['es-CL','en-US']){
  for(const decimal of ['.',',']){
   const d=mount({norm:'87',w:'1000.125',fx:'29.99',fy:'30'},locale,decimal);
   const content=d.nodes.globalReport.innerHTML,txt=d.nodes.txtPreview.textContent;
   for(const label of ['1000'+decimal+'125 kgf','29'+decimal+'99 Hz','30 Hz']){
    assert.ok(content.includes(label),'Pantalla: '+label);
    assert.ok(txt.includes(label),'TXT: '+label);
   }
   assert.doesNotMatch(content,/29[.,]99\s*Hz[^]*30[.,]00 Hz/);
   assert.match(txt,/CÁLCULO DE FUERZAS SÍSMICAS/);
  }
 }
});

test('FS-06-C02: factores normativos sin ceros sobrantes, fuerzas con un decimal fijo',()=>{
 const c=mount({norm:'2369',w:'1000',loc2369:'elevated',height:'4.25',zk:'2.50'});
 assert.match(c.nodes.globalReport.innerHTML,/Altura H/);
 assert.match(c.nodes.globalReport.innerHTML,/Rp/);
 assert.match(c.nodes.txtPreview.textContent,/ak\/g/);
 assert.match(c.nodes.txtPreview.textContent,/Cp =/);
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
  const d=mount({norm,w:'2000',fx:'25',fy:'30',vertical:'rigid'});
  const preview=d.nodes.globalReport.innerHTML;
  const txt=d.nodes.txtPreview.textContent;
  const finalBlock=txt.split('4. RESUMEN DE RESULTADOS')[1];
  const rows=finalBlock.split('\n').filter(x=>/^E[xyz]\s+[\d.,]+\s+[\d.,]+/.test(x));
  assert.equal(rows.length,3,norm);
  for(const line of rows){
   const parts=line.trim().split(/\s+/).slice(1);
   assert.equal(parts.length,2,norm+': '+line);
   for(const value of parts)assert.ok(preview.includes(value),norm+': '+line);
  }
  assert.match(txt,/2\. CÁLCULO DE FUERZAS SÍSMICAS/);
  assert.match(txt,/Ex =/);
  assert.match(txt,/Ey =/);
  assert.match(txt,/Ez =/);
 }
});

test('FS-06-C02: tabla estática admite formato inyectado en pruebas',()=>{
 for(const locale of ['es-CL','en-US']){
  for(const decimal of ['.',',']){
   const d=mount({norm:'88'},locale,decimal);
   const numbers=d.localNumbers.map(x=>x.textContent);
   assert.ok(numbers.includes('1'));
   assert.ok(numbers.includes('1'+decimal+'5'));
   assert.ok(numbers.includes('0'+decimal+'5'));
   assert.ok(!numbers.includes('1'+decimal+'00'));
   assert.ok(!numbers.includes('1'+decimal+'50'));
  }
 }
});

test('TXT NCh2369: ruta basal y elevada contienen límites, Rp, vertical y amplificación',()=>{
 for(const data of [{loc2369:'ground',duct:'7.3.2'},{loc2369:'elevated',height:'8.50',zk:'4.25',duct:'7.3.3'}]){
   const d=mount({norm:'2369',w:'1000',...data});
   const txt=d.nodes.txtPreview.textContent;
   for(const fragment of ['Ar/g','ak/g','Cp =','Cmin','Cmax','Ch =',
     'Cv','Kp','Rp','Ex =','Ey =','Ez =','Ex,a =','Ey,a =','Ez,a ='])
     assert.ok(txt.includes(fragment),fragment);
   if(data.loc2369==='elevated')assert.match(txt,/Zk\/H/);
   else assert.doesNotMatch(txt,/Zk\/H/);
   assert.ok(!d.nodes.globalReport.innerHTML.includes('Cp sin limitar'));
   assert.doesNotMatch(d.nodes.globalReport.innerHTML,/Desarrollo del cálculo/);
 }
});

test('TXT Art87: factores por eje, ubicación y resultados sin sustituciones',()=>{
 const d=mount({norm:'87',w:'1000',fx:'25',fy:'35',loc87:'floor'});
 const txt=d.nodes.txtPreview.textContent;
 for(const part of ['Kh,X','Kh,Y','Kv ubicación','Cx =','Cy =',
    '25 Hz','35 Hz','Cx =','Cy =','Ex =','Ey =','Ez =',
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
  if(vertical==='rigid')assert.doesNotMatch(txt,/Cv = 0[.,]72 ·/);
  else assert.match(txt,/Cv = 0[.,]72 ·/);
  assert.doesNotMatch(d.nodes.globalReport.innerHTML,/Fb =|Desarrollo del cálculo/);
 }
});

test('TXT: compatibilidad del formateador con punto y coma simulados',()=>{
 for(const locale of ['es-CL','en-US']){
  for(const sep of ['.',',']){
   const d=mount({norm:'87',w:'1000',fx:'25',fy:'25',loc87:'floor'},locale,sep);
   const txt=d.nodes.txtPreview.textContent;
   assert.ok(txt.includes('0'+sep+'6'),locale);
   assert.ok(txt.includes('1'+sep+'25'),locale);
   assert.ok(txt.includes('1'+sep+'35'),locale);
   assert.ok(txt.includes('1518'+sep+'8'),locale);
   assert.doesNotMatch(txt,sep==='.'?/\b0,60\b/:/\b0\.60\b/);
  }
 }
});

test('FS-06-C04: NCh2369 fórmula y resultado inmediatos, sin reemplazo de valores',()=>{
  for(const p of [{loc2369:'ground',duct:'7.3.2'},{loc2369:'elevated',duct:'7.3.3',height:'6.5',zk:'3.25'}]){
    const d=mount({norm:'2369',w:'1000',...p});
    const txt=d.nodes.txtPreview.textContent;
    for(const expr of [
      /ak\/g = I · \(Ar\/g\) · S(?: · \(1 \+ 2 · Zk\/H\))?\nak\/g = [0-9.,]+/,
      /Cp = \(ak\/g\) · Kp \/ Rp\nCp = [0-9.,]+/,
      /Cmin = 0[.,]7 · I · \(Ar\/g\) · S\nCmin = [0-9.,]+/,
      /Cmax = 3 · I · \(Ar\/g\) · S\nCmax = [0-9.,]+/,
      /Ch = mín\(Cmax; máx\(Cmin; Cp\)\)\nCh = [0-9.,]+/,
      /Cv = kv · I · \(Ar\/g\) · S\nCv = [0-9.,]+/,
      /Ex = Ch · W\nEx = [0-9.,]+ kgf/,
      /Ez,a = Ez\nEz,a = [0-9.,]+ kgf/
    ])assert.match(txt,expr);
    assert.match(txt,/Condición controlante: (Cp|Cmin|Cmax)/);
    assert.doesNotMatch(txt,/^\s+= /m);
    assert.doesNotMatch(d.nodes.globalReport.innerHTML,/Condición controlante|Ch =/);
  }
});
test('FS-06-C04: Art87 y Art88 tienen fórmula y resultado consecutivos',()=>{
  const cases=[
    {norm:'87',w:'1000',fx:'25',fy:'35',loc87:'floor'},
    {norm:'88',w:'1000',vertical:'rigid',loc88:'floor'},
    {norm:'88',w:'1000',vertical:'flex',loc88:'floor'}
  ];
  for(const v of cases){
    const d=mount(v);
    const txt=d.nodes.txtPreview.textContent;
    for(const reg of [/Ex = C[ hx]?\w* · W\nEx = [0-9.,]+ kgf/,
      /Ey = C[ hy]?\w* · W\nEy = [0-9.,]+ kgf/,
      /Ez = C[ vz] · W\nEz = [0-9.,]+ kgf/,
      /Ex,a = Factor H · Ex\nEx,a = [0-9.,]+ kgf/]){
      assert.match(txt,reg);
    }
    assert.doesNotMatch(txt,/^\s+= /m);
    assert.doesNotMatch(txt,/^  \d+[.,]\d+ · \d+/m);
    assert.doesNotMatch(d.nodes.globalReport.innerHTML,/2\.1\. Aceleración|Factor H =|Fb =/);
  }
});
test('FS-06-C05: hasta tres decimales y sin ceros sobrantes en NCh2369',()=>{
 for(const locale of ['es-CL','en-US']){
  for(const decimal of ['.',',']){
   for(const weight of ['1000','1000000']){
    const d=mount({norm:'2369',w:weight},locale,decimal);
    const txt=d.nodes.txtPreview.textContent;
    const expected={'ak/g':'0.529','Cp':'0.388','Cmin':'0.37','Cmax':'1.588','Ch':'0.388','Cv':'0.635'};
    for(const [key,value] of Object.entries(expected)){
     const actual=value.replace('.',decimal);
     assert.ok(txt.includes(key+' = '+actual+'\n')||txt.includes(key+' = '+actual+'\r\n'),
       key+' = '+actual+' no aparece para '+locale+' peso '+weight);
    }
    const ex=new Intl.NumberFormat('en-US',{
     minimumFractionDigits:1,maximumFractionDigits:1,useGrouping:false
    }).format(Number(weight)*.38808).replace('.',decimal);
    assert.ok(txt.includes('Ex = '+ex+' kgf'),'Fuerza sin redondeo intermedio');
    assert.match(txt,/Condición controlante: Cp/);
   }
  }
 }
});

test('FS-06-C05: coeficientes de todas las rutas con máximo tres decimales',()=>{
 for(const locale of ['es-CL','en-US']){
  for(const params of [
   {norm:'2369',w:'1000',loc2369:'elevated',height:'6',zk:'2'},
   {norm:'87',w:'1000',fx:'25',fy:'35',loc87:'floor'},
   {norm:'88',w:'1000',vertical:'rigid',loc88:'floor'},
   {norm:'88',w:'1000',vertical:'flex',loc88:'floor'}
  ]){
   const d=mount(params,locale);
   const txt=d.nodes.txtPreview.textContent;
   const coef=[...txt.matchAll(/^(?:ak\/g|Cp|Cmin|Cmax|Ch|Cv|Cx|Cy|Cz|Fb|Sa,máx\/g) = (\d+(?:[.,]\d+)?)$/gm)];
   assert.ok(coef.length>=2,params.norm+' no presenta coeficientes');
   for(const match of coef){
    const fraction=(match[1].split(/[.,]/)[1]||'');
    assert.ok(fraction.length<=3,'Demasiados decimales: '+match[0]);
    assert.ok(!fraction.endsWith('0'),'Cero innecesario: '+match[0]);
   }
   const inputs=d.nodes.globalReport.innerHTML;
   assert.equal(d.nodes.pdfButton.disabled,false);
   assert.ok(inputs.includes('Fuerzas sísmicas finales'));
   assert.doesNotMatch(txt,/^\s+= /m);
  }
 }
});

test('NCh2369: aviso §5.8 solo en ubicación basal directa; no bloquea cálculo',()=>{
 const d=mount({norm:'2369',loc2369:'ground'});
 assert.equal(d.nodes.scope58Note.hidden,false);
 assert.equal(d.nodes.pdfButton.disabled,false);
 assert.match(d.nodes.globalReport.innerHTML,/NCh2369 §5\.8/);
 assert.match(d.nodes.txtPreview.textContent,/NCh2369 §5\.8/);
 d.set('loc2369','modular');
 assert.equal(d.nodes.scope58Note.hidden,true);
 assert.doesNotMatch(d.nodes.globalReport.innerHTML,/§5\.8/);
 assert.doesNotMatch(d.nodes.txtPreview.textContent,/§5\.8/);
 d.set('loc2369','elevated');
 assert.equal(d.nodes.scope58Note.hidden,true);
});
test('NCh2369: TXT y PDF declaran anclajes solo horizontales y vertical sin factor',()=>{
 for(const duct of ['7.3.2','7.3.3']){
  const d=mount({norm:'2369',duct,loc2369:'ground'});
  const htmlReport=d.nodes.globalReport.innerHTML;
  const txt=d.nodes.txtPreview.textContent;
  assert.match(htmlReport,/Amplificación de anclajes solo en Ex\/Ey/);
  assert.match(txt,/Amplificación de anclajes solo en Ex\/Ey/);
  assert.match(txt,/Ez,a = Ez\nEz,a =/);
  assert.equal(d.nodes.pdfButton.disabled,false);
 }
});


test('La clasificación principal muestra exactamente las tres rutas aprobadas',()=>{
 assert.match(html,/<select id="duct">/);
 assert.doesNotMatch(html,/<select id="duct"[^>]*\bsize=/);
 assert.doesNotMatch(html,/anchor-route-list/);
 for(const label of ['Sistema dúctil que cumple §8.5',
  'Sistema de materiales dúctiles que no cumple §8.5',
  'Sistema de materiales no dúctiles'])assert.ok(html.includes(label));
 assert.doesNotMatch(html,/id="anchorDiameter"|id="anchorFree"|id="anchorThread"/);
});
test('Asistente: estado inicial pendiente y botón sin aplicación',()=>{
 const d=mount({norm:'2369'});
 assert.match(d.nodes.anchorGuideStatus.textContent,/Clasificación pendiente/);
 assert.equal(d.nodes.anchorApply.disabled,true);
 assert.equal(d.nodes.anchorChecks.hidden,true);
 assert.match(d.nodes.globalReport.innerHTML,/Asistente de anclajes/);
 assert.match(d.nodes.txtPreview.textContent,/ASISTENTE DE CLASIFICACIÓN DE ANCLAJES/);
 assert.equal(d.nodes.pdfButton.disabled,false);
});
test('Asistente: material no dúctil sugiere ruta 7.3.3 y la aplica a las fuerzas',()=>{
 const d=mount({norm:'2369',duct:'7.3.2'});
 const before=d.nodes.globalReport.innerHTML.match(/<h2>2\. Fuerzas sísmicas finales<\/h2>([\s\S]*?)<p class="report-foot"/)[1];
 d.set('anchorMat','nonductile');
 assert.match(d.nodes.anchorGuideStatus.textContent,/Clasificación diferente/);
 assert.equal(d.nodes.anchorApply.disabled,false);
 assert.equal(d.nodes.duct.value,'7.3.2');
 d.nodes.anchorApply.events.click();
 assert.equal(d.nodes.duct.value,'7.3.3');
 assert.match(d.nodes.globalReport.innerHTML,/Materiales no dúctiles/);
 assert.match(d.nodes.txtPreview.textContent,/§7\.3\.3/);
 const after=d.nodes.globalReport.innerHTML.match(/<h2>2\. Fuerzas sísmicas finales<\/h2>([\s\S]*?)<p class="report-foot"/)[1];
 assert.notEqual(before,after);
});
test('Asistente: con material dúctil y un NO cumple propone §7.3.2',()=>{
 const d=mount({norm:'2369',duct:'7.3.3'});
 d.set('anchorMat','ductile');
 assert.equal(d.nodes.anchorChecks.hidden,false);
 d.set('anchorDetail','yes');d.set('anchorShear','no');
 d.set('anchorFriction','yes');d.set('anchorCapacity','yes');d.set('anchorFoundation','yes');
 assert.match(d.nodes.anchorGuideStatus.textContent,/§7\.3\.2/);
 d.nodes.anchorApply.events.click();
 assert.equal(d.nodes.duct.value,'7.3.2');
 assert.equal(d.nodes.pdfButton.disabled,false);
});
test('Asistente: todos Cumple propone §8.5 y oculta fuerzas de anclajes',()=>{
 const d=mount({norm:'2369',duct:'7.3.2'});
 d.set('anchorMat','ductile');
 for(const id of ['anchorDetail','anchorShear','anchorFriction','anchorCapacity','anchorFoundation'])d.set(id,'yes');
 assert.match(d.nodes.anchorGuideStatus.textContent,/§8\.5/);
 d.nodes.anchorApply.events.click();
 assert.equal(d.nodes.duct.value,'8.5');
 assert.match(d.nodes.status.textContent,/Anclajes §8\.5: no calculados/);
 const page=d.nodes.globalReport.innerHTML;
 const txt=d.nodes.txtPreview.textContent;
 assert.match(page,/NO CALCULADO/);
 assert.match(txt,/Ex,a \/ Ey,a \/ Ez,a: NO CALCULADO/);
 assert.match(txt,/Ex\s+[0-9.,]+\s+NO CALCULADO/);
 assert.doesNotMatch(txt,/Factor H = 0[.,]7 · Rp/);
 assert.match(txt,/Ruta §8\.5: no implementada/);
 assert.equal(d.nodes.pdfButton.disabled,false);
 d.nodes.pdfButton.events.click();
 assert.equal(d.saved.printedView,page);
 d.nodes.txtButton.events.click();
 assert.match(d.saved.payload,/NO CALCULADO/);
});
test('Ruta §8.5 elegida manualmente no expone las fuerzas provisionales de §7.3.2',()=>{
 const d=mount({norm:'2369',duct:'8.5'});
 assert.equal(d.nodes.pdfButton.disabled,false);
 assert.match(d.nodes.globalReport.innerHTML,/NO CALCULADO/);
 assert.match(d.nodes.txtPreview.textContent,/§8\.5: anclajes no calculados/);
 assert.match(d.nodes.globalReport.innerHTML,/Fuerzas sísmicas finales/);
});
test('Asistente: respuestas No verificado mantienen sugerencia pendiente',()=>{
 const d=mount({norm:'2369'});
 d.set('anchorMat','ductile');
 d.set('anchorDetail','yes');d.set('anchorShear','yes');
 d.set('anchorFriction','yes');d.set('anchorCapacity','yes');
 assert.match(d.nodes.anchorGuideStatus.textContent,/Clasificación pendiente/);
 assert.equal(d.nodes.anchorApply.disabled,true);
});
test('Asistente: material bajo mínimo general no permite aplicar',()=>{
 const d=mount({norm:'2369'});
 d.set('anchorMat','invalid');
 assert.match(d.nodes.anchorGuideStatus.textContent,/mínimo general/);
 assert.equal(d.nodes.anchorApply.disabled,true);
});
test('Asistente: respuestas informativas no alteran fuerzas antes de aplicar ruta',()=>{
 const d=mount({norm:'2369',duct:'7.3.2'});
 const table=()=>d.nodes.globalReport.innerHTML.match(/<h2>2\. Fuerzas sísmicas finales<\/h2>([\s\S]*?)<p class="report-foot"/)[1];
 const before=table();
 d.set('anchorMat','ductile');d.set('anchorDetail','yes');d.set('anchorShear','no');
 assert.equal(table(),before);
});
test('Asistente: no aparece en reportes CNE',()=>{
 for(const norm of ['87','88']){
  const d=mount({norm,vertical:'rigid'});
  assert.doesNotMatch(d.nodes.globalReport.innerHTML,/Asistente de anclajes/);
  assert.doesNotMatch(d.nodes.txtPreview.textContent,/ASISTENTE DE CLASIFICACIÓN DE ANCLAJES/);
 }
});

test('Formato explícito: magnitudes grandes sin grupos en los tres destinos',()=>{
 for(const locale of ['es-CL','en-US','de-DE']){
  for(const decimal of ['.',',']){
   const W='123456789.125';
   const d=mount({norm:'87',w:W,fx:'35',fy:'35',loc87:'ground'},locale,decimal);
   const nf=n=>new Intl.NumberFormat('en-US',{
    minimumFractionDigits:1,maximumFractionDigits:1,useGrouping:false
   }).format(n).replace('.',decimal);
   const input='123456789'+decimal+'125 kgf';
   const result=nf(123456789.125*.75);
   for(const content of [d.nodes.globalReport.innerHTML,d.nodes.txtPreview.textContent]){
    assert.ok(content.includes(input),'Entrada no preservada: '+locale);
    assert.ok(content.includes(result),'Resultado no configurado: '+locale);
    assert.doesNotMatch(content,/123[., ]456[., ]789/);
    assert.doesNotMatch(content,/92[., ]592[., ]591/);
   }
   d.nodes.pdfButton.events.click();
   assert.ok(d.saved.printedView.includes(result));
   d.nodes.txtButton.events.click();
   assert.ok(d.saved.payload.includes(input));
   assert.ok(d.saved.payload.includes(result));
   assert.doesNotMatch(d.saved.payload,/123[., ]456[., ]789/);
   assert.equal(d.nodes.pdfButton.disabled,false);
  }
 }
});

test('Constantes estáticas y resultados comparten formato en pruebas',()=>{
 for(const locale of ['es-CL','en-US']){
  for(const decimal of ['.',',']){
   const d=mount({norm:'88',vertical:'rigid',w:'2000000'},locale,decimal);
   assert.ok(d.localNumbers.some(e=>e.textContent==='0'+decimal+'5'));
   const expected=new Intl.NumberFormat('en-US',{
    minimumFractionDigits:1,maximumFractionDigits:1,useGrouping:false
   }).format(2000000*.36).replace('.',decimal);
   assert.ok(d.nodes.globalReport.innerHTML.includes(expected));
   assert.ok(d.nodes.txtPreview.textContent.includes(expected));
   assert.doesNotMatch(d.nodes.globalReport.innerHTML,/720[., ]000[., ]0/);
  }
 }
});

test('Formato inyectado en pruebas: mismas magnitudes, punto y coma',()=>{
 const params={norm:'87',w:'1000.125',fx:'25',fy:'25'};
 const point=mount(params,'es-CL','.');
 const comma=mount(params,'en-US',',');
 assert.ok(point.nodes.globalReport.innerHTML.includes('1000.125 kgf'));
 assert.ok(comma.nodes.globalReport.innerHTML.includes('1000,125 kgf'));
 assert.ok(point.nodes.txtPreview.textContent.includes('0.6'));
 assert.ok(comma.nodes.txtPreview.textContent.includes('0,6'));
 assert.equal(point.nodes.pdfButton.disabled,false);
 assert.equal(comma.nodes.pdfButton.disabled,false);
 assert.doesNotMatch(html,/id="decimalFormat"/);
});

test('HTML fija el punto sin depender del navegador',()=>{
 assert.match(html,/PHSSeismicReport\.setDecimalSeparator\("[.,]"\);/);
 const d=mount({norm:'88',vertical:'rigid',w:'12345.125'},'es-CL',null);
 assert.ok(d.nodes.globalReport.innerHTML.includes('12345'+builtSeparator+'125 kgf'));
 assert.doesNotMatch(html,/id="decimalFormat"/);
});
