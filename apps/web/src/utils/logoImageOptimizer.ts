/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Utility: Client-Side Logo & Image Optimizer
 * Mengonversi dan mengompresi logo secara otomatis agar ringan (WebP HD)
 * dengan tetap mempertahankan resolusi tajam dan transparansi alpha.
 */

export interface OptimizedImageResult {
  file: File;
  previewUrl: string;
  originalSize: number;
  optimizedSize: number;
  reductionPercent: number;
  width: number;
  height: number;
  format: string;
}
export const OptimizedImageResult = {};

export type LogoTargetType = "horizontal" | "emblem" | "favicon";
export const LogoTargetType = {};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const optimizeLogoImage = async (
  file: File,
  targetType: LogoTargetType = "horizontal"
): Promise<OptimizedImageResult> => {
  const originalSize = file.size;

  // 1. Validasi Batasan Ukuran Maksimal 5 MB
  const MAX_BYTES = 5 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    throw new Error(
      `Ukuran berkas (${formatFileSize(file.size)}) melebihi batas maksimal 5 MB. Silakan gunakan berkas yang lebih kecil.`
    );
  }

  // 2. Validasi Format Berkas
  const allowedMime = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
  const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");

  if (!allowedMime.includes(file.type) && !isSvg) {
    throw new Error(
      "Format berkas tidak didukung. Harap unggah format PNG, WEBP, JPEG, atau SVG."
    );
  }

  // Jika SVG, tidak perlu dikonversi ke canvas (vektor sudah resolusi tak terbatas & ultra-ringan)
  if (isSvg) {
    const previewUrl = URL.createObjectURL(file);
    return {
      file,
      previewUrl,
      originalSize,
      optimizedSize: originalSize,
      reductionPercent: 0,
      width: 0,
      height: 0,
      format: "SVG (Vektor Asli)",
    };
  }

  // Tentukan batasan dimensi berdasarkan peruntukan
  let maxW = 1600;
  let maxH = 600;
  if (targetType === "emblem") {
    maxW = 512;
    maxH = 512;
  } else if (targetType === "favicon") {
    maxW = 256;
    maxH = 256;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Hitung scaling aspect ratio bila melebihi batas
        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Fallback bila canvas context gagal
          const previewUrl = URL.createObjectURL(file);
          return resolve({
            file,
            previewUrl,
            originalSize,
            optimizedSize: originalSize,
            reductionPercent: 0,
            width,
            height,
            format: file.type,
          });
        }

        // Gambar ke canvas dengan interpolasi kualitas tinggi
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Ekspor ke format WebP HD (kualitas 0.92, mempertahankan transparansi alpha)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              const fallbackUrl = URL.createObjectURL(file);
              return resolve({
                file,
                previewUrl: fallbackUrl,
                originalSize,
                optimizedSize: originalSize,
                reductionPercent: 0,
                width,
                height,
                format: file.type,
              });
            }

            const cleanBaseName = file.name.replace(/\.[^/.]+$/, "");
            const optimizedName = `${cleanBaseName}-hd.webp`;
            const optimizedFile = new File([blob], optimizedName, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            const optimizedSize = blob.size;
            const reductionPercent = Math.max(
              0,
              Math.round(((originalSize - optimizedSize) / originalSize) * 100)
            );
            const previewUrl = URL.createObjectURL(blob);

            resolve({
              file: optimizedFile,
              previewUrl,
              originalSize,
              optimizedSize,
              reductionPercent,
              width,
              height,
              format: "WEBP (HD Terkompresi)",
            });
          },
          "image/webp",
          0.92
        );
      };

      img.onerror = () => {
        reject(new Error("Gagal memuat gambar logo untuk diproses."));
      };
    };

    reader.onerror = () => reject(new Error("Gagal membaca berkas logo yang diunggah."));
  });
};
