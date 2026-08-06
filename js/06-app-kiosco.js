
/* ─── KIOSCO ─── */
async function cargarKioscoClientes(){try{var snap=await dbControl.collection("licencias").get();kioscoClientes=snap.docs.map(function(d){return Object.assign({id:d.id},d.data());}).filter(function(l){return l.app==="kiosco";});}catch(e){console.warn(e);}}
function getKioscoUrl(c){var base=window.location.origin+window.location.pathname.replace("admin_emma.html","").replace("admin.html","");return base+"kiosco.html?id="+(c.negocioId||c.id);}
function renderKiosco(){return renderAppUnificada("kiosco",kioscoClientes,filtroKiosco,"filtroKiosco","abrirNuevoKio()","");}

/* ─── EMMA CONTROL ─── */
async function cargarGestionUsuarios(){try{var snap=await dbControl.collection("licencias").get();gestionUsuarios=snap.docs.map(function(d){return Object.assign({id:d.id},d.data());}).filter(function(l){return l.app==="emma-control";});}catch(e){console.warn(e);}}
function renderGestion(){return renderAppUnificada("gestion",gestionUsuarios,filtroGestion,"filtroGestion","abrirNuevoGestion()","");}

/* ─── POLLERIA ─── */
async function cargarPolleriaClientes(){try{var snap=await dbControl.collection("licencias").get();polleriaClientes=snap.docs.map(function(d){return Object.assign({id:d.id},d.data());}).filter(function(l){return l.app==="polleria";});}catch(e){console.warn(e);}}
function getPolleriaUrl(c){var base=window.location.origin+window.location.pathname.replace("admin_emma.html","").replace("admin.html","");return base+"polleria.html?id="+(c.negocioId||c.id);}
function renderPolleria(){return renderAppUnificada("polleria",polleriaClientes,filtroPolleriaClientes,"filtroPolleriaClientes","abrirNuevoPoll()","");}

/* ─── REPOSTERIA ─── */
async function cargarReposteriaLicencias(){try{var snap=await dbControl.collection("licencias").get();reposteriaLicencias=snap.docs.map(function(d){return Object.assign({id:d.id},d.data());}).filter(function(l){return l.app==="reposteria";});}catch(e){console.warn(e);}}
function renderReposteria(){return renderAppUnificada("reposteria",reposteriaLicencias,filtroReposteria,"filtroReposteria","abrirNuevaReposteria()","");}

/* ─── REPARTO MULTI ─── */
async function cargarRepartoMulti(){
  try{
    var snapNeg=await dbRepartoMulti.collection("negocios").get();
    var snapUsers=await dbRepartoMulti.collection("users").get();
    var users=snapUsers.docs.map(function(d){return Object.assign({uid:d.id},d.data());});
    // Las licencias de control guardan el email y el celular cargados en el alta
    var snapCtrl=await dbControl.collection("licencias").get();
    var ctrlLics={};
    snapCtrl.docs.forEach(function(d){var dd=d.data();if(dd.app==="reparto-multi")ctrlLics[d.id]=dd;});
    repartoMultiNegocios=snapNeg.docs.map(function(d){
      var neg=Object.assign({id:d.id},d.data());
      var dueno=users.find(function(u){return u.uid===neg.ownerId&&u.rol==="dueno";});
      var repartidores=users.filter(function(u){return u.negocioId===neg.id&&u.rol==="repartidor";});
      var lic=ctrlLics[neg.codigoActivacion]||{};
      neg.ownerEmail=(dueno&&dueno.email)||neg.ownerEmail||lic.email||"—";
      neg.celular=neg.celular||lic.celular||(dueno&&(dueno.celular||dueno.telefono))||"—";
      neg.cantRepartidores=repartidores.length;
      neg.repartidores=repartidores;
      return neg;
    });
  }catch(e){console.warn(e);}
}
function renderRepartoMulti(){return renderAppUnificada("repartomulti",repartoMultiNegocios,filtroRepartoMulti,"filtroRepartoMulti","abrirNuevoRepartoMulti()","");}

