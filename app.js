const state = {
  products: [], selectedProduct: null, article: null,
  context: { intent:'', category:'', need:'', useCase:'', budget:0, city:'', priority:'', origin:'' },
  history: []
};

const catalog = [
  {sku:'TV-KALLEY-43FHD',brand:'Kalley',size:43,name:'TV Kalley 43” FHD Smart TV',price:799900,previous:999900,scoreTags:['price'],ideal:'Habitación / uso general',feature:'Opción económica para espacios pequeños',image:'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=700&q=80',os:'Smart TV'},
  {sku:'TV-KALLEY-50UHD',brand:'Kalley',size:50,name:'TV Kalley 50” 4K Smart TV',price:1199900,previous:1399900,scoreTags:['price'],ideal:'Uso general',feature:'Precio competitivo para uso diario',image:'https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?auto=format&fit=crop&w=700&q=80',os:'Smart TV'},
  {sku:'TV-CHALLENGER-55B067',brand:'Challenger',size:55,name:'TV Challenger 55” 4K Android TV',price:1479900,previous:1649900,scoreTags:['price'],ideal:'Precio bajo',feature:'Opción económica con Android TV',image:'https://images.unsplash.com/photo-1601944177325-f8867652837f?auto=format&fit=crop&w=700&q=80',os:'Android TV'},
  {sku:'TV-TCL-55V6C',brand:'TCL',size:55,name:'TV TCL 55V6C 55” 4K Google TV',price:1634800,previous:1899900,scoreTags:['balance'],ideal:'Deportes y streaming',feature:'Excelente balance precio/calidad',image:'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=700&q=80',os:'Google TV'},
  {sku:'TV-SAMSUNG-55DU7000',brand:'Samsung',size:55,name:'TV Samsung 55” DU7000 4K Crystal UHD',price:2149900,previous:2499900,scoreTags:['brand','balance'],ideal:'Marca y calidad de imagen',feature:'Diseño delgado, 4K y buena experiencia Smart',image:'https://images.unsplash.com/photo-1552975084-6e027cd345c2?auto=format&fit=crop&w=700&q=80',os:'Tizen'},
  {sku:'TV-LG-55UA8050PSA',brand:'LG',size:55,name:'TV LG 55UA8050PSA 55” 4K Smart TV con IA',price:2299900,previous:2699900,scoreTags:['experience','brand'],ideal:'Marca / IA',feature:'Funciones inteligentes y buena experiencia',image:'https://images.unsplash.com/photo-1577979749830-f1d742b96791?auto=format&fit=crop&w=700&q=80',os:'webOS'},
  {sku:'TV-TCL-65C6K',brand:'TCL',size:65,name:'TV TCL 65” QLED Google TV',price:3199900,previous:3699900,scoreTags:['premium','sports'],ideal:'Sala grande / deportes',feature:'Pantalla grande y experiencia inmersiva',image:'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=700&q=80',os:'Google TV'},
  {sku:'TV-SAMSUNG-65QLED',brand:'Samsung',size:65,name:'TV Samsung 65” QLED 4K Smart TV',price:3999900,previous:4599900,scoreTags:['premium','brand'],ideal:'Imagen premium',feature:'Mayor contraste, color y experiencia premium',image:'https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=700&q=80',os:'Tizen'},
  {sku:'TV-LG-65QNED',brand:'LG',size:65,name:'TV LG 65” QNED 4K Smart TV con IA',price:4299900,previous:4999900,scoreTags:['premium','experience'],ideal:'Cine en casa',feature:'Excelente experiencia visual y funciones IA',image:'https://images.unsplash.com/photo-1584905066893-7d5c142ba4e1?auto=format&fit=crop&w=700&q=80',os:'webOS'},
  {sku:'TV-SONY-55X75K',brand:'Sony',size:55,name:'TV Sony 55” 4K Google TV',price:3299900,previous:3799900,scoreTags:['brand','premium'],ideal:'Películas y sonido',feature:'Marca premium y excelente procesamiento de imagen',image:'https://images.unsplash.com/photo-1615986200762-a1ed9610d3d1?auto=format&fit=crop&w=700&q=80',os:'Google TV'}
];

