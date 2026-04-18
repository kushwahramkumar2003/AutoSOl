"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CursorSpotlight({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasMouse, setHasMouse] = useState(false);
  const rawX = useMotionValue(-400);
  const rawY = useMotionValue(-400);

  // Smooth spring for a fluid follow
  const x = useSpring(rawX, { damping: 30, stiffness: 200 });
  const y = useSpring(rawY, { damping: 30, stiffness: 200 });

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      rawX.set(e.clientX - 300);
      rawY.set(e.clientY - 300);
      if (!hasMouse) setHasMouse(true);
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, [rawX, rawY, hasMouse]);

  return (
    <div className="relative">
      {hasMouse && (
        <motion.div
          className="pointer-events-none fixed z-[1] h-[600px] w-[600px] rounded-full opacity-[0.035]"
          style={{
            left: 0,
            top: 0,
            x,
            y,
            background: "radial-gradient(circle, white 0%, transparent 70%)",
          }}
        />
      )}
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}
