
(() => {
'use strict';
const APP_VERSION='6.7.2';
const W=1280,H=720,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const uid=p=>`${p}_${Math.random().toString(36).slice(2,9)}_${Date.now().toString(36).slice(-5)}`;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),deep=o=>JSON.parse(JSON.stringify(o));
const STORE=(()=>{try{const k='__slidebloom_probe__';localStorage.setItem(k,'1');localStorage.removeItem(k);return localStorage}catch{return{getItem(){return null},setItem(){},removeItem(){},clear(){}}}})();
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const elmap={sticker:'Sticker',compound:'Pathfinder',title:'Titel',text:'Text',rect:'Rechteck',circle:'Kreis',triangle:'Dreieck',star:'Stern',diamond:'Diamant',hexagon:'Hexagon',heart:'Herz',capsule:'Kapsel',polygon:'Polygon',speechbubble:'Sprechblase',burst:'Burst',line:'Linie',arrow:'Pfeil',badge:'Badge',image:'Bild',svg:'SVG',video:'Video/GIF',audio:'Audio',chart:'Diagramm',table:'Tabelle',icon:'Icon',drawing:'Zeichnung',group:'Gruppe'};

const UI={
 stage:$('#stage'),shell:$('#stageShell'),viewport:$('#stageViewport'),list:$('#slideList'),
 inspector:$('#inspector'),empty:$('#inspectorEmpty'),content:$('#inspectorContent'),
 notes:$('#speakerNotes'),toast:$('#toast'),selectionBox:$('#selectionBox'),guideV:$('#guideV'),guideH:$('#guideH'),
 presentation:$('#presentation'),pstage:$('#presentationStage'),timeline:$('#timelinePanel')
};

let mediaStore=[];
let library=loadLibrary(); library.customFonts ||= [];
let projectRegistry=loadProjectRegistry();
let uiAccent=STORE.getItem('slidebloom_v6_ui_accent')||'#ef9e9c';
let appSettings=loadAppSettings();
let storyRailUploads=[];
let pendingTemplateType='slide';
let project=loadProject()||createDemo(),scale=.85,zoomMode='fit',selectedIds=new Set(),history=[],future=[],isRestoring=false;
let snap=true,showGrid=false,showGuides=true,drawMode=null,drawSettings={mode:'freehand',stroke:'#473a34',fill:'#f6d9d2',width:5,smoothing:58,fillEnabled:false},panMode=false,spacePan=false,clipboard=[],styleClipboard=null,presentIndex=0,isPresenting=false;
let timerStart=null,timerHandle=null,laserMode=false,timelineScale=90,playheadTime=0;

project.activeSlideId ||= project.slides[0]?.id;
function defaultSlide(){return{id:uid('slide'),name:'Neue Folie',background:appSettings.defaultBg||'#fffdf8',transition:'fade',transitionDuration:.7,notes:'',hidden:false,comments:[],elements:[]}}
function defaultProject(){return{id:uid('project'),createdAt:Date.now(),updatedAt:Date.now(),appVersion:APP_VERSION,name:'Meine Präsentation',theme:{ink:appSettings.defaultInk||'#3c312d',accent:appSettings.defaultAccent||'#ef9e9c',bg:appSettings.defaultBg||'#fffdf8'},activeSlideId:null,slides:[]}}
function textEl(type,id,x,y,w,h,content,size,color,bold=false,align='left'){return{id:id||uid('morph'),type,x,y,w,h,rotation:0,opacity:1,z:1,locked:false,hidden:false,content,fill:'transparent',color,borderRadius:0,shadow:0,borderWidth:0,borderColor:'#000000',fontFamily:'Nunito',fontSize:size,fontWeight:bold?700:400,fontStyle:'normal',textDecoration:'none',textAlign:align,lineHeight:1.12,letterSpacing:0,gradient:{type:'none',c1:'#ffffff',c2:'#ef9e9c'},animation:{in:'fade',out:'none',duration:.6,delay:0,trigger:'auto'}}}
function shapeEl(type,id,x,y,w,h,fill,radius=18){return{id:id||uid('morph'),type,x,y,w,h,rotation:0,opacity:1,z:1,locked:false,hidden:false,content:'',fill,color:'#3c312d',borderRadius:radius,shadow:0,borderWidth:0,borderColor:'#000000',gradient:{type:'none',c1:fill||'#ffffff',c2:'#ef9e9c'},fontFamily:'Nunito',fontSize:28,fontWeight:600,fontStyle:'normal',textDecoration:'none',textAlign:'center',lineHeight:1.12,letterSpacing:0,animation:{in:'pop',out:'none',duration:.5,delay:0,trigger:'auto'}}}
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
function loadProjectRegistry(){try{return JSON.parse(STORE.getItem('slidebloom_v6_projects')||'{}')}catch{return{}}}
function saveProjectRegistry(){try{STORE.setItem('slidebloom_v6_projects',JSON.stringify(projectRegistry))}catch{}}
function saveProject(){try{project.id ||= uid('project');project.createdAt ||= Date.now();project.updatedAt=Date.now();project.appVersion=APP_VERSION;STORE.setItem('slidebloom_v6_project',JSON.stringify(project));STORE.setItem('slidebloom_v6_current_id',project.id);STORE.setItem('slidebloom_v6_media',JSON.stringify(mediaStore));STORE.setItem('slidebloom_v6_library',JSON.stringify(library));projectRegistry[project.id]=deep(project);saveProjectRegistry();}catch{toast('Browser-Speicher voll. Große Videos/Bilder lieber kleiner verwenden.')}$('#saveStatus').textContent='Gespeichert';renderProjects()}
function loadProject(){try{mediaStore=JSON.parse(STORE.getItem('slidebloom_v6_media')||STORE.getItem('slidebloom_v5_media')||STORE.getItem('slidebloom_media_v1')||'[]');let p=JSON.parse(STORE.getItem('slidebloom_v6_project')||STORE.getItem('slidebloom_v5_project')||STORE.getItem('slidebloom_ultimate_v1')||'null');if(!p){const cur=STORE.getItem('slidebloom_v6_current_id');const reg=JSON.parse(STORE.getItem('slidebloom_v6_projects')||'{}');if(cur&&reg&&reg[cur])p=reg[cur]}if(p){p.id ||= uid('project');p.createdAt ||= Date.now();p.updatedAt ||= Date.now()}return p}catch{return null}}
function loadLibrary(){try{const l=JSON.parse(STORE.getItem('slidebloom_v6_library')||STORE.getItem('slidebloom_v5_library')||'null')||{textStyles:[],slideTemplates:[],presentationTemplates:[],customFonts:[]};l.customFonts ||= [];return l}catch{return{textStyles:[],slideTemplates:[],presentationTemplates:[],customFonts:[]}}}
function saveLibrary(){try{STORE.setItem('slidebloom_v6_library',JSON.stringify(library))}catch{}renderTextStyles();renderUserTemplates();renderLibraryManager();renderCustomFonts();refreshFontSelect()}
let saveTimer;function touchSave(){$('#saveStatus').textContent='Speichert …';clearTimeout(saveTimer);saveTimer=setTimeout(saveProject,220)}
function commit(){if(isRestoring)return;history.push(JSON.stringify(project));if(history.length>80)history.shift();future=[];touchSave()}
function undo(){if(history.length<2)return;future.push(history.pop());restore(history.at(-1))}
function redo(){if(!future.length)return;const s=future.pop();history.push(s);restore(s)}
function restore(s){isRestoring=true;project=JSON.parse(s);selectedIds.clear();renderAll();isRestoring=false;touchSave()}
function renderAll(){$('#projectName').value=project.name;renderSlides();renderStage();renderInspector();syncSlideControls();renderLayers();renderTimeline();renderTextStyles();renderUserTemplates();syncMobileSelectionUI();refreshFontSelect();applyUIAccent(uiAccent)}

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
function loadAppSettings(){try{return{uiAccent:STORE.getItem('slidebloom_v6_ui_accent')||'#ef9e9c',defaultInk:STORE.getItem('slidebloom_v6_default_ink')||'#3c312d',defaultAccent:STORE.getItem('slidebloom_v6_default_accent')||'#ef9e9c',defaultBg:STORE.getItem('slidebloom_v6_default_bg')||'#fffdf8'}}catch{return{uiAccent:'#ef9e9c',defaultInk:'#3c312d',defaultAccent:'#ef9e9c',defaultBg:'#fffdf8'}}}
function saveAppSettings(){STORE.setItem('slidebloom_v6_default_ink',appSettings.defaultInk);STORE.setItem('slidebloom_v6_default_accent',appSettings.defaultAccent);STORE.setItem('slidebloom_v6_default_bg',appSettings.defaultBg);applyUIAccent(appSettings.uiAccent)}
function regularPoints(cx,cy,r,n,start=-Math.PI/2){return[...Array(n)].map((_,i)=>{const a=start+i*2*Math.PI/n;return{x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r}})}
function starPointArray(cx,cy,ro,ri,n=5){const pts=[];for(let i=0;i<n*2;i++){const a=-Math.PI/2+i*Math.PI/n,r=i%2?ri:ro;pts.push({x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r})}return pts}
function roundedPath(points,round=0){if(!points?.length)return'';if(round<=0)return points.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join('')+'Z';const n=points.length;let d='';for(let i=0;i<n;i++){const p0=points[(i-1+n)%n],p1=points[i],p2=points[(i+1)%n];const v1={x:p0.x-p1.x,y:p0.y-p1.y},v2={x:p2.x-p1.x,y:p2.y-p1.y};const l1=Math.hypot(v1.x,v1.y)||1,l2=Math.hypot(v2.x,v2.y)||1;const r=Math.min(round,l1/2,l2/2);const s={x:p1.x+v1.x/l1*r,y:p1.y+v1.y/l1*r};const e={x:p1.x+v2.x/l2*r,y:p1.y+v2.y/l2*r};if(i===0)d=`M${s.x} ${s.y}`;else d+=`L${s.x} ${s.y}`;d+=`Q${p1.x} ${p1.y} ${e.x} ${e.y}`}return d+'Z'}
function svgPaint(e,id){const g=e.gradient||{};if(g.type==='linear')return{defs:`<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${g.c1||e.fill||'#fff'}"/><stop offset="100%" stop-color="${g.c2||e.fill||'#ef9e9c'}"/></linearGradient></defs>`,fill:`url(#${id})`};if(g.type==='radial')return{defs:`<defs><radialGradient id="${id}"><stop offset="0%" stop-color="${g.c1||e.fill||'#fff'}"/><stop offset="100%" stop-color="${g.c2||e.fill||'#ef9e9c'}"/></radialGradient></defs>`,fill:`url(#${id})`};return{defs:'',fill:e.fill||'transparent'}}
function shapeSvgMarkup(e){const pid='g_'+String(e.id||uid('g')).replace(/[^a-z0-9]/gi,'');const paint=svgPaint(e,pid);const round=e.shapeRoundness||0;let body='';if(e.type==='triangle'){body=`<path d="${roundedPath([{x:50,y:4},{x:96,y:94},{x:4,y:94}],round)}" fill="${paint.fill}"/>`}else if(e.type==='star'){const pts=starPointArray(50,50,45,45*(e.starInnerRatio||0.42),e.starPoints||5);body=`<path d="${roundedPath(pts,round)}" fill="${paint.fill}"/>`}else if(e.type==='diamond'){body=`<path d="${roundedPath([{x:50,y:4},{x:96,y:50},{x:50,y:96},{x:4,y:50}],round)}" fill="${paint.fill}"/>`}else if(e.type==='hexagon'){body=`<path d="${roundedPath([{x:25,y:8},{x:75,y:8},{x:96,y:50},{x:75,y:92},{x:25,y:92},{x:4,y:50}],round)}" fill="${paint.fill}"/>`}else if(e.type==='heart'){body=`<path d="M50 90 18 61C2 46 3 21 23 14c12-4 22 2 27 11 5-9 15-15 27-11 20 7 21 32 5 47Z" fill="${paint.fill}"/>`}else if(e.type==='polygon'){const pts=regularPoints(50,50,46,Math.max(3,Math.min(12,e.corners||6)));body=`<path d="${roundedPath(pts,round)}" fill="${paint.fill}"/>`}else if(e.type==='speechbubble'){body=`<path d="M21 10h97c12 0 22 10 22 22v28c0 12-10 22-22 22H74L43 97l8-15H21C9 82 0 72 0 60V32C0 20 9 10 21 10Z" fill="${paint.fill}"/>`}else if(e.type==='burst'){body=`<path d="${roundedPath([{x:50,y:2},{x:60,y:18},{x:79,y:9},{x:81,y:29},{x:98,y:32},{x:88,y:50},{x:98,y:68},{x:81,y:71},{x:79,y:91},{x:60,y:82},{x:50,y:98},{x:40,y:82},{x:21,y:91},{x:19,y:71},{x:2,y:68},{x:12,y:50},{x:2,y:32},{x:19,y:29},{x:21,y:9},{x:40,y:18}],round)}" fill="${paint.fill}"/>`}return`<svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">${paint.defs}${body}</svg>`}

function applyBox(d,e){
 const soft=e.shadow||0,softX=e.shadowX??0,softY=e.shadowY??Math.max(4,soft/2),softOpacity=(e.shadowOpacity??18)/100;
 const hardX=e.shadowHardX??0,hardY=e.shadowHardY??0,hardOpacity=(e.shadowHardOpacity??0)/100,shadowParts=[];
 if(soft)shadowParts.push(`${softX}px ${softY}px ${soft*1.6}px rgba(60,49,45,${softOpacity})`);
 if(hardOpacity>0&&(hardX||hardY))shadowParts.push(`${hardX}px ${hardY}px 0 rgba(60,49,45,${hardOpacity})`);
 Object.assign(d.style,{left:e.x+'px',top:e.y+'px',width:e.w+'px',height:e.h+'px',transform:`rotate(${e.rotation||0}deg)`,opacity:e.opacity??1,zIndex:e.z||1,background:backgroundStyle(e),borderRadius:(e.type==='circle'?'50%':e.type==='capsule'?'999px':(e.borderRadius||0)+'px'),boxShadow:shadowParts.join(',')||'none',border:(e.borderWidth||0)?`${e.borderWidth}px solid ${e.borderColor||e.color||'#333'}`:'none'});
 if(['triangle','star','diamond','hexagon','heart','polygon','speechbubble','burst'].includes(e.type))d.dataset.shape='true';else delete d.dataset.shape
}
function mediaFilter(e){return`brightness(${e.brightness??100}%) contrast(${e.contrast??100}%) saturate(${e.saturate??100}%) blur(${e.blur??0}px)`}
function maskStyle(e,node){const m=e.mask||'none';if(m==='circle')node.style.clipPath='circle(50% at 50% 50%)';else if(m==='rounded')node.style.clipPath='inset(0 round 14%)';else if(m==='hex')node.style.clipPath='polygon(25% 6.7%,75% 6.7%,100% 50%,75% 93.3%,25% 93.3%,0 50%)';else if(m==='blob')node.style.clipPath='polygon(50% 0%,80% 8%,100% 35%,93% 72%,67% 100%,28% 92%,4% 66%,0% 31%,21% 8%)';else if(m==='star')node.style.clipPath='polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)';else if(m==='heart')node.style.clipPath='path("M50 90 C20 70 0 45 15 20 C28 0 48 6 50 20 C52 6 72 0 85 20 C100 45 80 70 50 90 Z")';else if(m==='diamond')node.style.clipPath='polygon(50% 0%,100% 50%,50% 100%,0 50%)';else if(m==='speech')node.style.clipPath='polygon(8% 7%,92% 7%,92% 72%,56% 72%,35% 95%,39% 72%,8% 72%)';else if(m==='polygon'){const n=Math.max(3,Math.min(12,e.corners||6));const pts=[...Array(n)].map((_,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;return `${50+46*Math.cos(a)}% ${50+46*Math.sin(a)}%`}).join(',');node.style.clipPath=`polygon(${pts})`}else node.style.clipPath='none'}
function shapeClipPath(e){
 if(e.type==='circle')return 'circle(50% at 50% 50%)';
 if(e.type==='capsule')return 'inset(0 round 999px)';
 if(e.type==='star'){const pts=starPointArray(50,50,48,48*(e.starInnerRatio||0.42),e.starPoints||5);return 'polygon('+pts.map(p=>`${p.x}% ${p.y}%`).join(',')+')'}
 if(e.type==='heart')return 'polygon(50% 94%,15% 61%,7% 44%,10% 25%,24% 14%,39% 17%,50% 31%,61% 17%,76% 14%,90% 25%,93% 44%,85% 61%)';
 if(e.type==='diamond')return 'polygon(50% 0%,100% 50%,50% 100%,0 50%)';
 if(e.type==='triangle')return 'polygon(50% 0%,100% 100%,0 100%)';
 if(e.type==='speechbubble')return 'polygon(7% 8%,93% 8%,100% 20%,100% 70%,90% 82%,56% 82%,34% 100%,39% 82%,9% 82%,0 70%,0 20%)';
 if(e.type==='burst')return 'polygon(50% 0%,60% 18%,79% 9%,81% 29%,100% 32%,88% 50%,100% 68%,81% 71%,79% 91%,60% 82%,50% 100%,40% 82%,21% 91%,19% 71%,0 68%,12% 50%,0 32%,19% 29%,21% 9%,40% 18%)';
 if(e.type==='polygon'){const n=Math.max(3,Math.min(12,e.corners||6));return 'polygon('+[...Array(n)].map((_,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;return `${50+46*Math.cos(a)}% ${50+46*Math.sin(a)}%`}).join(',')+')'}
 return e.type==='rect'?'inset(0 round '+(e.borderRadius||0)+'px)':'none'
}
function applyFeatherContent(c,e){const feather=e.feather||0;if(!c)return;if(feather>0){const v=Math.max(38,100-feather*1.35);const mask=`radial-gradient(ellipse at center,#000 0%,#000 ${v}%,transparent 100%)`;c.style.maskImage=mask;c.style.webkitMaskImage=mask}else{c.style.maskImage='none';c.style.webkitMaskImage='none'}}
function styleText(c,e){Object.assign(c.style,{color:e.color||'#3c312d',fontFamily:e.fontFamily||'Nunito',fontSize:(e.fontSize||28)+'px',fontWeight:e.fontWeight||400,fontStyle:e.fontStyle||'normal',textDecoration:e.textDecoration||'none',textAlign:e.textAlign||'left',justifyContent:e.textAlign==='center'?'center':e.textAlign==='right'?'flex-end':'flex-start',padding:e.type==='badge'?'12px 20px':(e.textBgEnabled?'4px 10px':'0'),lineHeight:e.lineHeight||1.12,letterSpacing:(e.letterSpacing||0)+'px',background:e.textBgEnabled?(e.textBgColor||'#fff2a8'):'transparent',borderRadius:e.textBgEnabled?'10px':'0'})}

function timelineStickerHTML(e,vertical=false){
 const n=Math.max(2,Math.min(12,+(e.timelinePoints||4))),start=Number.isFinite(+e.timelineStart)?+e.timelineStart:0,step=Number.isFinite(+e.timelineStep)?+e.timelineStep:1,unit=esc(e.timelineUnit||'Jahre');
 const raw=String(e.timelineLabels||'').split(/\n|\|/).map(x=>x.trim()).filter(Boolean),col=e.stickerColor||'#fff8ef',acc=e.stickerAccent||project.theme.accent||'#ef9e9c';
 if(vertical){const H=460,x=84,top=42,bottom=392,gap=(bottom-top)/(n-1);let svg='';for(let i=0;i<n-1;i++){const y1=top+i*gap,y2=top+(i+1)*gap;svg+=`<line x1="${x}" y1="${y1+16}" x2="${x}" y2="${y2-16}" stroke="${acc}" stroke-width="7" stroke-linecap="round"/>`}for(let i=0;i<n;i++){const y=top+i*gap,label=raw[i]||`${start+i*step} ${unit}`;svg+=`<circle cx="${x}" cy="${y}" r="15" fill="${col}" stroke="${acc}" stroke-width="4"/><text x="112" y="${y+5}" font-size="15" fill="#5a4a44">${esc(label)}</text>`}return`<div class="sticker-root sticker-timeline-v" style="--sticker-color:${col};--sticker-accent:${acc}"><svg viewBox="0 0 220 460">${svg}</svg></div>`}
 const Wd=520,y=54,left=42,right=478,gap=(right-left)/(n-1);let svg='';for(let i=0;i<n-1;i++){const x1=left+i*gap,x2=left+(i+1)*gap;svg+=`<line x1="${x1+16}" y1="${y}" x2="${x2-16}" y2="${y}" stroke="${acc}" stroke-width="7" stroke-linecap="round"/>`}for(let i=0;i<n;i++){const x=left+i*gap,label=raw[i]||`${start+i*step} ${unit}`;svg+=`<circle cx="${x}" cy="${y}" r="15" fill="${col}" stroke="${acc}" stroke-width="4"/><text x="${x}" y="95" text-anchor="middle" font-size="13" fill="#5a4a44">${esc(label)}</text>`}return`<div class="sticker-root sticker-timeline-h" style="--sticker-color:${col};--sticker-accent:${acc}"><svg viewBox="0 0 520 125">${svg}</svg></div>`
}
function stickerHTML(e){
 const kind=e.stickerKind||'sticky',txt=esc(e.content||''),col=e.stickerColor||e.fill||'#fff8ef',acc=e.stickerAccent||'#e8d7a7',style=`--sticker-color:${col};--sticker-accent:${acc};`;
 if(kind==='notebook')return`<div class="sticker-root sticker-notebook" style="${style}"><div class="notepad-top"></div><div class="rings"></div><div class="notepad-heart">♡</div><div class="sticker-text" style="transform:translate(${e.stickerTextX||0}px,${e.stickerTextY||0}px)">${txt||'Meine Notizen\n• Punkt 1\n• Punkt 2'}</div></div>`;
 if(kind==='graph')return`<div class="sticker-root sticker-graph" style="${style}"><div class="sticker-text">${txt||'Karo-Zettel'}</div></div>`;
 if(kind==='lined')return`<div class="sticker-root sticker-lined" style="${style}"><div class="sticker-text">${txt||'Linierter Zettel'}</div></div>`;
 if(kind==='graph_torn')return`<div class="sticker-root sticker-graph-torn" style="${style}"><div class="sticker-text">${txt||'Gerissener Karo-Zettel'}</div></div>`;
 if(kind==='lined_torn')return`<div class="sticker-root sticker-lined-torn" style="${style}"><div class="sticker-text">${txt||'Gerissener Linien-Zettel'}</div></div>`;
 if(kind==='sticky')return`<div class="sticker-root sticker-sticky" style="${style}"><div class="sticker-text">${txt||'Merken ✦'}</div></div>`;
 if(kind==='postit_square')return`<div class="sticker-root sticker-postit" style="${style}"><div class="sticker-text">${txt||'Post-it'}</div></div>`;
 if(kind==='postit_round')return`<div class="sticker-root sticker-roundpostit" style="${style}"><div class="sticker-text">${txt||'Idea'}</div></div>`;
 if(kind==='torn')return`<div class="sticker-root sticker-torn" style="${style}"><div class="sticker-text">${txt||'wichtige Info'}</div></div>`;
 if(kind==='torn_memo')return`<div class="sticker-root sticker-tornmemo" style="${style}"><div class="sticker-text">${txt||'Memo'}</div></div>`;
 if(kind==='polaroid'){const im=e.imageSrc?`<img src="${e.imageSrc}" style="--photo-zoom:${(e.cropZoom||100)/100};--photo-x:${e.cropX??50}%;--photo-y:${e.cropY??50}%">`:'<span>Bild hinzufügen</span>';return`<div class="sticker-root sticker-polaroid" style="${style}"><div class="photo">${im}</div><div class="caption">${txt||'Moment ♡'}</div></div>`}
 if(kind==='polaroid_stack'){const im=e.imageSrc?`<img src="${e.imageSrc}" style="--photo-zoom:${(e.cropZoom||100)/100};--photo-x:${e.cropX??50}%;--photo-y:${e.cropY??50}%">`:'<span>Bild hinzufügen</span>';return`<div class="sticker-root sticker-polaroid-stack" style="${style}"><div class="photo">${im}</div><div class="caption">${txt||'Memories'}</div></div>`}
 if(kind==='frame_window')return`<div class="sticker-root sticker-frame-window" style="${style}"></div>`;
 if(kind==='frame_blob')return`<div class="sticker-root sticker-frame-blob" style="${style}"></div>`;
 if(kind==='frame_scallop')return`<div class="sticker-root sticker-frame-scallop" style="${style}"></div>`;
 if(kind==='tape')return`<div class="sticker-root sticker-tape" style="${style}"></div>`;
 if(kind==='washi')return`<div class="sticker-root sticker-washi" style="${style}"></div>`;
 if(kind==='paperclip')return`<div class="sticker-root sticker-paperclip" style="${style}"><svg viewBox="0 0 100 180"><path d="M63 28C78 28 88 40 88 55c0 11-4 19-10 27L46 122c-14 18-44 8-44-18 0-10 3-18 11-28l33-42c10-12 30-4 30 13 0 7-2 13-7 19l-31 39c-4 5-11 6-15 2-5-4-5-10 0-16l27-34" fill="none" stroke="${acc}" stroke-width="8" stroke-linecap="round"/></svg></div>`;
 if(kind==='binder')return`<div class="sticker-root sticker-binder" style="${style}"><svg viewBox="0 0 160 150"><path d="M47 62h66l-8 60H55z" fill="${acc}" stroke="#5c514c" stroke-width="4" stroke-linejoin="round"/><path d="M61 60V45c0-14 8-23 19-23s19 9 19 23v15" fill="none" stroke="#5c514c" stroke-width="6" stroke-linecap="round"/><path d="M50 62c-10-4-16-12-17-21M110 62c10-4 16-12 17-21" fill="none" stroke="#5c514c" stroke-width="4" stroke-linecap="round"/><path d="M59 76h42" stroke="#fff9" stroke-width="5" stroke-linecap="round"/></svg></div>`;
 if(kind==='pin')return`<div class="sticker-root sticker-pin" style="${style}"><svg viewBox="0 0 130 170"><path d="M42 42c0-18 12-31 29-31s29 13 29 31-13 31-29 31-29-13-29-31Z" fill="${acc}" stroke="#725b56" stroke-width="4"/><circle cx="61" cy="31" r="8" fill="#fff" opacity=".5"/><path d="M71 70v67" stroke="#8b8b8b" stroke-width="6" stroke-linecap="round"/><path d="M65 137h12l-6 18z" fill="#696969"/></svg></div>`;
 if(kind==='pushpin')return`<div class="sticker-root sticker-pin" style="${style}"><svg viewBox="0 0 130 170"><path d="M40 45h62l-9 30H49z" fill="${col}" stroke="#725b56" stroke-width="4" stroke-linejoin="round"/><rect x="50" y="20" width="42" height="28" rx="14" fill="${acc}" stroke="#725b56" stroke-width="4"/><path d="M71 74v67" stroke="#8a8a8a" stroke-width="6" stroke-linecap="round"/><path d="M65 141h12l-6 17z" fill="#676767"/></svg></div>`;
 if(kind==='checklist')return`<div class="sticker-root sticker-checklist" style="${style}"><div class="sticker-text">${txt||'Checkliste'}</div><ul><li><i></i><span>Punkt 1</span></li><li><i></i><span>Punkt 2</span></li><li><i></i><span>Punkt 3</span></li></ul></div>`;
 if(kind==='ruler'||kind==='timeline_scale')return timelineStickerHTML(e,false);
 if(kind==='foldertab')return`<div class="sticker-root sticker-foldertab" style="${style}"><div class="sticker-text">${txt||'Kapitel'}</div></div>`;
 if(kind==='speech')return`<div class="sticker-root sticker-speech" style="${style}"><svg viewBox="0 0 320 210" preserveAspectRatio="none" width="100%" height="100%" style="position:absolute;inset:0"><path d="M38 18h240c22 0 38 16 38 38v72c0 22-16 38-38 38H146l-34 26 8-26H38c-22 0-38-16-38-38V56c0-22 16-38 38-38Z" fill="${col}" stroke="${acc}" stroke-width="5"/></svg><div class="sticker-text" style="position:absolute;inset:36px 32px 48px;transform:translate(${e.stickerTextX||0}px,${e.stickerTextY||0}px);display:grid;place-items:center;text-align:center">${txt||'Wichtige Definition'}</div></div>`;
 if(kind==='label')return`<div class="sticker-root sticker-label" style="${style}"><div class="sticker-text">${txt||'subtitle'}</div></div>`;
 if(kind==='highlight')return`<div class="sticker-root sticker-highlight" style="${style}"><div class="sticker-text">${txt||'highlight'}</div></div>`;
 if(kind==='sparkle')return`<div class="sticker-root sticker-sparkle" style="${style}">✦ ✧</div>`;
 if(kind==='sparklegif')return`<div class="sticker-root sticker-sparklegif" style="${style}"><svg viewBox="0 0 260 160"><g class="twinkle1" fill="${acc}" stroke="#5a4a44" stroke-width="4"><path d="M55 22 61 45 84 51 61 57 55 80 49 57 26 51 49 45Z"/></g><g class="twinkle2" fill="${col}" stroke="#5a4a44" stroke-width="4"><path d="M171 34 176 50 192 55 176 60 171 76 166 60 150 55 166 50Z"/></g><g class="twinkle3" fill="${acc}" stroke="#5a4a44" stroke-width="4"><path d="M117 92 122 108 138 113 122 118 117 134 112 118 96 113 112 108Z"/></g></svg></div>`;
 if(kind==='heartgif')return`<div class="sticker-root sticker-heartgif" style="${style}"><svg viewBox="0 0 260 160"><path class="heart1" d="M64 116C22 86 22 49 44 36c16-9 30 1 37 12 7-11 21-21 37-12 22 13 22 50-20 80l-17 12Z" fill="${col}" stroke="#5a4a44" stroke-width="5" stroke-linejoin="round"/><path class="heart2" d="M141 84c-23-16-24-34-10-43 10-6 19 1 24 8 5-7 14-14 24-8 14 9 14 27-10 43l-14 10Z" fill="${acc}" stroke="#5a4a44" stroke-width="5" stroke-linejoin="round"/><path class="heart3" d="M182 130c-17-11-17-25-8-31 7-4 13 1 16 6 3-5 9-10 16-6 9 6 9 20-8 31l-8 6Z" fill="${col}" stroke="#5a4a44" stroke-width="4" stroke-linejoin="round"/></svg></div>`;
 if(kind==='leaf')return`<div class="sticker-root sticker-leaf" style="${style}"><svg viewBox="0 0 180 180"><path d="M92 154C90 111 103 71 137 35" fill="none" stroke="${acc}" stroke-width="7" stroke-linecap="round"/><path d="M106 96c25-5 38-19 40-38-22 0-37 11-40 38ZM84 124c-21-5-34-18-36-35 20 0 33 10 36 35ZM112 70c-16-4-25-14-27-28 16 0 25 8 27 28Z" fill="${col}" stroke="#5a4a44" stroke-width="3.5" stroke-linejoin="round"/></svg></div>`;
 if(kind==='tab')return`<div class="sticker-root sticker-tab" style="${style}"><div class="sticker-text">${txt||'Kapitel'}</div></div>`;
 if(kind==='bookmark')return`<div class="sticker-root sticker-bookmark" style="${style}">${txt||'01'}</div>`;
 if(kind==='stamp')return`<div class="sticker-root sticker-stamp" style="${style}"><div class="sticker-text">${txt||'STUDY'}</div></div>`;
 if(kind==='cloud')return`<div class="sticker-root sticker-cloud" style="${style}"><svg viewBox="0 0 320 220"><path d="M73 176h163c42 0 72-27 72-60 0-30-24-52-54-55-4-39-36-68-77-68-34 0-63 17-75 43-7-3-15-5-24-5-31 0-57 23-60 53-22 7-37 26-37 49 0 24 18 43 41 43Z" fill="${col}" stroke="#5a4a44" stroke-width="6" stroke-linejoin="round"/></svg><div class="sticker-text" style="position:absolute;left:44px;right:44px;top:62px;bottom:44px;transform:translate(${e.stickerTextX||0}px,${e.stickerTextY||0}px);display:grid;place-items:center;text-align:center">${txt||'Merksatz'}</div></div>`;
 if(kind==='bow')return`<div class="sticker-root sticker-bow" style="${style}"><svg viewBox="0 0 220 170"><path d="M103 78C72 51 42 39 24 51 10 60 14 88 34 103 52 117 76 108 104 88Z" fill="${col}" stroke="#5a4a44" stroke-width="4"/><path d="M117 78c31-27 61-39 79-27 14 9 10 37-10 52-18 14-42 5-70-15Z" fill="${acc}" stroke="#5a4a44" stroke-width="4"/><ellipse cx="110" cy="79" rx="20" ry="15" fill="#fffaf5" stroke="#5a4a44" stroke-width="4"/><path d="M96 92c-7 23-24 44-44 55l34-10 15-27ZM124 92c7 23 24 44 44 55l-34-10-15-27Z" fill="${col}" stroke="#5a4a44" stroke-width="4" stroke-linejoin="round"/></svg></div>`;
 if(kind==='daisy')return`<div class="sticker-root sticker-daisy" style="${style}"><svg viewBox="0 0 180 180"><g fill="#fffef8" stroke="#5a4a44" stroke-width="3.5">${[0,45,90,135,180,225,270,315].map(a=>{const r=a*Math.PI/180,cx=90+Math.cos(r)*39,cy=90+Math.sin(r)*39;return `<ellipse cx="${cx}" cy="${cy}" rx="15" ry="25" transform="rotate(${a} ${cx} ${cy})"/>`}).join('')}</g><circle cx="90" cy="90" r="23" fill="${acc}" stroke="#5a4a44" stroke-width="3.5"/></svg></div>`;
 if(kind==='arrowdoodle')return`<div class="sticker-root sticker-arrowdoodle" style="${style}">➜</div>`;
 if(kind==='scribblecircle')return`<div class="sticker-root sticker-scribblecircle" style="${style}"><svg viewBox="0 0 220 220"><path d="M32 115c-7-46 25-87 76-92 52-5 94 30 99 77 5 48-29 89-80 96-49 7-88-23-95-81Z" fill="none" stroke="${acc}" stroke-width="10" stroke-linecap="round" stroke-dasharray="8 10"/></svg></div>`;
 if(kind==='corner_tape')return`<div class="sticker-root sticker-corners" style="${style}"><svg viewBox="0 0 280 180"><path d="M20 22h72v24H20z" fill="${acc}" opacity=".72" transform="rotate(-12 56 34)"/><path d="M188 134h72v24h-72z" fill="${acc}" opacity=".72" transform="rotate(10 224 146)"/><rect x="56" y="34" width="168" height="112" rx="18" fill="${col}" stroke="#5a4a44" stroke-width="4" stroke-dasharray="3 8"/></svg></div>`;
 if(kind==='timeline_horizontal')return timelineStickerHTML(e,false);
 if(kind==='timeline_vertical')return timelineStickerHTML(e,true);
 if(kind==='milestone_card')return`<div class="sticker-root sticker-milestonecard" style="${style}"><svg viewBox="0 0 250 170"><rect x="12" y="22" width="226" height="136" rx="24" fill="${col}" stroke="#5a4a44" stroke-width="4"/><circle cx="44" cy="44" r="22" fill="${acc}" stroke="#5a4a44" stroke-width="4"/><text x="44" y="50" text-anchor="middle" font-size="18" fill="#5a4a44">${esc(e.milestoneNumber||'01')}</text></svg><div class="sticker-text">${txt||'Meilenstein'}</div></div>`;
 if(kind==='starburst')return`<div class="sticker-root sticker-starburst" style="${style}"><svg viewBox="0 0 180 180"><path d="M90 8 104 34 134 22 131 52 161 56 143 82 167 102 137 111 145 140 115 136 106 164 84 144 60 162 54 133 24 136 33 108 6 92 34 77 22 48 51 47 55 18 79 33Z" fill="${col}" stroke="#5a4a44" stroke-width="5"/></svg></div>`;
 if(kind==='squiggle')return`<div class="sticker-root sticker-squiggle" style="${style}">〰</div>`;
 return`<div class="sticker-root sticker-sticky" style="${style}"><div class="sticker-text">${txt}</div></div>`
}

function renderElement(e,editable=false){
 const d=document.createElement('div');d.className='el'+(editable&&selectedIds.has(e.id)?(selectedIds.size>1?' multi-selected':' selected'):'')+(e.locked?' locked':'')+(e.hidden?' hidden-el':'');d.dataset.id=e.id;applyBox(d,e);
 let c=document.createElement('div');c.className='content';
 if(e.type==='sticker'){c.innerHTML=stickerHTML(e);d.style.background='transparent';d.style.border='none'}
 else if(e.type==='compound'){c.innerHTML=compoundSVG(e);c.classList.add('compound-svg');d.style.background='transparent';d.style.border='none'}
 else if(e.shapeImageSrc&&['rect','circle','triangle','star','diamond','heart','polygon','capsule','speechbubble','burst'].includes(e.type)){const im=document.createElement('img');im.className='shape-media';im.src=e.shapeImageSrc;im.draggable=false;im.style.objectPosition=`${e.shapeImageX??50}% ${e.shapeImageY??50}%`;im.style.transform=`scale(${(e.shapeImageZoom??100)/100})`;c.style.clipPath=shapeClipPath(e);c.style.overflow='hidden';c.appendChild(im);d.style.background='transparent';d.style.border='none'}
 else if(e.type==='image'||e.type==='video'){
   let media;if(e.type==='video'&&!(e.src||'').startsWith('data:image/gif')){media=document.createElement('video');media.src=e.src||'';media.muted=e.muted??true;media.autoplay=!!e.autoplay;media.loop=!!e.loop;media.playsInline=true;media.volume=(e.volume??100)/100}
   else{media=document.createElement('img');media.src=e.src||'';media.draggable=false}
   media.className='media-content';media.style.objectFit=e.objectFit||'cover';media.style.objectPosition=`${e.cropX??50}% ${e.cropY??50}%`;media.style.transform=`scale(${(e.cropZoom??100)/100})`;media.style.filter=mediaFilter(e);maskStyle(e,media);c.appendChild(media)
 } else if(e.type==='audio'){
   c.innerHTML=`<div style="width:100%;height:100%;display:grid;place-items:center;border-radius:18px;background:#fff4f2;border:1px solid #eadbd4"><div style="font-size:42px">♫</div><small>${esc(e.name||'Audio')}</small></div>`;
 } else if(e.type==='svg'){c.innerHTML=e.svg||'';c.classList.add('svg-content');const svg=c.querySelector('svg');if(svg){svg.style.width='100%';svg.style.height='100%'}}
 else if(e.type==='chart')c.innerHTML=chartSVG(e);
 else if(e.type==='table')c.innerHTML=tableHTML(e);
 else if(e.type==='drawing'){c.innerHTML=`<svg class="drawing-svg" viewBox="0 0 ${e.w} ${e.h}" preserveAspectRatio="none"><path d="${e.path||''}" fill="${e.pathFillEnabled?(e.fill||'transparent'):'none'}" stroke="${e.color||'#333'}" stroke-width="${e.strokeWidth||5}" stroke-linecap="${e.lineCap||'round'}" stroke-linejoin="round"/></svg>`;d.style.background='transparent';d.style.border='none'}
 else if(['triangle','star','diamond','hexagon','heart','polygon','speechbubble','burst'].includes(e.type)){c.innerHTML=shapeSvgMarkup(e);d.style.background='transparent';d.style.border='none'}
 else if(e.type==='line'||e.type==='arrow'){c.style.position='relative';const ln=document.createElement('div');ln.style.cssText=`position:absolute;left:0;right:${e.type==='arrow'?'16px':'0'};top:50%;border-top:${e.strokeWidth||5}px solid ${e.color};`;c.appendChild(ln);if(e.type==='arrow'){const a=document.createElement('div');a.style.cssText=`position:absolute;right:0;top:50%;width:0;height:0;transform:translateY(-50%);border-top:12px solid transparent;border-bottom:12px solid transparent;border-left:18px solid ${e.color};`;c.appendChild(a)}}
 else{c.textContent=e.content||'';styleText(c,e)}
 if((e.feather||0)>0&&['rect','circle','capsule'].includes(e.type)&&!e.shapeImageSrc){c.style.background=backgroundStyle(e);c.style.borderRadius=e.type==='circle'?'50%':e.type==='capsule'?'999px':(e.borderRadius||0)+'px';d.style.background='transparent'}
 d.appendChild(c);applyFeatherContent(c,e);
 if(editable&&!e.locked){
  d.addEventListener('pointerdown',ev=>startMove(ev,e.id));d.addEventListener('contextmenu',ev=>{ev.preventDefault();openContextMenu(ev.clientX,ev.clientY,e.id)})
  d.addEventListener('click',ev=>{ev.stopPropagation();selectElement(e.id,ev.shiftKey||ev.ctrlKey||ev.metaKey);});
  if(['title','text','badge','icon'].includes(e.type)){d.addEventListener('dblclick',ev=>{ev.stopPropagation();c.contentEditable='true';c.focus();selectText(c)});c.addEventListener('blur',()=>{c.contentEditable='false';e.content=c.textContent;commit();renderSlides()});c.addEventListener('keydown',ev=>ev.stopPropagation())}
  if(e.type==='sticker'&&!['tape','washi','paperclip','binder','pin','pushpin','sparkle','sparklegif','heartgif','leaf','ruler','bow','daisy','arrowdoodle','squiggle','frame_window','frame_blob','frame_scallop'].includes(e.stickerKind)){d.addEventListener('dblclick',ev=>{ev.stopPropagation();const t=c.querySelector('.sticker-text,.caption');if(!t)return;t.contentEditable='true';t.focus();selectText(t);t.onblur=()=>{t.contentEditable='false';e.content=t.textContent;commit();renderSlides();renderInspector()}})}
  if(selectedIds.size===1&&selectedIds.has(e.id)){[['br','br'],['bl','bl'],['tr','tr'],['tl','tl']].forEach(([cls,corner])=>{const h=document.createElement('div');h.className=`handle ${cls}`;h.addEventListener('pointerdown',ev=>startResize(ev,e.id,corner));d.appendChild(h)});const r=document.createElement('div');r.className='rotate-handle';r.addEventListener('pointerdown',ev=>startRotate(ev,e.id));d.appendChild(r)}
 }
 return d
}
function renderStage(){
 const s=activeSlide();
 const oldLeft=UI.viewport.scrollLeft,oldTop=UI.viewport.scrollTop;
 UI.stage.style.background=s.background;
 UI.stage.classList.toggle('grid',showGrid);
 UI.stage.innerHTML='';
 [...s.elements].sort((a,b)=>(a.z||0)-(b.z||0)).forEach(e=>UI.stage.appendChild(renderElement(e,true)));
 requestAnimationFrame(()=>{UI.viewport.scrollLeft=oldLeft;UI.viewport.scrollTop=oldTop;ensureStageVisible(false)});
}
function renderSlideTo(container,slide,animate=true){container.innerHTML='';Object.assign(container.style,{position:'relative',width:W+'px',height:H+'px',background:slide.background,overflow:'hidden'});[...slide.elements].sort((a,b)=>(a.z||0)-(b.z||0)).forEach(e=>{const d=renderElement(e,false);container.appendChild(d);if(animate)playEntrance(d,e.animation)})}

function shapePathD(p){
 const x=p.x||0,y=p.y||0,w=Math.max(1,p.w||1),h=Math.max(1,p.h||1);
 if(p.type==='rect')return`M${x} ${y}H${x+w}V${y+h}H${x}Z`;
 if(p.type==='circle'){const cx=x+w/2,cy=y+h/2,rx=w/2,ry=h/2;return`M${cx-rx} ${cy}A${rx} ${ry} 0 1 0 ${cx+rx} ${cy}A${rx} ${ry} 0 1 0 ${cx-rx} ${cy}Z`}
 if(p.type==='triangle')return`M${x+w/2} ${y}L${x+w} ${y+h}L${x} ${y+h}Z`;
 if(p.type==='star'){const ro=Math.min(w,h)/2,ri=ro*(p.starInnerRatio||.42),pts=starPointArray(x+w/2,y+h/2,ro,ri,p.starPoints||5);return pts.map((q,i)=>(i?'L':'M')+q.x+' '+q.y).join('')+'Z'}
 if(p.type==='polygon'){const n=Math.max(3,Math.min(12,p.corners||6));let pts=[];const cx=x+w/2,cy=y+h/2,r=Math.min(w,h)/2;for(let i=0;i<n;i++){const a=-Math.PI/2+i*2*Math.PI/n;pts.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r])}return pts.map((q,i)=>(i?'L':'M')+q[0]+' '+q[1]).join('')+'Z'}
 return''
}
function compoundSVG(e){
 const parts=e.parts||[],id='cp_'+String(e.id).replace(/[^a-z0-9]/gi,''),fill=e.fill||project.theme.accent||'#ef9e9c',d=parts.map(shapePathD).join(' '),op=e.operation||'union';
 if(op==='subtract'&&parts.length>=2){return`<svg class="compound-svg" viewBox="0 0 ${e.w} ${e.h}"><defs><mask id="m_${id}"><rect width="100%" height="100%" fill="black"/><path d="${shapePathD(parts[0])}" fill="white"/>${parts.slice(1).map(p=>`<path d="${shapePathD(p)}" fill="black"/>`).join('')}</mask></defs><rect width="100%" height="100%" fill="${fill}" mask="url(#m_${id})"/></svg>`}
 if(op==='intersect'&&parts.length===2){return`<svg class="compound-svg" viewBox="0 0 ${e.w} ${e.h}"><defs><clipPath id="c_${id}"><path d="${shapePathD(parts[1])}"/></clipPath></defs><path d="${shapePathD(parts[0])}" fill="${fill}" clip-path="url(#c_${id})"/></svg>`}
 return`<svg class="compound-svg" viewBox="0 0 ${e.w} ${e.h}"><path d="${d}" fill="${fill}" fill-rule="${op==='exclude'?'evenodd':'nonzero'}"/></svg>`
}
function combineShapes(operation){
 let items=selectedElements().filter(e=>['rect','circle','triangle','star','diamond','hexagon','heart','polygon','speechbubble','burst'].includes(e.type)).sort((a,b)=>(a.z||0)-(b.z||0));
 if(items.length<2)return toast('Pathfinder: mindestens zwei Formen auswählen.');
 if(items.some(e=>Math.abs(e.rotation||0)>.01))return toast('Pathfinder: Formen vorher auf 0° Drehung setzen.');
 if(operation==='intersect'&&items.length!==2)return toast('Schnittmenge funktioniert mit genau zwei Formen.');
 const minx=Math.min(...items.map(e=>e.x)),miny=Math.min(...items.map(e=>e.y)),maxx=Math.max(...items.map(e=>e.x+e.w)),maxy=Math.max(...items.map(e=>e.y+e.h));
 const fill=items[0].fill&&items[0].fill!=='transparent'?items[0].fill:project.theme.accent;
 const compound={...shapeEl('compound',uid('morph'),minx,miny,maxx-minx,maxy-miny,fill,0),operation,parts:items.map(e=>({type:e.type,x:e.x-minx,y:e.y-miny,w:e.w,h:e.h,corners:e.corners})),shadow:items[0].shadow||0};
 compound.z=Math.max(...items.map(e=>e.z||0));activeSlide().elements=activeSlide().elements.filter(e=>!selectedIds.has(e.id));activeSlide().elements.push(compound);selectedIds=new Set([compound.id]);commit();renderAll();toast('Pathfinder: '+({union:'Formen vereint',subtract:'Form abgezogen',intersect:'Schnittmenge erstellt',exclude:'Überlappung ausgeschlossen'}[operation]||operation));
}
function chartSVG(e){
 const vals=e.values||[30,50,70],labels=e.labels||['A','B','C'],cols=['#ef9e9c','#aab98d','#e7c778','#9db9d3','#c5a9d6','#f5b6ad'],type=e.chartType||'bar';
 if(type==='pie'||type==='donut'){const total=vals.reduce((a,b)=>a+b,0)||1;let start=0;let paths=vals.map((v,i)=>{const a1=start/total*Math.PI*2-Math.PI/2;start+=v;const a2=start/total*Math.PI*2-Math.PI/2,x1=50+40*Math.cos(a1),y1=50+40*Math.sin(a1),x2=50+40*Math.cos(a2),y2=50+40*Math.sin(a2),large=(a2-a1)>Math.PI?1:0;return`<path d="M50 50 L${x1} ${y1} A40 40 0 ${large} 1 ${x2} ${y2} Z" fill="${cols[i%cols.length]}"/>`}).join('');return`<svg viewBox="0 0 100 100" class="chart-svg">${paths}${type==='donut'?'<circle cx="50" cy="50" r="22" fill="white"/>':''}</svg>`}
 if(type==='line'){const max=Math.max(...vals,1),pts=vals.map((v,i)=>`${35+i*(430/Math.max(1,vals.length-1))},${220-170*v/max}`).join(' ');return`<svg viewBox="0 0 500 260" class="chart-svg"><polyline points="${pts}" fill="none" stroke="${e.color||'#ef9e9c'}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>${vals.map((v,i)=>`<circle cx="${35+i*(430/Math.max(1,vals.length-1))}" cy="${220-170*v/max}" r="8" fill="${e.color||'#ef9e9c'}"/><text x="${35+i*(430/Math.max(1,vals.length-1))}" y="248" text-anchor="middle" font-size="15" fill="#6f615b">${labels[i]||''}</text>`).join('')}</svg>`}
 const max=Math.max(...vals,1);return`<svg viewBox="0 0 500 260" class="chart-svg">${vals.map((v,i)=>{const x=35+i*(430/vals.length),h=180*v/max,y=220-h;return`<rect x="${x}" y="${y}" width="${Math.max(24,320/vals.length)}" height="${h}" rx="10" fill="${e.color||'#ef9e9c'}"/><text x="${x+16}" y="246" text-anchor="middle" font-size="15" fill="#6f615b">${labels[i]||''}</text>`}).join('')}</svg>`
}
function tableHTML(e){let out='<table class="table-el">';for(let r=0;r<(e.rows||3);r++){out+='<tr>';for(let c=0;c<(e.cols||3);c++)out+=`<td contenteditable="false">${r===0?'Titel':r===1?'Text':'—'}</td>`;out+='</tr>'}return out+'</table>'}

