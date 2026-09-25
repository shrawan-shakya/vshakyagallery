import * as THREE from 'three';

const textureCache = new Map();

/**
 * Returns a cached THREE.Texture if already preloaded and prepared
 */
export function getCachedTexture(url) {
  if (!url) return null;
  return textureCache.get(url) || null;
}

/**
 * Manually register a texture into the memory cache
 */
export function setCachedTexture(url, texture) {
  if (!url || !texture) return;
  textureCache.set(url, texture);
}

/**
 * Clean up older textures from prior rooms to prevent GPU memory bloat,
 * while retaining those needed for the active room.
 */
export function clearTextureCacheExcept(keepUrls = []) {
  const keepSet = new Set(keepUrls.filter(Boolean));
  for (const [url, tex] of textureCache.entries()) {
    if (!keepSet.has(url)) {
      try {
        tex.dispose();
      } catch (e) {
        // Safe disposal fallback
      }
      textureCache.delete(url);
    }
  }
}

/**
 * Asynchronously loads, downscales (if necessary), and configures a Three.js texture.
 */
export function preloadSingleTexture(url, anisotropy = 8, maxTextureSide = 2048) {
  if (!url) return Promise.resolve(null);
  if (textureCache.has(url)) return Promise.resolve(textureCache.get(url));

  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    if (!url.startsWith('data:')) {
      loader.crossOrigin = 'anonymous';
    }

    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, 4500);

    const onTextureReady = (tex) => {
      if (resolved) {
        tex.dispose();
        return;
      }
      resolved = true;
      clearTimeout(timer);

      try {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = anisotropy;

        const img = tex.image;
        const scale = img ? Math.min(1, maxTextureSide / Math.max(img.width, img.height)) : 1;
        if (scale < 1 && img) {
          try {
            const c = document.createElement('canvas');
            c.width = Math.max(1, Math.round(img.width * scale));
            c.height = Math.max(1, Math.round(img.height * scale));
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            tex.dispose();

            const canvasTex = new THREE.CanvasTexture(c);
            canvasTex.colorSpace = THREE.SRGBColorSpace;
            canvasTex.generateMipmaps = true;
            canvasTex.minFilter = THREE.LinearMipmapLinearFilter;
            canvasTex.magFilter = THREE.LinearFilter;
            canvasTex.anisotropy = anisotropy;
            textureCache.set(url, canvasTex);
            resolve(canvasTex);
            return;
          } catch {
            // Downscaling fallback if canvas is tainted by CORS
          }
        }

        textureCache.set(url, tex);
        resolve(tex);
      } catch {
        textureCache.set(url, tex);
        resolve(tex);
      }
    };

    loader.load(
      url,
      onTextureReady,
      undefined,
      (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          console.warn('Could not preload texture:', url, err);
          resolve(null);
        }
      }
    );
  });
}

/**
 * Preloads all artwork images in a hall layout, updating progress as each image finishes.
 */
export async function preloadArtworks(artworks, anisotropy = 8, maxTextureSide = 2048, onProgress) {
  if (!Array.isArray(artworks) || artworks.length === 0) {
    onProgress?.(1, 1, 'Exhibition Ready');
    return;
  }

  const items = artworks
    .map((art) => {
      const url =
        art.localDataUrl ||
        (maxTextureSide <= 1024 && art.imageUrlSm ? art.imageUrlSm : art.imageUrl);
      return {
        id: art.id,
        title: art.title || 'Masterpiece',
        url,
      };
    })
    .filter((item) => Boolean(item.url));

  if (items.length === 0) {
    onProgress?.(1, 1, 'Exhibition Ready');
    return;
  }

  let completed = 0;
  const total = items.length;

  await Promise.all(
    items.map(async (item) => {
      await preloadSingleTexture(item.url, anisotropy, maxTextureSide);
      completed += 1;
      onProgress?.(completed, total, item.title);
    })
  );
}
