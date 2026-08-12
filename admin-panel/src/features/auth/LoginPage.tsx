import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { setCredentials, UserSession } from '../../redux/slices/authSlice';
import { API_BASE_URLS, ENDPOINTS } from '../../api/apiConfig';
import axios from 'axios';
import { Phone, Lock, Sparkles, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Login States
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [countdown, setCountdown] = useState(0);

  // Status indicators
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Timer loop for resend OTP countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    setError(null);
    setDevOtpHint(null);

    try {
      const response = await axios.post(`${API_BASE_URLS.auth}${ENDPOINTS.auth.sendOtp}`, {
        phone: phone.trim()
      });
      
      const { success, data } = response.data;
      if (response.status === 200 || success) {
        setStep('otp');
        setCountdown(60);
        
        // Check if there is a dev hint or mock return
        if (data?.otp) {
          setDevOtpHint(`Development OTP: ${data.otp}`);
        } else {
          setDevOtpHint('Check the auth-service console logs to retrieve the OTP.');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to dispatch verification OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URLS.auth}${ENDPOINTS.auth.verifyOtp}`, {
        phone: phone.trim(),
        otp: otp.trim(),
        role: 'admin', // Enforce administration interface auth scope
        deviceId: 'admin-web-client-1',
        deviceName: 'Admin Dashboard Web',
        platform: 'WEB',
        appVersion: '1.0.0'
      });

      const { data } = response.data;
      if (data && data.accessToken) {
        const userSession: UserSession = {
          id: data.user.id,
          phone: data.user.phone,
          role: data.user.role,
          roles: data.user.roles,
          accountStatus: data.user.accountStatus,
          isPhoneVerified: data.user.isPhoneVerified,
          profileCompleted: data.user.profileCompleted
        };

        dispatch(setCredentials({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: userSession,
          rememberMe
        }));
        
        navigate('/dashboard');
      } else {
        throw new Error('Authentication response did not contain access tokens.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black p-4 overflow-hidden relative">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Branding Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight font-heading text-gradient">
            JUSTTAP
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Platform Command Center & Admin Gateway
          </p>
        </div>

        {/* Content Box */}
        <div className="glassmorphism p-8 rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <AnimatePresence mode="wait">
            {step === 'phone' ? (
              <motion.div
                key="phone-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-1">Verify Identity</h2>
                  <p className="text-sm text-muted-foreground">
                    Enter your registered administrative mobile number to proceed.
                  </p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="9999999999"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-secondary/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/50"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <label className="flex items-center space-x-2 cursor-pointer select-none text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-border bg-secondary/50 text-primary focus:ring-primary focus:ring-offset-0 w-4 h-4"
                        disabled={loading}
                      />
                      <span>Keep me authenticated</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <>
                        Request OTP Code <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-1">Enter Verification Code</h2>
                  <p className="text-sm text-muted-foreground">
                    A 6-digit OTP code has been dispatched to <span className="font-semibold text-foreground">+{phone}</span>.
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      One-Time Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-secondary/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm tracking-[0.3em] font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/30"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <>
                        Verify & Access Console <ShieldCheck className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('phone')}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      disabled={loading}
                    >
                      Change Phone Number
                    </button>
                    {countdown > 0 ? (
                      <span className="text-muted-foreground">Resend in {countdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-primary hover:underline transition-all"
                        disabled={loading}
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feedback & Dev Alerts */}
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {devOtpHint && (
            <div className="mt-4 p-3 bg-primary/10 border border-primary/20 text-primary rounded-lg flex items-start gap-2 text-xs">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{devOtpHint}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
