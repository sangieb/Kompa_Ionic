/**
 * Equivale a core/util/FotoUtil.kt: reduce la foto a máximo 800 px por lado
 * y la guarda como JPEG al 80 %. Devuelve un data URL para guardarlo.
 */
export async function comprimirFoto(webPath: string, maxLado = 800, calidad = 0.8): Promise<string> {
  const imagen = new Image();
  imagen.src = webPath;
  await imagen.decode();

  const escala = Math.min(1, maxLado / Math.max(imagen.naturalWidth, imagen.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(imagen.naturalWidth * escala);
  canvas.height = Math.round(imagen.naturalHeight * escala);
  canvas.getContext('2d')!.drawImage(imagen, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', calidad);
}