function positionStageShell(){
 const sw=W*scale,sh=H*scale,vw=UI.viewport.clientWidth||1,vh=UI.viewport.clientHeight||1;
 UI.shell.style.marginLeft=Math.max(24,Math.floor((vw-sw)/2))+'px';
 UI.shell.style.marginTop=Math.max(24,Math.floor((vh-sh)/2))+'px';
 UI.shell.style.marginRight='24px';UI.shell.style.marginBottom='24px';
}
function setScale(v,preserve=true){
 const oldLeft=UI.viewport.scrollLeft,oldTop=UI.viewport.scrollTop;
 scale=v;UI.stage.style.transform=`scale(${scale})`;UI.shell.style.width=(W*scale)+'px';UI.shell.style.height=(H*scale)+'px';positionStageShell();
 $('#zoomLabel').textContent=Math.round(scale*100)+'%';$('#zoomRange').value=Math.round(scale*100);
 if(preserve)requestAnimationFrame(()=>{UI.viewport.scrollLeft=oldLeft;UI.viewport.scrollTop=oldTop});
}
function fitStage(){
 const r=UI.viewport.getBoundingClientRect(),next=clamp(Math.min((r.width-48)/W,(r.height-48)/H),.22,1.6);
 setScale(next,false);zoomMode='fit';UI.viewport.scrollLeft=0;UI.viewport.scrollTop=0;
}
function ensureStageVisible(reset=true){
 const vr=UI.viewport.getBoundingClientRect(),sr=UI.shell.getBoundingClientRect();
 const visible=sr.right>vr.left+10&&sr.left<vr.right-10&&sr.bottom>vr.top+10&&sr.top<vr.bottom-10;
 if(!visible&&reset){UI.viewport.scrollLeft=0;UI.viewport.scrollTop=0;positionStageShell()}
 return visible;
}
window.addEventListener('resize',()=>{if(zoomMode==='fit')fitStage();else positionStageShell();if(isPresenting)scalePresentation()});
function stagePoint(ev){const r=UI.stage.getBoundingClientRect();return{x:(ev.clientX-r.left)/scale,y:(ev.clientY-r.top)/scale}}
function selectElement(id,toggle=false){
 const e=activeSlide().elements.find(x=>x.id===id);
 if(toggle){selectedIds.has(id)?selectedIds.delete(id):selectedIds.add(id)}else{selectedIds.clear();if(e?.groupId)activeSlide().elements.filter(x=>x.groupId===e.groupId).forEach(x=>selectedIds.add(x.id));else selectedIds.add(id)}
 refreshSelectionUI();renderInspector();renderLayers();syncMobileSelectionUI();
}
function selectText(el){const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r)}

