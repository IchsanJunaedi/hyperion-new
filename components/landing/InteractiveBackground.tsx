"use client";

import { useRef } from "react";
import { useGSAP } from "@/lib/gsap";

const InteractiveBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracker
    const mouse = {
      x: null as number | null,
      y: null as number | null,
      targetX: null as number | null,
      targetY: null as number | null,
      radius: 200, // area of distortion
    };

    // Grid configuration
    const gridSpacing = 65; // size of grid cells
    let cols = Math.ceil(width / gridSpacing) + 2;
    let rows = Math.ceil(height / gridSpacing) + 2;

    // Grid points structure
    interface GridPoint {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      vx: number;
      vy: number;
    }

    let grid: GridPoint[][] = [];

    const initGrid = () => {
      grid = [];
      cols = Math.ceil(width / gridSpacing) + 2;
      rows = Math.ceil(height / gridSpacing) + 2;

      for (let r = 0; r < rows; r++) {
        const rowPoints: GridPoint[] = [];
        for (let c = 0; c < cols; c++) {
          const x = (c - 0.5) * gridSpacing;
          const y = (r - 0.5) * gridSpacing;
          rowPoints.push({
            x,
            y,
            baseX: x,
            baseY: y,
            vx: 0,
            vy: 0,
          });
        }
        grid.push(rowPoints);
      }
    };

    initGrid();

    // Track mouse coordinates
    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY + window.scrollY;
    };

    const handleMouseLeave = () => {
      mouse.targetX = null;
      mouse.targetY = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    let currentMouseX = 0;
    let currentMouseY = 0;

    // Animation loop
    const drawLoop = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Smoothly interpolate mouse coordinates (inertia)
      if (mouse.targetX !== null && mouse.targetY !== null) {
        if (currentMouseX === 0 && currentMouseY === 0) {
          currentMouseX = mouse.targetX;
          currentMouseY = mouse.targetY;
        } else {
          currentMouseX += (mouse.targetX - currentMouseX) * 0.08;
          currentMouseY += (mouse.targetY - currentMouseY) * 0.08;
        }
        mouse.x = currentMouseX;
        mouse.y = currentMouseY - window.scrollY;
      } else {
        mouse.x = null;
        mouse.y = null;
        currentMouseX = 0;
        currentMouseY = 0;
      }

      // Update grid point positions
      const timeMs = time * 0.001; // convert to seconds
      for (let r = 0; r < rows; r++) {
        const row = grid[r];
        if (!row) continue;
        for (let c = 0; c < cols; c++) {
          const pt = row[c];
          if (!pt) continue;

          // 1. Gentle continuous organic wave
          const waveX = Math.sin(pt.baseY * 0.003 + timeMs * 1.2 + c * 0.2) * 5;
          const waveY = Math.cos(pt.baseX * 0.003 + timeMs * 0.9 + r * 0.2) * 5;

          let targetX = pt.baseX + waveX;
          let targetY = pt.baseY + waveY;

          // 2. Mouse gravity/warp distortion
          if (mouse.x !== null && mouse.y !== null) {
            const dx = targetX - mouse.x;
            const dy = targetY - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < mouse.radius) {
              const force = (mouse.radius - dist) / mouse.radius;
              // Push points away for a soft grid indentation effect
              const push = force * force * 38;
              targetX += (dx / dist) * push;
              targetY += (dy / dist) * push;
            }
          }

          // Smoothly spring point towards its target
          pt.x += (targetX - pt.x) * 0.1;
          pt.y += (targetY - pt.y) * 0.1;
        }
      }

      // Render grid lines
      ctx.lineWidth = 0.55;

      // Draw horizontal lines (Gold)
      ctx.strokeStyle = "rgba(245, 196, 0, 0.022)";
      for (let r = 0; r < rows; r++) {
        const row = grid[r];
        if (!row || row.length === 0) continue;
        ctx.beginPath();
        const first = row[0];
        if (first) ctx.moveTo(first.x, first.y);
        for (let c = 1; c < cols; c++) {
          const pt = row[c];
          if (pt) ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      // Draw vertical lines (Cyber Blue)
      ctx.strokeStyle = "rgba(0, 102, 255, 0.016)";
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        const firstRow = grid[0];
        const first = firstRow ? firstRow[c] : null;
        if (first) ctx.moveTo(first.x, first.y);
        for (let r = 1; r < rows; r++) {
          const row = grid[r];
          const pt = row ? row[c] : null;
          if (pt) ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(drawLoop);
    };

    animationFrameId = requestAnimationFrame(drawLoop);

    // Resize handler
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initGrid();
    };
    window.addEventListener("resize", handleResize);

    // Cleanups
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden z-0"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-85 pointer-events-none"
      />
      {/* ── Background Glow Orbs for ambient depth ────────────────────── */}
      <div className="absolute top-[12%] left-[18%] w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] rounded-full bg-[#F5C400]/4 blur-[140px]" />
      <div className="absolute bottom-[20%] right-[12%] w-[550px] sm:w-[750px] h-[550px] sm:h-[750px] rounded-full bg-[#0066FF]/3 blur-[150px]" />
    </div>
  );
};

export { InteractiveBackground };
