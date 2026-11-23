/* Clasificación orientativa; la elección y la comprobación de resistencias son del ingeniero. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PHSAnchorGuide=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const routes=Object.freeze({
 '8.5':'Sistema dúctil que cumple §8.5',
 '7.3.2':'Sistema de materiales dúctiles que no cumple §8.5',
 '7.3.3':'Sistema de materiales no dúctiles'
});
const names={
 material:{unknown:'No verificado',ductile:'Dúctil (alargamiento ≥20 % en 50 mm)',
  nonductile:'No dúctil (14 % ≤ alargamiento <20 %)',invalid:'Bajo mínimo general (<14 %)'},
 answer:{unknown:'No verificado',yes:'Cumple (declaración del ingeniero)',no:'No cumple'}
};
const questions=[
 ['detail','§8.5.2 — Detallamiento y posibilidad de reparación'],
 ['shear','§8.5.3 — Transferencia del corte'],
 ['friction','§8.5.4 — Exclusión de grout y fricción'],
 ['capacity','Diseño por capacidad de los componentes no fusibles'],
 ['foundation','§8.5.5 — Pedestal y fundación según cláusula 9']
];
const safe=(map,key)=>Object.prototype.hasOwnProperty.call(map,key)?key:'unknown';
function evaluate(q={},selected='7.3.2'){
 const material=safe(names.material,q.material);
 const checks=questions.map(([key,label])=>{
  const answer=safe(names.answer,q[key]);
  return {key,label,answer,status:answer==='yes'?true:answer==='no'?false:null};
 });
 let route=null;
 if(material==='invalid')route='invalid';
 else if(material==='nonductile')route='7.3.3';
 else if(material==='ductile'){
  if(checks.some(c=>c.status===false))route='7.3.2';
  else if(checks.every(c=>c.status===true))route='8.5';
 }
 const compatible=route!==null&&route!=='invalid'&&route===selected;
 const status=route==='invalid'?'Material fuera del mínimo general':
  route===null?'Clasificación pendiente':
  compatible?'Clasificación coherente con la selección':'Clasificación diferente de la seleccionada';
 const warning=route==='invalid'?'No se recomienda una ruta de diseño para el material declarado.':
  route===null?'Faltan antecedentes: ninguna clasificación queda acreditada por el asistente.':
  route==='8.5'?'Posible §8.5 según declaraciones; su diseño de anclajes NO está implementado.':
  route==='7.3.2'?'Material dúctil con al menos un requisito §8.5 no conforme; revisar §7.3.2.':
  'Material no dúctil; revisar §7.3.3 y demás requisitos aplicables.';
 const answers=[['Material (§8.2.3)',names.material[material]]];
 if(material==='ductile')for(const c of checks)answers.push([c.label,names.answer[c.answer]]);
 return Object.freeze({
  route,routeLabel:routes[route]||'Sin clasificación sugerida',
  selected,selectedLabel:routes[selected]||'Sin selección válida',
  compatible,status,warning,checks,answers,canApply:route!==null&&route!=='invalid'
 });
}
return Object.freeze({evaluate,routes});
});
