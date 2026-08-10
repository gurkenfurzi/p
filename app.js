
(() => {
'use strict';
const W=1280,H=720,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const uid=p=>`${p}_${Math.random().toString(36).slice(2,9)}_${Date.now().toString(36).slice(-5)}`;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),deep=o=>JSON.parse(JSON.stringify(o));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const elmap={title:'Titel',text:'Text',rect:'Rechteck',circle:'Kreis',triangle:'Dreieck',star:'Stern',line:'Linie',arrow:'Pfeil',badge:'Badge',image:'Bild',svg:'SVG',video:'Video/GIF',audio:'Audio',chart:'Diagramm',table:'Tabelle',icon:'Icon',drawing:'Zeichnung',group:'Gruppe'};

const UI={
 stage:$('#stage'),shell:$('#stageShell'),viewport:$('#stageViewport'),list:$('#slideList'),
 inspector:$('#inspector'),empty:$('#inspectorEmpty'),content:$('#inspectorContent'),
 notes:$('#speakerNotes'),toast:$('#toast'),selectionBox:$('#selectionBox'),guideV:$('#guideV'),guideH:$('#guideH'),
 presentation:$('#presentation'),pstage:$('#presentationStage'),timeline:$('#timelinePanel')
};

let mediaStore=[];
let project=loadProject()||createDemo(),scale=.85,zoomMode='fit',selectedIds=new Set(),history=[],future=[],isRestoring=false;
let snap=true,showGrid=false,showGuides=true,drawMode=false,panMode=false,spacePan=false,clipboard=[],presentIndex=0,isPresenting=false;
let timerStart=null,timerHandle=null,laserMode=false,timelineScale=90,playheadTime=0;

project.activeSlideId ||= project.slides[0]?.id;
function defaultSlide(){return{id:uid('slide'),name:'Neue Folie',background:'#fffdf8',transition:'fade',transitionDuration:.7,notes:'',hidden:false,comments:[],elements:[]}}
function defaultProject(){return{name:'Meine Präsentation',theme:{ink:'#3c312d',accent:'#ef9e9c',bg:'#fffdf8'},activeSlideId:null,slides:[]}}
function textEl(type,id,x,y,w,h,content,size,color,bold=false,align='left'){return{id:id||uid('morph'),type,x,y,w,h,rotation:0,opacity:1,z:1,locked:false,hidden:false,content,fill:'transparent',color,borderRadius:0,shadow:0,borderWidth:0,borderColor:'#000000',fontFamily:'Inter',fontSize:size,fontWeight:bold?700:400,fontStyle:'normal',textDecoration:'none',textAlign:align,lineHeight:1.12,letterSpacing:0,gradient:{type:'none',c1:'#ffffff',c2:'#ef9e9c'},animation:{in:'fade',out:'none',duration:.6,delay:0,trigger:'auto'}}}
function shapeEl(type,id,x,y,w,h,fill,radius=18){return{id:id||uid('morph'),type,x,y,w,h,rotation:0,opacity:1,z:1,locked:false,hidden:false,content:'',fill,color:'#3c312d',borderRadius:radius,shadow:0,borderWidth:0,borderColor:'#000000',gradient:{type:'none',c1:fill||'#ffffff',c2:'#ef9e9c'},fontFamily:'Inter',fontSize:28,fontWeight:600,fontStyle:'normal',textDecoration:'none',textAlign:'center',lineHeight:1.12,letterSpacing:0,animation:{in:'pop',out:'none',duration:.5,delay:0,trigger:'auto'}}}
function createDemo(){
 const p=defaultProject(),s1=defaultSlide();s1.name='Titel';s1.transition='morph';
 const title=uid('morph'),sub=uid('morph'),card=uid('morph'),orb=uid('morph');
 s1.elements=[
  textEl('title',title,90,105,760,155,'Präsentationen,\ndie sich bewegen.',72,'#473a34',true),
  textEl('text',sub,98,295,620,90,'Canva-Look + PowerPoint-Freiheit + Simpleclub-artige Animationen.',26,'#7e6b63'),
  {...shapeEl('rect',card,90,448,430,150,'#ffe8df',30),shadow:10},
  textEl('text',uid('morph'),125,478,360,90,'Dupliziere die Folie, verschiebe Elemente und nutze ✨ Morph.',22,'#714f47',true),
  shapeEl('circle',orb,870,120,260,260,'#f5b6ad',140),
  textEl('text',uid('morph'),905,205,190,90,'MORPH',38,'#fff',true,'center')
 ];
 const s2=deep(s1);s2.id=uid('slide');s2.name='Morph Demo';s2.background='#f7f8ec';s2.transition='morph';
 const m=id=>s2.elements.find(e=>e.id===id);
 Object.assign(m(title),{x:530,y:90,w:650,h:140});Object.assign(m(sub),{x:535,y:240,w:600,h:80});
 Object.assign(m(card),{x:715,y:440,w:430,h:155,rotation:-3,fill:'#dfe8c9'});Object.assign(m(orb),{x:115,y:125,w:305,h:305,fill:'#aab98d'});
 s2.elements.push(textEl('text',uid('morph'),160,228,210,70,'FLIESSEND',28,'#fff',true,'center'));
 p.slides=[s1,s2];p.activeSlideId=s1.id;return p
}
function activeSlide(){return project.slides.find(s=>s.id===project.activeSlideId)||project.slides[0]}
function selected(){const id=[...selectedIds][0];return activeSlide()?.elements.find(e=>e.id===id)||null}
function selectedElements(){const set=selectedIds;return activeSlide()?.elements.filter(e=>set.has(e.id))||[]}
function saveProject(){try{localStorage.setItem('slidebloom_ultimate_v1',JSON.stringify(project));localStorage.setItem('slidebloom_media_v1',JSON.stringify(mediaStore));}catch{toast('Browser-Speicher voll. Große Videos/Bilder lieber kleiner verwenden.')}$('#saveStatus').textContent='Gespeichert'}
function loadProject(){try{mediaStore=JSON.parse(localStorage.getItem('slidebloom_media_v1')||'[]');return JSON.parse(localStorage.getItem('slidebloom_ultimate_v1'))}catch{return null}}
let saveTimer;function touchSave(){$('#saveStatus').textContent='Speichert …';clearTimeout(saveTimer);saveTimer=setTimeout(saveProject,220)}
function commit(){if(isRestoring)return;history.push(JSON.stringify(project));if(history.length>80)history.shift();future=[];touchSave()}
function undo(){if(history.length<2)return;future.push(history.pop());restore(history.at(-1))}
function redo(){if(!future.length)return;const s=future.pop();history.push(s);restore(s)}
function restore(s){isRestoring=true;project=JSON.parse(s);selectedIds.clear();renderAll();isRestoring=false;touchSave()}
function renderAll(){$('#projectName').value=project.name;renderSlides();renderStage();renderInspector();syncSlideControls();renderLayers();renderTimeline();syncMobileSelectionUI()}

function renderSlides(){
 UI.list.innerHTML='';
 project.slides.forEach((slide,i)=>{
  const row=document.createElement('div');row.className='slide-thumb-row';
  row.innerHTML=`<div class="slide-num">${i+1}</div><div class="slide-thumb ${slide.id===project.activeSlideId?'active':''} ${slide.hidden?'hidden-slide':''}"><div class="thumb-inner"></div></div>`;
  row.onclick=()=>{project.activeSlideId=slide.id;selectedIds.clear();closeInspectorMobile();renderAll();closeMobileSlides()};
  renderSlideTo(row.querySelector('.thumb-inner'),slide,false);
  UI.list.appendChild(row)
 })
}
function backgroundStyle(e){const g=e.gradient||{};if(g.type==='linear')return`linear-gradient(135deg,${g.c1},${g.c2})`;if(g.type==='radial')return`radial-gradient(circle,${g.c1},${g.c2})`;return e.fill||'transparent'}
function applyBox(d,e){
 Object.assign(d.style,{left:e.x+'px',top:e.y+'px',width:e.w+'px',height:e.h+'px',transform:`rotate(${e.rotation||0}deg)`,opacity:e.opacity??1,zIndex:e.z||1,background:backgroundStyle(e),borderRadius:(e.borderRadius||0)+'px',boxShadow:e.shadow?`0 ${Math.max(4,e.shadow/2)}px ${e.shadow*1.5}px rgba(60,49,45,.18)`:'none',border:(e.borderWidth||0)?`${e.borderWidth}px solid ${e.borderColor||e.color||'#333'}`:'none'})
}
function mediaFilter(e){return`brightness(${e.brightness??100}%) contrast(${e.contrast??100}%) saturate(${e.saturate??100}%) blur(${e.blur??0}px)`}
function maskStyle(e,node){const m=e.mask||'none';if(m==='circle')node.style.clipPath='circle(50% at 50% 50%)';else if(m==='rounded')node.style.clipPath='inset(0 round 14%)';else if(m==='hex')node.style.clipPath='polygon(25% 6.7%,75% 6.7%,100% 50%,75% 93.3%,25% 93.3%,0 50%)';else if(m==='blob')node.style.clipPath='polygon(50% 0%,80% 8%,100% 35%,93% 72%,67% 100%,28% 92%,4% 66%,0% 31%,21% 8%)';else node.style.clipPath='none'}
function styleText(c,e){Object.assign(c.style,{color:e.color||'#3c312d',fontFamily:e.fontFamily||'Inter',fontSize:(e.fontSize||28)+'px',fontWeight:e.fontWeight||400,fontStyle:e.fontStyle||'normal',textDecoration:e.textDecoration||'none',textAlign:e.textAlign||'left',justifyContent:e.textAlign==='center'?'center':e.textAlign==='right'?'flex-end':'flex-start',padding:e.type==='badge'?'12px 20px':'0',lineHeight:e.lineHeight||1.12,letterSpacing:(e.letterSpacing||0)+'px'})}
function renderElement(e,editable=false){
 const d=document.createElement('div');d.className='el'+(selectedIds.has(e.id)?(selectedIds.size>1?' multi-selected':' selected'):'')+(e.locked?' locked':'')+(e.hidden?' hidden-el':'');d.dataset.id=e.id;applyBox(d,e);
 let c=document.createElement('div');c.className='content';
 if(e.type==='image'||e.type==='video'){
   let media;if(e.type==='video'&&!(e.src||'').startsWith('data:image/gif')){media=document.createElement('video');media.src=e.src||'';media.muted=e.muted??true;media.autoplay=!!e.autoplay;media.loop=!!e.loop;media.playsInline=true;media.volume=(e.volume??100)/100}
   else{media=document.createElement('img');media.src=e.src||'';media.draggable=false}
   media.className='media-content';media.style.objectFit=e.objectFit||'cover';media.style.objectPosition=`${e.cropX??50}% ${e.cropY??50}%`;media.style.transform=`scale(${(e.cropZoom??100)/100})`;media.style.filter=mediaFilter(e);maskStyle(e,media);c.appendChild(media)
 } else if(e.type==='audio'){
   c.innerHTML=`<div style="width:100%;height:100%;display:grid;place-items:center;border-radius:18px;background:#fff4f2;border:1px solid #eadbd4"><div style="font-size:42px">♫</div><small>${esc(e.name||'Audio')}</small></div>`;
 } else if(e.type==='svg'){c.innerHTML=e.svg||'';c.classList.add('svg-content');const svg=c.querySelector('svg');if(svg){svg.style.width='100%';svg.style.height='100%'}}
 else if(e.type==='chart')c.innerHTML=chartSVG(e);
 else if(e.type==='table')c.innerHTML=tableHTML(e);
 else if(e.type==='drawing'){c.innerHTML=`<svg class="drawing-svg" viewBox="0 0 ${e.w} ${e.h}" preserveAspectRatio="none"><path d="${e.path||''}" fill="none" stroke="${e.color||'#333'}" stroke-width="${e.strokeWidth||5}" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
 else if(e.type==='triangle'){c.innerHTML=`<svg viewBox="0 0 100 100" width="100%" height="100%"><polygon points="50,4 96,94 4,94" fill="${e.fill}"/></svg>`;d.style.background='transparent';d.style.border='none'}
 else if(e.type==='star'){c.innerHTML=`<svg viewBox="0 0 100 100" width="100%" height="100%"><polygon points="50,3 61,36 96,36 68,57 79,92 50,71 21,92 32,57 4,36 39,36" fill="${e.fill}"/></svg>`;d.style.background='transparent';d.style.border='none'}
 else if(e.type==='line'||e.type==='arrow'){c.style.position='relative';const ln=document.createElement('div');ln.style.cssText=`position:absolute;left:0;right:${e.type==='arrow'?'16px':'0'};top:50%;border-top:${e.strokeWidth||5}px solid ${e.color};`;c.appendChild(ln);if(e.type==='arrow'){const a=document.createElement('div');a.style.cssText=`position:absolute;right:0;top:50%;width:0;height:0;transform:translateY(-50%);border-top:12px solid transparent;border-bottom:12px solid transparent;border-left:18px solid ${e.color};`;c.appendChild(a)}}
 else{c.textContent=e.content||'';styleText(c,e)}
 d.appendChild(c);
 if(editable&&!e.locked){
  d.addEventListener('pointerdown',ev=>startMove(ev,e.id));
  d.addEventListener('click',ev=>{ev.stopPropagation();selectElement(e.id,ev.shiftKey||ev.ctrlKey||ev.metaKey);});
  if(['title','text','badge','icon'].includes(e.type)){d.addEventListener('dblclick',ev=>{ev.stopPropagation();c.contentEditable='true';c.focus();selectText(c)});c.addEventListener('blur',()=>{c.contentEditable='false';e.content=c.textContent;commit();renderSlides()});c.addEventListener('keydown',ev=>ev.stopPropagation())}
  if(selectedIds.size===1&&selectedIds.has(e.id)){[['br','br'],['bl','bl'],['tr','tr'],['tl','tl']].forEach(([cls,corner])=>{const h=document.createElement('div');h.className=`handle ${cls}`;h.addEventListener('pointerdown',ev=>startResize(ev,e.id,corner));d.appendChild(h)});const r=document.createElement('div');r.className='rotate-handle';r.addEventListener('pointerdown',ev=>startRotate(ev,e.id));d.appendChild(r)}
 }
 return d
}
function renderStage(){const s=activeSlide();UI.stage.style.background=s.background;UI.stage.classList.toggle('grid',showGrid);UI.stage.innerHTML='';[...s.elements].sort((a,b)=>(a.z||0)-(b.z||0)).forEach(e=>UI.stage.appendChild(renderElement(e,true)));setScale(scale)}
function renderSlideTo(container,slide,animate=true){container.innerHTML='';Object.assign(container.style,{position:'relative',width:W+'px',height:H+'px',background:slide.background,overflow:'hidden'});[...slide.elements].sort((a,b)=>(a.z||0)-(b.z||0)).forEach(e=>{const d=renderElement(e,false);container.appendChild(d);if(animate)playEntrance(d,e.animation)})}
function chartSVG(e){
 const vals=e.values||[30,50,70],labels=e.labels||['A','B','C'],cols=['#ef9e9c','#aab98d','#e7c778','#9db9d3','#c5a9d6','#f5b6ad'],type=e.chartType||'bar';
 if(type==='pie'||type==='donut'){const total=vals.reduce((a,b)=>a+b,0)||1;let start=0;let paths=vals.map((v,i)=>{const a1=start/total*Math.PI*2-Math.PI/2;start+=v;const a2=start/total*Math.PI*2-Math.PI/2,x1=50+40*Math.cos(a1),y1=50+40*Math.sin(a1),x2=50+40*Math.cos(a2),y2=50+40*Math.sin(a2),large=(a2-a1)>Math.PI?1:0;return`<path d="M50 50 L${x1} ${y1} A40 40 0 ${large} 1 ${x2} ${y2} Z" fill="${cols[i%cols.length]}"/>`}).join('');return`<svg viewBox="0 0 100 100" class="chart-svg">${paths}${type==='donut'?'<circle cx="50" cy="50" r="22" fill="white"/>':''}</svg>`}
 if(type==='line'){const max=Math.max(...vals,1),pts=vals.map((v,i)=>`${35+i*(430/Math.max(1,vals.length-1))},${220-170*v/max}`).join(' ');return`<svg viewBox="0 0 500 260" class="chart-svg"><polyline points="${pts}" fill="none" stroke="${e.color||'#ef9e9c'}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>${vals.map((v,i)=>`<circle cx="${35+i*(430/Math.max(1,vals.length-1))}" cy="${220-170*v/max}" r="8" fill="${e.color||'#ef9e9c'}"/><text x="${35+i*(430/Math.max(1,vals.length-1))}" y="248" text-anchor="middle" font-size="15" fill="#6f615b">${labels[i]||''}</text>`).join('')}</svg>`}
 const max=Math.max(...vals,1);return`<svg viewBox="0 0 500 260" class="chart-svg">${vals.map((v,i)=>{const x=35+i*(430/vals.length),h=180*v/max,y=220-h;return`<rect x="${x}" y="${y}" width="${Math.max(24,320/vals.length)}" height="${h}" rx="10" fill="${e.color||'#ef9e9c'}"/><text x="${x+16}" y="246" text-anchor="middle" font-size="15" fill="#6f615b">${labels[i]||''}</text>`}).join('')}</svg>`
}
function tableHTML(e){let out='<table class="table-el">';for(let r=0;r<(e.rows||3);r++){out+='<tr>';for(let c=0;c<(e.cols||3);c++)out+=`<td contenteditable="false">${r===0?'Titel':r===1?'Text':'—'}</td>`;out+='</tr>'}return out+'</table>'}

function setScale(v){scale=v;UI.stage.style.transform=`scale(${scale})`;UI.shell.style.width=(W*scale)+'px';UI.shell.style.height=(H*scale)+'px';$('#zoomLabel').textContent=Math.round(scale*100)+'%';$('#zoomRange').value=Math.round(scale*100)}
function fitStage(){const r=UI.viewport.getBoundingClientRect();setScale(clamp(Math.min((r.width-48)/W,(r.height-48)/H),.22,1.6));zoomMode='fit'}
window.addEventListener('resize',()=>{if(zoomMode==='fit')fitStage();if(isPresenting)scalePresentation()});
function stagePoint(ev){const r=UI.stage.getBoundingClientRect();return{x:(ev.clientX-r.left)/scale,y:(ev.clientY-r.top)/scale}}
function selectElement(id,toggle=false){
 const e=activeSlide().elements.find(x=>x.id===id);
 if(toggle){selectedIds.has(id)?selectedIds.delete(id):selectedIds.add(id)}
 else{
   selectedIds.clear();
   if(e?.groupId) activeSlide().elements.filter(x=>x.groupId===e.groupId).forEach(x=>selectedIds.add(x.id));
   else selectedIds.add(id);
 }
 renderStage();renderInspector();renderLayers();syncMobileSelectionUI()
}
function selectText(el){const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r)}

function startMove(ev,id){
 if(ev.target.classList.contains('handle')||ev.target.classList.contains('rotate-handle')||drawMode||spacePan||panMode)return;
 const e=activeSlide().elements.find(x=>x.id===id);if(!e||e.locked)return;
 ev.preventDefault();
 if(!selectedIds.has(id)){selectedIds.clear();selectedIds.add(id)}
 const items=selectedElements().map(x=>({e:x,x:x.x,y:x.y}));const p=stagePoint(ev);
 const move=mv=>{const q=stagePoint(mv),dx=q.x-p.x,dy=q.y-p.y;items.forEach(it=>{it.e.x=clamp(it.x+dx,-it.e.w+20,W-20);it.e.y=clamp(it.y+dy,-it.e.h+20,H-20);if(snap){it.e.x=Math.round(it.e.x/10)*10;it.e.y=Math.round(it.e.y/10)*10}});if(showGuides)smartGuides(items.map(i=>i.e));renderStage()};
 const up=()=>{window.removeEventListener('pointermove',move);hideGuides();commit();renderSlides();renderInspector();renderLayers()};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true})
}
function smartGuides(moving){
 hideGuides();if(moving.length!==1)return;const e=moving[0],others=activeSlide().elements.filter(x=>x.id!==e.id&&!selectedIds.has(x.id));const xs=[0,W/2,W],ys=[0,H/2,H],ex=[e.x,e.x+e.w/2,e.x+e.w],ey=[e.y,e.y+e.h/2,e.y+e.h];others.forEach(o=>{xs.push(o.x,o.x+o.w/2,o.x+o.w);ys.push(o.y,o.y+o.h/2,o.y+o.h)});for(const a of ex)for(const b of xs)if(Math.abs(a-b)<5){UI.guideV.style.left=(b*scale)+'px';UI.guideV.classList.remove('hidden');return}for(const a of ey)for(const b of ys)if(Math.abs(a-b)<5){UI.guideH.style.top=(b*scale)+'px';UI.guideH.classList.remove('hidden');return}
}
function hideGuides(){UI.guideV.classList.add('hidden');UI.guideH.classList.add('hidden')}
function startResize(ev,id,corner){ev.preventDefault();ev.stopPropagation();const e=activeSlide().elements.find(x=>x.id===id),p=stagePoint(ev),orig={x:e.x,y:e.y,w:e.w,h:e.h};const ratio=e.w/e.h;const move=mv=>{const q=stagePoint(mv),dx=q.x-p.x,dy=q.y-p.y;let nx=orig.x,ny=orig.y,nw=orig.w,nh=orig.h;if(corner.includes('r'))nw=orig.w+dx;else{nw=orig.w-dx;nx=orig.x+dx}if(corner.includes('b'))nh=orig.h+dy;else{nh=orig.h-dy;ny=orig.y+dy}if(mv.shiftKey){if(Math.abs(dx)>Math.abs(dy))nh=nw/ratio;else nw=nh*ratio}if(nw>30&&nh>24){Object.assign(e,{x:nx,y:ny,w:nw,h:nh})}renderStage()};const up=()=>{window.removeEventListener('pointermove',move);commit();renderSlides();renderInspector()};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true})}
function startRotate(ev,id){ev.preventDefault();ev.stopPropagation();const e=activeSlide().elements.find(x=>x.id===id),r=UI.stage.getBoundingClientRect(),cx=r.left+(e.x+e.w/2)*scale,cy=r.top+(e.y+e.h/2)*scale;const move=mv=>{e.rotation=Math.round(Math.atan2(mv.clientY-cy,mv.clientX-cx)*180/Math.PI+90);if(mv.shiftKey)e.rotation=Math.round(e.rotation/15)*15;renderStage()};const up=()=>{window.removeEventListener('pointermove',move);commit();renderSlides();renderInspector()};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true})}

