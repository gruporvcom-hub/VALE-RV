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

    video.onloadedmetadata = async()=>{

      await video.play();

      cameraPronta = true;

      statusText.innerHTML =
      "✅ Câmera frontal ativa";

    };

  }

  catch(err){

    console.log(err);

    statusText.innerHTML =
    "❌ Permita câmera";

    alert(
      "Permita acesso à câmera"
    );

  }

}

window.onload = ()=>{

  iniciarCamera();

};

window.capturar =
async function(){

  if(!cameraPronta){

    alert(
      "A câmera ainda não iniciou"
    );

    return;
  }

  const nome =
  document.getElementById("nome")
  .value;

  if(!nome){

    alert(
      "Digite seu nome"
    );

    return;
  }

  const canvas =
  document.getElementById("canvas");

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

  const imagem =
  canvas.toDataURL(
    "image/jpeg",
    0.7
  );

  try{

    await addDoc(
      collection(db,"checkins"),
      {

        nome:nome,

        foto:imagem,

        data:serverTimestamp()

      }
    );

    statusText.innerHTML =
    "✅ Check-in realizado";

  }

  catch(err){

    console.log(err);

    statusText.innerHTML =
    "❌ Erro ao salvar";

  }

}