function domNodeFor(id){try{return UI.stage.querySelector(`[data-id="${CSS.escape(id)}"]`)}catch{return [...UI.stage.querySelectorAll('.el')].find(n=>n.dataset.id===id)||null}}
function updateElementDOM(e){const n=domNodeFor(e.id);if(!n)return;if(['sticker','compound','image','video','svg','chart','table','drawing','triangle','star','diamond','hexagon','heart','polygon','speechbubble','burst','line','arrow'].includes(e.type)){const fresh=renderElement(e,true);n.replaceWith(fresh);return;}applyBox(n,e);const c=n.querySelector('.content');if(c&&['title','text','badge','icon'].includes(e.type))styleText(c,e)}
function removeEditorHandles(){UI.stage.querySelectorAll('.handle,.rotate-handle').forEach(n=>n.remove())}
function addEditorHandles(node,e){if(!node||e.locked||selectedIds.size!==1||!selectedIds.has(e.id))return;[['br','br'],['bl','bl'],['tr','tr'],['tl','tl']].forEach(([cls,corner])=>{const h=document.createElement('div');h.className=`handle ${cls}`;h.addEventListener('pointerdown',ev=>startResize(ev,e.id,corner));node.appendChild(h)});const r=document.createElement('div');r.className='rotate-handle';r.addEventListener('pointerdown',ev=>startRotate(ev,e.id));node.appendChild(r)}
function refreshSelectionUI(){removeEditorHandles();UI.stage.querySelectorAll('.el').forEach(n=>{n.classList.remove('selected','multi-selected');if(selectedIds.has(n.dataset.id))n.classList.add(selectedIds.size>1?'multi-selected':'selected')});if(selectedIds.size===1){const e=selected(),n=e&&domNodeFor(e.id);if(e&&n)addEditorHandles(n,e)}}

