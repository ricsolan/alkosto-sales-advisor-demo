const state = {
  productCatalog: [],
  knowledgeArticles: [],
  products: [],
  selectedProduct: null,
  article: null,
  context: { intent:'', category:'', need:'', useCase:'', budget:0, city:'', priority:'', origin:'' },
  history: [],
  dataLoaded: false,
  dataUpdatedAt: null,
  autoArticleShown: false
};

const fallbackProducts = [
  {
    sku:'DEMO-TV-TCL-55', brand:'TCL', name:'TV TCL 55 pulgadas 4K Google TV', category:'Televisores',
    screen_size:55, technology:'LED 4K UHD', os:'Google TV', price:1634800, previous_price:1899900,
    promotion:'Precio especial online', image_url:'https://placehold.co/640x420?text=TCL+55', product_url:'https://www.alkosto.com/',
    city_inventory:{Barranquilla:{status:'Disponible',quantity:8,delivery_eta:'24-48 horas'}, Bogotá:{status:'Disponible',quantity:12,delivery_eta:'24-48 horas'}},
    use_cases:['deportes','streaming'], priority_tags:['precio y calidad','mejor balance'], badge:'MEJOR BALANCE',
    key_benefit:'Excelente balance entre precio, tamaño y calidad de imagen.', sales_pitch:'Ideal para deportes y streaming con presupuesto controlado.', related_articles:['tv-distance-55']
  },
  {
    sku:'DEMO-NB-LENOVO-I5', brand:'Lenovo', name:'Portátil Lenovo IdeaPad Core i5 16GB 512GB SSD', category:'Computadores',
    subcategory:'Portátiles', screen_size:15.6, processor:'Intel Core i5', ram:'16 GB', storage:'512 GB SSD', graphics:'Integrada', os:'Windows 11',
    price:2799900, previous_price:3299900, promotion:'Precio especial online', image_url:'https://placehold.co/640x420?text=Lenovo+i5', product_url:'https://www.alkosto.com/',
    city_inventory:{Barranquilla:{status:'Disponible',quantity:6,delivery_eta:'24-48 horas'}, Bogotá:{status:'Disponible',quantity:10,delivery_eta:'24-48 horas'}},
    use_cases:['trabajo','estudio','videollamadas'], priority_tags:['precio y calidad','productividad'], badge:'MEJOR BALANCE',
    key_benefit:'Buen equilibrio para trabajo remoto, estudio y productividad.', sales_pitch:'Buena opción para un usuario que necesita fluidez en tareas diarias.', related_articles:['laptop-study-work-guide']
  }
];

const fallbackArticles = [
  {
    id:'tv-distance-55', title:'Distancia recomendada para televisores de 55 pulgadas', category:'Televisores', article_type:'guía comercial',
    triggers:['55 pulgadas','distancia','tamaño','sala'],
    summary:'Un televisor de 55 pulgadas suele ser adecuado para salas medianas. La distancia ideal depende de la resolución, el espacio disponible y el uso principal.',
    key_points:['Para contenido 4K, el cliente puede sentarse más cerca sin perder calidad percibida.','Es una buena opción para deportes, películas y streaming.','Antes de cerrar la venta, conviene validar el espacio donde será instalado.'],
    advisor_phrase:'Por el tamaño que me indicas, un televisor de 55 pulgadas puede funcionar muy bien si la distancia de visualización es adecuada para tu sala.',
    recommended_questions:['¿A qué distancia estará ubicado el sofá o cama?','¿Lo usarás principalmente en sala, habitación o estudio?'],
    next_best_action:'Validar espacio y mostrar una opción 55 pulgadas balanceada dentro del presupuesto.'
  }
];

