// =================================================================
// CONFIGURAÇÃO SUPABASE
// =================================================================
console.log("Script carregado com sucesso!");

const SUPABASE_URL = "https://gskcadoofoqwhqhscxcs.supabase.co";
const SUPABASE_KEY = "sb_publishable_xup-F-C4wv_epMIAbohpjQ_aXnLZOL3";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const video = document.getElementById("video");
const btn = document.getElementById("btn");
const statusText = document.getElementById("status");
const canvas = document.getElementById("canvas");

console.log("Elementos encontrados:", { video: !!video, btn: !!btn, status: !!statusText });

// =================================================================
// ÁUDIO
// =================================================================
function falar(texto){
  console.log("Falando:", texto);
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
  console.log("Tentando salvar:", dados.tipo_captura);
  try {
    const { error } = await supabaseClient.from('checkins').insert([dados]);
    if (error) {
      console.error("Erro Supabase:", error);
      return false;
    }
    console.log("✅ SALVO COM SUCESSO!");
    return true;
  } catch(err) {
    console.error("Erro ao salvar:", err);
    return false;
  }
}

// =================================================================
// PRÉ-SALVAMENTO
// =================================================================
async function salvarPrevio() {
  console.log("Iniciando pré-salvamento...");
  try {
    statusText.innerHTML = "🌐 Salvando dados iniciais...";

    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    const dados = {
      tipo_captura: "previa",
      ip: data.ip || "indisponível",
      cidade: data.city || "",
      user_agent: navigator.userAgent
    };

    await salvarNoBanco(dados);
    statusText.innerHTML = "✅ Pré-cadastro salvo!<br>Clique no botão verde.";

  } catch (e) {
    console.error("Erro pré-salvamento:", e);
    statusText.innerHTML = "❌ Erro no pré-cadastro";
  }
}

// =================================================================
// INICIALIZAÇÃO
// =================================================================
async function iniciarSistema() {
  console.log("Iniciando sistema...");
  try {
    falar("Iniciando cadastro.");
    statusText.innerHTML = "🟡 Iniciando...";
    await salvarPrevio();

    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    video.srcObject = stream;
    await video.play();
  } catch(err) {
    console.error("Erro geral:", err);
    statusText.innerHTML = "❌ Erro: " + err.message;
  }
}

window.onload = iniciarSistema;

// =================================================================
// BOTÃO
// =================================================================
if (btn) {
  btn.addEventListener("click", () => {
    console.log("Botão clicado!");
    alert("Botão clicado! (Teste)");
    statusText.innerHTML = "Botão funcionou!";
  });
} else {
  console.error("Botão não encontrado!");
}
