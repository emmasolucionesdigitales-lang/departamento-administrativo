async function crearClientePoll(){
  var cod=(document.getElementById("p-cod").value||"").trim().toUpperCase();
  var pin=Number(document.getElementById("p-pin").value);
  var nom=(document.getElementById("p-nom").value||"").trim();
  var id=(document.getElementById("p-id").value||"").trim()||toSlug(nom);
  var ema=(document.getElementById("p-ema").value||"").trim();
  var tel=(document.getElementById("p-tel").value||"").trim();
  var plan=document.getElementById("p-plan").value;
  if(!nom||!id||!cod||!pin){toast("Completa nombre, codigo y PIN",false);return;}
  if(!ema||!validarEmail(ema)){toast("Email invalido",false);return;}
  if(!tel||!validarCelular(tel)){toast("Celular invalido",false);return;}
  var cobro=getCobroData(),dueno=getDuenoData();
  try{
    var venc=(document.getElementById("p-venc")||{value:""}).value||null;
    // Mismo cambio que en Kiosco: un solo lugar (licencias compartidas)
    // en vez de escribir también en la base propia de Pollería.
    await dbControl.collection("licencias").doc(cod).set(Object.assign({app:"polleria",estado:"activo",plan:plan,pin:pin,negocioId:id,negocio:nom,email:ema,celular:tel,vencimiento:venc,deviceId:"",aceptoTerminos:false,creadoEn:new Date().toISOString()},dueno,cobro));
    if(ema)await enviarCodigoBrevo("polleria",nom,ema,cod,pin);
    toast(nom+" — Codigo: "+cod+" — PIN: "+pin+(ema?" · Email enviado":""));cargarTodo();mostrarModalQR("polleria",nom,cod,getAppAccessUrl("polleria",cod,id));
  }catch(e){toast(e.message,false);}
}
function abrirEditarPoll(id){
  var c=polleriaClientes.find(function(x){return x.id===id;});if(!c)return;
  document.getElementById("modal-container").innerHTML=
    '<div class="modal-overlay" onclick="cerrarModal(event)"><div class="modal"><div class="modal-drag"></div>'+
      '<h2 style="font-size:0.95rem;font-weight:600;color:#f5a442;margin-bottom:14px;letter-spacing:0.08em;text-transform:uppercase">Editar Polleria</h2>'+
      '<label>Nombre</label><input id="pe-nom" value="'+(c.negocio||"")+'"/>'+
      '<label>Email</label><input id="pe-ema" type="email" value="'+(c.email||"")+'"/>'+
      '<label>Telefono</label><input id="pe-tel" type="tel" value="'+(c.celular||"")+'"/>'+
      camposDueno(c)+
      '<label>Plan</label><select id="pe-plan"><option value="demo"'+(c.plan==="demo"?" selected":"")+'>Demo</option><option value="basic"'+(c.plan==="basic"?" selected":"")+'>Basic</option><option value="pro"'+(c.plan==="pro"?" selected":"")+'>Pro</option></select>'+
      '<label>Vencimiento</label><input id="pe-venc" type="date" value="'+(c.vencimiento||"")+'"/>'+
      '<label>Estado</label><select id="pe-activo"><option value="1"'+(c.estado==="activo"?" selected":"")+'>Activo</option><option value="0"'+(c.estado!=="activo"?" selected":"")+'>Suspendido</option></select>'+
      camposCobro(c)+
      '<div style="display:flex;gap:8px;margin-top:6px"><button class="btn btn-orange" style="flex:1" onclick="guardarEdicionPoll(\''+id+'\')">Guardar</button><button class="btn btn-danger btn-sm" onclick="eliminarPoll(\''+id+'\')">🗑</button><button class="btn" onclick="cerrarModalBtn()">Cancelar</button></div>'+
    '</div></div>';
}
async function guardarEdicionPoll(id){var cobro=getCobroData(),dueno=getDuenoData();try{await dbControl.collection("licencias").doc(id).update(Object.assign({negocio:document.getElementById("pe-nom").value.trim(),email:document.getElementById("pe-ema").value.trim(),celular:document.getElementById("pe-tel").value.trim(),plan:document.getElementById("pe-plan").value,vencimiento:document.getElementById("pe-venc").value||null,estado:document.getElementById("pe-activo").value==="1"?"activo":"inactivo"},dueno,cobro));toast("Polleria actualizada");cerrarModalBtn();cargarTodo();}catch(e){toast(e.message,false);}}
async function eliminarPoll(id){var c=polleriaClientes.find(function(x){return x.id===id;});if(!confirm("Eliminar a "+(c?c.negocio:id)+"?"))return;try{await dbControl.collection("licencias").doc(id).delete();toast("Eliminada");cerrarModalBtn();cargarTodo();}catch(e){toast(e.message,false);}}
async function suspenderPoll(id,activo){var c=polleriaClientes.find(function(x){return x.id===id;});if(!confirm((activo?"Activar":"Suspender")+" a "+(c?c.negocio:id)+"?"))return;try{await dbControl.collection("licencias").doc(id).update({estado:activo?"activo":"inactivo"});toast(activo?"Activada":"Suspendida");cargarTodo();}catch(e){toast(e.message,false);}}
async function resetDispositivoPoll(id){
  if(!confirm("Resetear dispositivo? Va a poder activar de nuevo desde un celular nuevo."))return;
  try{
    var c=polleriaClientes.find(function(x){return x.id===id;});
    var deviceIdViejo=c?c.deviceId||"":"";
    await dbControl.collection("licencias").doc(id).update({deviceId:"",estado:"activo",dispositivos:firebase.firestore.FieldValue.delete(),activadoPorUid:firebase.firestore.FieldValue.delete()});
    // En Pollería el "dueño reclamado" se guarda en polleria/{deviceId} —
    // hay que liberar justo ESE documento (el del dispositivo viejo),
    // si no la reactivación se sigue rechazando.
    var liberado=true;
    if(deviceIdViejo){
      try{await dbPolleria.collection("polleria").doc(deviceIdViejo).update({ownerAuthUid:firebase.firestore.FieldValue.delete()});}
      catch(e2){liberado=false;}
    }
    if(liberado) toast("Dispositivo reseteado");
    else toast("Licencia reseteada, pero no se pudo liberar el dispositivo anterior (sesión admin faltante en Pollería) — salí y volvé a entrar al panel con tu email y contraseña.",false);
    cargarTodo();
  }catch(e){toast(e.message,false);}
}

