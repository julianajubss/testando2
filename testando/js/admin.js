// js/admin.js

// ===========================
//  Selección de elementos
// ===========================
const authSection            = document.getElementById('auth-section');
const adminDashboard         = document.getElementById('admin-dashboard');
const loginForm              = document.getElementById('login-form');
const authStatus             = document.getElementById('auth-status');

const newProductForm         = document.getElementById('new-product-form');
const submitButton           = document.getElementById('submit-button');

const productTitle           = document.getElementById('product-title');
const productPrice           = document.getElementById('product-price');
const productShortDescription= document.getElementById('product-short-description');
const productDescription     = document.getElementById('product-description');
const productPhotos          = document.getElementById('product-photos');
const selectedColorsInput    = document.getElementById('selected-colors');
const colorCircles           = document.querySelectorAll('.color-circle');

const photoPreview           = document.getElementById('photo-preview');
const productsListContainer  = document.getElementById('published-products-list');
const noProductsMessage      = document.getElementById('no-products-message');

// ===========================
//  Estado
// ===========================
let isEditing        = false;
let currentEditingId = null;
let imagesToDelete   = []; // URLs absolutas (/uploads/...) a eliminar en update

// ===========================
//  Utilidades UI
// ===========================
function showCustomMessage(message, type = 'success') {
  const container = document.createElement('div');
  container.className =
    `fixed top-0 right-0 m-4 p-3 rounded-lg shadow-xl text-white transition-opacity duration-300 z-50 
     ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
  container.textContent = message;
  document.body.appendChild(container);
  setTimeout(() => {
    container.classList.add('opacity-0');
    container.addEventListener('transitionend', () => container.remove());
  }, 2500);
}

function mapColorsForForm(colorsString) {
  colorCircles.forEach(el => el.classList.remove('selected'));
  selectedColorsInput.value = '';
  if (!colorsString) return;

  const colors = colorsString.split(',').map(c => c.trim()).filter(Boolean);
  colorCircles.forEach(circle => {
    if (colors.includes(circle.getAttribute('data-color'))) {
      circle.classList.add('selected');
    }
  });
  selectedColorsInput.value = colors.join(',');
}

function resetFormAndEditingState() {
  isEditing = false;
  currentEditingId = null;
  imagesToDelete = [];

  newProductForm.reset();
  document.getElementById('product-id').value = '';

  mapColorsForForm('');
  photoPreview.innerHTML = '';
  productPhotos.value = '';

  submitButton.innerHTML = `<i class="fas fa-cloud-upload-alt mr-2"></i> Publicar Producto`;
  submitButton.classList.remove('bg-green-500', 'hover:bg-green-600');
  submitButton.classList.add('bg-[#8B4513]', 'hover:bg-[#6d3710]');
}

// ===========================
//  Auth
// ===========================
function handleAuthSuccess(userName = 'Admin') {
  authSection.classList.add('hidden');
  adminDashboard.classList.remove('hidden');
  const nameDisplay = userName.includes('@') ? userName.split('@')[0] : userName;
  authStatus.textContent = `Bienvenido, ${nameDisplay} | Sesión Activa`;
  authStatus.classList.remove('text-gray-500');
  authStatus.classList.add('text-[#8B4513]', 'font-semibold');
  loadProducts();
}

document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    const res = await fetch('php/logout.php');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success) {
      adminDashboard.classList.add('hidden');
      authSection.classList.remove('hidden');
      authStatus.textContent = 'Autenticación Requerida';
      authStatus.classList.remove('text-[#8B4513]', 'font-semibold');
      authStatus.classList.add('text-gray-500');
      loginForm.reset();
      productsListContainer.innerHTML = '';
      resetFormAndEditingState();
      showCustomMessage('Sesión cerrada correctamente.', 'success');
    } else {
      showCustomMessage('Error al cerrar sesión: ' + data.message, 'error');
    }
  } catch (err) {
    console.error(err);
    showCustomMessage('Error de conexión al cerrar sesión.', 'error');
  }
});

// ===========================
//  Listado de productos
// ===========================
function renderProductsList(products) {
  productsListContainer.innerHTML = '';

  if (!products || products.length === 0) {
    noProductsMessage.classList.remove('hidden');
    return;
  }
  noProductsMessage.classList.add('hidden');

  products.forEach(product => {
    const colorsHtml = (product.colors || '')
      .split(',')
      .map(c => c.trim())
      .filter(Boolean)
      .map(color =>
        `<span class="inline-block w-3 h-3 rounded-full mr-1" style="background-color:${color}; border:1px solid #ccc;"></span>`
      ).join('');

    const firstImageUrl = (product.image_url || '')
      .split(',')
      .map(u => u.trim())
      .filter(Boolean)[0] || 'https://placehold.co/60x60/f0f0f0/6d3710?text=NO+IMG';

    const item = document.createElement('div');
    item.className = 'product-list-item hover:bg-gray-50';
    item.dataset.id = product.id;
    item.innerHTML = `
      <img src="${firstImageUrl}" alt="${product.title}" class="product-list-image">
      <div class="product-list-details">
        <h4 class="font-bold text-gray-800">${product.title}</h4>
        <p class="text-sm text-gray-500">R$ ${Number(product.price).toFixed(2)} | Colores: ${colorsHtml || '—'}</p>
        <p class="text-xs text-gray-600 italic mt-1">${product.short_description || 'Sin descripción corta.'}</p>
      </div>
      <div class="product-list-actions">
        <button data-id="${product.id}" class="edit-btn py-2 px-3 text-xs bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition duration-200 shadow-sm">
          <i class="fas fa-edit"></i> Editar
        </button>
        <button data-id="${product.id}" class="delete-btn py-2 px-3 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 shadow-sm">
          <i class="fas fa-trash"></i> Eliminar
        </button>
      </div>
    `;
    productsListContainer.appendChild(item);
  });

  // bind actions
  productsListContainer.querySelectorAll('.edit-btn')
    .forEach(btn => btn.addEventListener('click', handleEditProduct));
  productsListContainer.querySelectorAll('.delete-btn')
    .forEach(btn => btn.addEventListener('click', handleDeleteProduct));
}

async function loadProducts() {
  try {
    const res = await fetch('php/products.php?action=list');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success) renderProductsList(data.products);
    else {
      noProductsMessage.classList.remove('hidden');
      showCustomMessage(data.message || 'Error al cargar productos.', 'error');
    }
  } catch (err) {
    console.error(err);
    noProductsMessage.classList.remove('hidden');
    showCustomMessage('Error de conexión al listar productos.', 'error');
  }
}

// ===========================
//  Imágenes (preview + X)
// ===========================
function renderExistingImages(urls) {
  photoPreview.innerHTML = '';
  urls.forEach(url => {
    const wrap = document.createElement('div');
    wrap.className = 'relative group w-20 h-20';
    wrap.dataset.url = url;

    const img = document.createElement('img');
    img.src = url;
    img.className = 'w-full h-full object-cover rounded border';

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'absolute top-0 right-0 bg-red-600 text-white text-xs p-1 rounded-full opacity-80 hover:opacity-100';
    del.textContent = '❌';
    del.addEventListener('click', () => {
      imagesToDelete.push(url);
      wrap.remove();
    });

    wrap.appendChild(img);
    wrap.appendChild(del);
    photoPreview.appendChild(wrap);
  });
}

// nuevas imágenes seleccionadas (sin borrar las ya renderizadas)
productPhotos.addEventListener('change', (e) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  const max = Math.min(files.length, 20); // límite razonable

  for (let i = 0; i < max; i++) {
    const file = files[i];
    if (!file.type.startsWith('image/')) continue;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const wrap = document.createElement('div');
      wrap.className = 'relative group w-20 h-20';

      const img = document.createElement('img');
      img.src = ev.target.result;
      img.className = 'w-full h-full object-cover rounded border-2 border-[#8B4513] shadow-md';

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'absolute top-0 right-0 bg-red-600 text-white text-xs p-1 rounded-full opacity-80 hover:opacity-100';
      del.textContent = '❌';
      del.addEventListener('click', () => wrap.remove());

      wrap.appendChild(img);
      wrap.appendChild(del);
      photoPreview.appendChild(wrap);
    };
    reader.readAsDataURL(file);
  }
});

// ===========================
//  Crear / Actualizar
// ===========================
newProductForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // validación básica
  if (!productTitle.value.trim() || !productPrice.value.trim()) {
    showCustomMessage('El título y el precio son obligatorios.', 'error');
    return;
  }
  const priceValue = parseFloat(productPrice.value);
  if (isNaN(priceValue) || priceValue <= 0) {
    showCustomMessage('El precio debe ser un número positivo.', 'error');
    return;
  }

  const formData = new FormData(newProductForm);
  const action = isEditing ? 'update' : 'create';
  formData.append('action', action);

  if (isEditing) {
    formData.append('id', currentEditingId);
    if (imagesToDelete.length > 0) {
      formData.append('delete_images', JSON.stringify(imagesToDelete));
    }
  }

  const cleanColors = (selectedColorsInput.value || '')
    .split(',').map(c => c.trim()).filter(Boolean).join(',');
  formData.set('colors', cleanColors);

  submitButton.disabled = true;
  submitButton.innerHTML =
    `<i class="fas fa-spinner fa-spin mr-2"></i> ${isEditing ? 'Guardando Cambios...' : 'Publicando...'}`;

  try {
    const res = await fetch('php/products.php', { method: 'POST', body: formData });
    if (!res.ok) {
      const txt = await res.text();
      console.error('Server error body:', txt);
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data.success) {
      showCustomMessage(data.message || (isEditing ? 'Producto actualizado.' : 'Producto publicado.'), 'success');
      resetFormAndEditingState();
      imagesToDelete = [];
      await loadProducts();
    } else {
      showCustomMessage(data.message || 'Acción fallida.', 'error');
    }
  } catch (err) {
    console.error(err);
    showCustomMessage('Error de conexión/servidor al guardar.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = isEditing
      ? `<i class="fas fa-save mr-2"></i> Guardar Cambios (ID: ${currentEditingId})`
      : `<i class="fas fa-cloud-upload-alt mr-2"></i> Publicar Producto`;
  }
});

// ===========================
//  Eliminar
// ===========================
async function handleDeleteProduct(e) {
  const id = e.currentTarget.getAttribute('data-id');
  if (!confirm(`¿Eliminar producto ID ${id}?`)) return;

  const fd = new FormData();
  fd.append('action', 'delete');
  fd.append('id', id);

  try {
    const res = await fetch('php/products.php', { method: 'POST', body: fd });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success) {
      showCustomMessage(data.message || 'Producto eliminado.', 'success');
      resetFormAndEditingState();
      loadProducts();
    } else {
      showCustomMessage('Error al eliminar: ' + (data.message || ''), 'error');
    }
  } catch (err) {
    console.error(err);
    showCustomMessage('Error de conexión al eliminar.', 'error');
  }
}

// ===========================
//  Editar (carga de datos)
// ===========================
async function handleEditProduct(e) {
  const id = e.currentTarget.getAttribute('data-id');

  resetFormAndEditingState(); // limpia UI anterior
  imagesToDelete = [];        // importante

  try {
    const res = await fetch(`php/products.php?action=get&id=${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.success && data.product) {
      const p = data.product;

      productTitle.value            = p.title || '';
      productPrice.value            = Number(p.price).toFixed(2);
      productShortDescription.value = p.short_description || '';
      productDescription.value      = p.description || '';
      mapColorsForForm(p.colors || '');

      isEditing = true;
      currentEditingId = p.id;
      document.getElementById('product-id').value = p.id;

      submitButton.innerHTML = `<i class="fas fa-save mr-2"></i> Guardar Cambios (ID: ${p.id})`;
      submitButton.classList.remove('bg-[#8B4513]', 'hover:bg-[#6d3710]');
      submitButton.classList.add('bg-green-500', 'hover:bg-green-600');

      // Mostrar imágenes actuales con ❌
      const urls = (p.image_url || '')
        .split(',')
        .map(u => u.trim())
        .filter(Boolean);
      if (urls.length) renderExistingImages(urls);

      showCustomMessage(`Producto ${p.id} cargado para edición.`, 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showCustomMessage(data.message || 'Producto no encontrado.', 'error');
    }
  } catch (err) {
    console.error(err);
    showCustomMessage('Error al cargar producto.', 'error');
  }
}

// ===========================
//  Colores (handler global)
// ===========================
window.toggleColorSelection = function (el) {
  const color = el.getAttribute('data-color');
  el.classList.toggle('selected');

  let list = (selectedColorsInput.value || '')
    .split(',').map(c => c.trim()).filter(Boolean);

  if (el.classList.contains('selected')) {
    if (!list.includes(color)) list.push(color);
  } else {
    list = list.filter(c => c !== color);
  }
  selectedColorsInput.value = list.join(',');
};

// ===========================
//  Login
// ===========================
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) {
    showCustomMessage('Ingrese email y contraseña.', 'error');
    return;
  }

  const fd = new FormData();
  fd.append('email', email);
  fd.append('password', password);

  try {
    const res = await fetch('php/login.php', { method: 'POST', body: fd });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success) {
      handleAuthSuccess(data.userName || 'Admin');
      showCustomMessage('Inicio de sesión exitoso.', 'success');
    } else {
      showCustomMessage(data.message || 'Credenciales inválidas.', 'error');
    }
  } catch (err) {
    console.error(err);
    showCustomMessage('Error de conexión durante el login.', 'error');
  }
});