function startMove(ev,id){
 if(ev.button!==0||ev.target.classList.contains('handle')||ev.target.classList.contains('rotate-handle')||drawMode||spacePan||panMode)return;
 const e=activeSlide().elements.find(x=>x.id===id);if(!e||e.locked)return;ev.preventDefault();if(document.activeElement&&['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))document.activeElement.blur();
 if(!selectedIds.has(id)){selectedIds.clear();if(e.groupId)activeSlide().elements.filter(x=>x.groupId===e.groupId).forEach(x=>selectedIds.add(x.id));else selectedIds.add(id);refreshSelectionUI();renderInspector();renderLayers();syncMobileSelectionUI()}
 const items=selectedElements().map(x=>({e:x,x:x.x,y:x.y})),p=stagePoint(ev);let moved=false;
 const move=mv=>{const q=stagePoint(mv),dx=q.x-p.x,dy=q.y-p.y;if(Math.abs(dx)+Math.abs(dy)>1)moved=true;items.forEach(it=>{it.e.x=clamp(it.x+dx,-it.e.w+20,W-20);it.e.y=clamp(it.y+dy,-it.e.h+20,H-20);if(snap){it.e.x=Math.round(it.e.x/10)*10;it.e.y=Math.round(it.e.y/10)*10}updateElementDOM(it.e)});if(showGuides)smartGuides(items.map(i=>i.e))};
 const up=()=>{window.removeEventListener('pointermove',move);hideGuides();if(moved){commit();renderSlides();renderInspector();renderLayers()}refreshSelectionUI();ensureStageVisible(true)};
 window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
}
function smartGuides(moving){
 hideGuides();if(moving.length!==1)return;const e=moving[0],others=activeSlide().elements.filter(x=>x.id!==e.id&&!selectedIds.has(x.id));const xs=[0,W/2,W],ys=[0,H/2,H],ex=[e.x,e.x+e.w/2,e.x+e.w],ey=[e.y,e.y+e.h/2,e.y+e.h];others.forEach(o=>{xs.push(o.x,o.x+o.w/2,o.x+o.w);ys.push(o.y,o.y+o.h/2,o.y+o.h)});for(const a of ex)for(const b of xs)if(Math.abs(a-b)<5){UI.guideV.style.left=(b*scale)+'px';UI.guideV.classList.remove('hidden');return}for(const a of ey)for(const b of ys)if(Math.abs(a-b)<5){UI.guideH.style.top=(b*scale)+'px';UI.guideH.classList.remove('hidden');return}
}
function hideGuides(){UI.guideV.classList.add('hidden');UI.guideH.classList.add('hidden')}
function startResize(ev,id,corner){
 ev.preventDefault();ev.stopPropagation();const e=activeSlide().elements.find(x=>x.id===id),p=stagePoint(ev),orig={x:e.x,y:e.y,w:e.w,h:e.h},ratio=e.w/e.h;
 const move=mv=>{const q=stagePoint(mv),dx=q.x-p.x,dy=q.y-p.y;let nx=orig.x,ny=orig.y,nw=orig.w,nh=orig.h;if(corner.includes('r'))nw=orig.w+dx;else{nw=orig.w-dx;nx=orig.x+dx}if(corner.includes('b'))nh=orig.h+dy;else{nh=orig.h-dy;ny=orig.y+dy}if(mv.shiftKey){if(Math.abs(dx)>Math.abs(dy))nh=nw/ratio;else nw=nh*ratio}if(nw>30&&nh>24){Object.assign(e,{x:nx,y:ny,w:nw,h:nh});if(e.type==='circle')e.borderRadius=999;if(e.type==='capsule')e.borderRadius=999;updateElementDOM(e);refreshSelectionUI()}};
 const up=()=>{window.removeEventListener('pointermove',move);commit();renderSlides();renderInspector();refreshSelectionUI();ensureStageVisible(true)};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
}
function startRotate(ev,id){
 ev.preventDefault();ev.stopPropagation();const e=activeSlide().elements.find(x=>x.id===id),r=UI.stage.getBoundingClientRect(),cx=r.left+(e.x+e.w/2)*scale,cy=r.top+(e.y+e.h/2)*scale;
 const move=mv=>{e.rotation=Math.round(Math.atan2(mv.clientY-cy,mv.clientX-cx)*180/Math.PI+90);if(mv.shiftKey)e.rotation=Math.round(e.rotation/15)*15;updateElementDOM(e);refreshSelectionUI()};
 const up=()=>{window.removeEventListener('pointermove',move);commit();renderSlides();renderInspector();refreshSelectionUI();ensureStageVisible(true)};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
}

function beginSelection(ev){
 if(ev.button!==0||drawMode||spacePan)return;
 if(ev.target.closest('.el,.handle,.rotate-handle'))return;
 ev.preventDefault();
 if(document.activeElement&&['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))document.activeElement.blur();
 const p=stagePoint(ev),base=ev.shiftKey?new Set(selectedIds):new Set();
 selectedIds=new Set(base);const box=UI.selectionBox;box.classList.remove('hidden');
 Object.assign(box.style,{left:(p.x*scale)+'px',top:(p.y*scale)+'px',width:'0px',height:'0px'});
 let dragged=false;
 const move=mv=>{const q=stagePoint(mv),x=Math.min(p.x,q.x),y=Math.min(p.y,q.y),w=Math.abs(q.x-p.x),h=Math.abs(q.y-p.y);if(w+h>3)dragged=true;Object.assign(box.style,{left:x*scale+'px',top:y*scale+'px',width:w*scale+'px',height:h*scale+'px'});selectedIds=new Set(base);activeSlide().elements.forEach(e=>{const intersects=e.x < x+w && e.x+e.w > x && e.y < y+h && e.y+e.h > y;if(intersects)selectedIds.add(e.id)});refreshSelectionUI()};
 const up=()=>{window.removeEventListener('pointermove',move);box.classList.add('hidden');if(!dragged&&!ev.shiftKey)selectedIds.clear();refreshSelectionUI();renderInspector();renderLayers();syncMobileSelectionUI();};
 window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true})
}
UI.stage.addEventListener('pointerdown',beginSelection);

function addElement(type){
 const z=Math.max(0,...activeSlide().elements.map(x=>x.z||0))+1;let e;
 if(type==='title')e=textEl('title',uid('morph'),110,100,760,130,'Deine Überschrift',64,project.theme.ink,true);
 if(type==='text')e=textEl('text',uid('morph'),120,260,600,100,'Schreibe hier deinen Text …',28,project.theme.ink);
 if(type==='rect')e=shapeEl('rect',uid('morph'),160,180,390,220,project.theme.accent,28);
 if(type==='circle')e=shapeEl('circle',uid('morph'),190,160,230,230,project.theme.accent,120);
 if(type==='triangle')e={...shapeEl('triangle',uid('morph'),190,150,250,230,project.theme.accent,0),shapeRoundness:0};
 if(type==='star')e={...shapeEl('star',uid('morph'),190,150,230,230,project.theme.accent,0),shapeRoundness:0,starPoints:5,starInnerRatio:.42};
 if(type==='diamond')e={...shapeEl('diamond',uid('morph'),210,160,210,210,project.theme.accent,0),shapeRoundness:0};
 if(type==='hexagon')e=shapeEl('hexagon',uid('morph'),190,160,250,220,project.theme.accent,0);
 if(type==='heart')e=shapeEl('heart',uid('morph'),200,160,230,210,project.theme.accent,0);
 if(type==='capsule')e=shapeEl('capsule',uid('morph'),180,180,320,120,project.theme.accent,999);
 if(type==='polygon')e={...shapeEl('polygon',uid('morph'),190,160,250,220,project.theme.accent,0),corners:6,shapeRoundness:0};
 if(type==='speechbubble')e={...shapeEl('speechbubble',uid('morph'),180,170,360,200,project.theme.accent,0),shapeRoundness:14};
 if(type==='burst')e={...shapeEl('burst',uid('morph'),180,150,250,250,project.theme.accent,0),shapeRoundness:0};
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
function copyStyle(){const e=selected();if(!e)return toast('Erst ein Element auswählen.');const block=['fill','color','borderRadius','shadow','shadowX','shadowY','shadowOpacity','shadowHardX','shadowHardY','shadowHardOpacity','feather','borderWidth','borderColor','fontFamily','fontSize','fontWeight','fontStyle','textDecoration','textAlign','lineHeight','letterSpacing','gradient','opacity','stickerColor','stickerAccent','strokeWidth','lineCap','pathFillEnabled','textBgColor','textBgEnabled'];styleClipboard={};block.forEach(k=>{if(e[k]!==undefined)styleClipboard[k]=deep(e[k])});toast('Stil kopiert.')}
function pasteStyle(){if(!styleClipboard)return toast('Noch kein Stil kopiert.');updateSelected(e=>{Object.entries(styleClipboard).forEach(([k,v])=>e[k]=deep(v))});toast('Stil eingefügt.')}
function releaseCompound(){const e=selected();if(!e||e.type!=='compound')return toast('Bitte zuerst ein Pathfinder-Objekt auswählen.');const parts=(e.parts||[]).map((p,i)=>({...shapeEl(p.type,uid('morph'),e.x+(p.x||0),e.y+(p.y||0),p.w||120,p.h||120,e.fill||project.theme.accent,0),corners:p.corners||6,z:(e.z||1)+i,shadow:e.shadow||0}));activeSlide().elements=activeSlide().elements.filter(x=>x.id!==e.id);activeSlide().elements.push(...parts);selectedIds=new Set(parts.map(p=>p.id));commit();renderAll();toast('Pathfinder wieder in Formen aufgelöst.')}
function openContextMenu(x,y,id=null){const m=$('#contextMenu');if(!m)return;if(id&&!selectedIds.has(id))selectElement(id,false);const e=selected(),isText=!!e&&['title','text','badge','icon'].includes(e.type),isTimeline=!!e&&e.type==='sticker'&&['ruler','timeline_scale','timeline_horizontal','timeline_vertical'].includes(e.stickerKind);$('#contextTextTools')?.classList.toggle('hidden',!isText);$('#contextTimelineEdit')?.classList.toggle('hidden',!isTimeline);if(isText){set('#contextFont',e.fontFamily||'Nunito');set('#contextFontSize',e.fontSize||28);set('#contextTextColor',safeColor(e.color||'#3c312d'))}m.classList.remove('hidden');m.scrollTop=0;requestAnimationFrame(()=>{const r=m.getBoundingClientRect(),mw=Math.ceil(r.width||250),mh=Math.min(window.innerHeight-16,Math.ceil(r.height||520));m.style.left=Math.max(8,Math.min(x,window.innerWidth-mw-8))+'px';m.style.top=Math.max(8,Math.min(y,window.innerHeight-mh-8))+'px'})}
function closeContextMenu(){const m=$('#contextMenu');if(m)m.classList.add('hidden')}
function groupSelection(){if(selectedIds.size<2)return toast('Mindestens 2 Elemente auswählen.');const items=selectedElements(),gid=uid('group');items.forEach(e=>e.groupId=gid);commit();renderAll();toast('Gruppe erstellt.')}
function ungroupSelection(){const gids=new Set(selectedElements().map(e=>e.groupId).filter(Boolean));activeSlide().elements.forEach(e=>{if(gids.has(e.groupId))delete e.groupId});commit();renderAll()}
function selectGroup(id){const e=activeSlide().elements.find(x=>x.id===id);if(e?.groupId)selectedIds=new Set(activeSlide().elements.filter(x=>x.groupId===e.groupId).map(x=>x.id))}
function arrange(action){
 const items=selectedElements();if(!items.length)return;const arr=activeSlide().elements,max=Math.max(...arr.map(x=>x.z||0)),min=Math.min(...arr.map(x=>x.z||0));
 if(action==='group')return groupSelection();
 if(action==='distributeH'&&items.length>=3){const sorted=[...items].sort((a,b)=>a.x-b.x),left=sorted[0].x,right=sorted.at(-1).x+sorted.at(-1).w,total=sorted.reduce((s,e)=>s+e.w,0),gap=(right-left-total)/(sorted.length-1);let x=left;sorted.forEach(e=>{e.x=x;x+=e.w+gap});commit();return renderAll()}
 if(action==='distributeV'&&items.length>=3){const sorted=[...items].sort((a,b)=>a.y-b.y),top=sorted[0].y,bottom=sorted.at(-1).y+sorted.at(-1).h,total=sorted.reduce((s,e)=>s+e.h,0),gap=(bottom-top-total)/(sorted.length-1);let y=top;sorted.forEach(e=>{e.y=y;y+=e.h+gap});commit();return renderAll()}if(action==='ungroup')return ungroupSelection();if(action==='duplicate')return duplicateSelection();if(action==='delete')return deleteSelected();
 items.forEach((e,i)=>{if(action==='front')e.z=max+i+1;if(action==='back')e.z=min-i-1;if(action==='up')e.z+=1;if(action==='down')e.z-=1;if(action==='centerX')e.x=(W-e.w)/2;if(action==='centerY')e.y=(H-e.h)/2;if(action==='left')e.x=0;if(action==='right')e.x=W-e.w;if(action==='top')e.y=0;if(action==='bottom')e.y=H-e.h;if(action==='lock')e.locked=!e.locked});commit();renderAll()
}

function renderInspector(){
 const items=selectedElements(),e=items[0];UI.empty.classList.toggle('hidden',!!e);UI.content.classList.toggle('hidden',!e);if(!e)return;
 $('#elementTypeLabel').textContent=items.length>1?`${items.length} Elemente`:elmap[e.type]||e.type;
 $('#textControls').classList.toggle('hidden',items.length>1||!['title','text','badge','icon'].includes(e.type));
 $('#imageControls').classList.toggle('hidden',items.length>1||!['image','video'].includes(e.type));
 const shapeTypes=['rect','circle','triangle','star','diamond','heart','polygon','capsule','speechbubble','burst'];
 $('#shapeControls')?.classList.toggle('hidden',items.length>1||!shapeTypes.includes(e.type));
 $('#polygonControls')?.classList.toggle('hidden',items.length>1||e.type!=='polygon');
 $('#starControls')?.classList.toggle('hidden',items.length>1||e.type!=='star');
 $('#shapeRoundControls')?.classList.toggle('hidden',items.length>1||!['triangle','star','diamond','hexagon','polygon','speechbubble','burst'].includes(e.type));
 $('#stickerControls')?.classList.toggle('hidden',items.length>1||e.type!=='sticker');
 $('#milestoneNumberWrap')?.classList.toggle('hidden',items.length>1||e.type!=='sticker'||e.stickerKind!=='milestone_card');
 const timelineKinds=['ruler','timeline_scale','timeline_horizontal','timeline_vertical'];
 $('#timelineStickerControls')?.classList.toggle('hidden',items.length>1||e.type!=='sticker'||!timelineKinds.includes(e.stickerKind));
 $('#drawingControls')?.classList.toggle('hidden',items.length>1||e.type!=='drawing');
 set('#fontFamily',e.fontFamily||'Nunito');set('#fontSize',e.fontSize||28);set('#fillColor',safeColor(e.fill));set('#elementColor',safeColor(e.color));
 set('#gradientType',e.gradient?.type||'none');set('#gradientColor1',safeColor(e.gradient?.c1||e.fill));set('#gradientColor2',safeColor(e.gradient?.c2||'#ef9e9c'));
 set('#opacityRange',Math.round((e.opacity??1)*100));set('#radiusRange',e.borderRadius||0);set('#shadowRange',e.shadow||0);set('#shadowXRange',e.shadowX??0);set('#shadowYRange',e.shadowY??Math.max(4,(e.shadow||0)/2));set('#shadowOpacityRange',e.shadowOpacity??18);set('#shadowHardXRange',e.shadowHardX??0);set('#shadowHardYRange',e.shadowHardY??0);set('#shadowHardOpacityRange',e.shadowHardOpacity??0);set('#featherRange',e.feather||0);set('#borderRange',e.borderWidth||0);
 set('#posX',Math.round(e.x));set('#posY',Math.round(e.y));set('#sizeW',Math.round(e.w));set('#sizeH',Math.round(e.h));set('#rotationRange',e.rotation||0);
 set('#lineHeightRange',e.lineHeight||1.12);set('#letterSpacingRange',e.letterSpacing||0);set('#textBgColor',safeColor(e.textBgColor||'#fff2a8'));set('#textBgToggle',!!e.textBgEnabled);
 set('#objectFit',e.objectFit||'cover');set('#cropZoom',e.cropZoom||100);set('#cropX',e.cropX??50);set('#cropY',e.cropY??50);set('#brightnessRange',e.brightness??100);set('#contrastRange',e.contrast??100);set('#saturateRange',e.saturate??100);set('#blurRange',e.blur??0);set('#maskSelect',e.mask||'none');
 if(shapeTypes.includes(e.type)){set('#shapeImageZoom',e.shapeImageZoom||100);set('#shapeImageX',e.shapeImageX??50);set('#shapeImageY',e.shapeImageY??50);set('#shapeRoundness',e.shapeRoundness||0)}
 if(e.type==='polygon'){set('#polygonSides',e.corners||6)}
 if(e.type==='star'){set('#starPoints',e.starPoints||5);set('#starInnerRatio',Math.round((e.starInnerRatio||.42)*100))}
 if(e.type==='sticker'){set('#stickerTextInput',e.content||'');set('#stickerColor',safeColor(e.stickerColor||e.fill||'#fff8ef'));set('#stickerAccentColor',safeColor(e.stickerAccent||'#e8d7a7'));set('#stickerTextX',e.stickerTextX||0);set('#stickerTextY',e.stickerTextY||0);set('#milestoneNumber',e.milestoneNumber||'01');if(timelineKinds.includes(e.stickerKind)){set('#timelinePoints',e.timelinePoints||4);set('#timelineStart',e.timelineStart??0);set('#timelineStep',e.timelineStep??1);set('#timelineUnit',e.timelineUnit||'Jahre');set('#timelineLabels',(e.timelineLabels||'').replace(/\|/g,'\n'))}}
 if(e.type==='drawing'){set('#pathStrokeWidth',e.strokeWidth||5);set('#pathLineCap',e.lineCap||'round');set('#pathFillToggle',!!e.pathFillEnabled)}
 set('#animIn',e.animation?.in||'none');set('#animOut',e.animation?.out||'none');set('#animDuration',e.animation?.duration||.6);set('#animDelay',e.animation?.delay||0);set('#animTrigger',e.animation?.trigger||'auto');set('#morphId',items.length===1?e.id:'Mehrfachauswahl');
 $('#boldBtn').style.background=e.fontWeight>=700?'#ffe2dc':'#fff';$('#italicBtn').style.background=e.fontStyle==='italic'?'#ffe2dc':'#fff';$('#underlineBtn').style.background=e.textDecoration==='underline'?'#ffe2dc':'#fff';
 if(['video','audio'].includes(e.type)){set('#autoplayToggle',!!e.autoplay);set('#loopToggle',!!e.loop);set('#volumeRange',e.volume??100)}
}
function safeColor(v){return /^#[0-9a-f]{6}$/i.test(v||'')?v:'#ffffff'}function set(sel,v){const n=$(sel);if(n)n.type==='checkbox'?n.checked=!!v:n.value=v}
function updateSelected(mut){const items=selectedElements();if(!items.length)return;items.forEach(mut);commit();renderStage();renderSlides();renderInspector();renderLayers();renderTimeline();ensureStageVisible(true)}
function liveSelected(mut){const items=selectedElements();if(!items.length)return;items.forEach(x=>{mut(x);updateElementDOM(x)});refreshSelectionUI()}
function syncSlideControls(){const s=activeSlide();set('#slideBg',safeColor(s.background));set('#transitionSelect',s.transition||'fade');set('#transitionDuration',s.transitionDuration||.7);UI.notes.value=s.notes||''}
function applyTheme(name){const themes={blush:{bg:'#fff8f4',ink:'#473a34',accent:'#ef9e9c'},sage:{bg:'#f7f8ec',ink:'#3e4836',accent:'#aab98d'},sky:{bg:'#f0f7fb',ink:'#334b5a',accent:'#9db9d3'},lavender:{bg:'#f8f3fb',ink:'#493d52',accent:'#c5a9d6'},night:{bg:'#25272e',ink:'#fff8f2',accent:'#d5a6bd'}};project.theme=themes[name];activeSlide().background=themes[name].bg;commit();renderAll()}

function insertDataFile(file,type){
 const r=new FileReader();r.onload=()=>{const base={...shapeEl(type,uid('morph'),170,120,520,340,'transparent',24),src:r.result,objectFit:'cover',cropZoom:100,cropX:50,cropY:50,brightness:100,contrast:100,saturate:100,blur:0,mask:'none',name:file.name,autoplay:false,loop:false,volume:100};activeSlide().elements.push(base);selectedIds=new Set([base.id]);if(type!=='audio')mediaStore.push({id:uid('media'),type,name:file.name,src:r.result});commit();renderAll()};r.readAsDataURL(file)
}
function insertSVG(file){const r=new FileReader();r.onload=()=>{const e={...shapeEl('svg',uid('morph'),180,140,430,330,'transparent',0),svg:r.result,name:file.name};activeSlide().elements.push(e);selectedIds=new Set([e.id]);mediaStore.push({id:uid('media'),type:'svg',name:file.name,src:r.result});commit();renderAll()};r.readAsText(file)}

const stickerCatalog=[
 {kind:'notebook',name:'Süßer Notizblock',cat:'paper',pack:'study',w:420,h:300,desc:'Notizblock mit Spiralbindung'},
 {kind:'polaroid',name:'Polaroid',cat:'photo',pack:'photo',w:300,h:360,desc:'Bild austauschbar'},
 {kind:'polaroid_stack',name:'Polaroid Stack',cat:'photo',pack:'photo',w:320,h:370,desc:'Mehrere Fotos übereinander'},
 {kind:'graph',name:'Karo-Zettel',cat:'paper',pack:'paper',w:380,h:270,desc:'Sauber ohne Hinterkante'},
 {kind:'lined',name:'Linierter Zettel',cat:'paper',pack:'paper',w:400,h:270,desc:'Sauber ohne Vorderlinie'},
 {kind:'graph_torn',name:'Gerissener Karo-Zettel',cat:'paper',pack:'paper',w:395,h:275,desc:'Karo mit Torn-Optik'},
 {kind:'lined_torn',name:'Gerissener Linien-Zettel',cat:'paper',pack:'paper',w:410,h:275,desc:'Liniert mit Torn-Optik'},
 {kind:'sticky',name:'Sticky Note',cat:'paper',pack:'paper',w:270,h:230,desc:'Gefaltete Ecke'},
 {kind:'postit_square',name:'Post-it Square',cat:'paper',pack:'paper',w:250,h:230,desc:'Quadratisches Post-it'},
 {kind:'postit_round',name:'Post-it Circle',cat:'paper',pack:'paper',w:220,h:220,desc:'Rundes Post-it'},
 {kind:'frame_window',name:'Soft Frame',cat:'frames',pack:'frames',w:320,h:240,desc:'Sanfter Bilderrahmen'},
 {kind:'frame_blob',name:'Blob Frame',cat:'frames',pack:'frames',w:320,h:240,desc:'Organischer Frame'},
 {kind:'frame_scallop',name:'Scallop Frame',cat:'frames',pack:'frames',w:340,h:250,desc:'Verspielter Frame'},
 {kind:'tape',name:'Transparentes Tape',cat:'tape',pack:'tape',w:300,h:70,desc:'Zum Festkleben'},
 {kind:'washi',name:'Washi Tape',cat:'tape',pack:'tape',w:330,h:74,desc:'Gemustertes Tape'},
 {kind:'paperclip',name:'Büroklammer',cat:'tape',pack:'tape',w:95,h:160,desc:'Normale Klammer'},
 {kind:'binder',name:'Foldback Clip',cat:'tape',pack:'tape',w:130,h:120,desc:'Klammer'},
 {kind:'pin',name:'Pin',cat:'tape',pack:'tape',w:90,h:130,desc:'Süßer Pin'},
 {kind:'pushpin',name:'Stecknadel',cat:'tape',pack:'tape',w:100,h:145,desc:'Kleine gezeichnete Stecknadel'},
 {kind:'checklist',name:'Checkliste',cat:'school',pack:'study',w:290,h:240,desc:'Punkte abhaken'},
 {kind:'ruler',name:'Zeitskala',cat:'school',pack:'study',w:420,h:95,desc:'Anpassbare Zeit-Skala'},
 {kind:'timeline_horizontal',name:'Horizontaler Zeitstrahl',cat:'school',pack:'study',w:520,h:130,desc:'4 Stationen auf einer Linie'},
 {kind:'timeline_vertical',name:'Vertikaler Zeitstrahl',cat:'school',pack:'study',w:200,h:460,desc:'Vertikaler Ablauf'},
 {kind:'milestone_card',name:'Meilenstein-Karte',cat:'school',pack:'study',w:250,h:170,desc:'Label für Timeline'},
 {kind:'foldertab',name:'Ordner-Reiter',cat:'school',pack:'study',w:250,h:150,desc:'Kapitelmarker'},
 {kind:'speech',name:'Speech Bubble',cat:'school',pack:'study',w:280,h:180,desc:'Definition oder Tipp'},
 {kind:'label',name:'Label',cat:'decor',pack:'cute',w:250,h:70,desc:'Beschriftung'},
 {kind:'highlight',name:'Textmarker',cat:'decor',pack:'cute',w:300,h:70,desc:'Highlight-Streifen'},
 {kind:'sparkle',name:'Sparkles',cat:'decor',pack:'cute',w:160,h:120,desc:'Deko'},
 {kind:'sparklegif',name:'Animierte Sparkles',cat:'decor',pack:'cute',w:170,h:130,desc:'Schwebende Sterne'},
 {kind:'heartgif',name:'Animierte Hearts',cat:'decor',pack:'cute',w:170,h:130,desc:'Schwebende Herzen'},
 {kind:'leaf',name:'Pflanze',cat:'decor',pack:'cute',w:140,h:140,desc:'Study-Deko'},
 {kind:'tab',name:'Tab / Kapitelreiter',cat:'decor',pack:'cute',w:240,h:120,desc:'Für Kapitel'},
 {kind:'bookmark',name:'Lesezeichen',cat:'decor',pack:'cute',w:150,h:240,desc:'Scrapbook Bookmark'},
 {kind:'stamp',name:'Stempel-Sticker',cat:'decor',pack:'cute',w:200,h:140,desc:'Perforierte Marke'},
 {kind:'cloud',name:'Cloud Note',cat:'decor',pack:'cute',w:260,h:160,desc:'Wolken-Notiz'},
 {kind:'corner_tape',name:'Fotoecken',cat:'decor',pack:'cute',w:280,h:180,desc:'Ecken mit Tape-Look'},
 {kind:'scribblecircle',name:'Scribble Circle',cat:'decor',pack:'cute',w:220,h:220,desc:'Gekritzelter Kreis'},
 {kind:'starburst',name:'Starburst',cat:'decor',pack:'cute',w:180,h:180,desc:'Explosions-Sticker'},
 {kind:'bow',name:'Bow',cat:'decor',pack:'kawaii',w:140,h:120,desc:'Kawaii Schleife'},
 {kind:'daisy',name:'Daisy',cat:'decor',pack:'kawaii',w:150,h:140,desc:'Blumensticker'},
 {kind:'arrowdoodle',name:'Doodle Arrow',cat:'decor',pack:'minimal',w:180,h:120,desc:'Pfeil-Doodle'},
 {kind:'squiggle',name:'Squiggle',cat:'decor',pack:'minimal',w:180,h:120,desc:'Linien-Doodle'}
];
function stickerElement(kind){
 const def=stickerCatalog.find(s=>s.kind===kind)||stickerCatalog[0],timelineKind=['ruler','timeline_horizontal','timeline_vertical','milestone_card'].includes(kind),e={...shapeEl('sticker',uid('morph'),180,140,def.w,def.h,'transparent',0),stickerKind:kind,stickerColor:'#fff8ef',stickerAccent:timelineKind?(project.theme.accent||'#ef9e9c'):['tape','corner_tape'].includes(kind)?'#e8d7a7':'#d9b7b7',content:'',cropZoom:100,cropX:50,cropY:50,stickerTextX:0,stickerTextY:0,milestoneNumber:'01'};if(timelineKind){e.timelinePoints=4;e.timelineStart=0;e.timelineStep=1;e.timelineUnit='Jahre';e.timelineLabels=''}
 if(kind==='notebook')e.content='Meine Notizen\n• Punkt 1\n• Punkt 2';
 if(kind==='graph')e.content='Karo-Zettel';
 if(kind==='lined')e.content='Linierter Zettel';
 if(kind==='graph_torn')e.content='Gerissener Karo-Zettel';
 if(kind==='lined_torn')e.content='Gerissener Linien-Zettel';
 if(kind==='sticky')e.content='Merken ✦';
 if(kind==='postit_square')e.content='Post-it';
 if(kind==='postit_round')e.content='Idea';
 if(kind==='polaroid')e.content='Moment ♡';
 if(kind==='polaroid_stack')e.content='Memories';
 if(kind==='checklist')e.content='Checkliste';
 if(kind==='foldertab')e.content='Hinweis';
 if(kind==='speech')e.content='Wichtige Definition';
 if(kind==='label')e.content='subtitle';
 if(kind==='highlight')e.content='highlight';
 if(kind==='tab')e.content='Tab';
 if(kind==='bookmark')e.content='01';
 if(kind==='stamp')e.content='STUDY';
 if(kind==='cloud')e.content='Merksatz';
 if(kind==='ruler'||kind==='timeline_scale')e.content='';
 if(kind==='timeline_horizontal')e.content='';
 if(kind==='timeline_vertical')e.content='';
 if(kind==='milestone_card')e.content='Meilenstein';
 e.z=Math.max(0,...activeSlide().elements.map(x=>x.z||0))+1;return e
}
function insertSticker(kind){const e=stickerElement(kind);activeSlide().elements.push(e);selectedIds=new Set([e.id]);commit();renderAll();closeModals()}
function renderStickerGrid(cat='all'){
 const g=$('#stickerGrid');if(!g)return;g.innerHTML='';
 const q=($('#stickerSearch')?.value||'').trim().toLowerCase();const hiddenKinds=new Set(['highlight','foldertab','tab','squiggle']);
 stickerCatalog.filter(s=>!hiddenKinds.has(s.kind)&&(cat==='all'||s.cat===cat)&&(!q||`${s.name} ${s.desc} ${s.kind} ${s.pack||''}`.toLowerCase().includes(q))).forEach(s=>{
  const card=document.createElement('div');card.className='sticker-choice';
  const pv=document.createElement('div');pv.className='sticker-choice-preview';
  const demo=stickerElement(s.kind);const wrap=document.createElement('div');wrap.style.cssText='width:220px;height:105px;position:relative;overflow:hidden';
  const n=renderElement(demo,false);Object.assign(n.style,{left:'20px',top:'8px',width:Math.min(demo.w,240)+'px',height:Math.min(demo.h,120)+'px',transform:'scale(.62)',transformOrigin:'top left'});
  wrap.appendChild(n);pv.appendChild(wrap);card.appendChild(pv);
  card.insertAdjacentHTML('beforeend',`<div><b>${esc(s.name)}</b><br><small>${esc(s.desc)}</small><div class="pack-badge">${esc(s.pack||'set')}</div></div>`);
  card.onclick=()=>insertSticker(s.kind);g.appendChild(card)
 });
 if(!g.children.length)g.innerHTML='<div class="hint">Kein Sticker gefunden.</div>'
}

function insertChart(){const values=$('#chartValues').value.split(',').map(x=>Number(x.trim())||0),labels=$('#chartLabels').value.split(',').map(x=>x.trim());const e={...shapeEl('chart',uid('morph'),180,150,560,350,'#fff',24),chartType:$('#chartType').value,values,labels,color:project.theme.accent,shadow:12};activeSlide().elements.push(e);selectedIds=new Set([e.id]);commit();renderAll();closeModals()}
function insertTable(){const e={...shapeEl('table',uid('morph'),150,150,650,320,'transparent',0),rows:+$('#tableRows').value,cols:+$('#tableCols').value,color:project.theme.ink};activeSlide().elements.push(e);selectedIds=new Set([e.id]);commit();renderAll();closeModals()}
const icons=[
 {icon:'✦',tags:'star sparkle cute'},{icon:'★',tags:'star favorite'},{icon:'✓',tags:'check yes'},{icon:'♥',tags:'heart love'},{icon:'♡',tags:'heart outline'},{icon:'☀',tags:'sun weather'},{icon:'☁',tags:'cloud weather'},{icon:'⚡',tags:'flash energy'},{icon:'☕',tags:'coffee cafe'},{icon:'✎',tags:'pencil write note'},{icon:'⌂',tags:'home house'},{icon:'♬',tags:'music note song'},{icon:'⚙',tags:'settings gear'},{icon:'☻',tags:'smile face'},{icon:'⚑',tags:'flag marker'},{icon:'➜',tags:'arrow direction'},{icon:'∞',tags:'infinity math'},{icon:'⌘',tags:'command key'},{icon:'⚗',tags:'science chemistry'},{icon:'☘',tags:'clover nature'},{icon:'✿',tags:'flower blossom'},{icon:'❖',tags:'diamond gem'},{icon:'◉',tags:'circle dot'},{icon:'➤',tags:'arrow triangle'},{icon:'⬡',tags:'hexagon shape'},{icon:'◒',tags:'half moon shape'},{icon:'☂',tags:'umbrella weather'},{icon:'♛',tags:'crown queen'},{icon:'⚐',tags:'flag finish'},{icon:'⌁',tags:'wave squiggle'},{icon:'☾',tags:'moon night'},{icon:'☼',tags:'sun star'},{icon:'⌛',tags:'time hourglass'},{icon:'✈',tags:'airplane travel'},{icon:'☎',tags:'phone call'},{icon:'✉',tags:'mail envelope'},{icon:'⌨',tags:'keyboard computer'},{icon:'⏰',tags:'alarm clock time'},{icon:'📚',tags:'books school study'},{icon:'📝',tags:'notes write school'},{icon:'📌',tags:'pin office'},{icon:'📎',tags:'paperclip office'},{icon:'💡',tags:'idea bulb'},{icon:'🌿',tags:'leaf nature plant'},{icon:'🌸',tags:'flower kawaii pink'},{icon:'💗',tags:'heart pink love'},{icon:'💫',tags:'sparkle magic'},{icon:'⭐',tags:'star yellow'},{icon:'🖇',tags:'paperclip office'},{icon:'📖',tags:'book open study'},{icon:'📘',tags:'book blue school'},{icon:'📐',tags:'ruler geometry school'},{icon:'📏',tags:'ruler line school'},{icon:'🎓',tags:'education graduate school'},{icon:'🧠',tags:'brain idea study'},{icon:'🧪',tags:'science lab chemistry'},{icon:'🧮',tags:'calculator math'},{icon:'🗂',tags:'folder files'},{icon:'🧷',tags:'pin safety office'},{icon:'🎀',tags:'bow kawaii cute'},{icon:'🌼',tags:'daisy flower'},{icon:'🩷',tags:'heart pink cute'},{icon:'🫶',tags:'hands heart love'}
];
function renderIcons(query=''){
 const g=$('#iconGrid');g.innerHTML='';const q=(query||$('#iconSearch')?.value||'').trim().toLowerCase();
 icons.filter(it=>!q||`${it.icon} ${it.tags}`.toLowerCase().includes(q)).forEach(it=>{const b=document.createElement('button');b.textContent=it.icon;b.title=it.tags;b.onclick=()=>{const e=textEl('icon',uid('morph'),200,170,150,150,it.icon,92,project.theme.accent,true,'center');activeSlide().elements.push(e);selectedIds=new Set([e.id]);commit();renderAll();closeModals()};g.appendChild(b)});
 if(!g.children.length)g.innerHTML='<div class="hint">Kein Icon gefunden.</div>'
}

const templates=[
 {name:'Minimal Titel',bg:'#fffaf4',els:()=>[textEl('title',uid('morph'),100,160,770,160,'Große Idee.\nKlar erklärt.',72,'#40332e',true),textEl('text',uid('morph'),105,365,570,90,'Eine ruhige, hochwertige Titelfolie.',25,'#8f7c73'),shapeEl('circle',uid('morph'),930,150,220,220,'#f3b0aa',120)]},
 {name:'Kapitel',bg:'#f7f8ec',els:()=>[textEl('text',uid('morph'),105,130,250,50,'01  KAPITEL',20,'#829367',true),textEl('title',uid('morph'),100,215,850,160,'Eine starke\nZwischenüberschrift',65,'#394031',true),shapeEl('rect',uid('morph'),100,515,1060,8,'#aab98d',4)]},
 {name:'Vergleich',bg:'#fff9f5',els:()=>[textEl('title',uid('morph'),85,70,700,80,'A oder B?',52,'#473a34',true),shapeEl('rect',uid('morph'),80,180,520,390,'#ffe9e3',28),shapeEl('rect',uid('morph'),680,180,520,390,'#eef1df',28),textEl('text',uid('morph'),120,220,430,80,'Option A',34,'#684b45',true),textEl('text',uid('morph'),720,220,430,80,'Option B',34,'#536046',true)]},
 {name:'3 Fakten',bg:'#f5f7fb',els:()=>[textEl('title',uid('morph'),80,70,800,80,'Drei Dinge, die zählen',48,'#334b5a',true),...['01','02','03'].map((n,i)=>shapeEl('rect',uid('morph'),80+i*390,230,350,250,['#dcebf3','#f6e4df','#e7edd8'][i],28)),...['Erster Fakt','Zweiter Fakt','Dritter Fakt'].map((t,i)=>textEl('text',uid('morph'),115+i*390,280,280,80,t,29,'#40515b',true,'center'))]},
 {name:'Zitat',bg:'#2c2930',els:()=>[textEl('text',uid('morph'),110,90,150,80,'“',76,'#e3b6c7',true),textEl('title',uid('morph'),130,205,1000,220,'Eine Präsentation sollte sich nicht wie eine Textwand anfühlen.',52,'#fff8f2',true,'center'),textEl('text',uid('morph'),400,500,480,50,'— SlideBloom Studio',20,'#d4c4cb',false,'center')]},
 {name:'Prozess',bg:'#fffdf8',els:()=>[textEl('title',uid('morph'),85,65,600,80,'So funktioniert es',50,'#473a34',true),...['Idee','Aufbau','Ergebnis'].flatMap((t,i)=>[shapeEl('circle',uid('morph'),145+i*390,265,120,120,['#ef9e9c','#e8c877','#aab98d'][i],60),textEl('text',uid('morph'),110+i*390,420,190,60,t,28,'#473a34',true,'center')])]},
 {name:'Simple Explain',bg:'#fffaf5',els:()=>[textEl('title',uid('morph'),90,70,780,85,'Warum passiert das?',54,'#4a3932',true),shapeEl('circle',uid('morph'),110,215,210,210,'#f6c9b6',120),textEl('text',uid('morph'),152,278,125,70,'1',50,'#fff',true,'center'),textEl('text',uid('morph'),380,220,700,90,'Ein Gedanke nach dem anderen.',35,'#5a4841',true),textEl('text',uid('morph'),380,320,680,160,'Kurze Texte, klare Visuals und Animationen, die den Blick gezielt führen.',25,'#83726b')]},
 {name:'Timeline',bg:'#f8f3fb',els:()=>[textEl('title',uid('morph'),85,70,700,80,'Eine Entwicklung',50,'#493d52',true),shapeEl('rect',uid('morph'),120,350,1040,8,'#c5a9d6',4),...['Start','Wandel','Heute'].flatMap((t,i)=>[shapeEl('circle',uid('morph'),160+i*420,315,78,78,'#c5a9d6',50),textEl('text',uid('morph'),120+i*420,425,160,55,t,25,'#493d52',true,'center')])]},{name:'Scrapbook Notes',bg:'#eef5fb',els:()=>[shapeEl('rect',uid('morph'),85,60,1110,600,'#f7fbff',28),stickerElement('notebook'),(()=>{const e=stickerElement('polaroid');e.x=810;e.y=150;e.w=250;e.h=320;return e})(),textEl('title',uid('morph'),135,78,520,70,'Mein Thema',56,'#3f4e5b',true),textEl('text',uid('morph'),170,170,450,190,'Kurze Punkte, süße Sticker und Bilder machen die Folie lebendiger.',28,'#52616d')]},{name:'Study Board',bg:'#fffaf6',els:()=>[textEl('title',uid('morph'),95,72,500,74,'Wichtige Punkte',52,'#4d3c34',true),(()=>{const e=stickerElement('graph_torn');e.x=92;e.y=160;e.w=390;e.h=240;e.content='Definition';return e})(),(()=>{const e=stickerElement('speech');e.x=540;e.y=160;e.w=310;e.h=190;e.content='Merksatz';return e})(),(()=>{const e=stickerElement('timeline_horizontal');e.x=180;e.y=500;e.w=760;e.h=120;return e})()]},{name:'Cute Chapter',bg:'#f2fbfb',els:()=>[shapeEl('circle',uid('morph'),900,88,220,220,'#ffcfc6',120),textEl('title',uid('morph'),100,170,760,130,'Kapitel 1',76,'#387979',true),textEl('text',uid('morph'),118,288,520,70,'Ein sanfter Einstieg in das Thema',26,'#5a6d6a'),(()=>{const e=stickerElement('sparklegif');e.x=830;e.y=260;e.w=180;e.h=120;return e})()]},
 {name:'Polaroid Collage',bg:'#fff8f3',els:()=>[textEl('title',uid('morph'),85,65,650,80,'Momente & Beispiele',52,'#493c37',true),...[[90,185,-6],[420,170,4],[770,190,-3]].map(([x,y,r],i)=>{const e=stickerElement('polaroid');e.x=x;e.y=y;e.w=280;e.h=345;e.rotation=r;e.content=['Beispiel 1','Beispiel 2','Beispiel 3'][i];return e}),(()=>{const e=stickerElement('tape');e.x=535;e.y=118;e.w=220;e.h=55;e.rotation=-4;return e})()]},
 {name:'Big Number',bg:'#f7fbf8',els:()=>[textEl('text',uid('morph'),90,72,260,80,'01',24,'#8ba17b',true),textEl('title',uid('morph'),90,150,560,115,'Eine Zahl, die hängen bleibt',55,'#344238',true),textEl('title',uid('morph'),760,145,390,190,'87%',118,'#ef9e9c',true,'center'),textEl('text',uid('morph'),95,330,540,170,'Nutze diese Folie für eine wichtige Statistik, ein Ergebnis oder eine Kernaussage.',27,'#66736a'),shapeEl('rect',uid('morph'),95,560,1050,7,'#dfe9dc',4)]},
 {name:'Definition Card',bg:'#fffdf8',els:()=>[textEl('text',uid('morph'),92,72,250,45,'DEFINITION',18,'#9b8075',true),textEl('title',uid('morph'),90,130,740,92,'Was bedeutet der Begriff?',50,'#42352f',true),(()=>{const e=stickerElement('lined_torn');e.x=170;e.y=270;e.w=860;e.h=300;e.content='Begriff = kurze und verständliche Erklärung in deinen eigenen Worten.';e.stickerColor='#fffdf6';e.stickerAccent='#b8d4df';return e})()]},
 {name:'Before / After',bg:'#f9faf6',els:()=>[textEl('title',uid('morph'),85,62,700,78,'Vorher → Nachher',50,'#384036',true),shapeEl('rect',uid('morph'),80,175,500,400,'#f5e2df',30),shapeEl('rect',uid('morph'),700,175,500,400,'#e6eddc',30),textEl('title',uid('morph'),120,210,420,60,'Vorher',34,'#72524c',true,'center'),textEl('title',uid('morph'),740,210,420,60,'Nachher',34,'#536346',true,'center'),textEl('text',uid('morph'),140,320,380,160,'Problem\n• Punkt A\n• Punkt B',27,'#725f58'),textEl('text',uid('morph'),760,320,380,160,'Lösung\n• Punkt A\n• Punkt B',27,'#5c6854')]},
 {name:'Agenda Cards',bg:'#f7f5fb',els:()=>[textEl('title',uid('morph'),85,65,600,78,'Heute geht es um …',52,'#433c50',true),...['Grundlage','Beispiel','Ergebnis','Fazit'].map((t,i)=>{const e=shapeEl('rect',uid('morph'),90+(i%2)*565,190+Math.floor(i/2)*210,500,165,['#efe6f7','#e5eff7','#fbe8e2','#e9efdf'][i],26);return e}),...['01  Grundlage','02  Beispiel','03  Ergebnis','04  Fazit'].map((t,i)=>textEl('text',uid('morph'),130+(i%2)*565,245+Math.floor(i/2)*210,420,60,t,29,'#50485a',true))]},
 {name:'Photo + Erklärung',bg:'#fffaf6',els:()=>[textEl('title',uid('morph'),690,80,480,80,'Ein Bild erklärt viel',48,'#473a34',true),shapeEl('rect',uid('morph'),80,80,520,555,'#ece8e4',32),textEl('text',uid('morph'),690,205,450,220,'Nutze links ein großes Bild und rechts nur die wichtigsten Punkte. Dadurch wirkt die Folie viel ruhiger.',27,'#6e5e57'),(()=>{const e=stickerElement('sparklegif');e.x=1010;e.y=470;e.w=130;e.h=95;return e})()]},
 {name:'Study Summary',bg:'#eef6f7',els:()=>[textEl('title',uid('morph'),85,58,670,80,'Zusammenfassung',52,'#35535a',true),(()=>{const e=stickerElement('graph_torn');e.x=80;e.y=165;e.w=500;e.h=390;e.content='Kernaussage\n\n• Punkt 1\n• Punkt 2\n• Punkt 3';e.stickerColor='#fffdf8';return e})(),(()=>{const e=stickerElement('cloud');e.x=680;e.y=175;e.w=380;e.h=250;e.content='Merksatz';e.stickerColor='#fff4ee';e.stickerAccent='#ef9e9c';return e})(),textEl('text',uid('morph'),710,500,350,80,'→ Das solltest du dir merken.',24,'#4b6064',true)]},
 {name:'Clean Steps',bg:'#fffdf9',els:()=>[textEl('title',uid('morph'),90,70,700,80,'In vier Schritten',52,'#443832',true),...['1','2','3','4'].flatMap((n,i)=>[shapeEl('circle',uid('morph'),130+i*280,260,94,94,['#ef9e9c','#e8c877','#aab98d','#9db9d3'][i],60),textEl('text',uid('morph'),145+i*280,276,64,55,n,34,'#fff',true,'center'),textEl('text',uid('morph'),95+i*280,390,165,70,['Start','Verstehen','Anwenden','Fazit'][i],23,'#594c46',true,'center')])]}
];

const builtinTextStyles=[
 {id:'builtin_headline',name:'Headline',element:{type:'title',w:720,h:110,content:'Deine Überschrift',fontFamily:'Nunito',fontSize:62,fontWeight:800,fontStyle:'normal',textDecoration:'none',textAlign:'left',lineHeight:1.02,letterSpacing:-1,fill:'transparent',color:'#3c3a37',borderRadius:0,shadow:0,borderWidth:0,borderColor:'#000000',gradient:{type:'none',c1:'#ffffff',c2:'#55c7c4'},animation:{in:'up',out:'none',duration:.55,delay:0,trigger:'auto'}}},
 {id:'builtin_box',name:'Box Titel',element:{type:'title',w:540,h:92,content:'Kapitel Überschrift',fontFamily:'Nunito',fontSize:38,fontWeight:800,fontStyle:'normal',textDecoration:'none',textAlign:'center',lineHeight:1.05,letterSpacing:0,fill:'#ddf7f5',color:'#347b78',borderRadius:22,shadow:8,borderWidth:1,borderColor:'#b6e5e2',gradient:{type:'none',c1:'#ddf7f5',c2:'#ffffff'},animation:{in:'pop',out:'none',duration:.5,delay:0,trigger:'auto'}}},
 {id:'builtin_note',name:'Notiz',element:{type:'text',w:500,h:110,content:'Kurze Erklärung oder wichtiger Hinweis.',fontFamily:'Nunito',fontSize:24,fontWeight:600,fontStyle:'normal',textDecoration:'none',textAlign:'left',lineHeight:1.2,letterSpacing:0,fill:'#fff3e6',color:'#6b5547',borderRadius:20,shadow:5,borderWidth:1,borderColor:'#f0ddc9',gradient:{type:'none',c1:'#fff3e6',c2:'#fffaf4'},animation:{in:'fade',out:'none',duration:.5,delay:.1,trigger:'auto'}}}
];

const featuredFonts=[{name:'Nunito',label:'Soft & clean',sample:'Schule, aber schön.'},{name:'Quicksand',label:'Round minimal',sample:'Meine Präsentation'},{name:'Patrick Hand',label:'Handschrift',sample:'study notes ✦'},{name:'Caveat',label:'Cute handwritten',sample:'Add Title Here'},{name:'Dancing Script',label:'Elegant script',sample:'Chapter One'},{name:'Playfair Display',label:'Editorial',sample:'The Big Idea'},{name:'Cormorant Garamond',label:'Classic aesthetic',sample:'Literature & History'}];
function applyUIAccent(color){if(!color)return;uiAccent=color;document.documentElement.style.setProperty('--accent',color);STORE.setItem('slidebloom_v6_ui_accent',color);if($('#appAccentColor'))$('#appAccentColor').value=color;if($('#settingsUiAccent'))$('#settingsUiAccent').value=color}
function refreshFontSelect(){const sel=$('#fontFamily');if(!sel)return;const cur=sel.value,existing=new Set([...sel.options].map(o=>o.value));featuredFonts.forEach(f=>{if(!existing.has(f.name)){const o=document.createElement('option');o.value=o.textContent=f.name;sel.appendChild(o);existing.add(f.name)}});library.customFonts.forEach(f=>{if(!existing.has(f.name)){const o=document.createElement('option');o.value=f.name;o.textContent='★ '+f.name;sel.appendChild(o)}});if([...sel.options].some(o=>o.value===cur))sel.value=cur}
async function registerCustomFont(font){try{const ff=new FontFace(font.name,`url(${font.data})`);await ff.load();document.fonts.add(ff);return true}catch(e){console.warn('Font load failed',e);return false}}
async function registerAllCustomFonts(){for(const f of library.customFonts||[])await registerCustomFont(f);refreshFontSelect()}
function renderFeaturedFonts(){const g=$('#featuredFonts');if(!g)return;g.innerHTML='';featuredFonts.forEach(f=>{const d=document.createElement('div');d.className='font-card';d.innerHTML=`<div class="font-demo" style="font-family:'${f.name}'">${esc(f.sample)}</div><strong>${esc(f.name)}</strong><small>${esc(f.label)}</small>`;d.onclick=()=>{if(selected())updateSelected(x=>x.fontFamily=f.name);else{const e=textEl('title',uid('morph'),150,120,640,110,'Deine Überschrift',52,project.theme.ink,true);e.fontFamily=f.name;activeSlide().elements.push(e);selectedIds=new Set([e.id]);commit();renderAll()}closeModals()};g.appendChild(d)})}
function renderCustomFonts(){const g=$('#customFontsList');if(!g)return;g.innerHTML='';(library.customFonts||[]).forEach((f,i)=>{const d=document.createElement('div');d.className='custom-font-item';d.innerHTML=`<span style="font-family:'${esc(f.name)}';font-size:20px">${esc(f.name)}</span><button>⌫</button>`;d.querySelector('button').onclick=()=>{library.customFonts.splice(i,1);saveLibrary();renderCustomFonts()};g.appendChild(d)});if(!library.customFonts.length)g.innerHTML='<small class="hint">Noch keine eigenen Schriften.</small>'}
function importCustomFont(file){if(!file)return;const reader=new FileReader();reader.onload=async()=>{let name=file.name.replace(/\.(woff2?|ttf|otf)$/i,'').replace(/[-_]+/g,' ').trim()||'Meine Schrift';if(library.customFonts.some(f=>f.name===name))name+=' '+(library.customFonts.length+1);const font={id:uid('font'),name,data:reader.result};if(await registerCustomFont(font)){library.customFonts.push(font);saveLibrary();renderCustomFonts();toast(`Schrift „${name}“ hinzugefügt.`)}else toast('Diese Font-Datei konnte der Browser nicht laden.')};reader.readAsDataURL(file)}

function renderTextStyles(){const box=$('#textStyleButtons');if(!box)return;box.innerHTML='';[...builtinTextStyles,...library.textStyles].forEach(st=>{const b=document.createElement('button');b.className='text-style-chip '+(st.id.startsWith('builtin_')?'':'user');b.textContent=st.name;b.title='Klicken = neues Textelement in diesem Stil';b.onclick=()=>insertTextStyle(st);box.appendChild(b)})}
function captureTextStyle(e,name){const keys=['type','w','h','content','fontFamily','fontSize','fontWeight','fontStyle','textDecoration','textAlign','lineHeight','letterSpacing','fill','color','borderRadius','shadow','borderWidth','borderColor','gradient','animation'];const obj={};keys.forEach(k=>obj[k]=deep(e[k]));return{id:uid('style'),name,element:obj}}
function insertTextStyle(st){const src=deep(st.element),e={...textEl(src.type||'title',uid('morph'),150,120,src.w||600,src.h||100,src.content||st.name,src.fontSize||44,src.color||project.theme.ink,src.fontWeight>=700,src.textAlign||'left'),...src,id:uid('morph'),x:150,y:120,z:Math.max(0,...activeSlide().elements.map(x=>x.z||0))+1};activeSlide().elements.push(e);selectedIds=new Set([e.id]);commit();renderAll()}
function openSaveTextStyle(){const e=selected();if(!e||!['title','text','badge','icon'].includes(e.type))return toast('Erst ein Textelement auswählen und gestalten.');$('#textStyleName').value=e.type==='title'?'Meine Überschrift':'Mein Textstil';const pv=$('#stylePreview');pv.textContent=e.content||'Vorschau';Object.assign(pv.style,{fontFamily:e.fontFamily||'Nunito',fontSize:Math.min(36,e.fontSize||28)+'px',fontWeight:e.fontWeight||400,color:e.color||'#333',background:backgroundStyle(e),borderRadius:(e.borderRadius||0)+'px',boxShadow:e.shadow?'0 8px 20px #0002':'none',border:(e.borderWidth||0)?`${e.borderWidth}px solid ${e.borderColor||'#333'}`:'1px dashed #ddd'});openModal('#saveStyleModal')}
function confirmSaveTextStyle(){const e=selected(),name=$('#textStyleName').value.trim();if(!e||!name)return;library.textStyles.push(captureTextStyle(e,name));saveLibrary();closeModals();toast('Textstil „'+name+'“ gespeichert.')}
function openSaveTemplate(type){pendingTemplateType=type;$('#saveTemplateTitle').textContent=type==='slide'?'Folienvorlage speichern':'Präsentationsvorlage speichern';$('#saveTemplateHint').textContent=type==='slide'?'Speichert die aktuelle Folie als wiederverwendbares Layout.':'Speichert alle Folien inklusive Morph-Beziehungen.';$('#templateNameInput').value=type==='slide'?(activeSlide().name||'Meine Folie'):(project.name||'Meine Präsentation');openModal('#saveTemplateModal')}
function confirmSaveTemplate(){const name=$('#templateNameInput').value.trim();if(!name)return;if(pendingTemplateType==='slide'){library.slideTemplates.push({id:uid('slideTpl'),name,background:activeSlide().background,elements:deep(activeSlide().elements)})}else{library.presentationTemplates.push({id:uid('presTpl'),name,theme:deep(project.theme),slides:deep(project.slides)})}saveLibrary();closeModals();toast('Vorlage gespeichert.')}
function cloneSlideTemplate(t){const s=activeSlide(),map=new Map();s.background=t.background;s.elements=deep(t.elements).map(e=>({...e,id:uid('morph')}));selectedIds.clear();commit();renderAll();closeModals()}
function usePresentationTemplate(t){const idMap=new Map();const slides=deep(t.slides).map(s=>{s.id=uid('slide');s.elements=s.elements.map(e=>{if(!idMap.has(e.id))idMap.set(e.id,uid('morph'));e.id=idMap.get(e.id);return e});return s});project={...defaultProject(),name:t.name,theme:deep(t.theme||project.theme),slides,activeSlideId:slides[0]?.id};selectedIds.clear();history=[];commit();renderAll();closeModals();fitStage()}
function renderUserTemplates(){const sg=$('#userSlideTemplateGrid'),pg=$('#userPresentationTemplateGrid');if(!sg||!pg)return;sg.innerHTML='';pg.innerHTML='';library.slideTemplates.forEach(t=>sg.appendChild(userTemplateCard(t,'slide')));library.presentationTemplates.forEach(t=>pg.appendChild(userTemplateCard(t,'presentation')))}
function userTemplateCard(t,type){const c=document.createElement('div');c.className='template-card';const pv=document.createElement('div');pv.className='template-preview';const inn=document.createElement('div');inn.style.cssText='width:1280px;height:720px;transform:scale(.19);transform-origin:top left';pv.appendChild(inn);if(type==='slide')renderSlideTo(inn,{background:t.background,elements:t.elements},false);else renderSlideTo(inn,t.slides[0]||defaultSlide(),false);c.appendChild(pv);const nm=document.createElement('strong');nm.textContent=t.name;c.appendChild(nm);c.onclick=()=>type==='slide'?cloneSlideTemplate(t):usePresentationTemplate(t);return c}
function renderLibraryManager(){const defs=[['#manageTextStyles','textStyles'],['#manageSlideTemplates','slideTemplates'],['#managePresentationTemplates','presentationTemplates']];defs.forEach(([sel,key])=>{const box=$(sel);if(!box)return;box.innerHTML='';library[key].forEach((it,i)=>{const r=document.createElement('div');r.className='library-item';r.innerHTML=`<span>${esc(it.name)}</span><button>⌫</button>`;r.querySelector('button').onclick=()=>{library[key].splice(i,1);saveLibrary()};box.appendChild(r)});if(!library[key].length)box.innerHTML='<small class="hint">Noch nichts gespeichert.</small>'});
 const fbox=$('#manageCustomFonts');if(fbox){fbox.innerHTML='';(library.customFonts||[]).forEach((f,i)=>{const r=document.createElement('div');r.className='library-item';r.innerHTML=`<span style="font-family:'${esc(f.name)}'">${esc(f.name)}</span><button>⌫</button>`;r.querySelector('button').onclick=()=>{library.customFonts.splice(i,1);saveLibrary()};fbox.appendChild(r)});if(!library.customFonts.length)fbox.innerHTML='<small class="hint">Noch nichts gespeichert.</small>'}
}
function renderTemplates(){const g=$('#templateGrid');g.innerHTML='';templates.forEach(t=>{const c=document.createElement('div');c.className='template-card';const pv=document.createElement('div');pv.className='template-preview';const inn=document.createElement('div');inn.style.cssText='width:1280px;height:720px;transform:scale(.19);transform-origin:top left';pv.appendChild(inn);renderSlideTo(inn,{background:t.bg,elements:t.els()},false);c.appendChild(pv);const nm=document.createElement('strong');nm.textContent=t.name;c.appendChild(nm);c.onclick=()=>{const s=activeSlide();s.background=t.bg;s.elements=t.els();selectedIds.clear();commit();renderAll();closeModals()};g.appendChild(c)})}


function storyRailItemsFromInputs(){const count=clamp(+($('#railCount')?.value||5),2,8);const textItems=($('#railIcons')?.value||'').split(',').map(x=>x.trim()).filter(Boolean).map(v=>({type:'text',value:v}));const imageItems=(storyRailUploads||[]).map(it=>({type:'image',value:it.src,name:it.name||'Bild'}));const items=[];for(let i=0;i<count;i++)items.push(imageItems[i]||textItems[i]||{type:'text',value:'•'});return items}
function renderStoryRailUploadList(){const box=$('#railUploadList');if(!box)return;box.innerHTML='';if(!(storyRailUploads||[]).length){box.innerHTML='<small class="hint">Noch keine eigenen Story-Rail-Symbole.</small>';return}storyRailUploads.forEach((it,i)=>{const row=document.createElement('div');row.className='storyrail-upload-item';row.innerHTML=`<img src="${it.src}" alt=""><span>${esc(it.name||'Bild')}</span><button class="icon-btn" type="button">×</button>`;row.querySelector('button').onclick=()=>{storyRailUploads.splice(i,1);renderStoryRailUploadList()};box.appendChild(row)})}
function clearStoryRail(silent=false){project.slides.forEach(s=>s.elements=s.elements.filter(e=>e.role!=='storyRail'));project.storyRail=null;if(!silent){commit();renderAll();toast('Story Rail gelöscht.')}}
function fillStoryRailModal(){const sr=project.storyRail||{};$('#railSide').value=sr.side||'left';$('#railAccent').value=sr.accent||project.theme.accent||'#ef9e9c';const items=sr.items||[];$('#railCount').value=items.length||5;const texts=items.map(x=>x.type==='text'?x.value:'').filter(Boolean);$('#railIcons').value=texts.length?texts.join(','):'⌂,⌕,▤,☼,✓';storyRailUploads=items.filter(x=>x.type==='image').map((x,i)=>({src:x.value,name:x.name||`Bild ${i+1}`}));renderStoryRailUploadList()}
function buildStoryRail(){
 const side=$('#railSide').value||'left',accent=$('#railAccent').value||project.theme.accent||'#ef9e9c',items=storyRailItemsFromInputs(),count=items.length;
 const nodeX=side==='left'?24:W-78,startY=82,endY=H-82,gap=count>1?(endY-startY)/(count-1):0,nodeYs=[...Array(count)].map((_,i)=>startY+i*gap);
 clearStoryRail(true);
 project.slides.forEach((s,slideIndex)=>{const active=Math.min(slideIndex,count-1);items.forEach((item,n)=>{
   if(item.type==='image'){const node={...shapeEl('image',`storyrail_node_${n}`,nodeX,nodeYs[n]-25,52,52,'transparent',999),src:item.value,objectFit:'contain',cropZoom:100,cropX:50,cropY:50,z:902,locked:true,role:'storyRail',mask:'circle',shadow:0,borderWidth:0,animation:{in:'none',out:'none',duration:.2,delay:0,trigger:'auto'}};s.elements.push(node)}
   else{const node=textEl('icon',`storyrail_node_${n}`,nodeX,nodeYs[n]-25,52,52,item.value,29,n===active?accent:'#8f8b88',true,'center');Object.assign(node,{z:902,locked:true,role:'storyRail',animation:{in:'none',out:'none',duration:.2,delay:0,trigger:'auto'}});s.elements.push(node)}
  });
  const ring={...shapeEl('circle','storyrail_active_ring',nodeX-9,nodeYs[active]-34,70,70,'transparent',999),z:901,locked:true,role:'storyRail',shadow:0,borderWidth:5,borderColor:accent};s.elements.push(ring);
  if(slideIndex>0){s.transition='morph';s.transitionDuration=Math.max(.55,s.transitionDuration||.7)}
 });
 project.storyRail={side,accent,items};commit();renderAll();closeModals();toast('Story Rail angewendet.')
}
function refreshStoryRail(){fillStoryRailModal();openModal('#storyRailModal')}
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
function previewTimeline(){const s=activeSlide();renderStage();const max=Math.max(1,...s.elements.map(e=>(e.animation?.delay||0)+(e.animation?.duration||.6)));const t0=performance.now();s.elements.forEach(e=>{const n=UI.stage.querySelector(`[data-id="${CSS.escape(e.id)}"]`);if(n){if(!playTypewriter(n,e))playEntrance(n,e.animation)}});const tick=now=>{playheadTime=Math.min(max,(now-t0)/1000);$('#timelinePlayhead').style.left=(150+playheadTime*timelineScale)+'px';if(playheadTime<max)requestAnimationFrame(tick)};requestAnimationFrame(tick)}
function openTimeline(){UI.timeline.classList.add('open');renderTimeline()}function closeTimeline(){UI.timeline.classList.remove('open')}


function smoothPoints(points,amount=58){if(points.length<3)return points;const passes=Math.round(amount/22);let out=points.map(p=>({...p}));for(let k=0;k<passes;k++){let next=[out[0]];for(let i=1;i<out.length-1;i++)next.push({x:(out[i-1].x+out[i].x*2+out[i+1].x)/4,y:(out[i-1].y+out[i].y*2+out[i+1].y)/4});next.push(out.at(-1));out=next}return out}
function pointsToSmoothPath(points,closed=false){if(points.length<2)return'';let d=`M ${points[0].x} ${points[0].y}`;for(let i=1;i<points.length-1;i++){const mx=(points[i].x+points[i+1].x)/2,my=(points[i].y+points[i+1].y)/2;d+=` Q ${points[i].x} ${points[i].y} ${mx} ${my}`}d+=` L ${points.at(-1).x} ${points.at(-1).y}`;if(closed)d+=' Z';return d}
function makeDrawingFromAbsolute(points,pathBuilder,closed=false){const minx=Math.min(...points.map(p=>p.x)),miny=Math.min(...points.map(p=>p.y)),maxx=Math.max(...points.map(p=>p.x)),maxy=Math.max(...points.map(p=>p.y)),pad=Math.max(8,drawSettings.width*2),x=Math.max(0,minx-pad),y=Math.max(0,miny-pad),w=Math.max(20,maxx-minx+pad*2),h=Math.max(20,maxy-miny+pad*2),local=points.map(p=>({x:p.x-x,y:p.y-y}));return{...shapeEl('drawing',uid('morph'),x,y,w,h,drawSettings.fillEnabled?drawSettings.fill:'transparent',0),path:pathBuilder(local),color:drawSettings.stroke,strokeWidth:drawSettings.width,lineCap:'round',pathFillEnabled:!!(closed&&drawSettings.fillEnabled),closed}}
function curvePath(points){if(points.length<2)return'';const a=points[0],b=points.at(-1),dx=b.x-a.x,dy=b.y-a.y;return`M ${a.x} ${a.y} C ${a.x+dx*.28} ${a.y-dy*.28}, ${b.x-dx*.28} ${b.y+dy*.28}, ${b.x} ${b.y}`}
function drawingStart(ev){if(!drawMode||!UI.stage.contains(ev.target))return;ev.preventDefault();ev.stopPropagation();const first=stagePoint(ev),pts=[first];const move=mv=>{const p=stagePoint(mv);if(drawMode==='freehand'||drawMode==='blob')pts.push(p);else pts[1]=p;const smooth=smoothPoints(pts,drawSettings.smoothing);let tempPath=drawMode==='line'?`M ${first.x} ${first.y} L ${p.x} ${p.y}`:drawMode==='curve'?curvePath([first,p]):pointsToSmoothPath(smooth,drawMode==='blob');drawTempPathAbsolute(tempPath,drawMode==='blob'&&drawSettings.fillEnabled)};const up=()=>{window.removeEventListener('pointermove',move);$('.temp-drawing')?.remove();if(pts.length<2){drawMode=null;document.body.classList.remove('draw-mode');return}let e;if(drawMode==='line')e=makeDrawingFromAbsolute(pts,p=>`M ${p[0].x} ${p[0].y} L ${p[1].x} ${p[1].y}`,false);else if(drawMode==='curve')e=makeDrawingFromAbsolute(pts,p=>curvePath(p),false);else{const sm=smoothPoints(pts,drawSettings.smoothing),closed=drawMode==='blob';e=makeDrawingFromAbsolute(sm,p=>pointsToSmoothPath(p,closed),closed)}e.z=Math.max(0,...activeSlide().elements.map(x=>x.z||0))+1;activeSlide().elements.push(e);selectedIds=new Set([e.id]);drawMode=null;document.body.classList.remove('draw-mode');commit();renderAll();toast('SVG-Pfad erstellt – Füllung und Kontur bleiben editierbar.')};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true})}
function drawTempPathAbsolute(path,fill=false){let temp=$('.temp-drawing');if(!temp){temp=document.createElementNS('http://www.w3.org/2000/svg','svg');temp.classList.add('temp-drawing');Object.assign(temp.style,{position:'absolute',inset:'0',width:'1280px',height:'720px',pointerEvents:'none',zIndex:'999'});UI.stage.appendChild(temp)}temp.innerHTML=`<path d="${path}" fill="${fill?drawSettings.fill:'none'}" stroke="${drawSettings.stroke}" stroke-width="${drawSettings.width}" stroke-linecap="round" stroke-linejoin="round"/>`}
UI.stage.addEventListener('pointerdown',drawingStart);

function renderLayers(){
 const list=$('#layersList');if(!list)return;list.innerHTML='';[...activeSlide().elements].sort((a,b)=>(b.z||0)-(a.z||0)).forEach(e=>{const r=document.createElement('div');r.className='layer-row '+(selectedIds.has(e.id)?'active':'');r.innerHTML=`<button data-vis>${e.hidden?'○':'◉'}</button><button data-lock>${e.locked?'🔒':'🔓'}</button><span class="grow">${esc(elmap[e.type]||e.type)} ${esc((e.content||e.name||'').slice(0,22))}</span>`;r.querySelector('.grow').onclick=()=>selectElement(e.id,false);r.querySelector('[data-vis]').onclick=()=>{e.hidden=!e.hidden;commit();renderAll()};r.querySelector('[data-lock]').onclick=()=>{e.locked=!e.locked;commit();renderAll()};list.appendChild(r)});
 const cl=$('#commentsList');cl.innerHTML='';(activeSlide().comments||[]).forEach(c=>{const d=document.createElement('div');d.className='comment-card';d.innerHTML=`<div>${esc(c.text)}</div><small>${new Date(c.time).toLocaleString('de-DE')}</small>`;cl.appendChild(d)})
}
function addComment(){openModal('#commentModal');$('#commentText').value='';setTimeout(()=>$('#commentText').focus(),30)}
function saveComment(){const text=$('#commentText').value.trim();if(!text)return;activeSlide().comments ||= [];activeSlide().comments.push({id:uid('comment'),text,time:Date.now(),elementIds:[...selectedIds]});commit();renderLayers();closeModals();toast('Kommentar gespeichert.')}

function renderMediaLibrary(){const g=$('#mediaLibraryGrid');g.innerHTML='';mediaStore.forEach(m=>{const c=document.createElement('div');c.className='media-card';if(m.type==='video'){const v=document.createElement('video');v.src=m.src;v.muted=true;c.appendChild(v)}else if(m.type==='svg')c.innerHTML=m.src;else{const im=document.createElement('img');im.src=m.src;c.appendChild(im)};c.title=m.name;c.onclick=()=>{const type=m.type==='svg'?'svg':m.type==='video'?'video':'image';let e;if(type==='svg')e={...shapeEl('svg',uid('morph'),180,130,430,330,'transparent',0),svg:m.src,name:m.name};else e={...shapeEl(type,uid('morph'),180,130,480,330,'transparent',24),src:m.src,name:m.name,objectFit:'cover',cropZoom:100,cropX:50,cropY:50,brightness:100,contrast:100,saturate:100,blur:0,mask:'none'};activeSlide().elements.push(e);selectedIds=new Set([e.id]);commit();renderAll();closeModals()};g.appendChild(c)})}


function normalizeProject(p){p ||= defaultProject();p.id ||= uid('project');p.createdAt ||= Date.now();p.updatedAt ||= Date.now();p.appVersion=APP_VERSION;p.theme ||= {ink:appSettings.defaultInk||'#3c312d',accent:appSettings.defaultAccent||'#ef9e9c',bg:appSettings.defaultBg||'#fffdf8'};p.slides ||= [];if(!p.slides.length)p.slides=[defaultSlide()];p.slides.forEach((s,i)=>{s.id ||= uid('slide');s.name ||= 'Folie '+(i+1);s.background ||= p.theme.bg||appSettings.defaultBg||'#fffdf8';s.elements ||= [];s.comments ||= [];s.elements.forEach(el=>{if(el.type==='star'){el.starPoints ||=5;if(el.starInnerRatio===undefined)el.starInnerRatio=.42}if(['triangle','star','diamond','hexagon','polygon','speechbubble','burst'].includes(el.type)&&el.shapeRoundness===undefined)el.shapeRoundness=0;if(el.type==='sticker'&&el.stickerKind==='milestone_card')el.milestoneNumber ||= '01'})});if(!p.activeSlideId||!p.slides.some(s=>s.id===p.activeSlideId))p.activeSlideId=p.slides[0].id;return p}
function renderProjects(){const g=$('#projectsGrid');if(!g)return;g.innerHTML='';const all=Object.values(projectRegistry).map(normalizeProject).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));if(!all.length){g.innerHTML='<div class="hint">Noch keine gespeicherten Präsentationen.</div>';return}all.forEach(p=>{const card=document.createElement('div');card.className='project-card';const preview=document.createElement('div');preview.className='project-preview';const inn=document.createElement('div');inn.className='project-preview-inner';preview.appendChild(inn);if(p.slides?.[0])renderSlideTo(inn,p.slides[0],false);card.appendChild(preview);const meta=document.createElement('div');meta.className='project-meta';meta.innerHTML=`<div class="project-meta-row"><strong>${esc(p.name||'Ohne Titel')}</strong><span>${p.id===project.id?'●':''}</span></div><small>${p.slides?.length||0} Folien · ${new Date(p.updatedAt||Date.now()).toLocaleDateString('de-DE')}</small><div class="project-menu"><button data-open>Öffnen</button><button data-copy>⧉ Kopie</button><button data-del>⌫</button></div>`;card.appendChild(meta);meta.querySelector('[data-open]').onclick=e=>{e.stopPropagation();openStoredProject(p.id)};meta.querySelector('[data-copy]').onclick=e=>{e.stopPropagation();duplicateStoredProject(p.id)};meta.querySelector('[data-del]').onclick=e=>{e.stopPropagation();deleteStoredProject(p.id)};card.onclick=()=>openStoredProject(p.id);g.appendChild(card)})}
function openStoredProject(id){const p=projectRegistry[id];if(!p)return;saveProject();project=deep(p);normalizeProject(project);project.activeSlideId=project.activeSlideId||project.slides?.[0]?.id;selectedIds.clear();history=[JSON.stringify(project)];renderAll();closeModals();fitStage();touchSave()}
function createNewProject(){saveProject();const s=defaultSlide();project={...defaultProject(),name:'Neue Präsentation',slides:[s],activeSlideId:s.id};normalizeProject(project);selectedIds.clear();history=[JSON.stringify(project)];commit();renderAll();closeModals();fitStage()}
function duplicateStoredProject(id){const p=projectRegistry[id];if(!p)return;const c=deep(p);c.id=uid('project');c.name=(c.name||'Präsentation')+' – Kopie';c.createdAt=c.updatedAt=Date.now();projectRegistry[c.id]=c;saveProjectRegistry();renderProjects();toast('Präsentation kopiert.')}
function deleteStoredProject(id){if(!projectRegistry[id])return;if(id===project.id){delete projectRegistry[id];saveProjectRegistry();createNewProject();return}delete projectRegistry[id];saveProjectRegistry();renderProjects()}
function saveCurrentAsCopy(){saveProject();duplicateStoredProject(project.id)}

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
function importProject(file){const r=new FileReader();r.onload=()=>{try{project=normalizeProject(JSON.parse(r.result));project.id=uid('project');project.activeSlideId=project.slides[0]?.id;selectedIds.clear();history=[JSON.stringify(project)];renderAll();saveProject();closeModals();toast('Projekt importiert.')}catch{toast('Ungültige Projektdatei.')}};r.readAsText(file)}
function slug(s){return(s||'presentation').toLowerCase().replace(/[^a-z0-9äöüß]+/gi,'-').replace(/^-|-$/g,'')}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function standaloneHTML(){
 const payload=JSON.stringify(project).replace(/</g,'\\u003c');
 return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(project.name)}</title><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#111;font-family:Arial,sans-serif}.stage{width:1280px;height:720px;position:absolute;left:50%;top:50%;transform-origin:center;overflow:hidden}.el{position:absolute;display:flex;transform-origin:center}.c{width:100%;height:100%;display:flex;align-items:center;white-space:pre-wrap;word-break:break-word}.nav{position:fixed;bottom:14px;left:50%;transform:translateX(-50%);padding:6px;background:#0008;border-radius:14px;color:white;z-index:9}.nav button{border:0;background:#ffffff22;color:white;padding:8px 13px;border-radius:10px;margin:0 3px}</style></head><body><div class="stage" id="s"></div><div class="nav"><button id="p">‹</button><span id="n"></span><button id="x">›</button></div><script>const P=${payload},W=1280,H=720,s=document.getElementById('s');let i=0;function sc(){let k=Math.min(innerWidth/W,innerHeight/H);s.style.transform='translate(-50%,-50%) scale('+k+')'}addEventListener('resize',sc);sc();function bg(e){let g=e.gradient||{};return g.type==='linear'?'linear-gradient(135deg,'+g.c1+','+g.c2+')':g.type==='radial'?'radial-gradient(circle,'+g.c1+','+g.c2+')':(e.fill||'transparent')}function pd(p){let x=p.x||0,y=p.y||0,w=Math.max(1,p.w||1),h=Math.max(1,p.h||1);if(p.type==='rect')return'M'+x+' '+y+'H'+(x+w)+'V'+(y+h)+'H'+x+'Z';if(p.type==='circle'){let cx=x+w/2,cy=y+h/2,rx=w/2,ry=h/2;return'M'+(cx-rx)+' '+cy+'A'+rx+' '+ry+' 0 1 0 '+(cx+rx)+' '+cy+'A'+rx+' '+ry+' 0 1 0 '+(cx-rx)+' '+cy+'Z'}if(p.type==='triangle')return'M'+(x+w/2)+' '+y+'L'+(x+w)+' '+(y+h)+'L'+x+' '+(y+h)+'Z';if(p.type==='star'){let a=[];let cx=x+w/2,cy=y+h/2,ro=Math.min(w,h)/2,ri=ro*.43;for(let i=0;i<10;i++){let ang=-Math.PI/2+i*Math.PI/5,r=i%2?ri:ro;a.push([cx+Math.cos(ang)*r,cy+Math.sin(ang)*r])}return a.map((q,i)=>(i?'L':'M')+q[0]+' '+q[1]).join('')+'Z'}return''}function comp(e){let ps=e.parts||[],id='x'+String(e.id).replace(/[^a-z0-9]/gi,''),f=e.fill||'#ef9e9c',op=e.operation||'union',all=ps.map(pd).join(' ');if(op==='subtract'&&ps.length>=2)return'<svg viewBox=\"0 0 '+e.w+' '+e.h+'\" width=\"100%\" height=\"100%\"><defs><mask id=\"m'+id+'\"><rect width=\"100%\" height=\"100%\" fill=\"black\"/><path d=\"'+pd(ps[0])+'\" fill=\"white\"/>'+ps.slice(1).map(q=>'<path d=\"'+pd(q)+'\" fill=\"black\"/>').join('')+'</mask></defs><rect width=\"100%\" height=\"100%\" fill=\"'+f+'\" mask=\"url(#m'+id+')\"/></svg>';if(op==='intersect'&&ps.length===2)return'<svg viewBox=\"0 0 '+e.w+' '+e.h+'\" width=\"100%\" height=\"100%\"><defs><clipPath id=\"c'+id+'\"><path d=\"'+pd(ps[1])+'\"/></clipPath></defs><path d=\"'+pd(ps[0])+'\" fill=\"'+f+'\" clip-path=\"url(#c'+id+')\"/></svg>';return'<svg viewBox=\"0 0 '+e.w+' '+e.h+'\" width=\"100%\" height=\"100%\"><path d=\"'+all+'\" fill=\"'+f+'\" fill-rule=\"'+(op==='exclude'?'evenodd':'nonzero')+'\"/></svg>'}function node(e){let d=document.createElement('div');d.className='el';d.dataset.id=e.id;Object.assign(d.style,{left:e.x+'px',top:e.y+'px',width:e.w+'px',height:e.h+'px',transform:'rotate('+(e.rotation||0)+'deg)',opacity:e.opacity??1,zIndex:e.z||1,background:bg(e),borderRadius:(e.borderRadius||0)+'px',boxShadow:e.shadow?'0 10px '+e.shadow*1.5+'px #0002':'none'});let c=document.createElement('div');c.className='c';if(e.type==='compound'){c.innerHTML=comp(e);d.style.background='transparent'}else if(e.type==='image'||e.type==='video'){let m=e.type==='video'&&!String(e.src||'').startsWith('data:image/gif')?document.createElement('video'):document.createElement('img');m.src=e.src||'';m.style.cssText='width:100%;height:100%;object-fit:'+(e.objectFit||'cover')+';object-position:'+(e.cropX??50)+'% '+(e.cropY??50)+'%;transform:scale('+((e.cropZoom??100)/100)+');filter:brightness('+(e.brightness??100)+'%) contrast('+(e.contrast??100)+'%) saturate('+(e.saturate??100)+'%) blur('+(e.blur??0)+'px)';if(m.tagName==='VIDEO'){m.autoplay=!!e.autoplay;m.loop=!!e.loop;m.muted=true;m.playsInline=true}c.appendChild(m)}else if(e.type==='svg')c.innerHTML=e.svg||'';else if(e.type==='chart')c.innerHTML='<div style="display:grid;place-items:center;width:100%;height:100%;font-size:28px">▥ Diagramm</div>';else if(e.type==='table')c.innerHTML='<div style="display:grid;place-items:center;width:100%;height:100%;font-size:28px">▦ Tabelle</div>';else if(e.type==='audio'){c.innerHTML='<div style="display:grid;place-items:center;width:100%;height:100%">♫ Audio</div>';if(e.autoplay){let a=new Audio(e.src);a.loop=!!e.loop;a.play().catch(()=>{})}}else{c.textContent=e.content||'';Object.assign(c.style,{color:e.color||'#333',fontFamily:e.fontFamily||'Arial',fontSize:(e.fontSize||28)+'px',fontWeight:e.fontWeight||400,fontStyle:e.fontStyle||'normal',textDecoration:e.textDecoration||'none',textAlign:e.textAlign||'left',justifyContent:e.textAlign==='center'?'center':e.textAlign==='right'?'flex-end':'flex-start',padding:e.type==='badge'?'12px 20px':'0',lineHeight:e.lineHeight||1.12,letterSpacing:(e.letterSpacing||0)+'px'})}d.appendChild(c);return d}function render(sl){s.innerHTML='';s.style.background=sl.background;[...sl.elements].sort((a,b)=>(a.z||0)-(b.z||0)).forEach(e=>s.appendChild(node(e)));document.getElementById('n').textContent=(i+1)+' / '+P.slides.length}function go(dir){let ni=i+dir;while(ni>=0&&ni<P.slides.length&&P.slides[ni].hidden)ni+=dir;if(ni<0||ni>=P.slides.length)return;let a=P.slides[i],b=P.slides[ni];i=ni;if(dir>0&&b.transition==='morph')morph(a,b);else render(b)}function morph(a,b){let D=(b.transitionDuration||.7)*1000,am=new Map(a.elements.map(e=>[e.id,e])),bm=new Map(b.elements.map(e=>[e.id,e])),nodes=[...s.querySelectorAll('.el')];b.elements.filter(e=>!am.has(e.id)).forEach(e=>{let n=node(e);n.style.opacity=0;s.appendChild(n);n.animate([{opacity:0},{opacity:e.opacity??1}],{duration:D,fill:'forwards'})});nodes.forEach(n=>{let A=am.get(n.dataset.id),B=bm.get(n.dataset.id);if(!B){n.animate([{opacity:A.opacity??1},{opacity:0}],{duration:D*.65,fill:'forwards'});return}n.animate([{left:A.x+'px',top:A.y+'px',width:A.w+'px',height:A.h+'px',transform:'rotate('+(A.rotation||0)+'deg)',opacity:A.opacity??1,background:bg(A),borderRadius:(A.borderRadius||0)+'px'},{left:B.x+'px',top:B.y+'px',width:B.w+'px',height:B.h+'px',transform:'rotate('+(B.rotation||0)+'deg)',opacity:B.opacity??1,background:bg(B),borderRadius:(B.borderRadius||0)+'px'}],{duration:D,easing:'cubic-bezier(.22,.88,.25,1)',fill:'forwards'})});s.animate([{background:a.background},{background:b.background}],{duration:D,fill:'forwards'});setTimeout(()=>render(b),D+20);document.getElementById('n').textContent=(i+1)+' / '+P.slides.length}document.getElementById('x').onclick=()=>go(1);document.getElementById('p').onclick=()=>go(-1);addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key===' ')go(1);if(e.key==='ArrowLeft')go(-1)});render(P.slides[0]);<\/script></body></html>`
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
$('#chartBtn').onclick=()=>openModal('#chartModal');$('#tableBtn').onclick=()=>openModal('#tableModal');$('#iconBtn').onclick=()=>{renderIcons('');openModal('#iconModal')};$('#openIcons8Btn').onclick=()=>window.open('https://icons8.com/icons','_blank','noopener');$('#templateBtn').onclick=()=>openModal('#templateModal');$('#quickTimelineBtn').onclick=()=>{const e=stickerElement('timeline_horizontal');e.z=Math.max(0,...activeSlide().elements.map(x=>x.z||0))+1;activeSlide().elements.push(e);selectedIds=new Set([e.id]);commit();renderAll()};$('#quickMilestoneBtn').onclick=()=>{const e=stickerElement('milestone_card');e.z=Math.max(0,...activeSlide().elements.map(x=>x.z||0))+1;activeSlide().elements.push(e);selectedIds=new Set([e.id]);commit();renderAll()};
$('#insertChartBtn').onclick=insertChart;$('#insertTableBtn').onclick=insertTable;

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
let panStart=null;UI.viewport.addEventListener('pointerdown',e=>{if(!(panMode||spacePan))return;panStart={x:e.clientX,y:e.clientY,sl:UI.viewport.scrollLeft,st:UI.viewport.scrollTop};const mv=m=>{UI.viewport.scrollLeft=panStart.sl-(m.clientX-panStart.x);UI.viewport.scrollTop=panStart.st-(m.clientY-panStart.y)};const up=()=>window.removeEventListener('pointermove',mv);window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up,{once:true})});
$('#panBtn').onclick=()=>{panMode=!panMode;$('#panBtn').classList.toggle('active',panMode);UI.viewport.classList.toggle('panning',panMode);toast(panMode?'Pan aktiv – ziehen zum Verschieben':'Pan aus')};
$('#openRightDockBtn').onclick=()=>{$('#inspector').classList.remove('dock-collapsed');setRightDockMode('properties')};
$('#closeRightPanels').onclick=()=>{$('#inspector').classList.toggle('dock-collapsed');$('#closeRightPanels').textContent=$('#inspector').classList.contains('dock-collapsed')?'›':'‹'};
$('#presentBtn').onclick=()=>showPresentation();$('#nextPresent').onclick=()=>nextPresent(1);$('#prevPresent').onclick=()=>nextPresent(-1);$('#exitPresent').onclick=exitPresent;$('#presentNotesBtn').onclick=()=>$('#presentNotes').classList.toggle('hidden');$('#presentTimerBtn').onclick=toggleTimer;$('#laserBtn').onclick=toggleLaser;
$('#exportBtn').onclick=()=>openModal('#exportModal');$('#exportProjectBtn').onclick=exportProject;$('#importProjectBtn').onclick=()=>$('#importInput').click();$('#importInput').onchange=e=>e.target.files[0]&&importProject(e.target.files[0]);$('#exportHtmlBtn').onclick=()=>download(new Blob([standaloneHTML()],{type:'text/html'}),`${slug(project.name)}-presentation.html`);$('#printPdfBtn').onclick=printPDF;
$('#toggleSlides').onclick=()=>$('#slidesPanel').classList.toggle('open');$('#closeSlides').onclick=closeMobileSlides;
$('#mobileSlidesBtn').onclick=()=>$('#slidesPanel').classList.toggle('open');
$('#mobileEditBtn').onclick=openInspectorMobile;
$('#closeInspectorMobile').onclick=closeInspectorMobile;
$('#mobileFitBtn').onclick=()=>{zoomMode='fit';fitStage()};
const rightLayerHost=$('#rightDockLayerHost'),layersPanel=$('#layersPanel');if(rightLayerHost&&layersPanel)rightLayerHost.appendChild(layersPanel);
function setRightDockMode(mode='properties'){
 UI.inspector.classList.remove('hidden');UI.inspector.classList.toggle('animation-mode',mode==='animation');UI.inspector.classList.toggle('layers-mode',mode==='layers');
 [$('#openInspectorPanel'),$('#openLayersPanel2'),$('#openAnimationPanel')].forEach(b=>b?.classList.remove('active'));
 if(mode==='layers'){
   $('#openLayersPanel2')?.classList.add('active');rightLayerHost?.classList.remove('hidden');layersPanel?.classList.remove('hidden');UI.empty.classList.add('hidden');UI.content.classList.add('hidden');renderLayers();
 }else{
   rightLayerHost?.classList.add('hidden');layersPanel?.classList.add('hidden');(mode==='animation'?$('#openAnimationPanel'):$('#openInspectorPanel'))?.classList.add('active');renderInspector();
   if(mode==='animation'&&selectedIds.size){setTimeout(()=>$('#animationControls')?.scrollIntoView({block:'start',behavior:'smooth'}),20)}
 }
}
$('#toggleLayersBtn').onclick=()=>setRightDockMode('layers');$('#closeLayers').onclick=()=>setRightDockMode('properties');$('#openLayersPanel2').onclick=()=>setRightDockMode('layers');$('#openInspectorPanel').onclick=()=>setRightDockMode('properties');$('#openAnimationPanel').onclick=()=>setRightDockMode('animation');$('#selectAllBtn').onclick=()=>{selectedIds=new Set(activeSlide().elements.map(e=>e.id));renderAll()};$('#addCommentBtn').onclick=addComment;$('#saveCommentBtn').onclick=saveComment;$('#clearCommentsBtn').onclick=()=>{activeSlide().comments=[];commit();renderLayers()};
$('#mediaLibraryBtn').onclick=()=>{renderMediaLibrary();openModal('#mediaLibraryModal')};

