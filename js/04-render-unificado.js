
/* ─── LOGO SVG ─── */
function logoSVG(size){return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88" width="'+size+'" height="'+size+'" style="flex-shrink:0"><line x1="12" y1="16" x2="34" y2="38" stroke="#4a9eff" stroke-width="2" opacity="0.4"/><line x1="76" y1="16" x2="54" y2="38" stroke="#4a9eff" stroke-width="2" opacity="0.4"/><line x1="12" y1="72" x2="34" y2="50" stroke="#8090a8" stroke-width="2" opacity="0.4"/><line x1="76" y1="72" x2="54" y2="50" stroke="#8090a8" stroke-width="2" opacity="0.4"/><circle cx="10" cy="14" r="6" fill="#4a9eff"/><circle cx="78" cy="14" r="6" fill="#8090a8"/><circle cx="10" cy="74" r="6" fill="#8090a8"/><circle cx="78" cy="74" r="6" fill="#4a9eff"/><circle cx="44" cy="44" r="20" fill="#181e26" stroke="#4a9eff" stroke-width="1"/><rect x="34" y="35" width="14" height="2.5" rx="1" fill="#c0c8d0"/><rect x="34" y="43" width="10" height="2.5" rx="1" fill="#c0c8d0"/><rect x="34" y="51" width="14" height="2.5" rx="1" fill="#c0c8d0"/></svg>';}

/* ─── LOGIN ─── */
function renderLogin(err){
  document.getElementById("app").innerHTML=
    '<div class="login-screen">'+
      '<div style="text-align:center">'+logoSVG(64)+
        '<h1 style="font-size:1.2rem;font-weight:600;color:#c0c8d0;margin:12px 0 4px;letter-spacing:0.1em;text-transform:uppercase">Panel Admin</h1>'+
        '<p style="font-size:0.8rem;color:#506070;letter-spacing:0.06em">EMMA SOLUCIONES DIGITALES</p>'+
      '</div>'+
      (err?'<p style="color:#d06060;font-size:0.82rem;text-align:center;font-family:monospace">'+err+'</p>':'')+
      '<div class="login-box">'+
        '<label>Email</label><input id="adminEmail" type="email" placeholder="admin@ejemplo.com" autocomplete="username"/>'+
        '<label>Contraseña</label><input id="adminPass" type="password" placeholder="••••••••" autocomplete="current-password" onkeydown="if(event.keyCode===13)loginGoogle()"/>'+
        '<button class="btn btn-primary" style="width:100%;padding:12px;font-size:0.9rem;margin-top:4px;letter-spacing:0.08em;text-transform:uppercase" onclick="loginGoogle()">Ingresar al sistema</button>'+
        (bioSoportado()&&bioEnrolado()?(
          '<button class="btn" style="width:100%;padding:12px;font-size:0.9rem;margin-top:10px;letter-spacing:0.05em" onclick="srBioVerificar()">🔒 Ingresar con huella</button>'+
          '<p style="text-align:center;margin-top:8px"><a href="#" style="color:#506070;font-size:0.72rem;text-decoration:underline" onclick="srBioOlvidar();return false;">Olvidar huella en este dispositivo</a></p>'
        ):'')+
      '</div>'+
    '</div>';
}

/* ─── RENDER MAIN ─── */
function renderMain(){
  var tabs=[
    {key:"reparto",count:licencias.length},
    {key:"repartomulti",count:repartoMultiNegocios.length},
    {key:"kiosco",count:kioscoClientes.length},
    {key:"gestion",count:gestionUsuarios.length},
    {key:"polleria",count:polleriaClientes.length},
    {key:"reposteria",count:reposteriaLicencias.length}
  ];
  var tabsHtml=tabs.map(function(t){
    var cfg=getAppConfig(t.key);
    var cls="ptab"+(productoActivo===t.key?" activo":"");
    var badge=t.count>0?'<span class="ptab-badge">'+t.count+'</span>':"";
    return '<div class="'+cls+'" data-app="'+t.key+'" title="'+cfg.label+(t.count>0?' ('+t.count+' registros)':'')+'" onclick="cambiarProducto(\''+t.key+'\')">'+
      '<span class="ptab-icon">'+cfg.icon+'</span>'+
      '<span class="ptab-label">'+cfg.label+'</span>'+
      badge+
    '</div>';
  }).join("");
  var bodyContent="";
  if(productoActivo==="reparto")bodyContent=renderReparto();
  else if(productoActivo==="repartomulti")bodyContent=renderRepartoMulti();
  else if(productoActivo==="kiosco")bodyContent=renderKiosco();
  else if(productoActivo==="gestion")bodyContent=renderGestion();
  else if(productoActivo==="polleria")bodyContent=renderPolleria();
  else if(productoActivo==="reposteria")bodyContent=renderReposteria();
  document.getElementById("app").innerHTML=
    '<div class="header">'+
      '<div class="header-title">'+logoSVG(34)+
        '<div><h1>Emma Admin</h1><span>Panel de control</span></div>'+
      '</div>'+
      '<div class="header-actions">'+
        '<button class="btn btn-sm" style="color:#8090a8" onclick="abrirConfigMP()" title="MercadoPago">💳</button>'+
        '<button class="btn btn-sm" onclick="cargarTodo()" title="Actualizar">↻</button>'+
        '<button class="btn btn-sm" onclick="logout()">Salir</button>'+
      '</div>'+
    '</div>'+
    '<div class="product-tabs">'+tabsHtml+'</div>'+
    '<div class="screen">'+resumenCobrosMes()+bodyContent+'</div>';
}
function cambiarProducto(p){productoActivo=p;renderMain();}

/* ─── HELPERS ─── */
function toSlug(s){return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}
function diasRestantes(f){if(!f)return null;return Math.ceil((new Date(f)-new Date())/(1000*60*60*24));}
function fechaPrueba15(){var d=new Date();d.setDate(d.getDate()+15);return d.toISOString().slice(0,10);}
function activarPrueba(idCampo){var el=document.getElementById(idCampo);if(el){el.value=fechaPrueba15();var f=new Date(el.value).toLocaleDateString("es-AR");toast("15 dias de prueba — vence el "+f);}}
function formatFecha(f){if(!f)return"—";return new Date(f).toLocaleDateString("es-AR");}
function validarEmail(email){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);}
function validarCelular(cel){return cel&&cel.replace(/\D/g,"").length>=8;}

