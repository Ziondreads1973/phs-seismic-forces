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
 * Reporte TXT auditable: factores y cálculos derivados del mismo resultado
 * del motor que alimenta pantalla/PDF. La sustitución no recalcula la demanda.
 */
function detailedFactors(r){
 const k=r.factors;
 if(r.method==='NCh2369:2025-cap7')
  return [
   ['I',factor(k.I)],['Ar/g',factor(k.Ar_over_g)],['S',factor(k.S)],
   ['kv',factor(k.kv)],['Kp',factor(k.Kp)],['Rp',factor(k.Rp)],
   ['ak/g',factor(k.ak_over_g)],['Cp sin limitar',factor(k.Cp)],
   ['C horizontal mínimo',factor(k.Cmin)],['C horizontal máximo',factor(k.Cmax)],
   ['C horizontal adoptado',factor(k.structure.X)],
   ['Cv vertical',factor(k.structure.Z)],
   ['Factor horizontal anclajes',factor(k.anchor_multiplier.horizontal)],
   ['Factor vertical anclajes',factor(k.anchor_multiplier.vertical)]
  ];
 if(r.method==='CNE-Art87')
  return [
   ['Kh,X',factor(k.KhX)],['Kh,Y',factor(k.KhY)],['Kv',factor(k.Kv)],
   ['Kh ubicación',factor(k.location.horizontal)],['Kv ubicación',factor(k.location.vertical)],
   ['Coeficiente Cx',factor(k.structure.X)],['Coeficiente Cy',factor(k.structure.Y)],
   ['Coeficiente Cz',factor(k.structure.Z)],
   ['Factor horizontal anclajes',factor(k.anchor_multiplier.horizontal)],
   ['Factor vertical anclajes',factor(k.anchor_multiplier.vertical)]
  ];
 return [
  ['IE (Tabla 4)',factor(k.IE)],['R (Tabla 4)',factor(k.R)],
  ['A0/g',factor(k.A0_g)],['Amortiguamiento xi (%)',factor(k.xi_pct)],
  ['Fb',factor(k.Fb)],['Sa,máx/g',factor(k.Sa_over_g)],
  ['Kh ubicación',factor(k.location.horizontal)],['Kv ubicación',factor(k.location.vertical)],
  ['Coeficiente Cx/Cy',factor(k.structure.X)],['Coeficiente Cz',factor(k.structure.Z)],
  ['Factor horizontal anclajes',factor(k.anchor_multiplier.horizontal)],
  ['Factor vertical anclajes',factor(k.anchor_multiplier.vertical)]
 ];
}
function detailedEquations(r){
 const k=r.factors,p=r.inputs,W=inputValue('w'),n=factor,final=force;
 let lines=[];
 if(r.method==='NCh2369:2025-cap7'){
  const elevated=p.location==='elevated';
  lines.push('Aceleración horizontal en el nivel de apoyo:');
  if(elevated){
   lines.push('ak/g = I · (Ar/g) · S · (1 + 2 · Zk/H)');
   lines.push('     = '+n(k.I)+' · '+n(k.Ar_over_g)+' · '+n(k.S)+' · (1 + 2 · '+inputValue('zk')+'/'+inputValue('height')+')');
  }else{
   lines.push('ak/g = I · (Ar/g) · S  [Zk = 0, instalación basal]');
   lines.push('     = '+n(k.I)+' · '+n(k.Ar_over_g)+' · '+n(k.S));
  }
  lines.push('ak/g = '+n(k.ak_over_g),'',
    'Coeficiente horizontal antes de límites:',
    'Cp = (ak/g) · Kp / Rp',
    '   = '+n(k.ak_over_g)+' · '+n(k.Kp)+' / '+n(k.Rp),
    'Cp = '+n(k.Cp),'',
    'Límites normativos del coeficiente horizontal:',
    'Cmin = '+n(.7)+' · I · (Ar/g) · S',
    '     = '+n(.7)+' · '+n(k.I)+' · '+n(k.Ar_over_g)+' · '+n(k.S),
    'Cmin = '+n(k.Cmin),
    'Cmax = 3 · I · (Ar/g) · S',
    '     = 3 · '+n(k.I)+' · '+n(k.Ar_over_g)+' · '+n(k.S),
    'Cmax = '+n(k.Cmax),
    'C horizontal = mín(Cmax; máx(Cmin; Cp))',
    '             = mín('+n(k.Cmax)+'; máx('+n(k.Cmin)+'; '+n(k.Cp)+'))',
    'C horizontal = '+n(k.structure.X),'',
    'Coeficiente vertical (§5.7.1):',
    'Cv = kv · I · (Ar/g) · S',
    '   = '+n(k.kv)+' · '+n(k.I)+' · '+n(k.Ar_over_g)+' · '+n(k.S),
    'Cv = '+n(k.structure.Z),'',
    'Fuerzas sobre equipo/estructura:',
    'Ex = C horizontal · Pp = '+n(k.structure.X)+' · '+W+' = '+final(r.structure.Ex),
    'Ey = C horizontal · Pp = '+n(k.structure.Y)+' · '+W+' = '+final(r.structure.Ey),
    'Ez = Cv · Pp           = '+n(k.structure.Z)+' · '+W+' = '+final(r.structure.Ez),'',
    'Fuerzas sísmicas para anclajes:',
    'Factor H = '+(p.anchor==='ductile'?n(.7)+' · Rp (§7.3.2)':'Rp (§7.3.3)')+' = '+n(k.anchor_multiplier.horizontal),
    'Ex,a = Ex · Factor H = '+n(r.structure.Ex)+' · '+n(k.anchor_multiplier.horizontal)+' = '+final(r.anchors.Ex),
    'Ey,a = Ey · Factor H = '+n(r.structure.Ey)+' · '+n(k.anchor_multiplier.horizontal)+' = '+final(r.anchors.Ey),
    'Ez,a = Ez · 1 = '+final(r.anchors.Ez));
 }else if(r.method==='CNE-Art87'){
  const L=k.location,IE=n(p.IE);
  lines.push('Selección de factores por frecuencia:',
   'Kh,X = '+n(k.KhX)+'  (fX = '+inputValue('fx')+' Hz)',
   'Kh,Y = '+n(k.KhY)+'  (fY = '+inputValue('fy')+' Hz)',
   'Kv = '+n(k.Kv)+'; Kh ubicación = '+n(L.horizontal)+'; Kv ubicación = '+n(L.vertical),'',
   'Fuerzas sobre equipo/estructura:',
   'Ex = '+n(.6)+' · IE · W · Kh,X · Kh ubicación',
   '   = '+n(.6)+' · '+IE+' · '+W+' · '+n(k.KhX)+' · '+n(L.horizontal),
   'Ex = '+final(r.structure.Ex),
   'Ey = '+n(.6)+' · IE · W · Kh,Y · Kh ubicación',
   '   = '+n(.6)+' · '+IE+' · '+W+' · '+n(k.KhY)+' · '+n(L.horizontal),
   'Ey = '+final(r.structure.Ey),
   'Ez = '+n(.36)+' · IE · W · Kv · Kv ubicación',
   '   = '+n(.36)+' · '+IE+' · '+W+' · '+n(k.Kv)+' · '+n(L.vertical),
   'Ez = '+final(r.structure.Ez),'',
   'Fuerzas sísmicas para anclajes:',
   'Ex,a = '+n(k.anchor_multiplier.horizontal)+' · Ex = '+n(k.anchor_multiplier.horizontal)+' · '+n(r.structure.Ex)+' = '+final(r.anchors.Ex),
   'Ey,a = '+n(k.anchor_multiplier.horizontal)+' · Ey = '+n(k.anchor_multiplier.horizontal)+' · '+n(r.structure.Ey)+' = '+final(r.anchors.Ey),
   'Ez,a = 1 · Ez = '+final(r.anchors.Ez));
 }else{
  const L=k.location,V=p.vertical;
  lines.push('Aceleración espectral máxima (xi = '+n(k.xi_pct)+' %, A0/g = '+n(k.A0_g)+'):',
   'Fb = ('+n(3.21)+' − '+n(.68)+' · ln(xi)) / '+n(2.1156),
   '   = ('+n(3.21)+' − '+n(.68)+' · ln('+n(k.xi_pct)+')) / '+n(2.1156),
   'Fb = '+n(k.Fb),
   'Sa,máx/g = '+n(2.12)+' · (A0/g) · Fb',
   '         = '+n(2.12)+' · '+n(k.A0_g)+' · '+n(k.Fb),
   'Sa,máx/g = '+n(k.Sa_over_g),'',
   'Fuerzas horizontales del equipo:',
   'Ex = '+n(1.2)+' · IE · (Sa/g) · W · Kh ubicación / R',
   '   = '+n(1.2)+' · '+n(k.IE)+' · '+n(k.Sa_over_g)+' · '+W+' · '+n(L.horizontal)+' / '+n(k.R),
   'Ex = '+final(r.structure.Ex),
   'Ey = '+n(1.2)+' · IE · (Sa/g) · W · Kh ubicación / R',
   '   = '+n(1.2)+' · '+n(k.IE)+' · '+n(k.Sa_over_g)+' · '+W+' · '+n(L.horizontal)+' / '+n(k.R),
   'Ey = '+final(r.structure.Ey),'',
   'Fuerza vertical ('+(V==='rigid'?'V1 — rígido':'V2 — no rígido')+'):');
  if(V==='rigid')lines.push('Ez = '+n(.36)+' · IE · W · Kv ubicación',
   '   = '+n(.36)+' · '+n(k.IE)+' · '+W+' · '+n(L.vertical));
  else lines.push('Ez = '+n(.72)+' · IE · (Sa/g) · W · Kv ubicación / R',
   '   = '+n(.72)+' · '+n(k.IE)+' · '+n(k.Sa_over_g)+' · '+W+' · '+n(L.vertical)+' / '+n(k.R));
  lines.push('Ez = '+final(r.structure.Ez),'',
   'Fuerzas sísmicas para anclajes:',
   'Ex,a = '+n(k.anchor_multiplier.horizontal)+' · Ex = '+n(k.anchor_multiplier.horizontal)+' · '+n(r.structure.Ex)+' = '+final(r.anchors.Ex),
   'Ey,a = '+n(k.anchor_multiplier.horizontal)+' · Ey = '+n(k.anchor_multiplier.horizontal)+' · '+n(r.structure.Ey)+' = '+final(r.anchors.Ey),
   'Ez,a = 1 · Ez = '+final(r.anchors.Ez));
 }
 return lines;
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
 const textReport=[...txthead,'',
  '1. ANTECEDENTES',...txtpairs(d.inputs),'',
  '2. PARÁMETROS Y FACTORES DE DISEÑO',...txtpairs(detailedFactors(r)),'',
  '3. DESARROLLO DEL CÁLCULO',...detailedEquations(r),'',
  '4. FUERZAS SÍSMICAS FINALES',...txtresult,...footer,
  'Los coeficientes calculados se muestran con hasta 12 decimales.',
  'El motor conserva precisión numérica completa; las fuerzas se presentan a 1 decimal.'
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