const CATEGORY_CONFIG = {
  Televisores: {
    sizes: ['43 pulgadas','50 pulgadas','55 pulgadas','65 pulgadas','75 pulgadas'],
    uses: ['Streaming','Deportes y streaming','Videojuegos','Películas','Uso general','Imagen premium'],
    priorities: ['Precio y calidad','Mejor precio','Marca','Entrega rápida','Garantía','Imagen premium'],
    brands: ['Samsung','LG','TCL','Challenger','Kalley','Sony','Xiaomi','Hisense']
  },
  Computadores: {
    sizes: ['13 pulgadas','14 pulgadas','15.6 pulgadas','16 pulgadas','24 pulgadas','27 pulgadas','No aplica'],
    uses: ['Trabajo y estudio','Trabajo remoto','Estudio','Gaming','Diseño / edición','Ofimática','Videollamadas','Computador familiar'],
    priorities: ['Precio y calidad','Mejor precio','Rendimiento','Portabilidad','Marca','Gaming','Garantía'],
    brands: ['Lenovo','HP','ASUS','Acer','Apple','Samsung','Clon Gamer']
  }
};

function qs(id){ return document.getElementById(id); }
function money(n){ return n ? '$' + Number(n).toLocaleString('es-CO') : 'Pendiente'; }
function cleanText(v){ return String(v || '').trim(); }
function lower(v){ return cleanText(v).toLowerCase(); }
function getParams(){ return Object.fromEntries(new URLSearchParams(location.search).entries()); }
function addHistory(text){ state.history.unshift({text, time:new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}); renderHistory(); }
function hasContext(){ return !!(state.context.category || state.context.need || state.context.useCase || state.context.budget || state.context.city); }

function renderDataSource(){
  const catalog = qs('catalogCountText');
  const articles = qs('articleCountText');
  const updated = qs('dataUpdatedText');
  if(catalog) catalog.textContent = state.productCatalog.length ? `${state.productCatalog.length} productos` : 'Pendiente';
  if(articles) articles.textContent = state.knowledgeArticles.length ? `${state.knowledgeArticles.length} artículos` : 'Pendiente';
  if(updated) updated.textContent = state.dataUpdatedAt ? state.dataUpdatedAt.toLocaleString('es-CO', { dateStyle:'short', timeStyle:'short' }) : 'Pendiente';
}


function normalizeBudget(v){
  const raw = cleanText(v).toLowerCase().replace(',', '.');
  if(!raw) return 0;
  const m = raw.match(/\d+(\.\d+)?/);
  if(!m) return 0;
  const n = Number(m[0]);
  if(raw.includes('millon') || raw.includes('millón') || raw.includes('millones')) return Math.round(n * 1000000);
  if(raw.includes('mil') && n < 10000) return Math.round(n * 1000);
  const digits = raw.replace(/[^\d]/g,'');
  return digits ? Number(digits) : Math.round(n);
}

async function loadExternalData(){
  try {
    const [productsResponse, articlesResponse] = await Promise.all([
      fetch('./products.json', { cache: 'no-store' }),
      fetch('./articles.json', { cache: 'no-store' })
    ]);
    if(!productsResponse.ok) throw new Error('No se pudo cargar products.json');
    if(!articlesResponse.ok) throw new Error('No se pudo cargar articles.json');
    state.productCatalog = await productsResponse.json();
    state.knowledgeArticles = await articlesResponse.json();
    state.dataLoaded = true;
    state.dataUpdatedAt = new Date();
    renderDataSource();
    addHistory(`Datos cargados: ${state.productCatalog.length} productos y ${state.knowledgeArticles.length} artículos.`);
  } catch(error){
    console.error(error);
    state.productCatalog = fallbackProducts;
    state.knowledgeArticles = fallbackArticles;
    state.dataUpdatedAt = new Date();
    renderDataSource();
    addHistory('No se pudo cargar JSON externo. Usando datos locales de respaldo.');
  }
}

function setOptions(selectId, options, placeholder){
  const el = qs(selectId);
  const current = el.value;
  el.innerHTML = `<option value="">${placeholder}</option>` + options.map(o => `<option>${o}</option>`).join('');
  if(options.includes(current)) el.value = current;
}

function inferCategory(text){
  const t = lower(text);
  if(t.includes('computador') || t.includes('portatil') || t.includes('portátil') || t.includes('laptop') || t.includes('pc') || t.includes('gaming')) return 'Computadores';
  if(t.includes('televisor') || t.includes('tv') || t.includes('qled') || t.includes('oled') || t.includes('pulgadas')) return 'Televisores';
  return '';
}
function inferSize(text){
  const m = cleanText(text).match(/(13|14|15\.6|16|24|27|43|50|55|65|75)/);
  return m ? `${m[1]} pulgadas` : '';
}

