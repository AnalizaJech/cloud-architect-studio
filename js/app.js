import { catalogById } from "./modules/catalog.js";
import {
  createDocument,
  createId,
  normalizeDocument,
  autoLayout,
  sampleDocument,
} from "./modules/document.js";
import { History } from "./services/history.js";
import { loadDocument, saveDocument } from "./services/storage.js";
import { exportDocument } from "./services/export.js";
import { renderPalette } from "./components/palette.js";
import { renderScene } from "./components/scene.js";
import { registerShortcuts } from "./hooks/shortcuts.js";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  nodeHeight,
  nodeWidth,
  nodeColor,
} from "./modules/geometry.js";
import { createIcon, hydrateIcons } from "./components/icons.js";

const $ = (id) => document.getElementById(id);
let doc = createDocument(),
  history = new History(doc),
  selected = null,
  tool = "select",
  connectFrom = null,
  gridVisible = true,
  snap = true;
const viewport = { x: 80, y: 80, scale: 1 };
const canvas = $("canvas");
let pointer = null,
  saveTimer = null,
  interacted = false;
let viewportMode = "fit";
const sceneHandlers = { select, nodeDown, nodeKey, contextMenu };
let sceneFrame = 0;

/** Coalesce pointer-driven redraws to one scene update per animation frame. */
function scheduleSceneRender() {
  if (sceneFrame) return;
  sceneFrame = requestAnimationFrame(() => {
    sceneFrame = 0;
    syncGrid();
    renderScene(doc, selected, viewport, sceneHandlers);
  });
}

/** Keep the CSS dot grid aligned to logical diagram coordinates. */
function syncGrid() {
  canvas.style.backgroundSize = `${24 * viewport.scale}px ${24 * viewport.scale}px`;
  canvas.style.backgroundPosition = `${viewport.x}px ${viewport.y}px`;
}

/** Announce transient feedback without blocking editing. */
function toast(message) {
  const item = document.createElement("div");
  item.className = "toast";
  item.textContent = message;
  $("toast-region").append(item);
  setTimeout(() => item.remove(), 3200);
}

/** Offer a reload when a newer offline shell takes control during editing. */
function updateToast() {
  const item = document.createElement("div");
  item.className = "toast update-toast";
  const label = document.createElement("span");
  label.textContent = "Nueva versión disponible";
  const button = document.createElement("button");
  button.textContent = "Actualizar";
  button.onclick = () => location.reload();
  item.append(label, button);
  $("toast-region").append(item);
}
/** Convert a pointer position to logical document coordinates. */
function world(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left - viewport.x) / viewport.scale,
    y: (clientY - rect.top - viewport.y) / viewport.scale,
  };
}
const snapped = (value) => (snap ? Math.round(value / 24) * 24 : value);

