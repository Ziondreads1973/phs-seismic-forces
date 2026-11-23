'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const g=require('../src/anchor_assistant.js');
const normal={material:'ductile',detail:'saddle',diameter_mm:'25',free_mm:'260',thread_mm:'80',
 shear:'key',noFriction:'yes',capacity:'yes',concrete:'yes',baseType:'other'};
test('Asistente: sin evidencia no acredita ruta',()=>{
 const s=g.evaluate({},'ductile');
 assert.equal(s.route,'pending');assert.equal(s.compatible,false);
});
test('Asistente: material no dúctil propone 7.3.3 y detecta conflicto',()=>{
 assert.equal(g.evaluate({material:'limited'},'nonductile').compatible,true);
 const s=g.evaluate({material:'limited'},'ductile');
 assert.equal(s.route,'7.3.3');assert.equal(s.compatible,false);
 assert.match(s.warning,/NO coincide/);
});
test('Asistente: material bajo 14% es inválido',()=>{
 const s=g.evaluate({material:'invalid'},'nonductile');
 assert.equal(s.route,'invalid');assert.equal(s.compatible,false);
});
test('Asistente: 8.5 declarativo no se confunde con 7.3.2',()=>{
 const s=g.evaluate(normal,'ductile');
 assert.equal(s.route,'8.5');assert.equal(s.geometry.pass,true);
 assert.equal(s.compatible,false);assert.match(s.warning,/NO constituyen diseño/);
});
test('Asistente: se verifica 8d y 250mm según gobierne',()=>{
 const a=g.evaluate({...normal,diameter_mm:'40',free_mm:'300'},'ductile');
 assert.equal(a.geometry.required,320);assert.equal(a.geometry.pass,false);
 assert.equal(a.route,'7.3.2');
 const b=g.evaluate({...normal,diameter_mm:'20',free_mm:'250'},'ductile');
 assert.equal(b.geometry.required,250);assert.equal(b.geometry.pass,true);
});
test('Asistente: hilo menor de 75 mm no satisface detallamiento',()=>{
 const s=g.evaluate({...normal,thread_mm:'74.99'},'ductile');
 assert.equal(s.geometry.pass,false);assert.equal(s.route,'7.3.2');
});
test('Asistente: geometría omitida no se presume conforme',()=>{
 const s=g.evaluate({...normal,free_mm:''},'ductile');
 assert.equal(s.geometry.pass,null);assert.equal(s.route,'pending');
});
test('Asistente: excepción 8.5.2 requiere respaldo explícito',()=>{
 const a=g.evaluate({...normal,detail:'exception'},'ductile');
 assert.equal(a.route,'pending');
 const b=g.evaluate({...normal,detail:'exception',detailException:'yes'},'ductile');
 assert.equal(b.route,'8.5');
});
test('Asistente: columna empotrada exige justificación de momento',()=>{
 assert.equal(g.evaluate({...normal,baseType:'fixed'},'ductile').route,'pending');
 assert.equal(g.evaluate({...normal,baseType:'fixed',fixedMoment:'yes'},'ductile').route,'8.5');
});
test('Asistente: capacidad externa no verificada no acredita ruta 8.5',()=>{
 const s=g.evaluate({...normal,capacity:'unknown'},'ductile');
 assert.equal(s.route,'pending');assert.equal(s.compatible,false);
});