$('#saveTextStyleBtn').onclick=openSaveTextStyle;$('#confirmSaveTextStyleBtn').onclick=confirmSaveTextStyle;$('#manageLibraryBtn').onclick=()=>{renderLibraryManager();openModal('#libraryModal')};
$('#saveSlideTemplateBtn').onclick=()=>openSaveTemplate('slide');$('#savePresentationTemplateBtn').onclick=()=>openSaveTemplate('presentation');$('#confirmSaveTemplateBtn').onclick=confirmSaveTemplate;$('#userTemplatesBtn').onclick=()=>{renderUserTemplates();openModal('#templateModal')};
$('#applyBgAllBtn').onclick=()=>{const bg=activeSlide().background;project.slides.forEach(s=>s.background=bg);commit();renderAll();toast('Hintergrund auf alle Folien angewendet.')};
$('#addStoryRailBtn').onclick=()=>{fillStoryRailModal();openModal('#storyRailModal')};$('#confirmStoryRailBtn').onclick=buildStoryRail;$('#refreshStoryRailBtn').onclick=refreshStoryRail;$('#clearStoryRailBtn').onclick=()=>{clearStoryRail();closeModals()};$('#railImageInput').onchange=e=>{const files=[...(e.target.files||[])];if(!files.length)return;const valid=files.filter(f=>!f.name.toLowerCase().endsWith('.ai'));if(valid.length!==files.length)toast('Illustrator-.ai kann der Browser nicht direkt anzeigen. Bitte als SVG oder PNG exportieren.');Promise.all(valid.map(file=>new Promise(res=>{const r=new FileReader();r.onload=()=>res({name:file.name,src:r.result});r.readAsDataURL(file)}))).then(items=>{storyRailUploads.push(...items);renderStoryRailUploadList();e.target.value=''})};
$$('[data-pathfinder]').forEach(b=>b.onclick=()=>combineShapes(b.dataset.pathfinder));
$$('[data-openpanel]').forEach(b=>b.onclick=()=>openPanel(b.dataset.openpanel));$('#quickLayersBtn')?.addEventListener('click',()=>setRightDockMode('layers'));
function openPanel(name){const tab=$(`.ribbon-tab[data-panel="${name}"]`);if(tab)tab.click()}


