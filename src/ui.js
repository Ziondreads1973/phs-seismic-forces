/* PHS Seismic Forces — control de interfaz y exportaciones */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const motor=globalThis.PHSSeismicMotor;
const report=globalThis.PHSSeismicReport;
let active=null,reports=null;
const display=(n,d=1)=>new Intl.NumberFormat(undefined,{minimumFractionDigits:d,maximumFractionDigits:d,useGrouping:false}).format(n);
const num=id=>$(id).value.trim()===''?NaN:Number($(id).value);
function read(){
 const standard=$('norm').value;
 const W=num('w');
 if(standard==='2369'){
   return motor.calculate2369({weight_kgf:W,category:$('cat').value,zone:$('zone').value,soil:$('soil').value,
     equipment:$('equipment').value,anchor:$('duct').value,location:$('loc2369').value,height_m:num('height'),level_m:num('zk')});
 }
 if(standard==='87')return motor.calculate87({weight_kgf:W,fx:num('fx'),fy:num('fy'),location:$('loc87').value});
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
 $('scope58Note').hidden=n!=='2369'||$('loc2369').value!=='ground';
}
function refreshReports(){
 if(!reports)return;
 $('globalReport').innerHTML=reports.globalHtml;
 $('txtPreview').textContent=reports.textReport;
}
function render(){
 updateVisibility();
 try{
   const r=read();active=r;reports=report.buildReports(r,{
     w:$('w').value,height:$('height').value,zk:$('zk').value,
     fx:$('fx').value,fy:$('fy').value
   });
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