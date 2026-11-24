/* PHS Seismic Forces — presentación de resultados y TXT/PDF; sin lectura del DOM. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PHSSeismicReport=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// Punto decimal fijo para el HTML autónomo; no se leen configuraciones regionales.
// El motor conserva precisión completa y la presentación nunca agrupa miles.
let decimalSeparator='.';
function setDecimalSeparator(value){
 if(value!=='.'&&value!==',')throw new RangeError('Separador decimal no válido');
 decimalSeparator=value;
}
const formatNumber=(n,min=0,max=min)=>{
 const normalized=new Intl.NumberFormat('en-US',{
  minimumFractionDigits:min,maximumFractionDigits:max,useGrouping:false
 }).format(n);
 return decimalSeparator==='.'?normalized:normalized.replace('.',',');
};
const display=(n,d=1)=>formatNumber(n,d);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const force=n=>display(n,1)+' kgf';
const caption=(r)=>r.method==='NCh2369:2025-cap7'?'NCh2369:2025 · Capítulo 7':r.method==='CNE-Art87'?'Anexo Técnico CNE · Artículo 87':'Anexo Técnico CNE · Artículo 88';
const place=s=>({'ground':'Nivel basal / terreno','modular':'Sala modular con apoyo basal equivalente','elevated':'Estructura elevada','floor':'Piso superior de edificio hasta 3 pisos'})[s]||s;
// Los valores ingresados conservan sus decimales; las magnitudes calculadas
// nunca reciben redondeos intermedios, únicamente formato de visualización.
const factor=n=>formatNumber(n,0,12);
function inputValue(id,rawInputs){
 const raw=String(rawInputs[id]??'').trim();
 if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw))
   return raw.replace('.',decimalSeparator);
 return factor(Number(raw)); // Para notación exponencial válida en input[type=number]
}
function lineData(r,rawInputs,route=null){
 const a=[['Peso sísmico',inputValue('w',rawInputs)+' kgf']],f=[];
 if(r.method==='NCh2369:2025-cap7'){
  const p=r.inputs,k=r.factors;
  a.push(['Categoría',p.category],['Zona sísmica',String(p.zone)],['Suelo',p.soil],
   ['Clasificación equipo',({'electrical-mechanical':'Equipo eléctrico/mecánico','secondary-ductile':'Elemento secundario con componentes dúctiles','secondary-nonductile':'Elemento secundario no dúctil','other-specified':'Otro no especificado'})[p.equipment]],
   ['Sistema de anclaje',route==='8.5'?'Sistema dúctil que cumple §8.5 (anclajes no calculados)':route==='7.3.2'?'Materiales dúctiles, no cumple §8.5 (§7.3.2)':route==='7.3.3'?'Materiales no dúctiles (§7.3.3)':p.anchor==='ductile'?'Dúctil (§7.3.2)':'No dúctil (§7.3.3)'],
   ['Ubicación',place(p.location)]);
  if(p.location==='elevated')
   a.push(['Altura H',inputValue('height',rawInputs)+' m'],['Nivel Zk',inputValue('zk',rawInputs)+' m']);
  f.push(['I',factor(k.I)],['Rp',factor(k.Rp)]);
 }else if(r.method==='CNE-Art87'){
  const p=r.inputs;
  a.push(['Frecuencia X',inputValue('fx',rawInputs)+' Hz'],
   ['Frecuencia Y',inputValue('fy',rawInputs)+' Hz'],['Ubicación',place(p.location)]);
  f.push(['IE (Tabla 4)',factor(r.factors.IE)]);
 }else{
  const p=r.inputs,k=r.factors;
  a.push(['Clasificación','Celda metálica autosoportada'],['Ubicación',place(p.location)],
   ['Modelo vertical',p.vertical==='rigid'?'V1 — Rígido':'V2 — No rígido']);
  f.push(['IE (Tabla 4)',factor(k.IE)],['R (Tabla 4)',factor(k.R)],['A0/g',factor(k.A0_g)]);
 }
 return {inputs:a,factors:f};
}
function rowsForces(r,hideAnchors=false){
 return [['Ex',r.structure.Ex,hideAnchors?null:r.anchors.Ex],['Ey',r.structure.Ey,hideAnchors?null:r.anchors.Ey],['Ez',r.structure.Ez,hideAnchors?null:r.anchors.Ez]];
}
function htmlTable(data,forceMode=false){
 if(forceMode)return '<table><thead><tr><th>Acción</th><th>Estructura (kgf)</th><th>Anclajes (kgf)</th></tr></thead><tbody>'+
 data.map(x=>'<tr><td>'+esc(x[0])+'</td><td>'+display(x[1],1)+'</td><td>'+(x[2]===null?'NO CALCULADO':display(x[2],1))+'</td></tr>').join('')+'</tbody></table>';
 return '<table class="pairs"><tbody>'+data.map(x=>'<tr><td>'+esc(x[0])+'</td><td>'+esc(x[1])+'</td></tr>').join('')+'</tbody></table>';
}

/*
 * TXT auditable: ecuación simbólica seguida del resultado del motor.
 * Sin sustituciones numéricas ni cálculos paralelos en el reporte.
 *
 * Coeficientes calculados: máximo 3 decimales, sin ceros sobrantes.
 * Este redondeo es solo de presentación; el motor conserva precisión completa.
 */
