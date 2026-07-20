function abrirEditarMulti(id){
  var n=repartoMultiNegocios.find(function(x){return x.id===id;});if(!n)return;
  document.getElementById("modal-container").innerHTML=
    '<div class="modal-overlay" onclick="cerrarModal(event)"><div class="modal"><div class="modal-drag"></div>'+
      '<h2 style="font-size:0.95rem;font-weight:600;color:var(--c-5dffee);margin-bottom:14px;letter-spacing:0.08em;text-transform:uppercase">Editar Reparto Multi</h2>'+
      '<label>Nombre</label><input id="em-nom" value="'+(n.nombre||"")+'"/>'+
      '<label>Email</label><input id="em-ema" type="email" value="'+(n.ownerEmail||"")+'"/>'+
      '<label>Celular</label><input id="em-cel" type="tel" value="'+(n.celular&&n.celular!=="—"?n.celular:"")+'"/>'+
      camposDueno(n)+
      '<label>Notas</label><input id="em-notas" value="'+(n.notas||"")+'"/>'+
      '<label>Codigo</label><input id="em-cod" value="'+(n.codigoActivacion||"")+'"/>'+
      '<label>PIN</label><input id="em-pin" type="number" value="'+(n.pin||"")+'"/>'+
      camposCobro(n)+
      '<div style="display:flex;gap:8px;margin-top:6px"><button class="btn" style="flex:1;background:var(--c-0a2028);color:var(--c-5dffee);border-color:#5dffee40" onclick="guardarEdicionMulti(\''+id+'\')">Guardar</button><button class="btn" onclick="cerrarModalBtn()">Cancelar</button></div>'+
    '</div></div>';
}
async function guardarEdicionMulti(id){
  var nom=(document.getElementById("em-nom").value||"").trim();
  var ema=(document.getElementById("em-ema").value||"").trim();
  var cel=(document.getElementById("em-cel").value||"").trim();
  var notas=(document.getElementById("em-notas").value||"").trim();
  var cod=(document.getElementById("em-cod").value||"").trim().toUpperCase();
  var pin=Number(document.getElementById("em-pin").value);
  var dueno=getDuenoData();
  if(!nom){toast("El nombre es obligatorio",false);return;}
  try{await dbRepartoMulti.collection("negocios").doc(id).update(Object.assign({nombre:nom,ownerEmail:ema,celular:cel,notas:notas,codigoActivacion:cod,pin:pin},dueno));toast("Negocio actualizado");cerrarModalBtn();cargarTodo();}
  catch(e){toast(e.message,false);}
}
async function bloquearNegocioMulti(id,bloquear,nombre){if(!confirm((bloquear?"Bloquear":"Desbloquear")+" "+nombre+"?"))return;try{await dbRepartoMulti.collection("negocios").doc(id).update({bloqueado:bloquear});toast(bloquear?"Bloqueado":"Desbloqueado");cargarTodo();}catch(e){toast(e.message,false);}}
async function eliminarNegocioMulti(id,nombre){if(!confirm("Eliminar negocio "+nombre+"? Esta accion no se puede deshacer."))return;try{var neg=repartoMultiNegocios.find(function(n){return n.id===id;});var pr=[];if(neg&&neg.repartidores)neg.repartidores.forEach(function(r){pr.push(dbRepartoMulti.collection("users").doc(r.uid).delete());});pr.push(dbRepartoMulti.collection("negocios").doc(id).delete());await Promise.all(pr);toast("Negocio eliminado");cargarTodo();}catch(e){toast(e.message,false);}}
async function resetDispositivoMulti(id){
  var n=repartoMultiNegocios.find(function(x){return x.id===id;});
  var cod=n?n.codigoActivacion||"":id;
  if(!cod){toast("Sin codigo de licencia",false);return;}
  if(!confirm("Resetear dispositivo del dueño? Va a poder activar de nuevo desde un celular nuevo."))return;
  try{
    // Dos cosas hay que liberar, no una sola: el dispositivo guardado en
    // la licencia (para que la app deje poner el código de nuevo), Y el
    // "ownerAuthUid" del negocio (la marca de "ya fue reclamado" que
    // impide que cualquier otro se haga pasar por el dueño). Si sólo se
    // limpia la licencia, la reactivación se sigue rechazando porque el
    // negocio todavía figura como reclamado por el dispositivo viejo.
    await dbControl.collection("licencias").doc(cod).update({deviceId:"",estado:"activo",dispositivos:firebase.firestore.FieldValue.delete(),activadoPorUid:firebase.firestore.FieldValue.delete()});
    await dbRepartoMulti.collection("negocios").doc(id).update({ownerAuthUid:firebase.firestore.FieldValue.delete()});
    toast("Dispositivo reseteado");cargarTodo();
  }catch(e){toast(e.message,false);}
}
async function verRepartidores(negocioId){
  var neg=repartoMultiNegocios.find(function(n){return n.id===negocioId;});if(!neg)return;
  var repSnap=null;try{repSnap=await dbRepartoMulti.collection("negocios").doc(negocioId).collection("repartidores").get();}catch(e){}
  var lista=(repSnap&&!repSnap.empty)?repSnap.docs.map(function(d){return Object.assign({uid:d.id},d.data());}):(neg.repartidores||[]);
  var filas=lista.length===0?'<p style="color:var(--c-3a4a58);font-size:0.82rem;text-align:center;padding:16px;font-family:monospace">Sin repartidores</p>':lista.map(function(r){
    var bl=r.bloqueado===true;
    var rn=escHtml(r.nombre||"");
    var uid=r.uid||"";
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--c-1e242e)">
      <div>
        <div style="font-weight:500;color:var(--c-c0c8d0);font-size:0.88rem">${r.nombre||"Sin nombre"}${bl?'<span style="background:var(--c-1a0808);color:var(--c-d06060);font-size:0.65rem;padding:1px 6px;border-radius:3px;margin-left:6px;border:1px solid #d0606050">BLOQ</span>':""}</div>
        <div style="font-size:0.75rem;color:var(--c-506070);font-family:monospace">${r.email||"—"}</div>
      </div>
      <div style="display:flex;gap:5px">
        ${bl
          ?`<button class="btn btn-sm btn-success" onclick="toggleBloqueoRepartidor('${uid}',false,'${rn}')">✅</button>`
          :`<button class="btn btn-sm btn-danger" onclick="toggleBloqueoRepartidor('${uid}',true,'${rn}')">🔴</button>`}
        <button class="btn btn-sm btn-danger" onclick="eliminarRepartidorMulti('${uid}','${rn}')">🗑</button>
      </div>
    </div>`;
  }).join("");
  
document.getElementById("modal-container").innerHTML=
    '<div class="modal-overlay" onclick="cerrarModal(event)"><div class="modal"><div class="modal-drag"></div>'+
      '<h2 style="font-size:0.95rem;font-weight:600;color:var(--c-5dffee);margin-bottom:4px;letter-spacing:0.08em;text-transform:uppercase">Repartidores</h2>'+
      '<p style="font-family:monospace;font-size:0.82rem;color:var(--c-5dffee);margin-bottom:14px">'+escHtml(neg.nombre)+'</p>'+
      filas+
      '<button class="btn" style="width:100%;margin-top:12px" onclick="cerrarModalBtn()">Cerrar</button>'+
    '</div></div>';
}
async function toggleBloqueoRepartidor(uid,bloquear,nombre){if(!confirm((bloquear?"Bloquear":"Desbloquear")+" a "+nombre+"?"))return;try{await dbRepartoMulti.collection("users").doc(uid).update({bloqueado:bloquear});toast(bloquear?"Bloqueado":"Desbloqueado");cerrarModalBtn();cargarTodo();}catch(e){toast(e.message,false);}}
async function eliminarRepartidorMulti(uid,nombre){if(!confirm("Eliminar repartidor "+nombre+"?"))return;try{await dbRepartoMulti.collection("users").doc(uid).delete();toast("Repartidor eliminado");cerrarModalBtn();cargarTodo();}catch(e){toast(e.message,false);}}

/* ─── SISTEMA DE COBROS ─── */
function abrirCobrar(tipo,id){
  var c=getClienteByTipo(tipo,id);if(!c)return;
  var ec=calcularEstadoCobro(c);
  var cfg=getAppConfig(tipo);
  var f=getLicenciaFields(c,tipo);
  var nombre=f.negocio||id;
  var hist=(c.historialPagos||[]).slice(-5).reverse();
  var histHtml=hist.length===0?'<p style="color:var(--c-3a4a58);font-size:0.8rem;text-align:center;padding:10px;font-family:monospace">Sin pagos registrados</p>':hist.map(function(p){return'<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--c-1e242e);font-size:0.8rem"><span style="color:var(--c-506070);font-family:monospace">'+formatFecha(p.fecha)+'</span><span style="color:var(--c-4dd9a0);font-weight:700;font-family:monospace">$'+Number(p.monto).toLocaleString("es-AR")+'</span><span style="color:var(--c-506070);font-family:monospace">'+(p.via||"Manual")+'</span></div>';}).join("");
  var montoFinal=ec.montoFinal||0;
  var estadoBox="";
  if(ec.estado==="al_dia")estadoBox='<div style="background:var(--c-081a10);border:1px solid #4dd9a050;border-radius:4px;padding:10px;margin-bottom:12px;text-align:center;color:var(--c-4dd9a0);font-family:monospace;font-size:0.85rem">PAGO REGISTRADO ESTE MES</div>';
  else if(ec.estado==="pendiente")estadoBox='<div style="background:var(--c-1a2000);border:1px solid #c8e01a50;border-radius:4px;padding:10px;margin-bottom:12px;color:var(--c-c8e01a);font-family:monospace;font-size:0.82rem">PENDIENTE · Sin recargo hasta dia '+DIA_RECARGO+' · $'+montoFinal.toLocaleString("es-AR")+'</div>';
  else if(ec.estado==="con_recargo")estadoBox='<div style="background:var(--c-201400);border:1px solid #f5a44250;border-radius:4px;padding:10px;margin-bottom:12px;color:var(--c-f5a442);font-family:monospace;font-size:0.82rem">CON RECARGO +'+RECARGO_PCT+'% · $'+montoFinal.toLocaleString("es-AR")+'</div>';
  else estadoBox='<div style="background:var(--c-1a0808);border:1px solid #d0606050;border-radius:4px;padding:10px;margin-bottom:12px;color:var(--c-d06060);font-family:monospace;font-size:0.82rem">VENCIDO — SUSPENDER ACCESO · $'+montoFinal.toLocaleString("es-AR")+'</div>';
  document.getElementById("modal-container").innerHTML=
    '<div class="modal-overlay" onclick="cerrarModal(event)"><div class="modal"><div class="modal-drag"></div>'+
      '<h2 style="font-size:0.95rem;font-weight:600;color:'+cfg.color+';margin-bottom:4px;letter-spacing:0.08em;text-transform:uppercase">Cobrar</h2>'+
      '<p style="font-family:monospace;font-size:0.82rem;color:var(--c-506070);margin-bottom:12px">'+escHtml(nombre)+'</p>'+
      estadoBox+
      '<label>Monto a registrar ($)</label><input id="cobro-monto" type="number" value="'+montoFinal+'"/>'+
      '<div style="display:flex;gap:8px;margin-bottom:12px">'+
        `<button class="btn btn-success" style="flex:1" onclick="marcarPagado('${tipo}','${id}')">Marcar pagado</button>`+
        `<button class="btn" style="background:var(--c-0a1a2e);color:var(--c-4a9eff);border-color:#4a9eff30;flex:1" onclick="verificarPagoMP('${tipo}','${id}')">Verificar MP</button>`+
      '</div>'+
      (ec.estado==="suspender"?`<button class="btn btn-danger" style="width:100%;margin-bottom:10px" onclick="suspenderPorPago('${tipo}','${id}')">Suspender acceso ahora</button>`:'')+ 
      '<div style="border-top:1px solid var(--c-2a3040);padding-top:10px"><p style="font-size:0.72rem;color:var(--c-506070);margin-bottom:8px;font-family:monospace;text-transform:uppercase;letter-spacing:0.06em">Ultimos pagos</p>'+histHtml+'</div>'+
      '<button class="btn" style="width:100%;margin-top:10px" onclick="cerrarModalBtn()">Cerrar</button>'+
    '</div></div>';
}
async function marcarPagado(tipo,id){
  var monto=Number((document.getElementById("cobro-monto")||{value:0}).value)||0;
  if(!monto){toast("Ingresa un monto",false);return;}
  var ref=getDbByTipo(tipo),c=getClienteByTipo(tipo,id);if(!ref||!c)return;
  var hist=(c.historialPagos||[]);
  var hoy=new Date().toISOString().slice(0,10);
  hist.push({fecha:hoy,monto:monto,via:"Manual"});
  var upd={ultimoPago:hoy,historialPagos:hist};
  if(tipo==="reparto"||tipo==="reposteria"||tipo==="kiosco"||tipo==="polleria"){if(c.estado==="inactivo")upd.estado="activo";}
  else if(tipo==="gestion"){if(c.estado==="inactivo")upd.estado="usado";}
  try{await ref.db.collection(ref.col).doc(id).update(upd);toast("Pago $"+monto.toLocaleString("es-AR")+" registrado");cerrarModalBtn();cargarTodo();}
  catch(e){toast(e.message,false);}
}
async function verificarPagoMP(tipo,id){
  if(!MP_ACCESS_TOKEN){toast("Configura tu Access Token de MP",false);setTimeout(abrirConfigMP,600);return;}
  var hoy=new Date();var ini=new Date(hoy.getFullYear(),hoy.getMonth(),1).toISOString();var fin=new Date(hoy.getFullYear(),hoy.getMonth()+1,0,23,59,59).toISOString();
  toast("Consultando MercadoPago...");
  try{
    var resp=await fetch("https://api.mercadopago.com/v1/payments/search?external_reference="+encodeURIComponent(id)+"&status=approved&sort=date_created&criteria=desc&range=date_created&begin_date="+encodeURIComponent(ini)+"&end_date="+encodeURIComponent(fin),{headers:{"Authorization":"Bearer "+MP_ACCESS_TOKEN}});
    if(!resp.ok){toast("Error MP: "+resp.status,false);return;}
    var data=await resp.json();
    if(data.results&&data.results.length>0){
      var pago=data.results[0];var monto=pago.transaction_amount||0;
      var fechaPago=(pago.date_approved||new Date().toISOString()).slice(0,10);
      var ref=getDbByTipo(tipo),c=getClienteByTipo(tipo,id);
      var hist=(c&&c.historialPagos)||[];hist.push({fecha:fechaPago,monto:monto,via:"MercadoPago",mpId:pago.id});
      var upd={ultimoPago:fechaPago,historialPagos:hist};
      if(tipo==="reparto"||tipo==="reposteria"||tipo==="kiosco"||tipo==="polleria"){if(c&&c.estado==="inactivo")upd.estado="activo";}
      else if(tipo==="gestion"){if(c&&c.estado==="inactivo")upd.estado="usado";}
      await ref.db.collection(ref.col).doc(id).update(upd);
      toast("Pago verificado MP: $"+monto.toLocaleString("es-AR"));cerrarModalBtn();cargarTodo();
    }else{toast("No se encontro pago aprobado este mes",false);}
  }catch(e){toast("Error MP: "+(e.message||""),false);}
}
async function suspenderPorPago(tipo,id){
  var c=getClienteByTipo(tipo,id);var nombre=c?c.nombre||c.negocio||id:id;
  if(!confirm("Suspender acceso a "+nombre+" por falta de pago?"))return;
  var ref=getDbByTipo(tipo);if(!ref)return;
  var upd={};
  if(tipo==="reparto"||tipo==="reposteria"||tipo==="kiosco"||tipo==="polleria")upd.estado="inactivo";
  else if(tipo==="gestion")upd.estado="inactivo";
  try{await ref.db.collection(ref.col).doc(id).update(upd);toast(nombre+" suspendido");cerrarModalBtn();cargarTodo();}catch(e){toast(e.message,false);}
}

/* ─── SUSPENSIONES AUTOMATICAS ─── */
async function chequearSuspensionesAutomaticas(){
  var hoy=new Date(),dia=hoy.getDate();
  if(dia<=DIA_SUSPENSION)return;
  var mes=hoy.getFullYear()+"-"+String(hoy.getMonth()+1).padStart(2,"0");
  function necesita(c){return c.precioMensual&&!(c.ultimoPago||"").startsWith(mes);}
  var pr=[],susp=0;
  licencias.forEach(function(l){if(necesita(l)&&l.estado!=="inactivo"&&l.estado!=="pendiente"){pr.push(dbControl.collection("licencias").doc(l.id).update({estado:"inactivo"}));l.estado="inactivo";susp++;}});
  kioscoClientes.forEach(function(c){if(necesita(c)&&c.estado!=="inactivo"){pr.push(dbControl.collection("licencias").doc(c.id).update({estado:"inactivo"}));c.estado="inactivo";susp++;}});
  gestionUsuarios.forEach(function(u){if(necesita(u)&&u.estado!=="inactivo"&&u.estado!=="disponible"){pr.push(dbControl.collection("licencias").doc(u.id).update({estado:"inactivo"}));u.estado="inactivo";susp++;}});
  polleriaClientes.forEach(function(c){if(necesita(c)&&c.estado!=="inactivo"){pr.push(dbControl.collection("licencias").doc(c.id).update({estado:"inactivo"}));c.estado="inactivo";susp++;}});
  reposteriaLicencias.forEach(function(l){if(necesita(l)&&l.estado!=="inactivo"&&l.estado!=="pendiente"){pr.push(dbControl.collection("licencias").doc(l.id).update({estado:"inactivo"}));l.estado="inactivo";susp++;}});
  if(pr.length)try{await Promise.all(pr);if(susp>0)toast(susp+" cliente(s) suspendidos automaticamente",false);}catch(e){console.warn(e);}
}

/* ─── HELPERS MODALES ─── */
function cerrarModal(e){if(e.target.classList.contains("modal-overlay"))cerrarModalBtn();}
function cerrarModalBtn(){document.getElementById("modal-container").innerHTML="";}