/* ─── REPOSTERIA ─── */
function abrirNuevaReposteria(){
  var cod=genCodigo("RE"),pin=genPin();
  document.getElementById("modal-container").innerHTML=
    '<div class="modal-overlay" onclick="cerrarModal(event)"><div class="modal"><div class="modal-drag"></div>'+
      '<h2 style="font-size:0.95rem;font-weight:600;color:#f5a0c8;margin-bottom:14px;letter-spacing:0.08em;text-transform:uppercase">Nueva licencia Reposteria</h2>'+
      '<label>Codigo</label><input id="mr-cod" value="'+cod+'" style="font-family:monospace;font-weight:700;color:#f5a0c8"/>'+
      '<label>PIN</label><input id="mr-pin" type="number" value="'+pin+'"/>'+
      '<label>Negocio / Cliente</label><input id="mr-neg" placeholder="Dulce Gestion de Maria"/>'+
      '<label>Email</label><input id="mr-ema" type="email" placeholder="cliente@ejemplo.com"/>'+
      '<label>Celular</label><input id="mr-cel" type="tel" placeholder="381 123-4567"/>'+
      camposDueno(null)+
      '<label>Notas</label><input id="mr-notas" placeholder="Plan mensual"/>'+
      '<label>Vencimiento</label><input id="mr-venc" type="date"/>'+
      '<button type="button" onclick="activarPrueba(&apos;mr-venc&apos;)" style="width:100%;margin-bottom:10px;padding:10px;border-radius:4px;border:1px solid #4dd9a050;background:#081a10;color:#4dd9a0;font-size:0.85rem;cursor:pointer;font-family:monospace">15 dias prueba gratis</button>'+
      camposCobro(null)+
      '<div style="display:flex;gap:8px;margin-top:6px"><button class="btn btn-pink" style="flex:1" onclick="crearLicenciaReposteria()">Crear licencia</button><button class="btn" onclick="cerrarModalBtn()">Cancelar</button></div>'+
    '</div></div>';
}
async function crearLicenciaReposteria(){
  var cod=(document.getElementById("mr-cod").value||"").trim().toUpperCase();
  var pin=Number(document.getElementById("mr-pin").value);
  var neg=(document.getElementById("mr-neg").value||"").trim();
  var ema=(document.getElementById("mr-ema").value||"").trim();
  var cel=(document.getElementById("mr-cel").value||"").trim();
  var notas=(document.getElementById("mr-notas").value||"").trim();
  if(!cod||!pin){toast("Codigo y PIN obligatorios",false);return;}
  if(!ema||!validarEmail(ema)){toast("Email invalido",false);return;}
  if(!cel||!validarCelular(cel)){toast("Celular invalido",false);return;}
  var cobro=getCobroData(),dueno=getDuenoData();
  try{
    var venc=(document.getElementById("mr-venc")||{value:""}).value||null;
    await dbControl.collection("licencias").doc(cod).set(Object.assign({app:"reposteria",estado:"activo",pin:pin,negocio:neg,email:ema,celular:cel,notas:notas,vencimiento:venc,aceptoTerminos:false,deviceId:"",creadoEn:new Date().toISOString()},dueno,cobro));
    if(ema)await enviarCodigoBrevo("reposteria",neg,ema,cod,pin);
    toast("Licencia "+cod+" — PIN: "+pin+(ema?" · Email enviado":""));cargarTodo();mostrarModalQR("reposteria",neg,cod,getAppAccessUrl("reposteria",cod));
  }catch(e){toast(e.message,false);}
}
function abrirEditarReposteria(id){
  var l=reposteriaLicencias.find(function(x){return x.id===id;});if(!l)return;
  document.getElementById("modal-container").innerHTML=
    '<div class="modal-overlay" onclick="cerrarModal(event)"><div class="modal"><div class="modal-drag"></div>'+
      '<h2 style="font-size:0.95rem;font-weight:600;color:#f5a0c8;margin-bottom:4px;letter-spacing:0.08em;text-transform:uppercase">Editar Reposteria</h2>'+
      '<p style="font-family:monospace;font-size:0.85rem;color:#f5a0c8;margin-bottom:14px">'+l.id+'</p>'+
      '<label>PIN</label><input id="er-pin" type="number" value="'+(l.pin||"")+'"/>'+
      '<label>Negocio / Cliente</label><input id="er-neg" value="'+(l.negocio||"")+'"/>'+
      '<label>Email</label><input id="er-ema" type="email" value="'+(l.email||"")+'"/>'+
      '<label>Celular</label><input id="er-cel" type="tel" value="'+(l.celular||"")+'"/>'+
      camposDueno(l)+
      '<label>Notas</label><input id="er-not" value="'+(l.notas||"")+'"/>'+
      camposCobro(l)+
      '<div style="display:flex;gap:8px;margin-top:6px"><button class="btn btn-pink" style="flex:1" onclick="guardarEdicionReposteria(\''+id+'\')">Guardar</button><button class="btn" onclick="cerrarModalBtn()">Cancelar</button></div>'+
    '</div></div>';
}
async function guardarEdicionReposteria(id){var cobro=getCobroData(),dueno=getDuenoData();try{await dbControl.collection("licencias").doc(id).update(Object.assign({pin:Number(document.getElementById("er-pin").value),negocio:document.getElementById("er-neg").value.trim(),email:document.getElementById("er-ema").value.trim(),celular:document.getElementById("er-cel").value.trim(),notas:document.getElementById("er-not").value.trim()},dueno,cobro));toast("Licencia actualizada");cerrarModalBtn();cargarTodo();}catch(e){toast(e.message,false);}}
async function cambiarEstadoReposteria(id,estado){var l=reposteriaLicencias.find(function(x){return x.id===id;});var n=l?l.negocio||id:id;if(!confirm((estado==="inactivo"?"Desactivar":"Activar")+" a "+n+"?"))return;try{await dbControl.collection("licencias").doc(id).update({estado:estado});toast(estado==="inactivo"?"Desactivada":"Activada");cargarTodo();}catch(e){toast(e.message,false);}}
async function resetDispositivoReposteria(id){
  var l=reposteriaLicencias.find(function(x){return x.id===id;});var n=l?l.negocio||id:id;
  if(!confirm("Resetear dispositivo de "+n+"?"))return;
  try{
    var deviceIdViejo=l?l.deviceId||"":"";
    await dbControl.collection("licencias").doc(id).update({deviceId:"",estado:"activo",dispositivos:firebase.firestore.FieldValue.delete(),activadoPorUid:firebase.firestore.FieldValue.delete()});
    var liberado=true;
    if(deviceIdViejo){
      try{await dbReposteria.collection("reposteria").doc(deviceIdViejo).update({ownerAuthUid:firebase.firestore.FieldValue.delete()});}
      catch(e2){liberado=false;}
    }
    if(liberado) toast("Dispositivo reseteado");
    else toast("Licencia reseteada, pero no se pudo liberar el dispositivo anterior (sesión admin faltante en Repostería) — salí y volvé a entrar al panel con tu email y contraseña.",false);
    cargarTodo();
  }catch(e){toast(e.message,false);}
}
async function eliminarLicenciaReposteria(id,nombre){if(!confirm("Eliminar licencia de "+nombre+"?"))return;try{await dbControl.collection("licencias").doc(id).delete();toast("Licencia eliminada");cargarTodo();}catch(e){toast(e.message,false);}}

