/* =====================================================
   TREND MODA — app.js
   Script único da aplicação (vitrine + CRUD + painel admin + modal de tamanhos + checkout)
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {

  document.getElementById('year').textContent = new Date().getFullYear();

  /* =====================================================
     DADOS PADRÃO (FALLBACK CASO O SERVIDOR ESTEJA OFFLINE)
     ===================================================== */
  const DEFAULT_DATA = {
    senhaAdmin: 'TrendModa',
    whatsapp: { numero: '554130592770', mensagem: 'Olá! Vim pelo site da Trend Moda e gostaria de atendimento.' },
    hero: {
      titulo: 'Trend Moda',
      subtitulo: 'Moda feminina atual, com estilo e atendimento próximo.',
      foto: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=60'
    },
    lojas: {
      pinhais: { endereco: 'Av. Iraí, 1612 - Weissópolis - Pinhais/PR', horario: 'Seg a sex: 10h-19h · Sáb: 10h-18h' },
      curitiba: { endereco: 'Rua Barão do Serro Azul, 110 - Centro - Curitiba/PR', horario: 'Seg a sex: 10h-19h · Sáb: 10h-18h' }
    },
    produtos: [
      { 
        id: 1, 
        nome: 'Vestido Tomara que Caia', 
        categoria: 'Vestido (Moda Feminina)', 
        preco: 89.99, 
        precoPromo: null, 
        tamanhos: 'P,M,G,GG', 
        tag: 'Outono/Inverno', 
        fotos: [
          'https://lh3.googleusercontent.com/d/1Otmz1ugZApuoQpl05g_6-TzI5cMFuChi',
          'https://lh3.googleusercontent.com/d/1SXlrx2txB0RlwJ6vEtaG0UqpTT_ySD2H'
        ],
        descricao: 'O vestido que te acompanha nos looks outono inverno.', 
        estoque: true 
      },
      {
        id: 2,
        nome: 'Regata Canelada',
        categoria: 'Regata (Moda Feminina)',
        preco: 24.99,
        precoPromo: null,
        tamanhos: 'P,M,G,GG',
        tag: 'Básico',
        fotos: [
          'https://lh3.googleusercontent.com/d/1RL9rNhysnH32zy85hXly5F3kAKiQ9QKv'
        ],
        descricao: 'Canelado Macio e com elastano !',
        estoque: true
      }
    ]
  };

  /* =====================================================
     ESTADO / STORAGE (HÍBRIDO: API OU LOCAL)
     ===================================================== */
  let data = null; 
  let isLoggedIn = false;
  let editingProductId = null;

  async function loadData() {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Falha ao carregar dados do servidor');
      const serverData = await response.json();
      hideBanner();
      return migrateFotos(serverData);
    } catch (error) {
      console.warn('Servidor offline. Carregando dados no modo local.');
      const localData = localStorage.getItem('trendmoda_db');
      if (localData) {
        return migrateFotos(JSON.parse(localData));
      }
      return migrateFotos(JSON.parse(JSON.stringify(DEFAULT_DATA)));
    }
  }

  async function saveData(dataToSave) {
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      if (!response.ok) throw new Error('Erro ao salvar na API');
      hideBanner();
      return true;
    } catch (error) {
      localStorage.setItem('trendmoda_db', JSON.stringify(dataToSave));
      showBanner('Servidor offline: As alterações foram salvas apenas no seu navegador.', false);
      return true;
    }
  }

  function showBanner(message, isError = true) {
    const warn = document.getElementById('storage-warning');
    if (!warn) return;
    warn.textContent = message;
    warn.classList.remove('hidden', 'text-red-600', 'text-amber-600');
    warn.classList.add(isError ? 'text-red-600' : 'text-amber-600');
  }
  
  function hideBanner() {
    const warn = document.getElementById('storage-warning');
    if (!warn) warn.classList.add('hidden');
  }
  
  function checkStorageSize() {
    hideBanner();
  }
  
  function migrateFotos(parsed) {
    parsed.produtos = (parsed.produtos || []).map(p => {
      if (!p.fotos) { p.fotos = p.foto ? [p.foto] : []; delete p.foto; }
      return p;
    });
    return parsed;
  }

  /* =====================================================
     RENDER: SITE PÚBLICO
     ===================================================== */
  function renderPublicSite() {
    document.getElementById('hero-title').textContent = data.hero.titulo;
    document.getElementById('hero-subtitle').textContent = data.hero.subtitulo;
    document.getElementById('hero-bg').src = data.hero.foto;

    document.getElementById('loja-pinhais-endereco').textContent = data.lojas.pinhais.endereco;
    document.getElementById('loja-pinhais-horario').textContent = data.lojas.pinhais.horario;
    document.getElementById('loja-curitiba-endereco').textContent = data.lojas.curitiba.endereco;
    document.getElementById('loja-curitiba-horario').textContent = data.lojas.curitiba.horario;

    const waLink = `https://wa.me/${data.whatsapp.numero}?text=${encodeURIComponent(data.whatsapp.mensagem)}`;
    document.getElementById('whatsapp-header-link').href = waLink;
    document.getElementById('whatsapp-float').href = waLink;
    document.getElementById('footer-whatsapp-number').textContent = formatPhone(data.whatsapp.numero);

    const countEl = document.getElementById('product-count');
    if (countEl) countEl.textContent = `${data.produtos.length} ${data.produtos.length === 1 ? 'peça' : 'peças'}`;

    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();
    data.produtos.forEach(p => fragment.appendChild(buildProductCard(p)));
    grid.appendChild(fragment);
  }

  function buildProductCard(p) {
    const precoFinal = p.precoPromo ? p.precoPromo : p.preco;
    const fotos = (p.fotos && p.fotos.length) ? p.fotos : ['https://placehold.co/600x750/E8C5C8/111111?text=Sem+foto'];
    
    let displaySizes = '';
    if (p.tamanhos) {
      const uniqueSizes = [...new Set(p.tamanhos.split(',').map(s => s.trim().toUpperCase()).filter(Boolean))];
      displaySizes = uniqueSizes.join(', ');
    }

    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl overflow-hidden border border-nude/40 hover:border-rosegold/50 transition-colors';
    card.innerHTML = `
      <div class="relative aspect-[4/5] bg-nude/20 pcarousel" data-index="0">
        <div class="pcarousel-track">
          ${fotos.map(f => `<img src="${f}" alt="${p.nome}" loading="lazy">`).join('')}
        </div>
        ${fotos.length > 1 ? `
          <button type="button" class="pcarousel-nav pcarousel-prev" aria-label="Foto anterior">&#8249;</button>
          <button type="button" class="pcarousel-nav pcarousel-next" aria-label="Próxima foto">&#8250;</button>
          <div class="pcarousel-dots">${fotos.map((_, i) => `<span class="${i === 0 ? 'active' : ''}"></span>`).join('')}</div>
        ` : ''}
        ${p.tag ? `<span class="absolute top-3 left-3 bg-rosegold text-white text-xs px-2 py-1 rounded-full">${p.tag}</span>` : ''}
        ${!p.estoque ? `<span class="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-heading text-sm">Esgotado</span>` : ''}
      </div>
      <div class="p-4">
        <p class="text-xs text-ink/45 mb-1">${p.categoria || 'Trend Moda'}</p>
        <h3 class="font-heading text-base mb-1.5 leading-snug">${p.nome}</h3>
        
        ${displaySizes ? `<p class="text-xs text-ink/40 mb-2">Tamanhos: ${displaySizes}</p>` : '<div class="mb-2"></div>'}
        
        ${p.descricao ? `<div class="text-[11px] text-ink/60 mb-3 max-h-16 overflow-y-auto pr-1 leading-relaxed custom-scrollbar">${p.descricao}</div>` : '<div class="mb-3"></div>'}
        
        <div class="flex items-end justify-between mb-3">
          <div>
            <p class="text-[11px] text-ink/40 mb-0.5">Preço</p>
            <p class="font-body text-sm">
              ${p.precoPromo ? `<span class="line-through text-ink/35 mr-2">R$ ${p.preco.toFixed(2)}</span>` : ''}
              <span class="text-rosegold font-semibold text-base">R$ ${precoFinal.toFixed(2)}</span>
            </p>
          </div>
        </div>
        <button type="button" ${!p.estoque ? 'disabled aria-disabled="true"' : ''}
          data-cart-add="${p.id}"
          aria-label="${p.estoque ? `Adicionar ${p.nome} ao carrinho` : `${p.nome} indisponível`}"
          class="w-full ${p.estoque ? 'bg-ink hover:bg-rosegold' : 'bg-ink/20 cursor-not-allowed'} text-white text-sm py-2.5 rounded-full transition">
          ${p.estoque ? 'Adicionar ao carrinho' : 'Indisponível'}
        </button>
      </div>`;
    return card;
  }

  document.getElementById('product-grid').addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-cart-add]');
    if (addBtn && !addBtn.disabled) {
      const prodId = Number(addBtn.dataset.cartAdd);
      promptSizeSelection(prodId);
      return;
    }

    const nav = e.target.closest('.pcarousel-prev, .pcarousel-next');
    if (nav) {
      const carousel = nav.closest('.pcarousel');
      const track = carousel.querySelector('.pcarousel-track');
      const dots = carousel.querySelectorAll('.pcarousel-dots span');
      const total = track.children.length;
      let idx = Number(carousel.dataset.index);
      idx = nav.classList.contains('pcarousel-next') ? (idx + 1) % total : (idx - 1 + total) % total;
      carousel.dataset.index = idx;
      track.style.transform = `translateX(-${idx * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    }
  });

  function formatPhone(digits) {
    return digits.replace(/^55/, '+55 ');
  }

  /* =====================================================
     MODAL DE SELEÇÃO DE TAMANHO
     ===================================================== */
  const sizeModal = document.getElementById('size-modal');
  const sizeOptionsDiv = document.getElementById('size-options');
  const sizeConfirmBtn = document.getElementById('size-confirm-btn');
  let selectedProductForSize = null;
  let selectedSizeValue = null;

  function promptSizeSelection(prodId) {
    const p = data.produtos.find(x => x.id === prodId);
    if (!p) return;

    selectedProductForSize = p;
    selectedSizeValue = null;

    document.getElementById('size-modal-prod-name').textContent = p.nome;
    sizeConfirmBtn.disabled = true;

    const rawTamanhos = p.tamanhos
      ? p.tamanhos.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
      : ['ÚNICO'];

    const sizeCounts = {};
    rawTamanhos.forEach(tam => {
      sizeCounts[tam] = (sizeCounts[tam] || 0) + 1;
    });

    const availableSizes = [];
    for (const tam in sizeCounts) {
      const cartKey = `${prodId}_${tam}`;
      const qtyInCart = cart[cartKey] || 0;
      const qtyAvailable = sizeCounts[tam] - qtyInCart;

      if (qtyAvailable > 0) {
        availableSizes.push(tam);
      }
    }

    if (availableSizes.length === 0) {
      sizeOptionsDiv.innerHTML = '<p class="text-sm text-red-600 mt-2 mb-2">Todas as variações de tamanho deste produto já estão no seu carrinho.</p>';
    } else {
      sizeOptionsDiv.innerHTML = availableSizes.map(tam => `
        <button type="button" data-size-val="${tam}"
          class="size-opt-btn px-4 py-2 text-xs font-semibold rounded-xl border border-nude/80 hover:border-rosegold hover:text-rosegold transition">
          ${tam}
        </button>
      `).join('');
    }

    sizeModal.classList.add('open');
    sizeModal.setAttribute('aria-hidden', 'false');
  }

  function closeSizeModal() {
    sizeModal.classList.remove('open');
    sizeModal.setAttribute('aria-hidden', 'true');
    selectedProductForSize = null;
    selectedSizeValue = null;
  }

  document.getElementById('size-close').addEventListener('click', closeSizeModal);

  sizeOptionsDiv.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-size-val]');
    if (!btn) return;

    sizeOptionsDiv.querySelectorAll('.size-opt-btn').forEach(b => {
      b.classList.remove('bg-rosegold', 'text-white', 'border-rosegold');
      b.classList.add('border-nude/80');
    });

    btn.classList.remove('border-nude/80');
    btn.classList.add('bg-rosegold', 'text-white', 'border-rosegold');

    selectedSizeValue = btn.dataset.sizeVal;
    sizeConfirmBtn.disabled = false;
  });

  sizeConfirmBtn.addEventListener('click', () => {
    if (!selectedProductForSize || !selectedSizeValue) return;
    addToCart(selectedProductForSize.id, selectedSizeValue);
    closeSizeModal();
  });

  /* =====================================================
     CARRINHO
     ===================================================== */
  const CART_KEY = 'trendmoda_cart_v2';
  const cartModal = document.getElementById('cart-modal');
  const confirmModal = document.getElementById('confirm-modal');

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error('Erro ao ler carrinho do localStorage.', e);
      return {};
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Erro ao salvar carrinho no localStorage.', e);
    }
  }

  let cart = loadCart();

  function cartTotalCount() {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  }

  function renderCartBadge() {
    const el = document.getElementById('cart-count');
    if (!el) return;
    const n = cartTotalCount();
    el.textContent = n;
    el.classList.toggle('hidden', n === 0);
  }

  function pruneCart() {
    let changed = false;
    Object.keys(cart).forEach(itemKey => {
      const [idStr] = itemKey.split('_');
      if (!data.produtos.some(p => p.id === Number(idStr))) {
        delete cart[itemKey];
        changed = true;
      }
    });
    if (changed) saveCart();
  }

  function addToCart(id, size) {
    const key = `${id}_${size}`;
    cart[key] = (cart[key] || 0) + 1;
    saveCart();
    renderCartBadge();
  }

  function changeCartQty(key, delta) {
    if (!cart[key]) return;

    if (delta > 0) {
      const [idStr, size] = key.split('_');
      const p = data.produtos.find(x => x.id === Number(idStr));
      if (p) {
         const rawTamanhos = p.tamanhos ? p.tamanhos.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : ['ÚNICO'];
         const totalForSize = rawTamanhos.filter(t => t === size).length;
         if (cart[key] + delta > totalForSize) {
            alert(`Você já adicionou todo o estoque disponível para o tamanho ${size}.`);
            return;
         }
      }
    }

    cart[key] += delta;
    if (cart[key] <= 0) delete cart[key];
    saveCart();
    renderCartBadge();
    renderCartModal();
  }

  function removeFromCart(key) {
    delete cart[key];
    saveCart();
    renderCartBadge();
    renderCartModal();
  }

  function renderCartModal() {
    pruneCart();
    const container = document.getElementById('cart-items');
    const emptyEl = document.getElementById('cart-empty');
    const totalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('cart-checkout-btn');
    const keys = Object.keys(cart);

    if (!keys.length) {
      container.innerHTML = '';
      emptyEl.classList.remove('hidden');
      totalEl.textContent = 'R$ 0.00';
      checkoutBtn.disabled = true;
      return;
    }

    emptyEl.classList.add('hidden');
    checkoutBtn.disabled = false;

    let total = 0;
    const fragment = document.createDocumentFragment();
    keys.forEach(key => {
      const [idStr, size] = key.split('_');
      const p = data.produtos.find(x => x.id === Number(idStr));
      if (!p) return;

      const preco = p.precoPromo ? p.precoPromo : p.preco;
      const qty = cart[key];
      total += preco * qty;
      const foto = (p.fotos && p.fotos[0]) || 'https://placehold.co/100x100/E4CFC0/221F1D?text=%20';
      
      const row = document.createElement('div');
      row.className = 'flex items-center gap-3 border border-nude/40 rounded-xl p-2.5 bg-cream/30';
      row.innerHTML = `
        <img src="${foto}" alt="" class="w-12 h-12 object-cover rounded-lg flex-shrink-0">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-heading truncate leading-tight">${p.nome}</p>
          <p class="text-xs text-rosegold font-semibold mt-0.5">Tam ${size}</p>
          <p class="text-xs text-ink/50 mt-0.5">R$ ${preco.toFixed(2)}</p>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button type="button" data-cart-decr="${key}" aria-label="Diminuir quantidade" class="w-6 h-6 rounded-full border border-nude/80 text-sm leading-none flex items-center justify-center hover:border-rosegold hover:text-rosegold">&minus;</button>
          <span class="text-xs font-semibold w-4 text-center">${qty}</span>
          <button type="button" data-cart-incr="${key}" aria-label="Aumentar quantidade" class="w-6 h-6 rounded-full border border-nude/80 text-sm leading-none flex items-center justify-center hover:border-rosegold hover:text-rosegold">+</button>
        </div>
        <button type="button" data-cart-remove="${key}" aria-label="Remover item" class="text-ink/40 hover:text-red-600 text-base flex-shrink-0 px-1">&times;</button>`;
      fragment.appendChild(row);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
    totalEl.textContent = `R$ ${total.toFixed(2)}`;
  }

  document.getElementById('cart-items').addEventListener('click', e => {
    const decr = e.target.closest('[data-cart-decr]');
    const incr = e.target.closest('[data-cart-incr]');
    const remove = e.target.closest('[data-cart-remove]');
    if (decr) changeCartQty(decr.dataset.cartDecr, -1);
    else if (incr) changeCartQty(incr.dataset.cartIncr, 1);
    else if (remove) removeFromCart(remove.dataset.cartRemove);
  });

  function openCart() {
    renderCartModal();
    cartModal.classList.add('open');
    cartModal.setAttribute('aria-hidden', 'false');
  }

  function closeCart() {
    cartModal.classList.remove('open');
    cartModal.setAttribute('aria-hidden', 'true');
  }

  document.getElementById('cart-open-btn').addEventListener('click', openCart);
  document.getElementById('cart-close').addEventListener('click', closeCart);

  /* =====================================================
     CHECKOUT & CONFIRMAÇÃO
     ===================================================== */
  document.getElementById('cart-checkout-btn').addEventListener('click', () => {
    if (!Object.keys(cart).length) return;
    openConfirmModal();
  });

  function openConfirmModal() {
    confirmModal.classList.add('open');
    confirmModal.setAttribute('aria-hidden', 'false');
  }

  function closeConfirmModal() {
    confirmModal.classList.remove('open');
    confirmModal.setAttribute('aria-hidden', 'true');
  }

  document.getElementById('confirm-back-btn').addEventListener('click', closeConfirmModal);

  document.getElementById('confirm-proceed-btn').addEventListener('click', () => {
    const keys = Object.keys(cart);
    if (!keys.length) return;

    let total = 0;
    const linhas = [];

    keys.forEach(key => {
      const [idStr, size] = key.split('_');
      const p = data.produtos.find(x => x.id === Number(idStr));
      if (!p) return;

      const preco = p.precoPromo ? p.precoPromo : p.preco;
      const qty = cart[key];
      total += preco * qty;
      linhas.push(`• ${qty}x ${p.nome} (Tam ${size}) — R$ ${(preco * qty).toFixed(2)}`);
    });

    const msg = `Olá! Gostaria de fazer o seguinte pedido:\n\n${linhas.join('\n')}\n\nTotal: R$ ${total.toFixed(2)}`;
    
    closeConfirmModal();
    closeCart();
    
    window.open(`https://wa.me/${data.whatsapp.numero}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });

  /* =====================================================
     AUTENTICAÇÃO ADMIN
     ===================================================== */
  const loginModal = document.getElementById('login-modal');
  const adminModal = document.getElementById('admin-modal');
  const loginPasswordInput = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');

  function openLoginModal() {
    loginModal.classList.add('open');
    loginModal.setAttribute('aria-hidden', 'false');
    loginPasswordInput.focus();
  }

  function closeLoginModal() {
    loginModal.classList.remove('open');
    loginModal.setAttribute('aria-hidden', 'true');
    loginError.classList.add('hidden');
    loginPasswordInput.value = '';
  }

  document.getElementById('admin-open-btn').addEventListener('click', () => {
    if (isLoggedIn) { openAdmin(); } else { openLoginModal(); }
  });
  document.getElementById('login-cancel').addEventListener('click', closeLoginModal);
  document.getElementById('login-submit').addEventListener('click', tryLogin);
  loginPasswordInput.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });

  function tryLogin() {
    const val = loginPasswordInput.value;
    if (val === data.senhaAdmin) {
      isLoggedIn = true;
      loginModal.classList.remove('open');
      loginModal.setAttribute('aria-hidden', 'true');
      loginPasswordInput.value = '';
      loginError.classList.add('hidden');
      openAdmin();
    } else {
      loginError.classList.remove('hidden');
      loginPasswordInput.focus();
    }
  }

  function openAdmin() {
    adminModal.classList.add('open');
    adminModal.setAttribute('aria-hidden', 'false');
    renderDashboard();
    renderProductTable();
    fillContentForm();
    fillConfigForm();
    checkStorageSize();
  }

  function closeAdmin() {
    adminModal.classList.remove('open');
    adminModal.setAttribute('aria-hidden', 'true');
  }

  document.getElementById('admin-logout').addEventListener('click', () => {
    isLoggedIn = false;
    closeAdmin();
  });
  document.getElementById('admin-close').addEventListener('click', closeAdmin);

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (confirmModal.classList.contains('open')) closeConfirmModal();
    else if (sizeModal.classList.contains('open')) closeSizeModal();
    else if (adminModal.classList.contains('open')) closeAdmin();
    else if (loginModal.classList.contains('open')) closeLoginModal();
    else if (cartModal.classList.contains('open')) closeCart();
  });

  /* =====================================================
     TABS
     ===================================================== */
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  /* =====================================================
     DASHBOARD
     ===================================================== */
  function renderDashboard() {
    document.getElementById('stat-total').textContent = data.produtos.length;
    document.getElementById('stat-estoque').textContent = data.produtos.filter(p => p.estoque).length;
    document.getElementById('stat-esgotados').textContent = data.produtos.filter(p => !p.estoque).length;
    document.getElementById('stat-categorias').textContent = new Set(data.produtos.map(p => p.categoria).filter(Boolean)).size;
  }

  /* =====================================================
     PRODUTOS (CRUD)
     ===================================================== */
  const productForm = document.getElementById('product-form');
  const pFotoUpload = document.getElementById('p-foto-upload');
  const pFotoError = document.getElementById('p-foto-error');
  const pFotoUrlInput = document.getElementById('p-foto-url');
  const pFotoList = document.getElementById('p-foto-list');
  const MAX_FOTOS = 6;
  const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
  const RESIZE_MAX_DIM = 900;
  let fotosAtuais = [];

  function setFotoError(message) {
    if (!pFotoError) return;
    if (message) {
      pFotoError.textContent = message;
      pFotoError.classList.remove('hidden');
    } else {
      pFotoError.classList.add('hidden');
      pFotoError.textContent = '';
    }
  }

  function renderFotoList() {
    pFotoList.innerHTML = fotosAtuais.map((src, i) => `
      <div class="photo-chip">
        <img src="${src}" alt="Foto ${i + 1}">
        <button type="button" data-remove-foto="${i}" aria-label="Remover foto ${i + 1}">&times;</button>
      </div>`).join('');
  }

  pFotoList.addEventListener('click', e => {
    const btn = e.target.closest('[data-remove-foto]');
    if (!btn) return;
    fotosAtuais.splice(Number(btn.dataset.removeFoto), 1);
    renderFotoList();
  });

  function addFoto(src) {
    if (fotosAtuais.length >= MAX_FOTOS) {
      setFotoError(`Máximo de ${MAX_FOTOS} fotos por produto.`);
      return;
    }
    fotosAtuais.push(src);
    renderFotoList();
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = e => { img.src = e.target.result; };
      reader.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, RESIZE_MAX_DIM / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  document.getElementById('p-foto-url-add').addEventListener('click', () => {
    const url = pFotoUrlInput.value.trim();
    setFotoError(null);
    if (!url) return;
    addFoto(url);
    pFotoUrlInput.value = '';
  });

  pFotoUpload.addEventListener('change', async () => {
    setFotoError(null);
    const files = Array.from(pFotoUpload.files || []);
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setFotoError('Arquivo inválido: selecione apenas imagens.');
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        setFotoError(`"${file.name}" é muito grande (limite de arquivo original: 8MB).`);
        continue;
      }
      if (fotosAtuais.length >= MAX_FOTOS) {
        setFotoError(`Máximo de ${MAX_FOTOS} fotos por produto.`);
        break;
      }
      try {
        const compressed = await compressImage(file);
        addFoto(compressed);
      } catch (err) {
        setFotoError('Não foi possível processar uma das imagens.');
        console.error(err);
      }
    }
    pFotoUpload.value = '';
  });

  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!fotosAtuais.length) { setFotoError('Adicione ao menos uma foto (URL ou upload).'); return; }

    const precoPromoRaw = document.getElementById('p-preco-promo').value;
    const produto = {
      id: editingProductId || Date.now(),
      nome: document.getElementById('p-nome').value.trim(),
      categoria: document.getElementById('p-categoria').value.trim(),
      preco: parseFloat(document.getElementById('p-preco').value) || 0,
      precoPromo: precoPromoRaw ? parseFloat(precoPromoRaw) : null,
      tamanhos: document.getElementById('p-tamanhos').value.trim(),
      tag: document.getElementById('p-tag').value.trim(),
      fotos: fotosAtuais.slice(),
      descricao: document.getElementById('p-descricao').value.trim(),
      estoque: editingProductId ? data.produtos.find(p => p.id === editingProductId).estoque : true
    };

    if (editingProductId) {
      const idx = data.produtos.findIndex(p => p.id === editingProductId);
      data.produtos[idx] = produto;
    } else {
      data.produtos.push(produto);
    }

    const success = await saveData(data);
    if (success) {
      resetProductForm();
      renderProductTable();
      renderDashboard();
      renderPublicSite();
    }
  });

  document.getElementById('p-cancel').addEventListener('click', resetProductForm);

  function resetProductForm() {
    productForm.reset();
    editingProductId = null;
    fotosAtuais = [];
    renderFotoList();
    setFotoError(null);
    document.getElementById('p-cancel').classList.add('hidden');
  }

  function editProduct(id) {
    const p = data.produtos.find(x => x.id === id);
    if (!p) return;
    editingProductId = id;
    document.getElementById('p-nome').value = p.nome;
    document.getElementById('p-categoria').value = p.categoria || '';
    document.getElementById('p-preco').value = p.preco;
    document.getElementById('p-preco-promo').value = p.precoPromo || '';
    document.getElementById('p-tamanhos').value = p.tamanhos || '';
    document.getElementById('p-tag').value = p.tag || '';
    fotosAtuais = (p.fotos || []).slice();
    renderFotoList();
    setFotoError(null);
    document.getElementById('p-descricao').value = p.descricao || '';
    document.getElementById('p-cancel').classList.remove('hidden');
    document.querySelector('[data-tab="produtos"]').click();
    productForm.scrollIntoView({ behavior: 'smooth' });
  }

  function deleteProduct(id) {
    if (!confirm('Excluir este produto?')) return;
    data.produtos = data.produtos.filter(p => p.id !== id);
    saveData(data);
    
    Object.keys(cart).forEach(key => {
      if (key.startsWith(`${id}_`)) delete cart[key];
    });
    saveCart();
    renderCartBadge();

    renderProductTable();
    renderDashboard();
    renderPublicSite();
  }

  function toggleStock(id) {
    const p = data.produtos.find(x => x.id === id);
    if (!p) return;
    p.estoque = !p.estoque;
    saveData(data);
    renderProductTable();
    renderDashboard();
    renderPublicSite();
  }

  function renderProductTable() {
    const container = document.getElementById('product-table');
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();
    data.produtos.forEach(p => {
      const row = document.createElement('div');
      row.className = 'flex items-center gap-3 border rounded-xl p-3';
      const fotos = p.fotos || [];
      row.innerHTML = `
        <div class="relative w-14 h-14 flex-shrink-0">
          <img src="${fotos[0] || 'https://placehold.co/100x100/E8C5C8/111111?text=%20'}" alt="" class="w-14 h-14 object-cover rounded-lg">
          ${fotos.length > 1 ? `<span class="absolute -bottom-1 -right-1 bg-ink text-white text-[10px] px-1.5 py-0.5 rounded-full">${fotos.length}</span>` : ''}
        </div>
        <div class="flex-1">
          <p class="font-heading text-sm">${p.nome}</p>
          <p class="text-xs text-ink/50">${p.categoria || 'Sem categoria'} · R$ ${(p.precoPromo || p.preco).toFixed(2)}</p>
        </div>
        <button type="button" data-stock-id="${p.id}"
          aria-label="${p.estoque ? `Marcar ${p.nome} como esgotado` : `Marcar ${p.nome} como em estoque`}"
          class="text-xs px-2 py-1 rounded-full ${p.estoque ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
          ${p.estoque ? 'Em estoque' : 'Esgotado'}
        </button>
        <button type="button" data-edit-id="${p.id}" aria-label="Editar ${p.nome}" class="text-xs text-ink/60 hover:text-rosegold">Editar</button>
        <button type="button" data-delete-id="${p.id}" aria-label="Excluir ${p.nome}" class="text-xs text-red-600 hover:text-red-800">Excluir</button>`;
      fragment.appendChild(row);
    });
    container.appendChild(fragment);
  }

  document.getElementById('product-table').addEventListener('click', e => {
    const stockBtn = e.target.closest('[data-stock-id]');
    const editBtn = e.target.closest('[data-edit-id]');
    const deleteBtn = e.target.closest('[data-delete-id]');
    if (stockBtn) toggleStock(Number(stockBtn.dataset.stockId));
    else if (editBtn) editProduct(Number(editBtn.dataset.editId));
    else if (deleteBtn) deleteProduct(Number(deleteBtn.dataset.deleteId));
  });

  /* =====================================================
     CONTEÚDO
     ===================================================== */
  function fillContentForm() {
    document.getElementById('c-hero-titulo').value = data.hero.titulo;
    document.getElementById('c-hero-subtitulo').value = data.hero.subtitulo;
    document.getElementById('c-hero-foto').value = data.hero.foto;
    document.getElementById('c-pinhais-end').value = data.lojas.pinhais.endereco;
    document.getElementById('c-pinhais-hor').value = data.lojas.pinhais.horario;
    document.getElementById('c-curitiba-end').value = data.lojas.curitiba.endereco;
    document.getElementById('c-curitiba-hor').value = data.lojas.curitiba.horario;
  }

  document.getElementById('c-save').addEventListener('click', async () => {
    data.hero.titulo = document.getElementById('c-hero-titulo').value;
    data.hero.subtitulo = document.getElementById('c-hero-subtitulo').value;
    data.hero.foto = document.getElementById('c-hero-foto').value;
    data.lojas.pinhais.endereco = document.getElementById('c-pinhais-end').value;
    data.lojas.pinhais.horario = document.getElementById('c-pinhais-hor').value;
    data.lojas.curitiba.endereco = document.getElementById('c-curitiba-end').value;
    data.lojas.curitiba.horario = document.getElementById('c-curitiba-hor').value;
    const success = await saveData(data);
    if (success) { renderPublicSite(); alert('Conteúdo salvo!'); }
  });

  /* =====================================================
     CONFIGURAÇÕES
     ===================================================== */
  function fillConfigForm() {
    document.getElementById('cfg-whatsapp').value = data.whatsapp.numero;
    document.getElementById('cfg-mensagem').value = data.whatsapp.mensagem;
  }

  document.getElementById('cfg-save-whatsapp').addEventListener('click', async () => {
    data.whatsapp.numero = document.getElementById('cfg-whatsapp').value.replace(/\D/g, '');
    data.whatsapp.mensagem = document.getElementById('cfg-mensagem').value;
    const success = await saveData(data);
    if (success) { renderPublicSite(); alert('WhatsApp atualizado!'); }
  });

  document.getElementById('cfg-save-senha').addEventListener('click', () => {
    const atual = document.getElementById('cfg-senha-atual').value;
    const nova = document.getElementById('cfg-senha-nova').value;
    const msgEl = document.getElementById('cfg-senha-msg');
    if (atual !== data.senhaAdmin) {
      msgEl.textContent = 'Senha atual incorreta.';
      msgEl.className = 'text-xs mt-2 text-red-600';
      return;
    }
    if (!nova || nova.length < 4) {
      msgEl.textContent = 'A nova senha deve ter ao menos 4 caracteres.';
      msgEl.className = 'text-xs mt-2 text-red-600';
      return;
    }
    data.senhaAdmin = nova;
    saveData(data);
    document.getElementById('cfg-senha-atual').value = '';
    document.getElementById('cfg-senha-nova').value = '';
    msgEl.textContent = 'Senha alterada com sucesso.';
    msgEl.className = 'text-xs mt-2 text-green-700';
  });

  /* =====================================================
     INIT (COM SUPORTE A FALLBACK)
     ===================================================== */
  async function initApp() {
    data = await loadData();
    
    if (data) {
      renderPublicSite();
      renderCartBadge();
    } else {
      document.getElementById('hero-title').textContent = "Serviço indisponível";
      document.getElementById('hero-subtitle').textContent = "Não foi possível conectar ao banco de dados.";
    }
  }

  initApp();

});