/* script.js — catálogo cliente con backend (PHP/SQLite) */

// ---------------------------
// Estado global
// ---------------------------
let currentProduct = null; // producto cargado en el modal
let cart = [];             // carrito en memoria

// ---------------------------
// DOM: Modal
// ---------------------------
const modal              = document.getElementById('product-modal');
const modalTitle         = document.getElementById('modal-product-title');
const modalImage         = document.getElementById('modal-product-image');
const modalThumbnails    = document.getElementById('modal-thumbnails');
const modalDescription   = document.getElementById('modal-product-description');
const modalPrice         = document.getElementById('modal-product-price');
const colorOptions       = document.getElementById('color-options');
const customizationOptions = document.getElementById('customization-options');
const customizationText  = document.getElementById('customization-text');
const modalClose         = document.getElementById('modal-close');
const modalCloseBtn      = document.getElementById('modal-close-btn');
const modalAddToCart     = document.getElementById('modal-add-to-cart');

// ---------------------------
// DOM: Carrito (dropdown)
// ---------------------------
const cartBtn        = document.getElementById('cart-btn');
const cartModal      = document.getElementById('cart-modal');
const cartBadge      = document.getElementById('cart-badge');
const cartItemsList  = document.getElementById('cart-items-list');
const cartTotal      = document.getElementById('cart-total');
const cartEmpty      = document.getElementById('cart-empty');
const checkoutBtn    = document.getElementById('checkout-btn');
const totalPrice     = document.getElementById('total-price');

// ---------------------------
// Utils
// ---------------------------
const PRODUCTS_ENDPOINT = 'php/products.php';

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function fmtPriceBRL(n) {
  const num = typeof n === 'string' ? parseFloat(n.replace(',', '.')) : Number(n);
  if (!isFinite(num)) return '0,00';
  return num.toFixed(2).replace('.', ',');
}

// colores comunes (pt/es) → hex
const COLOR_MAP = {
  'azul': '#0000ff',
  'rosa': '#ff69b4',
  'bege': '#f5f5dc',
  'creme': '#f5f5dc',
  'cinza': '#808080',
  'verde': '#008000',
  'amarelo': '#ffff00',
  'branco': '#ffffff',
  'preto': '#000000',
  'roxo': '#800080',
  'marrom': '#8B4513',

  // español
  'blanco': '#ffffff',
  'negro': '#000000',
  'gris': '#808080',
  'marrón': '#8B4513',
  'morado': '#800080',
  'amarillo': '#ffff00',
  'verde claro': '#90ee90',
  'azul marinho': '#000080',
  'azul marino': '#000080',
};

// normaliza token de color de la DB a HEX para pintar el circulito
function resolveColorChip(token) {
  if (!token) return '#ccc';
  const t = token.trim();
  if (t.startsWith('#')) return t;               // ya viene HEX (#F44336)
  const key = t.toLowerCase();
  return COLOR_MAP[key] || t;                    // nombre conocido → hex, si no, lo intentamos como CSS color
}

// ---------------------------
// Cargar y renderizar cards
// ---------------------------
async function loadClientProducts() {
  const container = document.getElementById('produtos');
  if (!container) return;
  container.innerHTML = '<p class="text-center text-gray-500">Carregando produtos...</p>';

  try {
    const res = await fetch(`${PRODUCTS_ENDPOINT}?action=list`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    if (!data.success || !Array.isArray(data.products) || data.products.length === 0) {
      container.innerHTML = '<p class="text-center text-gray-500">Nenhum produto disponível no momento.</p>';
      return;
    }

    container.innerHTML = '';
    data.products.forEach(p => {
      const imgUrl = (p.image_url || '').split(',').map(s => s.trim()).filter(Boolean)[0]
                  || 'https://placehold.co/300x200?text=Sem+Imagem';

      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.productId = p.id;

      card.innerHTML = `
        <img src="${imgUrl}" alt="${escapeHtml(p.title)}" class="img-card">
        <div class="card-body">
          <h3>${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(p.short_description || '')}</p>
          <button class="btn btn-primary" data-open-modal="${p.id}">Fazer pedido</button>
        </div>
      `;

      container.appendChild(card);
    });

    // Delegación: click en botón o en la card
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-open-modal]');
      if (btn) {
        e.stopPropagation();
        openModal(btn.getAttribute('data-open-modal'));
        return;
      }
      const card = e.target.closest('.card');
      if (card) {
        openModal(card.dataset.productId);
      }
    }, { once: true }); // se registra una vez; las cards ya están montadas

  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="text-center text-red-500">Erro ao carregar produtos.</p>';
  }
}

