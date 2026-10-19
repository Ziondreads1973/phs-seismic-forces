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
const eq=n=>display(n,3);
function lineData(r){
 const a=[['Peso sísmico',force(r.weight_kgf)]],f=[],e=[];
 if(r.method==='NCh2369:2025-cap7'){
  const p=r.inputs,k=r.factors;
  a.push(['Categoría',p.category],['Zona sísmica',String(p.zone)],['Suelo',p.soil],
   ['Clasificación equipo',({'electrical-mechanical':'Equipo eléctrico/mecánico','secondary-ductile':'Elemento secundario con componentes dúctiles','secondary-nonductile':'Elemento secundario no dúctil','other-specified':'Otro no especificado'})[p.equipment]],
   ['Sistema de anclaje',p.anchor==='ductile'?'Dúctil (§7.3.2)':'No dúctil (§7.3.3)'],
   ['Ubicación',place(p.location)]);
  if(p.location==='elevated')a.push(['Altura H',display(p.height_m,2)+' m'],['Nivel Zk',display(p.level_m,2)+' m']);
  f.push(['I',eq(k.I)],['Ar/g',eq(k.Ar_over_g)],['S',eq(k.S)],['kv',eq(k.kv)],['Kp',eq(k.Kp)],['Rp',eq(k.Rp)],
   ['ak/g',eq(k.ak_over_g)],['Cp',eq(k.Cp)],['Límite mín.',eq(k.Cmin)],['Límite máx.',eq(k.Cmax)],
   ['Coef. horizontal adoptado',eq(k.structure.X)],['Coef. vertical',eq(k.structure.Z)],
   ['Amplificación anclajes H',eq(k.anchor_multiplier.horizontal)]);
  e.push('ak/g = I · Ar/g · S · (1 + 2 Zk/H) = '+eq(k.ak_over_g),
   'Cp = (ak/g) · Kp / Rp = '+eq(k.Cp),
   'C horizontal = mín('+eq(k.Cmax)+'; máx('+eq(k.Cmin)+'; '+eq(k.Cp)+')) = '+eq(k.structure.X),
   'Ex = Ey = C horizontal · Pp = '+force(r.structure.Ex),
   'Ez = kv · I · Ar/g · S · Pp = '+force(r.structure.Ez),
   'Ex,a = Ey,a = Ex · '+eq(k.anchor_multiplier.horizontal)+' = '+force(r.anchors.Ex));
 }else if(r.method==='CNE-Art87'){
  const p=r.inputs,k=r.factors;
  a.push(['IE',eq(p.IE)],['Frecuencia X',display(p.fx,2)+' Hz'],['Frecuencia Y',display(p.fy,2)+' Hz'],['Ubicación',place(p.location)]);
  f.push(['Kh,X',eq(k.KhX)],['Kh,Y',eq(k.KhY)],['Kv',eq(k.Kv)],['Kh ubicación',eq(k.location.horizontal)],
    ['Kv ubicación',eq(k.location.vertical)],['Amplificación anclajes H',eq(k.anchor_multiplier.horizontal)]);
  e.push('Ex = '+display(0.60,2)+' · IE · W · Kh,X · Kh,ubicación = '+force(r.structure.Ex),
  'Ey = '+display(0.60,2)+' · IE · W · Kh,Y · Kh,ubicación = '+force(r.structure.Ey),
  'Ez = '+display(0.36,2)+' · IE · W · Kv,ubicación = '+force(r.structure.Ez),
  'Ex,a = '+display(1.25,2)+' · Ex = '+force(r.anchors.Ex),
  'Ey,a = '+display(1.25,2)+' · Ey = '+force(r.anchors.Ey));
 }else{
  const p=r.inputs,k=r.factors;
  a.push(['Clasificación','Celda metálica autosoportada'],['Ubicación',place(p.location)],
   ['Modelo vertical',p.vertical==='rigid'?'V1 — Rígido':'V2 — No rígido']);
  f.push(['IE (Tabla 4)',eq(k.IE)],['R (Tabla 4)',eq(k.R)],['A0/g',eq(k.A0_g)],['Amortiguamiento',display(k.xi_pct,1)+' %'],
  ['Fb',eq(k.Fb)],['Sa,máx/g',eq(k.Sa_over_g)],['Kh ubicación',eq(k.location.horizontal)],
  ['Kv ubicación',eq(k.location.vertical)],['Amplificación anclajes H',eq(k.anchor_multiplier.horizontal)]);
  e.push('Fb = ('+display(3.21,2)+' − '+display(0.68,2)+' · ln(2)) / '+display(2.1156,4)+' = '+eq(k.Fb),
   'Sa,máx/g = '+display(2.12,2)+' · A0/g · Fb = '+eq(k.Sa_over_g),
   'Ex = Ey = '+display(1.20,2)+' · IE · (Sa/g) · W · Kh / R = '+force(r.structure.Ex),
   (p.vertical==='rigid'?'Ez (V1) = '+display(0.36,2)+' · IE · W · Kv':'Ez (V2) = '+display(0.72,2)+' · IE · (Sa/g) · W · Kv / R')+' = '+force(r.structure.Ez),
   'Ex,a = Ey,a = '+display(1.50,2)+' · Ex = '+force(r.anchors.Ex));
 }
 e.push('Ez,a = Ez = '+force(r.anchors.Ez));
 return {inputs:a,factors:f,equations:e};
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
 const head='<div class="report-kicker">PHS | INGENIERÍA ESTRUCTURAL</div><h1>FUERZAS SÍSMICAS DE DISEÑO</h1><p>'+esc(name)+'</p><hr>';
 const summary='<h2>2. Fuerzas sísmicas finales</h2>'+htmlTable(rows,true);
 const essential=d.inputs.filter((x,i)=>i===0||['Ubicación','Clasificación equipo','Clasificación','Modelo vertical','Categoría','Zona sísmica','Suelo','Sistema de anclaje','Frecuencia X','Frecuencia Y'].includes(x[0]));
 const wanted=r.method==='NCh2369:2025-cap7'?['I','Rp']:r.method==='CNE-Art87'?['Kh,X','Kh,Y']:['IE (Tabla 4)','R (Tabla 4)','A0/g','Sa,máx/g'];
 const factors=d.factors.filter(x=>wanted.includes(x[0]));
 const globalHtml=head+'<h2>1. Antecedentes y factores principales</h2>'+htmlTable([...essential,...factors])+summary+
 '<p class="report-foot">Acciones sísmicas como magnitudes por dirección. No incluye combinaciones gravitacionales ni diseño resistente de anclajes.</p>';
 const txthead=['PHS | INGENIERÍA ESTRUCTURAL','FUERZAS SÍSMICAS DE DISEÑO',name,'='.repeat(64)];
 const txtpairs=(arr)=>arr.map(x=>x[0]+' : '+x[1]);
 const txtresult=['ACCIÓN | ESTRUCTURA (kgf) | ANCLAJES (kgf)',...rows.map(x=>x[0]+' | '+display(x[1],1)+' | '+display(x[2],1))];
 const txtfoot=['','Magnitudes sísmicas por dirección; no incluye combinaciones ni verificación resistente.'];
 const detailTxt=[...txthead,'','1. ANTECEDENTES',...txtpairs(d.inputs),'','2. PARÁMETROS Y FACTORES',...txtpairs(d.factors),'','3. ECUACIONES PRINCIPALES',...d.equations,'','4. RESULTADOS',...txtresult,...txtfoot].join('\n');
 return {globalHtml,detailTxt};
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
 $('txtPreview').textContent=reports.detailTxt;
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
 const file=new Blob([reports.detailTxt],{type:'text/plain;charset=utf-8'});
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