/* ─── REPARTO MULTI ─── */
function abrirNuevoRepartoMulti(){
  var cod=genCodigo("RM"),pin=genPin();
  document.getElementById("modal-container").innerHTML=
    '<div class="modal-overlay" onclick="cerrarModal(event)"><div class="modal"><div class="modal-drag"></div>'+
      '<h2 style="font-size:0.95rem;font-weight:600;color:#5dffee;margin-bottom:14px;letter-spacing:0.08em;text-transform:uppercase">Nuevo Reparto Multi</h2>'+
      '<label>Codigo</label><input id="rm-cod" value="'+cod+'" style="font-family:monospace;font-weight:700;color:#5dffee"/>'+
      '<label>PIN</label><input id="rm-pin" type="number" value="'+pin+'"/>'+
      '<label>Nombre del negocio</label><input id="rm-nom" placeholder="Distribuidora La Catalina"/>'+
      '<label>Email del dueno</label><input id="rm-ema" type="email" placeholder="dueno@ejemplo.com"/>'+
      '<label>Celular</label><input id="rm-cel" type="tel" placeholder="381 123-4567"/>'+
      camposDueno(null)+
      '<label>Notas</label><input id="rm-notas" placeholder="Plan mensual"/>'+
      '<label>Vencimiento</label><input id="rm-venc" type="date"/>'+
      '<button type="button" onclick="activarPrueba(&apos;rm-venc&apos;)" style="width:100%;margin-bottom:10px;padding:10px;border-radius:4px;border:1px solid #4dd9a050;background:#081a10;color:#4dd9a0;font-size:0.85rem;cursor:pointer;font-family:monospace">15 dias prueba gratis</button>'+
      camposCobro(null)+
      '<div style="display:flex;gap:8px;margin-top:6px"><button class="btn" style="flex:1;background:#0a2028;color:#5dffee;border-color:#5dffee40" onclick="crearNuevoRepartoMulti()">Crear y enviar</button><button class="btn" onclick="cerrarModalBtn()">Cancelar</button></div>'+
    '</div></div>';
}
async function crearNuevoRepartoMulti(){
  var cod=(document.getElementById("rm-cod").value||"").trim().toUpperCase();
  var pin=Number(document.getElementById("rm-pin").value);
  var nom=(document.getElementById("rm-nom").value||"").trim();
  var ema=(document.getElementById("rm-ema").value||"").trim();
  var cel=(document.getElementById("rm-cel").value||"").trim();
  var notas=(document.getElementById("rm-notas").value||"").trim();
  if(!nom||!cod||!pin){toast("Completa nombre, codigo y PIN",false);return;}
  if(!ema||!validarEmail(ema)){toast("Email invalido",false);return;}
  if(!cel||!validarCelular(cel)){toast("Celular invalido",false);return;}
  var cobro=getCobroData(),dueno=getDuenoData();
  try{
    var ref=await dbRepartoMulti.collection("negocios").add(Object.assign({nombre:nom,ownerEmail:ema,celular:cel,ownerId:"",notas:notas,codigoActivacion:cod,pin:pin,aceptoTerminos:false,creadoEn:new Date().toISOString()},dueno));
    var venc=(document.getElementById("rm-venc")||{value:""}).value||null;
    await dbControl.collection("licencias").doc(cod).set(Object.assign({app:"reparto-multi",estado:"activo",pin:pin,negocioId:ref.id,negocio:nom,email:ema,celular:cel,vencimiento:venc,aceptoTerminos:false,deviceId:"",creadoEn:new Date().toISOString()},dueno,cobro));
    await dbRepartoMulti.collection("negocios").doc(ref.id).collection("repartidores").doc(cod).set({negocioId:ref.id,nombre:nom,sectores:[],activo:true,activado:false,deviceId:"",rol:"dueno",creadoEn:new Date().toISOString()});
    if(ema)await enviarCodigoBrevo("reparto-multi",nom,ema,cod,pin);
    toast(nom+" — Codigo: "+cod+" — PIN: "+pin+(ema?" · Email enviado":""));cargarTodo();mostrarModalQR("repartomulti",nom,cod,getAppAccessUrl("repartomulti",cod,ref.id));
  }catch(e){toast(e.message,false);}
}
