/* PHS Fuerzas Sísmicas — motor numérico (criterios FS-01..FS-05)
 * Funciones puras. Los resultados representan magnitudes por dirección, no combinaciones.
 * Reportes y UI deberán leer siempre este mismo resultado.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PHSSeismicMotor=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const IMPORTANCE={I:0.8,II:1,III:1.2,IV:1.2};
  const AR={'1':0.28,'2':0.42,'3':0.56};
  const SOIL={A:0.9,B:1,C:1.05,D:1,E:1};
  const KV={A:1.2,B:1.2,C:1.2,D:1.1,E:1};
  const Kp=2.2;
  function finite(value,label,positive=false){
    if(typeof value!=='number'||!Number.isFinite(value)||(positive?value<=0:value<0))
      throw new RangeError(label+': valor numérico inválido');
    return value;
  }
  function oneOf(v,allowed,label){
    if(!allowed.includes(v))throw new RangeError(label+': clasificación fuera de alcance');
    return v;
  }
  function complete(r){
    for(const group of [r.structure,r.anchors]){
      for(const key of ['Ex','Ey','Ez'])finite(group[key],key);
    }
    return r;
  }
  function locFactors(location){
    oneOf(location,['ground','modular','floor'],'ubicación');
    return {horizontal:location==='floor'?1.5:1,vertical:location==='floor'?1.4:1};
  }
  function classifyRp(equipment,anchor){
    oneOf(equipment,['electrical-mechanical','secondary-ductile','secondary-nonductile','other-specified'],'equipo');
    oneOf(anchor,['ductile','nonductile'],'anclajes');
    if(equipment==='electrical-mechanical')return anchor==='ductile'?3:1.5;
    if(equipment==='secondary-ductile')return 3;
    return 1.5;
  }
  function calculate2369(d){
    const W=finite(d.weight_kgf,'peso sísmico',true);
    const category=oneOf(d.category,Object.keys(IMPORTANCE),'categoría de importancia');
    const zone=oneOf(String(d.zone),Object.keys(AR),'zona sísmica');
    const soil=oneOf(d.soil,Object.keys(SOIL),'tipo de suelo');
    const equipment=oneOf(d.equipment,['electrical-mechanical','secondary-ductile','secondary-nonductile','other-specified'],'clasificación');
    const anchor=oneOf(d.anchor,['ductile','nonductile'],'tipo de anclaje');
    const location=oneOf(d.location,['ground','modular','elevated'],'ubicación');
    let H=null,Zk=0;
    if(location==='elevated'){
      H=finite(d.height_m,'altura H',true);
      Zk=finite(d.level_m,'altura Zk',true);
      if(Zk>H)throw new RangeError('Zk no puede superar H');
    }
    const I=IMPORTANCE[category],Ar=AR[zone],S=SOIL[soil],kv=KV[soil];
    const Rp=classifyRp(equipment,anchor);
    const base=I*Ar*S;
    const ak=base*(1+(location==='elevated'?2*Zk/H:0));
    const Cp=ak*Kp/Rp;
    const Cx=Math.min(3*base,Math.max(0.7*base,Cp));
    const Cv=kv*base;
    const multiplier=anchor==='ductile'?0.7*Rp:Rp;
    const horizontal=Cx*W,vertical=Cv*W;
    return complete({
      method:'NCh2369:2025-cap7',weight_kgf:W,
      inputs:{category,zone,soil,equipment,anchor,location,height_m:H,level_m:Zk},
      factors:{I,Ar_over_g:Ar,S,kv,Kp,Rp,ak_over_g:ak,Cp,Cmin:0.7*base,Cmax:3*base,
        structure:{X:Cx,Y:Cx,Z:Cv},anchor_multiplier:{horizontal:multiplier,vertical:1}},
      structure:{Ex:horizontal,Ey:horizontal,Ez:vertical},
      anchors:{Ex:horizontal*multiplier,Ey:horizontal*multiplier,Ez:vertical}
    });
  }
  function kh(f,label){
    finite(f,label,true);
    if(f<20)throw new RangeError(label+': frecuencia inferior a 20 Hz');
    return f<30?1.35:1;
  }
  function calculate87(d){
    const W=finite(d.weight_kgf,'peso sísmico',true);
    const IE=finite(d.IE,'IE',true);
    const fx=finite(d.fx,'fX',true),fy=finite(d.fy,'fY',true);
    const KhX=kh(fx,'fX'),KhY=kh(fy,'fY');
    const location=oneOf(d.location,['ground','modular','floor'],'ubicación');
    const loc=locFactors(location);
    const Cx=.60*IE*KhX*loc.horizontal, Cy=.60*IE*KhY*loc.horizontal, Cv=.36*IE*loc.vertical;
    const s={Ex:Cx*W,Ey:Cy*W,Ez:Cv*W};
    return complete({method:'CNE-Art87',weight_kgf:W,
      inputs:{IE,fx,fy,location},
      factors:{KhX,KhY,Kv:1,location:loc,structure:{X:Cx,Y:Cy,Z:Cv},
        anchor_multiplier:{horizontal:1.25,vertical:1}},
      structure:s,anchors:{Ex:s.Ex*1.25,Ey:s.Ey*1.25,Ez:s.Ez}});
  }
  function calculate88(d){
    const W=finite(d.weight_kgf,'peso sísmico',true);
    const vertical=oneOf(d.vertical,['rigid','flex'],'modelo vertical');
    const location=oneOf(d.location,['ground','modular','floor'],'ubicación');
    const loc=locFactors(location);
    const IE=1,R=1,A0=.5,xi=2;
    const Fb=(3.21-.68*Math.log(xi))/2.1156;
    const Sa=2.12*A0*Fb;
    const Cx=1.2*IE*Sa/R*loc.horizontal;
    const Cv=(vertical==='rigid'?.36*IE:.72*IE*Sa/R)*loc.vertical;
    const s={Ex:Cx*W,Ey:Cx*W,Ez:Cv*W};
    return complete({method:'CNE-Art88',weight_kgf:W,
      inputs:{location,vertical,classification:'electrical-cell'},
      factors:{IE,R,A0_g:A0,xi_pct:xi,Fb,Sa_over_g:Sa,location:loc,
        structure:{X:Cx,Y:Cx,Z:Cv},anchor_multiplier:{horizontal:1.5,vertical:1}},
      structure:s,anchors:{Ex:s.Ex*1.5,Ey:s.Ey*1.5,Ez:s.Ez}});
  }
  return Object.freeze({calculate2369,calculate87,calculate88,classifyRp,locFactors});
});