function initFromParams(){
  const p = getParams();
  state.context.intent = cleanText(p.intent || p.sales_intent || '');
  state.context.category = cleanText(p.category || p.sales_category || '') || inferCategory([p.need,p.customer_need,p.useCase,p.use_case].join(' '));
  state.context.budget = normalizeBudget(p.budget || '');
  state.context.city = cleanText(p.city || '');
  state.context.useCase = cleanText(p.useCase || p.use_case || '');
  state.context.priority = cleanText(p.priority || p.customer_priority || '');
  state.context.need = cleanText(p.customerNeed || p.need || p.customer_need || '');
  state.context.origin = hasContext() ? cleanText(p.origin || 'AVA') : '';

  qs('categoryInput').value = state.context.category || '';
  updateProfileOptions(state.context.category || 'Televisores');
  qs('budgetInput').value = state.context.budget || '';
  qs('cityInput').value = state.context.city || '';
  qs('useInput').value = state.context.useCase || '';
  qs('priorityInput').value = state.context.priority || '';
  qs('sizeInput').value = inferSize(state.context.need) || '';
  qs('brandInput').value = '';
  renderContext();
  if(hasContext()) {
    updateGuidance();
    suggestArticleFromContext('Artículo sugerido automáticamente');
  }
}


function updateProfileOptions(category){
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.Televisores;
  setOptions('sizeInput', config.sizes, 'Sin definir');
  setOptions('useInput', config.uses, 'Sin definir');
  setOptions('priorityInput', config.priorities, 'Sin definir');
  setOptions('brandInput', config.brands, 'Sin preferencia');
}

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
  const category = qs('categoryInput').value || state.context.category || '';
  return {
    category,
    budget: Number(qs('budgetInput').value || 0),
    size: qs('sizeInput').value,
    useCase: qs('useInput').value,
    brand: qs('brandInput').value,
    city: qs('cityInput').value,
    priority: qs('priorityInput').value
  };
}

function labelForSlot(value, fallback){ return value || fallback; }
function normalizeArray(arr){ return Array.isArray(arr) ? arr.map(x => lower(x)) : []; }
function productSize(product){ return Number(product.screen_size || product.size || 0); }
function productTech(product){ return product.technology || [product.processor, product.ram, product.storage].filter(Boolean).join(' · ') || product.os || 'Características demo'; }
function productSpecs(product){
  if(product.category === 'Computadores') return [product.processor, product.ram, product.storage, product.graphics].filter(Boolean).slice(0,3);
  return [`${product.screen_size || ''}”`, product.technology, product.os].filter(Boolean).slice(0,3);
}
function getInventory(product, city){
  const normalizedCity = cleanText(city) || 'Barranquilla';
  const info = product.city_inventory?.[normalizedCity] || product.city_inventory?.['Barranquilla'];
  if(info) return `${info.status} en ${normalizedCity}${info.quantity ? ` · ${info.quantity} uds` : ''}${info.delivery_eta ? ` · ${info.delivery_eta}` : ''}`;
  if(product.cities_available?.includes(normalizedCity)) return `${product.inventory_status || 'Disponible'} en ${normalizedCity}`;
  return `Validar disponibilidad en ${normalizedCity}`;
}
function isAvailable(product, city){
  const normalizedCity = cleanText(city) || 'Barranquilla';
  const info = product.city_inventory?.[normalizedCity];
  return !!info && !lower(info.status).includes('agotado');
}

function scoreProduct(p, f){
  let score = 0;
  const category = lower(f.category);
  if(!category || lower(p.category) === category) score += 30; else score -= 60;

  if(!f.budget || p.price <= f.budget) score += 18;
  else if(p.price <= f.budget * 1.15) score += 6;
  else score -= 12;

  const requestedSize = Number((f.size||'').match(/\d+(\.\d+)?/)?.[0] || 0);
  const size = productSize(p);
  if(requestedSize && size === requestedSize) score += 18;
  else if(requestedSize && Math.abs(size-requestedSize) <= (p.category === 'Computadores' ? 1.6 : 10)) score += 6;

  if(f.brand && lower(p.brand) === lower(f.brand)) score += 20;
  if(f.city && isAvailable(p, f.city)) score += 12;

  const use = lower(f.useCase);
  const uses = normalizeArray(p.use_cases);
  if(use && uses.some(u => use.includes(u) || u.includes(use) || use.split(' ').some(w => w.length > 4 && u.includes(w)))) score += 16;

  const pr = lower(f.priority);
  const tags = normalizeArray(p.priority_tags);
  if(pr && tags.some(t => pr.includes(t) || t.includes(pr) || pr.split(' ').some(w => w.length > 4 && t.includes(w)))) score += 16;

  if(p.badge) score += 2;
  return score;
}

