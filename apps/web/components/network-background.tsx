"use client";

import { useEffect, useRef } from "react";

export default function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasDimensions();
    window.addEventListener("resize", setCanvasDimensions);

    // Node class
    class Node {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      color: string;
      pulse: number;
      pulseSpeed: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 2 + 1;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.color = Math.random() > 0.5 ? "#6E56CF" : "#10B981";
        this.pulse = Math.random() * Math.PI;
        this.pulseSpeed = 0.01 + Math.random() * 0.02;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.pulse += this.pulseSpeed;

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();

        // Pulsing effect
        const pulseScale = 0.5 + Math.sin(this.pulse) * 0.5;
        const currentRadius = this.radius * (1 + pulseScale * 0.5);

        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.3 + pulseScale * 0.2;
        ctx.fill();

        // Add glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Create nodes
    const nodeCount = Math.floor(window.innerWidth / 15);
    const nodes: Node[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      nodes.push(new Node(x, y));
    }

    // Draw connections between nodes
    const drawConnections = () => {
      if (!ctx) return;
      ctx.lineWidth = 0.5;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            const opacity = 0.2 * (1 - distance / 150);
            const gradient = ctx.createLinearGradient(
              nodes[i].x,
              nodes[i].y,
              nodes[j].x,
              nodes[j].y
            );

            gradient.addColorStop(0, nodes[i].color);
            gradient.addColorStop(1, nodes[j].color);

            ctx.globalAlpha = opacity;
            ctx.strokeStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
    };

    // Animation loop
    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      for (const node of nodes) {
        node.update();
        node.draw();
      }

      drawConnections();
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", setCanvasDimensions);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-50"
    />
  );
}