function calculatedCoefficient(value){
 return formatNumber(value,0,3);
}
function normativeFactors(r){
 const k=r.factors;
 if(r.method==='NCh2369:2025-cap7')return [
  ['I',factor(k.I)],['Ar/g',factor(k.Ar_over_g)],['S',factor(k.S)],
  ['Kp',factor(k.Kp)],['Rp',factor(k.Rp)],['kv',factor(k.kv)]
 ];
 if(r.method==='CNE-Art87')return [
  ['IE (Tabla 4)',factor(k.IE)],['Kh,X',factor(k.KhX)],['Kh,Y',factor(k.KhY)],['Kv',factor(k.Kv)],
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
function detailedEquations(r,hideAnchors=false){
 const k=r.factors,p=r.inputs,n=factor,final=force;
 const c=calculatedCoefficient;
 const calc=[],anchors=[];
 const add=(arr,formula,result)=>arr.push(formula,result,'');
 if(r.method==='NCh2369:2025-cap7'){
  const elevated=p.location==='elevated';
  calc.push('2.1. Aceleración horizontal');
  add(calc,elevated?
   'ak/g = I · (Ar/g) · S · (1 + 2 · Zk/H)':
   'ak/g = I · (Ar/g) · S',
   'ak/g = '+c(k.ak_over_g));
  calc.push('2.2. Coeficiente horizontal');
  add(calc,'Cp = (ak/g) · Kp / Rp','Cp = '+c(k.Cp));
  calc.push('2.3. Límites del coeficiente horizontal');
  add(calc,'Cmin = '+n(.7)+' · I · (Ar/g) · S','Cmin = '+c(k.Cmin));
  add(calc,'Cmax = 3 · I · (Ar/g) · S','Cmax = '+c(k.Cmax));
  add(calc,'Ch = mín(Cmax; máx(Cmin; Cp))','Ch = '+c(k.structure.X));
  const controlling=k.Cp<=k.Cmin?'Cmin':k.Cp>=k.Cmax?'Cmax':'Cp';
  calc.push('Condición controlante: '+controlling,'');
  calc.push('2.4. Coeficiente sísmico vertical');
  add(calc,'Cv = kv · I · (Ar/g) · S','Cv = '+c(k.structure.Z));
  calc.push('2.5. Fuerzas sísmicas de la estructura');
  add(calc,'Ex = Ch · W','Ex = '+final(r.structure.Ex));
  add(calc,'Ey = Ch · W','Ey = '+final(r.structure.Ey));
  add(calc,'Ez = Cv · W','Ez = '+final(r.structure.Ez));
  if(hideAnchors){
   anchors.push('Ruta §8.5: no implementada para demandas de anclajes.');
   anchors.push('Ex,a / Ey,a / Ez,a: NO CALCULADO.');
  }else{
  anchors.push('3.1. Amplificación horizontal ('+(p.anchor==='ductile'?'§7.3.2':'§7.3.3')+')');
  add(anchors,p.anchor==='ductile'?'Factor H = '+n(.7)+' · Rp':'Factor H = Rp',
   'Factor H = '+n(k.anchor_multiplier.horizontal));
  add(anchors,'Ex,a = Factor H · Ex','Ex,a = '+final(r.anchors.Ex));
  add(anchors,'Ey,a = Factor H · Ey','Ey,a = '+final(r.anchors.Ey));
  anchors.push('3.2. Componente vertical');
  add(anchors,'Ez,a = Ez','Ez,a = '+final(r.anchors.Ez));
  }
 }else if(r.method==='CNE-Art87'){
  calc.push('2.1. Factores por frecuencia horizontal');
  add(calc,'Kh,X = Kh(fX)','Kh,X = '+n(k.KhX));
  add(calc,'Kh,Y = Kh(fY)','Kh,Y = '+n(k.KhY));
  calc.push('2.2. Coeficientes de diseño');
  add(calc,'Cx = '+n(.6)+' · IE · Kh,X · Kh ubicación','Cx = '+c(k.structure.X));
  add(calc,'Cy = '+n(.6)+' · IE · Kh,Y · Kh ubicación','Cy = '+c(k.structure.Y));
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
   'Fb = '+c(k.Fb));
  add(calc,'Sa,máx/g = '+n(2.12)+' · (A0/g) · Fb',
   'Sa,máx/g = '+c(k.Sa_over_g));
  calc.push('2.2. Coeficiente sísmico horizontal');
  add(calc,'Ch = '+n(1.2)+' · IE · (Sa/g) · Kh ubicación / R',
   'Ch = '+c(k.structure.X));
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

function buildReports(r,rawInputs,guide=null,route=null){
 const hideAnchors=r.method==='NCh2369:2025-cap7'&&route==='8.5';
 const d=lineData(r,rawInputs,route),rows=rowsForces(r,hideAnchors),name=caption(r);
 const head='<div class="report-kicker">PHS | INGENIERÍA ESTRUCTURAL</div>'+
   '<h1>FUERZAS SÍSMICAS DE DISEÑO</h1><p>'+esc(name)+'</p><hr>';
 const data=[...d.inputs,...d.factors];
 const summary='<h2>2. Fuerzas sísmicas finales</h2>'+htmlTable(rows,true);
 const is2369=r.method==='NCh2369:2025-cap7';
 const basalSoil=is2369&&r.inputs.location==='ground';
 const anchorCriterion='Amplificación de anclajes solo en Ex/Ey; Ez,a = Ez sin amplificación.';
 const basalCriterion='Verificar aplicabilidad de NCh2369 §5.8 para equipos rígidos apoyados en suelo (T < 0,06 s); no implementado.';
 const guideFooter=is2369&&guide?'<p class="report-foot"><strong>Asistente de anclajes (declarativo):</strong> '+
   esc(guide.status)+'. '+esc(guide.warning)+' Selección aplicada: '+esc(guide.selectedLabel)+
   '. Sugerencia: '+esc(guide.routeLabel)+'.</p>':'';
 const globalHtml=head+'<h2>1. Datos y factores de diseño</h2>'+htmlTable(data)+summary+guideFooter+
  (hideAnchors?'<p class="report-foot"><strong>§8.5 no implementado:</strong> no se emiten demandas de anclajes con esta ruta.</p>':'')+
  (is2369&&!hideAnchors?'<p class="report-foot">'+esc(anchorCriterion)+'</p>':'')+
  (basalSoil?'<p class="report-foot">'+esc(basalCriterion)+'</p>':'')+
  '<p class="report-foot">Magnitudes por dirección. No incluye combinaciones gravitacionales ni verificación resistente de anclajes.</p>';
 const txthead=['PHS | INGENIERÍA ESTRUCTURAL','FUERZAS SÍSMICAS DE DISEÑO',name,'='.repeat(54)];
 const txtpairs=arr=>arr.map(x=>x[0].padEnd(24,' ')+' : '+x[1]);
 const txtresult=['                ESTRUCTURA        ANCLAJES',
  '                  [kgf]            [kgf]',
  '-'.repeat(54),
  ...rows.map(x=>x[0].padEnd(15)+display(x[1],1).padStart(13)+(x[2]===null?'NO CALCULADO':display(x[2],1)).padStart(17))];
 const lines=detailedEquations(r,hideAnchors);
 const guideTxt=is2369&&guide?[
   '5. ASISTENTE DE CLASIFICACIÓN DE ANCLAJES — INFORMATIVO','-'.repeat(54),
   'Estado: '+guide.status,'Ruta orientativa: '+guide.routeLabel,
   'Selección aplicada: '+guide.selectedLabel,'Advertencia: '+guide.warning,
   ...guide.answers.map(x=>x[0]+' : '+x[1]),'',
   'Verificaciones declaradas (NO validan resistencias):',
   ...guide.checks.filter(()=>guide.answers.length>1).map(x=>'- '+x.label+' : '+
     (x.status===true?'Declarado conforme':x.status===false?'No conforme':'No verificado')),
   ''
 ]:[];
 const textReport=[
  ...txthead,'',
  '1. ANTECEDENTES','-'.repeat(54),
  ...txtpairs(d.inputs),'','Parámetros normativos:',
  ...txtpairs(normativeFactors(r)),'',
  '2. CÁLCULO DE FUERZAS SÍSMICAS','-'.repeat(54),...lines.calc,
  '3. FUERZAS PARA ANCLAJES','-'.repeat(54),...lines.anchors,
  '4. RESUMEN DE RESULTADOS','-'.repeat(54),...txtresult,'-'.repeat(54),'',
  ...guideTxt,
  'OBSERVACIONES',
  '- Magnitudes positivas por dirección.',
  '- Sin combinaciones ni verificaciones resistentes.',
  '- Cálculo interno sin redondeos intermedios.',
  ...(is2369&&!hideAnchors?['- '+anchorCriterion]:[]),
  ...(hideAnchors?['- §8.5: anclajes no calculados; no utilizar resultados de §7.3 como sustituto.']:[]),
  ...(basalSoil?['- '+basalCriterion]:[]),
  '='.repeat(54),'PHS | INGENIERÍA ESTRUCTURAL'
 ].join('\n');
 return {globalHtml,textReport};
}
return Object.freeze({buildReports,formatNumber,setDecimalSeparator});
});
