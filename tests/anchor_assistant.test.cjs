'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const g=require('../src/anchor_assistant.js');
const yes={material:'ductile',detail:'yes',shear:'yes',friction:'yes',capacity:'yes',foundation:'yes'};
test('Sin material no emite recomendación',()=>{
 const s=g.evaluate({},'7.3.2');
 assert.equal(s.route,null);assert.equal(s.canApply,false);
});
test('Material no dúctil recomienda §7.3.3',()=>{
 const s=g.evaluate({material:'nonductile'},'7.3.2');
 assert.equal(s.route,'7.3.3');assert.equal(s.compatible,false);
 assert.equal(s.canApply,true);
});
test('Material bajo 14% bloquea clasificación sugerida',()=>{
 const s=g.evaluate({material:'invalid'},'7.3.3');
 assert.equal(s.route,'invalid');assert.equal(s.canApply,false);
});
test('Todos los requisitos §8.5 declarados conformes recomiendan §8.5',()=>{
 const s=g.evaluate(yes,'7.3.2');
 assert.equal(s.route,'8.5');assert.equal(s.compatible,false);
 assert.equal(s.checks.length,5);assert.match(s.warning,/NO está implementado/);
});
test('Un solo incumplimiento declara ruta §7.3.2',()=>{
 for(const k of ['detail','shear','friction','capacity','foundation']){
  const s=g.evaluate({...yes,[k]:'no'},'7.3.2');
  assert.equal(s.route,'7.3.2',k);assert.equal(s.compatible,true);
 }
});
test('Desconocido no se interpreta como conforme a §8.5',()=>{
 for(const k of ['detail','shear','friction','capacity','foundation']){
  const s=g.evaluate({...yes,[k]:'unknown'},'8.5');
  assert.equal(s.route,null,k);assert.equal(s.canApply,false);
 }
});
test('Incumplimiento explícito prima sobre otra respuesta desconocida',()=>{
 const s=g.evaluate({...yes,detail:'no',shear:'unknown'},'7.3.2');
 assert.equal(s.route,'7.3.2');
});
test('Material no dúctil no requiere el checklist de §8.5',()=>{
 const s=g.evaluate({...yes,material:'nonductile'},'7.3.3');
 assert.equal(s.route,'7.3.3');assert.equal(s.answers.length,1);
});
test('Selector manual y recomendación permanecen separados',()=>{
 const s=g.evaluate(yes,'7.3.3');
 assert.equal(s.selected,'7.3.3');assert.equal(s.route,'8.5');
 assert.equal(s.compatible,false);
});