/** Render all document dependent presentation. */
function render() {
  syncGrid();
  renderScene(doc, selected, viewport, sceneHandlers);
  $("empty-state").hidden = doc.nodes.length > 0;
  $("title").value = doc.title;
  $("undo-btn").disabled = !history.canUndo;
  $("redo-btn").disabled = !history.canRedo;
  $("zoom-label").textContent = `${Math.round(viewport.scale * 100)}%`;
  $("canvas-status").textContent =
    `${doc.nodes.length} componentes · ${doc.edges.length} conexiones`;
  renderInspector();
}
function commit() {
  interacted = true;
  history.push(doc);
  $("save-status").textContent = "Guardando…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await saveDocument(doc);
      $("save-status").textContent = "Guardado";
    } catch {
      $("save-status").textContent = "Sin guardar";
      toast("No se pudo guardar el diagrama");
    }
  }, 450);
  render();
}
function setDocument(value) {
  doc = value;
  selected = null;
  connectFrom = null;
  history = new History(doc);
  commit();
  if (canvas.clientWidth < 700 && doc.nodes.length) focusFirst();
  else fit();
}
function select(id) {
  selected = id;
  render();
  if (id && matchMedia("(max-width:1050px)").matches)
    $("inspector").classList.add("open");
}
function addNode(type, point) {
  const meta = catalogById.get(type);
  if (!meta) return;
  const center =
    point ??
    world(
      canvas.getBoundingClientRect().left + canvas.clientWidth / 2,
      canvas.getBoundingClientRect().top + canvas.clientHeight / 2,
    );
  const node = {
    id: createId(),
    type,
    label: meta.label,
    x: snapped(center.x - DEFAULT_WIDTH / 2),
    y: snapped(center.y - DEFAULT_HEIGHT / 2),
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    color: meta.color,
    variant: "card",
  };
  doc.nodes.push(node);
  selected = node.id;
  commit();
  $("sidebar").classList.remove("open");
  toast(`${meta.label} añadido`);
}
function deleteSelected() {
  if (!selected) return;
  if (doc.nodes.some((n) => n.id === selected)) {
    doc.nodes = doc.nodes.filter((n) => n.id !== selected);
    doc.edges = doc.edges.filter(
      (e) => e.from !== selected && e.to !== selected,
    );
  } else doc.edges = doc.edges.filter((e) => e.id !== selected);
  selected = null;
  commit();
}
/** Clone a selected component with a small visible offset. */
function duplicateSelected(id = selected) {
  const source = doc.nodes.find((node) => node.id === id);
  if (!source) return;
  const copy = {
    ...source,
    id: createId(),
    x: source.x + 32,
    y: source.y + 32,
  };
  doc.nodes.push(copy);
  selected = copy.id;
  commit();
  toast("Componente duplicado");
}
function undo() {
  doc = history.undo();
  selected = null;
  render();
  saveDocument(doc);
}
function redo() {
  doc = history.redo();
  selected = null;
  render();
  saveDocument(doc);
}
function setTool(next) {
  tool = next;
  connectFrom = null;
  canvas.classList.toggle("hand", tool === "hand");
  canvas.classList.toggle("connect", tool === "connect");
  for (const name of ["select", "hand", "connect"]) {
    const button = $(`${name}-tool`);
    button.classList.toggle("active", next === name);
    button.setAttribute("aria-pressed", String(next === name));
  }
  toast(
    next === "connect"
      ? "Selecciona dos componentes para conectarlos"
      : next === "hand"
        ? "Arrastra el lienzo para moverlo"
        : "Herramienta de selección",
  );
}

