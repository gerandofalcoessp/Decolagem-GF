/**
 * Utilitários para otimização de imagens
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Gera URL otimizada para imagens do Supabase Storage
 */
export const getOptimizedImageUrl = (
  originalUrl: string,
  options: ImageOptimizationOptions = {}
): string => {
  if (!originalUrl) return '';

  const { width, height, quality = 80, format = 'webp' } = options;

  // Se não for uma URL do Supabase, retorna a original
  if (!originalUrl.includes('supabase')) {
    return originalUrl;
  }

  try {
    const url = new URL(originalUrl);
    const params = new URLSearchParams();

    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());
    if (quality) params.set('quality', quality.toString());
    if (format) params.set('format', format);

    // Adicionar parâmetros de transformação
    if (params.toString()) {
      url.search = params.toString();
    }

    return url.toString();
  } catch (error) {
    console.warn('Erro ao otimizar URL da imagem:', error);
    return originalUrl;
  }
};

/**
 * Redimensiona imagem no cliente antes do upload
 */
export const resizeImage = (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calcular dimensões mantendo proporção
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Desenhar imagem redimensionada
      ctx?.drawImage(img, 0, 0, width, height);

      // Converter para blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Erro ao redimensionar imagem'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Converte imagem para WebP se suportado pelo navegador
 */
export const convertToWebP = (file: File, quality: number = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // Verificar suporte ao WebP
    const canvas = document.createElement('canvas');
    const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;

    if (!supportsWebP) {
      resolve(file);
      return;
    }

    const img = new Image();
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Erro ao converter para WebP'));
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Gera placeholder base64 para imagem
 */
export const generatePlaceholder = (width: number = 400, height: number = 300): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = width;
  canvas.height = height;

  if (ctx) {
    // Gradiente suave
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f3f4f6');
    gradient.addColorStop(1, '#e5e7eb');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Ícone de imagem
    ctx.fillStyle = '#9ca3af';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📷', width / 2, height / 2);
  }

  return canvas.toDataURL('image/jpeg', 0.1);
};

/**
 * Preload de imagens críticas
 */
export const preloadImages = (urls: string[]): Promise<void[]> => {
  const promises = urls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Erro ao carregar: ${url}`));
      img.src = url;
    });
  });

  return Promise.all(promises);
};

/**
 * Detecta se a imagem é crítica (above the fold)
 */
export const isCriticalImage = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  
  // Considera crítica se estiver nos primeiros 600px da viewport
  return rect.top < viewportHeight * 0.75;
};

/**
 * Otimiza arquivo de imagem antes do upload
 */
export const optimizeImageFile = async (
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<File> => {
  const { width = 1920, height = 1080, quality = 0.8 } = options;

  try {
    // Redimensionar se necessário
    const resizedBlob = await resizeImage(file, width, height, quality);
    
    // Converter para WebP se possível
    const optimizedBlob = await convertToWebP(new File([resizedBlob], file.name), quality);
    
    // Criar novo arquivo otimizado
    const optimizedFile = new File(
      [optimizedBlob],
      file.name.replace(/\.(jpg|jpeg|png)$/i, '.webp'),
      { type: 'image/webp' }
    );

    return optimizedFile;
  } catch (error) {
    console.warn('Erro na otimização, usando arquivo original:', error);
    return file;
  }
};