function bindChange(sel,fn){$(sel).onchange=e=>updateSelected(x=>fn(x,e.target.value,e.target))}
function bindLive(sel,fn){$(sel).oninput=e=>liveSelected(x=>fn(x,e.target.value,e.target));$(sel).onchange=()=>{commit();renderSlides();renderInspector();renderLayers()}}
bindChange('#fontFamily',(x,v)=>x.fontFamily=v);bindChange('#fontSize',(x,v)=>x.fontSize=+v);
bindLive('#fillColor',(x,v)=>{x.fill=v;if(x.gradient)x.gradient.c1=v});bindLive('#elementColor',(x,v)=>x.color=v);
bindChange('#gradientType',(x,v)=>{x.gradient||={};x.gradient.type=v});bindLive('#gradientColor1',(x,v)=>{x.gradient||={};x.gradient.c1=v});bindLive('#gradientColor2',(x,v)=>{x.gradient||={};x.gradient.c2=v});
bindLive('#opacityRange',(x,v)=>x.opacity=+v/100);bindLive('#radiusRange',(x,v)=>{if(x.type!=='circle'&&x.type!=='capsule')x.borderRadius=+v});bindLive('#shadowRange',(x,v)=>x.shadow=+v);bindLive('#shadowXRange',(x,v)=>x.shadowX=+v);bindLive('#shadowYRange',(x,v)=>x.shadowY=+v);bindLive('#shadowOpacityRange',(x,v)=>x.shadowOpacity=+v);bindLive('#shadowHardXRange',(x,v)=>x.shadowHardX=+v);bindLive('#shadowHardYRange',(x,v)=>x.shadowHardY=+v);bindLive('#shadowHardOpacityRange',(x,v)=>x.shadowHardOpacity=+v);bindLive('#featherRange',(x,v)=>x.feather=+v);bindLive('#borderRange',(x,v)=>{x.borderWidth=+v;x.borderColor=x.color||'#333'});bindLive('#textBgColor',(x,v)=>x.textBgColor=v);bindChange('#textBgToggle',(x,v)=>x.textBgEnabled=!!v);
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


