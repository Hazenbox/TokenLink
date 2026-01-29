import * as React from "react";

export function ThemeRipple() {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [rippleOrigin, setRippleOrigin] = React.useState({ x: 50, y: 50 });
  const [nextTheme, setNextTheme] = React.useState<"light" | "dark">("light");
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const animationRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!isAnimating || !overlayRef.current) return;

    let startTime: number | null = null;
    const duration = 800;
    const { x, y } = rippleOrigin;
    
    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const radius = easeProgress * 150;
      
      if (overlayRef.current) {
        overlayRef.current.style.clipPath = `circle(${radius}% at ${x}% ${y}%)`;
      }
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        animationRef.current = null;
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, rippleOrigin]);

  const handleRipple = React.useCallback((x: number, y: number, newTheme: "light" | "dark") => {
    setRippleOrigin({ x, y });
    setNextTheme(newTheme);
    setIsAnimating(true);
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).triggerThemeRipple = handleRipple;
    }
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).triggerThemeRipple;
      }
    };
  }, [handleRipple]);

  if (!isAnimating) return null;

  return (
    <div
      ref={overlayRef}
      className={`theme-ripple-overlay fixed inset-0 pointer-events-none z-50 ${nextTheme === "dark" ? "dark-ripple" : "light-ripple"}`}
      style={{
        clipPath: `circle(0% at ${rippleOrigin.x}% ${rippleOrigin.y}%)`,
      }}
    />
  );
}
