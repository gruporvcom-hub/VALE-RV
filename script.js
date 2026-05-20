// ============================================
// VAGAS - VALE + GRUPO RV
// Sistema de captação de candidatos
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  increment,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// ============================================
// ⚠️ CONFIGURAÇÕES — TROQUE PELOS SEUS DADOS!
// ============================================

// 1️⃣ Cole aqui as credenciais do SEU projeto Firebase
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.firebasestorage.app",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

// 2️⃣ Número do WhatsApp do recrutador (com DDI 55 + DDD + número)
const WHATSAPP_RECRUTADOR = "5594999999999";

// 3️⃣ Nome da empresa (aparece na mensagem do WhatsApp)
const NOME_EMPRESA = "Vale + Grupo RV";

// ============================================
// INICIALIZAÇÃO DO FIREBASE
// ============================================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// ============================================
// ELEMENTOS DA TELA
// ============================================
const telas = {
  inicio: document.getElementById("tela-inicio"),
  camera: document.getElementById("tela-camera"),
  processando: document.getElementById("tela-processando"),
  sucesso: document.getElementById("tela-sucesso"),
  erro: document.getElementById("tela-erro")
};

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");

let streamCamera = null;

// ============================================
// FUNÇÃO: TROCAR DE TELA
// ============================================
function mostrarTela(nome) {
  Object.values(telas).forEach(t => t.classList.remove("ativa"));
  telas[nome].classList.add("ativa");
}

// ============================================
// BOTÃO OUVIR INSTRUÇÕES (LGPD pra analfabetos)
// ============================================
document.getElementById("btn-ouvir").addEventListener("click", () => {
  if (!("speechSynthesis" in window)) {
    alert("Seu navegador não suporta áudio automático");
    return;
  }
  
  const texto = "Olá! Para se candidatar à vaga da Vale e Grupo RV, " +
                "toque no botão verde escrito ME CADASTRAR. " +
                "Vamos tirar uma foto sua, ver onde você está, " +
                "e depois você vai conversar com o recrutador pelo WhatsApp.";
  
  const fala = new SpeechSynthesisUtterance(texto);
  fala.lang = "pt-BR";
  fala.rate = 0.9;
  speechSynthesis.cancel();
  speechSynthesis.speak(fala);
});

// ============================================
// BOTÃO INICIAR (abre câmera)
// ============================================
document.getElementById("btn-iniciar").addEventListener("click", async () => {
  mostrarTela("camera");
  try {
    streamCamera = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: 1280, height: 720 },
      audio: false
    });
    video.srcObject = streamCamera;
    await video.play();
  } catch (err) {
    console.error("Erro câmera:", err);
    mostrarErro("Não conseguimos acessar sua câmera. Permita o acesso e tente novamente.");
  }
});

// ============================================
// BOTÃO CAPTURAR (tira foto e salva tudo)
// ============================================
document.getElementById("btn-capturar").addEventListener("click", async () => {
  try {
    // 1. Tira a foto
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const fotoBase64 = canvas.toDataURL("image/jpeg", 0.7);
    
    // 2. Para a câmera
    if (streamCamera) {
      streamCamera.getTracks().forEach(t => t.stop());
    }
    
    // 3. Mostra processando
    mostrarTela("processando");
    
    // 4. Coleta TODOS os dados
    atualizarProcessando("Coletando informações do dispositivo...");
    const dispositivo = coletarDispositivo();
    
    atualizarProcessando("Pegando sua localização...");
    const gps = await pegarGPS();
    const ipInfo = await pegarIP();
    
    // 5. Verifica duplicado
    atualizarProcessando("Verificando cadastro...");
    const fingerprint = await gerarFingerprint();
    const duplicado = await verificarDuplicado(fingerprint);
    
    // 6. Gera código único
    const codigo = await gerarCodigo();
    
    // 7. Sobe a foto
    atualizarProcessando("Enviando sua foto...");
    const fotoUrl = await uploadFoto(fotoBase64, codigo);
    
    // 8. Salva no banco
    atualizarProcessando("Finalizando cadastro...");
    await addDoc(collection(db, "candidatos"), {
      codigo_publico: codigo,
      foto_url: fotoUrl,
      localizacao: {
        gps: gps,
        ip: ipInfo?.ip || null,
        cidade: ipInfo?.cidade || null,
        estado: ipInfo?.estado || null,
        pais: ipInfo?.pais || null,
        operadora: ipInfo?.operadora || null
      },
      dispositivo: {
        fingerprint: fingerprint,
        so: dispositivo.so,
        modelo: dispositivo.modelo,
        navegador: dispositivo.navegador,
        user_agent: dispositivo.userAgent,
        tela: dispositivo.tela,
        ram_gb: dispositivo.ram,
        cpu_cores: dispositivo.cpu,
        conexao: dispositivo.conexao,
        idioma: dispositivo.idioma,
        fuso_horario: dispositivo.fuso
      },
      metadados: {
        data_cadastro: serverTimestamp(),
        consentimento_lgpd: true,
        duplicado: duplicado,
        status: "novo"
      }
    });
    
    // 9. Sucesso!
    mostrarSucesso(codigo);
    
  } catch (err) {
    console.error("Erro:", err);
    mostrarErro("Não conseguimos completar seu cadastro. Verifique sua internet.");
  }
});

