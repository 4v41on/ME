"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getMemoryGraph, type GraphNode, type GraphData } from "@/app/lib/api";
import { categoryColor } from "@/app/lib/categories";

const NODE_RADIUS = 5;
const REPULSION = 3000;
const ATTRACTION = 0.04;
const DAMPING = 0.82;
const CENTER_GRAVITY = 0.012;

interface SimNode extends GraphNode {
  x: number; y: number;
  vx: number; vy: number;
}

interface Tooltip {
  x: number; y: number;
  node: GraphNode;
}

export function MemoryGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const rafRef = useRef<number>(0);
  const offsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragNodeRef = useRef<SimNode | null>(null);

  useEffect(() => {
    getMemoryGraph()
      .then(setData)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  // Inicializar simulación cuando llegan los datos
  useEffect(() => {
    if (!data) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width;
    const H = canvas.height;

    nodesRef.current = data.nodes.map((n) => ({
      ...n,
      x: W / 2 + (Math.random() - 0.5) * 200,
      y: H / 2 + (Math.random() - 0.5) * 200,
      vx: 0,
      vy: 0,
    }));
  }, [data]);

  // Loop de simulación + render
  useEffect(() => {
    if (!data || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const nodeMap = new Map<string, SimNode>();

    const tick = () => {
      const nodes = nodesRef.current;
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;

      nodeMap.clear();
      nodes.forEach((n) => nodeMap.set(n.id, n));

      // Repulsión entre todos los pares
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          if (a === dragNodeRef.current || b === dragNodeRef.current) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist2 = dx * dx + dy * dy + 0.01;
          const force = REPULSION / dist2;
          const fx = (dx / Math.sqrt(dist2)) * force;
          const fy = (dy / Math.sqrt(dist2)) * force;
          a.vx -= fx; a.vy -= fy;
          b.vx += fx; b.vy += fy;
        }
      }

      // Atracción por links
      data.links.forEach((link) => {
        const a = nodeMap.get(link.source);
        const b = nodeMap.get(link.target);
        if (!a || !b) return;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const fx = dx * ATTRACTION;
        const fy = dy * ATTRACTION;
        if (a !== dragNodeRef.current) { a.vx += fx; a.vy += fy; }
        if (b !== dragNodeRef.current) { b.vx -= fx; b.vy -= fy; }
      });

      // Gravedad hacia el centro
      nodes.forEach((n) => {
        if (n === dragNodeRef.current) return;
        n.vx += (cx - n.x) * CENTER_GRAVITY;
        n.vy += (cy - n.y) * CENTER_GRAVITY;
        n.vx *= DAMPING;
        n.vy *= DAMPING;
        n.x += n.vx;
        n.y += n.vy;
      });

      // Render
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.translate(offsetRef.current.x, offsetRef.current.y);
      ctx.scale(scaleRef.current, scaleRef.current);

      // Edges
      data.links.forEach((link) => {
        const a = nodeMap.get(link.source);
        const b = nodeMap.get(link.target);
        if (!a || !b) return;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(255,255,255,0.07)";
        ctx.lineWidth = 1 / scaleRef.current;
        ctx.stroke();
      });

      // Nodes
      nodes.forEach((n) => {
        const color = categoryColor(n.category);
        ctx.beginPath();
        ctx.arc(n.x, n.y, NODE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = color + "cc";
        ctx.fill();
        // glow ring on hover/selected
        if (selected?.id === n.id) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, NODE_RADIUS + 3, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5 / scaleRef.current;
          ctx.stroke();
        }
      });

      ctx.restore();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [data, selected]);

  // Resize canvas al tamaño del contenedor
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    });
    ro.observe(container);
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    return () => ro.disconnect();
  }, []);

  // Convertir coordenada de pantalla a coordenada del grafo
  const toGraph = useCallback((px: number, py: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (px - rect.left - offsetRef.current.x) / scaleRef.current,
      y: (py - rect.top - offsetRef.current.y) / scaleRef.current,
    };
  }, []);

  const hitTest = useCallback((gx: number, gy: number) => {
    const r = NODE_RADIUS + 4;
    return nodesRef.current.find((n) => {
      const dx = n.x - gx; const dy = n.y - gy;
      return dx * dx + dy * dy < r * r;
    }) ?? null;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDraggingRef.current && dragNodeRef.current) {
      const g = toGraph(e.clientX, e.clientY);
      dragNodeRef.current.x = g.x;
      dragNodeRef.current.y = g.y;
      dragNodeRef.current.vx = 0;
      dragNodeRef.current.vy = 0;
      setTooltip(null);
      return;
    }
    if (isDraggingRef.current) {
      // Pan
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      offsetRef.current = { x: offsetRef.current.x + dx, y: offsetRef.current.y + dy };
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      setTooltip(null);
      return;
    }
    const g = toGraph(e.clientX, e.clientY);
    const hit = hitTest(g.x, g.y);
    if (hit) {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top - 12, node: hit });
    } else {
      setTooltip(null);
    }
  }, [toGraph, hitTest]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const g = toGraph(e.clientX, e.clientY);
    const hit = hitTest(g.x, g.y);
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    dragNodeRef.current = hit ?? null;
  }, [toGraph, hitTest]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const wasDraggingNode = dragNodeRef.current !== null;
    const g = toGraph(e.clientX, e.clientY);
    const hit = hitTest(g.x, g.y);
    if (!wasDraggingNode && hit) {
      setSelected((prev) => prev?.id === hit.id ? null : hit);
    }
    isDraggingRef.current = false;
    dragNodeRef.current = null;
  }, [toGraph, hitTest]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    scaleRef.current = Math.min(4, Math.max(0.2, scaleRef.current * factor));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <span className="font-mono text-[10px] text-[#2a2a35] uppercase tracking-widest animate-pulse">
        cargando grafo...
      </span>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-full">
      <span className="font-mono text-[10px] text-red-500/50">{error}</span>
    </div>
  );

  if (!data || data.nodes.length === 0) return (
    <div className="flex items-center justify-center h-full">
      <span className="font-mono text-[10px] text-[#2a2a35] uppercase tracking-widest">
        sin memorias con tags
      </span>
    </div>
  );

  return (
    <div ref={containerRef} className="relative w-full h-full" style={{ minHeight: "420px" }}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%", cursor: "crosshair" }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setTooltip(null); isDraggingRef.current = false; dragNodeRef.current = null; }}
        onWheel={handleWheel}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute font-mono"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 30,
            background: "rgba(0,0,0,0.9)",
            border: `1px solid ${categoryColor(tooltip.node.category)}40`,
            padding: "4px 8px",
            maxWidth: "200px",
            zIndex: 10,
          }}
        >
          <span style={{ fontSize: "9px", color: categoryColor(tooltip.node.category), display: "block", marginBottom: 2 }}>
            {tooltip.node.category} · {tooltip.node.date}
          </span>
          <span style={{ fontSize: "10px", color: "#a1a1aa" }}>{tooltip.node.label}</span>
        </div>
      )}

      {/* Selected node detail */}
      {selected && (
        <div
          className="absolute bottom-0 left-0 right-0 font-mono"
          style={{
            background: "rgba(0,0,0,0.92)",
            borderTop: `1px solid ${categoryColor(selected.category)}40`,
            padding: "10px 12px",
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontSize: "9px", color: categoryColor(selected.category) }}>
              {selected.category} · {selected.date}
            </span>
            <button
              onClick={() => setSelected(null)}
              style={{ fontSize: "9px", color: "#3f3f46", background: "none", border: "none", cursor: "pointer" }}
            >✕</button>
          </div>
          <p style={{ fontSize: "11px", color: "#a1a1aa", lineHeight: 1.5, margin: 0 }}>
            {selected.label}
          </p>
        </div>
      )}

      {/* Legend — derivado de las categorías reales en el grafo */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        {Array.from(new Set(data.nodes.map((n) => n.category)))
          .slice(0, 6)
          .map((cat) => (
            <div key={cat} className="flex items-center gap-1.5">
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: categoryColor(cat), display: "inline-block" }} />
              <span style={{ fontSize: "8px", color: "#3f3f46", fontFamily: "monospace" }}>{cat}</span>
            </div>
          ))}
      </div>

      {/* Stats */}
      <div className="absolute top-2 left-2 font-mono" style={{ fontSize: "8px", color: "#2a2a35" }}>
        {data.nodes.length} nodos · {data.links.length} enlaces
      </div>
    </div>
  );
}