function searchProducts(){
  const f = collectFilters();
  if(f.category) updateProfileOptions(f.category);
  state.context.intent = state.context.intent || 'Compra';
  state.context.category = f.category || state.context.category || 'Televisores';
  state.context.budget = f.budget;
  state.context.useCase = f.useCase;
  state.context.city = f.city;
  state.context.priority = f.priority;
  state.context.need = state.context.need || buildNeedFromFilters(f);
  state.context.origin = state.context.origin || 'Asesor';
  renderContext();

  if(!f.category && !f.budget && !f.size && !f.useCase && !f.city){
    qs('recommendationSummary').textContent = 'Completa al menos categoría, presupuesto, tamaño/uso o ciudad para ejecutar una búsqueda más precisa.';
    return;
  }

  qs('emptyState').hidden = true;
  qs('productsGrid').innerHTML = '<div class="loading-card">🔎 Buscando productos...<br><span>Leyendo products.json, validando inventario y ordenando por recomendación.</span></div>';
  qs('progressStrip').innerHTML = '<span>🔎 Consultando catálogo preparado...</span><span>→</span><span>📦 Validando inventario por ciudad...</span><span>→</span><span>✨ Aplicando reglas comerciales...</span>';
  qs('recommendationSummary').textContent = 'Buscando productos recomendados con el contexto actual...';

  setTimeout(()=>{
    let candidates = state.productCatalog
      .map(p => ({...p, _score: scoreProduct(p,f)}))
      .filter(p => !f.category || lower(p.category) === lower(f.category))
      .sort((a,b)=> b._score-a._score || a.price-b.price);

    if(f.budget) candidates = candidates.filter(p => p.price <= f.budget * 1.25 || p._score >= 55);
    if(!candidates.length){
      candidates = state.productCatalog
        .filter(p => !f.category || lower(p.category) === lower(f.category))
        .map(p=>({...p,_score:0}))
        .sort((a,b)=>a.price-b.price);
    }

    state.products = candidates.slice(0,5).map((p,i)=> ({
      ...p,
      inventory: getInventory(p, f.city || 'Barranquilla'),
      recommendation: p.badge || recommendationText(p,i),
      reason: reasonText(p,f)
    }));

    qs('progressStrip').innerHTML = `<span>✅ ${state.products.length} opciones encontradas</span><span>→</span><span>${f.city ? 'Inventario para ' + f.city : 'Inventario demo'}</span><span>→</span><span>Ranking por ${labelForSlot(f.priority,'relevancia')}</span>`;
    qs('recommendationSummary').textContent = buildRecommendationSummary(state.products, f);
    renderProducts();
    renderComparison();
    updateGuidance();
    suggestArticleFromContext('Artículo sugerido por contexto');
    addHistory(`Búsqueda ejecutada: ${state.context.category}, ${labelForSlot(f.size,'tamaño no definido')}, ${labelForSlot(f.useCase,'uso no definido')}, ${f.budget ? money(f.budget) : 'sin presupuesto'}, ${labelForSlot(f.city,'sin ciudad')}`);
  }, 700);
}

function buildNeedFromFilters(f){
  if(f.category === 'Computadores') return f.size && f.size !== 'No aplica' ? `Computador / portátil ${f.size}` : 'Computador';
  return f.size ? `Televisor de ${f.size}` : 'Producto';
}
function recommendationText(p,i){
  const tags = normalizeArray(p.priority_tags);
  if(tags.includes('precio') || tags.includes('económico')) return 'MEJOR PRECIO';
  if(tags.includes('gaming')) return 'GAMING';
  if(tags.includes('rendimiento') || tags.includes('productividad')) return 'RENDIMIENTO';
  if(tags.includes('marca') || tags.includes('experiencia')) return 'MEJOR EXPERIENCIA';
  return i === 0 ? 'MEJOR BALANCE' : 'RECOMENDADO';
}
function reasonText(p,f){
  const use = labelForSlot(f.useCase, (p.use_cases || [])[0] || 'el uso indicado');
  return p.sales_pitch || `Ideal para ${use.toLowerCase()} por ${lower(p.key_benefit || 'sus características comerciales')}.`;
}