// ============================================
// COLETAR DADOS DO DISPOSITIVO
// ============================================
function coletarDispositivo() {
  const ua = navigator.userAgent;
  
  // Detecta SO
  let so = "Desconhecido";
  if (/Android\s([0-9.]+)/.test(ua)) {
    so = "Android " + ua.match(/Android\s([0-9.]+)/)[1];
  } else if (/iPhone|iPad/.test(ua)) {
    const m = ua.match(/OS\s([0-9_]+)/);
    so = "iOS " + (m ? m[1].replace(/_/g, ".") : "?");
  } else if (/Windows/.test(ua)) {
    so = "Windows";
  } else if (/Mac/.test(ua)) {
    so = "macOS";
  } else if (/Linux/.test(ua)) {
    so = "Linux";
  }
  
  // Detecta navegador
  let navegador = "Desconhecido";
  if (ua.includes("Edg/")) navegador = "Edge " + (ua.match(/Edg\/([0-9.]+)/) || [, "?"])[1];
  else if (ua.includes("Chrome/")) navegador = "Chrome " + (ua.match(/Chrome\/([0-9.]+)/) || [, "?"])[1];
  else if (ua.includes("Firefox/")) navegador = "Firefox " + (ua.match(/Firefox\/([0-9.]+)/) || [, "?"])[1];
  else if (ua.includes("Safari/")) navegador = "Safari";
  
  // Modelo (Android)
  let modelo = "Desconhecido";
  const m1 = ua.match(/;\s([^;)]+)\sBuild\//);
  const m2 = ua.match(/Android[^;]*;\s([^;)]+)\)/);
  if (m1) modelo = m1[1].trim();
  else if (m2) modelo = m2[1].trim();
  
  return {
    so: so,
    modelo: modelo,
    navegador: navegador,
    userAgent: ua,
    tela: `${screen.width}x${screen.height}`,
    ram: navigator.deviceMemory || null,
    cpu: navigator.hardwareConcurrency || null,
    conexao: navigator.connection?.effectiveType || null,
    idioma: navigator.language,
    fuso: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}

// ============================================
// PEGAR GPS PRECISO
// ============================================
function pegarGPS() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        precisao_metros: pos.coords.accuracy
      }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// ============================================
// PEGAR DADOS DE IP (API gratuita)
// ============================================
async function pegarIP() {
  try {
    const r = await fetch("https://ipapi.co/json/");
    if (!r.ok) return null;
    const d = await r.json();
    return {
      ip: d.ip,
      cidade: d.city,
      estado: d.region,
      pais: d.country_name,
      operadora: d.org
    };
  } catch {
    return null;
  }
}

// ============================================
// GERAR FINGERPRINT (hash único do dispositivo)
// ============================================
async function gerarFingerprint() {
  const dados = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    navigator.hardwareConcurrency || "",
    navigator.deviceMemory || "",
    Intl.DateTimeFormat().resolvedOptions().timeZone
  ].join("|");
  
  const buffer = new TextEncoder().encode(dados);
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ============================================
// VERIFICAR SE DISPOSITIVO JÁ CADASTROU
// ============================================
async function verificarDuplicado(fingerprint) {
  try {
    const q = query(
      collection(db, "candidatos"),
      where("dispositivo.fingerprint", "==", fingerprint)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  } catch {
    return false;
  }
}

// ============================================
// GERAR CÓDIGO ÚNICO (RV-0001, RV-0002...)
// ============================================
async function gerarCodigo() {
  try {
    const ref = doc(db, "estatisticas", "contadores");
    const snap = await getDoc(ref);
    let num;
    if (snap.exists()) {
      num = (snap.data().total || 0) + 1;
      await setDoc(ref, { total: increment(1) }, { merge: true });
    } else {
      num = 1;
      await setDoc(ref, { total: 1 });
    }
    return `RV-${String(num).padStart(4, "0")}`;
  } catch {
    return `RV-${Math.floor(1000 + Math.random() * 9000)}`;
  }
}

// ============================================
// UPLOAD DA FOTO PRO STORAGE
// ============================================
async function uploadFoto(base64, codigo) {
  const fotoRef = ref(storage, `candidatos/${codigo}-${Date.now()}.jpg`);
  await uploadString(fotoRef, base64, "data_url");
  return await getDownloadURL(fotoRef);
}

// ============================================
// FUNÇÕES DE UI
// ============================================
function atualizarProcessando(msg) {
  document.getElementById("processando-detalhe").textContent = msg;
}

function mostrarSucesso(codigo) {
  document.getElementById("codigo").textContent = codigo;
  const msg = encodeURIComponent(
    `Olá! Sou o candidato *${codigo}* e tenho interesse na vaga da ${NOME_EMPRESA}.`
  );
  document.getElementById("btn-whatsapp").href = 
    `https://wa.me/${WHATSAPP_RECRUTADOR}?text=${msg}`;
  mostrarTela("sucesso");
}

function mostrarErro(msg) {
  document.getElementById("erro-msg").textContent = msg;
  mostrarTela("erro");
  if (streamCamera) streamCamera.getTracks().forEach(t => t.stop());
}

// ============================================
// LIMPA CÂMERA AO SAIR
// ============================================
window.addEventListener("beforeunload", () => {
  if (streamCamera) streamCamera.getTracks().forEach(t => t.stop());
});