/* ─── SISTEMA DE COBROS ─── */
function calcularEstadoCobro(c){
  var precio=Number(c.precioMensual||0);if(!precio)return{estado:"sin_precio",monto:0,montoFinal:0};
  var hoy=new Date();var dia=hoy.getDate();
  var mes=hoy.getFullYear()+"-"+String(hoy.getMonth()+1).padStart(2,"0");
  var pagado=(c.ultimoPago||"").startsWith(mes);
  var recargo=Math.round(precio*(1+RECARGO_PCT/100));
  if(pagado)return{estado:"al_dia",monto:precio,montoFinal:precio};
  if(dia<=DIA_RECARGO)return{estado:"pendiente",monto:precio,montoFinal:precio};
  if(dia<=DIA_SUSPENSION)return{estado:"con_recargo",monto:precio,montoFinal:recargo};
  return{estado:"suspender",monto:precio,montoFinal:recargo};
}
function cobroBadge(c){
  if(!c.precioMensual)return'<span class="cobro-badge cobro-sin">Sin precio</span>';
  var ec=calcularEstadoCobro(c);
  if(ec.estado==="al_dia")return'<span class="cobro-badge cobro-ok">Cobrado</span>';
  if(ec.estado==="pendiente")return'<span class="cobro-badge cobro-pend">$'+ec.montoFinal.toLocaleString("es-AR")+'</span>';
  if(ec.estado==="con_recargo")return'<span class="cobro-badge cobro-recargo">$'+ec.montoFinal.toLocaleString("es-AR")+' +15%</span>';
  return'<span class="cobro-badge cobro-vencido">VENCIDO</span>';
}

/* ─── BREVO ─── */
const BREVO_KEY="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";
async function enviarCodigoBrevo(app,negocio,email,codigo,pin){
  if(!email||!/\S+@\S+\.\S+/.test(email))return;
  const nombres={reparto:"Sistema de Reparto","reparto-multi":"Reparto Multi",kiosco:"Mi Kiosco","emma-control":"Emma Control",polleria:"Gestion Polleria",reposteria:"Dulce Gestion"};
  const appNombre=nombres[app]||app;
  try{
    await fetch("https://api.brevo.com/v3/smtp/email",{method:"POST",headers:{"Content-Type":"application/json","api-key":BREVO_KEY},body:JSON.stringify({
      sender:{name:"Emma Soluciones Digitales",email:"carabajalponce1980@gmail.com"},
      to:[{email:email,name:negocio||email}],
      subject:"Codigo de activacion — "+appNombre,
      htmlContent:"<div style='font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px'><h2 style='color:#185FA5'>Bienvenido a "+appNombre+"</h2><p>Hola <b>"+negocio+"</b>, tu licencia fue creada.</p><div style='background:#f0f4f8;border-radius:12px;padding:20px;text-align:center;margin:20px 0'><p style='font-size:13px;color:#666'>Codigo</p><div style='font-size:28px;font-weight:700;font-family:monospace;letter-spacing:4px;color:#185FA5'>"+codigo+"</div><p style='font-size:13px;color:#666;margin-top:12px'>PIN</p><div style='font-size:32px;font-weight:700;color:#333'>"+pin+"</div></div><p style='font-size:12px;color:#999'>Emma Soluciones Digitales</p></div>"
    })});
  }catch(e){console.warn("Brevo error:",e);}
}

