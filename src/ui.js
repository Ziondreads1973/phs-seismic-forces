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
function buildReports(r){
 const d=lineData(r),rows=rowsForces(r),name=caption(r);
 const head='<div class="report-kicker">PHS | INGENIERÍA ESTRUCTURAL</div>'+
   '<h1>FUERZAS SÍSMICAS DE DISEÑO</h1><p>'+esc(name)+'</p><hr>';
 const data=[...d.inputs,...d.factors];
 const summary='<h2>2. Fuerzas sísmicas finales</h2>'+htmlTable(rows,true);
 const globalHtml=head+'<h2>1. Datos y factores de diseño</h2>'+htmlTable(data)+summary+
  '<p class="report-foot">Magnitudes por dirección. No incluye combinaciones gravitacionales ni verificación resistente de anclajes.</p>';
 const txthead=['PHS | INGENIERÍA ESTRUCTURAL','FUERZAS SÍSMICAS DE DISEÑO',name,'='.repeat(64)];
 const txtpairs=arr=>arr.map(x=>x[0]+' : '+x[1]);
 const txtresult=['ACCIÓN | ESTRUCTURA (kgf) | ANCLAJES (kgf)',
  ...rows.map(x=>x[0]+' | '+display(x[1],1)+' | '+display(x[2],1))];
 const footer=['','Magnitudes por dirección; sin combinaciones ni verificación resistente.'];
 const textReport=[...txthead,'','1. DATOS Y FACTORES DE DISEÑO',...txtpairs(data),'',
  '2. FUERZAS SÍSMICAS FINALES',...txtresult,...footer].join('\n');
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
 const name='PHS_'+active.method.replace(/[^a-z0-9]+/gi,'_')+'_resultados.txt';
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