$('#stickerTextInput').onchange=e=>updateSelected(x=>{if(x.type==='sticker')x.content=e.target.value});
$('#stickerColor').oninput=e=>liveSelected(x=>{if(x.type==='sticker'){x.stickerColor=e.target.value;x.fill=e.target.value}});$('#stickerColor').onchange=()=>{commit();renderSlides()};
$('#stickerAccentColor').oninput=e=>liveSelected(x=>{if(x.type==='sticker')x.stickerAccent=e.target.value});$('#stickerAccentColor').onchange=()=>{commit();renderSlides()};$('#stickerTextX').oninput=e=>liveSelected(x=>{if(x.type==='sticker')x.stickerTextX=+e.target.value});$('#stickerTextX').onchange=()=>{commit();renderSlides()};$('#stickerTextY').oninput=e=>liveSelected(x=>{if(x.type==='sticker')x.stickerTextY=+e.target.value});$('#stickerTextY').onchange=()=>{commit();renderSlides()};
$('#stickerImageBtn').onclick=()=>{const e=selected();if(e?.type==='sticker'&&!['polaroid','polaroid_stack'].includes(e.stickerKind))return toast('Ein Bild-Slot ist bei Polaroid-Stickern verfügbar.');$('#stickerImageInput').click()};
$('#stickerImageInput').onchange=e=>{const file=e.target.files[0],st=selected();if(!file||st?.type!=='sticker')return;const r=new FileReader();r.onload=()=>{st.imageSrc=r.result;commit();renderAll()};r.readAsDataURL(file)};
$('#pathStrokeWidth').oninput=e=>liveSelected(x=>{if(x.type==='drawing')x.strokeWidth=+e.target.value});$('#pathStrokeWidth').onchange=()=>{commit();renderSlides()};
$('#pathLineCap').onchange=e=>updateSelected(x=>{if(x.type==='drawing')x.lineCap=e.target.value});$('#pathFillToggle').onchange=e=>updateSelected(x=>{if(x.type==='drawing')x.pathFillEnabled=e.target.checked});$('#polygonSides').oninput=e=>liveSelected(x=>{if(x.type==='polygon')x.corners=+e.target.value});$('#polygonSides').onchange=()=>{commit();renderSlides()};$('#shapeRoundness').oninput=e=>liveSelected(x=>{if(['triangle','star','diamond','hexagon','polygon','speechbubble','burst'].includes(x.type))x.shapeRoundness=+e.target.value});$('#shapeRoundness').onchange=()=>{commit();renderSlides()};$('#starPoints').oninput=e=>liveSelected(x=>{if(x.type==='star')x.starPoints=+e.target.value});$('#starPoints').onchange=()=>{commit();renderSlides()};$('#starInnerRatio').oninput=e=>liveSelected(x=>{if(x.type==='star')x.starInnerRatio=+e.target.value/100});$('#starInnerRatio').onchange=()=>{commit();renderSlides()};$('#milestoneNumber').onchange=e=>updateSelected(x=>{if(x.type==='sticker'&&x.stickerKind==='milestone_card')x.milestoneNumber=e.target.value||'01'});
$('#shapeImageBtn').onclick=()=>$('#shapeImageInput').click();$('#shapeImageInput').onchange=e=>{const file=e.target.files[0],sh=selected();if(!file||!sh)return;const r=new FileReader();r.onload=()=>{sh.shapeImageSrc=r.result;sh.shapeImageZoom=100;sh.shapeImageX=50;sh.shapeImageY=50;commit();renderAll()};r.readAsDataURL(file)};$('#removeShapeImageBtn').onclick=()=>updateSelected(x=>{delete x.shapeImageSrc;delete x.shapeImageZoom;delete x.shapeImageX;delete x.shapeImageY});bindLive('#shapeImageZoom',(x,v)=>x.shapeImageZoom=+v);bindLive('#shapeImageX',(x,v)=>x.shapeImageX=+v);bindLive('#shapeImageY',(x,v)=>x.shapeImageY=+v);
bindLive('#timelinePoints',(x,v)=>{if(x.type==='sticker')x.timelinePoints=+v});bindChange('#timelineStart',(x,v)=>{if(x.type==='sticker')x.timelineStart=+v});bindChange('#timelineStep',(x,v)=>{if(x.type==='sticker')x.timelineStep=+v});bindChange('#timelineUnit',(x,v)=>{if(x.type==='sticker')x.timelineUnit=v});$('#timelineLabels').onchange=e=>updateSelected(x=>{if(x.type==='sticker')x.timelineLabels=e.target.value.split(/\n/).map(s=>s.trim()).filter(Boolean).join('|')});
$('#smoothPathBtn').onclick=()=>toast('Neue Freihand-Pfade werden schon automatisch geglättet.');

