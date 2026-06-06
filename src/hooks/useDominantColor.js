import { useState, useEffect } from 'react';
import { FastAverageColor } from 'fast-average-color';

export const useDominantColor = (src) => {
  const [color, setColor] = useState(null);

  useEffect(() => {
    if (!src) return;
    
    // TMDB images generally support CORS, but we need to set crossOrigin
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = src;

    const fac = new FastAverageColor();
    
    img.onload = () => {
        fac.getColorAsync(img, { algorithm: 'dominant' })
          .then(color => setColor(color.value))
          .catch(e => console.error('Error extracting color:', e));
    };

    return () => fac.destroy();
  }, [src]);

  return color;
};
