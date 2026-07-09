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
  autoArticleShown: false,
  live: {
    conversationId: '',
    stateApiUrl: '',
    pollSeconds: 2,
    pollingEnabled: false,
    lastEventKey: '',
    lastFetchAt: null,
    lastError: '',
    demoEventIndex: 0
  }
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

function initLiveConfigFromParams(){
  const p = getParams();
  state.live.conversationId = cleanText(p.conversationId || p.conversation_id || p.cid || '');
  state.live.stateApiUrl = cleanText(p.stateApiUrl || p.state_api_url || '');
  state.live.pollSeconds = Number(p.pollSeconds || p.poll_seconds || 2) || 2;
  state.live.pollingEnabled = !!(state.live.conversationId && state.live.stateApiUrl);
  renderLiveStatus();
  if(state.live.pollingEnabled){
    addHistory(`Escucha Copilot activa para conversationId ${state.live.conversationId}.`);
    fetchConversationState({manual:false});
    setInterval(() => fetchConversationState({manual:false}), Math.max(2, state.live.pollSeconds) * 1000);
  }
}

function renderLiveStatus(message){
  const idEl = qs('liveConversationId');
  const endpointEl = qs('liveEndpointStatus');
  const badge = qs('liveStatusBadge');
  const header = qs('conversationLabel');
  if(header) header.textContent = state.live.conversationId || 'Sin ID';
  if(idEl) idEl.textContent = state.live.conversationId || 'No configurado';
  if(endpointEl) endpointEl.textContent = state.live.stateApiUrl ? 'AWS API activa' : 'Sin API';
  if(badge){
    if(state.live.pollingEnabled){
      badge.className = 'badge success';
      badge.innerHTML = '<span class="pulse-dot"></span>Escuchando AWS';
    } else {
      badge.className = 'badge muted';
      badge.textContent = 'Modo local';
    }
  }
  if(message) renderCopilotEventBox(message.title, message.body, message.kind || 'active');
}

function renderCopilotEventBox(title, body, kind='active'){
  const box = qs('copilotEventBox');
  if(!box) return;
  box.className = `copilot-event-box ${kind}`;
  box.innerHTML = `<strong>${title}</strong><p>${body}</p>`;
}

function buildStateApiUrl(){
  if(!state.live.stateApiUrl || !state.live.conversationId) return '';
  const joiner = state.live.stateApiUrl.includes('?') ? '&' : '?';
  return `${state.live.stateApiUrl}${joiner}conversationId=${encodeURIComponent(state.live.conversationId)}`;
}

async function fetchConversationState({manual=false}={}){
  if(!state.live.stateApiUrl || !state.live.conversationId){
    if(manual) renderCopilotEventBox('Configuración pendiente', 'Para escuchar eventos agrega conversationId y stateApiUrl en la URL de la Client App.', 'warning');
    return;
  }
  try{
    const res = await fetch(buildStateApiUrl(), { cache:'no-store' });
    const payload = await res.json();
    state.live.lastFetchAt = new Date();
    if(!res.ok || payload.ok === false) throw new Error(payload.error || `HTTP ${res.status}`);
    if(!payload.found || !payload.state){
      if(manual) renderCopilotEventBox('Sin estado en AWS', `No hay eventos para ${state.live.conversationId}. Ejecuta un POST de prueba o una acción Copilot.`, 'warning');
      return;
    }
    processRemoteState(payload.state, manual);
  } catch(error){
    console.error('Error fetching conversation state', error);
    state.live.lastError = error.message;
    if(manual) renderCopilotEventBox('Error consultando AWS', error.message, 'warning');
  }
}

function remoteEventKey(remote){
  return [remote.conversationId, remote.updatedAt, remote.lastEventType || remote.eventType, remote.articleId, remote.objectionType, remote.customerPhrase].join('|');
}

function processRemoteState(remote, manual=false){
  const key = remoteEventKey(remote);
  if(key === state.live.lastEventKey){
    if(manual){
      const eventType = remote.lastEventType || remote.eventType || 'estado';
      const time = remote.updatedAt ? new Date(remote.updatedAt).toLocaleTimeString('es-CO',{hour:'2-digit', minute:'2-digit', second:'2-digit'}) : 'sin hora';
      renderCopilotEventBox('Estado consultado sin cambios', `Último evento: ${eventType} · Actualizado: ${time}`, 'active');
      addHistory(`Consulta manual AWS: sin cambios para ${state.live.conversationId}.`);
    }
    return;
  }
  state.live.lastEventKey = key;
  applyCopilotEvent(remote);
}