/** Start node drag or complete a connection in connect mode. */
function connectNode(id) {
  if (connectFrom && connectFrom !== id) {
    if (!doc.edges.some((e) => e.from === connectFrom && e.to === id)) {
      doc.edges.push({ id: createId(), from: connectFrom, to: id });
      commit();
      toast("Conexión creada");
    }
    connectFrom = null;
    select(id);
  } else {
    connectFrom = id;
    select(id);
    toast("Selecciona el componente de destino");
  }
}
function nodeDown(event, id) {
  if (event.button !== 0) return;
  event.preventDefault();
  if (tool === "connect") {
    connectNode(id);
    return;
  }
  if (tool === "hand") {
    pointer = {
      kind: "pan",
      x: event.clientX,
      y: event.clientY,
      originX: viewport.x,
      originY: viewport.y,
    };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("dragging");
    return;
  }
  selected = id;
  const node = doc.nodes.find((n) => n.id === id),
    start = world(event.clientX, event.clientY);
  pointer = {
    kind: "node",
    id,
    originX: node.x,
    originY: node.y,
    startX: start.x,
    startY: start.y,
    moved: false,
  };
  canvas.setPointerCapture(event.pointerId);
  render();
}
/** Select and move nodes without a pointing device. */
function nodeKey(event, id) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    tool === "connect" ? connectNode(id) : select(id);
    document.querySelector(`[data-node="${CSS.escape(id)}"]`)?.focus();
    return;
  }
  const moves = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  };
  if (!moves[event.key]) return;
  event.preventDefault();
  const node = doc.nodes.find((item) => item.id === id),
    step = event.shiftKey ? 24 : 8;
  node.x += moves[event.key][0] * step;
  node.y += moves[event.key][1] * step;
  selected = id;
  commit();
  document.querySelector(`[data-node="${CSS.escape(id)}"]`)?.focus();
}
/** Small node context menu for duplicate, connect and delete actions. */
function contextMenu(event, id) {
  event.preventDefault();
  selected = id;
  render();
  const menu = $("context-menu");
  menu.replaceChildren();
  for (const [label, iconName, action] of [
    ["Duplicar", "copy", () => duplicateSelected(id)],
    [
      "Conectar desde aquí",
      "connect",
      () => {
        setTool("connect");
        connectFrom = id;
        select(id);
      },
    ],
    ["Eliminar", "trash", deleteSelected],
  ]) {
    const button = document.createElement("button");
    button.type = "button";
    button.role = "menuitem";
    button.append(createIcon(iconName, 16), document.createTextNode(label));
    button.onclick = () => {
      menu.hidden = true;
      action();
    };
    menu.append(button);
  }
  menu.hidden = false;
  menu.style.left = `${Math.min(event.clientX, innerWidth - 190)}px`;
  menu.style.top = `${Math.min(event.clientY, innerHeight - 130)}px`;
  menu.querySelector("button")?.focus();
}
canvas.addEventListener("pointerdown", (event) => {
  // Interactive overlays keep their own pointer sequence and click target.
  if (event.target.closest?.(".node,.edge,.empty-state,.canvas-bottom,button"))
    return;
  if (event.button !== 0 && event.button !== 1) return;
  const pan = tool === "hand" || event.button === 1 || event.shiftKey;
  pointer = pan
    ? {
        kind: "pan",
        x: event.clientX,
        y: event.clientY,
        originX: viewport.x,
        originY: viewport.y,
      }
    : { kind: "background" };
  canvas.setPointerCapture(event.pointerId);
  if (!pan) select(null);
  else canvas.classList.add("dragging");
});
canvas.addEventListener("pointermove", (event) => {
  if (!pointer) return;
  if (pointer.kind === "pan") {
    viewportMode = "manual";
    viewport.x = pointer.originX + event.clientX - pointer.x;
    viewport.y = pointer.originY + event.clientY - pointer.y;
    scheduleSceneRender();
  } else if (pointer.kind === "node") {
    const node = doc.nodes.find((n) => n.id === pointer.id);
    if (!node) return;
    const pos = world(event.clientX, event.clientY);
    node.x = snapped(pointer.originX + pos.x - pointer.startX);
    node.y = snapped(pointer.originY + pos.y - pointer.startY);
    pointer.moved = true;
    scheduleSceneRender();
  }
});
canvas.addEventListener("pointerup", () => {
  if (pointer?.kind === "node" && pointer.moved) commit();
  pointer = null;
  canvas.classList.remove("dragging");
});
canvas.addEventListener("dragover", (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
});
canvas.addEventListener("drop", (event) => {
  event.preventDefault();
  addNode(
    event.dataTransfer.getData("text/plain"),
    world(event.clientX, event.clientY),
  );
});
canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    viewportMode = "manual";
    const rect = canvas.getBoundingClientRect(),
      x = event.clientX - rect.left,
      y = event.clientY - rect.top,
      old = viewport.scale;
    viewport.scale = Math.max(
      0.02,
      Math.min(32, old * (event.deltaY < 0 ? 1.1 : 1 / 1.1)),
    );
    viewport.x = x - ((x - viewport.x) * viewport.scale) / old;
    viewport.y = y - ((y - viewport.y) * viewport.scale) / old;
    render();
  },
  { passive: false },
);