function beginSelection(ev){
 if(ev.target!==UI.stage||drawMode||panMode||spacePan)return;const p=stagePoint(ev);selectedIds.clear();const box=UI.selectionBox;box.classList.remove('hidden');const sr=UI.stage.getBoundingClientRect(),sx=p.x*scale,sy=p.y*scale;Object.assign(box.style,{left:sx+'px',top:sy+'px',width:'0px',height:'0px'});
 const move=mv=>{const q=stagePoint(mv),x=Math.min(p.x,q.x),y=Math.min(p.y,q.y),w=Math.abs(q.x-p.x),h=Math.abs(q.y-p.y);Object.assign(box.style,{left:x*scale+'px',top:y*scale+'px',width:w*scale+'px',height:h*scale+'px'});selectedIds.clear();activeSlide().elements.forEach(e=>{if(e.x>=x&&e.y>=y&&e.x+e.w<=x+w&&e.y+e.h<=y+h)selectedIds.add(e.id)});renderStage()};
 const up=()=>{window.removeEventListener('pointermove',move);box.classList.add('hidden');renderInspector();renderLayers();syncMobileSelectionUI()};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true})
}
UI.stage.addEventListener('pointerdown',beginSelection);

function addElement(type){
 const z=Math.max(0,...activeSlide().elements.map(x=>x.z||0))+1;let e;
 if(type==='title')e=textEl('title',uid('morph'),110,100,760,130,'Deine Überschrift',64,project.theme.ink,true);
 if(type==='text')e=textEl('text',uid('morph'),120,260,600,100,'Schreibe hier deinen Text …',28,project.theme.ink);
 if(type==='rect')e=shapeEl('rect',uid('morph'),160,180,390,220,project.theme.accent,28);
 if(type==='circle')e=shapeEl('circle',uid('morph'),190,160,230,230,project.theme.accent,120);
 if(type==='triangle')e=shapeEl('triangle',uid('morph'),190,150,250,230,project.theme.accent,0);
 if(type==='star')e=shapeEl('star',uid('morph'),190,150,230,230,project.theme.accent,0);
 if(type==='line'||type==='arrow')e={...shapeEl(type,uid('morph'),180,300,360,40,'transparent',0),color:project.theme.ink,strokeWidth:5};
 if(type==='badge')e={...textEl('badge',uid('morph'),150,140,250,62,'✦ Wichtig',23,'#8b5e59',true,'center'),fill:'#ffe2dc',borderRadius:40};
 if(!e)return;e.z=z;activeSlide().elements.push(e);selectedIds=new Set([e.id]);commit();renderAll();syncMobileSelectionUI()
}
function addSlide(){const s=defaultSlide();s.background=activeSlide()?.background||project.theme.bg;project.slides.push(s);project.activeSlideId=s.id;selectedIds.clear();closeInspectorMobile();commit();renderAll()}
function duplicateSlide(){const s=activeSlide(),copy=deep(s);copy.id=uid('slide');copy.name=s.name+' Kopie';const i=project.slides.indexOf(s);project.slides.splice(i+1,0,copy);project.activeSlideId=copy.id;selectedIds.clear();commit();renderAll();toast('Folie dupliziert – Morph-IDs bleiben identisch.')}
function deleteSlide(){if(project.slides.length===1)return toast('Mindestens eine Folie muss bleiben.');const i=project.slides.findIndex(s=>s.id===project.activeSlideId);project.slides.splice(i,1);project.activeSlideId=project.slides[Math.max(0,i-1)].id;selectedIds.clear();commit();renderAll()}
function deleteSelected(){if(!selectedIds.size)return;activeSlide().elements=activeSlide().elements.filter(e=>!selectedIds.has(e.id));selectedIds.clear();commit();renderAll()}
function duplicateSelection(){copySelection();pasteSelection(false)}
function copySelection(){clipboard=deep(selectedElements())}
function pasteSelection(offset=true){if(!clipboard.length)return;const maxz=Math.max(0,...activeSlide().elements.map(x=>x.z||0));const pasted=deep(clipboard).map((e,i)=>({...e,id:uid('morph'),x:e.x+(offset?30:18),y:e.y+(offset?30:18),z:maxz+i+1}));activeSlide().elements.push(...pasted);selectedIds=new Set(pasted.map(e=>e.id));commit();renderAll()}
function groupSelection(){if(selectedIds.size<2)return toast('Mindestens 2 Elemente auswählen.');const items=selectedElements(),gid=uid('group');items.forEach(e=>e.groupId=gid);commit();renderAll();toast('Gruppe erstellt.')}
function ungroupSelection(){const gids=new Set(selectedElements().map(e=>e.groupId).filter(Boolean));activeSlide().elements.forEach(e=>{if(gids.has(e.groupId))delete e.groupId});commit();renderAll()}
function selectGroup(id){const e=activeSlide().elements.find(x=>x.id===id);if(e?.groupId)selectedIds=new Set(activeSlide().elements.filter(x=>x.groupId===e.groupId).map(x=>x.id))}
function arrange(action){
 const items=selectedElements();if(!items.length)return;const arr=activeSlide().elements,max=Math.max(...arr.map(x=>x.z||0)),min=Math.min(...arr.map(x=>x.z||0));
 if(action==='group')return groupSelection();if(action==='ungroup')return ungroupSelection();if(action==='duplicate')return duplicateSelection();if(action==='delete')return deleteSelected();
 items.forEach((e,i)=>{if(action==='front')e.z=max+i+1;if(action==='back')e.z=min-i-1;if(action==='up')e.z+=1;if(action==='down')e.z-=1;if(action==='centerX')e.x=(W-e.w)/2;if(action==='centerY')e.y=(H-e.h)/2;if(action==='left')e.x=0;if(action==='right')e.x=W-e.w;if(action==='top')e.y=0;if(action==='bottom')e.y=H-e.h;if(action==='lock')e.locked=!e.locked});commit();renderAll()
}

