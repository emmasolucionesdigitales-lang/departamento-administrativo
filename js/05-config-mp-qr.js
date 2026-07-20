
/* ─── CONFIG MP ─── */
function abrirConfigMP(){
  document.getElementById("modal-container").innerHTML=
    '<div class="modal-overlay" onclick="cerrarModal(event)"><div class="modal"><div class="modal-drag"></div>'+
      '<h2 style="font-size:1rem;font-weight:600;color:var(--c-c0c8d0);margin-bottom:14px;letter-spacing:0.06em;text-transform:uppercase">Config MercadoPago</h2>'+
      '<label>Mi alias MP (para cobrar)</label><input id="cfg-alias" placeholder="emmasoluciones" value="'+MI_ALIAS_MP+'"/>'+
      '<label>Access Token de produccion</label><input id="cfg-token" type="password" placeholder="APP_USR-..." value="'+MP_ACCESS_TOKEN+'"/>'+
      '<div style="display:flex;gap:8px"><button class="btn btn-primary" style="flex:1" onclick="guardarConfigMP()">Guardar</button><button class="btn" onclick="cerrarModalBtn()">Cancelar</button></div>'+
    '</div></div>';
}
function guardarConfigMP(){
  MI_ALIAS_MP=((document.getElementById("cfg-alias")||{value:""}).value||"").trim();
  MP_ACCESS_TOKEN=((document.getElementById("cfg-token")||{value:""}).value||"").trim();
  localStorage.setItem("miAliasMp",MI_ALIAS_MP);localStorage.setItem("mpAccessToken",MP_ACCESS_TOKEN);
  toast("Config MP guardada");cerrarModalBtn();
}