/* ════════════════════════════════════════
   MODALES — CREAR / EDITAR
════════════════════════════════════════ */
function genCodigo(pref){var chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";return pref+"-"+Array.from({length:6},function(){return chars[Math.floor(Math.random()*chars.length)];}).join("");}
function genPin(){return Math.floor(1000+Math.random()*9000);}

/* ─── URLS DE ACCESO POR APP (para QR) ─── */
var APP_URLS={
  reparto:"https://emmasolucionesdigitales-lang.github.io/sistema-de-reparto-2026/",
  repartomulti:"https://emmasolucionesdigitales-lang.github.io/sistema-de-reparto-multiple/",
  kiosco:"https://emmasolucionesdigitales-lang.github.io/app-kiosco/",
  gestion:"https://emmasolucionesdigitales-lang.github.io/emma-control/",
  polleria:"https://emmasolucionesdigitales-lang.github.io/app-polleria/",
  reposteria:"https://emmasolucionesdigitales-lang.github.io/reposteria/"
};
function getAppAccessUrl(tipo,codigo,negocioId){
  var base=APP_URLS[tipo];if(!base)return"";
  var sep=base.indexOf("?")>=0?"&":"?";
  if((tipo==="kiosco"||tipo==="polleria")&&negocioId)return base+sep+"id="+encodeURIComponent(negocioId);
  return base+sep+"codigo="+encodeURIComponent(codigo||"");
}

/* ─── DIBUJAR QR EN CANVAS (usa la libreria embebida, sin red) ─── */
function dibujarQREnCanvas(canvas,texto,cellSize,margin){
  var qr=qrcode(0,'M');
  qr.addData(texto);
  qr.make();
  var count=qr.getModuleCount();
  var size=count*cellSize+margin*2;
  canvas.width=size;canvas.height=size;
  var ctx=canvas.getContext('2d');
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,size,size);
  ctx.fillStyle='#000000';
  for(var r=0;r<count;r++){
    for(var c=0;c<count;c++){
      if(qr.isDark(r,c))ctx.fillRect(margin+c*cellSize,margin+r*cellSize,cellSize,cellSize);
    }
  }
}

/* ─── MODAL QR DE ACCESO ─── */
function mostrarModalQR(tipo,nombre,codigo,url){
  var cfg=getAppConfig(tipo);
  if(!url){toast("URL de la app no configurada para "+cfg.label,false);return;}
  document.getElementById("modal-container").innerHTML=
    '<div class="modal-overlay" onclick="cerrarModal(event)"><div class="modal" style="text-align:center">'+
      '<div class="modal-drag"></div>'+
      '<h2 style="font-size:0.95rem;font-weight:600;color:'+cfg.color+';margin-bottom:4px;letter-spacing:0.08em;text-transform:uppercase">QR de acceso \u00b7 '+cfg.label+'</h2>'+
      '<p style="font-family:monospace;font-size:0.8rem;color:var(--c-506070);margin-bottom:14px">'+escHtml(nombre||"")+' \u00b7 '+escHtml(codigo||"")+'</p>'+
      '<div id="qr-canvas-wrap" style="display:flex;justify-content:center;margin-bottom:14px;background:#fff;padding:14px;border-radius:8px"></div>'+
      '<p style="font-size:0.68rem;color:var(--c-3a4a58);word-break:break-all;font-family:monospace;margin-bottom:14px">'+escHtml(url)+'</p>'+
      '<div style="display:flex;gap:8px">'+
        '<button class="btn btn-primary" style="flex:1" id="btn-descargar-qr">\u2b07 Descargar</button>'+
        '<button class="btn" style="flex:1" id="btn-copiar-qr">Copiar link</button>'+
      '</div>'+
      '<button class="btn" style="width:100%;margin-top:8px" onclick="cerrarModalBtn()">Cerrar</button>'+
    '</div></div>';
  var wrap=document.getElementById("qr-canvas-wrap");
  var canvas=document.createElement("canvas");
  wrap.appendChild(canvas);
  try{dibujarQREnCanvas(canvas,url,6,12);}
  catch(err){console.warn(err);wrap.innerHTML='<span style="color:#333;font-size:0.8rem">No se pudo generar el QR</span>';}
  var btnD=document.getElementById("btn-descargar-qr");
  if(btnD)btnD.onclick=function(){
    var c=wrap.querySelector("canvas");if(!c)return;
    var a=document.createElement("a");a.href=c.toDataURL("image/png");a.download="QR-"+(codigo||nombre||"acceso")+".png";a.click();
  };
  var btnC=document.getElementById("btn-copiar-qr");
  if(btnC)btnC.onclick=function(){
    navigator.clipboard.writeText(url).then(function(){toast("Link copiado");}).catch(function(){toast("No se pudo copiar",false);});
  };
}
function verQR(tipo,id){
  var item=getClienteByTipo(tipo,id);if(!item)return;
  var f=getLicenciaFields(item,tipo);
  var negocioId=item.negocioId||item.id;
  mostrarModalQR(tipo,f.negocio,f.codigo,getAppAccessUrl(tipo,f.codigo,negocioId));
}

