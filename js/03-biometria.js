/* ───────────────────────────────────────────────────────────
   BIOMETRIA (huella / Face ID) — WebAuthn
   Permite, después de un login exitoso con email+contraseña,
   guardar un acceso rápido con huella/Face ID en ESTE dispositivo.
   WebAuthn no "recuerda" la contraseña por sí solo: lo que hacemos
   es registrar una credencial de plataforma (huella/Face ID del
   celular o notebook) y, si esa verificación es exitosa, liberar
   el email+contraseña guardados localmente para hacer el login
   normal por Firebase Auth. La contraseña nunca sale de este
   dispositivo ni se guarda en ningún servidor.
   ─────────────────────────────────────────────────────────── */

function bioSoportado(){
  return !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.create && navigator.credentials.get);
}

function bioEnrolado(){
  return !!localStorage.getItem("da_bio_cred");
}

function bioB64(s){ return btoa(unescape(encodeURIComponent(s))); }
function bioUnB64(s){ return decodeURIComponent(escape(atob(s))); }

async function srBioRegistrar(email, pass){
  if(!bioSoportado()){ toast("Este dispositivo no soporta huella / Face ID", false); return; }
  try{
    var challenge = crypto.getRandomValues(new Uint8Array(32));
    var userId = crypto.getRandomValues(new Uint8Array(16));
    var cred = await navigator.credentials.create({ publicKey:{
      challenge: challenge,
      rp: { name: "Emma Admin" },
      user: { id: userId, name: email, displayName: email },
      pubKeyCredParams: [ { type:"public-key", alg:-7 }, { type:"public-key", alg:-257 } ],
      authenticatorSelection: { authenticatorAttachment:"platform", userVerification:"required" },
      timeout: 60000
    }});
    if(!cred){ toast("No se pudo registrar la huella", false); return; }
    var credId = btoa(String.fromCharCode.apply(null, new Uint8Array(cred.rawId)));
    localStorage.setItem("da_bio_cred", credId);
    localStorage.setItem("da_bio_data", bioB64(JSON.stringify({ e: email, p: pass })));
    localStorage.removeItem("da_bio_no");
    toast("Huella activada — la próxima vez podés ingresar con huella");
  }catch(e){
    toast("No se pudo activar la huella: " + (e.message || ""), false);
  }
}

async function srBioVerificar(){
  if(!bioEnrolado()){ toast("No hay huella guardada en este dispositivo", false); return; }
  try{
    var challenge = crypto.getRandomValues(new Uint8Array(32));
    var credId = localStorage.getItem("da_bio_cred");
    var rawId = Uint8Array.from(atob(credId), function(c){ return c.charCodeAt(0); });
    var assertion = await navigator.credentials.get({ publicKey:{
      challenge: challenge,
      allowCredentials: [ { id: rawId, type:"public-key" } ],
      userVerification: "required",
      timeout: 60000
    }});
    if(!assertion){ toast("Verificación de huella fallida", false); return; }
    var raw = localStorage.getItem("da_bio_data");
    if(!raw){ toast("No hay datos guardados — ingresá con email y contraseña", false); return; }
    var data = JSON.parse(bioUnB64(raw));
    hacerLogin(data.e, data.p);
  }catch(e){
    toast("No se pudo verificar la huella: " + (e.message || ""), false);
  }
}

function srBioOlvidar(){
  localStorage.removeItem("da_bio_cred");
  localStorage.removeItem("da_bio_data");
  localStorage.setItem("da_bio_no", "1");
  toast("Huella olvidada en este dispositivo");
  renderLogin("");
}