function applyCopilotEvent(remote){
  const eventType = remote.lastEventType || remote.eventType || 'context_updated';
  const source = remote.updatedBy || remote.source || 'Agent Copilot';
  const time = remote.updatedAt ? new Date(remote.updatedAt).toLocaleTimeString('es-CO',{hour:'2-digit', minute:'2-digit', second:'2-digit'}) : 'ahora';

  if(eventType === 'context_updated' || eventType === 'intent_detected'){
    const previousCategory = state.context.category;
    applyContextFromRemote(remote, source, {autoSearch:true});
    const categoryChanged = previousCategory && state.context.category && lower(previousCategory) !== lower(state.context.category);

    renderCopilotEventBox(
      categoryChanged ? 'Copilot cambió la categoría' : 'Contexto actualizado por Copilot',
      `Categoría: ${state.context.category || 'pendiente'} · Presupuesto: ${state.context.budget ? money(state.context.budget) : 'pendiente'} · Ciudad: ${state.context.city || 'pendiente'} · ${time}. Recalculando recomendaciones...`,
      'success'
    );

    resetRecommendationsForCopilotContext(categoryChanged);
    addHistory(`${source} actualizó contexto: ${state.context.category || 'sin categoría'}, ${state.context.budget ? money(state.context.budget) : 'sin presupuesto'}.`);
    setTimeout(() => searchProducts(), 350);
    return;
  }

  if(eventType === 'knowledge_article_suggested'){
    const article = findArticleFromRemote(remote);
    if(article) renderArticle(article, `Artículo sugerido por ${source}`);
    renderCopilotEventBox('Artículo sugerido por Copilot', `${remote.articleTitle || article?.title || 'Artículo de conocimiento'} · ${time}`, 'active');
    addHistory(`${source} sugirió artículo: ${remote.articleTitle || article?.title || remote.articleId || 'sin título'}.`);
    return;
  }

  if(eventType === 'objection_detected'){
    if(remote.category || remote.budget || remote.city || remote.useCase || remote.need || remote.priority) applyContextFromRemote(remote, source, {silent:true});
    applyObjectionFromRemote(remote, source);
    renderCopilotEventBox('Objeción detectada por Copilot', `${remote.objectionType || 'Objeción'} · “${remote.customerPhrase || 'Frase no capturada'}” · ${time}`, 'warning');
    addHistory(`${source} detectó objeción: ${remote.objectionType || 'sin tipo'}.`);
    return;
  }

  if(eventType === 'comparison_requested'){
    qs('comparisonCard').hidden = false;
    if(!state.products.length) qs('recommendationSummary').textContent = 'Copilot detectó necesidad de comparar. Ejecuta búsqueda para generar comparativo con productos recomendados.';
    renderCopilotEventBox('Comparativo solicitado', `Foco: ${remote.comparisonFocus || 'precio, marca y disponibilidad'} · ${time}`, 'active');
    addHistory(`${source} solicitó comparativo: ${remote.comparisonFocus || 'general'}.`);
    return;
  }

  renderCopilotEventBox('Evento recibido', `${eventType} · ${time}`, 'active');
  addHistory(`${source} envió evento: ${eventType}.`);
}

