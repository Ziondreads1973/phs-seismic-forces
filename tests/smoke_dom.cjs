'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function run(overrides={}){
 const data={norm:'2369',w:'1000',cat:'III',zone:'2',soil:'C',rp:'1.5',height:'4',zk:'0',duct:'duct',ie:'1',loc:'ground',floorVerified:false,fx:'32',fy:'25',anchorType:'post',r:'1',a0:'0.5',xi:'2',saMode:'auto',sa:'1',vertical:'rigid',...overrides};
 const nodes=new Map();
 function node(id){if(!nodes.has(id))nodes.set(id,{value:data[id]??'',checked:!!data[id],innerHTML:'',textContent:'',className:'',classList:{add(){},remove(){},toggle(){}},selectedOptions:[{textContent:'Ruta'}],addEventListener(){}});return nodes.get(id)}
 const document={getElementById:node,querySelectorAll(){return []}};
 const ctx=vm.createContext({document,Number,Math,JSON,window:{},setTimeout(){}});
 vm.runInContext(js,ctx,{timeout:2000});
 return vm.runInContext('last',ctx);
}
function near(a,b){assert.ok(Math.abs(a-b)<1e-7,a+' != '+b)}
let x=run();assert.equal(x.schemaVersion,'0.4');near(x.seismic_demands.anchors.Ex,1.05*x.seismic_demands.structure.Ex);
x=run({norm:'87'});near(x.seismic_demands.anchors.Ey,1.25*x.seismic_demands.structure.Ey);assert.ok(x.seismic_demands.structure.Ey>x.seismic_demands.structure.Ex);
x=run({norm:'88'});near(x.seismic_demands.anchors.Ex,1.5*x.seismic_demands.structure.Ex);
for(const invalid of [{w:'0'},{norm:'87',fx:'19'},{norm:'88',r:'0'},{duct:'justified'},{w:'1e309'}])assert.equal(run(invalid),null);
console.log('8 casos HTML correctos; NO constituyen auditoría normativa');
