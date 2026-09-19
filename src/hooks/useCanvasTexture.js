import { useEffect, useRef, useState } from 'react';
import { fontsReady } from '../utils/canvasText';

// Paints a canvas texture straight away (fallback fonts), repaints it once the
// webfonts have landed, and disposes whatever it replaces or leaves behind.
// `make` must return a fresh THREE.Texture; `deps` decide when to repaint.
export function useCanvasTexture(make, deps) {
  const [texture, setTexture] = useState(make);
  const current = useRef(texture);

  useEffect(() => {
    let alive = true;
    fontsReady.then(() => {
      if (!alive) return;
      const next = make();
      current.current.dispose();
      current.current = next;
      setTexture(next);
    });
    return () => {
      alive = false;
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => () => current.current.dispose(), []);

  return texture;
}