function zoom(factor) {
  viewportMode = "manual";
  const old = viewport.scale,
    x = canvas.clientWidth / 2,
    y = canvas.clientHeight / 2;
  viewport.scale = Math.max(0.02, Math.min(32, old * factor));
  viewport.x = x - ((x - viewport.x) * viewport.scale) / old;
  viewport.y = y - ((y - viewport.y) * viewport.scale) / old;
  render();
}
function fit() {
  viewportMode = "fit";
  if (!doc.nodes.length) {
    viewport.x = 80;
    viewport.y = 80;
    viewport.scale = 1;
    render();
    return;
  }
  const minX = Math.min(...doc.nodes.map((n) => n.x)),
    minY = Math.min(...doc.nodes.map((n) => n.y)),
    maxX = Math.max(...doc.nodes.map((n) => n.x + nodeWidth(n))),
    maxY = Math.max(...doc.nodes.map((n) => n.y + nodeHeight(n)));
  viewport.scale = Math.max(
    0.1,
    Math.min(
      1.5,
      Math.min(
        (canvas.clientWidth - 100) / (maxX - minX),
        (canvas.clientHeight - 100) / (maxY - minY),
      ),
    ),
  );
  viewport.x =
    (canvas.clientWidth - (maxX - minX) * viewport.scale) / 2 -
    minX * viewport.scale;
  viewport.y =
    (canvas.clientHeight - (maxY - minY) * viewport.scale) / 2 -
    minY * viewport.scale;
  render();
}

/** Open a diagram at a readable scale on narrow screens. Fit remains available. */
function focusFirst() {
  viewportMode = "focus";
  const node = doc.nodes[0];
  if (!node) return fit();
  viewport.scale = Math.min(1, canvas.clientWidth / (nodeWidth(node) + 80));
  viewport.x = 24 - node.x * viewport.scale;
  viewport.y =
    (canvas.clientHeight - nodeHeight(node) * viewport.scale) / 2 -
    node.y * viewport.scale;
  render();
}

