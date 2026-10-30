/**
 * Utility normalisasi angka persentase survei KKN Berseka
 * Mendukung format legacy (0..1) dan format baru (0..100) tanpa mengubah data asli di database.
 */

/**
 * Mengubah nilai persentase ke skala standar 0..100 (%)
 * Contoh:
 * - 0.248 -> 24.8
 * - 0.5   -> 50.0
 * - 42.5  -> 42.5
 * - null  -> 0
 */
export function normalizePercentage(val: number | string | null | undefined): number {
  if (val === null || val === undefined || val === "") return 0;
  const num = typeof val === "string" ? parseFloat(val) : Number(val);
  if (isNaN(num)) return 0;

  // Jika nilai berada di antara 0 dan 1.0 (format pecahan desimal legacy), konversi ke persen
  if (num > 0 && num <= 1.0) {
    return Number((num * 100).toFixed(2));
  }

  return Number(num.toFixed(2));
}

/**
 * Format string persentase siap tampil di UI (contoh: "42.5%" atau "—")
 */
export function formatPercentString(
  val: number | string | null | undefined,
  decimals: number = 1,
  emptyPlaceholder: string = "—"
): string {
  if (val === null || val === undefined || val === "") return emptyPlaceholder;
  const normalized = normalizePercentage(val);
  return `${normalized.toFixed(decimals)}%`;
}

/**
 * Menghitung delta perubahan persentase (Endline - Baseline) yang sudah ternormalisasi
 */
export function calculateNormalizedDelta(
  baseline: number | string | null | undefined,
  endline: number | string | null | undefined
): number | null {
  if (baseline === null || baseline === undefined || endline === null || endline === undefined) {
    return null;
  }
  const normBase = normalizePercentage(baseline);
  const normEnd = normalizePercentage(endline);
  return Number((normEnd - normBase).toFixed(2));
}

export interface DataProvenanceInfo {
  type: "AGREGASI_RW" | "DATA_AWAL";
  label: string;
  badgeClass: string;
  description: string;
}

/**
 * Mendeteksi asal-usul data kelurahan:
 * Apakah dari agregasi riil RW mahasiswa KKN atau estimasi data awal kelurahan.
 */
export function determineProvenance(
  catatan?: string | null,
  totalRwTerdata?: number | null
): DataProvenanceInfo {
  const cat = (catatan || "").toLowerCase();
  const isFromRw =
    (typeof totalRwTerdata === "number" && totalRwTerdata > 0) ||
    cat.includes("survey.berseka.id") ||
    cat.includes("akumulasi") ||
    cat.includes("rw");

  if (isFromRw) {
    return {
      type: "AGREGASI_RW",
      label: "Terverifikasi Lapangan RW",
      badgeClass:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
      description: "Data diakumulasi secara otomatis dari laporan survei per-RW oleh Mahasiswa KKN.",
    };
  }

  return {
    type: "DATA_AWAL",
    label: "Estimasi Data Awal",
    badgeClass:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800",
    description: "Data historis awal kondisi wilayah sebelum survei komprehensif RW masuk.",
  };
}
