import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function upscale() {
  const dir = path.join(process.cwd(), 'public', 'images', 's26-ultra');
  
  for (let i = 1; i <= 28; i++) {
    const idx = i.toString().padStart(3, '0');
    const input = path.join(dir, `ezgif-frame-${idx}.jpg`);
    const output = path.join(dir, `ezgif-frame-${idx}.webp`);
    
    // Scale up by 3x (1280x720 -> 3840x2160)
    // using high quality lanczos3 interpolation and moderate sharpening
    // to recover edges without generating halos.
    await sharp(input)
      .resize({
        width: 3840,
        height: 2160,
        kernel: sharp.kernel.lanczos3
      })
      .sharpen({
        sigma: 1.2,
        m1: 1.5,
        m2: 2.0,
        x1: 2,
        y2: 10,
        y3: 20
      })
      .webp({ quality: 90, effort: 6 })
      .toFile(output);
      
    console.log(`Processed ${idx}/28: ${output}`);
  }
}

upscale().catch(console.error);