// ---------------------------
// Modal: abrir con datos reales
// ---------------------------
async function openModal(productId) {
  try {
    const res = await fetch(`${PRODUCTS_ENDPOINT}?action=get&id=${encodeURIComponent(productId)}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!data.success || !data.product) throw new Error('Produto não encontrado');

    currentProduct = data.product; // ¡clave! usamos esto en “Adicionar ao Carrinho”

    // Reset estado
    let selectedColor = null;
    let selectedCustomization = null;
    let customizationTextValue = '';
    customizationText.value = '';
    customizationText.style.display = 'none';

    // Datos base
    modalTitle.textContent = currentProduct.title;
    const images = (currentProduct.image_url || '').split(',').map(s => s.trim()).filter(Boolean);
    modalImage.src = images[0] || 'https://placehold.co/400x300?text=Sem+Imagem';
    modalDescription.textContent = currentProduct.description || currentProduct.short_description || '';
    modalPrice.textContent = `R$ ${fmtPriceBRL(currentProduct.price)}`;

    // Miniaturas
    modalThumbnails.innerHTML = '';
    images.forEach((img, index) => {
      const thumb = document.createElement('img');
      thumb.src = img;
      thumb.className = 'modal-thumbnail';
      if (index === 0) thumb.classList.add('active');
      thumb.addEventListener('click', () => {
        modalImage.src = img;
        modalThumbnails.querySelectorAll('.modal-thumbnail').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
      modalThumbnails.appendChild(thumb);
    });

    // Colores
    colorOptions.innerHTML = '';
    const colorTokens = (currentProduct.colors || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    colorTokens.forEach(colorToken => {
      const hex = resolveColorChip(colorToken);
      const row = document.createElement('div');
      row.className = 'modal-option';
      row.dataset.value = colorToken;

      const circle = document.createElement('span');
      circle.className = 'inline-block w-6 h-6 rounded-full border mr-2';
      circle.style.backgroundColor = hex;

      const label = document.createElement('span');
      label.textContent = colorToken; // muestra el literal (ej: "#F44336" o "Azul")

      row.appendChild(circle);
      row.appendChild(label);

      row.addEventListener('click', function() {
        selectOption(colorOptions, this);
        selectedColor = colorToken;
      });

      colorOptions.appendChild(row);
    });

    // Personalización (simple on/off)
    customizationOptions.innerHTML = '';
    const standardOption = createOptionElement('Padrão', 'standard');
    standardOption.addEventListener('click', function() {
      selectOption(customizationOptions, this);
      selectedCustomization = 'standard';
      customizationText.style.display = 'none';
      customizationTextValue = 'Padrão';
    });
    customizationOptions.appendChild(standardOption);

    const customOption = createOptionElement('Personalizado', 'custom');
    customOption.addEventListener('click', function() {
      selectOption(customizationOptions, this);
      selectedCustomization = 'custom';
      customizationText.style.display = 'block';
    });
    customizationOptions.appendChild(customOption);

    customizationText.oninput = function() {
      customizationTextValue = this.value;
    };

    // Botón “Adicionar ao Carrinho”
    modalAddToCart.onclick = function() {
      // Validaciones (si hay colores definidos, exige elegir uno)
      if (colorTokens.length > 0 && !selectedColor) {
        alert('Por favor, selecione uma cor.');
        return;
      }
      if (!selectedCustomization) {
        alert('Por favor, selecione uma opção de personalização (Padrão ou Personalizado).');
        return;
      }
      if (selectedCustomization === 'custom' && !customizationTextValue.trim()) {
        alert('Por favor, descreva a personalização desejada.');
        return;
      }

      const priceNum = typeof currentProduct.price === 'string'
        ? parseFloat(currentProduct.price.replace(',', '.'))
        : Number(currentProduct.price);

      const cartItem = {
        id: Date.now(),
        productId: currentProduct.id,
        name: currentProduct.title,
        price: isFinite(priceNum) ? priceNum : 0,
        color: selectedColor || 'Não especificada',
        customization: selectedCustomization === 'custom' ? customizationTextValue.trim() : 'Padrão',
        image: images[0] || 'https://placehold.co/100x100?text=Sem+Imagem'
      };

      cart.push(cartItem);
      updateCartUI();
      closeModal();
      alert(`"${currentProduct.title}" adicionado ao carrinho!`);
    };

    // Mostrar modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

  } catch (err) {
    console.error('Erro ao abrir modal:', err);
  }
}

// helpers del modal
function createOptionElement(text, value) {
  const option = document.createElement('div');
  option.textContent = text;
  option.className = 'modal-option';
  option.dataset.value = value;
  return option;
}

function selectOption(container, elementToSelect) {
  container.querySelectorAll('.modal-option').forEach(opt => opt.classList.remove('selected'));
  elementToSelect.classList.add('selected');
}

function closeModal() {
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

// ---------------------------
// Carrito
// ---------------------------
function updateCartUI() {
  // badge
  cartBadge.textContent = cart.length;
  cartBadge.style.display = cart.length > 0 ? 'flex' : 'none';

  // lista
  cartItemsList.innerHTML = '';
  if (cart.length === 0) {
    cartEmpty.style.display = 'block';
    cartTotal.style.display = 'none';
    checkoutBtn.style.display = 'none';
    totalPrice.textContent = '0,00';
    return;
  }

  cartEmpty.style.display = 'none';
  cartTotal.style.display = 'block';
  checkoutBtn.style.display = 'block';

  let total = 0;
  cart.forEach(item => {
    total += Number(item.price) || 0;

    const el = document.createElement('div');
    el.className = 'cart-item';

    const customizationDisplay = item.customization === 'Padrão'
      ? 'Padrão'
      : 'Personalizado: ' + item.customization.substring(0, 30) + (item.customization.length > 30 ? '...' : '');

    el.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHtml(item.name)}</div>
        <div class="cart-item-details">
          Cor: ${escapeHtml(item.color)}<br>${escapeHtml(customizationDisplay)}
        </div>
      </div>
      <div style="display: flex; align-items: flex-start;">
        <div class="cart-item-price">R$ ${fmtPriceBRL(item.price)}</div>
        <i class="fas fa-times-circle cart-item-remove" data-item-id="${item.id}"></i>
      </div>
    `;
    cartItemsList.appendChild(el);
  });

  // remover
  cartItemsList.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = Number(this.dataset.itemId);
      cart = cart.filter(it => it.id !== id);
      updateCartUI();
    });
  });

  totalPrice.textContent = fmtPriceBRL(total);
}

