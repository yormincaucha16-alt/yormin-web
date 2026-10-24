"use strict";

/* =========================================
   AUCOUTIX - LÓGICA FRONTEND DE INTERACCIÓN
   ========================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

/* ---------- 1. MENÚ HAMBURGUESA ---------- */
const botonMenu = $("#btn-menu");
const menu = $("#menu-principal");

function cerrarMenu() {
    if (menu) {
        menu.classList.remove("abierto");
        botonMenu?.setAttribute("aria-expanded", "false");
    }
}

if (botonMenu && menu) {
    botonMenu.addEventListener("click", () => {
        const abierto = menu.classList.toggle("abierto");
        botonMenu.setAttribute("aria-expanded", abierto);
    });

    menu.addEventListener("click", (e) => {
        if (e.target.tagName === "A") cerrarMenu();
    });
}

/* ---------- 2. FILTRADO Y BÚSQUEDA ---------- */
const botonesFiltro = $$(".filtro");
const tarjetas = $$(".card");
const buscador = $("#buscador");
let categoriaActiva = "todos";

function aplicarFiltros() {
    if (!tarjetas.length) return;
    const texto = buscador ? buscador.value.trim().toLowerCase() : "";
    let visibles = 0;

    tarjetas.forEach((tarjeta) => {
        const categoria = tarjeta.dataset.categoria;
        const nombre = tarjeta.dataset.nombre.toLowerCase();

        const coincideCategoria = categoriaActiva === "todos" || categoria === categoriaActiva;
        const coincideTexto = nombre.includes(texto);

        const mostrar = coincideCategoria && coincideTexto;
        tarjeta.hidden = !mostrar;

        if (mostrar) visibles++;
    });

    const sinResultados = $("#sin-resultados");
    if (sinResultados) sinResultados.hidden = visibles > 0;
}

botonesFiltro.forEach((boton) => {
    boton.addEventListener("click", () => {
        categoriaActiva = boton.dataset.filtro;
        botonesFiltro.forEach((b) => {
            const activo = b === boton;
            b.classList.toggle("activo", activo);
            b.setAttribute("aria-pressed", activo);
        });
        aplicarFiltros();
    });
});

if (buscador) {
    buscador.addEventListener("input", aplicarFiltros);
}

/* ---------- 3. CARRITO DE COMPRAS CON LOCALSTORAGE ---------- */
const CLAVE_CARRITO = "aucoutix-carrito";
const panelCarrito = $("#carrito");
const botonCarrito = $("#btn-carrito");
const listaCarrito = $("#lista-carrito");
const contador = $("#contador-carrito");

function cargarCarrito() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || [];
    } catch (error) {
        return [];
    }
}

let carrito = cargarCarrito();

function guardarCarrito() {
    try {
        localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
    } catch (error) {
        console.warn("No se pudo guardar el carrito:", error);
    }
}

function agregarAlCarrito(id, nombre, precio) {
    const existente = carrito.find((p) => p.id === id);
    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({ id, nombre, precio, cantidad: 1 });
    }
    actualizarCarrito(true);
}

function cambiarCantidad(id, cambio) {
    const producto = carrito.find((p) => p.id === id);
    if (!producto) return;

    producto.cantidad += cambio;
    if (producto.cantidad <= 0) {
        carrito = carrito.filter((p) => p.id !== id);
    }
    actualizarCarrito();
}

function eliminarProducto(id) {
    carrito = carrito.filter((p) => p.id !== id);
    actualizarCarrito();
}

function mostrarCarrito(animar) {
    if (!listaCarrito) return;

    if (carrito.length === 0) {
        listaCarrito.innerHTML = "<p style='text-align:center; padding:20px; color:#666;'>Tu carrito está vacío.</p>";
    } else {
        listaCarrito.innerHTML = carrito.map((p) => `
            <div class="producto-carrito">
                <div>
                    <h3>${p.nombre}</h3>
                    <p>S/ ${p.precio.toFixed(2)} x ${p.cantidad}</p>
                </div>
                <div class="controles">
                    <button data-id="${p.id}" data-accion="menos" aria-label="Disminuir cantidad">−</button>
                    <span>${p.cantidad}</span>
                    <button data-id="${p.id}" data-accion="mas" aria-label="Aumentar cantidad">+</button>
                    <button data-id="${p.id}" data-accion="eliminar" aria-label="Eliminar producto">🗑️</button>
                </div>
            </div>
        `).join("");
    }

    const total = carrito.reduce((suma, p) => suma + p.precio * p.cantidad, 0);
    const unidades = carrito.reduce((suma, p) => suma + p.cantidad, 0);

    if ($("#total-carrito")) $("#total-carrito").textContent = total.toFixed(2);
    if (contador) contador.textContent = unidades;

    if (animar && contador) {
        contador.classList.remove("pop");
        void contador.offsetWidth;
        contador.classList.add("pop");
    }
}

function actualizarCarrito(animar = false) {
    guardarCarrito();
    mostrarCarrito(animar);
}

function abrirCarrito(abrir) {
    if (!panelCarrito) return;
    panelCarrito.classList.toggle("mostrar", abrir);
    panelCarrito.setAttribute("aria-hidden", !abrir);
}

$$(".btn-comprar").forEach((boton) => {
    boton.addEventListener("click", () => {
        const card = boton.closest(".card");
        const { id, nombre, precio } = card.dataset;
        agregarAlCarrito(id, nombre, Number(precio));
        if ($("#mensaje-compra")) $("#mensaje-compra").textContent = "";
        abrirCarrito(true);
    });
});

if (listaCarrito) {
    listaCarrito.addEventListener("click", (e) => {
        const boton = e.target.closest("button");
        if (!boton) return;
        const { id, accion } = boton.dataset;
        if (accion === "mas") cambiarCantidad(id, 1);
        if (accion === "menos") cambiarCantidad(id, -1);
        if (accion === "eliminar") eliminarProducto(id);
    });
}

if (botonCarrito) botonCarrito.addEventListener("click", () => abrirCarrito(true));
if ($("#cerrar-carrito")) $("#cerrar-carrito").addEventListener("click", () => abrirCarrito(false));

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        abrirCarrito(false);
        cerrarMenu();
    }
});

if ($("#btn-finalizar")) {
    $("#btn-finalizar").addEventListener("click", () => {
        const mensaje = $("#mensaje-compra");
        if (carrito.length === 0) {
            mensaje.textContent = "Agrega al menos un producto antes de continuar.";
            return;
        }
        mensaje.textContent = "¡Pedido registrado! Sincronizando con el canal de atención para coordinar el despacho...";
        carrito = [];
        actualizarCarrito();
    });
}

// Inicialización
mostrarCarrito();