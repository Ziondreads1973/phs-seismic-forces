/* PHS Fuerzas Sísmicas — UI y reportes, sin dependencias externas */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const motor=globalThis.PHSSeismicMotor;
let active=null,reports=null;
const display=(n,d=1)=>new Intl.NumberFormat(undefined,{minimumFractionDigits:d,maximumFractionDigits:d,useGrouping:false}).format(n);
const num=id=>$(id).value.trim()===''?NaN:Number($(id).value);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const force=n=>display(n,1)+' kgf';
const caption=(r)=>r.method==='NCh2369:2025-cap7'?'NCh2369:2025 · Capítulo 7':r.method==='CNE-Art87'?'Anexo Técnico CNE · Artículo 87':'Anexo Técnico CNE · Artículo 88';
const place=s=>({'ground':'Nivel basal / terreno','modular':'Sala modular con apoyo basal equivalente','elevated':'Estructura elevada','floor':'Piso superior de edificio hasta 3 pisos'})[s]||s;
// Los valores ingresados conservan sus decimales; las magnitudes calculadas
// nunca reciben redondeos intermedios, únicamente formato de visualización.
const decimalSeparator=new Intl.NumberFormat(undefined,{useGrouping:false})
  .formatToParts(1.1).find(x=>x.type==='decimal')?.value||'.';
const factor=n=>new Intl.NumberFormat(undefined,{maximumFractionDigits:12,useGrouping:false}).format(n);
function inputValue(id){
 const raw=$(id).value.trim();
 if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw))
   return raw.replace('.',decimalSeparator);
 return factor(Number(raw)); // Para notación exponencial válida en input[type=number]
}
function lineData(r){
 const a=[['Peso sísmico',inputValue('w')+' kgf']],f=[];
 if(r.method==='NCh2369:2025-cap7'){
  const p=r.inputs,k=r.factors;
  a.push(['Categoría',p.category],['Zona sísmica',String(p.zone)],['Suelo',p.soil],
   ['Clasificación equipo',({'electrical-mechanical':'Equipo eléctrico/mecánico','secondary-ductile':'Elemento secundario con componentes dúctiles','secondary-nonductile':'Elemento secundario no dúctil','other-specified':'Otro no especificado'})[p.equipment]],
   ['Sistema de anclaje',p.anchor==='ductile'?'Dúctil (§7.3.2)':'No dúctil (§7.3.3)'],
   ['Ubicación',place(p.location)]);
  if(p.location==='elevated')
   a.push(['Altura H',inputValue('height')+' m'],['Nivel Zk',inputValue('zk')+' m']);
  f.push(['I',factor(k.I)],['Rp',factor(k.Rp)]);
 }else if(r.method==='CNE-Art87'){
  const p=r.inputs;
  a.push(['IE',inputValue('ie')],['Frecuencia X',inputValue('fx')+' Hz'],
   ['Frecuencia Y',inputValue('fy')+' Hz'],['Ubicación',place(p.location)]);
 }else{
  const p=r.inputs,k=r.factors;
  a.push(['Clasificación','Celda metálica autosoportada'],['Ubicación',place(p.location)],
   ['Modelo vertical',p.vertical==='rigid'?'V1 — Rígido':'V2 — No rígido']);
  f.push(['IE (Tabla 4)',factor(k.IE)],['R (Tabla 4)',factor(k.R)],['A0/g',factor(k.A0_g)]);
 }
 return {inputs:a,factors:f};
}
function rowsForces(r){
 return [['Ex',r.structure.Ex,r.anchors.Ex],['Ey',r.structure.Ey,r.anchors.Ey],['Ez',r.structure.Ez,r.anchors.Ez]];
}
function htmlTable(data,forceMode=false){
 if(forceMode)return '<table><thead><tr><th>Acción</th><th>Estructura (kgf)</th><th>Anclajes (kgf)</th></tr></thead><tbody>'+
 data.map(x=>'<tr><td>'+esc(x[0])+'</td><td>'+display(x[1],1)+'</td><td>'+display(x[2],1)+'</td></tr>').join('')+'</tbody></table>';
 return '<table class="pairs"><tbody>'+data.map(x=>'<tr><td>'+esc(x[0])+'</td><td>'+esc(x[1])+'</td></tr>').join('')+'</tbody></table>';
}

/*
 * TXT auditable: ecuación simbólica seguida del resultado del motor.
 * Sin sustituciones numéricas ni cálculos paralelos en el reporte.
 *
 * Precisión de coeficientes calculados: mínimo cuatro cifras significativas
 * y precisión decimal cuya cota de redondeo representa como máximo
 * 0,01 kgf en la demanda asociada (hasta el límite de 15 decimales).
 * Esta tolerancia es exclusivamente de visualización (no del motor).
 */
