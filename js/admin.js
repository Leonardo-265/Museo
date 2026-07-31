import { supabase } from "./supabaseClient.js";

const loginView = document.getElementById("login-view");
const adminView = document.getElementById("admin-view");

// ---------- Sesión ----------
async function chequearSesion() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    loginView.classList.add("oculto");
    adminView.classList.remove("oculto");
    iniciarPanel();
  } else {
    loginView.classList.remove("oculto");
    adminView.classList.add("oculto");
  }
}

document.getElementById("btn-login").addEventListener("click", async () => {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-pass").value;
  const errorEl = document.getElementById("login-error");
  errorEl.textContent = "";

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    errorEl.textContent = "Email o contraseña incorrectos.";
    return;
  }
  chequearSesion();
});

document.getElementById("btn-logout").addEventListener("click", async () => {
  await supabase.auth.signOut();
  chequearSesion();
});

// ---------- Tabs ----------
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("activo"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("activo"));
    tab.classList.add("activo");
    document.getElementById(tab.dataset.panel).classList.add("activo");
  });
});

function iniciarPanel() {
  cargarPortadaAdmin();
  cargarFotosAdmin();
  cargarReservas();
  cargarContenidoAdmin();
}

async function subirImagenStorage(archivo) {
  const extension = archivo.name.includes(".") ? archivo.name.slice(archivo.name.lastIndexOf(".")) : "";
  const nombreArchivo = `${Date.now()}${extension.toLowerCase().replace(/[^a-z0-9.]/g, "")}`;
  const { error: uploadError } = await supabase.storage
    .from("fotos")
    .upload(nombreArchivo, archivo, {
      contentType: archivo.type || "image/jpeg",
      upsert: false,
    });
  if (uploadError) return { error: uploadError };
  const { data: urlData } = supabase.storage.from("fotos").getPublicUrl(nombreArchivo);
  return { url: urlData.publicUrl };
}

// ================= PORTADA =================
async function cargarPortadaAdmin() {
  const preview = document.getElementById("portada-preview");
  const { data } = await supabase.from("contenido").select("valor").eq("clave", "portada").maybeSingle();
  if (data?.valor) {
    preview.innerHTML = `<img src="${data.valor}" alt="Portada actual" style="max-width:320px; border:1px solid var(--linea);">`;
  } else {
    preview.innerHTML = `<p style="font-size:12px; color:var(--tinta-suave);">Todavía no hay foto de portada.</p>`;
  }
}

document.getElementById("btn-subir-portada").addEventListener("click", async () => {
  const archivoInput = document.getElementById("portada-archivo");
  const msg = document.getElementById("portada-msg");
  const archivo = archivoInput.files[0];
  if (!archivo) { msg.textContent = "Elegí una imagen primero."; return; }

  msg.textContent = "Subiendo...";
  const { url, error: uploadError } = await subirImagenStorage(archivo);
  if (uploadError) {
    msg.textContent = `Error al subir: ${uploadError.message}`;
    console.error(uploadError);
    return;
  }

  const { error: saveError } = await supabase
    .from("contenido")
    .upsert({ clave: "portada", valor: url, actualizado_en: new Date().toISOString() });

  if (saveError) {
    msg.textContent = `Error al guardar: ${saveError.message}`;
    console.error(saveError);
    return;
  }

  msg.textContent = "Portada actualizada.";
  archivoInput.value = "";
  cargarPortadaAdmin();
});

// ================= FOTOS =================
async function cargarFotosAdmin() {
  const grid = document.getElementById("foto-admin-grid");
  const { data, error } = await supabase.from("fotos").select("*").order("orden");
  if (error || !data) { grid.innerHTML = ""; return; }

  grid.innerHTML = data.map(f => `
    <div class="foto-admin-card">
      <img src="${f.url}" alt="${f.titulo || ''}">
      <div class="fa-info">${f.titulo || "(sin título)"} — ${f.categoria}</div>
      <button data-id="${f.id}" class="btn-borrar-foto">Eliminar</button>
    </div>
  `).join("");

  document.querySelectorAll(".btn-borrar-foto").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar esta foto?")) return;
      await supabase.from("fotos").delete().eq("id", btn.dataset.id);
      cargarFotosAdmin();
    });
  });
}

