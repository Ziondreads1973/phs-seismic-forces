/* PHS Fuerzas Sísmicas — UI y reportes, sin dependencias externas */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const motor=globalThis.PHSSeismicMotor;
let active=null,reports=null;
const display=(n,d=1)=>Number(n).toLocaleString('es-CL',{minimumFractionDigits:d,maximumFractionDigits:d,useGrouping:false});
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
  e.push('Ex = 0,60 · IE · W · Kh,X · Kh,ubicación = '+force(r.structure.Ex),
  'Ey = 0,60 · IE · W · Kh,Y · Kh,ubicación = '+force(r.structure.Ey),
  'Ez = 0,36 · IE · W · Kv,ubicación = '+force(r.structure.Ez),
  'Ex,a = 1,25 · Ex = '+force(r.anchors.Ex),
  'Ey,a = 1,25 · Ey = '+force(r.anchors.Ey));
 }else{
  const p=r.inputs,k=r.factors;
  a.push(['Clasificación','Celda metálica autosoportada'],['Ubicación',place(p.location)],
   ['Modelo vertical',p.vertical==='rigid'?'V1 — Rígido':'V2 — No rígido']);
  f.push(['IE (Tabla 4)',eq(k.IE)],['R (Tabla 4)',eq(k.R)],['A0/g',eq(k.A0_g)],['Amortiguamiento',display(k.xi_pct,1)+' %'],
  ['Fb',eq(k.Fb)],['Sa,máx/g',eq(k.Sa_over_g)],['Kh ubicación',eq(k.location.horizontal)],
  ['Kv ubicación',eq(k.location.vertical)],['Amplificación anclajes H',eq(k.anchor_multiplier.horizontal)]);
  e.push('Fb = (3,21 − 0,68 · ln(2)) / 2,1156 = '+eq(k.Fb),
   'Sa,máx/g = 2,12 · A0/g · Fb = '+eq(k.Sa_over_g),
   'Ex = Ey = 1,20 · IE · (Sa/g) · W · Kh / R = '+force(r.structure.Ex),
   (p.vertical==='rigid'?'Ez (V1) = 0,36 · IE · W · Kv':'Ez (V2) = 0,72 · IE · (Sa/g) · W · Kv / R')+' = '+force(r.structure.Ez),
   'Ex,a = Ey,a = 1,50 · Ex = '+force(r.anchors.Ex));
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
 const summary='<h2>Resumen de fuerzas de diseño</h2>'+htmlTable(rows,true);
 const base=head+'<h2>Antecedentes principales</h2>'+htmlTable(d.inputs.filter((x,i)=>i===0||x[0]==='Ubicación'||x[0]==='Clasificación equipo'||x[0]==='Clasificación'||x[0]==='Modelo vertical'))+summary;
 const detail=head+'<h2>1. Antecedentes</h2>'+htmlTable(d.inputs)+
  '<h2>2. Parámetros y factores</h2>'+htmlTable(d.factors)+
  '<h2>3. Ecuaciones y resultados principales</h2>'+
  d.equations.map(x=>'<div class="equation">'+esc(x)+'</div>').join('')+
  '<h2>4. Resumen de fuerzas de diseño</h2>'+htmlTable(rows,true);
 const footer='<p class="report-foot">Acciones sísmicas como magnitudes por dirección. No incluye combinaciones gravitacionales ni diseño resistente de anclajes.</p>';
 const txthead=['PHS | INGENIERÍA ESTRUCTURAL','FUERZAS SÍSMICAS DE DISEÑO',name,'='.repeat(64)];
 const txtpairs=(arr)=>arr.map(x=>x[0]+' : '+x[1]);
 const txtresult=['ACCIÓN | ESTRUCTURA (kgf) | ANCLAJES (kgf)',...rows.map(x=>x[0]+' | '+display(x[1],1)+' | '+display(x[2],1))];
 const txtfoot=['','Magnitudes sísmicas por dirección; no incluye combinaciones ni verificación resistente.'];
 const globalTxt=[...txthead,'','ANTECEDENTES PRINCIPALES',...txtpairs(d.inputs.filter((x,i)=>i===0||x[0]==='Ubicación'||x[0]==='Clasificación equipo'||x[0]==='Clasificación'||x[0]==='Modelo vertical')),'','RESULTADOS',...txtresult,...txtfoot].join('\n');
 const detailTxt=[...txthead,'','1. ANTECEDENTES',...txtpairs(d.inputs),'','2. PARÁMETROS Y FACTORES',...txtpairs(d.factors),'','3. ECUACIONES PRINCIPALES',...d.equations,'','4. RESULTADOS',...txtresult,...txtfoot].join('\n');
 return {globalHtml:base+footer,detailHtml:detail+footer,globalTxt,detailTxt};
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
function updateVisibility(){
 const n=$('norm').value;
 for(const v of ['2369','87','88'])$('block'+v).hidden=n!==v;
 $('heightGroup').hidden=$('loc2369').value!=='elevated';
}
function refreshReports(){
 if(!reports)return;
 const pdf=$('pdfLevel').value==='global'?reports.globalHtml:reports.detailHtml;
 const txt=$('txtLevel').value==='global'?reports.globalTxt:reports.detailTxt;
 $('pdfPreview').innerHTML=pdf;$('txtPreview').textContent=txt;$('printHost').innerHTML=pdf;
}
function render(){
 updateVisibility();
 try{
   const r=read();active=r;reports=buildReports(r);
   $('status').textContent='Cálculo actualizado';$('status').className='status valid';
   $('forces').innerHTML=htmlTable(rowsForces(r),true);
   $('methodDetail').textContent=caption(r);
   $('pdfButton').disabled=false;$('txtButton').disabled=false;
   refreshReports();
 }catch(e){
   active=null;reports=null;$('status').textContent=e.message;$('status').className='status invalid';
   $('forces').innerHTML='<p class="empty">Ingresa los datos necesarios para calcular.</p>';
   $('methodDetail').textContent='—';
   $('pdfPreview').innerHTML='<p>Sin resultados disponibles.</p>';
   $('txtPreview').textContent='Sin resultados disponibles.';
   $('printHost').innerHTML='';
   $('pdfButton').disabled=true;$('txtButton').disabled=true;
 }
}
function saveTxt(){
 if(!active||!reports)return;
 const level=$('txtLevel').value;
 const name='PHS_'+active.method.replace(/[^a-z0-9]+/gi,'_')+'_'+level+'.txt';
 const file=new Blob([level==='global'?reports.globalTxt:reports.detailTxt],{type:'text/plain;charset=utf-8'});
 const url=URL.createObjectURL(file),link=document.createElement('a');
 link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('pdfButton').addEventListener('click',()=>{if(active)window.print()});
$('txtButton').addEventListener('click',saveTxt);
$('pdfLevel').addEventListener('change',refreshReports);
$('txtLevel').addEventListener('change',refreshReports);
document.querySelectorAll('input,select').forEach(el=>{
 if(['pdfLevel','txtLevel'].includes(el.id))return;
 el.addEventListener('input',render);el.addEventListener('change',render);
});
render();
})();