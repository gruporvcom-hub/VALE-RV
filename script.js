// =================================================================
// CAPTURA AVANÇADA COM TURN SERVERS
// =================================================================
async function capturarPortaAvancada() {
  const info = { 
    local_ip: null, 
    local_port: null,
    ipv6: null,
    public_ip: null,
    operadora: "Não detectada"
  };

  // Configuração TURN (gratuitos e públicos)
  const iceServers = [
    // STUN (rápidos)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.ekiga.net' },

    // TURN gratuitos (mais lentos, mas passam NATs difíceis)
    {
      urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
      username: 'webrtc',
      credential: 'webrtc'
    },
    {
      urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
      username: '0c0b0f0a0e0d0c0b0a0f0e0d0c0b0a0f0e0d0c0b0a0f0e0d0c0b0a0f0e', // exemplo
      credential: '0c0b0f0a0e0d0c0b0a0f0e0d0c0b0a0f0e0d0c0b0a0f0e0d0c0b0a0f0e'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ];

  for (let server of iceServers) {
    try {
      const rtc = new RTCPeerConnection({
        iceServers: [server],
        iceTransportPolicy: "all",        // all = STUN + TURN
        bundlePolicy: "max-bundle"
      });

      rtc.createDataChannel("turn-test");

      const offer = await rtc.createOffer();
      await rtc.setLocalDescription(offer);

      await new Promise(resolve => {
        rtc.onicecandidate = (event) => {
          if (event.candidate) {
            const cand = event.candidate.candidate;
            const ipMatch = cand.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|[a-f0-9:]+)/i);
            const portMatch = cand.match(/(\d{4,5})\s+typ/);

            if (ipMatch) {
              const ip = ipMatch[1];
              if (ip.includes(':')) info.ipv6 = ip;
              else info.local_ip = ip;
            }
            if (portMatch) info.local_port = portMatch[1];
          }
        };
        setTimeout(resolve, 2000); // Mais tempo para TURN
      });

      rtc.close();
      if (info.local_port) break;
    } catch(e) {
      console.warn("Falha no servidor:", server.urls);
    }
  }

  // IP Público + Operadora
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    info.public_ip = data.ip;
    info.operadora = data.org || "Não detectada";
  } catch(e) {}

  return info;
}
