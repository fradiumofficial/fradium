import { useEffect, useRef } from "react";

export function SakuraAnimation() {
  const canvasRef = useRef(null);
  const leaves = useRef([]);
  const animationFrameId = useRef();
  const sakuraImageRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load sakura leaf image
    const sakuraImage = new Image();
    sakuraImage.src = "/images/sakura-petal.png"; // This will be created later
    sakuraImage.crossOrigin = "anonymous";
    sakuraImageRef.current = sakuraImage;

    // Set canvas to full width/height of parent
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        // Re-initialize leaves when canvas size changes
        initLeaves();
      }
    };

    // Create leaves
    const initLeaves = () => {
      leaves.current = [];
      const leafCount = Math.min(Math.floor((canvas.width * canvas.height) / 15000), 50);

      for (let i = 0; i < leafCount; i++) {
        createLeaf(true);
      }
    };

    const createLeaf = (initial = false) => {
      const size = Math.random() * 15 + 10;

      const leaf = {
        x: Math.random() * canvas.width,
        y: initial ? Math.random() * canvas.height : -size * 2,
        size,
        speedX: (Math.random() - 0.5) * 1,
        speedY: Math.random() * 1 + 0.5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        opacity: Math.random() * 0.6 + 0.3,
        image: sakuraImageRef.current,
      };

      leaves.current.push(leaf);
      return leaf;
    };

    // Draw a leaf
    const drawLeaf = (ctx, leaf) => {
      if (!leaf.image || !leaf.image.complete) {
        // Fallback to a simple circle if image isn't loaded
        ctx.save();
        ctx.globalAlpha = leaf.opacity;
        ctx.beginPath();
        ctx.arc(leaf.x, leaf.y, leaf.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffcce0";
        ctx.fill();
        ctx.restore();
        return;
      }

      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.rotation);
      ctx.globalAlpha = leaf.opacity;
      ctx.drawImage(leaf.image, -leaf.size / 2, -leaf.size / 2, leaf.size, leaf.size);
      ctx.restore();
    };

    // Animation loop
    const animate = () => {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw leaves
      for (let i = 0; i < leaves.current.length; i++) {
        const leaf = leaves.current[i];

        // Update position with a slight wave motion
        leaf.x += leaf.speedX + Math.sin(Date.now() * 0.001 + i) * 0.2;
        leaf.y += leaf.speedY;
        leaf.rotation += leaf.rotationSpeed;

        // If leaf is out of view, reset it
        if (leaf.y > canvas.height + leaf.size || leaf.x < -leaf.size || leaf.x > canvas.width + leaf.size) {
          // Reset leaf position to top with random x
          leaf.x = Math.random() * canvas.width;
          leaf.y = -leaf.size;
          leaf.speedX = (Math.random() - 0.5) * 1;
          leaf.speedY = Math.random() * 1 + 0.5;
        }

        drawLeaf(ctx, leaf);
      }

      // Occasionally add a new leaf
      if (Math.random() < 0.02 && leaves.current.length < 100) {
        createLeaf();
      }

      animationFrameId.current = requestAnimationFrame(animate);
    };

    // Handle window resize
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Start animation when image is loaded
    sakuraImage.onload = () => {
      initLeaves();
      animate();
    };

    // Fallback in case image doesn't load
    setTimeout(() => {
      if (leaves.current.length === 0) {
        initLeaves();
        animate();
      }
    }, 1000);

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }} />;
}
