(() => {
  'use strict';

  const STORAGE_KEY = 'bloomslides-project-v1';
  const state = {
    title: 'Meine Präsentation',
    activeSlide: 0,
    selectedElementId: null,
    zoom: 1,
    history: [],
    future: [],
    slides: []
  };

  const el = id => document.getElementById(id);
  const clone = obj => JSON.parse(JSON.stringify(obj));
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const defaultSlides = () => [
    {
      id: uid(), theme: 'blush', transition: 'fade',
      elements: [
        makeEl('badge', '01 · EINFÜHRUNG', 8, 8, 19, 8, 17, '#7d8f61', {animation:'fade', delay:.1}),
        makeEl('title', 'Klimawandel\nverstehen', 8, 22, 48, 28, 58, '#5f4a43', {animation:'fade-up', delay:.2}),
        makeEl('text', 'Ursachen, Auswirkungen und was\nwir gemeinsam tun können.', 8, 53, 40, 16, 23, '#715f58', {animation:'fade-up', delay:.35}),
        makeEl('shape', '', 66, 12, 23, 42, 10, '#e9a7a0', {animation:'zoom', delay:.25}),
        makeEl('card', '🌿  Wissenschaftlich fundiert\n\nAktuelle Daten & Fakten', 8, 73, 25, 18, 18, '#5f4a43', {animation:'fade-up', delay:.5}),
        makeEl('card', '💡  Gemeinsam handeln\n\nKleine Schritte, große Wirkung', 37, 73, 27, 18, 18, '#5f4a43', {animation:'fade-up', delay:.65}),
        makeEl('card', '🌱  Für die Zukunft\n\nVerständnis schafft Veränderung', 68, 73, 24, 18, 18, '#5f4a43', {animation:'fade-up', delay:.8})
      ]
    },
    {
      id: uid(), theme: 'sage', transition: 'slide',
      elements: [
        makeEl('badge', '02 · URSACHEN', 8, 8, 18, 8, 17, '#6f8357', {animation:'fade', delay:.1}),
        makeEl('title', 'Warum erwärmt\nsich die Erde?', 8, 21, 53, 27, 52, '#4f5547', {animation:'fade-up', delay:.2}),
        makeEl('text', 'Treibhausgase halten Wärme in der Atmosphäre.\nDer Mensch verstärkt diesen natürlichen Effekt.', 8, 54, 52, 18, 22, '#5f6657', {animation:'fade-up', delay:.35}),
        makeEl('card', 'CO₂\n+50 %\nseit vorindustrieller Zeit', 68, 18, 24, 29, 23, '#4f5547', {animation:'pop', delay:.45}),
        makeEl('card', '🏭 Industrie\n🚗 Verkehr\n🌳 Landnutzung', 68, 54, 24, 28, 20, '#4f5547', {animation:'fade-up', delay:.6})
      ]
    },
    {
      id: uid(), theme: 'sun', transition: 'zoom',
      elements: [
        makeEl('badge', '03 · AUSWIRKUNGEN', 8, 8, 24, 8, 17, '#8c7848', {animation:'fade', delay:.1}),
        makeEl('title', 'Was verändert\nsich bereits?', 8, 22, 48, 26, 52, '#66563d', {animation:'fade-up', delay:.2}),
        makeEl('card', '🌡️  Häufigere Hitzeperioden', 8, 61, 26, 13, 19, '#66563d', {animation:'slide-left', delay:.4}),
        makeEl('card', '🌊  Steigende Meeresspiegel', 37, 61, 26, 13, 19, '#66563d', {animation:'slide-left', delay:.55}),
        makeEl('card', '🌾  Stress für Ökosysteme', 66, 61, 26, 13, 19, '#66563d', {animation:'slide-left', delay:.7}),
        makeEl('text', 'Klimawandel ist kein Problem der fernen Zukunft – seine Folgen sind heute messbar.', 8, 81, 84, 11, 19, '#776647', {animation:'fade', delay:.85})
      ]
    }
  ];

  function makeEl(type, text, x, y, w, h, fontSize, color, extra={}) {
    return {
      id: uid(), type, text, x, y, w, h, fontSize, color,
      animation: extra.animation || 'fade-up', duration: extra.duration || .7, delay: extra.delay || 0,
      bg: extra.bg || '', image: extra.image || ''
    };
  }

  function currentSlide(){ return state.slides[state.activeSlide]; }
  function selectedElement(){ return currentSlide()?.elements.find(x => x.id === state.selectedElementId) || null; }

  function snapshot(){
    state.history.push(JSON.stringify({title:state.title,activeSlide:state.activeSlide,slides:state.slides}));
    if(state.history.length > 50) state.history.shift();
    state.future = [];
  }

  function restoreFrom(raw){
    const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if(!p || !Array.isArray(p.slides)) throw new Error('Ungültige Datei');
    state.title = p.title || 'Meine Präsentation';
    state.slides = p.slides;
    state.activeSlide = clamp(p.activeSlide || 0, 0, Math.max(0,p.slides.length-1));
    state.selectedElementId = null;
    el('deckTitle').value = state.title;
    renderAll();
    scheduleSave();
  }

  function save(){
    const data = {title:state.title,activeSlide:state.activeSlide,slides:state.slides};
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    el('saveState').textContent = 'Gespeichert';
  }

  let saveTimer;
  function scheduleSave(){
    el('saveState').textContent = 'Speichert …';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 320);
  }

  function load(){
    const saved = localStorage.getItem(STORAGE_KEY);
    if(saved){
      try { restoreFrom(saved); return; } catch(e) { console.warn(e); }
    }
    state.slides = defaultSlides();
    renderAll();
    save();
  }

  function renderAll(){
    renderSlidesList();
    renderCanvas();
    renderProperties();
    updateCounters();
    updateThemeControls();
  }

  function updateCounters(){
    el('slideCounter').textContent = `${state.activeSlide + 1} / ${state.slides.length}`;
    el('zoomLabel').textContent = `${Math.round(state.zoom*100)}%`;
  }

  function renderSlidesList(){
    const list = el('slidesList');
    list.innerHTML = '';
    state.slides.forEach((slide, i) => {
      const row = document.createElement('div');
      row.className = 'slide-thumb-row';
      row.innerHTML = `<div class="slide-index">${i+1}</div>`;

      const thumb = document.createElement('div');
      thumb.className = 'slide-thumb' + (i===state.activeSlide?' active':'');
      thumb.addEventListener('click', () => { state.activeSlide=i; state.selectedElementId=null; renderAll(); scheduleSave(); closeSheets(); });
      const tCanvas = document.createElement('div');
      tCanvas.className = `thumb-canvas theme-${slide.theme || 'blush'}`;
      slide.elements.forEach(item => {
        const d = document.createElement('div');
        d.className = 'thumb-el';
        d.style.left=item.x+'%'; d.style.top=item.y+'%'; d.style.width=item.w+'%'; d.style.height=item.h+'%';
        d.style.fontSize=(item.fontSize*.12)+'px'; d.style.color=item.color;
        if(item.type==='shape'){ d.style.background=item.color || 'var(--accent)'; d.style.borderRadius='50%'; }
        else if(item.type==='image' && item.image){ d.innerHTML=`<img src="${item.image}" style="width:100%;height:100%;object-fit:cover;border-radius:4px">`; }
        else { d.textContent=item.text; if(item.type==='card') { d.style.background='rgba(255,255,255,.65)'; d.style.borderRadius='4px'; d.style.padding='2px'; } }
        tCanvas.appendChild(d);
      });
      thumb.appendChild(tCanvas);
      row.appendChild(thumb);

      const actions = document.createElement('div'); actions.className='thumb-actions';
      const dup=document.createElement('button'); dup.textContent='⧉'; dup.title='Folie duplizieren'; dup.onclick=e=>{e.stopPropagation(); duplicateSlide(i)};
      const del=document.createElement('button'); del.textContent='×'; del.title='Folie löschen'; del.onclick=e=>{e.stopPropagation(); deleteSlide(i)};
      actions.append(dup,del); row.appendChild(actions); list.appendChild(row);
    });
  }

  function renderCanvas(){
    const slide=currentSlide();
    const canvas=el('slideCanvas');
    canvas.className=`slide-canvas theme-${slide.theme || 'blush'}`;
    canvas.innerHTML='';
    slide.elements.forEach(item => canvas.appendChild(createElementNode(item, false)));
  }

  function createElementNode(item, presentation=false){
    const node=document.createElement('div');
    node.className=`slide-element type-${item.type}` + (!presentation && item.id===state.selectedElementId?' selected':'');
    node.dataset.id=item.id;
    Object.assign(node.style,{left:item.x+'%',top:item.y+'%',width:item.w+'%',height:item.h+'%',fontSize:item.fontSize+'px',color:item.color||'var(--slide-ink)'});

    const content=document.createElement('div');
    content.className='element-content';
    if(item.type==='image'){
      const img=document.createElement('img'); img.src=item.image; img.alt=''; content.appendChild(img);
    } else if(item.type==='shape'){
      content.style.background=item.color || 'var(--accent)';
    } else {
      const editable=document.createElement('div'); editable.className='element-editable'; editable.innerText=item.text || ''; content.appendChild(editable);
      if(!presentation){
        editable.contentEditable='true';
        editable.spellcheck=false;
        editable.addEventListener('focus', () => selectElement(item.id, true));
        editable.addEventListener('input', () => { item.text=editable.innerText; syncFields(item); scheduleSave(); renderSlidesListDebounced(); });
        editable.addEventListener('pointerdown', e => { if(e.detail>=2) e.stopPropagation(); });
      }
    }
    node.appendChild(content);

    if(!presentation){
      node.addEventListener('pointerdown', e => startDrag(e,item,node));
      node.addEventListener('click', e => { e.stopPropagation(); selectElement(item.id); });
      if(item.id===state.selectedElementId){
        const handle=document.createElement('div'); handle.className='resize-handle';
        handle.addEventListener('pointerdown', e=>startResize(e,item,node));
        node.appendChild(handle);
      }
    }
    return node;
  }

  let thumbRenderTimer;
  function renderSlidesListDebounced(){ clearTimeout(thumbRenderTimer); thumbRenderTimer=setTimeout(renderSlidesList,160); }

  function selectElement(id, soft=false){
    state.selectedElementId=id;
    if(!soft) renderCanvas();
    renderProperties();
    if(window.innerWidth<=1100) el('rightSidebar').classList.add('open');
  }

  function renderProperties(){
    const item=selectedElement();
    el('rightEmpty').hidden=!!item; el('propertiesPanel').hidden=!item;
    if(!item) return;
    const labels={title:'Titel',text:'Text',card:'Karte',badge:'Badge',shape:'Form',image:'Bild'};
    el('selectedTypeLabel').textContent=labels[item.type]||'Element';
    el('textField').value=item.text||'';
    el('textField').disabled=['shape','image'].includes(item.type);
    el('fontSizeField').value=item.fontSize||18;
    el('fontSizeField').disabled=['shape','image'].includes(item.type);
    el('colorField').value=normalizeHex(item.color || '#594a46');
    el('animationSelect').value=item.animation||'fade-up';
    el('durationField').value=item.duration||.7;
    el('delayField').value=item.delay||0;
    el('widthField').value=Math.round(item.w);
    el('heightField').value=Math.round(item.h);
  }

  function syncFields(item){
    if(state.selectedElementId!==item.id) return;
    el('textField').value=item.text||'';
  }

  function normalizeHex(c){
    if(/^#[0-9a-f]{6}$/i.test(c)) return c;
    return '#594a46';
  }

  function startDrag(e,item,node){
    if(e.target.classList.contains('resize-handle')) return;
    if(e.target.closest('[contenteditable="true"]') && e.detail>=2) return;
    if(e.button!==undefined && e.button!==0) return;
    selectElement(item.id,true);
    snapshot();
    const slideRect=el('slideCanvas').getBoundingClientRect();
    const startX=e.clientX, startY=e.clientY, ox=item.x, oy=item.y;
    node.setPointerCapture?.(e.pointerId);
    const move=ev=>{
      item.x=clamp(ox + (ev.clientX-startX)/slideRect.width*100, 0, 100-item.w);
      item.y=clamp(oy + (ev.clientY-startY)/slideRect.height*100, 0, 100-item.h);
      node.style.left=item.x+'%'; node.style.top=item.y+'%';
    };
    const up=()=>{ window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up); renderSlidesListDebounced(); renderProperties(); scheduleSave(); };
    window.addEventListener('pointermove',move); window.addEventListener('pointerup',up,{once:true});
  }

  function startResize(e,item,node){
    e.preventDefault(); e.stopPropagation(); snapshot();
    const slideRect=el('slideCanvas').getBoundingClientRect();
    const startX=e.clientX,startY=e.clientY,ow=item.w,oh=item.h;
    const move=ev=>{
      item.w=clamp(ow+(ev.clientX-startX)/slideRect.width*100,5,100-item.x);
      item.h=clamp(oh+(ev.clientY-startY)/slideRect.height*100,3,100-item.y);
      node.style.width=item.w+'%'; node.style.height=item.h+'%';
    };
    const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);renderProperties();renderSlidesListDebounced();scheduleSave();};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
  }

  function addElement(type, image=''){
    snapshot();
    const presets={
      title: makeEl('title','Neue Überschrift',10,15,56,18,52,'#5f4a43'),
      text: makeEl('text','Schreibe hier deinen Text …',10,38,44,14,22,'#715f58'),
      card: makeEl('card','✨ Neue Karte\n\nKurze Erklärung oder wichtiger Fakt.',12,58,31,22,18,'#5f4a43'),
      badge: makeEl('badge','NEUER ABSCHNITT',10,10,22,8,16,'#7d8f61'),
      shape: makeEl('shape','',70,18,18,32,10,'#e9a7a0'),
      image: {...makeEl('image','',58,18,34,50,10,'#ffffff'),image}
    };
    const item=presets[type]; currentSlide().elements.push(item); state.selectedElementId=item.id; renderAll(); scheduleSave(); closeSheets();
  }

  function addSlide(){
    snapshot();
    const slide={id:uid(),theme:'blush',transition:'fade',elements:[makeEl('title','Neue Folie',10,18,60,20,52,'#5f4a43'),makeEl('text','Füge Text, Karten, Bilder und Animationen hinzu.',10,43,60,14,22,'#715f58')]};
    state.slides.splice(state.activeSlide+1,0,slide); state.activeSlide++; state.selectedElementId=null; renderAll(); scheduleSave();
  }
  function duplicateSlide(i){snapshot();const copy=clone(state.slides[i]);copy.id=uid();copy.elements.forEach(x=>x.id=uid());state.slides.splice(i+1,0,copy);state.activeSlide=i+1;state.selectedElementId=null;renderAll();scheduleSave();}
  function deleteSlide(i){if(state.slides.length===1){toast('Mindestens eine Folie muss bleiben.');return;}snapshot();state.slides.splice(i,1);state.activeSlide=clamp(state.activeSlide,0,state.slides.length-1);state.selectedElementId=null;renderAll();scheduleSave();}
  function deleteSelected(){const item=selectedElement();if(!item)return;snapshot();currentSlide().elements=currentSlide().elements.filter(x=>x.id!==item.id);state.selectedElementId=null;renderAll();scheduleSave();}
  function duplicateSelected(){const item=selectedElement();if(!item)return;snapshot();const c=clone(item);c.id=uid();c.x=clamp(c.x+3,0,100-c.w);c.y=clamp(c.y+3,0,100-c.h);currentSlide().elements.push(c);state.selectedElementId=c.id;renderAll();scheduleSave();}

  function applyField(id, fn, rerender=true){el(id).addEventListener('change',()=>{const item=selectedElement();if(!item)return;snapshot();fn(item,el(id).value);if(rerender)renderAll();else renderProperties();scheduleSave();});}

  function setPanel(name){
    document.querySelectorAll('.top-tab').forEach(b=>b.classList.toggle('active',b.dataset.panel===name));
    document.querySelectorAll('.panel-section').forEach(s=>s.classList.toggle('visible',s.dataset.section===name));
    if(window.innerWidth<=820){ el('leftSidebar').classList.add('open'); el('sheetBackdrop').classList.add('show'); }
  }
  function closeSheets(){el('leftSidebar').classList.remove('open');el('rightSidebar').classList.remove('open');el('sheetBackdrop').classList.remove('show');}

  function previewAnimation(item=selectedElement(), node=null){
    if(!item)return;
    node=node||document.querySelector(`.slide-element[data-id="${item.id}"]`); if(!node)return;
    const map={'fade-up':'anim-fade-up','fade':'anim-fade','pop':'anim-pop','slide-left':'anim-slide-left','slide-right':'anim-slide-right','zoom':'anim-zoom'};
    [...node.classList].filter(c=>c.startsWith('anim-')).forEach(c=>node.classList.remove(c));
    node.classList.remove('previewing'); void node.offsetWidth;
    if(item.animation!=='none'){
      node.style.animationDuration=(item.duration||.7)+'s';node.style.animationDelay='0s';node.classList.add(map[item.animation]||'anim-fade-up','previewing');
      setTimeout(()=>node.classList.remove(map[item.animation]||'anim-fade-up','previewing'),(item.duration||.7)*1000+100);
    }
  }

  let presentationIndex=0;
  function openPresentation(){presentationIndex=state.activeSlide;el('presentationOverlay').hidden=false;renderPresentationSlide();document.documentElement.requestFullscreen?.().catch(()=>{});}
  function closePresentation(){el('presentationOverlay').hidden=true;if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});}
  function renderPresentationSlide(){
    const slide=state.slides[presentationIndex],stage=el('presentationStage'); stage.innerHTML='';
    const ps=document.createElement('div'); ps.className=`presentation-slide theme-${slide.theme||'blush'}`; ps.style.background=getThemeBackground(slide.theme);
    slide.elements.forEach(item=>{
      const n=createElementNode(item,true); const map={'fade-up':'anim-fade-up','fade':'anim-fade','pop':'anim-pop','slide-left':'anim-slide-left','slide-right':'anim-slide-right','zoom':'anim-zoom'};
      if(item.animation!=='none'){n.style.opacity='0';n.style.animationDuration=(item.duration||.7)+'s';n.style.animationDelay=(item.delay||0)+'s';n.style.animationFillMode='both';n.style.animationTimingFunction='cubic-bezier(.2,.75,.25,1)';n.classList.add(map[item.animation]||'anim-fade-up');}
      ps.appendChild(n);
    });
    stage.appendChild(ps); el('presentationCounter').textContent=`${presentationIndex+1} / ${state.slides.length}`;
  }
  function getThemeBackground(theme){return {blush:'linear-gradient(135deg,#fffaf5,#fff4ec)',sage:'linear-gradient(135deg,#fffdf4,#f2f5e8)',sun:'linear-gradient(135deg,#fffdf1,#fff5d8)',lilac:'linear-gradient(135deg,#fffafd,#f9f1fb)'}[theme]||'#fffaf5'}

  function download(name, content, type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},200);}
  function exportJSON(){download(safeName(state.title)+'.bloomslides.json',JSON.stringify({title:state.title,activeSlide:state.activeSlide,slides:state.slides},null,2),'application/json');toast('Projekt-Datei exportiert.');}
  function safeName(s){return (s||'praesentation').replace(/[\\/:*?"<>|]+/g,'-').trim()||'praesentation';}

  function exportHTML(){
    const data=JSON.stringify({title:state.title,slides:state.slides}).replace(/</g,'\\u003c');
    const html=`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(state.title)}</title><style>
    *{box-sizing:border-box}body{margin:0;background:#1d1918;font-family:Arial,sans-serif;overflow:hidden}.stage{width:100vw;height:100vh;display:grid;place-items:center}.slide{position:relative;aspect-ratio:16/9;width:min(100vw,177.777vh);overflow:hidden}.e{position:absolute;white-space:pre-wrap;overflow:hidden;transform-origin:center}.title{font-family:Georgia,serif;font-weight:700;line-height:.98}.text{line-height:1.35}.card{background:rgba(255,255,255,.68);border:1px solid rgba(100,80,70,.13);border-radius:22px;padding:18px}.badge{display:flex;align-items:center;justify-content:center;border-radius:999px;background:rgba(245,200,192,.85);font-weight:700}.shape{border-radius:50%}.img img{width:100%;height:100%;object-fit:cover;border-radius:22px}.nav{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);display:flex;gap:10px;align-items:center;background:#0006;color:white;padding:7px 10px;border-radius:999px}.nav button{width:38px;height:38px;border:0;border-radius:50%;background:#fff2;color:white;font-size:18px}.close{position:fixed;right:14px;top:14px;color:#fff9;font-size:12px}@keyframes fu{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}@keyframes f{from{opacity:0}to{opacity:1}}@keyframes p{0%{opacity:0;transform:scale(.72)}70%{transform:scale(1.05)}100%{opacity:1;transform:scale(1)}}@keyframes sl{from{opacity:0;transform:translateX(-55px)}to{opacity:1;transform:none}}@keyframes sr{from{opacity:0;transform:translateX(55px)}to{opacity:1;transform:none}}@keyframes z{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
    </style></head><body><div class="stage" id="stage"></div><div class="nav"><button id="prev">←</button><span id="count"></span><button id="next">→</button></div><div class="close">Pfeiltasten / Klick</div><script>const D=${data};let i=0;const bg={blush:'linear-gradient(135deg,#fffaf5,#fff4ec)',sage:'linear-gradient(135deg,#fffdf4,#f2f5e8)',sun:'linear-gradient(135deg,#fffdf1,#fff5d8)',lilac:'linear-gradient(135deg,#fffafd,#f9f1fb)'};const anim={'fade-up':'fu','fade':'f','pop':'p','slide-left':'sl','slide-right':'sr','zoom':'z'};function r(){const s=D.slides[i],st=document.getElementById('stage');st.innerHTML='';const sl=document.createElement('div');sl.className='slide';sl.style.background=bg[s.theme]||'#fff';s.elements.forEach(e=>{const n=document.createElement('div');n.className='e '+(e.type==='title'?'title':e.type==='text'?'text':e.type==='card'?'card':e.type==='badge'?'badge':e.type==='shape'?'shape':e.type==='image'?'img':'');Object.assign(n.style,{left:e.x+'%',top:e.y+'%',width:e.w+'%',height:e.h+'%',fontSize:e.fontSize+'px',color:e.color||'#594a46'});if(e.type==='image'){n.innerHTML='<img src="'+e.image+'">'}else if(e.type==='shape'){n.style.background=e.color||'#e99a96'}else{n.textContent=e.text||''}if(e.animation&&e.animation!=='none'){n.style.opacity='0';n.style.animation=(anim[e.animation]||'fu')+' '+(e.duration||.7)+'s cubic-bezier(.2,.75,.25,1) '+(e.delay||0)+'s both'}sl.appendChild(n)});st.appendChild(sl);document.getElementById('count').textContent=(i+1)+' / '+D.slides.length}function next(){i=Math.min(D.slides.length-1,i+1);r()}function prev(){i=Math.max(0,i-1);r()}document.getElementById('next').onclick=next;document.getElementById('prev').onclick=prev;addEventListener('keydown',e=>{if(['ArrowRight',' ','PageDown'].includes(e.key))next();if(['ArrowLeft','PageUp'].includes(e.key))prev()});r();<\/script></body></html>`;
    download(safeName(state.title)+'.html',html,'text/html'); toast('HTML-Präsentation exportiert.');
  }

  function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

  function toast(msg){const t=el('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),1800);}

  function undo(){if(!state.history.length)return;state.future.push(JSON.stringify({title:state.title,activeSlide:state.activeSlide,slides:state.slides}));const prev=state.history.pop();restoreFrom(prev);}
  function redo(){if(!state.future.length)return;state.history.push(JSON.stringify({title:state.title,activeSlide:state.activeSlide,slides:state.slides}));const next=state.future.pop();restoreFrom(next);}

  function updateThemeControls(){const slide=currentSlide();document.querySelectorAll('.theme-card').forEach(b=>b.classList.toggle('active',b.dataset.theme===slide.theme));el('transitionSelect').value=slide.transition||'fade';}

  function bind(){
    document.querySelectorAll('.top-tab').forEach(btn=>btn.onclick=()=>setPanel(btn.dataset.panel));
    document.querySelectorAll('[data-mobile-panel]').forEach(btn=>btn.onclick=()=>setPanel(btn.dataset.mobilePanel));
    document.querySelectorAll('[data-add]').forEach(btn=>btn.onclick=()=>addElement(btn.dataset.add));
    document.querySelectorAll('.theme-card').forEach(btn=>btn.onclick=()=>{snapshot();currentSlide().theme=btn.dataset.theme;renderAll();scheduleSave();});
    el('slideCanvas').addEventListener('click',()=>{state.selectedElementId=null;renderCanvas();renderProperties();});
    el('addSlideBtn').onclick=addSlide;
    el('deleteElementBtn').onclick=deleteSelected;
    el('duplicateElementBtn').onclick=duplicateSelected;
    el('previewAnimationBtn').onclick=()=>previewAnimation();
    el('presentBtn').onclick=openPresentation; el('mobilePresentBtn').onclick=openPresentation;
    el('closePresentationBtn').onclick=closePresentation;
    el('prevSlideBtn').onclick=()=>{presentationIndex=Math.max(0,presentationIndex-1);renderPresentationSlide()};
    el('nextSlideBtn').onclick=()=>{presentationIndex=Math.min(state.slides.length-1,presentationIndex+1);renderPresentationSlide()};
    document.addEventListener('keydown',e=>{
      if(!el('presentationOverlay').hidden){if(e.key==='Escape')closePresentation();if(e.key==='ArrowRight')el('nextSlideBtn').click();if(e.key==='ArrowLeft')el('prevSlideBtn').click();return;}
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();}
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo();}
      if((e.key==='Delete'||e.key==='Backspace') && document.activeElement===document.body) deleteSelected();
    });
    el('undoBtn').onclick=undo; el('redoBtn').onclick=redo;
    el('zoomOutBtn').onclick=()=>{state.zoom=clamp(state.zoom-.1,.5,1.5);el('canvasWrap').style.transform=`scale(${state.zoom})`;updateCounters()};
    el('zoomInBtn').onclick=()=>{state.zoom=clamp(state.zoom+.1,.5,1.5);el('canvasWrap').style.transform=`scale(${state.zoom})`;updateCounters()};
    el('deckTitle').addEventListener('input',e=>{state.title=e.target.value;scheduleSave();});
    el('transitionSelect').addEventListener('change',e=>{snapshot();currentSlide().transition=e.target.value;scheduleSave();});

    applyField('textField',(item,v)=>item.text=v);
    applyField('fontSizeField',(item,v)=>item.fontSize=clamp(+v||18,10,120));
    applyField('colorField',(item,v)=>item.color=v);
    applyField('animationSelect',(item,v)=>item.animation=v,false);
    applyField('durationField',(item,v)=>item.duration=clamp(+v||.7,.1,5),false);
    applyField('delayField',(item,v)=>item.delay=clamp(+v||0,0,10),false);
    applyField('widthField',(item,v)=>item.w=clamp(+v||20,5,100-item.x));
    applyField('heightField',(item,v)=>item.h=clamp(+v||10,3,100-item.y));

    el('imageUploadTrigger').onclick=()=>el('imageInput').click();
    el('imageInput').onchange=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>addElement('image',r.result);r.readAsDataURL(f);e.target.value='';};

    el('exportBtn').onclick=()=>el('exportModal').hidden=false;
    el('closeExportBtn').onclick=()=>el('exportModal').hidden=true;
    el('exportModal').addEventListener('click',e=>{if(e.target===el('exportModal'))el('exportModal').hidden=true;});
    el('exportHtmlBtn').onclick=exportHTML; el('exportJsonBtn').onclick=exportJSON; el('importJsonBtn').onclick=()=>el('importInput').click();
    el('importInput').onchange=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{snapshot();restoreFrom(r.result);el('exportModal').hidden=true;toast('Projekt importiert.')}catch(err){toast('Datei konnte nicht geöffnet werden.')}};r.readAsText(f);e.target.value='';};

    el('mobileMenuBtn').onclick=()=>{el('leftSidebar').classList.toggle('open');el('sheetBackdrop').classList.toggle('show');};
    el('sheetBackdrop').onclick=closeSheets;
    window.addEventListener('resize',()=>{if(innerWidth>820)closeSheets();});
  }

  bind(); load();

  if('serviceWorker' in navigator){ navigator.serviceWorker.register('./sw.js').catch(()=>{}); }
})();
