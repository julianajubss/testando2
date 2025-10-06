// Datos de productos (simulando una base de datos)
        const products = {
            1: {
                name: "Bolsa Maternidade Cecília",
                images: [
                    "img-items/bolsa-cecilia.jpeg",
                    "img-items/bordado-cecilia.jpeg",
                    "img-items/bordado-cecilia-borboleta.jpeg"
                ],
                description: "Bolsa maternidade elegante y práctica con múltiples compartimentos. Ideal para llevar todos los elementos necesarios para el bebé. Fabricada con materiales de alta calidad y diseño moderno.",
                price: "120,00",
                colors: ["Azul", "Rosa", "Bege", "Cinza"],
                hasCustomization: true
            },
            2: {
                name: "Kit Completo Luís Otávio",
                images: [
                    "img-items/kit-luis-otavio.jpeg",
                    "img-items/kit-luis-otavio-2.jpeg"
                ],
                description: "Kit completo para el cuidado del bebé, incluye bolsa maternidad, cambiador y accesorios. Diseño funcional y estético para padres modernos.",
                price: "180,00",
                colors: ["Verde", "Azul Marinho", "Amarelo"],
                hasCustomization: true
            },
            3: {
                name: "Kit Completo Lucca",
                images: [
                    "img-items/kit-lucca.jpeg",
                    "img-items/kit-lucca-2.jpeg",
                    "img-items/kit-lucca-3.jpeg"
                ],
                description: "Kit completo con todo lo necesario para el cuidado del bebé. Incluye bolsa, cambiador y accesorios organizados de manera práctica.",
                price: "175,00",
                colors: ["Azul Claro", "Branco", "Cinza Claro"],
                hasCustomization: true
            }
        };

        // Carrito de compras (almacena los ítems seleccionados)
        let cart = [];

        // Elementos del DOM del Modal
        const modal = document.getElementById('product-modal');
        const modalTitle = document.getElementById('modal-product-title');
        const modalImage = document.getElementById('modal-product-image');
        const modalThumbnails = document.getElementById('modal-thumbnails');
        const modalDescription = document.getElementById('modal-product-description');
        const modalPrice = document.getElementById('modal-product-price');
        const colorOptions = document.getElementById('color-options');
        const customizationOptions = document.getElementById('customization-options');
        const customizationText = document.getElementById('customization-text');
        const modalClose = document.getElementById('modal-close');
        const modalCloseBtn = document.getElementById('modal-close-btn');
        const modalAddToCart = document.getElementById('modal-add-to-cart');
        
        // Elementos del DOM del Carrito (dropdown)
        const cartBtn = document.getElementById('cart-btn');
        const cartModal = document.getElementById('cart-modal');
        const cartBadge = document.getElementById('cart-badge');
        const cartItemsList = document.getElementById('cart-items-list');
        const cartTotal = document.getElementById('cart-total');
        const cartEmpty = document.getElementById('cart-empty');
        const checkoutBtn = document.getElementById('checkout-btn');
        const totalPrice = document.getElementById('total-price');

        // Variables de estado del producto en el modal
        let currentProductId = null;
        let selectedColor = null;
        let selectedCustomization = null; // 'standard' o 'custom'
        let customizationTextValue = "";

        /**
         * Función para abrir el modal de un producto.
         * @param {string} productId - ID del producto a mostrar.
         */
        function openModal(productId) {
            const product = products[productId];
            if (!product) return;

            // Reiniciar estado
            currentProductId = productId;
            selectedColor = null;
            selectedCustomization = null;
            customizationTextValue = "";
            customizationText.value = "";
            customizationText.style.display = 'none';

            // Llenar contenido del modal
            modalTitle.textContent = product.name;
            modalImage.src = product.images[0];
            modalDescription.textContent = product.description;
            modalPrice.textContent = `R$ ${product.price}`;
            
            // 1. Manejar Miniaturas (Thumbnails)
            modalThumbnails.innerHTML = '';
            product.images.forEach((image, index) => {
                const thumbnail = document.createElement('img');
                thumbnail.src = image;
                thumbnail.alt = `Miniatura ${index + 1}`;
                thumbnail.className = 'modal-thumbnail';
                if (index === 0) thumbnail.classList.add('active');
                
                thumbnail.addEventListener('click', () => {
                    modalImage.src = image;
                    document.querySelectorAll('.modal-thumbnail').forEach(thumb => {
                        thumb.classList.remove('active');
                    });
                    thumbnail.classList.add('active');
                });
                
                modalThumbnails.appendChild(thumbnail);
            });
            
            // 2. Manejar Opciones de Color
            colorOptions.innerHTML = '';
            product.colors.forEach(color => {
                const colorOption = createOptionElement(color, color);
                colorOption.addEventListener('click', function() {
                    selectOption(colorOptions, this);
                    selectedColor = color;
                });
                colorOptions.appendChild(colorOption);
            });
            
            // 3. Manejar Opciones de Personalización
            customizationOptions.innerHTML = '';
            if (product.hasCustomization) {
                // Opción Padrão
                const standardOption = createOptionElement("Padrão", "standard");
                standardOption.addEventListener('click', function() {
                    selectOption(customizationOptions, this);
                    selectedCustomization = "standard";
                    customizationText.style.display = 'none';
                    customizationTextValue = "Padrão";
                });
                customizationOptions.appendChild(standardOption);
                
                // Opción Personalizado
                const customOption = createOptionElement("Personalizado", "custom");
                customOption.addEventListener('click', function() {
                    selectOption(customizationOptions, this);
                    selectedCustomization = "custom";
                    customizationText.style.display = 'block';
                    customizationTextValue = customizationText.value; // Mantener el valor si ya hay texto
                });
                customizationOptions.appendChild(customOption);
                
                // Evento para el campo de texto de personalización
                customizationText.oninput = function() {
                    customizationTextValue = this.value;
                };

            } else {
                customizationOptions.innerHTML = '<p>Este produto não possui opções de personalização.</p>';
                selectedCustomization = "Não aplicável";
            }
            
            // Mostrar modal y bloquear scroll del cuerpo
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        /**
         * Función helper para crear elementos de opción.
         */
        function createOptionElement(text, value) {
            const option = document.createElement('div');
            option.textContent = text;
            option.className = 'modal-option';
            option.dataset.value = value;
            return option;
        }

        /**
         * Función helper para manejar la selección de opciones (radio-like).
         */
        function selectOption(container, elementToSelect) {
            container.querySelectorAll('.modal-option').forEach(option => {
                option.classList.remove('selected');
            });
            elementToSelect.classList.add('selected');
        }

        /**
         * Función para cerrar el modal.
         */
        function closeModal() {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        /**
         * Función para actualizar la interfaz del carrito.
         */
        function updateCartUI() {
            // Actualizar badge
            cartBadge.textContent = cart.length;
            cartBadge.style.display = cart.length > 0 ? 'flex' : 'none'
            
            // Actualizar lista de ítems
            cartItemsList.innerHTML = '';
            
            if (cart.length === 0) {
                cartEmpty.style.display = 'block';
                cartTotal.style.display = 'none';
                checkoutBtn.style.display = 'none';
            } else {
                cartEmpty.style.display = 'none';
                cartTotal.style.display = 'block';
                checkoutBtn.style.display = 'block';
                
                let total = 0;
                
                cart.forEach(item => {
                    total += parseFloat(item.price);
                    
                    const cartItemElement = document.createElement('div');
                    cartItemElement.className = 'cart-item';
                    
                    // Formato de personalización para la visualización
                    const customizationDisplay = item.customization === "Padrão" ? "Padrão" : "Personalizado: " + item.customization.substring(0, 30) + (item.customization.length > 30 ? '...' : '');

                    cartItemElement.innerHTML = `
                        <div class="cart-item-info">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-details">
                                Cor: ${item.color}
                                <br> ${customizationDisplay}
                            </div>
                        </div>
                        <div style="display: flex; align-items: flex-start;">
                            <div class="cart-item-price">R$ ${item.price.toFixed(2).replace('.', ',')}</div>
                            <i class="fas fa-times-circle cart-item-remove" data-item-id="${item.id}"></i>
                        </div>
                    `;
                    
                    cartItemsList.appendChild(cartItemElement);
                });
                
                // Agregar listeners para eliminar ítems
                document.querySelectorAll('.cart-item-remove').forEach(removeBtn => {
                    removeBtn.addEventListener('click', function() {
                        const itemId = parseInt(this.dataset.itemId);
                        removeFromCart(itemId);
                    });
                });

                totalPrice.textContent = total.toFixed(2).replace('.', ',');
            }
        }

        /**
         * Elimina un ítem del carrito por su ID único.
         * @param {number} itemId - ID único del ítem a eliminar.
         */
        function removeFromCart(itemId) {
            cart = cart.filter(item => item.id !== itemId);
            updateCartUI();
        }

        /**
         * Función para generar el mensaje de WhatsApp.
         */
        function generateWhatsAppMessage() {
            let message = "Olá! Gostaria de solicitar um orçamento para os seguintes produtos:\n\n";
            
            cart.forEach((item, index) => {
                message += `${index + 1}. ${item.name}\n`;
                message += `  > Cor: ${item.color}\n`;
                if (item.customization && item.customization !== "Padrão") {
                    message += `  > Personalização: ${item.customization}\n`;
                } else {
                    message += `  > Personalização: Padrão\n`;
                }
                message += `  > Preço estimado: R$ ${item.price.toFixed(2).replace('.', ',')}\n\n`;
            });
            
            message += `Total Estimado: R$ ${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2).replace('.', ',')}`;
            message += "\n\nAguardamos seu contato para finalizar o pedido e confirmar o valor final!";
            
            return encodeURIComponent(message);
        }

        // --- Event Listeners ---

        // Abrir Modal al hacer clic en cualquier tarjeta de producto
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', function(e) {
                // Evitar que se active si se hace clic directamente en el botón "Fazer pedido" (aunque el onclick en el HTML ya lo maneja)
                if (!e.target.closest('.btn-primary')) {
                    const productId = this.dataset.productId;
                    openModal(productId);
                }
            });
        });

        // Cierre del modal
        modalClose.addEventListener('click', closeModal);
        modalCloseBtn.addEventListener('click', closeModal);

        // Cierre del modal al hacer clic fuera del contenido
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Agregar producto al carrito desde el modal
        modalAddToCart.addEventListener('click', function() {
            const product = products[currentProductId];
            
            // 1. Validar selección de color
            if (!selectedColor && product.colors.length > 0) {
                alert('Por favor, selecione uma cor.');
                return;
            }
            
            // 2. Validar selección de personalización
            if (!selectedCustomization && product.hasCustomization) {
                 alert('Por favor, selecione uma opção de personalização (Padrão ou Personalizado).');
                 return;
            }

            // 3. Validar texto de personalización si es necesario
            if (selectedCustomization === "custom" && !customizationTextValue.trim()) {
                alert('Por favor, descreva a personalização desejada.');
                return;
            }
            
            // Crear objeto del producto para el carrito
            const cartItem = {
                id: Date.now(), // ID único para el ítem del carrito
                productId: currentProductId,
                name: product.name,
                price: parseFloat(product.price.replace(',', '.')),
                color: selectedColor || "Não especificada",
                customization: selectedCustomization === "custom" ? customizationTextValue.trim() : "Padrão",
                image: product.images[0]
            };
            
            // Agregar al carrito
            cart.push(cartItem);
            
            // Actualizar interfaz del carrito
            updateCartUI();
            
            // Cerrar modal
            closeModal();
            
            // Mostrar mensaje de confirmación
            alert(`"${product.name}" adicionado ao carrinho!`);
        });

        // Toggle del carrito (mostrar/ocultar)
        cartBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            cartModal.style.display = cartModal.style.display === 'flex' ? 'none' : 'flex';
        });

        // Cerrar carrito al hacer clic fuera de él
        document.addEventListener('click', function() {
            if (cartModal.style.display === 'flex') {
                cartModal.style.display = 'none';
            }
        });

        // Evitar que el carrito se cierre al hacer clic dentro
        cartModal.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        // Configurar botón de checkout (WhatsApp)
        checkoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (cart.length === 0) {
                alert('Seu carrinho está vazio.');
                return;
            }
            
            // Reemplazar con el número de teléfono real con código de país, sin '+' ni guiones
            const phoneNumber = "55119984424479"; 
            const message = generateWhatsAppMessage();
            const url = `https://wa.me/${phoneNumber}?text=${message}`;
            
            window.open(url, '_blank');
        });

        // Inicializar interfaz del carrito al cargar
        updateCartUI();