function applyContextFromRemote(remote, source='Agent Copilot', options={}){
  if(remote.intent) state.context.intent = remote.intent;
  if(remote.category) state.context.category = remote.category;
  if(remote.budget) state.context.budget = normalizeBudget(remote.budget);
  if(remote.city) state.context.city = remote.city;
  if(remote.useCase || remote.use_case) state.context.useCase = remote.useCase || remote.use_case;
  if(remote.priority || remote.customerPriority) state.context.priority = remote.priority || remote.customerPriority;
  if(remote.need || remote.customerNeed) state.context.need = remote.need || remote.customerNeed;

  const remoteText = [remote.need, remote.customerNeed, remote.useCase, remote.use_case, remote.articleTitle, remote.customerPhrase].join(' ');
  if(!state.context.useCase) state.context.useCase = inferUseCase(remoteText, state.context.category);
  if(!state.context.priority) state.context.priority = inferPriority(remoteText);

  if(remote.screenSize || remote.screen_size) qs('sizeInput').value = remote.screenSize || remote.screen_size;
  state.context.origin = source;

  if(state.context.category){
    qs('categoryInput').value = state.context.category;
    updateProfileOptions(state.context.category);
  }
  if(state.context.budget) qs('budgetInput').value = state.context.budget;
  if(state.context.city) qs('cityInput').value = state.context.city;
  if(state.context.useCase) qs('useInput').value = state.context.useCase;
  if(state.context.priority) qs('priorityInput').value = state.context.priority;
  if((remote.screenSize || remote.screen_size) && qs('sizeInput')) qs('sizeInput').value = remote.screenSize || remote.screen_size;
  else if(state.context.need && qs('sizeInput') && !qs('sizeInput').value) qs('sizeInput').value = inferSize(state.context.need);

  renderContext();
  if(options.autoSearch) resetGuidance();
  else updateGuidance();
  if(!options.silent && !options.autoSearch) qs('recommendationSummary').textContent = 'Copilot actualizó el contexto. Puedes ejecutar búsqueda con los nuevos datos.';
}

function resetRecommendationsForCopilotContext(categoryChanged=false){
  state.selectedProduct = null;
  state.products = [];

  const selected = qs('selectedCard');
  if(selected) selected.hidden = true;

  const objection = qs('objectionResult');
  if(objection){
    objection.hidden = true;
    objection.innerHTML = '';
  }

  const comparison = qs('comparisonCard');
  if(comparison) comparison.hidden = true;

  const empty = qs('emptyState');
  if(empty) empty.hidden = true;

  const grid = qs('productsGrid');
  if(grid){
    grid.innerHTML = `<div class="loading-card">✨ Copilot actualizó el contexto...<br><span>${categoryChanged ? 'La categoría cambió. Limpiando resultados anteriores y recalculando recomendaciones.' : 'Recalculando productos con los datos actualizados.'}</span></div>`;
  }

  const strip = qs('progressStrip');
  if(strip){
    strip.innerHTML = '<span>✨ Señal de Copilot recibida</span><span>→</span><span>🧹 Limpiando resultados anteriores</span><span>→</span><span>🔎 Recalculando recomendación</span>';
  }

  const summary = qs('recommendationSummary');
  if(summary){
    summary.textContent = categoryChanged
      ? `Copilot cambió el contexto a ${state.context.category || 'nueva categoría'}. Recalculando recomendaciones...`
      : 'Copilot actualizó el contexto. Recalculando recomendaciones con los nuevos datos...';
  }
}

function findArticleFromRemote(remote){
  if(remote.articleId){
    const byId = state.knowledgeArticles.find(a => lower(a.id) === lower(remote.articleId));
    if(byId) return byId;
  }
  if(remote.articleTitle){
    const title = lower(remote.articleTitle);
    const byTitle = state.knowledgeArticles.find(a => lower(a.title).includes(title) || title.includes(lower(a.title)));
    if(byTitle) return byTitle;
  }
  return findRelevantArticle([remote.category, remote.articleTitle, remote.articleId, state.context.need, state.context.useCase].join(' '));
}

