import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  Handle,
  MarkerType,
  Position,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import {
  AlignCenter,
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  ChevronDown,
  CircleHelp,
  Command,
  Copy,
  Download,
  FileJson,
  FilePlus2,
  Focus,
  Grid3X3,
  Hand,
  LayoutGrid,
  Link2,
  Menu,
  Minus,
  MousePointer2,
  Plus,
  Redo2,
  RotateCcw,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import {
  catalogById,
  createId,
  emptyDocument,
  exampleDocument,
  exportDocument,
  safeDocument,
  type CatalogItem,
  type DiagramDocument,
  type DiagramNode,
  type DiagramEdge,
} from "./model";
import { useDiagram } from "./hooks/useDiagram";
import { preferredPorts } from "../js/modules/geometry.js";

type CloudData = { item: DiagramNode; meta: CatalogItem } & Record<
  string,
  unknown
>;
type CloudFlowNode = Node<CloudData, "cloud">;
type Tool = "select" | "hand" | "connect";
const entries = [...catalogById.values()] as CatalogItem[];
const groups = [...new Set(entries.map((item) => item.group))];
const colors = [
  "#d8fb75",
  "#ff9900",
  "#35a6ef",
  "#7195e4",
  "#ef7b4d",
  "#a77bea",
  "#6fd4c7",
];
const exportFormats = [
  ["png", "Imagen PNG", "Alta resolución"],
  ["svg", "Vector SVG", "Editable y escalable"],
  ["pdf", "Documento PDF", "Impresión del navegador"],
  ["drawio", "Draw.io", "Archivo editable"],
  ["mermaid", "Mermaid", "Código de diagrama"],
  ["plantuml", "PlantUML", "Código de diagrama"],
  ["json", "Proyecto JSON", "Copia editable"],
] as const;

/** Locally hosted service artwork remains available offline and on GitHub Pages. */
function TechnologyIcon({ id, size = 24 }: { id: string; size?: number }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}icons/technologies/${id}.svg`}
      width={size}
      height={size}
      alt=""
      draggable={false}
      decoding="async"
    />
  );
}

function CloudNode({ data, selected }: NodeProps<CloudFlowNode>) {
  const { item, meta } = data;
  return (
    <div
      className={`cloud-node ${selected ? "is-selected" : ""} ${item.variant === "outline" ? "is-outline" : ""}`}
      style={
        {
          width: item.width,
          height: item.height,
          "--node-accent": item.color,
        } as React.CSSProperties
      }
    >
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        className="node-handle"
        title="Conectar por la izquierda"
        aria-label="Conectar por la izquierda"
      />
      <Handle
        id="top"
        type="source"
        position={Position.Top}
        className="node-handle"
        title="Conectar por arriba"
        aria-label="Conectar por arriba"
      />
      <div className={`cloud-node-icon technology-${meta.id}`}>
        <TechnologyIcon id={meta.id} size={34} />
      </div>
      <div className="cloud-node-copy">
        <strong title={item.label}>{item.label}</strong>
        <span>{meta.group}</span>
      </div>
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="node-handle"
        title="Conectar por la derecha"
        aria-label="Conectar por la derecha"
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="node-handle"
        title="Conectar por abajo"
        aria-label="Conectar por abajo"
      />
    </div>
  );
}
const nodeTypes = { cloud: CloudNode };
type Port = NonNullable<DiagramEdge["fromHandle"]>;
const validPort = (value: string | null): Port | undefined =>
  value === "left" || value === "right" || value === "top" || value === "bottom"
    ? value
    : undefined;

function IconButton({
  icon: Icon,
  label,
  onClick,
  active = false,
  disabled = false,
  className = "",
}: {
  icon: typeof Search;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`icon-button ${active ? "is-active" : ""} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active || undefined}
    >
      <Icon size={18} strokeWidth={1.8} />
    </button>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const controls = [
        ...dialogRef.current.querySelectorAll<HTMLElement>(
          "button, a[href], input:not([disabled])",
        ),
      ].filter((element) => !element.hasAttribute("disabled"));
      if (!controls.length) return;
      const first = controls[0],
        last = controls[controls.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === dialogRef.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      previousFocus?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">CLOUD ARCHITECT STUDIO</span>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <IconButton icon={X} label="Cerrar" onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

function Studio() {
  const diagram = useDiagram();
  const { document: doc } = diagram;
  const flow = useReactFlow<CloudFlowNode, Edge>();
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tool, setTool] = useState<Tool>("select");
  const [connecting, setConnecting] = useState(false);
  const [grid, setGrid] = useState(true);
  const [snap, setSnap] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [modal, setModal] = useState<"export" | "help" | "new" | null>(null);
  const [zoom, setZoom] = useState(100);
  const [toast, setToast] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialFit = useRef(false);
  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3300);
  }, []);
  const focusDocument = useCallback(
    (next: DiagramDocument) => {
      if (!next.nodes.length) return;
      if (window.innerWidth < 650) {
        const first = next.nodes[0];
        void flow.setCenter(
          first.x + first.width / 2,
          first.y + first.height / 2,
          { zoom: 1, duration: 350 },
        );
      } else void flow.fitView({ padding: 0.22, duration: 350 });
    },
    [flow],
  );
  useEffect(() => {
    if (!diagram.ready || !doc.nodes.length || initialFit.current) return;
    initialFit.current = true;
    requestAnimationFrame(() => focusDocument(doc));
  }, [diagram.ready, doc.nodes.length, focusDocument]);

  const nodes = useMemo<CloudFlowNode[]>(
    () =>
      doc.nodes.map((item) => ({
        id: item.id,
        type: "cloud",
        position: { x: item.x, y: item.y },
        data: { item, meta: catalogById.get(item.type) as CatalogItem },
        selected: selected === item.id,
        draggable: true,
        selectable: true,
      })),
    [doc.nodes, selected],
  );
  const nodeById = useMemo(
    () => new Map(doc.nodes.map((node) => [node.id, node])),
    [doc.nodes],
  );
  const edges = useMemo<Edge[]>(
    () =>
      doc.edges.map((edge) => {
        const source = nodeById.get(edge.from);
        const target = nodeById.get(edge.to);
        const preferred =
          source && target
            ? preferredPorts(source, target)
            : { source: "right", target: "left" };
        return {
          id: edge.id,
          source: edge.from,
          target: edge.to,
          sourceHandle: edge.fromHandle ?? preferred.source,
          targetHandle: edge.toHandle ?? preferred.target,
          type: "smoothstep",
          selected: selected === edge.id,
          style: {
            stroke: selected === edge.id ? "#d8fb75" : "#71818e",
            strokeWidth: selected === edge.id ? 2.5 : 1.8,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: selected === edge.id ? "#d8fb75" : "#71818e",
          },
        };
      }),
    [doc.edges, nodeById, selected],
  );
  const selectedNode = doc.nodes.find((node) => node.id === selected);
  const selectedEdge = doc.edges.find((edge) => edge.id === selected);

  const add = useCallback(
    (item: CatalogItem, position?: { x: number; y: number }) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      const center =
        position ??
        flow.screenToFlowPosition({
          x: (rect?.left ?? 0) + (rect?.width ?? 600) / 2,
          y: (rect?.top ?? 0) + (rect?.height ?? 400) / 2,
        });
      const id = diagram.addNode(
        item.id,
        snap ? Math.round(center.x / 24) * 24 : center.x,
        snap ? Math.round(center.y / 24) * 24 : center.y,
        item.color,
        item.label,
      );
      setSelected(id);
      setSidebarOpen(false);
      setInspectorOpen(true);
      notify(`${item.label} añadido al lienzo`);
    },
    [diagram.addNode, flow, snap, notify],
  );
  const loadExample = useCallback(() => {
    const next = exampleDocument();
    diagram.replace(next);
    setSelected(null);
    setTimeout(() => focusDocument(next), 50);
    notify("Ejemplo cargado");
  }, [diagram.replace, focusDocument, notify]);
  const deleteSelected = useCallback(() => {
    if (!selected) return;
    diagram.commit({
      ...doc,
      nodes: doc.nodes.filter((node) => node.id !== selected),
      edges: doc.edges.filter(
        (edge) =>
          edge.id !== selected &&
          edge.from !== selected &&
          edge.to !== selected,
      ),
    });
    setSelected(null);
    notify("Elemento eliminado");
  }, [selected, doc, diagram.commit, notify]);
  const duplicate = useCallback(() => {
    if (!selectedNode) return;
    const id = createId();
    diagram.commit({
      ...doc,
      nodes: [
        ...doc.nodes,
        { ...selectedNode, id, x: selectedNode.x + 36, y: selectedNode.y + 36 },
      ],
    });
    setSelected(id);
    notify("Componente duplicado");
  }, [selectedNode, doc, diagram.commit, notify]);
  const importFile = useCallback(
    async (file?: File) => {
      if (!file) return;
      try {
        if (file.size > 2_000_000) throw Error("Archivo demasiado grande");
        const next = safeDocument(JSON.parse(await file.text()));
        diagram.replace(next);
        setSelected(null);
        setTimeout(() => focusDocument(next), 50);
        notify("Diagrama importado");
      } catch (error) {
        notify(error instanceof Error ? error.message : "Archivo no válido");
      }
    },
    [diagram.replace, focusDocument, notify],
  );
  const runExport = useCallback(
    async (format: string) => {
      try {
        await exportDocument(doc, format);
        setModal(null);
        notify(`${format.toUpperCase()} preparado`);
      } catch {
        notify("No se pudo exportar el diagrama");
      }
    },
    [doc, notify],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("input,textarea,[contenteditable=true]") || modal)
        return;
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        event.shiftKey ? diagram.redo() : diagram.undo();
      } else if (mod && event.key.toLowerCase() === "y") {
        event.preventDefault();
        diagram.redo();
      } else if (mod && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicate();
      } else if (mod && event.key.toLowerCase() === "n") {
        event.preventDefault();
        setModal("new");
      } else if (event.key === "/") {
        event.preventDefault();
        setSidebarOpen(true);
        requestAnimationFrame(() => searchRef.current?.focus());
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelected();
      } else if (event.key === "Escape") {
        setSelected(null);
        setTool("select");
        setSidebarOpen(false);
        setInspectorOpen(false);
      } else if (event.key.toLowerCase() === "v") setTool("select");
      else if (event.key.toLowerCase() === "h") setTool("hand");
      else if (event.key.toLowerCase() === "c") setTool("connect");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [diagram.undo, diagram.redo, duplicate, deleteSelected, modal]);

  const palette = (
    <aside
      className={`library ${sidebarOpen ? "is-open" : ""}`}
      aria-label="Biblioteca de componentes"
    >
      <div className="library-heading">
        <div>
          <span className="eyebrow">BIBLIOTECA</span>
          <h2>Componentes</h2>
          <p>Bloques para tu arquitectura</p>
        </div>
        <IconButton
          icon={X}
          label="Cerrar biblioteca"
          onClick={() => setSidebarOpen(false)}
          className="mobile-only"
        />
      </div>
      <label className="search-field">
        <Search size={18} aria-hidden="true" />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar componente"
          aria-label="Buscar componente"
        />
        <kbd>/</kbd>
      </label>
      <div className="library-scroll">
        {groups.map((group) => {
          const items = entries.filter(
            (item) =>
              item.group === group &&
              `${item.label} ${item.id}`
                .toLowerCase()
                .includes(query.toLowerCase()),
          );
          if (!items.length) return null;
          return (
            <details key={group} className="library-group" open>
              <summary>
                <span>{group}</span>
                <span className="group-count">{items.length}</span>
                <ChevronDown size={14} />
              </summary>
              <div className="library-items">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="library-item"
                    onClick={() => add(item)}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData(
                        "application/cloud-component",
                        item.id,
                      );
                      event.dataTransfer.effectAllowed = "copy";
                    }}
                    title={`Añadir ${item.label}`}
                  >
                    <span
                      className={`library-item-icon technology-${item.id}`}
                      style={
                        { "--item-color": item.color } as React.CSSProperties
                      }
                    >
                      <TechnologyIcon id={item.id} size={25} />
                    </span>
                    <span>{item.label}</span>
                    <Plus size={15} className="item-add" />
                  </button>
                ))}
              </div>
            </details>
          );
        })}
        {query &&
          !entries.some((item) =>
            `${item.label} ${item.id}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          ) && <p className="library-empty">No se encontraron componentes.</p>}
      </div>
      <div className="library-foot">
        <span className="online-dot" /> Arrastra o toca para añadir
      </div>
    </aside>
  );

  const inspector = (
    <aside
      className={`inspector ${inspectorOpen ? "is-open" : ""}`}
      aria-label="Propiedades"
    >
      <div className="inspector-top">
        <div>
          <span className="eyebrow">PROPIEDADES</span>
          <h2>Inspector</h2>
        </div>
        <IconButton
          icon={X}
          label="Cerrar inspector"
          onClick={() => setInspectorOpen(false)}
          className="tablet-only"
        />
      </div>
      {selectedNode ? (
        <div className="inspector-scroll">
          <div className="inspector-identity">
            <div
              className={`inspector-symbol technology-${selectedNode.type}`}
              style={
                { "--item-color": selectedNode.color } as React.CSSProperties
              }
            >
              <TechnologyIcon id={selectedNode.type} size={30} />
            </div>
            <div>
              <strong>{selectedNode.label}</strong>
              <span>{catalogById.get(selectedNode.type)?.group}</span>
            </div>
          </div>
          <section className="inspector-section">
            <h3>Identidad</h3>
            <label className="field">
              Nombre
              <input
                value={selectedNode.label}
                maxLength={80}
                onChange={(event) =>
                  diagram.updateNode(selectedNode.id, {
                    label: event.target.value,
                  })
                }
              />
            </label>
          </section>
          <section className="inspector-section">
            <h3>Geometría</h3>
            <div className="field-grid">
              <label className="field">
                Posición X
                <input
                  type="number"
                  value={Math.round(selectedNode.x)}
                  onChange={(event) =>
                    diagram.updateNode(selectedNode.id, {
                      x: Number(event.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="field">
                Posición Y
                <input
                  type="number"
                  value={Math.round(selectedNode.y)}
                  onChange={(event) =>
                    diagram.updateNode(selectedNode.id, {
                      y: Number(event.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="field">
                Ancho
                <input
                  type="number"
                  min="160"
                  max="420"
                  value={selectedNode.width}
                  onChange={(event) =>
                    diagram.updateNode(selectedNode.id, {
                      width: Math.max(
                        160,
                        Math.min(420, Number(event.target.value) || 210),
                      ),
                    })
                  }
                />
              </label>
              <label className="field">
                Alto
                <input
                  type="number"
                  min="72"
                  max="220"
                  value={selectedNode.height}
                  onChange={(event) =>
                    diagram.updateNode(selectedNode.id, {
                      height: Math.max(
                        72,
                        Math.min(220, Number(event.target.value) || 88),
                      ),
                    })
                  }
                />
              </label>
            </div>
            <button
              className="text-action"
              onClick={() =>
                diagram.updateNode(selectedNode.id, { width: 210, height: 88 })
              }
            >
              <RotateCcw size={14} /> Restablecer tamaño
            </button>
          </section>
          <section className="inspector-section">
            <h3>Apariencia</h3>
            <span className="field-caption">Color de acento</span>
            <div className="color-list">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-swatch ${selectedNode.color === color ? "is-selected" : ""}`}
                  style={{ background: color }}
                  onClick={() => diagram.updateNode(selectedNode.id, { color })}
                  aria-label={`Usar color ${color}`}
                  title={color}
                >
                  {selectedNode.color === color && <Check size={15} />}
                </button>
              ))}
            </div>
            <span className="field-caption variant-label">Estilo de nodo</span>
            <div className="segmented">
              <button
                className={selectedNode.variant === "card" ? "is-active" : ""}
                onClick={() =>
                  diagram.updateNode(selectedNode.id, { variant: "card" })
                }
              >
                Tarjeta
              </button>
              <button
                className={
                  selectedNode.variant === "outline" ? "is-active" : ""
                }
                onClick={() =>
                  diagram.updateNode(selectedNode.id, { variant: "outline" })
                }
              >
                Contorno
              </button>
            </div>
          </section>
          <div className="inspector-actions">
            <button onClick={duplicate}>
              <Copy size={16} /> Duplicar componente
            </button>
            <button className="danger" onClick={deleteSelected}>
              <Trash2 size={16} /> Eliminar componente
            </button>
          </div>
        </div>
      ) : selectedEdge ? (
        <div className="inspector-scroll">
          <div className="inspector-section">
            <h3>Conexión</h3>
            <p className="muted">
              {doc.nodes.find((n) => n.id === selectedEdge.from)?.label} →{" "}
              {doc.nodes.find((n) => n.id === selectedEdge.to)?.label}
            </p>
            <button className="danger text-action" onClick={deleteSelected}>
              <Trash2 size={16} /> Eliminar conexión
            </button>
          </div>
        </div>
      ) : (
        <div className="inspector-empty">
          <span className="inspector-empty-mark">
            <Settings2 size={27} />
          </span>
          <h3>Sin selección</h3>
          <p>Selecciona un componente para editar sus propiedades.</p>
        </div>
      )}
      <div className="inspector-foot">
        <span>Cloud Architect Studio</span>
        <span>v2.0</span>
      </div>
    </aside>
  );

  return (
    <div className="app-shell">
      <a className="skip-link" href="#canvas">
        Saltar al lienzo
      </a>
      <header className="app-header">
        <div className="brand">
          <img src={`${import.meta.env.BASE_URL}icons/logo.svg`} alt="" />
          <span className="brand-wordmark">
            Cloud Architect <b>Studio</b>
          </span>
          <span className="version-tag">STUDIO</span>
        </div>
        <div className="document-control">
          <span className="document-indicator" />
          <input
            aria-label="Nombre del diagrama"
            value={doc.title}
            maxLength={80}
            onChange={(event) =>
              diagram.commit({ ...doc, title: event.target.value })
            }
          />
          <span
            className={`save-indicator ${diagram.saveState}`}
            title={
              diagram.saveState === "saving"
                ? "Guardando"
                : diagram.saveState === "error"
                  ? "Sin guardar"
                  : "Guardado"
            }
            role="status"
            aria-label={
              diagram.saveState === "saving"
                ? "Guardando"
                : diagram.saveState === "error"
                  ? "Sin guardar"
                  : "Guardado"
            }
          >
            {diagram.saveState === "error" ? (
              <X size={15} />
            ) : (
              <Check size={15} />
            )}
          </span>
        </div>
        <div className="header-actions">
          <button
            className="header-action"
            aria-label="Nuevo diagrama"
            onClick={() => setModal("new")}
            title="Nuevo diagrama"
          >
            <FilePlus2 size={17} />
            <span>Nuevo</span>
          </button>
          <button
            className="header-action"
            aria-label="Importar JSON"
            onClick={() => fileRef.current?.click()}
            title="Importar JSON"
          >
            <ArrowUpFromLine size={17} />
            <span>Importar</span>
          </button>
          <button
            className="header-export"
            aria-label="Exportar diagrama"
            onClick={() => setModal("export")}
          >
            <Download size={17} />
            <span>Exportar</span>
          </button>
        </div>
      </header>
      <div className="workbench">
        {palette}
        <main className="editor">
          <div className="toolbar">
            <div className="toolbar-group">
              <IconButton
                icon={Menu}
                label="Abrir biblioteca"
                onClick={() => setSidebarOpen(true)}
                className="mobile-only"
              />
              <button
                className={`tool-button ${tool === "select" ? "is-active" : ""}`}
                onClick={() => setTool("select")}
                title="Seleccionar (V)"
              >
                <MousePointer2 size={18} />
                <span>Seleccionar</span>
              </button>
              <button
                className={`tool-button ${tool === "hand" ? "is-active" : ""}`}
                onClick={() => setTool("hand")}
                title="Mano (H)"
              >
                <Hand size={18} />
                <span>Mano</span>
              </button>
              <button
                className={`tool-button ${tool === "connect" ? "is-active" : ""}`}
                onClick={() => setTool("connect")}
                title="Mostrar todos los puntos de conexión (C)"
              >
                <Link2 size={18} />
                <span>Conectar</span>
              </button>
            </div>
            <span className="toolbar-divider" />
            <div className="toolbar-group">
              <IconButton
                icon={Undo2}
                label="Deshacer"
                onClick={diagram.undo}
                disabled={!diagram.canUndo}
              />
              <IconButton
                icon={Redo2}
                label="Rehacer"
                onClick={diagram.redo}
                disabled={!diagram.canRedo}
              />
              <button
                className="tool-button auto-layout"
                aria-label="Auto layout"
                onClick={() => {
                  diagram.layout();
                  setTimeout(
                    () => flow.fitView({ padding: 0.2, duration: 350 }),
                    30,
                  );
                }}
              >
                <LayoutGrid size={17} />
                <span>Auto layout</span>
              </button>
            </div>
            <div className="toolbar-spacer" />
            <div className="toolbar-group view-tools">
              <IconButton
                icon={Grid3X3}
                label={grid ? "Ocultar cuadrícula" : "Mostrar cuadrícula"}
                onClick={() => setGrid(!grid)}
                active={grid}
              />
              <IconButton
                icon={Focus}
                label={snap ? "Desactivar ajuste" : "Activar ajuste"}
                onClick={() => setSnap(!snap)}
                active={snap}
              />
              <IconButton
                icon={CircleHelp}
                label="Atajos de teclado"
                onClick={() => setModal("help")}
              />
              <IconButton
                icon={Settings2}
                label="Abrir inspector"
                onClick={() => setInspectorOpen(true)}
                className="tablet-only"
              />
            </div>
          </div>
          <div
            id="canvas"
            ref={canvasRef}
            className={`canvas-area tool-${tool} ${connecting ? "is-connecting" : ""}`}
            onDragOver={(event) => {
              if (
                event.dataTransfer.types.includes("application/cloud-component")
              ) {
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
              }
            }}
            onDrop={(event) => {
              const type = event.dataTransfer.getData(
                "application/cloud-component",
              );
              const item = catalogById.get(type);
              if (!item) return;
              event.preventDefault();
              const at = flow.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
              });
              add(item, at);
            }}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) => {
                setSelected(node.id);
                setInspectorOpen(true);
              }}
              onEdgeClick={(_, edge) => {
                setSelected(edge.id);
                setInspectorOpen(true);
              }}
              onPaneClick={() => setSelected(null)}
              onNodeDragStart={diagram.beginGesture}
              onNodeDrag={(_, node) =>
                diagram.moveNode(node.id, node.position.x, node.position.y)
              }
              onNodeDragStop={diagram.endGesture}
              onConnect={(connection: Connection) => {
                if (
                  !connection.source ||
                  !connection.target ||
                  connection.source === connection.target
                )
                  return;
                if (
                  doc.edges.some(
                    (edge) =>
                      edge.from === connection.source &&
                      edge.to === connection.target,
                  )
                )
                  return;
                diagram.commit({
                  ...doc,
                  edges: [
                    ...doc.edges,
                    {
                      id: createId(),
                      from: connection.source,
                      to: connection.target,
                      fromHandle: validPort(connection.sourceHandle),
                      toHandle: validPort(connection.targetHandle),
                    },
                  ],
                });
                notify("Conexión creada");
              }}
              onConnectStart={() => setConnecting(true)}
              onConnectEnd={() => setConnecting(false)}
              onMoveEnd={(_, viewport) =>
                setZoom(Math.round(viewport.zoom * 100))
              }
              panOnDrag={tool === "hand"}
              selectionOnDrag={tool === "select"}
              nodesConnectable={tool !== "hand"}
              connectionMode={ConnectionMode.Loose}
              connectionLineType={ConnectionLineType.SmoothStep}
              connectionLineStyle={{
                stroke: "#d8fb75",
                strokeWidth: 3,
                strokeDasharray: "7 5",
              }}
              connectionRadius={28}
              snapToGrid={snap}
              snapGrid={[24, 24]}
              minZoom={0.02}
              maxZoom={8}
              proOptions={{ hideAttribution: true }}
              deleteKeyCode={null}
              multiSelectionKeyCode="Shift"
              colorMode="dark"
            >
              {grid && (
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={24}
                  size={1.4}
                  color="#30404b"
                />
              )}
            </ReactFlow>
            {doc.nodes.length === 0 && (
              <div className="empty-state">
                <div className="empty-emblem">
                  <Sparkles size={31} strokeWidth={1.5} />
                </div>
                <span className="eyebrow">TU ESPACIO DE TRABAJO</span>
                <h1>Diseña lo que viene.</h1>
                <p>
                  Arrastra componentes desde la biblioteca o añade uno con un
                  toque.
                </p>
                <button onClick={loadExample}>
                  <LayoutGrid size={17} /> Cargar ejemplo
                </button>
              </div>
            )}
            <div className="canvas-status">
              <span className="online-dot" />
              {doc.nodes.length} componentes{" "}
              <span className="status-separator">·</span> {doc.edges.length}{" "}
              conexiones
            </div>
            <div className="zoom-controls">
              <IconButton
                icon={Minus}
                label="Alejar"
                onClick={() => flow.zoomOut({ duration: 180 })}
              />
              <button
                className="zoom-value"
                onClick={() => flow.fitView({ padding: 0.2, duration: 250 })}
                title="Ajustar al diagrama"
              >
                {zoom}%
              </button>
              <IconButton
                icon={Plus}
                label="Acercar"
                onClick={() => flow.zoomIn({ duration: 180 })}
              />
              <span className="zoom-divider" />
              <IconButton
                icon={AlignCenter}
                label="Ajustar diagrama"
                onClick={() => flow.fitView({ padding: 0.2, duration: 250 })}
              />
            </div>
          </div>
        </main>
        {inspector}
      </div>
      <input
        ref={fileRef}
        className="visually-hidden"
        type="file"
        accept="application/json,.json"
        onChange={(event) => {
          void importFile(event.target.files?.[0]);
          event.target.value = "";
        }}
        aria-label="Seleccionar archivo JSON"
      />
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
      {modal === "export" && (
        <Modal
          title="Exportar diagrama"
          subtitle="Elige el formato que mejor se ajuste a tu flujo de trabajo."
          onClose={() => setModal(null)}
        >
          <div className="export-list">
            {exportFormats.map(([format, label, detail]) => (
              <button key={format} onClick={() => void runExport(format)}>
                <span className="export-icon">
                  {format === "json" ? (
                    <FileJson size={20} />
                  ) : (
                    <ArrowDownToLine size={20} />
                  )}
                </span>
                <span>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </span>
                <ArrowDownToLine size={17} className="export-trailing" />
              </button>
            ))}
          </div>
        </Modal>
      )}
      {modal === "new" && (
        <Modal
          title="Nuevo diagrama"
          subtitle="El diagrama actual será reemplazado. Exporta una copia JSON si quieres conservarlo."
          onClose={() => setModal(null)}
        >
          <div className="modal-actions">
            <button className="secondary-button" onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button
              className="primary-button"
              onClick={() => {
                diagram.replace(emptyDocument());
                setSelected(null);
                setModal(null);
                notify("Nuevo diagrama creado");
              }}
            >
              Crear diagrama
            </button>
          </div>
        </Modal>
      )}
      {modal === "help" && (
        <Modal
          title="Atajos de teclado"
          subtitle="Arrastra entre puntos o toca dos puntos para conectar. Usa C para mantenerlos visibles."
          onClose={() => setModal(null)}
        >
          <div className="shortcut-list">
            {[
              ["Seleccionar", "V"],
              ["Mano", "H"],
              ["Conectar", "C"],
              ["Buscar componente", "/"],
              ["Deshacer", "Ctrl Z"],
              ["Rehacer", "Ctrl Shift Z"],
              ["Duplicar", "Ctrl D"],
              ["Eliminar", "Supr"],
            ].map(([label, key]) => (
              <div key={label}>
                <span>{label}</span>
                <kbd>{key}</kbd>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Studio />
    </ReactFlowProvider>
  );
}