/* ─── CAMPOS COBRO / DUENO ─── */
function camposCobro(c){
  var mp=c&&c.medioPago||"transferencia";
  return'<div style="margin:14px 0 8px;border-top:1px solid #2a3040;padding-top:12px">'+
    '<p style="font-size:0.7rem;color:#8090a8;font-weight:700;margin-bottom:10px;letter-spacing:0.08em;text-transform:uppercase">Datos de cobro</p>'+
    '<label>Inicio del contrato</label><input id="cobro-fecha" type="date" value="'+(c&&c.fechaContrato||"")+'"/>'+
    '<label>Precio mensual ($)</label><input id="cobro-precio" type="number" placeholder="Ej: 8000" value="'+(c&&c.precioMensual||"")+'"/>'+
    '<label>Medio de pago</label>'+
    '<select id="cobro-medio" onchange="toggleAliasMP(this.value)">'+
      '<option value="efectivo"'+(mp==="efectivo"?" selected":"")+'>Efectivo</option>'+
      '<option value="transferencia"'+(mp==="transferencia"?" selected":"")+'>Transferencia</option>'+
      '<option value="mercadopago"'+(mp==="mercadopago"?" selected":"")+'>MercadoPago</option>'+
    '</select>'+
    '<div id="campo-alias" style="display:'+(mp==="mercadopago"||mp==="transferencia"?"block":"none")+'">'+
      '<label>Alias / CBU del cliente</label><input id="cobro-alias" placeholder="Ej: distribuidora.elsol" value="'+(c&&c.aliasMp||"")+'"/>'+
    '</div>'+
  '</div>';
}
function toggleAliasMP(val){var el=document.getElementById("campo-alias");if(el)el.style.display=(val==="mercadopago"||val==="transferencia")?"block":"none";}
function getCobroData(){return{fechaContrato:(document.getElementById("cobro-fecha")||{value:""}).value||null,precioMensual:Number((document.getElementById("cobro-precio")||{value:0}).value)||0,medioPago:(document.getElementById("cobro-medio")||{value:"transferencia"}).value,aliasMp:((document.getElementById("cobro-alias")||{value:""}).value||"").trim()};}
function camposDueno(d){
  return'<div style="margin:12px 0 8px;border-top:1px solid #2a3040;padding-top:12px">'+
    '<p style="font-size:0.7rem;color:#8090a8;font-weight:700;margin-bottom:10px;letter-spacing:0.08em;text-transform:uppercase">Datos del titular</p>'+
    '<label>Nombre</label><input id="cd-nombre" placeholder="Juan" value="'+(d&&d.nombreDueno||"")+'"/>'+
    '<label>Apellido</label><input id="cd-apellido" placeholder="Perez" value="'+(d&&d.apellidoDueno||"")+'"/>'+
    '<label>DNI</label><input id="cd-dni" placeholder="28123456" value="'+(d&&d.dni||"")+'"/>'+
    '<label>Direccion</label><input id="cd-dir" placeholder="Av. Siempreviva 742" value="'+(d&&d.direccion||"")+'"/>'+
  '</div>';
}
function getDuenoData(){return{nombreDueno:((document.getElementById("cd-nombre")||{value:""}).value||"").trim(),apellidoDueno:((document.getElementById("cd-apellido")||{value:""}).value||"").trim(),dni:((document.getElementById("cd-dni")||{value:""}).value||"").trim(),direccion:((document.getElementById("cd-dir")||{value:""}).value||"").trim()};}

/* ─── HELPERS TIPO/DB ─── */
function getClienteByTipo(tipo,id){
  if(tipo==="reparto")return licencias.find(function(x){return x.id===id;});
  if(tipo==="kiosco")return kioscoClientes.find(function(x){return x.id===id;});
  if(tipo==="gestion")return gestionUsuarios.find(function(x){return x.id===id;});
  if(tipo==="polleria")return polleriaClientes.find(function(x){return x.id===id;});
  if(tipo==="reposteria")return reposteriaLicencias.find(function(x){return x.id===id;});
  if(tipo==="repartomulti")return repartoMultiNegocios.find(function(x){return x.id===id;});
  return null;
}
function getDbByTipo(tipo){
  // Reparto, Kiosco, Gestión, Pollería y Repostería se administran todos
  // desde el mismo lugar: la base de licencias compartida. Repartos
  // Múltiples es la única excepción real (los negocios con sus
  // repartidores viven en su propio proyecto).
  if(tipo==="reparto"||tipo==="kiosco"||tipo==="gestion"||tipo==="polleria"||tipo==="reposteria")return{db:dbControl,col:"licencias"};
  if(tipo==="repartomulti")return{db:dbRepartoMulti,col:"negocios"};
  return null;
}