const articleLibrary = {
  tv_distance: {
    title: 'Distancia recomendada para televisores de 55 pulgadas',
    source: 'Knowledge Base Alkosto · Guía de compra TV',
    summary: 'Para un televisor 4K de 55 pulgadas, una distancia cómoda suele estar entre 1,7 y 2,5 metros. Si el cliente ve deportes o películas, se recomienda validar tamaño de sala, ángulo de visión y brillo del espacio.',
    bullets: ['55 pulgadas funciona muy bien para salas medianas.', 'Para deportes, priorizar fluidez, resolución 4K y buen procesamiento.', 'Si el cliente está a más de 3 metros, considerar 65 pulgadas.'],
    advisorPhrase: 'Para el espacio que me comentas, 55 pulgadas puede ser una buena opción si estás aproximadamente entre 2 y 3 metros del televisor. Si la sala es más amplia, también podríamos revisar 65 pulgadas.'
  },
  warranty: {
    title: 'Cómo explicar garantía extendida en televisores',
    source: 'Playbook comercial · Garantía extendida',
    summary: 'La garantía extendida se debe presentar como tranquilidad posterior a la compra, especialmente en productos de mayor valor o cuando el cliente manifiesta preocupación por soporte.',
    bullets: ['No prometer aprobación automática.', 'Explicar cobertura en términos simples.', 'Ofrecerla después de seleccionar producto.'],
    advisorPhrase: 'Además de la garantía de fabricante, podemos revisar una garantía extendida para que tengas mayor tranquilidad después de la compra.'
  }
};

function money(n){ return n ? '$' + Number(n).toLocaleString('es-CO') : 'Pendiente'; }
function qs(id){ return document.getElementById(id); }
function addHistory(text){ state.history.unshift({text, time:new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}); renderHistory(); }
function getParams(){ return Object.fromEntries(new URLSearchParams(location.search).entries()); }
function cleanText(v){ return String(v || '').trim(); }
function normalizeBudget(v){
  const raw = cleanText(v).toLowerCase().replace(',', '.');
  if(!raw) return 0;
  const m = raw.match(/\d+(\.\d+)?/);
  if(!m) return 0;
  const n = Number(m[0]);
  if(raw.includes('millon') || raw.includes('millón') || raw.includes('millones')) return Math.round(n * 1000000);
  return Number(raw.replace(/[^\d]/g,'')) || Math.round(n);
}
function hasContext(){ return !!(state.context.category || state.context.need || state.context.useCase || state.context.budget || state.context.city); }

function initFromParams(){
  const p = getParams();
  state.context.intent = cleanText(p.intent || p.sales_intent || '');
  state.context.category = cleanText(p.category || p.sales_category || '');
  state.context.budget = normalizeBudget(p.budget || '');
  state.context.city = cleanText(p.city || '');
  state.context.useCase = cleanText(p.useCase || p.use_case || '');
  state.context.priority = cleanText(p.priority || p.customer_priority || '');
  state.context.need = cleanText(p.customerNeed || p.need || p.customer_need || '');
  state.context.origin = hasContext() ? cleanText(p.origin || 'AVA') : '';
  qs('budgetInput').value = state.context.budget || '';
  qs('cityInput').value = state.context.city || '';
  qs('useInput').value = state.context.useCase || '';
  qs('priorityInput').value = state.context.priority || '';
  qs('sizeInput').value = inferSize(state.context.need) || '';
  qs('brandInput').value = '';
  renderContext();
}

function inferSize(text){ const m = cleanText(text).match(/(43|50|55|65|75)/); return m ? `${m[1]} pulgadas` : ''; }
function renderContext(){
  qs('categoryLabel').textContent = state.context.category || 'Sin detectar';
  qs('cityLabel').textContent = state.context.city || 'Sin ciudad';
  qs('intentText').textContent = state.context.intent || 'Pendiente';
  qs('categoryText').textContent = state.context.category || 'Pendiente';
  qs('needText').textContent = state.context.need || 'Pendiente';
  qs('useText').textContent = state.context.useCase || 'Pendiente';
  qs('budgetText').textContent = state.context.budget ? money(state.context.budget) + ' aprox.' : 'Pendiente';
  qs('cityText').textContent = state.context.city || 'Pendiente';
  qs('priorityText').textContent = state.context.priority || 'Pendiente';
  qs('contextOrigin').textContent = state.context.origin ? 'Actualizado por ' + state.context.origin : 'Sin contexto';
  qs('contextOrigin').className = 'badge ' + (state.context.origin ? 'success' : 'muted');
}