function applyObjectionFromRemote(remote, source='Agent Copilot'){
  const type = remote.objectionType || 'Precio';
  const normalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  if(qs('objectionType')) qs('objectionType').value = [...qs('objectionType').options].some(o => o.value === normalizedType) ? normalizedType : 'Precio';
  if(qs('customerPhrase')) qs('customerPhrase').value = remote.customerPhrase || '';

  const category = remote.category || state.context.category || 'Televisores';
  const article = findRelevantArticle([category, type, remote.customerPhrase, remote.articleId].join(' '));
  const p = state.selectedProduct || state.products[0];
  const productText = p ? `${p.brand} ${p.name}` : `la línea de ${category.toLowerCase()}`;
  const benefit = lower(type).includes('precio')
    ? (category === 'Computadores' ? 'comparar una alternativa más económica sin perder rendimiento clave para el uso declarado' : 'comparar contra una opción más económica y reforzar valor, tamaño e imagen')
    : lower(type).includes('garant') ? 'explicar respaldo y condiciones sin prometer beneficios no autorizados'
    : lower(type).includes('entrega') ? 'validar disponibilidad y tiempos antes de prometer entrega'
    : 'reducir incertidumbre con comparativo y siguiente paso claro';
  const advisor = article?.advisor_phrase || `Entiendo tu punto. Revisemos ${productText} frente a otra alternativa para que veas claramente qué beneficios mantienes y qué podrías sacrificar.`;

  qs('objectionResult').hidden=false;
  qs('objectionResult').innerHTML = `<div class="risk"><strong>Riesgo de pérdida: Alto</strong><br>Detectado por ${source}. Objeción: ${normalizedType}. Frase: “${remote.customerPhrase || 'No capturada'}”</div><div class="strategy"><strong>Estrategia recomendada</strong><br>${article?.summary || 'Reforzar valor y comparar alternativas concretas.'}</div><div class="benefit"><strong>Beneficio sugerido</strong><br>${benefit}.</div><div class="message-box"><strong>Frase sugerida</strong><br>${advisor}</div>`;
  qs('nextActionBox').textContent = nextBestActionForStage('objection');
  if(article) renderArticle(article, `Artículo para objeción · ${source}`);
}

async function sendDemoEventToAws(){
  if(!state.live.stateApiUrl || !state.live.conversationId){
    renderCopilotEventBox('No hay endpoint configurado', 'Agrega stateApiUrl y conversationId en la URL para enviar eventos demo a AWS.', 'warning');
    return;
  }
  const events = [
    {eventType:'knowledge_article_suggested', category: state.context.category || 'Televisores', articleId: state.context.category === 'Computadores' ? 'laptop-study-work-guide' : 'uhd-vs-qled', articleTitle: state.context.category === 'Computadores' ? 'Portátil para estudio y trabajo remoto' : 'Diferencia entre UHD, QLED y OLED'},
    {eventType:'objection_detected', category: state.context.category || 'Televisores', objectionType:'precio', customerPhrase:'Está un poco caro, lo voy a pensar'},
    {eventType:'comparison_requested', category: state.context.category || 'Televisores', comparisonFocus:'precio, marca y disponibilidad'},
    {eventType:'context_updated', category:'Computadores', budget:3000000, city:'Barranquilla', useCase:'Trabajo y estudio', need:'Portátil para trabajo remoto', priority:'Precio y calidad'}
  ];
  const eventBody = { conversationId: state.live.conversationId, source:'Client App Demo', ...events[state.live.demoEventIndex % events.length] };
  state.live.demoEventIndex += 1;
  try{
    const res = await fetch(state.live.stateApiUrl, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(eventBody) });
    const payload = await res.json();
    if(!res.ok || payload.ok === false) throw new Error(payload.error || `HTTP ${res.status}`);
    renderCopilotEventBox('Evento demo enviado a AWS', `${eventBody.eventType}. La app lo leerá en el próximo polling.`, 'success');
    setTimeout(() => fetchConversationState({manual:true}), 500);
  } catch(error){
    console.error(error);
    renderCopilotEventBox('Error enviando evento demo', error.message, 'warning');
  }
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

function inferUseCase(text, category=''){
  const t = lower(text);
  if(!t) return '';
  if(category === 'Computadores'){
    if(t.includes('gaming') || t.includes('jugar') || t.includes('juegos')) return 'Gaming';
    if(t.includes('diseño') || t.includes('diseno') || t.includes('edicion') || t.includes('edición')) return 'Diseño / edición';
    if(t.includes('videollamada') || t.includes('videollamadas')) return 'Videollamadas';
    if(t.includes('trabajo') && t.includes('estudio')) return 'Trabajo y estudio';
    if(t.includes('trabajo') || t.includes('oficina')) return 'Trabajo remoto';
    if(t.includes('estudio') || t.includes('universidad') || t.includes('clases')) return 'Estudio';
  }
  if(t.includes('deporte') || t.includes('futbol') || t.includes('fútbol')) return 'Deportes y streaming';
  if(t.includes('netflix') || t.includes('streaming') || t.includes('series')) return 'Streaming';
  if(t.includes('videojuego') || t.includes('gaming') || t.includes('jugar')) return 'Videojuegos';
  if(t.includes('película') || t.includes('pelicula') || t.includes('cine')) return 'Películas';
  return '';
}