/** Build property controls with safe DOM text assignment. */
function renderInspector() {
  const root = $("inspector-content");
  root.replaceChildren();
  if (!selected) {
    const empty = document.createElement("div");
    empty.className = "inspector-empty";
    const icon = document.createElement("span");
    icon.append(createIcon("cursor", 36));
    const heading = document.createElement("h2");
    heading.textContent = "Sin selección";
    const description = document.createElement("p");
    description.textContent =
      "Selecciona un componente para editar sus propiedades.";
    empty.append(icon, heading, description);
    root.append(empty);
    return;
  }
  const node = doc.nodes.find((n) => n.id === selected);
  if (!node) {
    const section = document.createElement("div");
    section.className = "inspector-section";
    const heading = document.createElement("h3");
    heading.textContent = "Conexión";
    const edge = doc.edges.find((item) => item.id === selected);
    if (edge) {
      const source = doc.nodes.find((item) => item.id === edge.from);
      const target = doc.nodes.find((item) => item.id === edge.to);
      const detail = document.createElement("p");
      detail.className = "inspector-description";
      detail.textContent = `${source?.label ?? "Origen"} → ${target?.label ?? "Destino"}`;
      section.append(heading, detail);
    } else section.append(heading);
    const remove = document.createElement("button");
    remove.className = "danger";
    remove.append(createIcon("trash", 16));
    remove.append(document.createTextNode("Eliminar conexión"));
    remove.onclick = deleteSelected;
    section.append(remove);
    root.append(section);
    return;
  }
  const meta = catalogById.get(node.type);
  const summary = document.createElement("div");
  summary.className = "inspector-summary";
  summary.style.setProperty("--node-color", nodeColor(node, meta.color));
  const icon = document.createElement("span");
  icon.className = "inspector-summary-icon";
  icon.append(createIcon(meta.icon, 24));
  const summaryText = document.createElement("span");
  const summaryName = document.createElement("strong");
  summaryName.textContent = node.label;
  const summaryGroup = document.createElement("small");
  summaryGroup.textContent = meta.group;
  summaryText.append(summaryName, summaryGroup);
  summary.append(icon, summaryText);
  root.append(summary);

  const makeField = (label, value, onChange, type = "text") => {
    const wrapper = document.createElement("label");
    wrapper.className = "field";
    wrapper.textContent = label;
    const input = document.createElement("input");
    input.type = type;
    input.value = value;
    input.addEventListener("change", () => onChange(input.value));
    wrapper.append(input);
    return wrapper;
  };

  const identity = document.createElement("section");
  identity.className = "inspector-section";
  const identityHeading = document.createElement("h3");
  identityHeading.textContent = "Identidad";
  identity.append(identityHeading);
  identity.append(
    makeField("Nombre", node.label, (value) => {
      node.label = value.trim().slice(0, 80) || meta.label;
      commit();
    }),
  );
  root.append(identity);

  const geometry = document.createElement("section");
  geometry.className = "inspector-section";
  const geometryHeading = document.createElement("h3");
  geometryHeading.textContent = "Tamaño y posición";
  geometry.append(geometryHeading);
  const position = document.createElement("div");
  position.className = "field-row";
  position.append(
    makeField(
      "X",
      Math.round(node.x),
      (value) => {
        node.x = Number(value) || 0;
        commit();
      },
      "number",
    ),
    makeField(
      "Y",
      Math.round(node.y),
      (value) => {
        node.y = Number(value) || 0;
        commit();
      },
      "number",
    ),
  );
  geometry.append(position);
  const size = document.createElement("div");
  size.className = "field-row";
  size.append(
    makeField(
      "Ancho",
      nodeWidth(node),
      (value) => {
        node.width = Math.max(
          160,
          Math.min(420, Number(value) || DEFAULT_WIDTH),
        );
        commit();
      },
      "number",
    ),
    makeField(
      "Alto",
      nodeHeight(node),
      (value) => {
        node.height = Math.max(
          72,
          Math.min(220, Number(value) || DEFAULT_HEIGHT),
        );
        commit();
      },
      "number",
    ),
  );
  geometry.append(size);
  const resetSize = document.createElement("button");
  resetSize.className = "inspector-link";
  resetSize.textContent = "Restablecer tamaño";
  resetSize.onclick = () => {
    node.width = DEFAULT_WIDTH;
    node.height = DEFAULT_HEIGHT;
    commit();
  };
  geometry.append(resetSize);
  root.append(geometry);

  const appearance = document.createElement("section");
  appearance.className = "inspector-section";
  const appearanceHeading = document.createElement("h3");
  appearanceHeading.textContent = "Apariencia";
  appearance.append(appearanceHeading);
  const colorLabel = document.createElement("p");
  colorLabel.className = "field";
  colorLabel.textContent = "Color de acento";
  appearance.append(colorLabel);
  const swatches = document.createElement("div");
  swatches.className = "color-swatches";
  for (const [label, color] of [
    ["Proveedor", meta.color],
    ["Lima", "#d8fb75"],
    ["Azul", "#64b5f6"],
    ["Coral", "#ff8f72"],
    ["Violeta", "#b39afa"],
    ["Turquesa", "#67d9ca"],
  ]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "color-swatch";
    button.style.setProperty("--swatch", color);
    button.setAttribute("aria-label", `Color ${label}`);
    button.title = label;
    button.setAttribute(
      "aria-pressed",
      String(nodeColor(node, meta.color) === color),
    );
    if (nodeColor(node, meta.color) === color)
      button.append(createIcon("check", 13));
    button.onclick = () => {
      node.color = color;
      commit();
    };
    swatches.append(button);
  }
  appearance.append(swatches);
  const variantLabel = document.createElement("p");
  variantLabel.className = "field";
  variantLabel.textContent = "Estilo";
  appearance.append(variantLabel);
  const variants = document.createElement("div");
  variants.className = "variant-options";
  for (const [value, label] of [
    ["card", "Tarjeta"],
    ["outline", "Contorno"],
  ]) {
    const button = document.createElement("button");
    button.textContent = label;
    button.setAttribute(
      "aria-pressed",
      String((node.variant || "card") === value),
    );
    button.onclick = () => {
      node.variant = value;
      commit();
    };
    variants.append(button);
  }
  appearance.append(variants);
  root.append(appearance);

  const section = document.createElement("section");
  section.className = "inspector-section";
  const duplicate = document.createElement("button");
  duplicate.className = "inspector-action";
  duplicate.append(createIcon("copy", 16));
  duplicate.append(document.createTextNode("Duplicar componente"));
  duplicate.onclick = () => duplicateSelected(node.id);
  section.append(duplicate);
  const remove = document.createElement("button");
  remove.className = "danger";
  remove.append(createIcon("trash", 16));
  remove.append(document.createTextNode("Eliminar componente"));
  remove.onclick = deleteSelected;
  section.append(remove);
  root.append(section);
}