function renderProducts(){
  qs('emptyState').hidden = true;
  const grid = qs('productsGrid');
  grid.innerHTML = '';
  state.products.forEach((p,i)=>{
    const badge = p.recommendation || 'RECOMENDADO';
    const badgeClass = badge.includes('PRECIO')?'green':(badge.includes('EXPERIENCIA')||badge.includes('PREMIUM'))?'purple':'';
    const specs = productSpecs(p).map(s => `<span>${s}</span>`).join('');
    const card = document.createElement('div');
    card.className = 'product-card' + (state.selectedProduct?.sku===p.sku?' selected':'');
    card.innerHTML = `
      <span class="product-badge ${badgeClass}">${badge}</span>
      <button class="heart">♡</button>
      <div class="product-image"><img src="${p.image_url || ''}" alt="${p.name}" onerror="this.parentElement.innerHTML='<strong>${p.brand}</strong>'" /></div>
      <h3>${p.brand}</h3>
      <strong>${p.name}</strong>
      <div class="specs">${specs}</div>
      <div class="match-tags">${productMatchBadges(p, collectFilters()).map(b=>`<span>${b}</span>`).join('')}</div>
      <div class="price">${money(p.price)}</div>
      <div class="previous">Antes: ${money(p.previous_price)}</div>
      <div class="stock">● ${p.inventory}</div>
      <div class="promo">Promo: ${p.promotion || 'Validar promoción vigente'}</div>
      <p>${p.reason}</p>
      <div class="product-actions">
        <button class="secondary" data-article="${i}">Ver artículo</button>
        <button class="primary" data-select="${i}">Seleccionar</button>
      </div>`;
    grid.appendChild(card);
  });
}

function renderComparison(){
  qs('comparisonCard').hidden = false;
  qs('comparisonBody').innerHTML = state.products.map((p,i)=>`<tr><td><strong>${p.brand}</strong><br>${p.name}</td><td>${money(p.price)}</td><td>${p.inventory}</td><td>${(p.use_cases || []).slice(0,2).join(' / ') || productTech(p)}</td><td><span class="badge ${i===0?'success':'neutral'}">${lower(p.recommendation || 'recomendado')}</span></td></tr>`).join('');
}


function productMatchBadges(p, f){
  const badges = [];
  const requestedSize = Number((f.size||'').match(/\d+(\.\d+)?/)?.[0] || 0);
  if(f.budget && p.price <= f.budget) badges.push('Dentro del presupuesto');
  if(requestedSize && productSize(p) === requestedSize) badges.push('Tamaño exacto');
  if(f.city && isAvailable(p, f.city)) badges.push('Disponible en ciudad');
  if(f.brand && lower(p.brand) === lower(f.brand)) badges.push('Marca preferida');
  if(f.useCase && normalizeArray(p.use_cases).some(u => lower(f.useCase).includes(u) || u.includes(lower(f.useCase)))) badges.push('Uso compatible');
  if(f.priority && normalizeArray(p.priority_tags).some(t => lower(f.priority).includes(t) || t.includes(lower(f.priority)))) badges.push('Prioridad alineada');
  return badges.slice(0,3);
}

function buildRecommendationSummary(products, f){
  if(!products.length) return 'No encontré opciones directas. Ajusta presupuesto, tamaño o ciudad para ampliar la búsqueda.';
  const best = products[0];
  const category = f.category || state.context.category || 'productos';
  const cityPart = f.city ? ` con disponibilidad referencial para ${f.city}` : '';
  const budgetPart = f.budget ? ` dentro o cerca del presupuesto de ${money(f.budget)}` : ' con presupuesto pendiente de validar';
  return `Encontré ${products.length} opciones de ${category}${cityPart}${budgetPart}. La recomendación principal es ${best.brand} por ${lower(best.key_benefit || best.recommendation || 'su balance comercial')}.`;
}

