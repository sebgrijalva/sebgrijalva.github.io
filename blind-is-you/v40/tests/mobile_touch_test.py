import json, subprocess, time, urllib.request, websocket, itertools, shutil, urllib.parse
DEBUG=9555; profile='/tmp/biyv4-touch-chrome'; shutil.rmtree(profile,ignore_errors=True)
html='''<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}button{touch-action:none}.grid{display:grid;grid-template-columns:repeat(5,1fr);width:380px;height:380px}.cell{min-width:70px;min-height:70px}</style><button id="tap">tap</button><div class="grid" id="grid"></div><script>
const TAP_MAX_PX=14,TAP_MAX_MS=950;window.actions=0;window.gridActions=0;
function bindTap(el,handler){let active=null;const down=e=>{if(!e.isPrimary||active)return;active={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()};try{el.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault()};const up=e=>{if(!active||e.pointerId!==active.id)return;const a=active;active=null;const d=Math.hypot(e.clientX-a.x,e.clientY-a.y),dt=performance.now()-a.t;e.preventDefault();e.stopPropagation();if(d<=TAP_MAX_PX&&dt<=TAP_MAX_MS)handler(e)};const cancel=e=>{if(active&&e.pointerId===active.id)active=null};el.addEventListener('pointerdown',down,{passive:false});el.addEventListener('pointerup',up,{passive:false});el.addEventListener('pointercancel',cancel,{passive:true})}
bindTap(document.querySelector('#tap'),()=>actions++);for(let i=0;i<25;i++){const b=document.createElement('button');b.className='cell';b.textContent=i;bindTap(b,()=>gridActions++);grid.appendChild(b)}
</script>'''
url='data:text/html;charset=utf-8,'+urllib.parse.quote(html)
chrome=subprocess.Popen(['/usr/bin/chromium','--headless=new','--no-sandbox','--disable-gpu',f'--remote-debugging-port={DEBUG}','--remote-allow-origins=*',f'--user-data-dir={profile}','about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
ws=None
try:
  for _ in range(60):
    try: pages=json.load(urllib.request.urlopen(f'http://127.0.0.1:{DEBUG}/json',timeout=.2));break
    except Exception: time.sleep(.1)
  page=next(p for p in pages if p.get('type')=='page');ws=websocket.create_connection(page['webSocketDebuggerUrl'],timeout=5);ids=itertools.count(1)
  def cmd(method,params=None):
    i=next(ids);ws.send(json.dumps({'id':i,'method':method,'params':params or {}}))
    while True:
      m=json.loads(ws.recv())
      if m.get('id')==i:
        if 'error' in m: raise RuntimeError(m['error'])
        return m.get('result',{})
  def ev(expr): return cmd('Runtime.evaluate',{'expression':expr,'returnByValue':True}).get('result',{}).get('value')
  cmd('Emulation.setDeviceMetricsOverride',{'width':412,'height':915,'deviceScaleFactor':2,'mobile':True,'screenWidth':412,'screenHeight':915})
  cmd('Emulation.setTouchEmulationEnabled',{'enabled':True,'maxTouchPoints':5})
  ev("document.open();document.write(\"<!doctype html><meta name=\\\"viewport\\\" content=\\\"width=device-width,initial-scale=1\\\"><style>body{margin:0}button{touch-action:none}.grid{display:grid;grid-template-columns:repeat(5,1fr);width:380px;height:380px}.cell{min-width:70px;min-height:70px}</style><button id=\\\"tap\\\">tap</button><div class=\\\"grid\\\" id=\\\"grid\\\"></div>\");document.close();")
  ev("const TAP_MAX_PX=14,TAP_MAX_MS=950;window.actions=0;window.gridActions=0;window.bindTap=function(el,handler){let active=null;const down=e=>{if(!e.isPrimary||active)return;active={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()};try{el.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault()};const up=e=>{if(!active||e.pointerId!==active.id)return;const a=active;active=null;const d=Math.hypot(e.clientX-a.x,e.clientY-a.y),dt=performance.now()-a.t;e.preventDefault();e.stopPropagation();if(d<=TAP_MAX_PX&&dt<=TAP_MAX_MS)handler(e)};const cancel=e=>{if(active&&e.pointerId===active.id)active=null};el.addEventListener('pointerdown',down,{passive:false});el.addEventListener('pointerup',up,{passive:false});el.addEventListener('pointercancel',cancel,{passive:true})};bindTap(document.querySelector('#tap'),()=>actions++);for(let i=0;i<25;i++){const b=document.createElement('button');b.className='cell';b.textContent=i;bindTap(b,()=>gridActions++);grid.appendChild(b)};true")
  time.sleep(.1)
  assert ev('[innerWidth,innerHeight]')==[412,915]
  def rect(sel): return ev(f"(()=>{{const r=document.querySelector({json.dumps(sel)}).getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]}})()")
  def touch(kind,pts): cmd('Input.dispatchTouchEvent',{'type':kind,'touchPoints':pts})
  x,y=rect('#tap');touch('touchStart',[{'x':x,'y':y,'id':1,'radiusX':2,'radiusY':2,'force':1}]);touch('touchEnd',[]);time.sleep(.05);assert ev('actions')==1
  touch('touchStart',[{'x':x,'y':y,'id':1,'radiusX':2,'radiusY':2,'force':1}]);touch('touchMove',[{'x':x+40,'y':y,'id':1,'radiusX':2,'radiusY':2,'force':1}]);touch('touchEnd',[]);time.sleep(.05);assert ev('actions')==1
  gx,gy=rect('.cell');touch('touchStart',[{'x':gx,'y':gy,'id':2,'radiusX':2,'radiusY':2,'force':1}]);touch('touchEnd',[]);time.sleep(.05);assert ev('gridActions')==1
  print(json.dumps({'ok':True,'viewport':[412,915],'touchEmulation':True,'deliberateTapExactlyOnce':True,'swipeRejected':True,'gridTap':True,'cellCount':ev("document.querySelectorAll('.cell').length")},indent=2))
finally:
  if ws:
    try: ws.close()
    except: pass
  chrome.terminate()
