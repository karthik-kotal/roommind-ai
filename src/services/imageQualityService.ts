import { ImageQualityResult } from '../types';

export const imageQualityService = {
  async evaluateImage(blob: Blob): Promise<ImageQualityResult> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        URL.revokeObjectURL(url);
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        if (width < 320 || height < 240) {
          return resolve({
            isValid: false,
            brightness: 0,
            contrast: 0,
            blurScore: 0,
            width,
            height,
            message: 'Image resolution is too low. Please use a higher resolution camera.',
          });
        }

        const canvas = document.createElement('canvas');
        // Sample at reasonable dimension for speed
        const sampleWidth = Math.min(width, 400);
        const sampleHeight = Math.min(height, 300);
        canvas.width = sampleWidth;
        canvas.height = sampleHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({
            isValid: true,
            brightness: 128,
            contrast: 50,
            blurScore: 100,
            width,
            height,
            message: 'Quality check bypassed (canvas 2d unavailable)',
          });
        }

        ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight);
        const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
        const data = imageData.data;

        // Grayscale & Brightness
        let totalLuminance = 0;
        const grayscale = new Float32Array(sampleWidth * sampleHeight);

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Rec. 601 luminance
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          grayscale[i / 4] = lum;
          totalLuminance += lum;
        }

        const avgBrightness = totalLuminance / (sampleWidth * sampleHeight);

        // Contrast (Standard deviation of luminance)
        let sumVariance = 0;
        for (let i = 0; i < grayscale.length; i++) {
          const diff = grayscale[i] - avgBrightness;
          sumVariance += diff * diff;
        }
        const contrast = Math.sqrt(sumVariance / grayscale.length);

        // Simplified Laplacian Variance for Blur Detection
        let laplaceSum = 0;
        let laplaceCount = 0;

        for (let y = 1; y < sampleHeight - 1; y += 2) {
          for (let x = 1; x < sampleWidth - 1; x += 2) {
            const idx = y * sampleWidth + x;
            const center = grayscale[idx];
            const up = grayscale[(y - 1) * sampleWidth + x];
            const down = grayscale[(y + 1) * sampleWidth + x];
            const left = grayscale[y * sampleWidth + (x - 1)];
            const right = grayscale[y * sampleWidth + (x + 1)];

            // 4-neighbor discrete Laplacian operator
            const laplacian = Math.abs(4 * center - up - down - left - right);
            laplaceSum += laplacian;
            laplaceCount++;
          }
        }

        const avgLaplacian = laplaceCount > 0 ? laplaceSum / laplaceCount : 50;

        // Threshold checks
        if (avgBrightness < 25) {
          return resolve({
            isValid: false,
            brightness: Math.round(avgBrightness),
            contrast: Math.round(contrast),
            blurScore: Math.round(avgLaplacian),
            width,
            height,
            message: 'Image appears too dark. Please turn on room lights or open blinds.',
          });
        }

        if (avgBrightness > 245) {
          return resolve({
            isValid: false,
            brightness: Math.round(avgBrightness),
            contrast: Math.round(contrast),
            blurScore: Math.round(avgLaplacian),
            width,
            height,
            message: 'Image appears overexposed/too bright. Avoid pointing directly at light bulbs.',
          });
        }

        if (avgLaplacian < 4.0) {
          return resolve({
            isValid: false,
            brightness: Math.round(avgBrightness),
            contrast: Math.round(contrast),
            blurScore: Math.round(avgLaplacian),
            width,
            height,
            message: 'Image appears too blurry. Please steady your device and retake.',
          });
        }

        return resolve({
          isValid: true,
          brightness: Math.round(avgBrightness),
          contrast: Math.round(contrast),
          blurScore: Math.round(avgLaplacian),
          width,
          height,
          message: 'Good quality capture ✓',
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({
          isValid: false,
          brightness: 0,
          contrast: 0,
          blurScore: 0,
          width: 0,
          height: 0,
          message: 'Corrupted or invalid image file format.',
        });
      };

      img.src = url;
    });
  },
};
