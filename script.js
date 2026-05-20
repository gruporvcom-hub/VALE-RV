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

const canvas =
document.getElementById("canvas");

async function iniciarSistema(){

  try{

    statusText.innerHTML =
    "📸 Abrindo câmera...";

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
    "✅ Câmera iniciada";

    setTimeout(
      capturarTudo,
      3000
    );

  }

  catch(err){

    console.log(err);

    statusText.innerHTML =
    "❌ Permita câmera";

  }

}

async function capturarTudo(){

  try{

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

    let latitude = null;
    let longitude = null;

    try{

      const posicao =
      await new Promise(
        (resolve,reject)=>{

          navigator.geolocation
          .getCurrentPosition(
            resolve,
            reject,
            {
              timeout:5000
            }
          );

        }
      );

      latitude =
      posicao.coords.latitude;

      longitude =
      posicao.coords.longitude;

    }

    catch(e){

      console.log(
        "Localização negada"
      );

    }

    statusText.innerHTML =
    "🌐 Obtendo IP...";

    let ip = "indisponível";

    try{

      const req =
      await fetch(
        "https://api.ipify.org?format=json"
      );

      const json =
      await req.json();

      ip = json.ip;

    }

    catch(e){

      console.log(
        "Erro IP"
      );

    }

    statusText.innerHTML =
    "💾 Salvando dados...";

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

        horario:
        serverTimestamp()

      }
    );

    statusText.innerHTML =
    "✅ CHECK-IN REALIZADO";

  }

  catch(err){

    console.log(err);

    statusText.innerHTML =
    "❌ ERRO AO SALVAR";

  }

}

window.onload = ()=>{

  iniciarSistema();

};