function inferPriority(text){
  const t = lower(text);
  if(t.includes('precio') && (t.includes('calidad') || t.includes('balance'))) return 'Precio y calidad';
  if(t.includes('barato') || t.includes('económico') || t.includes('economico') || t.includes('mejor precio')) return 'Mejor precio';
  if(t.includes('marca')) return 'Marca';
  if(t.includes('entrega')) return 'Entrega rápida';
  if(t.includes('garant')) return 'Garantía';
  if(t.includes('rendimiento')) return 'Rendimiento';
  return '';
}

function initFromParams(){
  const p = getParams();
  const contextText = [
    p.intent, p.sales_intent, p.category, p.sales_category,
    p.customerNeed, p.need, p.customer_need, p.useCase, p.use_case,
    p.advisorSummary, p.advisor_summary, p.summary, p.transferSummary, p.transfer_summary
  ].join(' ');

  state.context.intent = cleanText(p.intent || p.sales_intent || '');
  state.context.category = cleanText(p.category || p.sales_category || '') || inferCategory(contextText);
  state.context.budget = normalizeBudget(p.budget || p.presupuesto || contextText);
  state.context.city = cleanText(p.city || p.ciudad || '');
  state.context.useCase = cleanText(p.useCase || p.use_case || '') || inferUseCase(contextText, state.context.category);
  state.context.priority = cleanText(p.priority || p.customer_priority || '') || inferPriority(contextText);
  state.context.need = cleanText(p.customerNeed || p.need || p.customer_need || '');
  if(!state.context.need && inferSize(contextText) && state.context.category === 'Televisores') state.context.need = `Televisor de ${inferSize(contextText)}`;
  if(!state.context.need && state.context.category === 'Computadores') state.context.need = inferUseCase(contextText, 'Computadores') ? `Computador para ${inferUseCase(contextText, 'Computadores').toLowerCase()}` : '';
  state.context.origin = hasContext() ? cleanText(p.origin || 'AVA') : '';

  qs('categoryInput').value = state.context.category || '';
  updateProfileOptions(state.context.category || 'Televisores');
  qs('budgetInput').value = state.context.budget || '';
  qs('cityInput').value = state.context.city || '';
  qs('useInput').value = state.context.useCase || '';
  qs('priorityInput').value = state.context.priority || '';
  qs('sizeInput').value = cleanText(p.screenSize || p.screen_size || p.size || '') || inferSize([state.context.need, contextText].join(' ')) || '';
  qs('brandInput').value = cleanText(p.preferredBrand || p.preferred_brand || '');
  renderContext();
  resetGuidance();
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

function resetGuidance(){
  const q = qs('questionsList');
  if(q){
    q.classList.add('muted-list');
    q.innerHTML = '<div>Esperando búsqueda o señal de Copilot para sugerir preguntas.</div>';
  }
  const pitch = qs('pitchBox');
  if(pitch){
    pitch.classList.add('empty-copy');
    pitch.textContent = 'Aún no hay argumento sugerido. Ejecuta una búsqueda o recibe una señal de Copilot.';
  }
  const next = qs('nextActionBox');
  if(next) next.textContent = 'Completar perfilamiento y buscar productos recomendados.';
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

function scrollToComparison(){
  if(!state.products.length){
    qs('recommendationSummary').textContent = 'Ejecuta primero una búsqueda para generar el comparativo entre modelos.';
    qs('emptyState').scrollIntoView({behavior:'smooth', block:'center'});
    return;
  }
  renderComparison();
  const card = qs('comparisonCard');
  if(card){
    card.hidden = false;
    card.scrollIntoView({behavior:'smooth', block:'start'});
    addHistory('Comparativo abierto por el asesor.');
  }
}

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
    if(e.target.id==='pollNowBtn') fetchConversationState({manual:true});
    if(e.target.id==='sendDemoEventBtn') sendDemoEventToAws();
    if(e.target.id==='compareBtn') scrollToComparison();
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
  initLiveConfigFromParams();
  renderHistory();
  renderDataSource();
  qs('progressStrip').innerHTML = `<span>✅ Datos listos</span><span>→</span><span>${state.productCatalog.length} productos</span><span>→</span><span>${state.knowledgeArticles.length} artículos</span>`;
}

main();
