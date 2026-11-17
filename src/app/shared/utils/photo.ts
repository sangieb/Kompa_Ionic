/**
 * Scales photo to at most `maxSide` px and returns it as a JPEG data URL.
 */
export async function compressPhoto(webPath: string, maxSide = 800, quality = 0.8): Promise<string> {
  const image = new Image();
  image.src = webPath;
  await image.decode();

  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  }

  return canvas.toDataURL('image/jpeg', quality);
}
