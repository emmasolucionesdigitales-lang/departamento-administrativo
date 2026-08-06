async function crearClienteKio(){
  var cod=(document.getElementById("k-cod").value||"").trim().toUpperCase();
  var pin=Number(document.getElementById("k-pin").value);
  var nom=(document.getElementById("kom").value||"").trim();
  var id=(document.getElementById("k-id").value||"").trim()||toSlug(nom);
  var ema=(document.getElementById("k-ema").value||"").trim();
  var tel=(document.getElementById("k-tel").value||"").trim();
  var plan=document.getElementById("k-plan").value;
  if(!nom||!id||!cod||!pin){toast("Completa nombre, codigo y PIN",false);return;}
  if(!ema||!validarEmail(ema)){toast("Email invalido",false);return;}
  if(!tel||!validarCelular(tel)){toast("Celular invalido",false);return;}
  var cobro=getCobroData(),dueno=getDuenoData();
  try{
    var venc=(document.getElementById("k-venc")||{value:""}).value||null;
    // Antes esto escribía dos veces (acá y en la base de licencias
    // compartida) — ahora todo vive en un solo lugar, igual que Reparto,
    // Repostería y Emma Control. Así el panel no necesita una cuenta
    // aparte para administrar Kiosco.
    await dbControl.collection("licencias").doc(cod).set(Object.assign({app:"kiosco",estado:"activo",plan:plan,pin:pin,negocioId:id,negocio:nom,email:ema,celular:tel,vencimiento:venc,deviceId:"",aceptoTerminos:false,creadoEn:new Date().toISOString()},dueno,cobro));
    if(ema)await enviarCodigoBrevo("kiosco",nom,ema,cod,pin,id);
    toast(nom+" — Codigo: "+cod+" — PIN: "+pin+(ema?" · Email enviado":""));cargarTodo();mostrarModalQR("kiosco",nom,cod,getAppAccessUrl("kiosco",cod,id));
  }catch(e){toast(e.message,false);}
}
function abrirEditarKio(id){
  var c=kioscoClientes.find(function(x){return x.id===id;});if(!c)return;
  document.getElementById("modal-container").innerHTML=
    '<div class="modal-overlay" onclick="cerrarModal(event)"><div class="modal"><div class="modal-drag"></div>'+
      '<h2 style="font-size:0.95rem;font-weight:600;color:var(--c-a070ff);margin-bottom:14px;letter-spacing:0.08em;text-transform:uppercase">Editar Kiosco</h2>'+
      '<label>Nombre</label><input id="ke-nom" value="'+(c.negocio||"")+'"/>'+
      '<label>Email</label><input id="ke-ema" type="email" value="'+(c.email||"")+'"/>'+
      '<label>Telefono</label><input id="ke-tel" type="tel" value="'+(c.celular||"")+'"/>'+
      camposDueno(c)+
      '<label>Plan</label><select id="ke-plan"><option value="demo"'+(c.plan==="demo"?" selected":"")+'>Demo</option><option value="basic"'+(c.plan==="basic"?" selected":"")+'>Basic</option><option value="pro"'+(c.plan==="pro"?" selected":"")+'>Pro</option></select>'+
      '<label>Vencimiento</label><input id="ke-venc" type="date" value="'+(c.vencimiento||"")+'"/>'+
      '<label>Estado</label><select id="ke-activo"><option value="1"'+(c.estado==="activo"?" selected":"")+'>Activo</option><option value="0"'+(c.estado!=="activo"?" selected":"")+'>Suspendido</option></select>'+
      camposCobro(c)+
      '<div style="display:flex;gap:8px;margin-top:6px"><button class="btn btn-purple" style="flex:1" onclick="guardarEdicionKio(\''+id+'\')">Guardar</button><button class="btn btn-danger btn-sm" onclick="eliminarKio(\''+id+'\')">🗑</button><button class="btn" onclick="cerrarModalBtn()">Cancelar</button></div>'+
    '</div></div>';
}
async function guardarEdicionKio(id){
  var cobro=getCobroData(),dueno=getDuenoData();
  var original=kioscoClientes.find(function(x){return x.id===id;});
  var nom=document.getElementById("ke-nom").value.trim();
  var ema=document.getElementById("ke-ema").value.trim();
  try{
    await dbControl.collection("licencias").doc(id).update(Object.assign({negocio:nom,email:ema,celular:document.getElementById("ke-tel").value.trim(),plan:document.getElementById("ke-plan").value,vencimiento:document.getElementById("ke-venc").value||null,estado:document.getElementById("ke-activo").value==="1"?"activo":"inactivo"},dueno,cobro));
    var reenviar=ema&&validarEmail(ema)&&ema!==(original&&original.email);
    if(reenviar)await enviarCodigoBrevo("kiosco",nom,ema,id,original&&original.pin,original&&original.negocioId);
    toast("Cliente actualizado"+(reenviar?" · Email reenviado":""));cerrarModalBtn();cargarTodo();
  }catch(e){toast(e.message,false);}
}
async function eliminarKio(id){var c=kioscoClientes.find(function(x){return x.id===id;});if(!confirm("Eliminar a "+(c?c.negocio:id)+"?"))return;try{await dbControl.collection("licencias").doc(id).delete();toast("Eliminado");cerrarModalBtn();cargarTodo();}catch(e){toast(e.message,false);}}
async function suspenderKio(id,activo){var c=kioscoClientes.find(function(x){return x.id===id;});if(!confirm((activo?"Activar":"Suspender")+" a "+(c?c.negocio:id)+"?"))return;try{await dbControl.collection("licencias").doc(id).update({estado:activo?"activo":"inactivo"});toast(activo?"Activado":"Suspendido");cargarTodo();}catch(e){toast(e.message,false);}}
async function resetDispositivoKio(id){
  if(!confirm("Resetear dispositivo? Va a poder activar de nuevo desde un celular nuevo."))return;
  try{
    var c=kioscoClientes.find(function(x){return x.id===id;});
    await dbControl.collection("licencias").doc(id).update({deviceId:"",estado:"activo",dispositivos:firebase.firestore.FieldValue.delete(),activadoPorUid:firebase.firestore.FieldValue.delete()});
    // Libera también la marca de "ya reclamado" en el negocio (si no,
    // sigue rechazando la reactivación aunque la licencia ya esté libre).
    var liberado=true;
    if(c&&c.negocioId){
      try{await dbKiosco.collection("negocios").doc(c.negocioId).update({ownerAuthUid:firebase.firestore.FieldValue.delete()});}
      catch(e2){liberado=false;}
    }
    if(liberado) toast("Dispositivo reseteado");
    else toast("Licencia reseteada, pero no se pudo liberar el dispositivo anterior (sesión admin faltante en Kiosco) — salí y volvé a entrar al panel con tu email y contraseña.",false);
    cargarTodo();
  }catch(e){toast(e.message,false);}
}
async function eliminarKioscoCliente(id,nombre){if(!confirm("Eliminar a "+nombre+"?"))return;try{await dbControl.collection("licencias").doc(id).delete();toast("Eliminado");cargarTodo();}catch(e){toast(e.message,false);}}

