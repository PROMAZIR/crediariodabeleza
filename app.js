// ═══════════════════════════════════════════════════
// CREDIÁRIO STARKTECH — JAVASCRIPT
// ═══════════════════════════════════════════════════

// ─── DATABASE ───
let db = {
  clientes: J('st3_cli', []),
  produtos: J('st3_prod', []),
  vendas: J('st3_vend', []),
  cupons: J('st3_cup', []),
  marcas: J('st3_marc', [
    { id: 1, nome: 'O BOTICARIO/ QDB? / EUDORA / O.U.I Paris', cat: 'Beleza', desc: 'TODAS AS MARCAS EM UM SÓ LUGAR', ativo: true, foto: '', ordem: 1 },
    { id: 2, nome: 'NATURA & AVON', cat: 'Cuidados Pele e Corpo', desc: 'Natura e Avon, agora parte do grupo Natura &Co, oferecem uma linha completa de produtos.', ativo: true, foto: '', ordem: 2 },
    { id: 3, nome: 'DeMilluz', cat: 'Roupas&Acessorios', desc: '', ativo: true, foto: '', ordem: 3 },
    { id: 4, nome: 'JEQUITI', cat: 'Cosmeticos', desc: 'A nossa perfumaria é pra quem vive com brilho nos olhos e o sorriso estampado.', ativo: true, foto: '', ordem: 4 },
  ]),
  cats: J('st3_cats', ['Maquiagem', 'Perfumaria', 'Skincare', 'Joias', 'Cabelo', 'Corpo', 'Beleza', 'Cosmeticos', 'Roupas&Acessorios', 'Cuidados Pele e Corpo']),
  interacoes: J('st3_int', []),
  lembretes: J('st3_lem', []),
  config: J('st3_cfg', { nome: 'recibo valores', email: 'reciboevalores@gmail.com', whatsapp: '', msgCob: 'Olá {nome}, sua parcela de {valor} vence em {data}. Por favor, entre em contato para regularizar.' }),
  nextId: J('st3_id', { c: 1, p: 1, v: 1, cup: 1, mar: 5 }),
};

function J(k, def) {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; }
}

function save() {
  const keys = { clientes: 'st3_cli', produtos: 'st3_prod', vendas: 'st3_vend', cupons: 'st3_cup', marcas: 'st3_marc', cats: 'st3_cats', interacoes: 'st3_int', lembretes: 'st3_lem', config: 'st3_cfg', nextId: 'st3_id' };
  Object.entries(keys).forEach(([k, s]) => { try { localStorage.setItem(s, JSON.stringify(db[k])); } catch (e) { } });
}

// ─── UTILS ───
const fmtR = v => 'R$ ' + (+v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtD = s => { if (!s) return '—'; const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };
const today = () => new Date().toISOString().split('T')[0];
const addDays = (d, n) => { const dt = new Date(d + 'T12:00:00'); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };
const isOv = s => s && new Date(s + 'T23:59:59') < new Date();
const uid = k => { const id = db.nextId[k]++; save(); return id; };
const ini = n => (n || '?').split(' ').filter(Boolean).map(x => x[0]).join('').substring(0, 2).toUpperCase();

function toast(msg, dur = 2800) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}

// ─── NAV ───
let curSection = 'dashboard';
let fotoBase64 = '';
let marcaFotoBase64 = '';
let cartItems = [];

const PAGE_TITLES = {
  dashboard: 'Dashboard', clientes: 'Gestão de Clientes', produtos: 'Produtos',
  vendas: 'Vendas a Crediário', arquivadas: 'Vendas Arquivadas', parcelas: 'Parcelas por Cliente',
  cobranca: 'Automação de Cobrança', lembretes: 'Enviar Lembretes', interacoes: 'Interações Clientes',
  acessos: 'Acessos ao App', cupons: 'Cupons', marcas: 'Marcas Parceiras', categorias: 'Categorias',
  notificacoes: 'Notificações', aniversarios: 'Aniversários', config: 'Configurações'
};

function go(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const sec = document.getElementById('section-' + id);
  const nav = document.getElementById('nav-' + id);
  if (!sec) return;
  sec.classList.add('active');
  if (nav) nav.classList.add('active');
  document.getElementById('topbar-title').textContent = PAGE_TITLES[id] || id;
  curSection = id;
  closeSidebar();
  renderSection(id);
}

function renderSection(id) {
  const m = { dashboard: renderDashboard, clientes: renderClientes, produtos: renderProdutos, vendas: renderVendas, arquivadas: renderArquivadas, parcelas: renderParcelas, cobranca: renderCobranca, lembretes: renderLembretes, interacoes: renderInteracoes, acessos: renderAcessos, cupons: renderCupons, marcas: renderMarcas, categorias: renderCats, notificacoes: renderNotificacoes, aniversarios: renderAniversarios, config: renderConfig };
  if (m[id]) m[id]();
}

function openSidebar() { document.getElementById('sidebar').classList.add('open'); document.getElementById('overlay').classList.add('show'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('overlay').classList.remove('show'); }

// ─── MODALS ───
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
  });
  renderDashboard();
});