/* ════════════════════════════════════════
   RENDER UNIFICADO — mismo formato todas las apps
════════════════════════════════════════ */
function renderAppUnificada(tipo, lista, filtro, setFiltro, onNuevo, extraTop){
  var cfg=getAppConfig(tipo);
  var filtrados=lista.filter(function(item){
    if(!filtro)return true;
    var f=getLicenciaFields(item,tipo);
    var q=filtro.toLowerCase();
    return(f.codigo||"").toLowerCase().indexOf(q)>=0||
           (f.negocio||"").toLowerCase().indexOf(q)>=0||
           (f.email||"").toLowerCase().indexOf(q)>=0||
           (f.celular||"").indexOf(q)>=0;
  });

  /* stats */
  var activos=lista.filter(function(i){return getLicenciaFields(i,tipo).esActivo;}).length;
  var inactivos=lista.length-activos;

  /* tabla desktop */
  var filas=filtrados.map(function(item){
    var f=getLicenciaFields(item,tipo);
    var acc=accionesBotones(tipo,item,f,"sm");
    return'<tr>'+
      '<td><code style="color:'+cfg.color+';font-size:0.82rem;font-family:monospace;font-weight:700">'+escHtml(f.codigo)+'</code></td>'+
      '<td><code style="color:var(--c-c0a060);font-family:monospace;font-weight:700">'+f.pin+'</code></td>'+
      '<td style="font-weight:500;color:var(--c-c0c8d0)">'+escHtml(f.negocio)+'</td>'+
      '<td style="color:var(--c-7080a0);font-size:0.8rem">'+escHtml(f.email)+'</td>'+
      '<td style="color:var(--c-7080a0);font-size:0.8rem">'+escHtml(f.celular)+'</td>'+
      '<td>'+estadoBadgeUnif(f.estadoKey,tipo)+'</td>'+
      '<td>'+cobroBadge(item)+'</td>'+
      '<td>'+acc+'</td>'+
    '</tr>';
  }).join("");

  /* cards mobil */
  var cards=filtrados.map(function(item){
    var f=getLicenciaFields(item,tipo);
    return'<div class="lic-card" style="border-left:2px solid '+cfg.color+'">'+
      '<div class="lic-card-top">'+
        '<span class="lic-codigo" style="color:'+cfg.color+'">'+escHtml(f.codigo)+'</span>'+
        estadoBadgeUnif(f.estadoKey,tipo)+
      '</div>'+
      '<div class="lic-card-fila"><span class="lbl">PIN</span><code style="color:var(--c-c0a060);font-family:monospace;font-weight:700;font-size:0.95rem">'+f.pin+'</code></div>'+
      '<div class="lic-card-fila"><span class="lbl">Negocio</span><span class="val" style="color:var(--c-c0c8d0);font-weight:500">'+escHtml(f.negocio)+'</span></div>'+
      '<div class="lic-card-fila"><span class="lbl">Correo</span><span class="val">'+escHtml(f.email)+'</span></div>'+
      '<div class="lic-card-fila"><span class="lbl">Celular</span><span class="val">'+escHtml(f.celular)+'</span></div>'+
      '<div class="lic-card-fila"><span class="lbl">Cobro</span>'+cobroBadge(item)+'</div>'+
      '<div class="lic-card-actions">'+accionesBotones(tipo,item,f,"card")+'</div>'+
    '</div>';
  }).join("");

  return'<div style="margin:12px 0 10px"><div style="font-size:1.15rem;font-weight:700;color:'+cfg.color+';letter-spacing:0.06em">'+cfg.icon+' '+cfg.label+'</div><div style="font-size:0.68rem;color:var(--c-3a4a58);font-family:monospace;margin-top:2px">'+cfg.firebase+'</div></div>'+
    '<div class="grid4" style="margin-bottom:12px">'+
      '<div class="stat-card"><div class="stat-num">'+lista.length+'</div><div class="stat-label">Total</div></div>'+
      '<div class="stat-card"><div class="stat-num" style="color:var(--c-4dd9a0)">'+activos+'</div><div class="stat-label">Activos</div></div>'+
      '<div class="stat-card"><div class="stat-num" style="color:var(--c-d06060)">'+inactivos+'</div><div class="stat-label">Inactivos</div></div>'+
      '<div class="stat-card"><div class="stat-num" style="color:'+cfg.color+'">'+filtrados.length+'</div><div class="stat-label">Filtrados</div></div>'+
    '</div>'+
    (extraTop||"")+
    '<div style="display:flex;gap:8px;margin-bottom:12px;align-items:center">'+
      '<div class="search-wrap" style="flex:1;margin:0">'+
        '<span class="search-icon">🔍</span>'+
        '<input placeholder="Buscar codigo, negocio, correo..." oninput="'+setFiltro+'=this.value.toLowerCase();renderMain()" value="'+filtro+'"/>'+
      '</div>'+
      '<button class="btn btn-sm" style="background:'+cfg.colorBg+';color:'+cfg.color+';border-color:'+cfg.color+'50;white-space:nowrap;font-size:0.78rem" onclick="'+onNuevo+'">+ Nueva</button>'+
    '</div>'+
    '<div class="desktop-only card" style="padding:0;overflow:hidden">'+
      '<div class="table-wrap"><table>'+
        '<thead><tr>'+
          '<th>Codigo</th><th>PIN</th><th>Negocio</th><th>Correo</th><th>Celular</th><th>Estado</th><th>Cobro</th><th>Acciones</th>'+
        '</tr></thead>'+
        '<tbody>'+(filas||'<tr><td colspan="8" style="text-align:center;color:var(--c-3a4a58);padding:30px;font-family:monospace">Sin registros</td></tr>')+'</tbody>'+
      '</table></div>'+
    '</div>'+
    '<div class="mobile-only">'+(cards||'<div style="text-align:center;color:var(--c-3a4a58);padding:40px;font-family:monospace">Sin registros</div>')+'</div>'+
    '<p style="font-size:0.7rem;color:var(--c-3a4a58);text-align:center;margin-top:8px;padding-bottom:60px;font-family:monospace">'+filtrados.length+'/'+lista.length+' registros · '+cfg.label+'</p>';
}

