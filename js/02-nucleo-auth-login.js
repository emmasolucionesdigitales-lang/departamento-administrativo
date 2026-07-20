/* ─── ESCALA ─── */
var ESCALAS={S:12,M:14,L:16,XL:18};
var ORDEN_ESCALA=["S","M","L","XL"];
var escalaActual=localStorage.getItem("adminEscala")||"M";
function aplicarEscala(s){escalaActual=s;document.documentElement.style.fontSize=ESCALAS[s]+"px";var btn=document.getElementById("btn-escala");if(btn)btn.textContent=s;localStorage.setItem("adminEscala",s);}
function ciclarEscala(){var idx=ORDEN_ESCALA.indexOf(escalaActual);aplicarEscala(ORDEN_ESCALA[(idx+1)%ORDEN_ESCALA.length]);}
aplicarEscala(escalaActual);

/* ─── APARIENCIA (claro / oscuro) ─── */
var COLOR_META_TEMA={dark:"#181e26",light:"#ffffff"};
var temaActual=localStorage.getItem("adminTema")||"dark";
function aplicarTema(t){
  temaActual=(t==="light")?"light":"dark";
  document.documentElement.setAttribute("data-theme",temaActual);
  var btn=document.getElementById("btn-tema");
  if(btn)btn.textContent=(temaActual==="light")?"☀️":"🌙";
  var meta=document.getElementById("meta-theme-color");
  if(meta)meta.setAttribute("content",COLOR_META_TEMA[temaActual]);
  localStorage.setItem("adminTema",temaActual);
}
function ciclarTema(){aplicarTema(temaActual==="dark"?"light":"dark");}
aplicarTema(temaActual);

/* ─── FIREBASE ADMIN ─── */
const ADMIN_UID="A10EnUcd3ngbzmFNwWgSFuWj1OR2";
firebase.initializeApp({apiKey:"AIzaSyAFQ4ybqIoVV3rWe1FMjMVUZ-qzLNZbdBk",authDomain:"app-control-de-apps.firebaseapp.com",projectId:"app-control-de-apps",storageBucket:"app-control-de-apps.firebasestorage.app",messagingSenderId:"761424199819",appId:"1:761424199819:web:513eeaf0e54f4e1401d48e"},"admin");
const auth=firebase.app("admin").auth();
const dbControl=firebase.app("admin").firestore();
firebase.initializeApp({apiKey:"AIzaSyDV1i35MLw74hjnSg6rRZgQFIAI8hsJllI",authDomain:"app-reparto-65035.firebaseapp.com",projectId:"app-reparto-65035",storageBucket:"app-reparto-65035.firebasestorage.app",messagingSenderId:"162304851374",appId:"1:162304851374:web:0a60847807c8fe9a7a1c3f"},"reparto");
const dbReparto=firebase.app("reparto").firestore();
firebase.initializeApp({apiKey:"AIzaSyAI3bPrAZlAvduooCaUZPF1LNeJcriL-WI",authDomain:"app-kiosco-c9482.firebaseapp.com",projectId:"app-kiosco-c9482",storageBucket:"app-kiosco-c9482.firebasestorage.app",messagingSenderId:"511057681349",appId:"1:511057681349:web:49c18f441f1700416989ac"},"kiosco");
const dbKiosco=firebase.app("kiosco").firestore();
firebase.initializeApp({apiKey:"AIzaSyBDz-IH9yrOBxkH10rpvDxZ12tyxeG_wSY",authDomain:"sistema-de-gestion-diario.firebaseapp.com",projectId:"sistema-de-gestion-diario",storageBucket:"sistema-de-gestion-diario.firebasestorage.app",messagingSenderId:"708942111150",appId:"1:708942111150:web:f568d5fad93d7e7eb1683f"},"gestion");
const dbGestion=firebase.app("gestion").firestore();
firebase.initializeApp({apiKey:"AIzaSyDl2QhPwVToc4t6UQEGlCydRLzdE4oAx8A",authDomain:"app-polleria-f349b.firebaseapp.com",projectId:"app-polleria-f349b",storageBucket:"app-polleria-f349b.firebasestorage.app",messagingSenderId:"831311117717",appId:"1:831311117717:web:f1101e7fd49ddcbdb64a9c"},"polleria");
const dbPolleria=firebase.app("polleria").firestore();
firebase.initializeApp({apiKey:"AIzaSyD1CqN9t984CCgZsnxTYiv-DIexEVHj2t4",authDomain:"app-reposteria-7e31e.firebaseapp.com",projectId:"app-reposteria-7e31e",storageBucket:"app-reposteria-7e31e.firebasestorage.app",messagingSenderId:"767790519277",appId:"1:767790519277:web:76e0e8194e5f10d0998de4"},"reposteria");
const dbReposteria=firebase.app("reposteria").firestore();
firebase.initializeApp({apiKey:"AIzaSyDJVMa5QMX-5Ldpm5uikNEvdYwLMaMh2eU",authDomain:"app-reparto-multiple.firebaseapp.com",projectId:"app-reparto-multiple",storageBucket:"app-reparto-multiple.firebasestorage.app",messagingSenderId:"568126542462",appId:"1:568126542462:web:e8071e9f287a7fcaf67e2f"},"repartomulti");
const dbRepartoMulti=firebase.app("repartomulti").firestore();
// (la sesión de repartomulti/kiosco/polleria para el admin se abre con
// usuario y contraseña reales en loginGoogle(), no anónima — así las
// reglas nuevas de esas 3 apps reconocen al admin y le dan acceso total.)