function renderInspector(){
 const items=selectedElements(),e=items[0];UI.empty.classList.toggle('hidden',!!e);UI.content.classList.toggle('hidden',!e);if(!e)return;
 $('#elementTypeLabel').textContent=items.length>1?`${items.length} Elemente`:elmap[e.type]||e.type;
 $('#textControls').classList.toggle('hidden',items.length>1||!['title','text','badge','icon'].includes(e.type));
 $('#imageControls').classList.toggle('hidden',items.length>1||!['image','video'].includes(e.type));
 set('#fontFamily',e.fontFamily||'Inter');set('#fontSize',e.fontSize||28);set('#fillColor',safeColor(e.fill));set('#elementColor',safeColor(e.color));
 set('#gradientType',e.gradient?.type||'none');set('#gradientColor1',safeColor(e.gradient?.c1||e.fill));set('#gradientColor2',safeColor(e.gradient?.c2||'#ef9e9c'));
 set('#opacityRange',Math.round((e.opacity??1)*100));set('#radiusRange',e.borderRadius||0);set('#shadowRange',e.shadow||0);set('#borderRange',e.borderWidth||0);
 set('#posX',Math.round(e.x));set('#posY',Math.round(e.y));set('#sizeW',Math.round(e.w));set('#sizeH',Math.round(e.h));set('#rotationRange',e.rotation||0);
 set('#lineHeightRange',e.lineHeight||1.12);set('#letterSpacingRange',e.letterSpacing||0);
 set('#objectFit',e.objectFit||'cover');set('#cropZoom',e.cropZoom||100);set('#cropX',e.cropX??50);set('#cropY',e.cropY??50);set('#brightnessRange',e.brightness??100);set('#contrastRange',e.contrast??100);set('#saturateRange',e.saturate??100);set('#blurRange',e.blur??0);set('#maskSelect',e.mask||'none');
 set('#animIn',e.animation?.in||'none');set('#animOut',e.animation?.out||'none');set('#animDuration',e.animation?.duration||.6);set('#animDelay',e.animation?.delay||0);set('#animTrigger',e.animation?.trigger||'auto');set('#morphId',items.length===1?e.id:'Mehrfachauswahl');
 $('#boldBtn').style.background=e.fontWeight>=700?'#ffe2dc':'#fff';$('#italicBtn').style.background=e.fontStyle==='italic'?'#ffe2dc':'#fff';$('#underlineBtn').style.background=e.textDecoration==='underline'?'#ffe2dc':'#fff';
 if(['video','audio'].includes(e.type)){set('#autoplayToggle',!!e.autoplay);set('#loopToggle',!!e.loop);set('#volumeRange',e.volume??100)}
}
function safeColor(v){return /^#[0-9a-f]{6}$/i.test(v||'')?v:'#ffffff'}function set(sel,v){const n=$(sel);if(n)n.type==='checkbox'?n.checked=!!v:n.value=v}
function updateSelected(mut){const items=selectedElements();if(!items.length)return;items.forEach(mut);commit();renderStage();renderSlides();renderInspector();renderLayers();renderTimeline()}
function liveSelected(mut){const items=selectedElements();if(!items.length)return;items.forEach(mut);renderStage()}
function syncSlideControls(){const s=activeSlide();set('#slideBg',safeColor(s.background));set('#transitionSelect',s.transition||'fade');set('#transitionDuration',s.transitionDuration||.7);UI.notes.value=s.notes||''}
function applyTheme(name){const themes={blush:{bg:'#fff8f4',ink:'#473a34',accent:'#ef9e9c'},sage:{bg:'#f7f8ec',ink:'#3e4836',accent:'#aab98d'},sky:{bg:'#f0f7fb',ink:'#334b5a',accent:'#9db9d3'},lavender:{bg:'#f8f3fb',ink:'#493d52',accent:'#c5a9d6'},night:{bg:'#25272e',ink:'#fff8f2',accent:'#d5a6bd'}};project.theme=themes[name];activeSlide().background=themes[name].bg;commit();renderAll()}

function insertDataFile(file,type){
 const r=new FileReader();r.onload=()=>{const base={...shapeEl(type,uid('morph'),170,120,520,340,'transparent',24),src:r.result,objectFit:'cover',cropZoom:100,cropX:50,cropY:50,brightness:100,contrast:100,saturate:100,blur:0,mask:'none',name:file.name,autoplay:false,loop:false,volume:100};activeSlide().elements.push(base);selectedIds=new Set([base.id]);if(type!=='audio')mediaStore.push({id:uid('media'),type,name:file.name,src:r.result});commit();renderAll()};r.readAsDataURL(file)
}
function insertSVG(file){const r=new FileReader();r.onload=()=>{const e={...shapeEl('svg',uid('morph'),180,140,430,330,'transparent',0),svg:r.result,name:file.name};activeSlide().elements.push(e);selectedIds=new Set([e.id]);mediaStore.push({id:uid('media'),type:'svg',name:file.name,src:r.result});commit();renderAll()};r.readAsText(file)}
function insertChart(){const values=$('#chartValues').value.split(',').map(x=>Number(x.trim())||0),labels=$('#chartLabels').value.split(',').map(x=>x.trim());const e={...shapeEl('chart',uid('morph'),180,150,560,350,'#fff',24),chartType:$('#chartType').value,values,labels,color:project.theme.accent,shadow:12};activeSlide().elements.push(e);selectedIds=new Set([e.id]);commit();renderAll();closeModals()}
function insertTable(){const e={...shapeEl('table',uid('morph'),150,150,650,320,'transparent',0),rows:+$('#tableRows').value,cols:+$('#tableCols').value,color:project.theme.ink};activeSlide().elements.push(e);selectedIds=new Set([e.id]);commit();renderAll();closeModals()}
const icons=['✦','★','✓','♥','☀','☁','⚡','☕','✎','⌂','♬','⚙','☻','⚑','➜','∞','⌘','⚗','☘','✿','❖','◉','➤','⬡','◒','☂','♛','⚐','⌁','✦'];
function renderIcons(){const g=$('#iconGrid');g.innerHTML='';icons.forEach(ic=>{const b=document.createElement('button');b.textContent=ic;b.onclick=()=>{const e=textEl('icon',uid('morph'),200,170,150,150,ic,92,project.theme.accent,true,'center');activeSlide().elements.push(e);selectedIds=new Set([e.id]);commit();renderAll();closeModals()};g.appendChild(b)})}

const templates=[
 {name:'Minimal Titel',bg:'#fffaf4',els:()=>[textEl('title',uid('morph'),100,160,770,160,'Große Idee.\nKlar erklärt.',72,'#40332e',true),textEl('text',uid('morph'),105,365,570,90,'Eine ruhige, hochwertige Titelfolie.',25,'#8f7c73'),shapeEl('circle',uid('morph'),930,150,220,220,'#f3b0aa',120)]},
 {name:'Kapitel',bg:'#f7f8ec',els:()=>[textEl('text',uid('morph'),105,130,250,50,'01  KAPITEL',20,'#829367',true),textEl('title',uid('morph'),100,215,850,160,'Eine starke\nZwischenüberschrift',65,'#394031',true),shapeEl('rect',uid('morph'),100,515,1060,8,'#aab98d',4)]},
 {name:'Vergleich',bg:'#fff9f5',els:()=>[textEl('title',uid('morph'),85,70,700,80,'A oder B?',52,'#473a34',true),shapeEl('rect',uid('morph'),80,180,520,390,'#ffe9e3',28),shapeEl('rect',uid('morph'),680,180,520,390,'#eef1df',28),textEl('text',uid('morph'),120,220,430,80,'Option A',34,'#684b45',true),textEl('text',uid('morph'),720,220,430,80,'Option B',34,'#536046',true)]},
 {name:'3 Fakten',bg:'#f5f7fb',els:()=>[textEl('title',uid('morph'),80,70,800,80,'Drei Dinge, die zählen',48,'#334b5a',true),...['01','02','03'].map((n,i)=>shapeEl('rect',uid('morph'),80+i*390,230,350,250,['#dcebf3','#f6e4df','#e7edd8'][i],28)),...['Erster Fakt','Zweiter Fakt','Dritter Fakt'].map((t,i)=>textEl('text',uid('morph'),115+i*390,280,280,80,t,29,'#40515b',true,'center'))]},
 {name:'Zitat',bg:'#2c2930',els:()=>[textEl('text',uid('morph'),110,90,150,80,'“',76,'#e3b6c7',true),textEl('title',uid('morph'),130,205,1000,220,'Eine Präsentation sollte sich nicht wie eine Textwand anfühlen.',52,'#fff8f2',true,'center'),textEl('text',uid('morph'),400,500,480,50,'— SlideBloom Studio',20,'#d4c4cb',false,'center')]},
 {name:'Prozess',bg:'#fffdf8',els:()=>[textEl('title',uid('morph'),85,65,600,80,'So funktioniert es',50,'#473a34',true),...['Idee','Aufbau','Ergebnis'].flatMap((t,i)=>[shapeEl('circle',uid('morph'),145+i*390,265,120,120,['#ef9e9c','#e8c877','#aab98d'][i],60),textEl('text',uid('morph'),110+i*390,420,190,60,t,28,'#473a34',true,'center')])]},
 {name:'Simple Explain',bg:'#fffaf5',els:()=>[textEl('title',uid('morph'),90,70,780,85,'Warum passiert das?',54,'#4a3932',true),shapeEl('circle',uid('morph'),110,215,210,210,'#f6c9b6',120),textEl('text',uid('morph'),152,278,125,70,'1',50,'#fff',true,'center'),textEl('text',uid('morph'),380,220,700,90,'Ein Gedanke nach dem anderen.',35,'#5a4841',true),textEl('text',uid('morph'),380,320,680,160,'Kurze Texte, klare Visuals und Animationen, die den Blick gezielt führen.',25,'#83726b')]},
 {name:'Timeline',bg:'#f8f3fb',els:()=>[textEl('title',uid('morph'),85,70,700,80,'Eine Entwicklung',50,'#493d52',true),shapeEl('rect',uid('morph'),120,350,1040,8,'#c5a9d6',4),...['Start','Wandel','Heute'].flatMap((t,i)=>[shapeEl('circle',uid('morph'),160+i*420,315,78,78,'#c5a9d6',50),textEl('text',uid('morph'),120+i*420,425,160,55,t,25,'#493d52',true,'center')])]}
];
function renderTemplates(){const g=$('#templateGrid');g.innerHTML='';templates.forEach(t=>{const c=document.createElement('div');c.className='template-card';const pv=document.createElement('div');pv.className='template-preview';const inn=document.createElement('div');inn.style.cssText='width:1280px;height:720px;transform:scale(.19);transform-origin:top left';pv.appendChild(inn);renderSlideTo(inn,{background:t.bg,elements:t.els()},false);c.appendChild(pv);const nm=document.createElement('strong');nm.textContent=t.name;c.appendChild(nm);c.onclick=()=>{const s=activeSlide();s.background=t.bg;s.elements=t.els();selectedIds.clear();commit();renderAll();closeModals()};g.appendChild(c)})}

function playEntrance(node,a){
 if(!a||a.in==='none')return;
 const dur=(a.duration||.6)*1000,delay=(a.delay||0)*1000,base=node.style.transform||'',opts={duration:dur,delay,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'};
 const map={fade:[{opacity:0},{opacity:1}],up:[{opacity:0,transform:`translateY(55px) ${base}`},{opacity:1,transform:`translateY(0) ${base}`}],down:[{opacity:0,transform:`translateY(-55px) ${base}`},{opacity:1,transform:`translateY(0) ${base}`}],left:[{opacity:0,transform:`translateX(-70px) ${base}`},{opacity:1,transform:`translateX(0) ${base}`}],right:[{opacity:0,transform:`translateX(70px) ${base}`},{opacity:1,transform:`translateX(0) ${base}`}],pop:[{opacity:0,transform:`scale(.72) ${base}`},{opacity:1,transform:`scale(1.07) ${base}`,offset:.72},{opacity:1,transform:`scale(1) ${base}`}],zoom:[{opacity:0,transform:`scale(.45) ${base}`},{opacity:1,transform:`scale(1) ${base}`}],blur:[{opacity:0,filter:'blur(15px)'},{opacity:1,filter:'blur(0)'}],bounce:[{opacity:0,transform:`translateY(-90px) ${base}`},{opacity:1,transform:`translateY(18px) ${base}`,offset:.65},{transform:`translateY(-8px) ${base}`,offset:.82},{transform:`translateY(0) ${base}`}],spin:[{opacity:0,transform:`scale(.5) rotate(-160deg)`},{opacity:1,transform:base}]};
 node.animate(map[a.in]||map.fade,opts)
}
function playTypewriter(node,e){
 if(e.animation?.in!=='typewriter')return false;const c=node.querySelector('.content');if(!c)return false;const full=e.content||'',dur=(e.animation.duration||1)*1000,delay=(e.animation.delay||0)*1000;c.textContent='';setTimeout(()=>{let i=0;const iv=setInterval(()=>{c.textContent=full.slice(0,++i);if(i>=full.length)clearInterval(iv)},Math.max(18,dur/Math.max(1,full.length)))},delay);return true
}

function renderTimeline(){
 const rows=$('#timelineRows'),ruler=$('#timelineRuler');rows.innerHTML='';ruler.innerHTML='';const maxT=Math.max(10,...activeSlide().elements.map(e=>(e.animation?.delay||0)+(e.animation?.duration||.6)+1));const px=timelineScale;
 ruler.style.width=(maxT*px)+'px';for(let t=0;t<=maxT;t++){const tick=document.createElement('div');tick.className='tick';tick.style.left=(t*px)+'px';tick.textContent=t+'s';ruler.appendChild(tick)}
 activeSlide().elements.slice().sort((a,b)=>(a.z||0)-(b.z||0)).forEach(e=>{const row=document.createElement('div');row.className='timeline-row';row.innerHTML=`<div class="timeline-label">${esc(elmap[e.type]||e.type)} · ${esc((e.content||e.name||'').slice(0,18))}</div><div class="timeline-track"></div>`;const tr=row.querySelector('.timeline-track');tr.style.width=(maxT*px)+'px';const b=document.createElement('div');b.className='timeline-bar';b.style.left=((e.animation?.delay||0)*px)+'px';b.style.width=(Math.max(.1,e.animation?.duration||.6)*px)+'px';b.textContent=e.animation?.in||'none';b.onpointerdown=ev=>timelineDrag(ev,e,b);tr.appendChild(b);rows.appendChild(row)});
 $('#timelinePlayhead').style.left=(150+playheadTime*px)+'px'
}
function timelineDrag(ev,e,bar){ev.stopPropagation();const sx=ev.clientX,start=e.animation?.delay||0;const move=mv=>{const d=(mv.clientX-sx)/timelineScale;e.animation.delay=Math.max(0,Math.round((start+d)*10)/10);bar.style.left=(e.animation.delay*timelineScale)+'px';bar.title=`${e.animation.delay}s`};const up=()=>{window.removeEventListener('pointermove',move);commit();renderInspector()};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true})}
function previewTimeline(){const s=activeSlide();renderSlideTo(UI.stage,s,false);const max=Math.max(1,...s.elements.map(e=>(e.animation?.delay||0)+(e.animation?.duration||.6)));const t0=performance.now();s.elements.forEach(e=>{const n=UI.stage.querySelector(`[data-id="${CSS.escape(e.id)}"]`);if(n){if(!playTypewriter(n,e))playEntrance(n,e.animation)}});const tick=now=>{playheadTime=Math.min(max,(now-t0)/1000);$('#timelinePlayhead').style.left=(150+playheadTime*timelineScale)+'px';if(playheadTime<max)requestAnimationFrame(tick)};requestAnimationFrame(tick)}
function openTimeline(){UI.timeline.classList.add('open');renderTimeline()}function closeTimeline(){UI.timeline.classList.remove('open')}

