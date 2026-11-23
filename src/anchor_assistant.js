/* Asistente documental de anclajes NCh2369:2025. No calcula resistencias. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PHSAnchorGuide=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const materialNames={unknown:'No verificado',ductile:'Dúctil: elongación certificada ≥20 % (50 mm)',limited:'No dúctil: 14 % ≤ elongación <20 %',invalid:'No alcanza 14 %'};
const detailNames={unknown:'No verificado',saddle:'Silla con inspección/reparación',replaceable:'Perno reemplazable y tramo libre equivalente',exception:'Excepción de §8.5.2 con diseño amplificado',no:'Sin detalle conforme a §8.5.2'};
const shearNames={unknown:'No verificado',key:'Llave/tope para corte total',exception:'Excepción §8.5.3 justificada externamente',no:'Sin transferencia conforme'};
const yesNames={unknown:'No verificado',yes:'Sí, declarado por el ingeniero',no:'No'};
const baseNames={unknown:'No verificado',other:'No es base de columna empotrada',fixed:'Base de columna empotrada'};
const routeNames={pending:'Sin clasificar', '7.3.2':'§7.3.2 — material dúctil sin satisfacer §8.5',
 '7.3.3':'§7.3.3 — material no dúctil','8.5':'Posible §8.5 (fuera del motor)',invalid:'Material bajo mínimo general §8.2.3'};
const choose=(obj,v)=>Object.prototype.hasOwnProperty.call(obj,v)?v:'unknown';
const digit=raw=>(raw===undefined||raw===null||String(raw).trim()==='')?null:Number(raw);
function evaluate(values={},calculation='ductile'){
 const material=choose(materialNames,values.material),detail=choose(detailNames,values.detail);
 const shear=choose(shearNames,values.shear),baseType=choose(baseNames,values.baseType);
 const truth=id=>values[id]==='yes'?true:values[id]==='no'?false:null;
 const checks=[]; const check=(name,value)=>checks.push({name,value});
 let geometry=null;
 if(detail==='saddle'||detail==='replaceable'){
  const d=digit(values.diameter_mm),L=digit(values.free_mm),t=digit(values.thread_mm);
  const required=d!==null&&Number.isFinite(d)&&d>0?Math.max(250,8*d):null;
  const supplied=[d,L,t];
  const bad=supplied.some(v=>v!==null&&(!Number.isFinite(v)||v<=0));
  const pass=bad?false:supplied.every(v=>v!==null)?L>=required&&t>=75:null;
  geometry={d,L,t,required,minimumThread:75,pass};
  check('§8.5.2 — L ≥ máx(250 mm; 8d); hilo bajo tuerca ≥75 mm',pass);
 } else if(detail==='exception'){
  check('§8.5.2 — excepción: §4.5 con sismo horizontal 0,7R₁ ≥ 1',truth('detailException'));
 } else check('§8.5.2 — detalle y posibilidad de reparación',detail==='no'?false:null);
 check('§8.5.3 — corte por llave/tope o excepción',shear==='unknown'?null:shear!=='no');
 check('§8.5.4 — no utilizar grout/fricción',truth('noFriction'));
 check('Capacidad de componentes no fusibles',truth('capacity'));
 check('§8.5.5 — pedestal y fundación según cláusula 9',truth('concrete'));
 check('§8.5.2 — demanda mínima de base empotrada',
   baseType==='other'?true:baseType==='fixed'?truth('fixedMoment'):null);
 const anyFailed=checks.some(c=>c.value===false),anyPending=checks.some(c=>c.value===null);
 let route='pending';
 if(material==='invalid')route='invalid';
 else if(material==='limited')route='7.3.3';
 else if(material==='ductile')
  route=anyFailed?'7.3.2':anyPending?'pending':'8.5';
 const expected=route==='7.3.2'?'ductile':route==='7.3.3'?'nonductile':null;
 const compatible=expected!==null&&expected===calculation;
 const calcRoute=calculation==='ductile'?'§7.3.2 (supuesto del motor)':'§7.3.3 (supuesto del motor)';
 const status=route==='invalid'?'Material fuera del mínimo permitido':
  route==='8.5'?'Posible ruta §8.5 (no implementada)':
  route==='pending'?'Clasificación pendiente':
  compatible?'Ruta orientativa compatible':'Incompatibilidad entre clasificación y motor';
 const warning=route==='invalid'?'No acreditar estos anclajes con el material declarado.':
  route==='8.5'?'Las fuerzas de anclajes actuales NO constituyen diseño según §8.5.':
  route==='pending'?'La clasificación está incompleta; el supuesto del motor no está acreditado.':
  compatible?'Coherencia declarativa; NO demuestra resistencia ni conformidad integral.':
  'La ruta declarada NO coincide con el motor: fuerzas de anclajes provisionales.';
 const answers=[
  ['Material (§8.2.3)',materialNames[material]],
  ['Detalle (§8.5.2)',detailNames[detail]],
  ['Excepción de detalle',detail==='exception'?yesNames[choose(yesNames,values.detailException)]:'No aplica'],
  ['Corte (§8.5.3)',shearNames[shear]],
  ['Sin grout/roce (§8.5.4)',yesNames[choose(yesNames,values.noFriction)]],
  ['Componentes no fusibles',yesNames[choose(yesNames,values.capacity)]],
  ['Pedestal/fundación (§8.5.5)',yesNames[choose(yesNames,values.concrete)]],
  ['Tipo de base',baseNames[baseType]],
  ['Momento de base empotrada',baseType==='fixed'?yesNames[choose(yesNames,values.fixedMoment)]:'No aplica']
 ];
 if(geometry){
  const fmt=v=>v===null||!Number.isFinite(v)?'No ingresado':String(v)+' mm';
  answers.push(['Diámetro d',fmt(geometry.d)],['Longitud libre',fmt(geometry.L)],
   ['Hilo bajo tuerca',fmt(geometry.t)],['Mínimo libre',fmt(geometry.required)],
   ['Geometría',geometry.pass===null?'No verificada':geometry.pass?'Límites declarados satisfechos':'No satisface límites']);
 }
 return Object.freeze({route,routeLabel:routeNames[route],status,warning,
  compatible,calcRoute,geometry,checks,answers});
}
return Object.freeze({evaluate});
});