/* ─── ESTADO GLOBAL ─── */
var productoActivo="reparto";
var licencias=[],kioscoClientes=[],gestionUsuarios=[],polleriaClientes=[],reposteriaLicencias=[],repartoMultiNegocios=[];
var filtroReparto="",filtroKiosco="",filtroGestion="",filtroPolleriaClientes="",filtroReposteria="",filtroRepartoMulti="";
var MP_ACCESS_TOKEN=localStorage.getItem("mpAccessToken")||"";
var MI_ALIAS_MP=localStorage.getItem("miAliasMp")||"";
var RECARGO_PCT=15,DIA_RECARGO=5,DIA_SUSPENSION=10;

/* ─── CONFIGURACION POR APP ─── */
function getAppConfig(tipo){
  var cfg={
    reparto:{color:"var(--c-4a9eff)",colorBg:"var(--c-0a1a2e)",colorBorder:"#4a9eff50",icon:"🚚",label:"Reparto",firebase:"app-control-de-apps",prefijo:"SR"},
    repartomulti:{color:"var(--c-5dffee)",colorBg:"var(--c-0a2028)",colorBorder:"#5dffee50",icon:"🚛",label:"Reparto Multi",firebase:"app-reparto-multiple",prefijo:"RM"},
    kiosco:{color:"var(--c-a070ff)",colorBg:"var(--c-18102e)",colorBorder:"#a070ff50",icon:"🏪",label:"Kiosco",firebase:"app-kiosco-c9482",prefijo:"KI"},
    gestion:{color:"var(--c-4dd9a0)",colorBg:"var(--c-0a2018)",colorBorder:"#4dd9a050",icon:"💰",label:"Emma Control",firebase:"sistema-de-gestion-diario",prefijo:"EC"},
    polleria:{color:"var(--c-f5a442)",colorBg:"var(--c-201400)",colorBorder:"#f5a44250",icon:"🍗",label:"Pollería",firebase:"app-polleria-f349b",prefijo:"PO"},
    reposteria:{color:"var(--c-f5a0c8)",colorBg:"var(--c-200818)",colorBorder:"#f5a0c850",icon:"🎂",label:"Repostería",firebase:"app-reposteria-7e31e",prefijo:"RE"}
  };
  return cfg[tipo]||{color:"var(--c-c0c8d0)",colorBg:"var(--c-181e26)",colorBorder:"var(--c-3a4050)",icon:"📋",label:tipo,firebase:"—",prefijo:"??"}
}

/* ─── NORMALIZAR CAMPOS POR APP ─── */
function getLicenciaFields(item,tipo){
  if(tipo==="repartomulti"){
    return{
      codigo:item.codigoActivacion||item.id,
      pin:item.pin||"—",
      negocio:item.nombre||"—",
      email:item.ownerEmail||"—",
      celular:item.celular||"—",
      estadoKey:item.bloqueado?"inactivo":"activo",
      esActivo:!item.bloqueado
    };
  }
  // reparto, gestion, reposteria
  return{
    codigo:item.id,
    pin:item.pin||"—",
    negocio:item.negocio||item.nombre||"—",
    email:item.email||"—",
    celular:item.celular||"—",
    estadoKey:item.estado||"activo",
    esActivo:item.estado==="activo"||item.estado==="usado"
  };
}