/* ─── EMMA CONTROL ─── */
function abrirNuevoGestion(){
  var cod=genCodigo("EC"),pin=genPin();
  document.getElementById("modal-container").innerHTML=
    '<div class="modal-overlay" onclick="cerrarModal(event)"><div class="modal"><div class="modal-drag"></div>'+
      '<h2 style="font-size:0.95rem;font-weight:600;color:var(--c-4dd9a0);margin-bottom:14px;letter-spacing:0.08em;text-transform:uppercase">Nueva licencia Emma Control</h2>'+
      '<label>Codigo</label><input id="gnv-cod" value="'+cod+'" style="font-family:monospace;font-weight:700;color:var(--c-4dd9a0)"/>'+
      '<label>PIN</label><input id="gnv-pin" type="number" value="'+pin+'"/>'+
      '<label>Negocio / Cliente</label><input id="gnv-neg" placeholder="Distribuidora El Sol"/>'+
      '<label>Email</label><input id="gnv-ema" type="email" placeholder="cliente@ejemplo.com"/>'+
      '<label>Celular</label><input id="gnv-cel" type="tel" placeholder="381 123-4567"/>'+
      camposDueno(null)+
      '<label>Plan</label><select id="gnv-plan"><option value="demo">Demo</option><option value="basic" selected>Basic</option><option value="pro">Pro</option></select>'+
      '<label>Vencimiento</label><input id="gnv-venc" type="date"/>'+
      '<button type="button" onclick="activarPrueba(&apos;gnv-venc&apos;)" style="width:100%;margin-bottom:10px;padding:10px;border-radius:4px;border:1px solid #4dd9a050;background:var(--c-081a10);color:var(--c-4dd9a0);font-size:0.85rem;cursor:pointer;font-family:monospace">15 dias prueba gratis</button>'+
      '<label>Notas</label><input id="gnv-notas" placeholder="Plan mensual"/>'+
      camposCobro(null)+
      '<div style="display:flex;gap:8px;margin-top:6px"><button class="btn btn-success" style="flex:1" onclick="crearLicenciaGestion()">Crear y enviar</button><button class="btn" onclick="cerrarModalBtn()">Cancelar</button></div>'+
    '</div></div>';
}
async function crearLicenciaGestion(){
  var cod=(document.getElementById("gnv-cod").value||"").trim().toUpperCase();
  var pin=Number(document.getElementById("gnv-pin").value);
  var neg=(document.getElementById("gnv-neg").value||"").trim();
  var ema=(document.getElementById("gnv-ema")||{value:""}).value.trim();
  var cel=(document.getElementById("gnv-cel")||{value:""}).value.trim();
  var plan=document.getElementById("gnv-plan").value;
  var notas=(document.getElementById("gnv-notas").value||"").trim();
  if(!cod||!pin){toast("Codigo y PIN obligatorios",false);return;}
  if(!ema||!validarEmail(ema)){toast("Email invalido",false);return;}
  if(!cel||!validarCelular(cel)){toast("Celular invalido",false);return;}
  var cobro=getCobroData(),dueno=getDuenoData();
  try{
    var venc=(document.getElementById("gnv-venc")||{value:""}).value||null;
    await dbControl.collection("licencias").doc(cod).set(Object.assign({app:"emma-control",negocio:neg,plan:plan,estado:"activo",pin:pin,email:ema,celular:cel,deviceId:"",notas:notas,vencimiento:venc,aceptoTerminos:false,fechaAlta:new Date().toISOString()},dueno,cobro));
    if(ema)await enviarCodigoBrevo("emma-control",neg,ema,cod,pin);
    toast("Licencia "+cod+" — PIN: "+pin+(ema?" · Email enviado":""));cargarTodo();mostrarModalQR("gestion",neg,cod,getAppAccessUrl("gestion",cod));
  }catch(e){toast(e.message,false);}
}
function abrirEditarGestion(id){
  var u=gestionUsuarios.find(function(x){return x.id===id;});if(!u)return;
  var esActivo=u.estado==="usado"||u.estado==="activo";
  document.getElementById("modal-container").innerHTML=
    '<div class="modal-overlay" onclick="cerrarModal(event)"><div class="modal"><div class="modal-drag"></div>'+
      '<h2 style="font-size:0.95rem;font-weight:600;color:var(--c-4dd9a0);margin-bottom:4px;letter-spacing:0.08em;text-transform:uppercase">Editar Emma Control</h2>'+
      '<p style="font-family:monospace;font-size:0.85rem;color:var(--c-4dd9a0);margin-bottom:14px">'+id+'</p>'+
      (u.nombre||u.email?'<div style="background:var(--c-0a2018);border:1px solid #4dd9a030;border-radius:4px;padding:8px 12px;margin-bottom:12px;font-size:0.8rem;color:var(--c-506070);font-family:monospace">Activado por: '+(u.nombre||"")+(u.email?" · "+u.email:"")+'</div>':
       '<div style="background:var(--c-18102e);border-radius:4px;padding:8px 12px;margin-bottom:12px;font-size:0.8rem;color:var(--c-506070);font-family:monospace">Sin activar todavia</div>')+
      '<label>PIN de acceso</label><input id="gnv-pin" type="number" value="'+(u.pin||"")+'"/>'+
      '<label>Negocio / Cliente</label><input id="ge-neg" value="'+(u.negocio||"")+'"/>'+
      camposDueno(u)+
      '<label>Plan</label><select id="ge-plan"><option value="demo"'+(u.plan==="demo"?" selected":"")+'>Demo</option><option value="basic"'+(u.plan==="basic"?" selected":"")+'>Basic</option><option value="pro"'+(u.plan==="pro"?" selected":"")+'>Pro</option></select>'+
      '<label>Vencimiento</label><input id="ge-venc" type="date" value="'+(u.vencimiento||"")+'"/>'+
      '<label>Estado</label><select id="ge-est"><option value="disponible"'+(u.estado==="disponible"?" selected":"")+'>Disponible</option><option value="usado"'+(esActivo?" selected":"")+'>Activo</option><option value="inactivo"'+(u.estado==="inactivo"?" selected":"")+'>Suspendido</option></select>'+
      '<label>Notas</label><input id="ge-not" value="'+(u.notas||"")+'"/>'+
      camposCobro(u)+
      '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-success" style="flex:1" onclick="guardarEdicionGestion(\''+id+'\')">Guardar</button><button class="btn" onclick="cerrarModalBtn()">Cancelar</button></div>'+
    '</div></div>';
}
async function guardarEdicionGestion(id){
  var cobro=getCobroData(),dueno=getDuenoData();
  try{
    await dbControl.collection("licencias").doc(id).update(Object.assign({
      pin:Number(document.getElementById("gnv-pin").value)||0,
      negocio:document.getElementById("ge-neg").value.trim(),
      plan:document.getElementById("ge-plan").value,
      vencimiento:document.getElementById("ge-venc").value||null,
      estado:document.getElementById("ge-est").value,
      notas:document.getElementById("ge-not").value.trim()
    },dueno,cobro));
    toast("Licencia actualizada");cerrarModalBtn();cargarTodo();
  }catch(e){toast(e.message,false);}
}
async function cambiarEstadoGestion(id,estado){var u=gestionUsuarios.find(function(x){return x.id===id;});var n=u?u.negocio||u.nombre||id:id;if(!confirm((estado==="inactivo"?"Suspender":"Activar")+" a "+n+"?"))return;try{await dbControl.collection("licencias").doc(id).update({estado:estado});toast(estado==="inactivo"?"Suspendida":"Activada");cargarTodo();}catch(e){toast(e.message,false);}}
async function eliminarLicenciaGestion(id,nombre){if(!confirm("Eliminar licencia de "+nombre+"?"))return;try{await dbControl.collection("licencias").doc(id).delete();toast("Licencia eliminada");cargarTodo();}catch(e){toast(e.message,false);}}
async function resetDispositivoGestion(id){var l=gestionUsuarios.find(function(x){return x.id===id;});var n=l?l.negocio||l.nombre||id:id;if(!confirm("Resetear dispositivo de "+n+"?"))return;try{await dbControl.collection("licencias").doc(id).update({deviceId:"",estado:"activo",dispositivos:firebase.firestore.FieldValue.delete(),activadoPorUid:firebase.firestore.FieldValue.delete()});toast("Dispositivo reseteado");cargarTodo();}catch(e){toast(e.message,false);}}

