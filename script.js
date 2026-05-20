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

const statusText =
document.getElementById("status");

const button =
document.getElementById("checkinBtn");

const canvas =
document.getElementById("canvas");

let cameraPronta = false;

async function iniciarCamera(){

  try{

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

    cameraPronta = true;

    statusText.innerHTML =
    "✅ Câmera pronta";

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

button.addEventListener(
  "click",
  async()=>{

    if(!cameraPronta){

      alert(
        "Câmera não iniciada"
      );

      return;
    }

    try{

      button.disabled = true;

      button.innerHTML =
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

      statusText.innerHTML =
      "📍 Obtendo localização...";

      const posicao =
      await new Promise(
        (resolve,reject)=>{

          navigator.geolocation
          .getCurrentPosition(
            resolve,
            reject
          );

        }
      );

      const latitude =
      posicao.coords.latitude;

      const longitude =
      posicao.coords.longitude;

      statusText.innerHTML =
      "🌐 Obtendo IP...";

      const ipReq =
      await fetch(
        "https://api.ipify.org?format=json"
      );

      const ipData =
      await ipReq.json();

      const ip =
      ipData.ip;

      statusText.innerHTML =
      "💾 Salvando check-in...";

      const dados = {

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

        larguraTela:
        window.innerWidth,

        alturaTela:
        window.innerHeight,

        data:
        serverTimestamp()

      };

      await addDoc(
        collection(
          db,
          "checkins"
        ),
        dados
      );

      statusText.innerHTML =
      "✅ CHECK-IN REALIZADO";

      button.innerHTML =
      "CHECK-IN CONCLUÍDO";

    }

    catch(err){

      console.log(err);

      statusText.innerHTML =
      "❌ Erro no check-in";

      button.disabled = false;

      button.innerHTML =
      "REALIZAR CHECK-IN";

    }

  }
);