function generateWhatsAppMessage() {
  let message = 'Olá! Gostaria de solicitar um orçamento para os seguintes produtos:\n\n';
  cart.forEach((item, i) => {
    message += `${i + 1}. ${item.name}\n`;
    message += `  > Cor: ${item.color}\n`;
    if (item.customization && item.customization !== 'Padrão') {
      message += `  > Personalização: ${item.customization}\n`;
    } else {
      message += '  > Personalização: Padrão\n';
    }
    message += `  > Preço estimado: R$ ${fmtPriceBRL(item.price)}\n\n`;
  });
  const total = cart.reduce((s, it) => s + (Number(it.price) || 0), 0);
  message += `Total Estimado: R$ ${fmtPriceBRL(total)}\n\nAguardamos seu contato!`;
  return encodeURIComponent(message);
}

// ---------------------------
// Eventos globales
// ---------------------------
modalClose.addEventListener('click', closeModal);
modalCloseBtn.addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

cartBtn.addEventListener('click', e => {
  e.stopPropagation();
  cartModal.style.display = cartModal.style.display === 'flex' ? 'none' : 'flex';
});
document.addEventListener('click', () => {
  if (cartModal.style.display === 'flex') cartModal.style.display = 'none';
});
cartModal.addEventListener('click', e => e.stopPropagation());

checkoutBtn.addEventListener('click', e => {
  e.preventDefault();
  if (cart.length === 0) {
    alert('Seu carrinho está vazio.');
    return;
  }
  const phoneNumber = '55119984424479'; // tu número
  const url = `https://wa.me/${phoneNumber}?text=${generateWhatsAppMessage()}`;
  window.open(url, '_blank');
});

// expone openModal si en el HTML lo invocas por onclick
window.openModal = openModal;

// boot
document.addEventListener('DOMContentLoaded', () => {
  loadClientProducts();
  updateCartUI();
});
