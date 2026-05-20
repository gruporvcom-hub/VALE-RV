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

let cameraOk = false;

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

    cameraOk = true;

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

btn.addEventListener(
  "click",
  async()=>{

    if(!cameraOk){

      alert(
        "A câmera ainda não carregou"
      );

      return;
    }

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

      statusText.innerHTML =
      "📍 Obtendo localização...";

      const localizacao =
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
      localizacao.coords.latitude;

      const longitude =
      localizacao.coords.longitude;

      statusText.innerHTML =
      "🌐 Obtendo IP...";

      const ipReq =
      await fetch(
        "https://api.ipify.org?format=json"
      );

      const ipJson =
      await ipReq.json();

      await addDoc(
        collection(
          db,
          "checkins"
        ),
        {

          selfie:selfie,

          latitude:latitude,

          longitude:longitude,

          ip:ipJson.ip,

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

      btn.innerHTML =
      "CONCLUÍDO";

    }

    catch(err){

      console.log(err);

      statusText.innerHTML =
      "❌ Erro no check-in";

      btn.disabled = false;

      btn.innerHTML =
      "REALIZAR CHECK-IN";

    }

  }
);