function drawingStart(ev){
 if(!drawMode||ev.target!==UI.stage)return;ev.preventDefault();const start=stagePoint(ev),pts=[start];const move=mv=>{pts.push(stagePoint(mv));drawTempPath(pts)};const up=()=>{window.removeEventListener('pointermove',move);$('.temp-drawing')?.remove();const minx=Math.min(...pts.map(p=>p.x)),miny=Math.min(...pts.map(p=>p.y)),maxx=Math.max(...pts.map(p=>p.x)),maxy=Math.max(...pts.map(p=>p.y)),w=Math.max(20,maxx-minx),h=Math.max(20,maxy-miny);const path=pts.map((p,i)=>`${i?'L':'M'} ${p.x-minx} ${p.y-miny}`).join(' ');const e={...shapeEl('drawing',uid('morph'),minx,miny,w,h,'transparent',0),path,color:project.theme.ink,strokeWidth:5};activeSlide().elements.push(e);selectedIds=new Set([e.id]);drawMode=false;document.body.classList.remove('draw-mode');commit();renderAll()};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true})
}
function drawTempPath(pts){let temp=$('.temp-drawing');if(!temp){temp=document.createElementNS('http://www.w3.org/2000/svg','svg');temp.classList.add('temp-drawing');Object.assign(temp.style,{position:'absolute',inset:'0',width:'1280px',height:'720px',pointerEvents:'none',zIndex:'999'});UI.stage.appendChild(temp)}temp.innerHTML=`<path d="${pts.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ')}" fill="none" stroke="${project.theme.ink}" stroke-width="5" stroke-linecap="round"/>`}
UI.stage.addEventListener('pointerdown',drawingStart);