function showDialog(content) {
  const dialog = $("dialog"),
    root = $("dialog-content");
  root.replaceChildren();
  root.append(content);
  dialog.showModal();
}
function exportDialog() {
  const box = document.createElement("div"),
    title = document.createElement("h2"),
    intro = document.createElement("p"),
    options = document.createElement("div");
  title.textContent = "Exportar diagrama";
  intro.textContent = "Elige un formato. Todo se genera en tu navegador.";
  options.className = "export-options";
  for (const [format, label, iconName] of [
    ["png", "PNG · imagen", "download"],
    ["svg", "SVG · vector", "layout"],
    ["pdf", "PDF · imprimir", "documentDb"],
    ["drawio", "Draw.io · XML", "workflow"],
    ["mermaid", "Mermaid · código", "connect"],
    ["plantuml", "PlantUML · código", "blocks"],
    ["json", "JSON · proyecto", "documentDb"],
  ]) {
    const button = document.createElement("button");
    button.append(createIcon(iconName, 18), document.createTextNode(label));
    button.onclick = async () => {
      try {
        await exportDocument(doc, format);
        $("dialog").close();
        toast(
          format === "pdf"
            ? "Usa Guardar como PDF en el diálogo de impresión"
            : "Exportación lista",
        );
      } catch {
        toast("No se pudo exportar este formato");
      }
    };
    options.append(button);
  }
  box.append(title, intro, options);
  showDialog(box);
}
function confirmNew() {
  const box = document.createElement("div"),
    title = document.createElement("h2"),
    intro = document.createElement("p"),
    actions = document.createElement("div"),
    cancel = document.createElement("button"),
    accept = document.createElement("button");
  title.textContent = "¿Crear diagrama nuevo?";
  intro.textContent =
    "El diagrama actual se reemplazará. Exporta JSON si quieres conservar una copia.";
  actions.className = "dialog-actions";
  cancel.className = "button ghost";
  cancel.textContent = "Cancelar";
  cancel.onclick = () => $("dialog").close();
  accept.className = "button primary";
  accept.textContent = "Crear nuevo";
  accept.onclick = () => {
    $("dialog").close();
    setDocument(createDocument());
    toast("Diagrama nuevo creado");
  };
  actions.append(cancel, accept);
  box.append(title, intro, actions);
  showDialog(box);
}
function helpDialog() {
  const box = document.createElement("div"),
    title = document.createElement("h2"),
    list = document.createElement("div");
  title.textContent = "Atajos de teclado";
  list.className = "shortcut-list";
  for (const [action, key] of [
    ["Seleccionar", "V"],
    ["Mover lienzo", "H"],
    ["Conectar", "C"],
    ["Mostrar grid", "G"],
    ["Buscar", "/"],
    ["Deshacer", "Ctrl + Z"],
    ["Rehacer", "Ctrl + Shift + Z"],
    ["Guardar JSON", "Ctrl + S"],
    ["Duplicar", "Ctrl + D"],
    ["Eliminar", "Supr"],
    ["Zoom", "+ / −"],
  ]) {
    const label = document.createElement("span"),
      kbd = document.createElement("kbd");
    label.textContent = action;
    kbd.textContent = key;
    list.append(label, kbd);
  }
  box.append(title, list);
  showDialog(box);
}
document.addEventListener("pointerdown", (event) => {
  if (!event.target.closest?.("#context-menu")) $("context-menu").hidden = true;
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") $("context-menu").hidden = true;
});

