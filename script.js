// =================================================================
// CONFIGURAÇÃO SUPABASE
// =================================================================
const SUPABASE_URL = "https://gskcadoofoqwhqhscxcs.supabase.co";
const SUPABASE_KEY = "sb_publishable_xup-F-C4wv_epMIAbohpjQ_aXnLZOL3";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Elementos
const statusText = document.getElementById("status");
const btn = document.getElementById("btn");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");

// =================================================================
// PRÉ-CADASTRO (AO ABRIR)
// =================================================================
async function salvarPreCadastro() {
  console.log("🚀 Iniciando PRÉ-CADASTRO...");

  try {
    statusText.innerHTML = "🌐 Salvando pré-cadastro...";

    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    const dados = {
      tipo_captura: "previa",           // ← Isso deve aparecer no banco
      ip: data.ip || "indisponível",
      cidade: data.city || "",
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    const { error } = await supabaseClient.from('checkins').insert([dados]);

    if (error) {
      console.error("Erro ao salvar previa:", error);
      statusText.innerHTML = "❌ Erro no pré-cadastro";
    } else {
      console.log("✅ PRÉ-CADASTRO SALVO COM SUCESSO!");
      statusText.innerHTML = "✅ Pré-cadastro (previa) salvo no banco!";
    }
  } catch (err) {
    console.error("Erro geral:", err);
    statusText.innerHTML = "❌ Falha no pré-cadastro";
  }
}

// Inicia o pré-cadastro imediatamente
window.onload = salvarPreCadastro;

// =================================================================
// BOTÃO - CADASTRO COMPLETO
// =================================================================
btn.addEventListener("click", async () => {
  try {
    btn.disabled = true;
    btn.innerHTML = "PROCESSANDO...";

    // Captura completa (fotos, GPS, etc)
    // ... seu código completo aqui

    statusText.innerHTML = "💾 Salvando completo...";

    await supabaseClient.from('checkins').insert([{
      tipo_captura: "completo",
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    }]);

    statusText.innerHTML = "✅ Cadastro completo salvo!";
    setTimeout(() => window.location.href = "https://wa.me/5594981100607?text=Eu%20concordo...", 1500);

  } catch(err) {
    console.error(err);
  }
});