function renderLayers(){
 const list=$('#layersList');if(!list)return;list.innerHTML='';[...activeSlide().elements].sort((a,b)=>(b.z||0)-(a.z||0)).forEach(e=>{const r=document.createElement('div');r.className='layer-row '+(selectedIds.has(e.id)?'active':'');r.innerHTML=`<button data-vis>${e.hidden?'○':'◉'}</button><button data-lock>${e.locked?'🔒':'🔓'}</button><span class="grow">${esc(elmap[e.type]||e.type)} ${esc((e.content||e.name||'').slice(0,22))}</span>`;r.querySelector('.grow').onclick=()=>selectElement(e.id,false);r.querySelector('[data-vis]').onclick=()=>{e.hidden=!e.hidden;commit();renderAll()};r.querySelector('[data-lock]').onclick=()=>{e.locked=!e.locked;commit();renderAll()};list.appendChild(r)});
 const cl=$('#commentsList');cl.innerHTML='';(activeSlide().comments||[]).forEach(c=>{const d=document.createElement('div');d.className='comment-card';d.innerHTML=`<div>${esc(c.text)}</div><small>${new Date(c.time).toLocaleString('de-DE')}</small>`;cl.appendChild(d)})
}
function addComment(){openModal('#commentModal');$('#commentText').value='';setTimeout(()=>$('#commentText').focus(),30)}
function saveComment(){const text=$('#commentText').value.trim();if(!text)return;activeSlide().comments ||= [];activeSlide().comments.push({id:uid('comment'),text,time:Date.now(),elementIds:[...selectedIds]});commit();renderLayers();closeModals();toast('Kommentar gespeichert.')}

