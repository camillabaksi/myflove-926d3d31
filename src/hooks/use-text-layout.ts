import { useEffect, useRef, useState } from "react";

/** Page-local rem measurement; presentation only, never a saved preference. */
export function useTextLayout() {
  const ref = useRef<HTMLSpanElement>(null);
  const [enlarged, setEnlarged] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setEnlarged(element.getBoundingClientRect().width > 20);
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    return () => observer.disconnect();
  }, []);
  return { ref, enlarged };
}