function nextBestActionForStage(stage='profile'){
  const f = collectFilters();
  const category = f.category || state.context.category || 'producto';
  if(stage === 'selected' && state.selectedProduct){
    const p = state.selectedProduct;
    return `Explicar el beneficio principal de ${p.brand}, validar disponibilidad en ${f.city || 'la ciudad del cliente'} y preguntar si desea avanzar con link de compra o comparación rápida.`;
  }
  if(stage === 'objection'){
    return 'Responder la objeción con una comparación concreta, evitar prometer descuentos no autorizados y cerrar con una pregunta de avance.';
  }
  if(category === 'Computadores'){
    return 'Buscar equipos con SSD, memoria suficiente y procesador acorde al uso; luego comparar balance, rendimiento y portabilidad.';
  }
  if(category === 'Televisores'){
    return 'Buscar opciones por tamaño, presupuesto e inventario; luego validar si el cliente prioriza precio, marca o experiencia de imagen.';
  }
  return 'Completar perfilamiento y ejecutar búsqueda recomendada.';
}

function suggestArticleFromContext(label='Artículo sugerido por Copilot'){
  const context = [state.context.category, state.context.need, state.context.useCase, state.context.priority, qs('sizeInput')?.value].join(' ');
  const article = findRelevantArticle(context);
  if(article){
    renderArticle(article, label, {silent:true});
    state.autoArticleShown = true;
  }
}

function updateGuidance(){
  const f = collectFilters();
  const category = f.category || state.context.category || 'Televisores';
  const article = findRelevantArticle([category, state.context.need, f.size, f.useCase, f.priority].join(' '));
  const genericQuestions = category === 'Computadores'
    ? ['¿El equipo será principalmente para estudio, trabajo, diseño o gaming?', '¿Necesita portabilidad o lo usará principalmente en escritorio?', '¿Qué programas o tareas pesadas suele utilizar?']
    : ['¿A qué distancia estará ubicado el televisor?', '¿Lo usará más para deportes, películas o videojuegos?', '¿Desea priorizar precio, marca, entrega o garantía?'];
  const questions = article?.recommended_questions?.length ? article.recommended_questions.slice(0,3) : genericQuestions;
  qs('questionsList').classList.remove('muted-list');
  qs('questionsList').innerHTML = questions.map(q=>`<div>${q}</div>`).join('');

  let pitch = article?.advisor_phrase || `Con presupuesto de ${f.budget ? money(f.budget) : 'rango por definir'}, podemos priorizar una opción de ${category.toLowerCase()} para ${labelForSlot(f.useCase,'el uso indicado').toLowerCase()}, balanceando precio, disponibilidad y respaldo.`;
  if(state.products.length && !state.selectedProduct){
    const best = state.products[0];
    pitch = `La mejor opción inicial es ${best.brand} ${best.name}. Encaja porque ${lower(best.key_benefit || best.reason || 'responde al perfil del cliente')} y está ${f.budget && best.price <= f.budget ? 'dentro del presupuesto indicado' : 'cerca del presupuesto indicado'}.`;
  }
  if(state.selectedProduct){
    const p = state.selectedProduct;
    pitch = `${p.brand} ${p.name} es una recomendación sólida para este cliente porque ${lower(p.key_benefit || p.reason || 'se alinea con su necesidad')}. Podemos reforzar ${p.promotion || 'la condición comercial vigente'} y validar disponibilidad antes de cerrar.`;
  }
  qs('pitchBox').classList.remove('empty-copy');
  qs('pitchBox').textContent = pitch;
  qs('nextActionBox').textContent = nextBestActionForStage(state.selectedProduct ? 'selected' : 'profile');
}

function selectProduct(index){
  state.selectedProduct = state.products[index];
  renderProducts();
  renderSelected();
  const article = getArticleForProduct(state.selectedProduct);
  if(article) renderArticle(article, 'Artículo relacionado');
  updateGuidance();
  addHistory(`Producto seleccionado: ${state.selectedProduct.brand} ${state.selectedProduct.name}`);
}