/* ─── POLLERIA ─── */
function abrirNuevoPoll(){
  var cod=genCodigo("PO"),pin=genPin();
  document.getElementById("modal-container").innerHTML=
    '<div class="modal-overlay" onclick="cerrarModal(event)"><div class="modal"><div class="modal-drag"></div>'+
      '<h2 style="font-size:0.95rem;font-weight:600;color:var(--c-f5a442);margin-bottom:14px;letter-spacing:0.08em;text-transform:uppercase">Nueva Polleria</h2>'+
      '<label>Codigo</label><input id="p-cod" value="'+cod+'" style="font-family:monospace;font-weight:700;color:var(--c-f5a442)"/>'+
      '<label>PIN</label><input id="p-pin" type="number" value="'+pin+'"/>'+
      '<label>Nombre del negocio</label><input id="p-nom" placeholder="Polleria El Gallo"/>'+
      '<label>ID unico</label><input id="p-id" placeholder="polleria-el-gallo"/>'+
      '<label>Email</label><input id="p-ema" type="email" placeholder="dueno@ejemplo.com"/>'+
      '<label>Telefono</label><input id="p-tel" type="tel" placeholder="381 123-4567"/>'+
      camposDueno(null)+
      '<label>Plan</label><select id="p-plan"><option value="demo">Demo</option><option value="basic" selected>Basic</option><option value="pro">Pro</option></select>'+
      '<label>Vencimiento</label><input id="p-venc" type="date"/>'+
      '<button type="button" onclick="activarPrueba(&apos;p-venc&apos;)" style="width:100%;margin-bottom:10px;padding:10px;border-radius:4px;border:1px solid #4dd9a050;background:var(--c-081a10);color:var(--c-4dd9a0);font-size:0.85rem;cursor:pointer;font-family:monospace">15 dias prueba gratis</button>'+
      camposCobro(null)+
      '<div style="display:flex;gap:8px;margin-top:6px"><button class="btn btn-orange" style="flex:1" onclick="crearClientePoll()">Crear y enviar</button><button class="btn" onclick="cerrarModalBtn()">Cancelar</button></div>'+
    '</div></div>';
  setTimeout(function(){var n=document.getElementById("p-nom"),i=document.getElementById("p-id");if(n&&i)n.oninput=function(){if(!i._t)i.value=toSlug(this.value);};if(i)i.oninput=function(){this._t=true;this.value=this.value.toLowerCase().replace(/[^a-z0-9-]/g,"-");};},100);
}