/* ─── BADGES DE ESTADO ─── */
function estadoBadgeUnif(estadoKey,tipo){
  if(tipo==="repartomulti"){
    return estadoKey==="activo"?'<span class="badge badge-cyan">Activo</span>':'<span class="badge badge-red">Bloqueado</span>';
  }
  if(estadoKey==="activo"||estadoKey==="usado")return'<span class="badge badge-green">Activo</span>';
  if(estadoKey==="pendiente")return'<span class="badge badge-orange">Pendiente</span>';
  if(estadoKey==="disponible")return'<span class="badge badge-blue">Disponible</span>';
  return'<span class="badge badge-red">Inactivo</span>';
}

/* ─── RESUMEN COBROS ─── */
function resumenCobrosMes(){
  var todos=[];
  function ag(arr,t){arr.forEach(function(c){if(c.precioMensual)todos.push({t:t,c:c,ec:calcularEstadoCobro(c)});});}
  ag(licencias,"reparto");ag(kioscoClientes,"kiosco");ag(gestionUsuarios,"gestion");ag(polleriaClientes,"polleria");ag(reposteriaLicencias,"reposteria");
  if(!todos.length)return'<div class="seccion-cobro" style="text-align:center;padding:12px 16px"><p style="color:#3a4a58;font-size:0.8rem;font-family:monospace">Sin precios configurados</p><p style="color:#3a4a58;font-size:0.72rem;margin-top:4px">Editá un cliente y completá el precio mensual en la sección <b style="color:#506070">Datos de cobro</b></p></div>';
  var alDia=todos.filter(function(t){return t.ec.estado==="al_dia";});
  var pend=todos.filter(function(t){return t.ec.estado==="pendiente";});
  var rec=todos.filter(function(t){return t.ec.estado==="con_recargo";});
  var susp=todos.filter(function(t){return t.ec.estado==="suspender";});
  var totalCobrado=alDia.reduce(function(s,t){return s+t.ec.montoFinal;},0);
  var totalPend=[].concat(pend,rec,susp).reduce(function(s,t){return s+t.ec.montoFinal;},0);
  return'<div class="seccion-cobro">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'+
      '<span style="font-size:0.78rem;font-weight:600;color:#8090a8;text-transform:uppercase;letter-spacing:0.07em">Cobros del mes</span>'+
      '<button class="btn btn-sm" style="font-size:0.7rem;color:#8090a8" onclick="abrirConfigMP()">Config MP</button>'+
    '</div>'+
    '<div class="grid4" style="margin-bottom:8px">'+
      '<div style="background:#081a10;border:1px solid #4dd9a050;border-radius:4px;padding:8px;text-align:center"><div style="font-size:1rem;font-weight:700;color:#4dd9a0;font-family:monospace">'+alDia.length+'</div><div style="font-size:0.62rem;color:#4dd9a0;text-transform:uppercase;letter-spacing:0.05em">Al dia</div></div>'+
      '<div style="background:#1a2000;border:1px solid #c8e01a50;border-radius:4px;padding:8px;text-align:center"><div style="font-size:1rem;font-weight:700;color:#c8e01a;font-family:monospace">'+pend.length+'</div><div style="font-size:0.62rem;color:#c8e01a;text-transform:uppercase;letter-spacing:0.05em">Pendiente</div></div>'+
      '<div style="background:#201400;border:1px solid #f5a44250;border-radius:4px;padding:8px;text-align:center"><div style="font-size:1rem;font-weight:700;color:#f5a442;font-family:monospace">'+rec.length+'</div><div style="font-size:0.62rem;color:#f5a442;text-transform:uppercase;letter-spacing:0.05em">Recargo</div></div>'+
      '<div style="background:#1a0808;border:1px solid #d0606050;border-radius:4px;padding:8px;text-align:center"><div style="font-size:1rem;font-weight:700;color:#d06060;font-family:monospace">'+susp.length+'</div><div style="font-size:0.62rem;color:#d06060;text-transform:uppercase;letter-spacing:0.05em">Suspender</div></div>'+
    '</div>'+
    '<div style="display:flex;justify-content:space-between;font-size:0.78rem;font-family:monospace">'+
      '<span style="color:#506070">Cobrado: <b style="color:#4dd9a0">$'+totalCobrado.toLocaleString("es-AR")+'</b></span>'+
      '<span style="color:#506070">Por cobrar: <b style="color:#f5a442">$'+totalPend.toLocaleString("es-AR")+'</b></span>'+
    '</div>'+
  '</div>';
}
