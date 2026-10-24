/**
 * Project: BERSEKA Web Dashboard
 * Component: ForgotPasswordModal (Wizard Lupa Kata Sandi via WhatsApp OTP)
 * Copyright (c) 2026 Universitas Komputer Indonesia & PT Makerindo
 */

import React, { useState, useEffect, useRef } from "react";
import { X, Phone, KeyRound, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, RotateCw } from "lucide-react";
import api from "../../../utils/api";
import showToast from "../../../utils/showToast";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessReset?: (phone: string) => void;
}

function normalizePhone(val: string): string {
  let t = val.trim().replace(/[\s\-().]/g, "");
  if (t.startsWith("08")) return "+62" + t.slice(1);
  if (t.startsWith("8")) return "+62" + t;
  if (t.startsWith("628") && !t.startsWith("+")) return "+" + t;
  return t;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccessReset,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [phone, setPhone] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPhone("");
      setNormalizedPhone("");
      setOtp("");
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setIsLoading(false);
      setTimer(60);
      setCanResend(false);
    }
  }, [isOpen]);

  // Resend Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  // Auto-focus OTP input on step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [step]);

  if (!isOpen) return null;

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = phone.trim();
    if (!raw) {
      showToast.error("Nomor ponsel/WhatsApp wajib diisi.");
      return;
    }

    const clean = normalizePhone(raw);
    if (!/^\+628[0-9]\d{7,11}$/.test(clean)) {
      showToast.error("Format nomor tidak valid. Contoh: 081234567890");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { phone: clean });
      if (res.data?.success || res.status === 200) {
        setNormalizedPhone(clean);
        setStep(2);
        setTimer(60);
        setCanResend(false);
        showToast.success("Kode OTP berhasil dikirimkan ke WhatsApp Anda.");
      } else {
        showToast.error(res.data?.message || "Gagal mengirimkan kode OTP.");
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        "Nomor tidak ditemukan atau gagal terhubung ke server.";
      showToast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || isLoading) return;
    setIsLoading(true);
    try {
      const res = await api.post("/auth/request-otp", { phone: normalizedPhone });
      if (res.data?.success || res.status === 200) {
        setTimer(60);
        setCanResend(false);
        showToast.success("Kode OTP baru telah dikirimkan via WhatsApp.");
      } else {
        showToast.error(res.data?.message || "Gagal mengirim ulang OTP.");
      }
    } catch (err: any) {
      showToast.error(err?.response?.data?.message || "Gagal mengirim ulang kode OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length < 4) {
      showToast.error("Masukkan kode OTP yang Anda terima di WhatsApp.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", {
        phone: normalizedPhone,
        otp: cleanOtp,
      });

      const payload = res.data?.data ?? res.data;
      if (payload?.resetToken || res.status === 200) {
        setResetToken(payload?.resetToken || cleanOtp);
        setStep(3);
        showToast.success("OTP valid! Silakan tentukan kata sandi baru.");
      } else {
        showToast.error("Kode OTP salah atau kedaluwarsa.");
      }
    } catch (err: any) {
      showToast.error(err?.response?.data?.message || "Kode OTP tidak valid atau sudah hangus.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast.error("Kata sandi baru minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast.error("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        phone: normalizedPhone,
        resetToken: resetToken,
        token: resetToken,
        otp: otp.trim(),
        newPassword,
      });

      if (res.data?.success || res.status === 200) {
        setStep(4);
        showToast.success("Kata sandi berhasil diperbarui!");
        if (onSuccessReset) {
          onSuccessReset(normalizedPhone);
        }
      } else {
        showToast.error(res.data?.message || "Gagal memperbarui kata sandi.");
      }
    } catch (err: any) {
      showToast.error(err?.response?.data?.message || "Gagal memperbarui kata sandi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0B7478]/10 flex items-center justify-center text-[#0B7478]">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0f2142] leading-tight">
                Reset Kata Sandi
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Verifikasi akun via WhatsApp BERSEKA
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        {step < 4 && (
          <div className="flex items-center justify-center gap-2 pt-4 px-6">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step >= 1 ? "w-10 bg-[#0B7478]" : "w-6 bg-slate-200"
              }`}
            />
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step >= 2 ? "w-10 bg-[#0B7478]" : "w-6 bg-slate-200"
              }`}
            />
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step >= 3 ? "w-10 bg-[#0B7478]" : "w-6 bg-slate-200"
              }`}
            />
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6">
          {/* ── STEP 1: Input Nomor WhatsApp ── */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0f2142] uppercase tracking-wider mb-2">
                  Nomor WhatsApp Terdaftar
                </label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="Contoh: 081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
                    disabled={isLoading}
                    autoFocus
                    className="w-full h-12 pl-12 pr-4 bg-white text-[#0f2142] text-sm font-semibold rounded-xl border border-slate-200 focus:border-[#0B7478] focus:ring-4 focus:ring-[#0B7478]/10 outline-none transition-all"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  Kami akan mengirimkan 6 digit kode OTP resmi ke nomor WhatsApp yang terdaftar pada akun Anda.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 h-11 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !phone.trim()}
                  className="w-2/3 h-11 flex items-center justify-center gap-2 text-xs font-bold text-white bg-[#0B7478] hover:bg-[#075A5D] rounded-xl transition-all shadow-md shadow-[#0B7478]/20 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : (
                    <>
                      <span>Kirim Kode OTP</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 2: Input Kode OTP ── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center pb-1">
                <p className="text-xs text-slate-500">
                  Kode OTP dikirimkan ke WhatsApp:
                </p>
                <p className="text-sm font-bold text-[#0f2142] mt-0.5">
                  {normalizedPhone}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0f2142] uppercase tracking-wider text-center mb-2">
                  Masukkan 6 Digit Kode OTP
                </label>
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={isLoading}
                  className="w-full h-14 text-center tracking-[0.6em] text-2xl font-black text-[#0f2142] bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0B7478] focus:bg-white focus:ring-4 focus:ring-[#0B7478]/10 outline-none transition-all"
                />
              </div>

              {/* Resend button */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Belum menerima kode?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="flex items-center gap-1 font-bold text-[#0B7478] hover:underline cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Kirim Ulang</span>
                  </button>
                ) : (
                  <span className="text-slate-400 font-semibold">
                    Kirim ulang dalam {timer}d
                  </span>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="w-1/3 h-11 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Ubah Nomor
                </button>
                <button
                  type="submit"
                  disabled={isLoading || otp.length < 4}
                  className="w-2/3 h-11 flex items-center justify-center gap-2 text-xs font-bold text-white bg-[#0B7478] hover:bg-[#075A5D] rounded-xl transition-all shadow-md shadow-[#0B7478]/20 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : (
                    <span>Verifikasi OTP</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 3: Buat Kata Sandi Baru ── */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0f2142] uppercase tracking-wider mb-1.5">
                  Kata Sandi Baru
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 8 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                    className="w-full h-11 pl-11 pr-11 bg-white text-[#0f2142] text-sm font-medium rounded-xl border border-slate-200 focus:border-[#0B7478] focus:ring-4 focus:ring-[#0B7478]/10 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0f2142] uppercase tracking-wider mb-1.5">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Ulangi kata sandi baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full h-11 pl-11 pr-4 bg-white text-[#0f2142] text-sm font-medium rounded-xl border border-slate-200 focus:border-[#0B7478] focus:ring-4 focus:ring-[#0B7478]/10 outline-none transition-all"
                  />
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="mt-1.5 text-xs text-rose-500 font-semibold">
                    Konfirmasi kata sandi tidak cocok.
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || newPassword.length < 8 || newPassword !== confirmPassword}
                  className="w-full h-11 flex items-center justify-center gap-2 text-xs font-bold text-white bg-[#0B7478] hover:bg-[#075A5D] rounded-xl transition-all shadow-md shadow-[#0B7478]/20 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : (
                    <span>Simpan Kata Sandi Baru</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 4: Sukses ── */}
          {step === 4 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600 animate-in zoom-in duration-300">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-[#0f2142]">
                  Kata Sandi Berhasil Diperbarui
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Akun Anda telah diamankan. Silakan masuk kembali menggunakan kata sandi baru Anda.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full h-11 text-xs font-bold text-white bg-[#0B7478] hover:bg-[#075A5D] rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Masuk Sekarang
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