/* ─── TOAST ─── */
function toast(msg,ok){var t=document.getElementById("toast");t.textContent=msg;t.style.background=(ok===false)?"var(--c-1a0808)":"var(--c-181e26)";t.style.borderColor=(ok===false)?"var(--c-d06060)":"var(--c-4a9eff)";t.style.color=(ok===false)?"var(--c-d06060)":"var(--c-4a9eff)";t.style.opacity="1";setTimeout(function(){t.style.opacity="0";},3000);}
function escHtml(s){return(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/'/g,"&#39;").replace(/"/g,"&quot;");}
function escHtmlBasico(s){return escHtml(s);}

/* ─── AUTH ─── */
// Guarda si cada proyecto secundario quedó (o no) con sesión de admin —
// se usa para esperar antes de cargar datos y para avisar si alguno falló.
// Día a día, cada app se administra desde la base de licencias
// compartida, con tu login normal del panel — no hace falta nada más
// para crear, editar, suspender o borrar clientes.
//
// Esta sesión aparte SOLO se usa para el botón "Resetear dispositivo":
// cuando un cliente pierde el celular, hay que liberar la marca de
// "dueño reclamado" (ownerAuthUid) que vive en el proyecto propio de
// cada app — y eso exige tu cuenta real ahí. Son 5 proyectos (todos
// menos Emma Control, que no usa este mecanismo).
window.adminSecundarios = {repartomulti:null, kiosco:null, polleria:null, reparto:null, reposteria:null};

function abrirSesionesSecundarias(email, pass) {
  var nombres = ["repartomulti","kiosco","polleria","reparto","reposteria"];
  return Promise.all(nombres.map(function(nombreApp){
    return firebase.app(nombreApp).auth().signInWithEmailAndPassword(email,pass)
      .then(function(){ window.adminSecundarios[nombreApp]=true; })
      .catch(function(e){
        window.adminSecundarios[nombreApp]=false;
        console.warn("Admin sin cuenta todavía en "+nombreApp+":",e.code);
      });
  }));
}

// Si la sesión ya estaba guardada de antes (recargaste la página sin
// loguearte de nuevo), Firebase la restaura sola en el proyecto admin,
// pero NO tenemos la contraseña para repetir el login en los otros 5
// proyectos automáticamente. Las que ya quedaron guardadas de una vez
// anterior se restauran solas; si nunca se establecieron, hace falta
// salir y volver a entrar una vez.
window.sesionesSecundariasListo = new Promise(function(resolve){
  var nombres = ["repartomulti","kiosco","polleria","reparto","reposteria"];
  var pendientes = nombres.length;
  nombres.forEach(function(nombreApp){
    var unsub = firebase.app(nombreApp).auth().onAuthStateChanged(function(u){
      unsub();
      if(window.adminSecundarios[nombreApp]===null) window.adminSecundarios[nombreApp] = !!u;
      if(--pendientes<=0) resolve();
    });
  });
});

auth.onAuthStateChanged(async function(user){
  var btn=document.getElementById("btn-escala");
  if(!user){if(btn)btn.style.display="none";renderLogin("");return;}
  if(user.uid!==ADMIN_UID){auth.signOut();renderLogin("Acceso denegado.");return;}
  if(btn)btn.style.display="flex";
  // Espera a que las sesiones secundarias terminen de resolverse (recién
  // logueadas ahora, o restauradas de una sesión guardada) ANTES de
  // cargar los datos — así ninguna pestaña se queda en blanco por haber
  // arrancado a leer antes de tiempo.
  await (window.sesionesSecundariasReady || window.sesionesSecundariasListo);
  var faltantes = Object.keys(window.adminSecundarios).filter(function(k){return window.adminSecundarios[k]===false;});
  renderBannerCuentas(faltantes);
  cargarTodo();
});
function hacerLogin(email,pass){
  if(!email||!pass){toast("Completá email y contraseña",false);return;}
  // Se guarda SOLO en memoria (no en localStorage) — sirve para poder
  // reparar con un click las cuentas admin que falten en los proyectos
  // secundarios, sin tener que volver a escribir la contraseña.
  window._adminEmail = email; window._adminPass = pass;
  window.sesionesSecundariasReady = abrirSesionesSecundarias(email, pass);
  return auth.signInWithEmailAndPassword(email,pass).then(function(){
    // Login ok: si el dispositivo soporta huella/Face ID y todavía no
    // hay una guardada (ni el usuario dijo que no antes), ofrece activarla.
    if(bioSoportado() && !bioEnrolado() && !localStorage.getItem("da_bio_no")){
      setTimeout(function(){
        if(confirm("¿Guardar acceso con huella / Face ID en este dispositivo para la próxima vez?")){
          srBioRegistrar(email,pass);
        }else{
          localStorage.setItem("da_bio_no","1");
        }
      },400);
    }
  }).catch(function(e){toast("Email o contraseña incorrectos",false);});
}
function loginGoogle(){
  var email=document.getElementById("adminEmail")?document.getElementById("adminEmail").value:"";
  var pass=document.getElementById("adminPass")?document.getElementById("adminPass").value:"";
  hacerLogin(email,pass);
}

var NOMBRES_APP_LEGIBLE = {repartomulti:"Reparto Multi", kiosco:"Kiosco", polleria:"Pollería", reparto:"Reparto Individual", reposteria:"Repostería"};

function renderBannerCuentas(faltantes, resultado){
  var el = document.getElementById("banner-cuentas");
  if(!el) return;
  if(!faltantes || !faltantes.length){ el.innerHTML=""; return; }
  var lista = faltantes.map(function(k){ return NOMBRES_APP_LEGIBLE[k]||k; }).join(", ");
  var detalle = "";
  if(resultado && resultado.manual && resultado.manual.length){
    detalle = '<div style="margin-top:6px;font-size:0.78rem;color:var(--c-f0b060)">'+
      resultado.manual.map(function(m){ return "• "+(NOMBRES_APP_LEGIBLE[m.app]||m.app)+": "+m.motivo; }).join("<br>") +
      '</div>';
  }
  el.innerHTML =
    '<div style="background:var(--c-1a1400);border-bottom:1px solid var(--c-c0a060);padding:10px 16px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center;font-family:monospace">'+
      '<span style="color:var(--c-e0c080);font-size:0.82rem">Falta tu cuenta admin en: <b>'+lista+'</b></span>'+
      '<button onclick="repararCuentasFaltantes()" style="background:var(--c-c0a060);color:var(--c-181000);border:none;border-radius:4px;padding:6px 14px;font-size:0.8rem;font-weight:700;cursor:pointer;font-family:monospace">🔧 Reparar automáticamente</button>'+
    '</div>' + detalle;
}

async function repararCuentasFaltantes(){
  var pass = window._adminPass;
  var email = window._adminEmail || (auth.currentUser?auth.currentUser.email:"");
  if(!pass){
    pass = prompt("Ingresá tu contraseña del panel admin para reparar las cuentas faltantes:");
    if(!pass) return;
  }
  var faltantes = Object.keys(window.adminSecundarios).filter(function(k){return window.adminSecundarios[k]===false;});
  if(!faltantes.length) return;
  toast("Reparando "+faltantes.length+" cuenta(s)...");
  var manual = [];
  for(var i=0;i<faltantes.length;i++){
    var nombreApp = faltantes[i];
    try{
      await firebase.app(nombreApp).auth().createUserWithEmailAndPassword(email, pass);
      window.adminSecundarios[nombreApp] = true;
    }catch(e){
      if(e.code==="auth/email-already-in-use"){
        try{
          await firebase.app(nombreApp).auth().sendPasswordResetEmail(email);
          manual.push({app:nombreApp, motivo:"ya existe una cuenta con ese email pero con OTRA contraseña — te mandamos un mail para restablecerla: abrilo, poné la MISMA contraseña que usás para entrar a este panel, y la próxima vez que entres va a iniciar sesión sola (no hace falta tocar nada en Firebase Console)."});
        }catch(e2){
          manual.push({app:nombreApp, motivo:"ya existe una cuenta con ese email pero con OTRA contraseña, y no se pudo enviar el mail de recuperación ("+e2.code+") — como último recurso, borrala en Firebase Console → Authentication → Users y tocá 'Reparar' de nuevo."});
        }
      } else if(e.code==="auth/operation-not-allowed"){
        manual.push({app:nombreApp, motivo:"falta habilitar 'Email/Password' en Firebase Console → Authentication → Sign-in method."});
      } else if(e.code==="auth/weak-password"){
        manual.push({app:nombreApp, motivo:"tu contraseña del panel es muy corta para Firebase (mínimo 6 caracteres) — no se pudo crear ahí."});
      } else {
        manual.push({app:nombreApp, motivo:e.message});
      }
    }
  }
  var faltantesFinal = Object.keys(window.adminSecundarios).filter(function(k){return window.adminSecundarios[k]===false;});
  var arregladas = faltantes.length - faltantesFinal.length;
  if(arregladas>0) toast(arregladas+" cuenta(s) creada(s) — ya podés usar el reset en esas apps.");
  else if(manual.length) toast("No se pudo reparar solo: revisá el detalle abajo.", false);
  renderBannerCuentas(faltantesFinal, {manual:manual});
}
function logout(){auth.signOut();document.getElementById("btn-escala").style.display="none";}

async function cargarTodo(){
  await Promise.all([cargarLicencias(),cargarKioscoClientes(),cargarGestionUsuarios(),cargarPolleriaClientes(),cargarReposteriaLicencias(),cargarRepartoMulti()]);
  await chequearSuspensionesAutomaticas();
  renderMain();
}