/* ─── NUEVO REPARTO ─── */
function abrirNuevaRep(){
  var cod=genCodigo("SR"),pin=genPin();
  document.getElementById("modal-container").innerHTML=
    '<div class="modal-overlay" onclick="cerrarModal(event)"><div class="modal"><div class="modal-drag"></div>'+
      '<h2 style="font-size:0.95rem;font-weight:600;color:var(--c-4a9eff);margin-bottom:14px;letter-spacing:0.08em;text-transform:uppercase">Nueva licencia Reparto</h2>'+
      '<label>Codigo</label><input id="m-cod" value="'+cod+'" style="font-family:monospace;font-weight:700;color:var(--c-4a9eff)"/>'+
      '<label>PIN</label><input id="m-pin" type="number" value="'+pin+'"/>'+
      '<label>Negocio</label><input id="m-neg" placeholder="Distribuidora El Sol"/>'+
      '<label>Email</label><input id="m-ema" type="email" placeholder="cliente@ejemplo.com"/>'+
      '<label>Celular</label><input id="m-cel" type="tel" placeholder="381 123-4567"/>'+
      camposDueno(null)+
      '<label>Notas (opcional)</label><input id="m-notas" placeholder="Plan mensual"/>'+
      '<label>Vencimiento (opcional)</label><input id="m-venc" type="date"/>'+
      '<button type="button" onclick="activarPrueba(&apos;m-venc&apos;)" style="width:100%;margin-bottom:10px;padding:10px;border-radius:4px;border:1px solid #4dd9a050;background:var(--c-081a10);color:var(--c-4dd9a0);font-size:0.85rem;cursor:pointer;font-family:monospace;letter-spacing:0.06em">15 dias prueba gratis</button>'+
      camposCobro(null)+
      '<div style="display:flex;gap:8px;margin-top:6px"><button class="btn btn-primary" style="flex:1" onclick="crearLicenciaRep()">Crear</button><button class="btn" onclick="cerrarModalBtn()">Cancelar</button></div>'+
    '</div></div>';
}
async function crearLicenciaRep(){
  var codigo=document.getElementById("m-cod").value.trim().toUpperCase();
  var pin=Number(document.getElementById("m-pin").value);
  var neg=document.getElementById("m-neg").value.trim();
  var ema=document.getElementById("m-ema").value.trim();
  var cel=document.getElementById("m-cel").value.trim();
  var notas=document.getElementById("m-notas").value.trim();
  if(!codigo||!pin){toast("Completa codigo y PIN",false);return;}
  if(!ema||!validarEmail(ema)){toast("Email invalido",false);return;}
  if(!cel||!validarCelular(cel)){toast("Celular invalido",false);return;}
  var cobro=getCobroData(),dueno=getDuenoData();
  try{
    var venc=(document.getElementById("m-venc")||{value:""}).value||null;
    await dbControl.collection("licencias").doc(codigo).set(Object.assign({estado:"activo",pin:pin,app:"reparto",plan:"individual",negocio:neg,email:ema,celular:cel,notas:notas,vencimiento:venc,deviceId:"",aceptoTerminos:false,creadoEn:new Date().toISOString()},dueno,cobro));
    if(ema)await enviarCodigoBrevo("reparto",neg,ema,codigo,pin);
    toast("Licencia "+codigo+" — PIN: "+pin+(ema?" · Email enviado":""));
    cargarTodo();mostrarModalQR("reparto",neg,codigo,getAppAccessUrl("reparto",codigo));
  }catch(e){toast(e.message,false);}
}