function renderSelected(){
  const p = state.selectedProduct;
  if(!p) return;
  qs('selectedCard').hidden=false;
  const warnings = p.advisor_warning ? `<div class="message-box"><strong>Nota asesor</strong><br>${p.advisor_warning}</div>` : '';
  qs('selectedContent').innerHTML = `<div class="selected-mini"><div class="mini-img"><img src="${p.image_url || ''}" /></div><div><strong>${p.name}</strong><br><span class="price" style="font-size:16px">${money(p.price)}</span><br>${p.inventory}<br>${p.promotion || ''}<br><em>${p.key_benefit || ''}</em></div></div>${warnings}<button class="secondary full" id="openProductBtn">Abrir producto demo</button>`;
}

function handleObjection(){
  const p = state.selectedProduct || state.products[0];
  if(!p){ alert('Primero busca y selecciona un producto.'); return; }
  const type = qs('objectionType').value;
  const phrase = qs('customerPhrase').value || 'El cliente muestra duda.';
  const article = findRelevantArticle([p.category, type, phrase, ...(p.related_articles || [])].join(' '));
  const benefit = type==='Precio' ? (p.category === 'Computadores' ? 'comparar contra una opción más económica y reforzar rendimiento, durabilidad y productividad' : 'comparar contra una opción más económica y reforzar valor/precio, tamaño e imagen')
    : type==='Garantía' ? 'explicar respaldo y validar garantía extendida sin prometer condiciones no confirmadas'
    : type==='Entrega' ? 'validar disponibilidad y tiempos en sistema oficial antes de prometer entrega'
    : type==='Características técnicas' ? 'traducir especificaciones a beneficios concretos para el uso del cliente'
    : 'reducir incertidumbre con comparativo y siguiente paso claro';
  const advisor = article?.advisor_phrase || `Entiendo tu punto. Para este ${p.brand}, puedo ayudarte a ${benefit}. Así mantienes respaldo de Alkosto y una opción alineada con lo que necesitas.`;
  qs('objectionResult').hidden=false;
  qs('objectionResult').innerHTML = `<div class="risk"><strong>Riesgo de pérdida: Alto</strong><br>Objeción: ${type}. Frase: “${phrase}”</div><div class="strategy"><strong>Estrategia recomendada</strong><br>${article?.summary || 'Reforzar valor del producto seleccionado y conectar el beneficio con la prioridad del cliente.'}</div><div class="benefit"><strong>Beneficio sugerido</strong><br>${benefit}.</div><div class="message-box"><strong>Frase sugerida</strong><br>${advisor}</div>`;
  qs('nextActionBox').textContent = nextBestActionForStage('objection');
  if(article) renderArticle(article, 'Artículo para objeción');
  addHistory(`Objeción manejada: ${type}`);
}

function findRelevantArticle(contextText){
  const text = lower(contextText);
  if(!state.knowledgeArticles.length) return null;
  let best = null;
  let bestScore = -1;
  state.knowledgeArticles.forEach(article => {
    let score = 0;
    if(article.category && text.includes(lower(article.category))) score += 5;
    (article.triggers || []).forEach(trigger => { if(text.includes(lower(trigger))) score += 4; });
    if(text.includes(lower(article.id))) score += 8;
    if(score > bestScore){ best = article; bestScore = score; }
  });
  return bestScore > 0 ? best : state.knowledgeArticles[0];
}
function getArticleForProduct(product){
  if(!product) return null;
  for(const id of product.related_articles || []){
    const match = state.knowledgeArticles.find(a => a.id === id);
    if(match) return match;
  }
  return findRelevantArticle([product.category, product.name, ...(product.use_cases || [])].join(' '));
}
function renderArticle(article, label='Knowledge', options={}){
  if(!article) return;
  state.article = article;
  qs('articleCard').hidden=false;
  qs('articleContent').innerHTML = `<h3>${article.title}</h3><p class="article-source">${label} · ${article.category || 'General'} · ${article.article_type || 'guía'}</p><p>${article.summary}</p><ul>${(article.key_points || []).map(b=>`<li>${b}</li>`).join('')}</ul><div class="message-box"><strong>Frase para el asesor</strong><br>${article.advisor_phrase || ''}</div>${article.do_not_say?.length ? `<div class="message-box"><strong>No decir</strong><br>${article.do_not_say.join('<br>')}</div>` : ''}<button class="secondary full" id="copyArticlePhraseBtn">Copiar frase del artículo</button>`;
  if(!options.silent) addHistory(`Artículo mostrado: ${article.title}`);
}

