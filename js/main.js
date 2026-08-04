import { supabase } from "./supabaseClient.js";

// ---------- Cargar contenido editable ----------
async function cargarContenido() {
  const { data, error } = await supabase.from("contenido").select("*");
  if (error || !data) return;

  const mapa = {};
  data.forEach(row => { mapa[row.clave] = row.valor; });

  if (mapa.biografia) {
    document.getElementById("texto-biografia").innerHTML =
      mapa.biografia.split("\n\n").map(p => `<p>${p}</p>`).join("");
  }
  if (mapa.cita_destacada) {
    document.getElementById("cita-destacada").textContent = `"${mapa.cita_destacada}"`;
  }
  if (mapa.direccion) document.getElementById("dato-direccion").textContent = mapa.direccion;
  if (mapa.telefono) document.getElementById("dato-telefono").textContent = mapa.telefono;
  if (mapa.email) document.getElementById("dato-email").textContent = mapa.email;
  if (mapa.horarios) document.getElementById("dato-horarios").textContent = mapa.horarios;

  const heroImg = document.getElementById("hero-img");
  if (heroImg && mapa.portada) {
    heroImg.src = mapa.portada;
    heroImg.classList.remove("oculto");
  }
}

// ---------- Galería ----------
let todasLasFotos = [];

async function cargarGaleria() {
  const grid = document.getElementById("galeria-grid");
  const { data, error } = await supabase
    .from("fotos")
    .select("*")
    .order("orden", { ascending: true });

  if (error || !data || data.length === 0) {
    grid.innerHTML = `<p class="galeria-vacio">Todavía no hay fotos cargadas. Muy pronto vas a poder ver imágenes de la casa museo acá.</p>`;
    return;
  }
  todasLasFotos = data;
  renderGaleria("todas");
}

function renderGaleria(categoria) {
  const grid = document.getElementById("galeria-grid");
  const fotos = categoria === "todas"
    ? todasLasFotos
    : todasLasFotos.filter(f => f.categoria === categoria);

  if (fotos.length === 0) {
    grid.innerHTML = `<p class="galeria-vacio">No hay fotos en esta categoría todavía.</p>`;
    return;
  }

  grid.innerHTML = fotos.map(f => `
    <div class="foto-card">
      <img src="${f.url}" alt="${f.titulo || 'Foto de la casa museo'}" loading="lazy">
      ${f.titulo ? `<div class="cap">${f.titulo}</div>` : ""}
    </div>
  `).join("");
}

document.getElementById("galeria-filtros").addEventListener("click", (e) => {
  const btn = e.target.closest(".filtro");
  if (!btn) return;
  document.querySelectorAll(".filtro").forEach(f => f.classList.remove("activo"));
  btn.classList.add("activo");
  renderGaleria(btn.dataset.cat);
});

// ---------- Selector tipo de reserva ----------
const camposInstitucion = [
  "campo-tipo-institucion", "campo-contacto-nombre", "campo-contacto-cargo",
  "campo-rango-edad", "campo-objetivo", "campo-accesibilidad"
];

document.querySelectorAll(".tipo-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".tipo-card").forEach(c => c.classList.remove("activo"));
    card.classList.add("activo");
    const tipo = card.dataset.tipo;
    document.getElementById("tipo").value = tipo;

    const esInstitucion = tipo === "institucion";
    camposInstitucion.forEach(id => {
      document.getElementById(id).classList.toggle("oculto", !esInstitucion);
    });
    document.getElementById("campo-dni").classList.toggle("oculto", esInstitucion);
    document.getElementById("label-nombre").textContent = esInstitucion
      ? "Nombre de la institución"
      : "Nombre y apellido";
  });
});

// ---------- Lightbox (ampliar foto al hacer click) ----------
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxCap = document.getElementById("lightbox-cap");

document.getElementById("galeria-grid").addEventListener("click", (e) => {
  const card = e.target.closest(".foto-card");
  if (!card) return;
  const img = card.querySelector("img");
  lightboxImg.src = img.src;
  lightboxImg.alt = img.alt;
  lightboxCap.textContent = img.alt || "";
  lightbox.classList.add("abierto");
});

function cerrarLightbox() {
  lightbox.classList.remove("abierto");
  lightboxImg.src = "";
}

document.getElementById("lightbox-cerrar").addEventListener("click", cerrarLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) cerrarLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cerrarLightbox();
});

// ---------- Envío del formulario ----------
document.getElementById("form-reserva").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("form-msg");
  msg.className = "form-msg";
  msg.textContent = "";

  const tipo = document.getElementById("tipo").value;

  const payload = {
    tipo,
    nombre: document.getElementById("nombre").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    email: document.getElementById("email").value.trim() || null,
    cantidad_personas: parseInt(document.getElementById("cantidad_personas").value, 10) || 1,
    fecha_propuesta: document.getElementById("fecha_propuesta").value || null,
    horario: document.getElementById("horario").value.trim() || null,
    como_se_entero: document.getElementById("como_se_entero").value.trim() || null,
    comentarios: document.getElementById("comentarios").value.trim() || null,
  };

  if (tipo === "particular") {
    payload.dni = document.getElementById("dni").value.trim() || null;
  } else {
    payload.tipo_institucion = document.getElementById("tipo_institucion").value;
    payload.contacto_nombre = document.getElementById("contacto_nombre").value.trim() || null;
    payload.contacto_cargo = document.getElementById("contacto_cargo").value.trim() || null;
    payload.rango_edad = document.getElementById("rango_edad").value.trim() || null;
    payload.objetivo_visita = document.getElementById("objetivo_visita").value.trim() || null;
    payload.accesibilidad = document.getElementById("accesibilidad").value.trim() || null;
  }

  const { error } = await supabase.from("reservas").insert(payload);

  if (error) {
    msg.classList.add("error");
    msg.textContent = "No pudimos enviar tu reserva. Probá de nuevo en unos minutos.";
    console.error(error);
    return;
  }

  msg.classList.add("ok");
  msg.textContent = "¡Reserva enviada! Nos vamos a comunicar para confirmar el horario.";
  e.target.reset();
  document.getElementById("tipo").value = "particular";
});

// ---------- Inicio ----------
cargarContenido();
cargarGaleria();

document.getElementById("nav-toggle")?.addEventListener("click", () => {
  document.getElementById("nav-links").classList.toggle("abierto");
});
