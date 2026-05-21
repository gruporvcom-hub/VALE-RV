# 🏗️ VALE + GRUPO RV

Sistema simples de captação de candidatos para vagas da parceria Vale + Grupo RV.

## ✨ O que faz

- 📸 Tira foto do candidato (selfie)
- 📍 Captura localização GPS + IP
- 📱 Identifica modelo do celular, sistema, navegador
- 🔢 Gera código único (RV-0001, RV-0002...)
- 💬 Direciona pro WhatsApp do recrutador
- 🛡️ Detecta cadastros duplicados

## 🚀 Como usar

1. Abra o arquivo `index.html` no navegador (ou hospede no Firebase Hosting)
2. Edite o arquivo `script.js` e troque:
   - `firebaseConfig` → credenciais do seu projeto Firebase
   - `WHATSAPP_RECRUTADOR` → número do WhatsApp do recrutador

## 📁 Arquivos

- `index.html` — Estrutura da página
- `style.css` — Estilo (dark mode com identidade Vale)
- `script.js` — Lógica completa (Firebase + câmera + GPS)

## 🔧 Tecnologias

- HTML5 + CSS3 + JavaScript (vanilla)
- Firebase Firestore (banco)
- Firebase Storage (fotos)
- API ipapi.co (localização IP)