function renderHistory(){
  qs('historyList').innerHTML = state.history.length ? state.history.map(h=>`<div class="history-item"><strong>${h.time}</strong> · ${h.text}</div>`).join('') : '<p>Sin acciones aún.</p>';
}

function simulateCopilot(){
  state.context.intent='Compra';
  state.context.category='Computadores';
  state.context.origin='Copilot';
  state.context.need='Portátil para trabajo remoto, estudio y videollamadas';
  state.context.useCase='Trabajo y estudio';
  state.context.budget=3000000;
  state.context.city='Barranquilla';
  state.context.priority='Precio y calidad';
  qs('categoryInput').value='Computadores';
  updateProfileOptions('Computadores');
  qs('budgetInput').value=3000000;
  qs('useInput').value='Trabajo y estudio';
  qs('priorityInput').value='Precio y calidad';
  qs('sizeInput').value='15.6 pulgadas';
  qs('cityInput').value='Barranquilla';
  renderContext();
  qs('recommendationSummary').textContent='Copilot actualizó el contexto. Listo para buscar recomendaciones de computadores.';
  updateGuidance();
  suggestArticleFromContext('Artículo sugerido automáticamente');
  addHistory('Copilot actualizó contexto: computador para trabajo/estudio, presupuesto $3.000.000');
}

function resetApp(){ location.href = location.pathname; }

function bindEvents(){
  document.addEventListener('click', e=>{
    if(e.target.id==='searchBtn'||e.target.id==='emptySearchBtn') searchProducts();
    if(e.target.id==='emptyCopilotBtn'||e.target.id==='simulateCopilotBtn') simulateCopilot();
    if(e.target.id==='simulateArticleBtn') renderArticle(findRelevantArticle([state.context.category, state.context.need, state.context.useCase, qs('sizeInput').value].join(' ')), 'Artículo sugerido por Copilot');
    if(e.target.dataset.select) selectProduct(Number(e.target.dataset.select));
    if(e.target.dataset.article) renderArticle(getArticleForProduct(state.products[Number(e.target.dataset.article)]), 'Artículo relacionado');
    if(e.target.id==='objectionBtn') handleObjection();
    if(e.target.id==='copyPitchBtn') navigator.clipboard?.writeText(qs('pitchBox').textContent);
    if(e.target.id==='copyArticlePhraseBtn') navigator.clipboard?.writeText(state.article?.advisor_phrase || '');
    if(e.target.id==='openProductBtn' && state.selectedProduct?.product_url) window.open(state.selectedProduct.product_url, '_blank');
    if(e.target.id==='clearSelectedBtn'){state.selectedProduct=null; qs('selectedCard').hidden=true; renderProducts();}
    if(e.target.id==='resetBtn') resetApp();
  });

  qs('categoryInput').addEventListener('change', e => {
    updateProfileOptions(e.target.value || 'Televisores');
    state.context.category = e.target.value;
    renderContext();
    updateGuidance();
  });

  qs('sortInput').addEventListener('change', e => {
    const option = e.target.value;
    if(!state.products.length) return;
    if(option.includes('Precio')) state.products.sort((a,b)=>a.price-b.price);
    if(option.includes('Marca')) state.products.sort((a,b)=>a.brand.localeCompare(b.brand));
    if(option.includes('Disponibilidad')) state.products.sort((a,b)=>Number(isAvailable(b, qs('cityInput').value))-Number(isAvailable(a, qs('cityInput').value)));
    renderProducts(); renderComparison(); addHistory(`Orden aplicado: ${option}`);
  });
}

async function main(){
  bindEvents();
  updateProfileOptions('Televisores');
  await loadExternalData();
  initFromParams();
  renderHistory();
  renderDataSource();
  qs('progressStrip').innerHTML = `<span>✅ Datos listos</span><span>→</span><span>${state.productCatalog.length} productos</span><span>→</span><span>${state.knowledgeArticles.length} artículos</span>`;
}

main();