function calculatedCoefficient(value,weight,sensitivity=1){
 if(value===0)return '0';
 const magnitude=Math.floor(Math.log10(Math.abs(value)));
 const minimumDecimals=Math.max(0,3-magnitude);
 const demand=Math.abs(weight*sensitivity);
 let decimals=Math.min(15,minimumDecimals);
 while(decimals<15 && 0.5*Math.pow(10,-decimals)*demand>0.01)decimals++;
 return new Intl.NumberFormat(undefined,{
   minimumFractionDigits:0,maximumFractionDigits:decimals,useGrouping:false
 }).format(value);
}
function normativeFactors(r){
 const k=r.factors;
 if(r.method==='NCh2369:2025-cap7')return [
  ['I',factor(k.I)],['Ar/g',factor(k.Ar_over_g)],['S',factor(k.S)],
  ['Kp',factor(k.Kp)],['Rp',factor(k.Rp)],['kv',factor(k.kv)]
 ];
 if(r.method==='CNE-Art87')return [
  ['Kh,X',factor(k.KhX)],['Kh,Y',factor(k.KhY)],['Kv',factor(k.Kv)],
  ['Kh ubicación',factor(k.location.horizontal)],['Kv ubicación',factor(k.location.vertical)],
  ['Factor anclajes H',factor(k.anchor_multiplier.horizontal)]
 ];
 return [
  ['IE (Tabla 4)',factor(k.IE)],['R (Tabla 4)',factor(k.R)],
  ['A0/g',factor(k.A0_g)],['Amortiguamiento (%)',factor(k.xi_pct)],
  ['Kh ubicación',factor(k.location.horizontal)],['Kv ubicación',factor(k.location.vertical)],
  ['Factor anclajes H',factor(k.anchor_multiplier.horizontal)]
 ];
}
function detailedEquations(r){
 const k=r.factors,p=r.inputs,W=r.weight_kgf,n=factor,final=force;
 const c=(x,m=1)=>calculatedCoefficient(x,W,m);
 const calc=[],anchors=[];
 const add=(arr,formula,result)=>arr.push(formula,result,'');
 if(r.method==='NCh2369:2025-cap7'){
  const elevated=p.location==='elevated';
  calc.push('2.1. Aceleración horizontal');
  add(calc,elevated?
   'ak/g = I · (Ar/g) · S · (1 + 2 · Zk/H)':
   'ak/g = I · (Ar/g) · S',
   'ak/g = '+c(k.ak_over_g,k.Kp/k.Rp*k.anchor_multiplier.horizontal));
  calc.push('2.2. Coeficiente horizontal');
  add(calc,'Cp = (ak/g) · Kp / Rp','Cp = '+c(k.Cp,k.anchor_multiplier.horizontal));
  calc.push('2.3. Límites del coeficiente horizontal');
  add(calc,'Cmin = '+n(.7)+' · I · (Ar/g) · S','Cmin = '+c(k.Cmin,k.anchor_multiplier.horizontal));
  add(calc,'Cmax = 3 · I · (Ar/g) · S','Cmax = '+c(k.Cmax,k.anchor_multiplier.horizontal));
  add(calc,'Ch = mín(Cmax; máx(Cmin; Cp))','Ch = '+c(k.structure.X,k.anchor_multiplier.horizontal));
  const controlling=k.Cp<=k.Cmin?'Cmin':k.Cp>=k.Cmax?'Cmax':'Cp';
  calc.push('Condición controlante: '+controlling,'');
  calc.push('2.4. Coeficiente sísmico vertical');
  add(calc,'Cv = kv · I · (Ar/g) · S','Cv = '+c(k.structure.Z,k.anchor_multiplier.vertical));
  calc.push('2.5. Fuerzas sísmicas de la estructura');
  add(calc,'Ex = Ch · W','Ex = '+final(r.structure.Ex));
  add(calc,'Ey = Ch · W','Ey = '+final(r.structure.Ey));
  add(calc,'Ez = Cv · W','Ez = '+final(r.structure.Ez));
  anchors.push('3.1. Amplificación horizontal ('+(p.anchor==='ductile'?'§7.3.2':'§7.3.3')+')');
  add(anchors,p.anchor==='ductile'?'Factor H = '+n(.7)+' · Rp':'Factor H = Rp',
   'Factor H = '+n(k.anchor_multiplier.horizontal));
  add(anchors,'Ex,a = Factor H · Ex','Ex,a = '+final(r.anchors.Ex));
  add(anchors,'Ey,a = Factor H · Ey','Ey,a = '+final(r.anchors.Ey));
  anchors.push('3.2. Componente vertical');
  add(anchors,'Ez,a = Ez','Ez,a = '+final(r.anchors.Ez));
 }else if(r.method==='CNE-Art87'){
  calc.push('2.1. Factores por frecuencia horizontal');
  add(calc,'Kh,X = Kh(fX)','Kh,X = '+n(k.KhX));
  add(calc,'Kh,Y = Kh(fY)','Kh,Y = '+n(k.KhY));
  calc.push('2.2. Coeficientes de diseño');
  add(calc,'Cx = '+n(.6)+' · IE · Kh,X · Kh ubicación','Cx = '+c(k.structure.X,k.anchor_multiplier.horizontal));
  add(calc,'Cy = '+n(.6)+' · IE · Kh,Y · Kh ubicación','Cy = '+c(k.structure.Y,k.anchor_multiplier.horizontal));
  add(calc,'Cz = '+n(.36)+' · IE · Kv · Kv ubicación','Cz = '+c(k.structure.Z));
  calc.push('2.3. Fuerzas sísmicas de la estructura');
  add(calc,'Ex = Cx · W','Ex = '+final(r.structure.Ex));
  add(calc,'Ey = Cy · W','Ey = '+final(r.structure.Ey));
  add(calc,'Ez = Cz · W','Ez = '+final(r.structure.Ez));
  anchors.push('3.1. Amplificación horizontal');
  anchors.push('Factor H = '+n(k.anchor_multiplier.horizontal),'');
  add(anchors,'Ex,a = Factor H · Ex','Ex,a = '+final(r.anchors.Ex));
  add(anchors,'Ey,a = Factor H · Ey','Ey,a = '+final(r.anchors.Ey));
  anchors.push('3.2. Componente vertical');
  add(anchors,'Ez,a = Ez','Ez,a = '+final(r.anchors.Ez));
 }else{
  const vertical=p.vertical;
  calc.push('2.1. Aceleración espectral máxima');
  add(calc,'Fb = ('+n(3.21)+' − '+n(.68)+' · ln(ξ)) / '+n(2.1156),
   'Fb = '+c(k.Fb,2.12*1.2*k.A0_g*k.location.horizontal*k.anchor_multiplier.horizontal/k.R));
  add(calc,'Sa,máx/g = '+n(2.12)+' · (A0/g) · Fb',
   'Sa,máx/g = '+c(k.Sa_over_g,1.2*k.location.horizontal*k.anchor_multiplier.horizontal/k.R));
  calc.push('2.2. Coeficiente sísmico horizontal');
  add(calc,'Ch = '+n(1.2)+' · IE · (Sa/g) · Kh ubicación / R',
   'Ch = '+c(k.structure.X,k.anchor_multiplier.horizontal));
  calc.push('2.3. Coeficiente sísmico vertical ('+(vertical==='rigid'?'V1 — rígido':'V2 — no rígido')+')');
  add(calc,vertical==='rigid'?
   'Cv = '+n(.36)+' · IE · Kv ubicación':
   'Cv = '+n(.72)+' · IE · (Sa/g) · Kv ubicación / R',
   'Cv = '+c(k.structure.Z));
  calc.push('2.4. Fuerzas sísmicas de la estructura');
  add(calc,'Ex = Ch · W','Ex = '+final(r.structure.Ex));
  add(calc,'Ey = Ch · W','Ey = '+final(r.structure.Ey));
  add(calc,'Ez = Cv · W','Ez = '+final(r.structure.Ez));
  anchors.push('3.1. Amplificación horizontal');
  anchors.push('Factor H = '+n(k.anchor_multiplier.horizontal),'');
  add(anchors,'Ex,a = Factor H · Ex','Ex,a = '+final(r.anchors.Ex));
  add(anchors,'Ey,a = Factor H · Ey','Ey,a = '+final(r.anchors.Ey));
  anchors.push('3.2. Componente vertical');
  add(anchors,'Ez,a = Ez','Ez,a = '+final(r.anchors.Ez));
 }
 return {calc,anchors};
}