function collectFilters(){
  return { budget: Number(qs('budgetInput').value || 0), size: qs('sizeInput').value, useCase: qs('useInput').value, brand: qs('brandInput').value, city: qs('cityInput').value, priority: qs('priorityInput').value };
}
function labelForSlot(value, fallback){ return value || fallback; }
function scoreProduct(p,f){
  let score = 0;
  if(!f.budget || p.price <= f.budget) score += 20; else if(p.price <= f.budget * 1.2) score += 8;
  const size = Number((f.size||'').match(/\d+/)?.[0] || 0); if(size && p.size === size) score += 20; else if(size && Math.abs(p.size-size) <= 10) score += 8;
  if(f.brand && p.brand === f.brand) score += 25;
  const use = (f.useCase||'').toLowerCase();
  if(use.includes('deporte') && (p.scoreTags.includes('sports') || p.scoreTags.includes('balance'))) score += 15;
  if(use.includes('videojuego') && p.scoreTags.includes('premium')) score += 15;
  if(use.includes('película') || use.includes('pelicula')) if(p.scoreTags.includes('experience') || p.scoreTags.includes('premium')) score += 12;
  const pr = (f.priority||'').toLowerCase();
  if(pr.includes('precio') && p.scoreTags.includes('price')) score += 18;
  if(pr.includes('marca') && ['LG','Samsung','Sony'].includes(p.brand)) score += 18;
  if(pr.includes('calidad') && (p.scoreTags.includes('balance') || p.scoreTags.includes('brand'))) score += 12;
  return score;
}

function searchProducts(){
  const f = collectFilters();
  state.context.intent = state.context.intent || 'Compra';
  state.context.category = state.context.category || 'Televisores';
  state.context.budget = f.budget; state.context.useCase = f.useCase; state.context.city = f.city; state.context.priority = f.priority; state.context.need = state.context.need || (f.size ? `Televisor de ${f.size}` : 'Televisor'); state.context.origin = 'Asesor';
  renderContext();
  if(!f.budget && !f.size && !f.useCase && !f.city){ qs('recommendationSummary').textContent = 'Completa al menos presupuesto, tamaño o uso principal para ejecutar una búsqueda más precisa.'; return; }
  qs('emptyState').hidden = true;
  qs('productsGrid').innerHTML = '<div class="loading-card">🔎 Buscando productos...<br><span>Validando catálogo, inventario y prioridad comercial.</span></div>';
  qs('progressStrip').innerHTML = '<span>🔎 Buscando productos...</span><span>→</span><span>📦 Validando inventario...</span><span>→</span><span>✨ Ordenando por recomendación...</span>';
  qs('recommendationSummary').textContent = 'Buscando productos recomendados con el contexto actual...';
  setTimeout(()=>{
    let candidates = catalog.map(p => ({...p, _score: scoreProduct(p,f)})).sort((a,b)=> b._score-a._score || a.price-b.price);
    if(f.budget) candidates = candidates.filter(p => p.price <= f.budget * 1.35 || p._score >= 35);
    if(!candidates.length) candidates = catalog.map(p=>({...p,_score:0})).sort((a,b)=>a.price-b.price);
    state.products = candidates.slice(0,4).map((p,i)=> ({...p,
      inventory: availabilityText(p, f.city || 'Barranquilla', i), promo: promoText(p,i),
      recommendation: recommendationText(p,i), reason: reasonText(p,f)
    }));
    qs('progressStrip').innerHTML = `<span>✅ ${state.products.length} opciones encontradas ${f.city ? 'en ' + f.city : ''}</span><span>→</span><span>Ranking por ${labelForSlot(f.priority,'relevancia')}</span>`;
    qs('recommendationSummary').textContent = `Encontré ${state.products.length} opciones ${f.city ? 'para ' + f.city : ''}, con presupuesto ${f.budget ? money(f.budget) : 'pendiente'} y prioridad ${labelForSlot(f.priority,'sin definir')}.`;
    renderProducts(); renderComparison(); updateGuidance(); addHistory(`Búsqueda ejecutada: ${labelForSlot(f.size,'tamaño no definido')}, ${labelForSlot(f.useCase,'uso no definido')}, ${f.budget ? money(f.budget) : 'sin presupuesto'}, ${labelForSlot(f.city,'sin ciudad')}`);
  },800);
}
function availabilityText(p, city, i){ if(p.price > 3500000 && city !== 'Bogotá') return `Bajo pedido en ${city} (2–4 días)`; if(i===0) return `Disponible en ${city}`; if(i===1) return `Disponible en ${city}`; return `Inventario limitado en ${city}`; }
function promoText(p,i){ if(p.scoreTags.includes('premium')) return 'Garantía extendida con beneficio demo'; if(i===0) return 'Precio especial online'; if(i===1) return 'Precio especial hoy'; return 'Oferta destacada'; }
function recommendationText(p,i){ if(p.scoreTags.includes('price')) return 'MEJOR PRECIO'; if(p.scoreTags.includes('premium') || p.scoreTags.includes('experience')) return 'MEJOR EXPERIENCIA'; return i===0 ? 'MEJOR BALANCE' : 'RECOMENDADO'; }
function reasonText(p,f){ return `Ideal para ${labelForSlot(f.useCase,p.ideal).toLowerCase()} por ${p.feature.toLowerCase()}.`; }