/* ─── ACCIONES BOTONES (unificado por tipo) ─── */
function accionesBotones(tipo,item,f,modo){
  var id=item.id;
  var esActivo=f.esActivo;
  var s=modo==="sm"?"btn-sm ":"";
  var acc="";
  var neg=escHtml(f.negocio||"");
  var nom=escHtml(item.nombre||f.negocio||id);

  /* ✏️ Editar */
  if(tipo==="reparto")acc+=`<button class="btn ${s}" title="Editar licencia" style="background:var(--c-0a1a2e);color:var(--c-4a9eff);border-color:#4a9eff40" onclick="abrirEditarRep('${id}')">✏️</button>`;
  else if(tipo==="kiosco")acc+=`<button class="btn ${s}" title="Editar cliente" style="background:var(--c-18102e);color:var(--c-a070ff);border-color:#a070ff40" onclick="abrirEditarKio('${id}')">✏️</button>`;
  else if(tipo==="gestion")acc+=`<button class="btn ${s}" title="Editar licencia" style="background:var(--c-0a2018);color:var(--c-4dd9a0);border-color:#4dd9a040" onclick="abrirEditarGestion('${id}')">✏️</button>`;
  else if(tipo==="polleria")acc+=`<button class="btn ${s}" title="Editar pollería" style="background:var(--c-201400);color:var(--c-f5a442);border-color:#f5a44240" onclick="abrirEditarPoll('${id}')">✏️</button>`;
  else if(tipo==="reposteria")acc+=`<button class="btn ${s}" title="Editar licencia" style="background:var(--c-200818);color:var(--c-f5a0c8);border-color:#f5a0c840" onclick="abrirEditarReposteria('${id}')">✏️</button>`;
  else if(tipo==="repartomulti")acc+=`<button class="btn ${s}" title="Editar negocio" style="background:var(--c-0a2028);color:var(--c-5dffee);border-color:#5dffee40" onclick="abrirEditarMulti('${id}')">✏️</button>`;

  /* 💳 Cobrar */
  acc+=`<button class="btn ${s}" title="Registrar cobro / ver historial de pagos" style="background:var(--c-18103a);color:var(--c-a070ff);border-color:#a070ff40" onclick="abrirCobrar('${tipo}','${id}')">💳</button>`;

  /* 🔳 Ver QR de acceso */
  acc+=`<button class="btn ${s}" title="Ver código QR de acceso a la app" style="background:var(--c-10141a);color:var(--c-c0c8d0);border-color:var(--c-3a4050)" onclick="verQR('${tipo}','${id}')">🔳</button>`;

  /* 📱 Reset dispositivo */
  if(tipo==="reparto")acc+=`<button class="btn ${s}" title="Resetear dispositivo — el cliente podrá activar desde un celular nuevo" style="background:var(--c-1a1400);color:var(--c-c0a060);border-color:#c0a06040" onclick="resetDispositivo('${id}')">📱</button>`;
  else if(tipo==="gestion")acc+=`<button class="btn ${s}" title="Resetear dispositivo — el cliente podrá activar desde un celular nuevo" style="background:var(--c-1a1400);color:var(--c-c0a060);border-color:#c0a06040" onclick="resetDispositivoGestion('${id}')">📱</button>`;
  else if(tipo==="kiosco")acc+=`<button class="btn ${s}" title="Resetear dispositivo — el cliente podrá activar desde un celular nuevo" style="background:var(--c-1a1400);color:var(--c-c0a060);border-color:#c0a06040" onclick="resetDispositivoKio('${id}')">📱</button>`;
  else if(tipo==="polleria")acc+=`<button class="btn ${s}" title="Resetear dispositivo — el cliente podrá activar desde un celular nuevo" style="background:var(--c-1a1400);color:var(--c-c0a060);border-color:#c0a06040" onclick="resetDispositivoPoll('${id}')">📱</button>`;
  else if(tipo==="reposteria")acc+=`<button class="btn ${s}" title="Resetear dispositivo — el cliente podrá activar desde un celular nuevo" style="background:var(--c-1a1400);color:var(--c-c0a060);border-color:#c0a06040" onclick="resetDispositivoReposteria('${id}')">📱</button>`;
  else if(tipo==="repartomulti")acc+=`<button class="btn ${s}" title="Resetear dispositivo del dueño — podrá activar desde un celular nuevo" style="background:var(--c-1a1400);color:var(--c-c0a060);border-color:#c0a06040" onclick="resetDispositivoMulti('${id}')">📱</button>`;

  /* 🔴/✅ Activar / Desactivar */
  if(tipo==="reparto"){
    if(esActivo)acc+=`<button class="btn ${s} btn-danger" title="Desactivar — el cliente perderá el acceso" onclick="cambiarEstadoRep('${id}','inactivo')">🔴</button>`;
    else acc+=`<button class="btn ${s} btn-success" title="Activar licencia" onclick="cambiarEstadoRep('${id}','activo')">✅</button>`;
  }else if(tipo==="kiosco"){
    if(esActivo)acc+=`<button class="btn ${s} btn-danger" title="Suspender acceso" onclick="suspenderKio('${id}',false)">🔴</button>`;
    else acc+=`<button class="btn ${s} btn-success" title="Activar acceso" onclick="suspenderKio('${id}',true)">✅</button>`;
  }else if(tipo==="gestion"){
    if(esActivo)acc+=`<button class="btn ${s} btn-danger" title="Suspender licencia" onclick="cambiarEstadoGestion('${id}','inactivo')">🔴</button>`;
    else acc+=`<button class="btn ${s} btn-success" title="Activar licencia" onclick="cambiarEstadoGestion('${id}','usado')">✅</button>`;
  }else if(tipo==="polleria"){
    if(esActivo)acc+=`<button class="btn ${s} btn-danger" title="Suspender acceso" onclick="suspenderPoll('${id}',false)">🔴</button>`;
    else acc+=`<button class="btn ${s} btn-success" title="Activar acceso" onclick="suspenderPoll('${id}',true)">✅</button>`;
  }else if(tipo==="reposteria"){
    if(esActivo)acc+=`<button class="btn ${s} btn-danger" title="Desactivar licencia" onclick="cambiarEstadoReposteria('${id}','inactivo')">🔴</button>`;
    else acc+=`<button class="btn ${s} btn-success" title="Activar licencia" onclick="cambiarEstadoReposteria('${id}','activo')">✅</button>`;
  }else if(tipo==="repartomulti"){
    if(esActivo)acc+=`<button class="btn ${s} btn-danger" title="Bloquear negocio — el dueño no podrá entrar" onclick="bloquearNegocioMulti('${id}',true,'${nom}')">🔴</button>`;
    else acc+=`<button class="btn ${s} btn-success" title="Desbloquear negocio" onclick="bloquearNegocioMulti('${id}',false,'${nom}')">✅</button>`;
  }

  /* 👥 Repartidores (solo multi) */
  if(tipo==="repartomulti")acc+=`<button class="btn ${s}" title="Ver y gestionar repartidores" style="background:var(--c-0a2028);color:var(--c-5dffee);border-color:#5dffee40" onclick="verRepartidores('${id}')">👥</button>`;

  /* 🗑️ Eliminar */
  if(tipo==="reparto")acc+=`<button class="btn ${s} btn-danger" title="Eliminar licencia permanentemente" onclick="eliminarLicenciaRep('${id}','${neg}')">🗑️</button>`;
  else if(tipo==="kiosco")acc+=`<button class="btn ${s} btn-danger" title="Eliminar cliente permanentemente" onclick="eliminarKioscoCliente('${id}','${neg}')">🗑️</button>`;
  else if(tipo==="gestion")acc+=`<button class="btn ${s} btn-danger" title="Eliminar licencia permanentemente" onclick="eliminarLicenciaGestion('${id}','${neg}')">🗑️</button>`;
  else if(tipo==="polleria")acc+=`<button class="btn ${s} btn-danger" title="Eliminar pollería permanentemente" onclick="eliminarPoll('${id}')">🗑️</button>`;
  else if(tipo==="reposteria")acc+=`<button class="btn ${s} btn-danger" title="Eliminar licencia permanentemente" onclick="eliminarLicenciaReposteria('${id}','${neg}')">🗑️</button>`;
  else if(tipo==="repartomulti")acc+=`<button class="btn ${s} btn-danger" title="Eliminar negocio y repartidores" onclick="eliminarNegocioMulti('${id}','${nom}')">🗑️</button>`;

  return acc;
}

/* ════════════════════════════════════════
   CARGAR + RENDER POR APP
════════════════════════════════════════ */

/* ─── REPARTO ─── */
async function cargarLicencias(){try{var snap=await dbControl.collection("licencias").get();licencias=snap.docs.map(function(d){return Object.assign({id:d.id},d.data());}).filter(function(l){return !l.app||l.app==="reparto";});}catch(e){console.warn(e);}}
function renderReparto(){
  var pend=licencias.filter(function(l){return l.estado==="pendiente";}).length;
  var extra=pend>0?'<div style="background:var(--c-201400);border:1px solid #f5a44250;border-radius:4px;padding:8px 12px;margin-bottom:10px;font-size:0.8rem;color:var(--c-f5a442);font-family:monospace">'+pend+' licencia(s) pendiente(s) de activacion</div>':"";
  return renderAppUnificada("reparto",licencias,filtroReparto,"filtroReparto","abrirNuevaRep()",extra);
}