function buildReports(r){
 const d=lineData(r),rows=rowsForces(r),name=caption(r);
 const head='<div class="report-kicker">PHS | INGENIERÍA ESTRUCTURAL</div>'+
   '<h1>FUERZAS SÍSMICAS DE DISEÑO</h1><p>'+esc(name)+'</p><hr>';
 const data=[...d.inputs,...d.factors];
 const summary='<h2>2. Fuerzas sísmicas finales</h2>'+htmlTable(rows,true);
 const globalHtml=head+'<h2>1. Datos y factores de diseño</h2>'+htmlTable(data)+summary+
  '<p class="report-foot">Magnitudes por dirección. No incluye combinaciones gravitacionales ni verificación resistente de anclajes.</p>';
 const txthead=['PHS | INGENIERÍA ESTRUCTURAL','FUERZAS SÍSMICAS DE DISEÑO',name,'='.repeat(54)];
 const txtpairs=arr=>arr.map(x=>x[0].padEnd(24,' ')+' : '+x[1]);
 const txtresult=['                ESTRUCTURA        ANCLAJES',
  '                  [kgf]            [kgf]',
  '-'.repeat(54),
  ...rows.map(x=>x[0].padEnd(15)+display(x[1],1).padStart(13)+display(x[2],1).padStart(17))];
 const lines=detailedEquations(r);
 const textReport=[
  ...txthead,'',
  '1. ANTECEDENTES','-'.repeat(54),
  ...txtpairs(d.inputs),'','Parámetros normativos:',
  ...txtpairs(normativeFactors(r)),'',
  '2. CÁLCULO DE FUERZAS SÍSMICAS','-'.repeat(54),...lines.calc,
  '3. FUERZAS PARA ANCLAJES','-'.repeat(54),...lines.anchors,
  '4. RESUMEN DE RESULTADOS','-'.repeat(54),...txtresult,'-'.repeat(54),'',
  'OBSERVACIONES',
  '- Magnitudes positivas por dirección.',
  '- Sin combinaciones ni verificaciones resistentes.',
  '- Cálculo interno sin redondeos intermedios.',
  '='.repeat(54),'PHS | INGENIERÍA ESTRUCTURAL'
 ].join('\n');
 return {globalHtml,textReport};
}
function read(){
 const standard=$('norm').value;
 const W=num('w');
 if(standard==='2369'){
   return motor.calculate2369({weight_kgf:W,category:$('cat').value,zone:$('zone').value,soil:$('soil').value,
     equipment:$('equipment').value,anchor:$('duct').value,location:$('loc2369').value,height_m:num('height'),level_m:num('zk')});
 }
 if(standard==='87')return motor.calculate87({weight_kgf:W,IE:num('ie'),fx:num('fx'),fy:num('fy'),location:$('loc87').value});
 return motor.calculate88({weight_kgf:W,vertical:$('vertical').value,location:$('loc88').value});
}
function localizeStaticNumbers(){
 document.querySelectorAll('[data-local-number]').forEach(el=>{
   if(el.dataset&&Object.prototype.hasOwnProperty.call(el.dataset,'localNumber'))
     el.textContent=display(Number(el.dataset.localNumber),Number(el.dataset.decimals||0));
 });
}
function updateVisibility(){
 const n=$('norm').value;
 for(const v of ['2369','87','88'])$('block'+v).hidden=n!==v;
 $('heightGroup').hidden=$('loc2369').value!=='elevated';
}
function refreshReports(){
 if(!reports)return;
 $('globalReport').innerHTML=reports.globalHtml;
 $('txtPreview').textContent=reports.textReport;
}
function render(){
 updateVisibility();
 try{
   const r=read();active=r;reports=buildReports(r);
   $('status').textContent='Cálculo actualizado';$('status').className='status valid';
   $('pdfButton').disabled=false;$('txtButton').disabled=false;
   refreshReports();
 }catch(e){
   active=null;reports=null;$('status').textContent=e.message;$('status').className='status invalid';
   $('globalReport').innerHTML='<p class="empty">Ingresa los datos necesarios para calcular.</p>';
   $('txtPreview').textContent='Sin resultados disponibles.';
   $('pdfButton').disabled=true;$('txtButton').disabled=true;
 }
}
function saveTxt(){
 if(!active||!reports)return;
 const name='PHS_'+active.method.replace(/[^a-z0-9]+/gi,'_')+'_detallado.txt';
 const file=new Blob([reports.textReport],{type:'text/plain;charset=utf-8'});
 const url=URL.createObjectURL(file),link=document.createElement('a');
 link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('pdfButton').addEventListener('click',()=>{if(active)window.print()});
$('txtButton').addEventListener('click',saveTxt);
document.querySelectorAll('input,select').forEach(el=>{
 el.addEventListener('input',render);el.addEventListener('change',render);
});
localizeStaticNumbers();
render();
})();