function renderProducts(){
  qs('emptyState').hidden = true;
  const grid = qs('productsGrid'); grid.innerHTML = '';
  state.products.forEach((p,i)=>{
    const badgeClass = p.recommendation.includes('PRECIO')?'green':p.recommendation.includes('EXPERIENCIA')?'purple':'';
    const card = document.createElement('div'); card.className = 'product-card' + (state.selectedProduct?.sku===p.sku?' selected':'');
    card.innerHTML = `<span class="product-badge ${badgeClass}">${p.recommendation}</span><button class="heart">♡</button><div class="product-image"><img src="${p.image}" alt="${p.name}" onerror="this.parentElement.innerHTML='<strong>${p.brand}</strong>'" /></div><h3>${p.brand}</h3><strong>${p.name}</strong><div class="specs"><span>${p.size}”</span><span>4K UHD</span><span>${p.os}</span></div><div class="price">${money(p.price)}</div><div class="previous">Antes: ${money(p.previous)}</div><div class="stock">● ${p.inventory}</div><div class="promo">Promo: ${p.promo}</div><p>${p.reason}</p><div class="product-actions"><button class="secondary" data-detail="${i}">Ver detalle</button><button class="primary" data-select="${i}">Seleccionar</button></div>`;
    grid.appendChild(card);
  });
}
function renderComparison(){
  qs('comparisonCard').hidden = false;
  qs('comparisonBody').innerHTML = state.products.map((p,i)=>`<tr><td><strong>${p.brand}</strong><br>${p.name}</td><td>${money(p.price)}</td><td>${p.inventory}</td><td>${p.ideal}</td><td><span class="badge ${i===0?'success':'neutral'}">${p.recommendation.toLowerCase()}</span></td></tr>`).join('');
}
function updateGuidance(){
  const f=collectFilters();
  const questions = ['¿A qué distancia estará ubicado el televisor?', f.size ? `¿Confirmamos que ${f.size} es el tamaño ideal para el espacio?` : '¿Qué tamaño de pantalla tiene en mente?', f.priority ? `¿Desea priorizar ${f.priority.toLowerCase()} sobre otras variables?` : '¿Desea priorizar precio, marca, entrega o garantía?'];
  qs('questionsList').classList.remove('muted-list');
  qs('questionsList').innerHTML = questions.map(q=>`<div>${q}</div>`).join('');
  qs('pitchBox').classList.remove('empty-copy');
  qs('pitchBox').textContent = `Con presupuesto de ${f.budget ? money(f.budget) : 'rango por definir'}, prioriza una opción ${labelForSlot(f.size,'del tamaño adecuado')} 4K para ${labelForSlot(f.useCase,'el uso indicado').toLowerCase()}, balanceando precio, disponibilidad y respaldo.`;
  qs('nextActionBox').textContent = 'Presentar las opciones mejor rankeadas, seleccionar una recomendación y validar objeciones de precio o garantía.';
}
function selectProduct(index){ state.selectedProduct = state.products[index]; renderProducts(); renderSelected(); addHistory(`Producto seleccionado: ${state.selectedProduct.brand} ${state.selectedProduct.name}`); }
function renderSelected(){ const p=state.selectedProduct; if(!p) return; qs('selectedCard').hidden=false; qs('selectedContent').innerHTML = `<div class="selected-mini"><div class="mini-img"><img src="${p.image}" /></div><div><strong>${p.name}</strong><br><span class="price" style="font-size:16px">${money(p.price)}</span><br>${p.inventory}<br>${p.promo}<br><em>${p.feature}</em></div></div>`; }
function handleObjection(){
  const p = state.selectedProduct || state.products[0]; if(!p){ alert('Primero busca y selecciona un producto.'); return; }
  const type = qs('objectionType').value; const phrase = qs('customerPhrase').value || 'El cliente muestra duda.';
  const benefit = type==='Precio' ? 'ofrecer combo con soporte de pared o validar beneficio comercial limitado' : type==='Garantía' ? 'ofrecer garantía extendida y reforzar respaldo posventa' : type==='Entrega' ? 'validar disponibilidad y prometer solo tiempos confirmados' : 'reducir incertidumbre con comparativo y disponibilidad';
  const advisor = `Entiendo tu punto. Para este ${p.brand}, puedo ayudarte a ${benefit}. Así mantienes respaldo de Alkosto y una opción alineada con lo que necesitas.`;
  qs('objectionResult').hidden=false;
  qs('objectionResult').innerHTML = `<div class="risk"><strong>Riesgo de pérdida: Alto</strong><br>Objeción: ${type}. Frase: “${phrase}”</div><div class="strategy"><strong>Estrategia recomendada</strong><br>Reforzar valor del producto seleccionado y conectar el beneficio con la prioridad del cliente.</div><div class="benefit"><strong>Beneficio sugerido</strong><br>${benefit}.</div><div class="message-box"><strong>Frase sugerida</strong><br>${advisor}</div>`;
  addHistory(`Objeción manejada: ${type}`);
}
function renderArticle(article){
  state.article = article; qs('articleCard').hidden=false;
  qs('articleContent').innerHTML = `<h3>${article.title}</h3><p class="article-source">${article.source}</p><p>${article.summary}</p><ul>${article.bullets.map(b=>`<li>${b}</li>`).join('')}</ul><div class="message-box"><strong>Frase para el asesor</strong><br>${article.advisorPhrase}</div><button class="secondary full" id="copyArticlePhraseBtn">Copiar frase del artículo</button>`;
  addHistory(`Copilot sugirió artículo: ${article.title}`);
}
function renderHistory(){ qs('historyList').innerHTML = state.history.length ? state.history.map(h=>`<div class="history-item"><strong>${h.time}</strong> · ${h.text}</div>`).join('') : '<p>Sin acciones aún.</p>'; }
function simulateCopilot(){
  state.context.intent='Compra'; state.context.category='Televisores'; state.context.origin='Copilot'; state.context.need='Televisor de 55 pulgadas para deportes y Netflix'; state.context.useCase='Deportes y streaming'; state.context.budget=2500000; state.context.city='Barranquilla'; state.context.priority='Precio y calidad';
  qs('budgetInput').value=2500000; qs('useInput').value='Deportes y streaming'; qs('priorityInput').value='Precio y calidad'; qs('sizeInput').value='55 pulgadas'; qs('cityInput').value='Barranquilla'; renderContext(); addHistory('Copilot actualizó contexto: TV 55, deportes/Netflix, presupuesto $2.500.000');
  qs('recommendationSummary').textContent='Copilot actualizó el contexto. Listo para buscar recomendaciones.'; updateGuidance();
}
function resetApp(){ location.href = location.pathname; }

document.addEventListener('click', e=>{
  if(e.target.id==='searchBtn'||e.target.id==='emptySearchBtn') searchProducts();
  if(e.target.id==='emptyCopilotBtn'||e.target.id==='simulateCopilotBtn') simulateCopilot();
  if(e.target.id==='simulateArticleBtn') renderArticle(articleLibrary.tv_distance);
  if(e.target.dataset.select) selectProduct(Number(e.target.dataset.select));
  if(e.target.id==='objectionBtn') handleObjection();
  if(e.target.id==='copyPitchBtn') navigator.clipboard?.writeText(qs('pitchBox').textContent);
  if(e.target.id==='copyArticlePhraseBtn') navigator.clipboard?.writeText(state.article?.advisorPhrase || '');
  if(e.target.id==='clearSelectedBtn'){state.selectedProduct=null; qs('selectedCard').hidden=true; renderProducts();}
  if(e.target.id==='resetBtn') resetApp();
});
initFromParams(); renderHistory();