/** Wire controls and restore local data. */
async function init() {
  hydrateIcons();
  renderPalette($("palette"), "", addNode);
  $("search").addEventListener("input", (event) =>
    renderPalette($("palette"), event.target.value, addNode),
  );
  $("title").addEventListener("change", (event) => {
    doc.title =
      event.target.value.trim().slice(0, 80) || "Arquitectura sin título";
    commit();
  });
  $("new-btn").onclick = confirmNew;
  $("export-btn").onclick = exportDialog;
  $("help-btn").onclick = helpDialog;
  $("sample-btn").onclick = () => {
    setDocument(sampleDocument());
    toast("Ejemplo cargado");
  };
  $("import-btn").onclick = () => $("file-input").click();
  $("file-input").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw Error("Archivo demasiado grande");
      setDocument(normalizeDocument(JSON.parse(await file.text())));
      toast("Diagrama importado");
    } catch (error) {
      toast(error.message || "Archivo no válido");
    }
    event.target.value = "";
  });
  $("undo-btn").onclick = undo;
  $("redo-btn").onclick = redo;
  $("layout-btn").onclick = () => {
    if (!doc.nodes.length) return;
    doc = autoLayout(doc);
    commit();
    fit();
    toast("Diagrama organizado");
  };
  $("grid-btn").onclick = () => {
    gridVisible = !gridVisible;
    canvas.classList.toggle("show-grid", gridVisible);
    $("grid-btn").classList.toggle("active", gridVisible);
    $("grid-btn").setAttribute("aria-pressed", String(gridVisible));
  };
  $("snap-btn").onclick = () => {
    snap = !snap;
    $("snap-btn").classList.toggle("active", snap);
    $("snap-btn").setAttribute("aria-pressed", String(snap));
  };
  for (const name of ["select", "hand", "connect"])
    $(`${name}-tool`).onclick = () => setTool(name);
  $("zoom-in").onclick = () => zoom(1.2);
  $("zoom-out").onclick = () => zoom(1 / 1.2);
  $("zoom-label").onclick = () => zoom(1 / viewport.scale);
  $("fit-btn").onclick = fit;
  $("sidebar-toggle").onclick = () => $("sidebar").classList.add("open");
  $("sidebar-close").onclick = () => $("sidebar").classList.remove("open");
  $("inspector-close").onclick = () => $("inspector").classList.remove("open");
  $("dialog").addEventListener("click", (event) => {
    if (event.target === $("dialog")) $("dialog").close();
  });
  registerShortcuts({
    undo,
    redo,
    newDocument: confirmNew,
    exportJson: () => exportDocument(doc, "json"),
    deleteSelected,
    duplicateSelected,
    escape: () => {
      selected = null;
      connectFrom = null;
      $("dialog").close();
      render();
    },
    tool: setTool,
    grid: () => $("grid-btn").click(),
    search: () => $("search").focus(),
    zoom,
  });
  try {
    const saved = await loadDocument();
    if (saved && !interacted) {
      doc = normalizeDocument(saved);
      history = new History(doc);
    }
  } catch {
    toast("No se pudo recuperar el último diagrama");
  }
  render();
  if (doc.nodes.length)
    requestAnimationFrame(() =>
      canvas.clientWidth < 700 ? focusFirst() : fit(),
    );
  new ResizeObserver(() => {
    if (!doc.nodes.length || viewportMode === "manual") return;
    viewportMode === "focus" && canvas.clientWidth < 700 ? focusFirst() : fit();
  }).observe(canvas);
  if ("serviceWorker" in navigator) {
    let hadController = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (hadController) {
        if (interacted) updateToast();
        else location.reload();
      }
      hadController = true;
    });
    window.addEventListener("load", () =>
      navigator.serviceWorker
        .register("./sw.js", { updateViaCache: "none" })
        .catch(() => {}),
    );
  }
}
init();