function renderMediaLibrary(){const g=$('#mediaLibraryGrid');g.innerHTML='';mediaStore.forEach(m=>{const c=document.createElement('div');c.className='media-card';if(m.type==='video'){const v=document.createElement('video');v.src=m.src;v.muted=true;c.appendChild(v)}else if(m.type==='svg')c.innerHTML=m.src;else{const im=document.createElement('img');im.src=m.src;c.appendChild(im)};c.title=m.name;c.onclick=()=>{const type=m.type==='svg'?'svg':m.type==='video'?'video':'image';let e;if(type==='svg')e={...shapeEl('svg',uid('morph'),180,130,430,330,'transparent',0),svg:m.src,name:m.name};else e={...shapeEl(type,uid('morph'),180,130,480,330,'transparent',24),src:m.src,name:m.name,objectFit:'cover',cropZoom:100,cropX:50,cropY:50,brightness:100,contrast:100,saturate:100,blur:0,mask:'none'};activeSlide().elements.push(e);selectedIds=new Set([e.id]);commit();renderAll();closeModals()};g.appendChild(c)})}

function showPresentation(startIndex=project.slides.findIndex(s=>s.id===project.activeSlideId)){
 isPresenting=true;presentIndex=Math.max(0,startIndex);UI.presentation.classList.remove('hidden');scalePresentation();renderPresentSlide(project.slides[presentIndex],true);document.body.requestFullscreen?.().catch(()=>{})
}
function scalePresentation(){UI.pstage.style.transform=`scale(${Math.min(innerWidth/W,innerHeight/H)})`}
function renderPresentSlide(slide,animate=true){
 renderSlideTo(UI.pstage,slide,false);$('#presentCounter').textContent=`${presentIndex+1} / ${project.slides.length}`;$('#presentNotes').textContent=slide.notes||'Keine Sprechernotizen.';
 const clickable=[];slide.elements.forEach(e=>{const n=UI.pstage.querySelector(`[data-id="${CSS.escape(e.id)}"]`);if(!n)return;if(e.type==='audio'){const au=new Audio(e.src);au.volume=(e.volume??100)/100;if(e.loop)au.loop=true;if(e.autoplay)au.play().catch(()=>{})}
  if(e.animation?.trigger==='click') {n.style.opacity=0;clickable.push(()=>{n.style.opacity=1;if(!playTypewriter(n,e))playEntrance(n,e.animation)})}
  else if(animate){if(!playTypewriter(n,e))playEntrance(n,e.animation)}
 });
 UI.pstage.onclick=()=>{const fn=clickable.shift();if(fn)fn()}
}
function nextPresent(dir=1){let ni=presentIndex+dir;while(ni>=0&&ni<project.slides.length&&project.slides[ni].hidden)ni+=dir;if(ni<0||ni>=project.slides.length)return;const from=project.slides[presentIndex],to=project.slides[ni];presentIndex=ni;if(dir>0&&to.transition==='morph')morphTo(from,to);else transitionTo(to,to.transition||'fade',to.transitionDuration||.7,dir)}
function transitionTo(to,type,duration,dir){
 const old=UI.pstage.cloneNode(true);old.removeAttribute('id');old.style.position='absolute';old.style.zIndex=2;UI.presentation.appendChild(old);renderPresentSlide(to,false);const d=duration*1000,sc=Math.min(innerWidth/W,innerHeight/H);
 let a1=[{opacity:1},{opacity:0}],a2=[{opacity:0},{opacity:1}];
 if(type==='slide'||type==='push'){a1=[{transform:`translateX(0) scale(${sc})`},{transform:`translateX(${dir>0?'-100vw':'100vw'}) scale(${sc})`}];a2=[{opacity:0,transform:`translateX(${dir>0?'100vw':'-100vw'}) scale(${sc})`},{opacity:1,transform:`translateX(0) scale(${sc})`}]}
 if(type==='zoom'){a1=[{opacity:1},{opacity:0,filter:'blur(5px)',transform:`scale(${sc*1.08})`}];a2=[{opacity:0,transform:`scale(${sc*.9})`},{opacity:1,transform:`scale(${sc})`}]}
 if(type==='flip'){a1=[{opacity:1,transform:`perspective(1200px) rotateY(0deg) scale(${sc})`},{opacity:0,transform:`perspective(1200px) rotateY(-80deg) scale(${sc})`}];a2=[{opacity:0,transform:`perspective(1200px) rotateY(80deg) scale(${sc})`},{opacity:1,transform:`perspective(1200px) rotateY(0deg) scale(${sc})`}]}
 old.animate(a1,{duration:d,easing:'ease',fill:'forwards'}).onfinish=()=>old.remove();UI.pstage.animate(a2,{duration:d,easing:'ease',fill:'both'}).onfinish=()=>renderPresentSlide(to,true)
}
function morphTo(from,to){
 const dur=(to.transitionDuration||.7)*1000;UI.pstage.style.background=from.background;const nodes=[...UI.pstage.querySelectorAll('.el')],fm=new Map(from.elements.map(e=>[e.id,e])),tm=new Map(to.elements.map(e=>[e.id,e]));
 to.elements.filter(e=>!fm.has(e.id)).forEach(e=>{const n=renderElement(e,false);n.style.opacity=0;UI.pstage.appendChild(n);n.animate([{opacity:0,transform:`scale(.8) rotate(${e.rotation||0}deg)`},{opacity:e.opacity??1,transform:`scale(1) rotate(${e.rotation||0}deg)`}],{duration:dur,delay:dur*.12,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'})});
 nodes.forEach(n=>{const A=fm.get(n.dataset.id),B=tm.get(n.dataset.id);if(!B){n.animate([{opacity:A?.opacity??1},{opacity:0}],{duration:dur*.65,fill:'forwards'});return}
  const k1={left:A.x+'px',top:A.y+'px',width:A.w+'px',height:A.h+'px',transform:`rotate(${A.rotation||0}deg)`,opacity:A.opacity??1,background:backgroundStyle(A),borderRadius:(A.borderRadius||0)+'px'};
  const k2={left:B.x+'px',top:B.y+'px',width:B.w+'px',height:B.h+'px',transform:`rotate(${B.rotation||0}deg)`,opacity:B.opacity??1,background:backgroundStyle(B),borderRadius:(B.borderRadius||0)+'px'};
  n.animate([k1,k2],{duration:dur,easing:'cubic-bezier(.22,.88,.25,1)',fill:'forwards'});
  const c=n.querySelector('.content');if(c&&['title','text','badge','icon'].includes(B.type))c.animate([{fontSize:(A.fontSize||28)+'px',color:A.color||'#333',letterSpacing:(A.letterSpacing||0)+'px'},{fontSize:(B.fontSize||28)+'px',color:B.color||'#333',letterSpacing:(B.letterSpacing||0)+'px'}],{duration:dur,easing:'ease',fill:'forwards'})
 });
 UI.pstage.animate([{background:from.background},{background:to.background}],{duration:dur,fill:'forwards'});setTimeout(()=>renderPresentSlide(to,true),dur+25);$('#presentCounter').textContent=`${presentIndex+1} / ${project.slides.length}`
}
function exitPresent(){isPresenting=false;UI.presentation.classList.add('hidden');document.exitFullscreen?.().catch(()=>{});stopTimer();laserMode=false;document.body.classList.remove('laser-mode')}
function toggleTimer(){const t=$('#presentTimer');if(timerHandle){stopTimer();t.classList.add('hidden');return}timerStart=Date.now();t.classList.remove('hidden');timerHandle=setInterval(()=>{const s=Math.floor((Date.now()-timerStart)/1000),m=Math.floor(s/60);t.textContent=`${String(m).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`},500)}
function stopTimer(){clearInterval(timerHandle);timerHandle=null}
function toggleLaser(){laserMode=!laserMode;$('#laserDot').classList.toggle('hidden',!laserMode);document.body.classList.toggle('laser-mode',laserMode)}
UI.presentation.addEventListener('pointermove',e=>{if(laserMode){const d=$('#laserDot');d.style.left=(e.clientX-7)+'px';d.style.top=(e.clientY-7)+'px'}})

function exportProject(){download(new Blob([JSON.stringify(project,null,2)],{type:'application/json'}),`${slug(project.name)}.slidebloom.json`)}
function importProject(file){const r=new FileReader();r.onload=()=>{try{project=JSON.parse(r.result);project.activeSlideId=project.slides[0]?.id;selectedIds.clear();history=[JSON.stringify(project)];renderAll();saveProject();closeModals();toast('Projekt importiert.')}catch{toast('Ungültige Projektdatei.')}};r.readAsText(file)}
function slug(s){return(s||'presentation').toLowerCase().replace(/[^a-z0-9äöüß]+/gi,'-').replace(/^-|-$/g,'')}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function standaloneHTML(){
 const payload=JSON.stringify(project).replace(/</g,'\\u003c');
 return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(project.name)}</title><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#111;font-family:Arial,sans-serif}.stage{width:1280px;height:720px;position:absolute;left:50%;top:50%;transform-origin:center;overflow:hidden}.el{position:absolute;display:flex;transform-origin:center}.c{width:100%;height:100%;display:flex;align-items:center;white-space:pre-wrap;word-break:break-word}.nav{position:fixed;bottom:14px;left:50%;transform:translateX(-50%);padding:6px;background:#0008;border-radius:14px;color:white;z-index:9}.nav button{border:0;background:#ffffff22;color:white;padding:8px 13px;border-radius:10px;margin:0 3px}</style></head><body><div class="stage" id="s"></div><div class="nav"><button id="p">‹</button><span id="n"></span><button id="x">›</button></div><script>const P=${payload},W=1280,H=720,s=document.getElementById('s');let i=0;function sc(){let k=Math.min(innerWidth/W,innerHeight/H);s.style.transform='translate(-50%,-50%) scale('+k+')'}addEventListener('resize',sc);sc();function bg(e){let g=e.gradient||{};return g.type==='linear'?'linear-gradient(135deg,'+g.c1+','+g.c2+')':g.type==='radial'?'radial-gradient(circle,'+g.c1+','+g.c2+')':(e.fill||'transparent')}function node(e){let d=document.createElement('div');d.className='el';d.dataset.id=e.id;Object.assign(d.style,{left:e.x+'px',top:e.y+'px',width:e.w+'px',height:e.h+'px',transform:'rotate('+(e.rotation||0)+'deg)',opacity:e.opacity??1,zIndex:e.z||1,background:bg(e),borderRadius:(e.borderRadius||0)+'px',boxShadow:e.shadow?'0 10px '+e.shadow*1.5+'px #0002':'none'});let c=document.createElement('div');c.className='c';if(e.type==='image'||e.type==='video'){let m=e.type==='video'&&!String(e.src||'').startsWith('data:image/gif')?document.createElement('video'):document.createElement('img');m.src=e.src||'';m.style.cssText='width:100%;height:100%;object-fit:'+(e.objectFit||'cover')+';object-position:'+(e.cropX??50)+'% '+(e.cropY??50)+'%;transform:scale('+((e.cropZoom??100)/100)+');filter:brightness('+(e.brightness??100)+'%) contrast('+(e.contrast??100)+'%) saturate('+(e.saturate??100)+'%) blur('+(e.blur??0)+'px)';if(m.tagName==='VIDEO'){m.autoplay=!!e.autoplay;m.loop=!!e.loop;m.muted=true;m.playsInline=true}c.appendChild(m)}else if(e.type==='svg')c.innerHTML=e.svg||'';else if(e.type==='chart')c.innerHTML='<div style="display:grid;place-items:center;width:100%;height:100%;font-size:28px">▥ Diagramm</div>';else if(e.type==='table')c.innerHTML='<div style="display:grid;place-items:center;width:100%;height:100%;font-size:28px">▦ Tabelle</div>';else if(e.type==='audio'){c.innerHTML='<div style="display:grid;place-items:center;width:100%;height:100%">♫ Audio</div>';if(e.autoplay){let a=new Audio(e.src);a.loop=!!e.loop;a.play().catch(()=>{})}}else{c.textContent=e.content||'';Object.assign(c.style,{color:e.color||'#333',fontFamily:e.fontFamily||'Arial',fontSize:(e.fontSize||28)+'px',fontWeight:e.fontWeight||400,fontStyle:e.fontStyle||'normal',textDecoration:e.textDecoration||'none',textAlign:e.textAlign||'left',justifyContent:e.textAlign==='center'?'center':e.textAlign==='right'?'flex-end':'flex-start',padding:e.type==='badge'?'12px 20px':'0',lineHeight:e.lineHeight||1.12,letterSpacing:(e.letterSpacing||0)+'px'})}d.appendChild(c);return d}function render(sl){s.innerHTML='';s.style.background=sl.background;[...sl.elements].sort((a,b)=>(a.z||0)-(b.z||0)).forEach(e=>s.appendChild(node(e)));document.getElementById('n').textContent=(i+1)+' / '+P.slides.length}function go(dir){let ni=i+dir;while(ni>=0&&ni<P.slides.length&&P.slides[ni].hidden)ni+=dir;if(ni<0||ni>=P.slides.length)return;let a=P.slides[i],b=P.slides[ni];i=ni;if(dir>0&&b.transition==='morph')morph(a,b);else render(b)}function morph(a,b){let D=(b.transitionDuration||.7)*1000,am=new Map(a.elements.map(e=>[e.id,e])),bm=new Map(b.elements.map(e=>[e.id,e])),nodes=[...s.querySelectorAll('.el')];b.elements.filter(e=>!am.has(e.id)).forEach(e=>{let n=node(e);n.style.opacity=0;s.appendChild(n);n.animate([{opacity:0},{opacity:e.opacity??1}],{duration:D,fill:'forwards'})});nodes.forEach(n=>{let A=am.get(n.dataset.id),B=bm.get(n.dataset.id);if(!B){n.animate([{opacity:A.opacity??1},{opacity:0}],{duration:D*.65,fill:'forwards'});return}n.animate([{left:A.x+'px',top:A.y+'px',width:A.w+'px',height:A.h+'px',transform:'rotate('+(A.rotation||0)+'deg)',opacity:A.opacity??1,background:bg(A),borderRadius:(A.borderRadius||0)+'px'},{left:B.x+'px',top:B.y+'px',width:B.w+'px',height:B.h+'px',transform:'rotate('+(B.rotation||0)+'deg)',opacity:B.opacity??1,background:bg(B),borderRadius:(B.borderRadius||0)+'px'}],{duration:D,easing:'cubic-bezier(.22,.88,.25,1)',fill:'forwards'})});s.animate([{background:a.background},{background:b.background}],{duration:D,fill:'forwards'});setTimeout(()=>render(b),D+20);document.getElementById('n').textContent=(i+1)+' / '+P.slides.length}document.getElementById('x').onclick=()=>go(1);document.getElementById('p').onclick=()=>go(-1);addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key===' ')go(1);if(e.key==='ArrowLeft')go(-1)});render(P.slides[0]);<\/script></body></html>`
}
function printPDF(){const old=$('#printRoot');old?.remove();const root=document.createElement('div');root.id='printRoot';project.slides.filter(s=>!s.hidden).forEach(sl=>{const p=document.createElement('div');p.className='print-page';renderSlideTo(p,sl,false);root.appendChild(p)});document.body.appendChild(root);setTimeout(()=>window.print(),120)}
function openModal(id){$(id).classList.remove('hidden')}function closeModals(){$$('.modal').forEach(m=>m.classList.add('hidden'))}
$$('.modal-close').forEach(b=>b.onclick=closeModals);$$('.modal').forEach(m=>m.addEventListener('pointerdown',e=>{if(e.target===m)closeModals()}));
function toast(msg){UI.toast.textContent=msg;UI.toast.classList.add('show');setTimeout(()=>UI.toast.classList.remove('show'),2100)}
function syncMobileSelectionUI(){
 const edit=$('#mobileEditBtn');
 if(edit) edit.classList.toggle('hidden', selectedIds.size===0);
}
function openInspectorMobile(){
 if(innerWidth<=850 && selectedIds.size) UI.inspector.classList.add('open');
}
function closeInspectorMobile(){
 UI.inspector.classList.remove('open');
}
function closeMobileSlides(){$('#slidesPanel').classList.remove('open')}

$$('[data-add]').forEach(b=>b.onclick=()=>addElement(b.dataset.add));
$('#addSlideBtn').onclick=addSlide;$('#duplicateSlideBtn').onclick=duplicateSlide;$('#deleteSlideBtn').onclick=deleteSlide;$('#hideSlideBtn').onclick=()=>{activeSlide().hidden=!activeSlide().hidden;commit();renderAll()};
$('#imageBtn').onclick=()=>$('#imageInput').click();$('#imageInput').onchange=e=>e.target.files[0]&&insertDataFile(e.target.files[0],'image');
$('#videoBtn').onclick=()=>$('#videoInput').click();$('#videoInput').onchange=e=>e.target.files[0]&&insertDataFile(e.target.files[0],'video');
$('#audioBtn').onclick=()=>$('#audioInput').click();$('#audioInput').onchange=e=>e.target.files[0]&&insertDataFile(e.target.files[0],'audio');
$('#svgBtn').onclick=()=>$('#svgInput').click();$('#svgInput').onchange=e=>e.target.files[0]&&insertSVG(e.target.files[0]);
$('#chartBtn').onclick=()=>openModal('#chartModal');$('#tableBtn').onclick=()=>openModal('#tableModal');$('#iconBtn').onclick=()=>openModal('#iconModal');$('#templateBtn').onclick=()=>openModal('#templateModal');
$('#insertChartBtn').onclick=insertChart;$('#insertTableBtn').onclick=insertTable;
$('#drawBtn').onclick=()=>{drawMode=!drawMode;document.body.classList.toggle('draw-mode',drawMode);toast(drawMode?'Zeichenmodus an – auf Folie zeichnen.':'Zeichenmodus aus.')};
$('#projectName').onchange=e=>{project.name=e.target.value;commit()};
$('#slideBg').oninput=e=>{activeSlide().background=e.target.value;renderStage()};$('#slideBg').onchange=()=>{commit();renderSlides()};
$('#textColor').onchange=e=>{project.theme.ink=e.target.value;commit()};$('#accentColor').onchange=e=>{project.theme.accent=e.target.value;commit()};
$$('[data-theme]').forEach(b=>b.onclick=()=>applyTheme(b.dataset.theme));$('#gridToggle').onclick=()=>{showGrid=!showGrid;renderStage()};$('#snapToggle').onclick=()=>{snap=!snap;toast(`Snap ${snap?'an':'aus'}`)};$('#guidesToggle').onclick=()=>{showGuides=!showGuides;toast(`Smart Guides ${showGuides?'an':'aus'}`)};
$('#transitionSelect').onchange=e=>{activeSlide().transition=e.target.value;commit()};$('#transitionDuration').onchange=e=>{activeSlide().transitionDuration=+e.target.value;commit()};$('#previewTransitionBtn').onclick=()=>showPresentation(Math.max(0,project.slides.findIndex(s=>s.id===project.activeSlideId)-1));
$('#openTimelineBtn').onclick=openTimeline;$('#closeTimelineBtn').onclick=closeTimeline;$('#timelinePlayBtn').onclick=previewTimeline;$('#timelineZoom').oninput=e=>{timelineScale=+e.target.value;renderTimeline()};
$$('.ribbon-tab').forEach(b=>b.onclick=()=>{$$('.ribbon-tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');$$('.toolstrip').forEach(x=>x.classList.add('hidden'));$('#'+b.dataset.panel+'Tools').classList.remove('hidden')});
$$('[data-arrange]').forEach(b=>b.onclick=()=>arrange(b.dataset.arrange));
$('#speakerNotes').onchange=e=>{activeSlide().notes=e.target.value;commit()};$('#deleteElementBtn').onclick=deleteSelected;
$('#undoBtn').onclick=undo;$('#redoBtn').onclick=redo;$('#zoomRange').oninput=e=>{zoomMode='manual';setScale(+e.target.value/100)};$('#fitBtn').onclick=()=>{zoomMode='fit';fitStage()};
$('#panBtn').onclick=()=>{panMode=!panMode;UI.viewport.classList.toggle('panning',panMode)};
let panStart=null;UI.viewport.addEventListener('pointerdown',e=>{if(!(panMode||spacePan))return;panStart={x:e.clientX,y:e.clientY,sl:UI.viewport.scrollLeft,st:UI.viewport.scrollTop};const mv=m=>{UI.viewport.scrollLeft=panStart.sl-(m.clientX-panStart.x);UI.viewport.scrollTop=panStart.st-(m.clientY-panStart.y)};const up=()=>window.removeEventListener('pointermove',mv);window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up,{once:true})});
$('#presentBtn').onclick=()=>showPresentation();$('#nextPresent').onclick=()=>nextPresent(1);$('#prevPresent').onclick=()=>nextPresent(-1);$('#exitPresent').onclick=exitPresent;$('#presentNotesBtn').onclick=()=>$('#presentNotes').classList.toggle('hidden');$('#presentTimerBtn').onclick=toggleTimer;$('#laserBtn').onclick=toggleLaser;
$('#exportBtn').onclick=()=>openModal('#exportModal');$('#exportProjectBtn').onclick=exportProject;$('#importProjectBtn').onclick=()=>$('#importInput').click();$('#importInput').onchange=e=>e.target.files[0]&&importProject(e.target.files[0]);$('#exportHtmlBtn').onclick=()=>download(new Blob([standaloneHTML()],{type:'text/html'}),`${slug(project.name)}-presentation.html`);$('#printPdfBtn').onclick=printPDF;
$('#toggleSlides').onclick=()=>$('#slidesPanel').classList.toggle('open');$('#closeSlides').onclick=closeMobileSlides;
$('#mobileSlidesBtn').onclick=()=>$('#slidesPanel').classList.toggle('open');
$('#mobileEditBtn').onclick=openInspectorMobile;
$('#closeInspectorMobile').onclick=closeInspectorMobile;
$('#mobileFitBtn').onclick=()=>{zoomMode='fit';fitStage()};
$('#toggleLayersBtn').onclick=()=>{$('#layersPanel').classList.remove('hidden');renderLayers()};$('#closeLayers').onclick=()=>$('#layersPanel').classList.add('hidden');$('#selectAllBtn').onclick=()=>{selectedIds=new Set(activeSlide().elements.map(e=>e.id));renderAll()};$('#addCommentBtn').onclick=addComment;$('#saveCommentBtn').onclick=saveComment;$('#clearCommentsBtn').onclick=()=>{activeSlide().comments=[];commit();renderLayers()};
$('#mediaLibraryBtn').onclick=()=>{renderMediaLibrary();openModal('#mediaLibraryModal')};

function bindChange(sel,fn){$(sel).onchange=e=>updateSelected(x=>fn(x,e.target.value,e.target))}
function bindLive(sel,fn){$(sel).oninput=e=>liveSelected(x=>fn(x,e.target.value,e.target));$(sel).onchange=()=>{commit();renderSlides();renderInspector();renderLayers()}}
bindChange('#fontFamily',(x,v)=>x.fontFamily=v);bindChange('#fontSize',(x,v)=>x.fontSize=+v);
bindLive('#fillColor',(x,v)=>{x.fill=v;if(x.gradient)x.gradient.c1=v});bindLive('#elementColor',(x,v)=>x.color=v);
bindChange('#gradientType',(x,v)=>{x.gradient||={};x.gradient.type=v});bindLive('#gradientColor1',(x,v)=>{x.gradient||={};x.gradient.c1=v});bindLive('#gradientColor2',(x,v)=>{x.gradient||={};x.gradient.c2=v});
bindLive('#opacityRange',(x,v)=>x.opacity=+v/100);bindLive('#radiusRange',(x,v)=>x.borderRadius=+v);bindLive('#shadowRange',(x,v)=>x.shadow=+v);bindLive('#borderRange',(x,v)=>{x.borderWidth=+v;x.borderColor=x.color||'#333'});
[['#posX','x'],['#posY','y'],['#sizeW','w'],['#sizeH','h']].forEach(([s,k])=>bindChange(s,(x,v)=>x[k]=+v));bindLive('#rotationRange',(x,v)=>x.rotation=+v);bindLive('#lineHeightRange',(x,v)=>x.lineHeight=+v);bindLive('#letterSpacingRange',(x,v)=>x.letterSpacing=+v);
bindChange('#objectFit',(x,v)=>x.objectFit=v);bindLive('#cropZoom',(x,v)=>x.cropZoom=+v);bindLive('#cropX',(x,v)=>x.cropX=+v);bindLive('#cropY',(x,v)=>x.cropY=+v);bindLive('#brightnessRange',(x,v)=>x.brightness=+v);bindLive('#contrastRange',(x,v)=>x.contrast=+v);bindLive('#saturateRange',(x,v)=>x.saturate=+v);bindLive('#blurRange',(x,v)=>x.blur=+v);bindChange('#maskSelect',(x,v)=>x.mask=v);
bindChange('#animIn',(x,v)=>{x.animation||={};x.animation.in=v});bindChange('#animOut',(x,v)=>{x.animation||={};x.animation.out=v});bindChange('#animDuration',(x,v)=>{x.animation||={};x.animation.duration=+v});bindChange('#animDelay',(x,v)=>{x.animation||={};x.animation.delay=+v});bindChange('#animTrigger',(x,v)=>{x.animation||={};x.animation.trigger=v});
$('#boldBtn').onclick=()=>updateSelected(x=>x.fontWeight=x.fontWeight>=700?400:700);$('#italicBtn').onclick=()=>updateSelected(x=>x.fontStyle=x.fontStyle==='italic'?'normal':'italic');$('#underlineBtn').onclick=()=>updateSelected(x=>x.textDecoration=x.textDecoration==='underline'?'none':'underline');$$('[data-align]').forEach(b=>b.onclick=()=>updateSelected(x=>x.textAlign=b.dataset.align));
$('#autoplayToggle').onchange=e=>updateSelected(x=>x.autoplay=e.target.checked);$('#loopToggle').onchange=e=>updateSelected(x=>x.loop=e.target.checked);$('#volumeRange').oninput=e=>liveSelected(x=>x.volume=+e.target.value);$('#volumeRange').onchange=()=>commit();


// Mobile stability: the canvas is its own interaction surface.
// Prevent Safari/Chrome from translating a drag into page scrolling.
UI.stage.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
UI.stage.addEventListener('gesturestart',e=>e.preventDefault?.(),{passive:false});
window.addEventListener('orientationchange',()=>setTimeout(()=>{if(zoomMode==='fit')fitStage()},180));

document.addEventListener('keydown',e=>{
 if(isPresenting){if(e.key==='ArrowRight'||e.key===' ')nextPresent(1);if(e.key==='ArrowLeft')nextPresent(-1);if(e.key==='Escape')exitPresent();return}
 if(e.code==='Space'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){spacePan=true;UI.viewport.classList.add('panning')}
 if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)||document.activeElement.isContentEditable)return;
 const mod=e.ctrlKey||e.metaKey,key=e.key.toLowerCase();
 if(mod&&key==='z'){e.preventDefault();e.shiftKey?redo():undo();return}
 if(mod&&key==='y'){e.preventDefault();redo();return}
 if(mod&&key==='c'){e.preventDefault();copySelection();return}
 if(mod&&key==='v'){e.preventDefault();pasteSelection();return}
 if(mod&&key==='d'){e.preventDefault();duplicateSelection();return}
 if(mod&&key==='g'){e.preventDefault();e.shiftKey?ungroupSelection():groupSelection();return}
 if(mod&&key==='a'){e.preventDefault();selectedIds=new Set(activeSlide().elements.map(e=>e.id));renderAll();return}
 if(mod&&e.key==='Enter'){e.preventDefault();showPresentation();return}
 if((e.key==='Delete'||e.key==='Backspace')&&selectedIds.size){e.preventDefault();deleteSelected();return}
 const items=selectedElements();if(items.length&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const step=e.shiftKey?10:1;items.forEach(x=>{if(e.key==='ArrowLeft')x.x-=step;if(e.key==='ArrowRight')x.x+=step;if(e.key==='ArrowUp')x.y-=step;if(e.key==='ArrowDown')x.y+=step});commit();renderStage();renderSlides();renderInspector()}
});
document.addEventListener('keyup',e=>{if(e.code==='Space'){spacePan=false;UI.viewport.classList.toggle('panning',panMode)}});

renderTemplates();renderIcons();renderAll();history=[JSON.stringify(project)];setTimeout(fitStage,50);
// Stable build deliberately disables the old offline cache.
if('serviceWorker' in navigator){
 navigator.serviceWorker.getRegistrations().then(rs=>Promise.all(rs.map(r=>r.unregister()))).catch(()=>{});
}
if('caches' in window){
 caches.keys().then(keys=>Promise.all(keys.filter(k=>k.toLowerCase().includes('slidebloom')).map(k=>caches.delete(k)))).catch(()=>{});
}
})();
