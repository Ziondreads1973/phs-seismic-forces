'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const m=require('../src/motor.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(b)));
const n=(o={})=>({weight_kgf:1000,category:'III',zone:2,soil:'C',equipment:'electrical-mechanical',anchor:'ductile',location:'ground',...o});
const a=(o={})=>({weight_kgf:1000,IE:1,fx:35,fy:35,location:'ground',...o});
const b=(o={})=>({weight_kgf:1000,vertical:'rigid',location:'ground',...o});
test('2369 basal y amplificación dúctil',()=>{
 const r=m.calculate2369(n());
 near(r.factors.Rp,3);near(r.factors.ak_over_g,1.2*.42*1.05);
 near(r.anchors.Ex,r.structure.Ex*2.1);near(r.anchors.Ez,r.structure.Ez);
 assert.equal(r.inputs.height_m,null);
});
test('2369 no dúctil elevada',()=>{
 const r=m.calculate2369(n({anchor:'nonductile',location:'elevated',height_m:6,level_m:3}));
 near(r.factors.Rp,1.5);near(r.factors.ak_over_g,2*1.2*.42*1.05);
});
test('2369 factores suelo y clasificación',()=>{
 near(m.calculate2369(n({soil:'D'})).factors.kv,1.1);
 near(m.calculate2369(n({soil:'E'})).factors.kv,1);
 near(m.classifyRp('secondary-ductile','nonductile'),3);
 near(m.classifyRp('secondary-nonductile','ductile'),1.5);
});
test('2369 alturas fuera de rango',()=>{
 for(const o of [{location:'elevated',height_m:0,level_m:1},{location:'elevated',height_m:2,level_m:0},{location:'elevated',height_m:2,level_m:3}])
 assert.throws(()=>m.calculate2369(n(o)),RangeError);
});
test('Art87 caso A basal',()=>{
 const r=m.calculate87(a());near(r.anchors.Ex,750);near(r.anchors.Ey,750);near(r.anchors.Ez,360);
});
test('Art87 caso B 25/35 Hz',()=>{
 const r=m.calculate87(a({fx:25}));near(r.anchors.Ex,1012.5);near(r.anchors.Ey,750);
});
test('Art87 caso C piso superior',()=>{
 const r=m.calculate87(a({fx:25,fy:25,location:'floor'}));
 near(r.anchors.Ex,1518.75);near(r.anchors.Ey,1518.75);near(r.anchors.Ez,504);
});
test('Art87 frecuencias límite',()=>{
 near(m.calculate87(a({fx:20})).factors.KhX,1.35);
 near(m.calculate87(a({fx:29.99})).factors.KhX,1.35);
 near(m.calculate87(a({fx:30})).factors.KhX,1);
 assert.throws(()=>m.calculate87(a({fx:19.99})),RangeError);
});
test('Art88 parámetros espectrales fijos',()=>{
 const r=m.calculate88(b());
 near(r.factors.IE,1);near(r.factors.R,1);near(r.factors.A0_g,.5);
 near(r.factors.xi_pct,2);near(r.factors.Sa_over_g,1.3721778749538622);
});
test('Art88 fuerzas V1 y anclajes',()=>{
 const r=m.calculate88(b());
 near(r.structure.Ex,1.2*r.factors.Sa_over_g*1000);
 near(r.anchors.Ex,1.5*r.structure.Ex);near(r.anchors.Ez,360);
});
test('Art88 fuerzas V2 en piso superior',()=>{
 const r=m.calculate88(b({vertical:'flex',location:'floor'}));
 near(r.anchors.Ex,1.5*1.2*r.factors.Sa_over_g*1000*1.5);
 near(r.anchors.Ez,0.72*r.factors.Sa_over_g*1000*1.4);
});
test('Invalidaciones',()=>{
 for(const fn of [
 ()=>m.calculate2369(n({weight_kgf:0})),
 ()=>m.calculate2369(n({location:'unsupported'})),
 ()=>m.calculate87(a({IE:0})),
 ()=>m.calculate87(a({weight_kgf:Infinity})),
 ()=>m.calculate88(b({vertical:'unknown'})),
 ()=>m.calculate88(b({location:'special'}))
 ])assert.throws(fn,RangeError);
});