document.getElementById("btn-subir-foto").addEventListener("click", async () => {
  const archivoInput = document.getElementById("foto-archivo");
  const titulo = document.getElementById("foto-titulo").value.trim();
  const categoria = document.getElementById("foto-categoria").value;
  const msg = document.getElementById("subida-msg");

  const archivo = archivoInput.files[0];
  if (!archivo) { msg.textContent = "Elegí un archivo primero."; return; }

  msg.textContent = "Subiendo...";

  const { url, error: uploadError } = await subirImagenStorage(archivo);
  if (uploadError) {
    msg.textContent = `Error al subir la imagen: ${uploadError.message}`;
    console.error(uploadError);
    return;
  }

  const { error: insertError } = await supabase.from("fotos").insert({
    url,
    titulo: titulo || null,
    categoria,
  });

  if (insertError) {
    msg.textContent = `Error al guardar en la base de datos: ${insertError.message}`;
    console.error(insertError);
    return;
  }

  msg.textContent = "Foto subida correctamente.";
  archivoInput.value = "";
  document.getElementById("foto-titulo").value = "";
  cargarFotosAdmin();
});

// ================= RESERVAS =================
async function cargarReservas() {
  const tbody = document.getElementById("tabla-reservas");
  const { data, error } = await supabase
    .from("reservas")
    .select("*")
    .order("creado_en", { ascending: false });

  if (error || !data) { tbody.innerHTML = ""; return; }

  tbody.innerHTML = data.map(r => `
    <tr>
      <td>${r.tipo === "institucion" ? "Institución" : "Particular"}</td>
      <td>${r.nombre}${r.tipo === "institucion" && r.contacto_nombre ? `<br><small>${r.contacto_nombre}</small>` : ""}</td>
      <td>${r.telefono}${r.email ? `<br><small>${r.email}</small>` : ""}</td>
      <td>${r.fecha_propuesta || "-"} ${r.horario || ""}</td>
      <td>${r.cantidad_personas}</td>
      <td>
        <select class="estado-select" data-id="${r.id}">
          <option value="pendiente" ${r.estado === "pendiente" ? "selected" : ""}>Pendiente</option>
          <option value="confirmada" ${r.estado === "confirmada" ? "selected" : ""}>Confirmada</option>
          <option value="rechazada" ${r.estado === "rechazada" ? "selected" : ""}>Rechazada</option>
        </select>
      </td>
    </tr>
  `).join("");

  document.querySelectorAll(".estado-select").forEach(sel => {
    sel.addEventListener("change", async () => {
      await supabase.from("reservas").update({ estado: sel.value }).eq("id", sel.dataset.id);
      cargarReservas();
    });
  });
}

// ================= CONTENIDO =================
const ETIQUETAS = {
  biografia: "Biografía / historia (separá párrafos con una línea en blanco)",
  cita_destacada: "Cita destacada del inicio",
  direccion: "Dirección",
  telefono: "Teléfono",
  email: "Email",
  horarios: "Horarios de visita",
};

async function cargarContenidoAdmin() {
  const panel = document.getElementById("panel-contenido");
  const { data, error } = await supabase.from("contenido").select("*");
  if (error || !data) { panel.innerHTML = ""; return; }

  panel.innerHTML = data.filter(c => c.clave !== "portada").map(c => `
    <div class="contenido-item">
      <label for="c-${c.clave}">${ETIQUETAS[c.clave] || c.clave}</label>
      <textarea class="contenido-textarea" id="c-${c.clave}">${c.valor}</textarea>
      <button class="btn-sm" data-clave="${c.clave}">Guardar</button>
    </div>
  `).join("");

  panel.querySelectorAll(".btn-sm").forEach(btn => {
    btn.addEventListener("click", async () => {
      const clave = btn.dataset.clave;
      const valor = document.getElementById(`c-${clave}`).value;
      btn.textContent = "Guardando...";
      await supabase.from("contenido").update({ valor, actualizado_en: new Date().toISOString() }).eq("clave", clave);
      btn.textContent = "Guardado ✓";
      setTimeout(() => { btn.textContent = "Guardar"; }, 1500);
    });
  });
}

chequearSesion();