$('#stickerBtn').onclick=()=>{if($('#stickerSearch'))$('#stickerSearch').value='';renderStickerGrid('all');openModal('#stickerModal')};$('#quickStickerBtn').onclick=$('#stickerBtn').onclick;
$$('.sticker-cat').forEach(b=>b.onclick=()=>{$$('.sticker-cat').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderStickerGrid(b.dataset.stickerCat)});
$('#stickerSearch').oninput=()=>renderStickerGrid(($('.sticker-cat.active')?.dataset.stickerCat)||'all');
$('#iconSearch').oninput=()=>renderIcons($('#iconSearch').value);
$('#contextMenu')?.addEventListener('contextmenu',e=>e.preventDefault());$('#contextMenu')?.addEventListener('wheel',e=>e.stopPropagation(),{passive:true});
$$('[data-cm]').forEach(b=>b.onclick=()=>{const a=b.dataset.cm;closeContextMenu();if(a==='duplicate')return duplicateSelection();if(a==='copy')return copySelection();if(a==='paste')return pasteSelection();if(a==='copyStyle')return copyStyle();if(a==='pasteStyle')return pasteStyle();if(a==='fontUp')return updateSelected(x=>{if(['title','text','badge','icon'].includes(x.type))x.fontSize=(x.fontSize||28)+2});if(a==='fontDown')return updateSelected(x=>{if(['title','text','badge','icon'].includes(x.type))x.fontSize=Math.max(8,(x.fontSize||28)-2)});if(a==='toggleBold')return updateSelected(x=>{if(['title','text','badge','icon'].includes(x.type))x.fontWeight=(x.fontWeight||400)>=700?400:800});if(a==='editTimeline'){setRightDockMode('properties');renderInspector();setTimeout(()=>$('#timelineStickerControls')?.scrollIntoView({behavior:'smooth',block:'center'}),40);return }if(a==='group')return groupSelection();if(a==='ungroup')return ungroupSelection();if(a==='delete')return deleteSelected();if(a==='front')return arrange('front');if(a==='back')return arrange('back');if(a==='centerX')return arrange('centerX');if(a==='centerY')return arrange('centerY');if(a==='lock')return arrange('lock');if(a==='releaseCompound')return releaseCompound()});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#contextMenu'))closeContextMenu()},true);document.addEventListener('click',e=>{if(!e.target.closest('#contextMenu'))closeContextMenu()},true);window.addEventListener('blur',closeContextMenu);window.addEventListener('resize',closeContextMenu);$('#contextFont').onchange=e=>updateSelected(x=>{if(['title','text','badge','icon'].includes(x.type))x.fontFamily=e.target.value});$('#contextFontSize').onchange=e=>updateSelected(x=>{if(['title','text','badge','icon'].includes(x.type))x.fontSize=clamp(+e.target.value,8,220)});$('#contextTextColor').oninput=e=>liveSelected(x=>{if(['title','text','badge','icon'].includes(x.type))x.color=e.target.value});$('#contextTextColor').onchange=()=>{commit();renderSlides()};
document.addEventListener('contextmenu',e=>{const el=e.target.closest?.('#stage .el');const onStage=e.target.closest?.('#stage');if(!el&&!onStage)return;e.preventDefault();e.stopImmediatePropagation();if(el){openContextMenu(e.clientX,e.clientY,el.dataset.id)}else{selectedIds.clear();refreshSelectionUI();renderInspector();openContextMenu(e.clientX,e.clientY,null)}},true);
$('#drawBtn').onclick=()=>openModal('#drawModal');$$('.draw-mode').forEach(b=>b.onclick=()=>{$$('.draw-mode').forEach(x=>x.classList.remove('active'));b.classList.add('active');drawSettings.mode=b.dataset.drawmode});
$('#startDrawingBtn').onclick=()=>{drawSettings={mode:drawSettings.mode||'freehand',stroke:$('#drawStrokeColor').value,fill:$('#drawFillColor').value,width:+$('#drawStrokeWidth').value,smoothing:+$('#drawSmoothing').value,fillEnabled:$('#drawFillEnabled').checked};drawMode=drawSettings.mode;document.body.classList.add('draw-mode');closeModals();toast('Zeichenmodus aktiv · Esc zum Abbrechen')};

$('#fontLibraryBtn').onclick=()=>{renderFeaturedFonts();renderCustomFonts();openModal('#fontModal')};$('#uploadFontBtn').onclick=()=>$('#fontFileInput').click();$('#fontFileInput').onchange=e=>importCustomFont(e.target.files[0]);
$('#homeProjectsBtn').onclick=()=>{saveProject();renderProjects();openModal('#projectsModal')};$('#newProjectBtn').onclick=createNewProject;$('#saveProjectCopyBtn').onclick=saveCurrentAsCopy;$('#projectsImportBtn').onclick=()=>$('#importInput').click();
if($('#appAccentColor'))$('#appAccentColor').oninput=e=>applyUIAccent(e.target.value);$$('[data-uiaccent]').forEach(b=>b.onclick=()=>applyUIAccent(b.dataset.uiaccent));$('#appSettingsBtn').onclick=()=>{set('#settingsUiAccent',uiAccent);set('#settingsDefaultInk',project.theme.ink||appSettings.defaultInk);set('#settingsDefaultAccent',project.theme.accent||appSettings.defaultAccent);set('#settingsDefaultBg',activeSlide().background||appSettings.defaultBg);openModal('#settingsModal')};$$('[data-settings-accent]').forEach(b=>b.onclick=()=>set('#settingsUiAccent',b.dataset.settingsAccent));$('#saveSettingsBtn').onclick=()=>{appSettings={uiAccent:$('#settingsUiAccent').value,defaultInk:$('#settingsDefaultInk').value,defaultAccent:$('#settingsDefaultAccent').value,defaultBg:$('#settingsDefaultBg').value};saveAppSettings();project.theme.ink=appSettings.defaultInk;project.theme.accent=appSettings.defaultAccent;project.theme.bg=appSettings.defaultBg;commit();renderAll();closeModals();toast('App-Einstellungen gespeichert.')};

function isEditingField(){const a=document.activeElement;return !!a&&(['INPUT','TEXTAREA','SELECT'].includes(a.tagName)||a.isContentEditable)}
window.addEventListener('keydown',e=>{
 const editing=isEditingField(),mod=e.ctrlKey||e.metaKey,key=e.key.toLowerCase();
 if(drawMode&&e.key==='Escape'){drawMode=null;document.body.classList.remove('draw-mode');$('.temp-drawing')?.remove();toast('Zeichenmodus beendet.');return}
 if(isPresenting){if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();nextPresent(1)}if(e.key==='ArrowLeft'){e.preventDefault();nextPresent(-1)}if(e.key==='Escape')exitPresent();return}
 if(editing){if(e.key==='Escape'){document.activeElement?.blur();closeContextMenu()}return}
 if(e.code==='Space'){spacePan=true;UI.viewport.classList.add('panning');e.preventDefault();return}
 if(mod&&key==='z'){e.preventDefault();e.shiftKey?redo():undo();return}
 if(mod&&key==='y'){e.preventDefault();redo();return}
 if(mod&&key==='c'){e.preventDefault();copySelection();return}
 if(mod&&key==='x'){e.preventDefault();copySelection();deleteSelected();return}
 if(mod&&key==='v'){e.preventDefault();pasteSelection();return}
 if(mod&&key==='d'){e.preventDefault();duplicateSelection();return}
 if(mod&&key==='g'){e.preventDefault();e.shiftKey?ungroupSelection():groupSelection();return}
 if(mod&&key==='a'){e.preventDefault();selectedIds=new Set(activeSlide().elements.filter(x=>!x.hidden).map(x=>x.id));refreshSelectionUI();renderInspector();renderLayers();return}
 if(mod&&e.key==='Enter'){e.preventDefault();showPresentation();return}
 if(e.key==='Escape'){closeContextMenu();closeModals();return}
 if((e.key==='Delete'||e.key==='Backspace')&&selectedIds.size){e.preventDefault();deleteSelected();return}
 const items=selectedElements();if(items.length&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const step=e.shiftKey?10:1;items.forEach(x=>{if(e.key==='ArrowLeft')x.x-=step;if(e.key==='ArrowRight')x.x+=step;if(e.key==='ArrowUp')x.y-=step;if(e.key==='ArrowDown')x.y+=step});commit();renderStage();renderSlides();renderInspector();renderLayers()}
},true);
document.addEventListener('keyup' ,e=>{if(e.code==='Space'){spacePan=false;UI.viewport.classList.toggle('panning',panMode)}});
window.addEventListener('pagehide',()=>saveProject());window.addEventListener('beforeunload',()=>saveProject());document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveProject()});


function initInspectorCollapsibles(){
 $$('#inspectorContent>.control-group').forEach((group,i)=>{
  if(group.dataset.collapseReady)return;const title=group.querySelector(':scope>strong');if(!title)return;group.dataset.collapseReady='1';
  const head=document.createElement('div');head.className='group-head';title.before(head);head.appendChild(title);const btn=document.createElement('button');btn.type='button';btn.className='group-collapse';btn.textContent='−';btn.title='Bereich ein-/ausklappen';head.appendChild(btn);
  btn.onclick=ev=>{ev.stopPropagation();group.classList.toggle('collapsed');btn.textContent=group.classList.contains('collapsed')?'+':'−'};
 });
}

project=normalizeProject(project);if(!projectRegistry[project.id])projectRegistry[project.id]=deep(project);applyUIAccent(uiAccent);renderTemplates();renderIcons();renderStickerGrid('all');renderFeaturedFonts();registerAllCustomFonts();renderAll();initInspectorCollapsibles();setRightDockMode('properties');setScale(scale,false);history=[JSON.stringify(project)];saveProjectRegistry();setTimeout(()=>{fitStage();ensureStageVisible(true)},50);console.info('SlideBloom',APP_VERSION,'Complete Stable v6.7.2');

if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{})}
if('caches' in window){caches.keys().then(ks=>ks.filter(k=>k.toLowerCase().includes('slidebloom')).forEach(k=>caches.delete(k))).catch(()=>{})}
})();