/* ─── EDITAR REPARTO ─── */
function abrirEditarRep(id){
  var l=licencias.find(function(x){return x.id===id;});if(!l)return;
  document.getElementById("modal-container").innerHTML=
    '<div class="modal-overlay" onclick="cerrarModal(event)"><div class="modal"><div class="modal-drag"></div>'+
      '<h2 style="font-size:0.95rem;font-weight:600;color:var(--c-4a9eff);margin-bottom:4px;letter-spacing:0.08em;text-transform:uppercase">Editar Reparto</h2>'+
      '<p style="font-family:monospace;font-size:0.85rem;color:var(--c-4a9eff);margin-bottom:14px">'+l.id+'</p>'+
      '<label>PIN</label><input id="e-pin" type="number" value="'+(l.pin||"")+'"/>'+
      '<label>Negocio</label><input id="e-neg" value="'+(l.negocio||"")+'"/>'+
      '<label>Email</label><input id="e-ema" type="email" value="'+(l.email||"")+'"/>'+
      '<label>Celular</label><input id="e-cel" type="tel" value="'+(l.celular||"")+'"/>'+
      camposDueno(l)+
      '<label>Notas</label><input id="e-not" value="'+(l.notas||"")+'"/>'+
      camposCobro(l)+
      '<div style="display:flex;gap:8px;margin-top:6px"><button class="btn btn-primary" style="flex:1" onclick="guardarEdicionRep(\''+id+'\')">Guardar</button><button class="btn" onclick="cerrarModalBtn()">Cancelar</button></div>'+
    '</div></div>';
}
async function guardarEdicionRep(id){
  var cobro=getCobroData(),dueno=getDuenoData();
  var original=licencias.find(function(x){return x.id===id;});
  var neg=document.getElementById("e-neg").value.trim();
  var ema=document.getElementById("e-ema").value.trim();
  var pin=Number(document.getElementById("e-pin").value);
  try{
    await dbControl.collection("licencias").doc(id).update(Object.assign({pin:pin,negocio:neg,email:ema,celular:document.getElementById("e-cel").value.trim(),notas:document.getElementById("e-not").value.trim()},dueno,cobro));
    var reenviar=ema&&validarEmail(ema)&&ema!==(original&&original.email);
    if(reenviar)await enviarCodigoBrevo("reparto",neg,ema,id,pin);
    toast("Licencia actualizada"+(reenviar?" · Email reenviado":""));cerrarModalBtn();cargarTodo();
  }catch(e){toast(e.message,false);}
}
async function cambiarEstadoRep(id,estado){if(!confirm((estado==="inactivo"?"Desactivar":"Activar")+" esta licencia?"))return;try{await dbControl.collection("licencias").doc(id).update({estado:estado});toast(estado==="inactivo"?"Desactivada":"Activada");cargarTodo();}catch(e){toast(e.message,false);}}
async function resetDispositivo(id){
  if(!confirm("Resetear dispositivo? Va a poder activar de nuevo desde un celular nuevo."))return;
  try{
    await dbControl.collection("licencias").doc(id).update({deviceId:"",estado:"activo",dispositivos:firebase.firestore.FieldValue.delete(),activadoPorUid:firebase.firestore.FieldValue.delete()});
    try{
      await dbReparto.collection("users").doc(id).update({ownerAuthUid:firebase.firestore.FieldValue.delete()});
      toast("Dispositivo reseteado");
    }catch(e2){
      toast("Licencia reseteada, pero no se pudo liberar el dispositivo anterior (sesión admin faltante en Reparto Individual) — salí y volvé a entrar al panel con tu email y contraseña.",false);
    }
    cargarTodo();
  }catch(e){toast(e.message,false);}
}
async function eliminarLicenciaRep(id,nombre){if(!confirm("Eliminar licencia de "+nombre+"?"))return;try{await dbControl.collection("licencias").doc(id).delete();toast("Licencia eliminada");cargarTodo();}catch(e){toast(e.message,false);}}

/* ─── KIOSCO ─── */
function abrirNuevoKio(){
  var cod=genCodigo("KI"),pin=genPin();
  document.getElementById("modal-container").innerHTML=
    '<div class="modal-overlay" onclick="cerrarModal(event)"><div class="modal"><div class="modal-drag"></div>'+
      '<h2 style="font-size:0.95rem;font-weight:600;color:var(--c-a070ff);margin-bottom:14px;letter-spacing:0.08em;text-transform:uppercase">Nueva licencia Kiosco</h2>'+
      '<label>Codigo</label><input id="k-cod" value="'+cod+'" style="font-family:monospace;font-weight:700;color:var(--c-a070ff)"/>'+
      '<label>PIN</label><input id="k-pin" type="number" value="'+pin+'"/>'+
      '<label>Nombre del negocio</label><input id="k-nom" placeholder="Kiosco El Sol"/>'+
      '<label>ID unico</label><input id="k-id" placeholder="kiosco-el-sol"/>'+
      '<label>Email</label><input id="k-ema" type="email" placeholder="cliente@ejemplo.com"/>'+
      '<label>Celular</label><input id="k-tel" type="tel" placeholder="381 123-4567"/>'+
      camposDueno(null)+
      '<label>Plan</label><select id="k-plan"><option value="demo">Demo</option><option value="basic" selected>Basic</option><option value="pro">Pro</option></select>'+
      '<label>Vencimiento</label><input id="k-venc" type="date"/>'+
      '<button type="button" onclick="activarPrueba(&apos;k-venc&apos;)" style="width:100%;margin-bottom:10px;padding:10px;border-radius:4px;border:1px solid #4dd9a050;background:var(--c-081a10);color:var(--c-4dd9a0);font-size:0.85rem;cursor:pointer;font-family:monospace">15 dias prueba gratis</button>'+
      camposCobro(null)+
      '<div style="display:flex;gap:8px;margin-top:6px"><button class="btn btn-purple" style="flex:1" onclick="crearClienteKio()">Crear y enviar</button><button class="btn" onclick="cerrarModalBtn()">Cancelar</button></div>'+
    '</div></div>';
  setTimeout(function(){var n=document.getElementById("k-nom"),i=document.getElementById("k-id");if(n&&i)n.oninput=function(){if(!i._t)i.value=toSlug(this.value);};if(i)i.oninput=function(){this._t=true;this.value=this.value.toLowerCase().replace(/[^a-z0-9-]/g,"-");};},100);
}