// ═══════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════
function renderDashboard() {
  const allParcs = db.vendas.flatMap(v => v.parcelas.map(p => ({ ...p, vid: v.id, cid: v.clienteId })));
  const pendentes = allParcs.filter(p => !p.pago);
  const vencidas = pendentes.filter(p => isOv(p.venc));
  const receitaTotal = db.vendas.reduce((s, v) => s + v.total, 0);
  const prodAtivos = db.produtos.filter(p => p.ativo !== false).length;

  document.getElementById('d-welcome').textContent = `Bem-vindo, ${db.config.nome || ''}! 👋`;
  document.getElementById('sb-logo-name').textContent = db.config.nome || 'StarkTech';
  document.getElementById('sb-name').textContent = db.config.nome || '';
  document.getElementById('sb-avatar').textContent = ini(db.config.nome || 'ST');

  document.getElementById('d-total-vendas').textContent = db.vendas.length;
  document.getElementById('d-receita').textContent = fmtR(receitaTotal);
  document.getElementById('d-pendentes').textContent = pendentes.length;
  document.getElementById('d-produtos-ativos').textContent = prodAtivos;

  const nb = document.getElementById('nb-venc');
  if (vencidas.length) { nb.style.display = ''; nb.textContent = vencidas.length; }
  else nb.style.display = 'none';

  let alerts = '';
  if (vencidas.length) {
    alerts += `<div class="alert-bar alert-danger">
      <div class="alert-icon">🚨</div>
      <div class="alert-content">
        <div class="alert-title">Atenção Necessária</div>
        <div class="alert-text">Você tem <strong>${vencidas.length} parcela(s) em atraso</strong> que precisam de atenção.</div>
      </div>
      <button class="btn btn-red btn-sm" onclick="go('parcelas')">🔔 Cobrar Clientes</button>
    </div>`;
  }
  const baixo = db.produtos.filter(p => p.ativo !== false && p.estoque <= (p.estmin || 3) && p.estoque >= 0);
  if (baixo.length) {
    alerts += `<div class="alert-bar alert-warn">
      <div class="alert-icon">📦</div>
      <div class="alert-content">
        <div class="alert-title">Estoque Baixo</div>
        <div class="alert-text">${baixo.map(p => `<strong>${p.nome}</strong> (${p.estoque} un.)`).join(', ')}</div>
      </div>
    </div>`;
  }
  document.getElementById('d-alerts').innerHTML = alerts;

  const vr = document.getElementById('d-vendas-recentes');
  const ul = db.vendas.filter(v => !v.arquivada).slice(-6).reverse();
  if (!ul.length) { vr.innerHTML = `<div class="empty-state"><div class="empty-icon">🛒</div><div class="empty-title">Nenhuma venda ainda</div></div>`; }
  else {
    vr.innerHTML = ul.map(v => {
      const c = db.clientes.find(x => x.id === v.clienteId);
      return `<div class="list-row">
        <div><div class="list-name">${c?.nome || 'Avulso'}</div><div class="list-sub">${fmtD(v.data)}</div></div>
        <div><div class="list-val">${fmtR(v.total)}</div></div>
      </div>`;
    }).join('');
  }

  const pv = document.getElementById('d-parc-vencendo');
  const upcoming = allParcs.filter(p => !p.pago).sort((a, b) => a.venc > b.venc ? 1 : -1).slice(0, 6);
  if (!upcoming.length) { pv.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">Nenhuma parcela pendente</div></div>`; }
  else {
    pv.innerHTML = upcoming.map(p => {
      const ov = isOv(p.venc);
      return `<div class="list-row">
        <div><div class="list-name">Parcela ${p.n}</div><div class="list-sub" style="color:${ov ? 'var(--red)' : ''}">Vence em ${fmtD(p.venc)}</div></div>
        <div><div class="list-val" style="color:${ov ? 'var(--red)' : 'var(--amber)'}">${fmtR(p.valor)}</div><div class="list-val-sub"><span class="badge ${ov ? 'badge-red' : 'badge-amber'}">${ov ? 'vencida' : 'pendente'}</span></div></div>
      </div>`;
    }).join('');
  }
}

// ═══════════════════════════════════════════════════
// CLIENTES
// ═══════════════════════════════════════════════════
function renderClientes() {
  const totalLimite = db.clientes.reduce((s, c) => s + (c.limite || 0), 0);
  const convidados = db.clientes.filter(c => c.acesso).length;
  const ativos = db.clientes.filter(c => c.ativo !== false).length;
  document.getElementById('cli-stats').innerHTML = `
    <div class="client-stat"><div class="client-stat-val purple">${db.clientes.length}</div><div class="client-stat-label">Total de Clientes</div></div>
    <div class="client-stat"><div class="client-stat-val green">${ativos}</div><div class="client-stat-label">Clientes Ativos</div></div>
    <div class="client-stat"><div class="client-stat-val purple">${convidados}</div><div class="client-stat-label">Convidados para App</div></div>
    <div class="client-stat"><div class="client-stat-val amber">${fmtR(totalLimite)}</div><div class="client-stat-label">Limite Total</div></div>
  `;

  const q = (document.getElementById('s-cliente')?.value || '').toLowerCase();
  const statusF = document.getElementById('f-cli-status')?.value || '';
  const el = document.getElementById('lista-clientes');

  let lista = db.clientes.filter(c => {
    const match = c.nome.toLowerCase().includes(q) || (c.whatsapp || '').includes(q) || (c.email || '').toLowerCase().includes(q);
    if (!match) return false;
    if (statusF === 'ativo' && c.ativo === false) return false;
    if (statusF === 'inativo' && c.ativo !== false) return false;
    if (statusF === 'debito') {
      const deve = db.vendas.filter(v => v.clienteId === c.id).flatMap(v => v.parcelas).filter(p => !p.pago).reduce((s, p) => s + p.valor, 0);
      if (deve <= 0) return false;
    }
    return true;
  });

  if (!lista.length) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">Nenhum cliente encontrado</div><div class="empty-sub">Clique em + Novo Cliente para começar</div></div>`; return; }

  el.innerHTML = lista.map(c => {
    const compras = db.vendas.filter(v => v.clienteId === c.id);
    const deve = compras.flatMap(v => v.parcelas).filter(p => !p.pago).reduce((s, p) => s + p.valor, 0);
    const ativo = c.ativo !== false;
    return `<div class="client-card">
      <div class="client-avatar">${ini(c.nome)}</div>
      <div class="client-info">
        <div class="client-name">${c.nome}</div>
        <div class="client-contact">${c.email ? `✉️ ${c.email} ·` : ''} ${c.whatsapp ? `📱 ${c.whatsapp}` : ''}</div>
        <div class="client-meta">
          <span class="${ativo ? 'status-active' : 'status-inactive'}">${ativo ? 'Ativo' : 'Inativo'}</span>
          ${c.acesso ? `<span class="status-invited">Convidado</span>` : ''}
          ${compras.length ? `<span>${compras.length} venda(s) associada(s)</span>` : ''}
          ${deve > 0 ? `<span class="client-debt">Deve ${fmtR(deve)}</span>` : ''}
        </div>
      </div>
      <div class="client-limit-col">
        <div class="client-limit-label">Limite de Crédito</div>
        <div class="client-limit-val">${fmtR(c.limite || 0)}</div>
      </div>
      <div class="client-actions-col">
        <button class="btn btn-outline btn-sm" onclick="editCliente(${c.id})">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Editar
        </button>
        ${c.whatsapp ? `<button class="btn btn-green btn-sm" onclick="openWA('${c.whatsapp}','${c.nome}',0,'')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Reenviar
        </button>`: ''}
        <button class="btn btn-outline btn-sm" style="color:var(--red);border-color:var(--red-light)" onclick="delCliente(${c.id})">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          Excluir
        </button>
      </div>
    </div>`;
  }).join('');
}

function openClienteModal(id) {
  ['c-nome', 'c-whatsapp', 'c-email', 'c-cpf', 'c-nasc', 'c-limite', 'c-end', 'c-obs'].forEach(x => { const el = document.getElementById(x); if (el) el.value = ''; });
  document.getElementById('c-id').value = '';
  document.getElementById('mct-title').textContent = id ? 'Editar Cliente' : 'Novo Cliente';
  if (id) {
    const c = db.clientes.find(x => x.id === id); if (!c) return;
    document.getElementById('c-id').value = c.id;
    document.getElementById('c-nome').value = c.nome || '';
    document.getElementById('c-whatsapp').value = c.whatsapp || '';
    document.getElementById('c-email').value = c.email || '';
    document.getElementById('c-cpf').value = c.cpf || '';
    document.getElementById('c-nasc').value = c.nasc || '';
    document.getElementById('c-limite').value = c.limite || '';
    document.getElementById('c-end').value = c.end || '';
    document.getElementById('c-obs').value = c.obs || '';
  }
  openModal('modal-cliente');
}

function editCliente(id) { openClienteModal(id); }

function salvarCliente() {
  const nome = document.getElementById('c-nome').value.trim();
  if (!nome) { toast('❌ Nome é obrigatório!'); return; }
  const eid = parseInt(document.getElementById('c-id').value) || null;
  const o = { nome, whatsapp: document.getElementById('c-whatsapp').value.trim(), email: document.getElementById('c-email').value.trim(), cpf: document.getElementById('c-cpf').value.trim(), nasc: document.getElementById('c-nasc').value, limite: parseFloat(document.getElementById('c-limite').value) || 0, end: document.getElementById('c-end').value.trim(), obs: document.getElementById('c-obs').value.trim(), acesso: false, ativo: true };
  if (eid) { const i = db.clientes.findIndex(x => x.id === eid); if (i >= 0) db.clientes[i] = { ...db.clientes[i], ...o }; }
  else { o.id = uid('c'); db.clientes.push(o); }
  save(); closeModal('modal-cliente'); renderClientes(); toast('✅ Cliente salvo!');
}

function delCliente(id) { if (!confirm('Excluir este cliente?')) return; db.clientes = db.clientes.filter(c => c.id !== id); save(); renderClientes(); toast('🗑️ Excluído'); }
function copiarLinkApp() { navigator.clipboard.writeText(window.location.href).then(() => toast('🔗 Link copiado!')).catch(() => toast('📋 Copie a URL do navegador')); }

function openSegModal() {
  const total = db.clientes.length;
  const comDebito = db.clientes.filter(c => { const d = db.vendas.filter(v => v.clienteId === c.id).flatMap(v => v.parcelas).filter(p => !p.pago).reduce((s, p) => s + p.valor, 0); return d > 0; }).length;
  const semCompra = db.clientes.filter(c => !db.vendas.some(v => v.clienteId === c.id)).length;
  document.getElementById('seg-content').innerHTML = `
    <div class="seg-row"><span>Total de clientes</span><strong>${total}</strong></div>
    <div class="seg-row"><span>🔴 Com débito em aberto</span><strong>${comDebito}</strong></div>
    <div class="seg-row"><span>🟡 Sem compras registradas</span><strong>${semCompra}</strong></div>
    <div class="seg-row"><span>🟢 Clientes ativos</span><strong>${db.clientes.filter(c => c.ativo !== false).length}</strong></div>
    <div class="seg-row"><span>🔵 Com acesso ao App</span><strong>${db.clientes.filter(c => c.acesso).length}</strong></div>
  `;
  openModal('modal-seg');
}

// ═══════════════════════════════════════════════════
// PRODUTOS
// ═══════════════════════════════════════════════════
function renderProdutos() {
  const q = (document.getElementById('s-produto')?.value || '').toLowerCase();
  const catF = document.getElementById('f-cat-produto')?.value || '';
  const showInativo = document.getElementById('f-inativos')?.checked || false;
  const el = document.getElementById('lista-produtos');

  const catSel = document.getElementById('f-cat-produto');
  if (catSel) { const cur = catSel.value; catSel.innerHTML = '<option value="">Todas as Categorias</option>' + db.cats.map(c => `<option value="${c}">${c}</option>`).join(''); catSel.value = cur; }

  let lista = db.produtos.filter(p => {
    const ativo = p.ativo !== false;
    if (!showInativo && !ativo) return false;
    const matchQ = p.nome.toLowerCase().includes(q) || (p.marca || '').toLowerCase().includes(q) || (p.codigo || '').includes(q);
    const matchCat = !catF || p.cat === catF;
    return matchQ && matchCat;
  });

  if (!lista.length) { el.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📦</div><div class="empty-title">Nenhum produto encontrado</div></div>`; return; }

  el.innerHTML = lista.map(p => {
    const ativo = p.ativo !== false;
    const low = p.estoque <= (p.estmin || 3) && p.estoque >= 0;
    const lucre = (p.revenda || 0) - (p.paguei || p.custoNormal || 0);
    return `<div class="product-card ${ativo ? '' : 'inactive'}">
      <div class="product-img-wrap">
        ${p.foto ? `<img src="${p.foto}" alt="${p.nome}">` : `<div class="product-img-placeholder">📦</div>`}
        ${low ? `<div class="low-stock-badge">⚠️ ${p.estoque} un.</div>` : ''}
        ${!ativo ? `<div class="inactive-badge">INATIVO</div>` : ''}
      </div>
      <div class="product-card-body">
        ${p.codigo ? `<div class="product-code">${p.codigo}</div>` : ''}
        <div class="product-name">${p.nome}</div>
        <div class="product-cat">${p.cat || p.marca || ''}</div>
        <div class="price-table">
          ${p.custoNormal ? `<div class="price-row"><span class="label">Custo</span><span class="value">${fmtR(p.custoNormal)}</span></div>` : ''}
          ${p.paguei ? `<div class="price-row"><span class="label">Paguei</span><span class="value green">${fmtR(p.paguei)}</span></div>` : ''}
          ${p.revenda ? `<div class="price-row"><span class="label">Revenda</span><span class="value">${fmtR(p.revenda)}</span></div>` : ''}
          ${lucre > 0 ? `<div class="price-row"><span class="label">Lucre</span><span class="value green">+${fmtR(lucre)}</span></div>` : ''}
          ${p.oferta ? `<div class="price-row"><span class="label">Oferta</span><span class="value" style="color:var(--orange)">${fmtR(p.oferta)}</span></div>` : ''}
        </div>
      </div>
      <div class="product-actions">
        <button class="btn btn-primary btn-sm" onclick="go('vendas');setTimeout(()=>openVendaComProd(${p.id}),80)">🛒 Vender</button>
        <button class="btn btn-outline btn-sm" onclick="editProduto(${p.id})">✏️</button>
        <button class="btn btn-outline btn-sm" style="color:var(--red);border-color:var(--red-light)" onclick="delProduto(${p.id})">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

function openProdutoModal(id) {
  fotoBase64 = '';
  ['p-nome', 'p-codigo', 'p-estoque', 'p-estmin', 'p-custo-normal', 'p-paguei', 'p-revenda', 'p-oferta', 'p-desc'].forEach(x => { const el = document.getElementById(x); if (el) el.value = ''; });
  document.getElementById('p-id').value = '';
  document.getElementById('p-ativo').checked = true;
  document.getElementById('p-calc-display').textContent = 'Preencha os preços para ver os cálculos';
  document.getElementById('p-foto-remove').style.display = 'none';
  const fw = document.getElementById('p-foto-wrap');
  fw.innerHTML = `<div class="photo-upload-icon">📷</div><div class="photo-upload-label">Clique para fazer upload da foto</div>`;

  const ms = document.getElementById('p-marca'); ms.innerHTML = db.marcas.map(m => `<option value="${m.nome}">${m.nome}</option>`).join('');
  const cs = document.getElementById('p-cat'); cs.innerHTML = '<option value="">Sem categoria</option>' + db.cats.map(c => `<option value="${c}">${c}</option>`).join('');
  document.getElementById('mpt-title').textContent = id ? 'Editar Produto' : 'Novo Produto';

  if (id) {
    const p = db.produtos.find(x => x.id === id); if (!p) return;
    document.getElementById('p-id').value = p.id;
    document.getElementById('p-nome').value = p.nome || '';
    document.getElementById('p-codigo').value = p.codigo || '';
    document.getElementById('p-estoque').value = p.estoque ?? 0;
    document.getElementById('p-estmin').value = p.estmin || 3;
    document.getElementById('p-custo-normal').value = p.custoNormal || '';
    document.getElementById('p-paguei').value = p.paguei || '';
    document.getElementById('p-revenda').value = p.revenda || '';
    document.getElementById('p-oferta').value = p.oferta || '';
    document.getElementById('p-desc').value = p.desc || '';
    document.getElementById('p-ativo').checked = p.ativo !== false;
    ms.value = p.marca || ''; cs.value = p.cat || '';
    if (p.foto) { fotoBase64 = p.foto; setFotoPreview(p.foto); }
    calcPrecoProduto();
  }
  openModal('modal-produto');
}

function editProduto(id) { openProdutoModal(id); }

function handleFotoUpload(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => { fotoBase64 = ev.target.result; setFotoPreview(fotoBase64); };
  reader.readAsDataURL(file);
}

function setFotoPreview(src) {
  document.getElementById('p-foto-wrap').innerHTML = `<img src="${src}" style="padding:10px">`;
  document.getElementById('p-foto-remove').style.display = '';
}

function removeFoto() {
  fotoBase64 = '';
  document.getElementById('p-foto-wrap').innerHTML = `<div class="photo-upload-icon">📷</div><div class="photo-upload-label">Clique para fazer upload da foto</div>`;
  document.getElementById('p-foto-remove').style.display = 'none';
  document.getElementById('p-foto-input').value = '';
}

function calcPrecoProduto() {
  const cn = parseFloat(document.getElementById('p-custo-normal').value) || 0;
  const pg = parseFloat(document.getElementById('p-paguei').value) || 0;
  const rv = parseFloat(document.getElementById('p-revenda').value) || 0;
  const of = parseFloat(document.getElementById('p-oferta').value) || 0;
  const el = document.getElementById('p-calc-display');
  if (!rv) { el.textContent = 'Preencha o preço de Revenda para calcular'; return; }
  const custo = pg || cn;
  if (!custo) { el.textContent = 'Preencha o custo (Paguei ou Custo Normal)'; return; }
  const lucre = rv - custo;
  const marg = rv > 0 ? ((lucre / rv) * 100).toFixed(0) : 0;
  let txt = `Lucre na Revenda: ${fmtR(lucre)} (${marg}%)`;
  if (cn > 0 && pg > 0 && pg < cn) txt += ` · Lucro Extra: +${fmtR(cn - pg)}`;
  if (of > 0) txt += ` · Lucro na Oferta: ${fmtR(of - custo)}`;
  el.textContent = txt;
}

function salvarProduto() {
  const nome = document.getElementById('p-nome').value.trim();
  if (!nome) { toast('❌ Nome é obrigatório!'); return; }
  const eid = parseInt(document.getElementById('p-id').value) || null;
  const o = { nome, codigo: document.getElementById('p-codigo').value.trim(), marca: document.getElementById('p-marca').value, cat: document.getElementById('p-cat').value, estoque: parseInt(document.getElementById('p-estoque').value) || 0, estmin: parseInt(document.getElementById('p-estmin').value) || 3, custoNormal: parseFloat(document.getElementById('p-custo-normal').value) || 0, paguei: parseFloat(document.getElementById('p-paguei').value) || 0, revenda: parseFloat(document.getElementById('p-revenda').value) || 0, oferta: parseFloat(document.getElementById('p-oferta').value) || 0, desc: document.getElementById('p-desc').value.trim(), ativo: document.getElementById('p-ativo').checked, foto: fotoBase64 };
  if (eid) { const i = db.produtos.findIndex(x => x.id === eid); if (i >= 0) db.produtos[i] = { ...db.produtos[i], ...o }; }
  else { o.id = uid('p'); db.produtos.push(o); }
  save(); closeModal('modal-produto'); renderProdutos(); toast('✅ Produto salvo!');
}

function delProduto(id) { if (!confirm('Excluir este produto?')) return; db.produtos = db.produtos.filter(p => p.id !== id); save(); renderProdutos(); toast('🗑️ Excluído'); }

// ═══════════════════════════════════════════════════
// VENDAS (multi-produto)
// ═══════════════════════════════════════════════════
function renderVendas() {
  const q = (document.getElementById('s-venda')?.value || '').toLowerCase();
  const el = document.getElementById('lista-vendas');
  const lista = db.vendas.filter(v => !v.arquivada).filter(v => { const c = db.clientes.find(x => x.id === v.clienteId); return (c?.nome || '').toLowerCase().includes(q); });
  if (!lista.length) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">🛒</div><div class="empty-title">Nenhuma venda registrada</div></div>`; return; }
  el.innerHTML = lista.slice().reverse().map(v => vendaCard(v, false)).join('');
}

function renderArquivadas() {
  const el = document.getElementById('lista-arquivadas');
  const lista = db.vendas.filter(v => v.arquivada);
  if (!lista.length) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">🗄️</div><div class="empty-title">Nenhuma venda arquivada</div></div>`; return; }
  el.innerHTML = lista.slice().reverse().map(v => vendaCard(v, true)).join('');
}

function vendaCard(v, arq) {
  const c = db.clientes.find(x => x.id === v.clienteId);
  const pgLbl = { pix: '📱 Pix', dinheiro: '💵 Dinheiro', debito: '💳 Débito', credito: '💳 Crédito', crediario: '📅 Crediário' };
  const pago = v.parcelas.filter(x => x.pago).reduce((s, x) => s + x.valor, 0);
  const pend = v.parcelas.filter(x => !x.pago).reduce((s, x) => s + x.valor, 0);
  const prog = v.total > 0 ? (pago / v.total * 100) : 100;
  const itens = v.itens || [];

  return `<div class="sale-card">
    <div class="sale-header">
      <div>
        <div class="sale-client">${c?.nome || 'Avulso'}</div>
        <div class="sale-detail">${itens.length} itens · ${fmtD(v.data)} · <span class="pgto-chip">${pgLbl[v.pgto] || v.pgto}</span></div>
        <div class="sale-items">
          ${itens.slice(0, 5).map(it => { const p = db.produtos.find(x => x.id === it.produtoId); return `<div class="sale-item-thumb" title="${p?.nome || '?'}">${p?.foto ? `<img src="${p.foto}">` : (p?.nome || '?').charAt(0)}</div>`; }).join('')}
          ${itens.length > 5 ? `<div class="sale-item-thumb">+${itens.length - 5}</div>` : ''}
        </div>
        ${v.obs ? `<div class="sale-detail" style="margin-top:4px">💬 ${v.obs}</div>` : ''}
      </div>
      <div style="text-align:right">
        <div class="sale-amount">${fmtR(v.total)}</div>
        <div class="sale-parc-info">${v.pgto === 'crediario' && v.nparc ? `${v.nparc}x de ${fmtR(v.total / v.nparc)}` : ''}</div>
        <div style="margin-top:5px">${pend > 0 ? `<span class="badge badge-amber">Deve ${fmtR(pend)}</span>` : `<span class="badge badge-green">✅ Pago</span>`}</div>
      </div>
    </div>
    ${v.parcelas.length > 0 ? `
    <div class="progress-wrap" style="margin-bottom:8px"><div class="progress-bar" style="width:${prog}%"></div></div>
    <div class="parc-chips">
      ${v.parcelas.map((parc, i) => { const ov = !parc.pago && isOv(parc.venc); const cls = parc.pago ? 'paid' : (ov ? 'overdue' : 'open'); const lbl = parc.pago ? `✅ ${parc.n}ª` : (ov ? `🚨 ${parc.n}ª` : `⏳ ${parc.n}ª ${fmtD(parc.venc)}`); return `<span class="parc-chip ${cls}" onclick="pagarParc(${v.id},${i})">${lbl} · ${fmtR(parc.valor)}</span>`; }).join('')}
    </div>`: ''}
    <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap">
      ${!arq && pend === 0 ? `<button class="btn btn-ghost btn-sm" onclick="arquivarV(${v.id})">🗄️ Arquivar</button>` : ''}
      ${arq ? `<button class="btn btn-outline btn-sm" onclick="desarquivarV(${v.id})">↩️ Restaurar</button>` : ''}
      ${c?.whatsapp ? `<button class="btn btn-green btn-sm" onclick="openWA('${c.whatsapp}','${c.nome}',${pend},'')">💬 WhatsApp</button>` : ''}
      <button class="btn btn-outline btn-sm" style="color:var(--red);border-color:var(--red-light);margin-left:auto" onclick="delVenda(${v.id})">🗑️</button>
    </div>
  </div>`;
}

// CARRINHO
function openVendaModal() {
  cartItems = [];
  document.getElementById('v-cli').innerHTML = '<option value="">Selecione o cliente...</option>' + db.clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
  const vps = document.getElementById('v-prod-sel');
  vps.innerHTML = '<option value="">Selecione o produto...</option>' + db.produtos.filter(p => p.ativo !== false).map(p => `<option value="${p.id}">${p.nome} (${p.estoque} un.) — ${fmtR(p.revenda || 0)}</option>`).join('');
  document.getElementById('v-qtd-sel').value = 1;
  document.getElementById('v-preco-sel').value = '';
  document.getElementById('v-desc').value = 0;
  document.getElementById('v-obs').value = '';
  document.getElementById('v-pgto').value = 'crediario';
  document.getElementById('v-nparc').value = 2;
  document.getElementById('v-venc').value = addDays(today(), 30);
  renderCarrinho();
  toggleParcelas();
  openModal('modal-venda');
}

function openVendaComProd(pid) {
  openVendaModal();
  setTimeout(() => { document.getElementById('v-prod-sel').value = pid; const p = db.produtos.find(x => x.id === pid); if (p) document.getElementById('v-preco-sel').value = p.revenda || 0; }, 80);
}

function adicionarItemCarrinho() {
  const pid = parseInt(document.getElementById('v-prod-sel').value) || null;
  if (!pid) { toast('❌ Selecione um produto!'); return; }
  const qtd = parseInt(document.getElementById('v-qtd-sel').value) || 1;
  const pr = parseFloat(document.getElementById('v-preco-sel').value) || 0;
  const p = db.produtos.find(x => x.id === pid);
  if (!p) { toast('❌ Produto não encontrado!'); return; }
  if (p.estoque < qtd) { toast(`❌ Estoque insuficiente! Disponível: ${p.estoque}`); return; }
  const existing = cartItems.find(x => x.produtoId === pid);
  if (existing) { existing.qtd += qtd; existing.preco = pr; }
  else { cartItems.push({ produtoId: pid, nome: p.nome, qtd, preco: pr, foto: p.foto }); }
  document.getElementById('v-prod-sel').value = '';
  document.getElementById('v-qtd-sel').value = 1;
  document.getElementById('v-preco-sel').value = '';
  renderCarrinho(); calcVendaTotal();
}

function removerItemCarrinho(idx) { cartItems.splice(idx, 1); renderCarrinho(); calcVendaTotal(); }

function renderCarrinho() {
  const el = document.getElementById('v-cart');
  if (!cartItems.length) { el.innerHTML = `<div style="text-align:center;padding:20px;border:2px dashed var(--border);border-radius:10px;color:var(--text-4);font-size:0.82rem">Adicione produtos acima para iniciar a venda</div>`; return; }
  el.innerHTML = `<div class="cart-items">${cartItems.map((it, i) => `
    <div class="cart-item">
      <div class="sale-item-thumb">${it.foto ? `<img src="${it.foto}">` : it.nome.charAt(0)}</div>
      <div class="cart-item-name">${it.nome}</div>
      <div class="cart-item-price">×${it.qtd} · ${fmtR(it.preco)}</div>
      <div class="cart-item-total">${fmtR(it.qtd * it.preco)}</div>
      <button class="btn btn-outline btn-sm btn-icon" style="color:var(--red);border-color:var(--red-light)" onclick="removerItemCarrinho(${i})">✕</button>
    </div>`).join('')}</div>`;
}

function calcVendaTotal() {
  const subtotal = cartItems.reduce((s, it) => s + it.qtd * it.preco, 0);
  const d = parseFloat(document.getElementById('v-desc').value) || 0;
  const total = subtotal - d;
  const np = parseInt(document.getElementById('v-nparc').value) || 2;
  const pgto = document.getElementById('v-pgto').value;
  let txt = fmtR(total);
  if (pgto === 'crediario' && np > 1) txt += ` · ${np}x de ${fmtR(total / np)}`;
  document.getElementById('v-total').textContent = txt;
}

function toggleParcelas() {
  const ep = document.getElementById('v-pgto').value === 'crediario';
  document.getElementById('v-nparc-g').style.display = ep ? '' : 'none';
  document.getElementById('v-venc-g').style.display = ep ? '' : 'none';
  calcVendaTotal();
}

function salvarVenda() {
  const cid = parseInt(document.getElementById('v-cli').value) || null;
  if (!cid) { toast('❌ Selecione um cliente!'); return; }
  if (!cartItems.length) { toast('❌ Adicione ao menos um produto!'); return; }

  const d = parseFloat(document.getElementById('v-desc').value) || 0;
  const pgto = document.getElementById('v-pgto').value;
  const np = parseInt(document.getElementById('v-nparc').value) || 2;
  const v1 = document.getElementById('v-venc').value || addDays(today(), 30);
  const obs = document.getElementById('v-obs').value.trim();
  const total = cartItems.reduce((s, it) => s + it.qtd * it.preco, 0) - d;

  for (const it of cartItems) { const p = db.produtos.find(x => x.id === it.produtoId); if (p && p.estoque < it.qtd) { toast(`❌ Estoque insuficiente para ${p.nome}!`); return; } }

  let parcs = [];
  if (pgto === 'crediario') { const vp = total / np; parcs = Array.from({ length: np }, (_, i) => ({ n: i + 1, valor: +vp.toFixed(2), venc: addDays(v1, 30 * i), pago: false })); }
  else { parcs = [{ n: 1, valor: total, venc: today(), pago: true }]; }

  const venda = { id: uid('v'), clienteId: cid, itens: [...cartItems], total, desc: d, pgto, obs, data: today(), parcelas: parcs, arquivada: false, nparc: pgto === 'crediario' ? np : 1 };
  db.vendas.push(venda);
  cartItems.forEach(it => { const p = db.produtos.find(x => x.id === it.produtoId); if (p) p.estoque = Math.max(0, p.estoque - it.qtd); });
  cartItems = [];
  save(); closeModal('modal-venda'); renderVendas(); toast('✅ Venda registrada!');
}

function pagarParc(vid, idx) {
  const v = db.vendas.find(x => x.id === vid); if (!v || v.parcelas[idx]?.pago) return;
  v.parcelas[idx].pago = true;
  if (v.parcelas.every(p => p.pago)) v.arquivada = true;
  save(); renderSection(curSection); renderDashboard(); toast('💰 Parcela paga!');
}

function arquivarV(id) { const v = db.vendas.find(x => x.id === id); if (v) { v.arquivada = true; save(); renderVendas(); toast('🗄️ Arquivada'); } }
function desarquivarV(id) { const v = db.vendas.find(x => x.id === id); if (v) { v.arquivada = false; save(); renderArquivadas(); toast('↩️ Restaurada'); } }
function delVenda(id) { if (!confirm('Excluir esta venda?')) return; db.vendas = db.vendas.filter(v => v.id !== id); save(); renderSection(curSection); toast('🗑️ Excluída'); }

// ═══════════════════════════════════════════════════
// PARCELAS
// ═══════════════════════════════════════════════════
function renderParcelas() {
  const q = (document.getElementById('s-parc-cli')?.value || '').toLowerCase();
  const allParcs = db.vendas.flatMap(v => v.parcelas);
  const pagas = allParcs.filter(p => p.pago).length;
  const pendentes = allParcs.filter(p => !p.pago && !isOv(p.venc)).length;
  const atrasadas = allParcs.filter(p => !p.pago && isOv(p.venc)).length;

  document.getElementById('parc-stats').innerHTML = `
    <div class="stat-card"><div><div class="stat-label">Total de Parcelas</div><div class="stat-value">${allParcs.length}</div></div><div class="stat-icon blue">📅</div></div>
    <div class="stat-card"><div><div class="stat-label">Pagas</div><div class="stat-value green">${pagas}</div></div><div class="stat-icon green">✅</div></div>
    <div class="stat-card"><div><div class="stat-label">Pendentes</div><div class="stat-value amber">${pendentes}</div></div><div class="stat-icon amber">⏳</div></div>
    <div class="stat-card"><div><div class="stat-label">Atrasadas</div><div class="stat-value red">${atrasadas}</div></div><div class="stat-icon red">🚨</div></div>
  `;

  const el = document.getElementById('lista-parcelas');
  if (!q) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">Pesquise um cliente</div><div class="empty-sub">Digite o nome acima para visualizar as parcelas</div></div>`; return; }

  const clientes = db.clientes.filter(c => c.nome.toLowerCase().includes(q));
  const vendasFiltradas = db.vendas.filter(v => clientes.some(c => c.id === v.clienteId));
  const showVelhas = document.getElementById('f-parc-velhas')?.checked || false;

  if (!vendasFiltradas.length) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">Nenhum cliente encontrado</div></div>`; return; }

  const trinta = new Date(); trinta.setDate(trinta.getDate() - 30);

  el.innerHTML = vendasFiltradas.map(v => {
    const c = db.clientes.find(x => x.id === v.clienteId);
    const total = v.parcelas.reduce((s, p) => s + p.valor, 0);
    const pago = v.parcelas.filter(p => p.pago).reduce((s, p) => s + p.valor, 0);
    const pend = total - pago;
    let parcsFiltradas = v.parcelas;
    if (!showVelhas) parcsFiltradas = v.parcelas.filter(p => !p.pago || new Date(p.venc) >= trinta);
    return `<div class="parc-client-row">
      <div class="parc-client-header" onclick="toggleParcClient(this)">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="client-avatar" style="width:38px;height:38px;font-size:0.8rem">${ini(c?.nome || '?')}</div>
          <div><div class="parc-client-name">${c?.nome || '?'}</div><div class="parc-client-sub">${v.itens?.length || 1} produto(s) · Total: ${fmtR(total)}</div></div>
        </div>
        <div style="display:flex;align-items:center;gap:14px">
          <div class="parc-client-summary"><div class="parc-client-total">${fmtR(pend)}</div><div style="font-size:0.68rem;color:var(--text-4)">${pend > 0 ? 'pendente' : 'quitado'}</div></div>
          ${c?.whatsapp ? `<button class="btn btn-green btn-sm" onclick="event.stopPropagation();openWA('${c.whatsapp}','${c.nome}',${pend},'')">💬</button>` : ''}
          <svg class="parc-expand-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      <div class="parc-client-body">
        <div class="progress-wrap" style="margin-bottom:8px"><div class="progress-bar" style="width:${total > 0 ? (pago / total * 100) : 0}%"></div></div>
        <div style="font-size:0.7rem;color:var(--text-4);margin-bottom:10px">${fmtR(pago)} de ${fmtR(total)} recebido</div>
        <div class="parc-chips">
          ${parcsFiltradas.map(parc => { const ov = !parc.pago && isOv(parc.venc); const realIdx = v.parcelas.findIndex(p => p.n === parc.n); const cls = parc.pago ? 'paid' : (ov ? 'overdue' : 'open'); const lbl = parc.pago ? `✅ ${parc.n}ª` : (ov ? `🚨 ${parc.n}ª` : `⏳ ${parc.n}ª ${fmtD(parc.venc)}`); return `<span class="parc-chip ${cls}" onclick="pagarParc(${v.id},${realIdx})">${lbl} · ${fmtR(parc.valor)}</span>`; }).join('')}
        </div>
      </div>
    </div>`;
  }).join('');
}

function toggleParcClient(header) {
  const body = header.nextElementSibling;
  const icon = header.querySelector('.parc-expand-icon');
  body.classList.toggle('open'); icon.classList.toggle('open');
}

// ═══════════════════════════════════════════════════
// COBRANÇA
// ═══════════════════════════════════════════════════
function renderCobranca() {
  const v = db.vendas.filter(v => v.parcelas.some(p => !p.pago && isOv(p.venc)));
  document.getElementById('cob-msg').value = db.config.msgCob || '';
  document.getElementById('cob-resumo').innerHTML = v.length
    ? `<div class="alert-bar alert-danger"><div class="alert-icon">🚨</div><div class="alert-content"><div class="alert-title">${v.length} venda(s) com parcelas vencidas</div><div class="alert-text">${[...new Set(v.map(x => x.clienteId))].length} cliente(s) afetados</div></div></div>`
    : `<div class="alert-bar alert-success"><div class="alert-icon">✅</div><div class="alert-content"><div class="alert-title">Tudo em dia! Nenhuma parcela vencida.</div></div></div>`;
}

function salvarCobranca() { db.config.msgCob = document.getElementById('cob-msg').value; save(); toast('✅ Configuração salva!'); }
function dispararCobranca() {
  const v = db.vendas.filter(x => x.parcelas.some(p => !p.pago && isOv(p.venc)));
  if (!v.length) { toast('✅ Nenhuma parcela vencida!'); return; }
  v.forEach(venda => { const c = db.clientes.find(x => x.id === venda.clienteId); const parc = venda.parcelas.find(p => !p.pago && isOv(p.venc)); if (c && parc) db.lembretes.push({ id: Date.now() + venda.id, clienteId: c.id, msg: `Cobrança automática — ${fmtR(parc.valor)}`, data: today(), canal: 'whatsapp' }); });
  save(); toast(`🚀 ${v.length} cobranças disparadas!`); renderCobranca();
}

// ═══════════════════════════════════════════════════
// LEMBRETES
// ═══════════════════════════════════════════════════
function renderLembretes() {
  document.getElementById('lem-cli').innerHTML = '<option value="">Selecione...</option>' + db.clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
  const el = document.getElementById('hist-lembretes');
  if (!db.lembretes.length) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">📲</div><div class="empty-title">Nenhum lembrete enviado</div></div>`; return; }
  el.innerHTML = db.lembretes.slice().reverse().slice(0, 30).map(l => { const c = db.clientes.find(x => x.id === l.clienteId); return `<div class="list-row"><div><div class="list-name">${c?.nome || '?'} <span class="badge badge-blue">${l.canal}</span></div><div class="list-sub">${fmtD(l.data)}</div><div style="font-size:0.8rem;margin-top:3px;color:var(--text-3)">${l.msg}</div></div></div>`; }).join('');
}

function enviarLembrete() {
  const cid = parseInt(document.getElementById('lem-cli').value) || null;
  const msg = document.getElementById('lem-msg').value.trim();
  const canal = document.getElementById('lem-canal').value;
  if (!cid || !msg) { toast('❌ Selecione cliente e escreva a mensagem!'); return; }
  const c = db.clientes.find(x => x.id === cid);
  db.lembretes.push({ id: Date.now(), clienteId: cid, msg, data: today(), canal });
  save(); if (canal === 'whatsapp' && c?.whatsapp) openWA(c.whatsapp, c.nome, 0, '', msg);
  document.getElementById('lem-msg').value = ''; renderLembretes(); toast('📤 Lembrete registrado!');
}

function enviarParaTodos() {
  const p = db.vendas.filter(v => v.parcelas.some(p => !p.pago));
  p.forEach(v => { const c = db.clientes.find(x => x.id === v.clienteId); if (c) db.lembretes.push({ id: Date.now() + v.id, clienteId: c.id, msg: 'Lembrete de parcelas pendentes', data: today(), canal: 'whatsapp' }); });
  save(); renderLembretes(); toast(`📢 ${p.length} lembretes registrados!`);
}

// ═══════════════════════════════════════════════════
// INTERAÇÕES
// ═══════════════════════════════════════════════════
function renderInteracoes() {
  document.getElementById('int-cli').innerHTML = '<option value="">Selecione...</option>' + db.clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
  const el = document.getElementById('lista-interacoes');
  if (!db.interacoes.length) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">💬</div><div class="empty-title">Nenhuma interação registrada</div></div>`; return; }
  const tipos = { cobranca: '🔴 Cobrança', suporte: '🔵 Suporte', venda: '🟢 Venda', reclamacao: '🟠 Reclamação', elogio: '🟣 Elogio', outro: '⚪ Outro' };
  el.innerHTML = db.interacoes.slice().reverse().map(i => { const c = db.clientes.find(x => x.id === i.clienteId); return `<div class="list-row"><div style="flex:1"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span style="font-weight:600">${c?.nome || '?'}</span><span class="badge badge-gray">${tipos[i.tipo] || i.tipo}</span><span style="font-size:0.68rem;color:var(--text-4);margin-left:auto">${fmtD(i.data)}</span></div><div style="font-size:0.8rem;color:var(--text-3);margin-top:4px">${i.obs}</div></div></div>`; }).join('');
}

function salvarInteracao() {
  const cid = parseInt(document.getElementById('int-cli').value) || null;
  const tipo = document.getElementById('int-tipo').value;
  const obs = document.getElementById('int-obs').value.trim();
  if (!cid || !obs) { toast('❌ Selecione cliente e escreva a observação!'); return; }
  db.interacoes.push({ id: Date.now(), clienteId: cid, tipo, obs, data: today() });
  save(); document.getElementById('int-obs').value = ''; renderInteracoes(); toast('✅ Registrado!');
}

// ═══════════════════════════════════════════════════
// ACESSOS
// ═══════════════════════════════════════════════════
function renderAcessos() {
  const el = document.getElementById('lista-acessos');
  if (!db.clientes.length) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔑</div><div class="empty-title">Nenhum cliente cadastrado</div></div>`; return; }
  el.innerHTML = db.clientes.map(c => `<div class="access-row">
    <div style="display:flex;align-items:center;gap:12px">
      <div class="client-avatar" style="width:40px;height:40px;font-size:0.8rem">${ini(c.nome)}</div>
      <div><div style="font-weight:600;font-size:0.9rem">${c.nome}</div><div style="font-size:0.71rem;color:var(--text-4)">${c.whatsapp || c.email || '—'}</div></div>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <span class="${c.acesso ? 'status-invited' : 'status-inactive'}">${c.acesso ? 'Convidado' : 'Inativo'}</span>
      <label class="toggle"><input type="checkbox" ${c.acesso ? 'checked' : ''} onchange="toggleAcesso(${c.id})"><span class="toggle-slider"></span></label>
    </div>
  </div>`).join('');
}

function toggleAcesso(id) { const c = db.clientes.find(x => x.id === id); if (!c) return; c.acesso = !c.acesso; save(); renderAcessos(); toast(c.acesso ? '✅ Acesso ativado' : '🔒 Acesso revogado'); }

// ═══════════════════════════════════════════════════
// CUPONS
// ═══════════════════════════════════════════════════
function renderCupons() {
  const el = document.getElementById('lista-cupons');
  if (!db.cupons.length) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">🎟️</div><div class="empty-title">Nenhum cupom criado</div></div>`; return; }
  el.innerHTML = db.cupons.map(cup => { const exp = cup.validade && new Date(cup.validade) < new Date(); return `<div class="cupom-card"><div><div class="cupom-code">${cup.codigo}</div><div style="font-size:0.73rem;color:var(--text-3);margin-top:3px">${cup.tipo === 'percent' ? cup.valor + '%' : 'R$ ' + cup.valor} desconto${cup.validade ? ` · Válido até ${fmtD(cup.validade)}` : ''}</div>${cup.desc ? `<div style="font-size:0.7rem;color:var(--text-4)">${cup.desc}</div>` : ''}</div><div style="display:flex;gap:7px;align-items:center"><span class="badge ${exp ? 'badge-red' : 'badge-green'}">${exp ? 'Expirado' : 'Ativo'}</span><button class="btn btn-outline btn-sm btn-icon" onclick="openCupomModal(${cup.id})">✏️</button><button class="btn btn-outline btn-sm btn-icon" style="color:var(--red)" onclick="delCupom(${cup.id})">🗑️</button></div></div>`; }).join('');
}

function openCupomModal(id) {
  ['cup-cod', 'cup-valor', 'cup-val', 'cup-usos', 'cup-desc'].forEach(x => { const e = document.getElementById(x); if (e) e.value = ''; });
  document.getElementById('cup-id').value = '';
  if (id && typeof id === 'number') { const cup = db.cupons.find(x => x.id === id); if (!cup) return; document.getElementById('cup-id').value = cup.id; document.getElementById('cup-cod').value = cup.codigo; document.getElementById('cup-tipo').value = cup.tipo; document.getElementById('cup-valor').value = cup.valor; document.getElementById('cup-val').value = cup.validade || ''; document.getElementById('cup-usos').value = cup.usos || ''; document.getElementById('cup-desc').value = cup.desc || ''; }
  openModal('modal-cupom');
}

function salvarCupom() {
  const cod = document.getElementById('cup-cod').value.trim().toUpperCase();
  if (!cod) { toast('❌ Código obrigatório!'); return; }
  const eid = parseInt(document.getElementById('cup-id').value) || null;
  const o = { codigo: cod, tipo: document.getElementById('cup-tipo').value, valor: parseFloat(document.getElementById('cup-valor').value) || 0, validade: document.getElementById('cup-val').value, usos: parseInt(document.getElementById('cup-usos').value) || null, desc: document.getElementById('cup-desc').value.trim() };
  if (eid) { const i = db.cupons.findIndex(x => x.id === eid); if (i >= 0) db.cupons[i] = { ...db.cupons[i], ...o }; }
  else { o.id = uid('cup'); db.cupons.push(o); }
  save(); closeModal('modal-cupom'); renderCupons(); toast('✅ Cupom salvo!');
}

function delCupom(id) { if (!confirm('Excluir cupom?')) return; db.cupons = db.cupons.filter(c => c.id !== id); save(); renderCupons(); toast('🗑️ Excluído'); }

// ═══════════════════════════════════════════════════
// MARCAS
// ═══════════════════════════════════════════════════
function renderMarcas() {
  const el = document.getElementById('lista-marcas');
  const sorted = [...db.marcas].sort((a, b) => (a.ordem || 99) - (b.ordem || 99));
  if (!sorted.length) { el.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🏷️</div><div class="empty-title">Nenhuma marca cadastrada</div></div>`; return; }
  el.innerHTML = sorted.map(m => `
    <div class="marca-card">
      <div class="marca-img-wrap">
        ${m.foto ? `<img src="${m.foto}" alt="${m.nome}">` : `<div class="marca-img-placeholder">🏷️</div>`}
        ${m.ativo !== false ? `<div class="marca-active-badge">Ativa</div>` : ''}
      </div>
      <div class="marca-card-body">
        <div class="marca-name">${m.nome}</div>
        ${m.cat ? `<span class="badge badge-gray" style="font-size:0.65rem">${m.cat}</span> <span style="font-size:0.7rem;color:var(--text-4)">Ordem: ${m.ordem || '-'}</span>` : ''}
        ${m.desc ? `<div class="marca-desc">${m.desc}</div>` : '<div style="font-size:0.75rem;color:var(--text-4);margin-top:6px">Sem descrição</div>'}
        <div class="marca-actions">
          <button class="btn btn-outline btn-sm" onclick="editMarca(${m.id})" style="flex:1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar
          </button>
          <button class="btn btn-outline btn-sm btn-icon" style="color:var(--red);border-color:var(--red-light)" onclick="delMarca(${m.id})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </div>
    </div>`).join('');
}

function openMarcaModal(id) {
  marcaFotoBase64 = '';
  ['mar-nome', 'mar-desc', 'mar-ordem'].forEach(x => { const e = document.getElementById(x); if (e) e.value = ''; });
  document.getElementById('mar-id').value = '';
  document.getElementById('mar-ativo').checked = true;
  document.getElementById('mar-foto-wrap').innerHTML = `<div class="photo-upload-icon">🖼️</div><div class="photo-upload-label">Clique para fazer upload do logo</div>`;
  const cs = document.getElementById('mar-cat'); cs.innerHTML = '<option value="">Selecione...</option>' + db.cats.map(c => `<option value="${c}">${c}</option>`).join('');
  document.getElementById('mmarca-title').textContent = id ? 'Editar Marca' : 'Nova Marca';
  if (id) { const m = db.marcas.find(x => x.id === id); if (!m) return; document.getElementById('mar-id').value = m.id; document.getElementById('mar-nome').value = m.nome || ''; document.getElementById('mar-desc').value = m.desc || ''; document.getElementById('mar-ordem').value = m.ordem || ''; document.getElementById('mar-ativo').checked = m.ativo !== false; cs.value = m.cat || ''; if (m.foto) { marcaFotoBase64 = m.foto; document.getElementById('mar-foto-wrap').innerHTML = `<img src="${m.foto}" style="padding:10px;max-height:120px">`; } }
  openModal('modal-marca');
}

function editMarca(id) { openMarcaModal(id); }

function handleMarcaFoto(e) {
  const file = e.target.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = ev => { marcaFotoBase64 = ev.target.result; document.getElementById('mar-foto-wrap').innerHTML = `<img src="${marcaFotoBase64}" style="padding:10px;max-height:120px">`; };
  r.readAsDataURL(file);
}

function salvarMarca() {
  const nome = document.getElementById('mar-nome').value.trim(); if (!nome) { toast('❌ Nome obrigatório!'); return; }
  const eid = parseInt(document.getElementById('mar-id').value) || null;
  const o = { nome, cat: document.getElementById('mar-cat').value, desc: document.getElementById('mar-desc').value.trim(), ordem: parseInt(document.getElementById('mar-ordem').value) || 99, ativo: document.getElementById('mar-ativo').checked, foto: marcaFotoBase64 };
  if (eid) { const i = db.marcas.findIndex(x => x.id === eid); if (i >= 0) db.marcas[i] = { ...db.marcas[i], ...o }; }
  else { o.id = uid('mar'); db.marcas.push(o); }
  save(); closeModal('modal-marca'); renderMarcas(); toast('✅ Marca salva!');
}

function delMarca(id) { if (!confirm('Excluir marca?')) return; db.marcas = db.marcas.filter(m => m.id !== id); save(); renderMarcas(); toast('🗑️ Excluída'); }

// ═══════════════════════════════════════════════════
// CATEGORIAS
// ═══════════════════════════════════════════════════
function renderCats() {
  const el = document.getElementById('lista-categorias');
  el.innerHTML = db.cats.map((c, i) => `<div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--border)">
    <span style="font-weight:600;font-size:0.88rem">📂 ${c}</span>
    <div style="display:flex;gap:6px">
      <button class="btn btn-outline btn-sm btn-icon" onclick="openCatModal(${i})">✏️</button>
      <button class="btn btn-outline btn-sm btn-icon" style="color:var(--red)" onclick="delCat(${i})">🗑️</button>
    </div>
  </div>`).join('') || `<div class="empty-state"><div class="empty-title">Nenhuma categoria</div></div>`;
}

function openCatModal(idx) {
  document.getElementById('cat-id').value = idx != null ? idx : '';
  document.getElementById('cat-nome').value = idx != null && typeof idx === 'number' ? db.cats[idx] : '';
  openModal('modal-cat');
}

function salvarCategoria() {
  const nome = document.getElementById('cat-nome').value.trim(); if (!nome) { toast('❌ Nome obrigatório!'); return; }
  const idx = document.getElementById('cat-id').value;
  if (idx !== '') db.cats[parseInt(idx)] = nome; else db.cats.push(nome);
  save(); closeModal('modal-cat'); renderCats(); toast('✅ Salvo!');
}

function delCat(i) { if (!confirm('Excluir categoria?')) return; db.cats.splice(i, 1); save(); renderCats(); toast('🗑️ Excluída'); }

// ═══════════════════════════════════════════════════
// NOTIFICAÇÕES
// ═══════════════════════════════════════════════════
function renderNotificacoes() {
  const el = document.getElementById('lista-notificacoes');
  const allParcs = db.vendas.flatMap(v => v.parcelas.map(p => ({ ...p, vid: v.id, cid: v.clienteId })));
  const vencidas = allParcs.filter(p => !p.pago && isOv(p.venc));
  const baixo = db.produtos.filter(p => p.ativo !== false && p.estoque <= (p.estmin || 3));
  const notifs = [];
  vencidas.slice(0, 10).forEach(p => { const c = db.clientes.find(x => x.id === p.cid); notifs.push({ icon: '🚨', cor: 'var(--red-light)', titulo: `Parcela vencida — ${c?.nome || '?'}`, sub: `${fmtR(p.valor)} · Venceu em ${fmtD(p.venc)}`, unread: true }); });
  baixo.forEach(p => { notifs.push({ icon: '📦', cor: 'var(--amber-light)', titulo: `Estoque baixo — ${p.nome}`, sub: `Apenas ${p.estoque} unidade(s) em estoque`, unread: false }); });
  if (!notifs.length) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔔</div><div class="empty-title">Nenhuma notificação</div><div class="empty-sub">Tudo em ordem!</div></div>`; return; }
  el.innerHTML = notifs.map(n => `<div class="notif-item"><div class="notif-icon" style="background:${n.cor}">${n.icon}</div><div style="flex:1"><div class="notif-title">${n.titulo}</div><div class="notif-sub">${n.sub}</div></div>${n.unread ? `<div class="notif-unread"></div>` : ''}</div>`).join('');
}

// ═══════════════════════════════════════════════════
// ANIVERSÁRIOS
// ═══════════════════════════════════════════════════
function renderAniversarios() {
  const el = document.getElementById('lista-aniversarios');
  const mes = new Date().getMonth() + 1;
  const hoje = new Date().getDate();
  const aniv = db.clientes.filter(c => c.nasc && parseInt(c.nasc.split('-')[1]) === mes);
  if (!aniv.length) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">🎂</div><div class="empty-title">Nenhum aniversariante este mês</div></div>`; return; }
  el.innerHTML = aniv.sort((a, b) => parseInt(a.nasc.split('-')[2]) - parseInt(b.nasc.split('-')[2])).map(c => { const dia = parseInt(c.nasc.split('-')[2]); const isHoje = dia === hoje; return `<div class="aniv-card"><div class="aniv-avatar">${ini(c.nome)}</div><div style="flex:1"><div style="font-weight:700">${c.nome} ${isHoje ? '🎉 Hoje!' : ''}</div><div style="font-size:0.72rem;color:var(--text-4)">🎂 Dia ${dia}</div></div>${c.whatsapp ? `<button class="btn btn-green btn-sm" onclick="openWA('${c.whatsapp}','${c.nome}',0,'','Feliz aniversário! 🎂🎉 Que seu dia seja especial!')">Parabenizar</button>` : ''}</div>`; }).join('');
}

// ═══════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════
function renderConfig() {
  document.getElementById('cfg-nome').value = db.config.nome || '';
  document.getElementById('cfg-email').value = db.config.email || '';
  document.getElementById('cfg-whatsapp').value = db.config.whatsapp || '';
  document.getElementById('cfg-cob').value = db.config.msgCob || '';
}

function salvarConfig() {
  db.config.nome = document.getElementById('cfg-nome').value.trim();
  db.config.email = document.getElementById('cfg-email').value.trim();
  db.config.whatsapp = document.getElementById('cfg-whatsapp').value.trim();
  db.config.msgCob = document.getElementById('cfg-cob').value;
  save(); renderDashboard(); toast('✅ Configurações salvas!');
}

function limparTudo() {
  if (!confirm('⚠️ Apagar TODOS os dados? Isso não pode ser desfeito!')) return;
  if (!confirm('Confirme: apagar tudo?')) return;
  ['st3_cli', 'st3_prod', 'st3_vend', 'st3_cup', 'st3_marc', 'st3_cats', 'st3_int', 'st3_lem', 'st3_cfg', 'st3_id'].forEach(k => localStorage.removeItem(k));
  location.reload();
}

function exportar() {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `starktech_${today()}.json`; a.click();
  toast('📥 Exportado!');
}

function importar(e) {
  const file = e.target.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = ev => { try { const data = JSON.parse(ev.target.result); const map = { clientes: 'st3_cli', produtos: 'st3_prod', vendas: 'st3_vend', cupons: 'st3_cup', marcas: 'st3_marc', cats: 'st3_cats', interacoes: 'st3_int', lembretes: 'st3_lem', config: 'st3_cfg', nextId: 'st3_id' }; Object.entries(map).forEach(([dk, sk]) => { if (data[dk] !== undefined) { db[dk] = data[dk]; localStorage.setItem(sk, JSON.stringify(data[dk])); } }); toast('✅ Dados importados!'); renderSection(curSection); } catch { toast('❌ Arquivo inválido!'); } };
  r.readAsText(file);
}

// ═══════════════════════════════════════════════════
// WHATSAPP
// ═══════════════════════════════════════════════════
function openWA(tel, nome, valor, venc, msgCustom) {
  const msg = (msgCustom || (db.config.msgCob || 'Olá {nome}, sua parcela de {valor} vence em {data}.'))
    .replace('{nome}', nome).replace('{valor}', fmtR(valor)).replace('{data}', fmtD(venc));
  const num = tel.replace(/\D/g, '');
  window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`, '_blank');
}
