import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  LockIcon,
  LogInIcon,
  MailIcon,
  PhoneIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  UserIcon,
  UserPlusIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export const LoginPage = () => {
  const { setSession: e } = useAuth(),
    t = useNavigate(),
    [r, n] = useState('signin'),
    [i, a] = useState('officer'),
    [o, l] = useState('demo123'),
    [c, u] = useState('credentials'),
    [f, d] = useState(''),
    [p, h] = useState(''),
    [y, x] = useState(''),
    [g, v] = useState(''),
    [m, b] = useState(''),
    [j, w] = useState(''),
    [_, S] = useState('credentials'),
    [O, A] = useState(''),
    [E, T] = useState(''),
    [C, I] = useState(''),
    [R, P] = useState(false),
    [$, D] = useState(''),
    [M, L] = useState(''),
    [U, F] = useState(false),
    [V, X] = useState(false),
    [se, be] = useState(''),
    [De, lt] = useState(false),
    [Ge, H] = useState(''),
    [J, ne] = useState(''),
    [z, pe] = useState('email'),
    [ie, Re] = useState(''),
    [Pe, ct] = useState(''),
    [qt, Ur] = useState(''),
    [yn, zr] = useState(false),
    [currentOtp, setCurrentOtp] = useState(''),
    Nr = (Z) => {
      (n(Z),
        u('credentials'),
        S('credentials'),
        A(''),
        T(''),
        I(''),
        D(''),
        L(''),
        be(''),
        lt(false),
        pe('email'),
        H(''),
        ne(''),
        Re(''),
        ct(''),
        Ur(''),
        setCurrentOtp(''));
    },
    mo = async (Z) => {
      Z.preventDefault();
      try {
        (P(true), D(''));
        const loginResult = await api.login({ username: i, password: o });
        if (loginResult && loginResult.access_token && loginResult.user) {
          (e(loginResult.user, loginResult.access_token), t('/'));
          return;
        }
        const te = await api.sendOtp({ username: i, method: 'email' });
        const ti = te.email_masked || te.masked_email || '';
        const genOtp = te.otp || sessionStorage.getItem('gem_last_otp') || '';
        (setCurrentOtp(genOtp),
          I(ti || 'your registered e-mail'),
          be(i),
          u('otp'),
          L(
            `Credentials verified. A secure 6-digit OTP has been generated & dispatched to ${ti || 'your registered email'}.`,
          ));
      } catch (te) {
        D(te.message || 'Login failed');
      } finally {
        P(false);
      }
    },
    jl = async (Z) => {
      Z.preventDefault();
      try {
        if (!O || O.length < 6) {
          (D('Please enter the complete 6-digit OTP.'), P(false));
          return;
        }
        (P(true), D(''));
        const te = await api.verifyOtp({ username: se, otp: O });
        te.access_token && te.user && (e(te.user, te.access_token), t('/'));
      } catch (te) {
        D(te.message || 'OTP verification failed');
      } finally {
        P(false);
      }
    },
    Sl = async () => {
      try {
        (P(true), D(''), A(''));
        const Z = await api.sendOtp({ username: se, method: 'email' });
        const te = Z.email_masked || Z.masked_email || '';
        const genOtp = Z.otp || sessionStorage.getItem('gem_last_otp') || '';
        (setCurrentOtp(genOtp),
          I(te || 'your registered e-mail'),
          L('New verification OTP generated and dispatched.'));
      } catch (Z) {
        D(Z.message || 'Failed to resend OTP');
      } finally {
        P(false);
      }
    },
    GO = async (Z) => {
      Z.preventDefault();
      try {
        (P(true), D(''));
        const te = {};
        (J && (te.username = J), Ge && (te.email = Ge));
        const ti = await api.sendOtp(te),
          Nl = ti.email_masked || ti.masked_email || '';
        const genOtp = ti.otp || sessionStorage.getItem('gem_last_otp') || '';
        (setCurrentOtp(genOtp),
          I(Nl || 'your registered e-mail'),
          pe('otp'),
          L('Password reset OTP generated & sent to your registered email.'));
      } catch (te) {
        D(te.message || 'Could not send reset OTP. Please check your email or username.');
      } finally {
        P(false);
      }
    },
    WO = async (Z) => {
      Z.preventDefault();
      try {
        if ((P(true), D(''), !ie || ie.length < 6)) {
          (D('Please enter the 6-digit OTP from your email.'), P(false));
          return;
        }
        const te = { otp: ie };
        (J && (te.username = J), Ge && (te.email = Ge));
        // The server checks the OTP when the new password is submitted.
        (pe('newpass'), D(''), L('OTP verified! Please set your new password.'));
      } catch (te) {
        D(te.message || 'OTP verification failed.');
      } finally {
        P(false);
      }
    },
    HO = async (Z) => {
      Z.preventDefault();
      try {
        if ((P(true), D(''), Pe.length < 6)) {
          (D('Password must be at least 6 characters.'), P(false));
          return;
        }
        if (Pe !== qt) {
          (D('Passwords do not match. Please re-enter.'), P(false));
          return;
        }
        const te = { otp: ie, new_password: Pe };
        (J && (te.username = J),
          Ge && (te.email = Ge),
          await api.resetPassword(te),
          pe('done'),
          L('Password updated successfully! You may now sign in with your new password.'));
      } catch (te) {
        D(te.message || 'Failed to reset password.');
      } finally {
        P(false);
      }
    },
    qO = async (Z) => {
      Z.preventDefault();
      try {
        if ((P(true), D(''), m !== j)) {
          (D('Passwords do not match.'), P(false));
          return;
        }
        if (m.length < 6) {
          (D('Password must be at least 6 characters.'), P(false));
          return;
        }
        await api.register({ username: p, password: m, full_name: f, email: y, phone: g });
        const te = await api.sendOtp({ username: p, email: y, method: 'email' });
        const genOtp = te.otp || sessionStorage.getItem('gem_last_otp') || '';
        (setCurrentOtp(genOtp),
          I(te.email_masked || te.masked_email || y),
          be(p),
          S('otp'),
          L(`Officer profile registered! Verification OTP dispatched to ${y}.`));
      } catch (te) {
        D(te.message || 'Registration failed');
      } finally {
        P(false);
      }
    },
    KO = async (Z) => {
      Z.preventDefault();
      try {
        if (!O || O.length < 6) {
          (D('Please enter the complete 6-digit OTP.'), P(false));
          return;
        }
        (P(true), D(''));
        const te = await api.verifyOtp({ username: se, otp: O });
        te.access_token && te.user && (e(te.user, te.access_token), t('/'));
      } catch (te) {
        D(te.message || 'OTP verification failed');
      } finally {
        P(false);
      }
    },
    Jv = (Z) => (
      <form onSubmit={Z} className="p-6 space-y-4">
        {$ && (
          <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold border border-rose-200 flex items-center gap-2">
            <CircleAlertIcon className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{$}</span>
          </div>
        )}
        {M && (
          <div className="p-3 bg-teal-50 text-teal-900 rounded-xl text-xs font-semibold border border-teal-200 flex items-center gap-2">
            <CircleCheckIcon className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>{M}</span>
          </div>
        )}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pine-700 to-teal-800 flex items-center justify-center mx-auto shadow-glow-teal">
            <ShieldCheckIcon className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Two-Factor Authentication (2FA)</h3>
          <p className="text-[11px] text-slate-500">
            {'Enter the 6-digit OTP sent to '}
            <strong className="text-slate-700">{C || 'your email'}</strong>
          </p>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              One-Time Password (OTP)
            </label>
            <span className="text-[10px] text-slate-400 font-mono">6-digit numeric</span>
          </div>
          <div className="relative">
            <KeyRoundIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              maxLength={6}
              value={O}
              onChange={(te) => A(te.target.value.replace(/\D/g, ''))}
              className="w-full pl-9 pr-3 py-2.5 text-center text-lg font-mono font-bold tracking-[0.5em] border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none transition-colors"
              placeholder="● ● ● ● ● ●"
              autoFocus
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={R || !O || O.length < 6}
          className="w-full py-3 bg-gradient-to-r from-pine-800 to-teal-800 hover:from-pine-900 hover:to-teal-900 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-glow-teal transition-all flex items-center justify-center gap-2 group"
        >
          {R ? (
            'Verifying...'
          ) : (
            <>
              <ShieldCheckIcon className="w-4 h-4 text-champagne-300" />
              <span>{'Verify & Enter Console'}</span>
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
        <div className="flex items-center justify-between text-[11px] pt-1">
          <button
            type="button"
            onClick={Sl}
            disabled={R}
            className="text-pine-700 hover:underline flex items-center gap-1 font-semibold"
          >
            <RefreshCwIcon className="w-3 h-3" />
            {' Resend Code'}
          </button>
          <button
            type="button"
            onClick={() => {
              (r === 'signin' ? u('credentials') : S('credentials'), A(''), D(''), L(''));
            }}
            className="text-slate-500 hover:underline font-medium"
          >
            ← Back
          </button>
        </div>
      </form>
    );
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#040C16] via-[#081726] to-[#0A2033] flex flex-col justify-between items-center p-4">
      <div className="w-full max-w-5xl py-4 flex justify-between items-center text-slate-300 text-xs border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-champagne-400">
            Government of India
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">GeM Technical Evaluation Cell</span>
        </div>
        <div className="flex items-center gap-2 text-pine-300 font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-pine-400 animate-pulse" />
          <span>GFR 2017 Secure Sandbox</span>
        </div>
      </div>
      <div className="w-full max-w-md my-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="gradient-obsidian-header p-8 text-center text-white relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0F2620] via-[#0A1A24] to-[#040E14] border-2 border-champagne-400/50 flex items-center justify-center mx-auto shadow-xl mb-4">
              <svg
                className="w-10 h-10 text-champagne-400"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L3 6V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V6L12 2Z"
                  fill="url(#login-shield)"
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12L11 14L15 10"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="7" r="1.2" fill="#14B8A6" />
                <defs>
                  <linearGradient
                    id="login-shield"
                    x1="12"
                    y1="2"
                    x2="12"
                    y2="23"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#0D3830" />
                    <stop offset="1" stopColor="#08231E" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-black tracking-tight">
                {'GeM '}
                <span className="text-champagne-400">BidVerify</span>
              </h1>
              <span className="bg-pine-800 text-pine-200 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider font-mono shadow-sm border border-pine-600/40">
                AI
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1.5 font-medium">
              {'National Public Procurement Compliance & Technical Scrutiny Gateway'}
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 text-[11px] text-champagne-300 font-semibold border border-slate-700 shadow-sm">
              <LockIcon className="w-3.5 h-3.5 text-champagne-400" />
              Secure Officer Sign-in
            </div>
          </div>
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => Nr('signin')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${r === 'signin' ? 'text-pine-800 border-b-2 border-pine-700 bg-pine-50/50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
              <LogInIcon className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              onClick={() => Nr('register')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${r === 'register' ? 'text-champagne-800 border-b-2 border-champagne-600 bg-champagne-50/50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
              <UserPlusIcon className="w-3.5 h-3.5" />
              Create Account
            </button>
          </div>
          {r === 'signin' && c === 'credentials' && (
            <form onSubmit={mo} className="p-6 space-y-4">
              {$ && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold border border-rose-200 flex items-center gap-2">
                  <CircleAlertIcon className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{$}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Official Username / User ID
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={i}
                    onChange={(Z) => a(Z.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none transition-colors"
                    placeholder="e.g. officer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Password / Passcode
                </label>
                <div className="relative">
                  <LockIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={U ? 'text' : 'password'}
                    required
                    value={o}
                    onChange={(Z) => l(Z.target.value)}
                    className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => F(!U)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {U ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={R}
                className="w-full py-3 bg-gradient-to-r from-pine-800 to-teal-800 hover:from-pine-900 hover:to-teal-900 text-white text-xs font-bold rounded-xl shadow-glow-teal transition-all flex items-center justify-center gap-2 group"
              >
                {R ? (
                  'Authenticating...'
                ) : (
                  <>
                    <span>{'Sign In'}</span>
                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    (lt(true), D(''), L(''), pe('email'));
                  }}
                  className="text-[11px] text-pine-700 hover:text-pine-900 hover:underline font-semibold transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          )}
          {r === 'signin' && c === 'otp' && Jv(jl)}
          {r === 'signin' && c === 'credentials' && De && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden">
                <div className="gradient-obsidian-header p-6 text-center text-white">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0F2620] to-[#040E14] border border-champagne-400/40 flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <KeyRoundIcon className="w-6 h-6 text-champagne-400" />
                  </div>
                  <h3 className="text-base font-black tracking-tight">Reset Password</h3>
                  <p className="text-[11px] text-slate-300 mt-1">
                    {z === 'email' && 'Enter your registered email or username'}
                    {z === 'otp' && `Enter the OTP sent to ${C || 'your email'}`}
                    {z === 'newpass' && 'Create your new secure password'}
                    {z === 'done' && 'Password reset complete!'}
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  {$ && (
                    <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold border border-rose-200 flex items-center gap-2">
                      <CircleAlertIcon className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>{$}</span>
                    </div>
                  )}
                  {M && (
                    <div className="p-3 bg-teal-50 text-teal-900 rounded-xl text-xs font-semibold border border-teal-200 flex items-center gap-2">
                      <CircleCheckIcon className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <span>{M}</span>
                    </div>
                  )}
                  {z === 'email' && (
                    <form onSubmit={GO} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Username
                        </label>
                        <div className="relative">
                          <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={J}
                            onChange={(Z) => ne(Z.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                            placeholder="e.g. officer"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <div className="flex-grow border-t border-slate-200" />
                        <span className="font-mono uppercase">or</span>
                        <div className="flex-grow border-t border-slate-200" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Registered Email
                        </label>
                        <div className="relative">
                          <MailIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="email"
                            value={Ge}
                            onChange={(Z) => H(Z.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                            placeholder="your.email@gmail.com"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={R || (!Ge && !J)}
                        className="w-full py-2.5 bg-gradient-to-r from-pine-800 to-teal-800 hover:from-pine-900 hover:to-teal-900 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {R ? (
                          'Sending OTP...'
                        ) : (
                          <>
                            <MailIcon className="w-3.5 h-3.5" />
                            <span>Send Reset OTP</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                  {z === 'otp' && (
                    <form onSubmit={WO} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          6-Digit OTP
                        </label>
                        <div className="relative">
                          <KeyRoundIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={ie}
                            onChange={(Z) => Re(Z.target.value.replace(/\D/g, ''))}
                            className="w-full pl-9 pr-3 py-2.5 text-center text-lg font-mono font-bold tracking-[0.5em] border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                            placeholder="● ● ● ● ● ●"
                            autoFocus
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={R || ie.length < 6}
                        className="w-full py-2.5 bg-gradient-to-r from-pine-800 to-teal-800 hover:from-pine-900 hover:to-teal-900 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {R ? (
                          'Verifying...'
                        ) : (
                          <>
                            <ShieldCheckIcon className="w-3.5 h-3.5" />
                            <span>Verify OTP</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          (pe('email'), Re(''), D(''), L(''));
                        }}
                        className="w-full text-[11px] text-slate-500 hover:text-slate-700 hover:underline text-center"
                      >
                        ← Back / Resend OTP
                      </button>
                    </form>
                  )}
                  {z === 'newpass' && (
                    <form onSubmit={HO} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          New Password
                        </label>
                        <div className="relative">
                          <LockIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type={yn ? 'text' : 'password'}
                            required
                            value={Pe}
                            onChange={(Z) => ct(Z.target.value)}
                            className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                            placeholder="Min 6 characters"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => zr(!yn)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                          >
                            {yn ? (
                              <EyeOffIcon className="w-4 h-4" />
                            ) : (
                              <EyeIcon className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <LockIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="password"
                            required
                            value={qt}
                            onChange={(Z) => Ur(Z.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                            placeholder="Re-enter new password"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={R || !Pe || !qt}
                        className="w-full py-2.5 bg-gradient-to-r from-pine-800 to-teal-800 hover:from-pine-900 hover:to-teal-900 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {R ? (
                          'Updating...'
                        ) : (
                          <>
                            <ShieldCheckIcon className="w-3.5 h-3.5" />
                            <span>Update Password</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                  {z === 'done' && (
                    <div className="text-center space-y-4 py-2">
                      <div className="w-14 h-14 rounded-full bg-teal-100 border-2 border-teal-400 flex items-center justify-center mx-auto">
                        <CircleCheckIcon className="w-8 h-8 text-teal-600" />
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        Your password has been updated. Please sign in with your new credentials.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          (lt(false), pe('email'), D(''), L(''), l(''));
                        }}
                        className="w-full py-2.5 bg-gradient-to-r from-pine-800 to-teal-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <LogInIcon className="w-3.5 h-3.5" />
                        <span>Go to Sign In</span>
                      </button>
                    </div>
                  )}
                  {z !== 'done' && (
                    <button
                      type="button"
                      onClick={() => {
                        (lt(false), D(''), L(''));
                      }}
                      className="w-full text-[11px] text-slate-400 hover:text-slate-600 text-center hover:underline mt-1"
                    >
                      Cancel — Back to Sign In
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          {r === 'register' && _ === 'credentials' && (
            <form onSubmit={qO} className="p-6 space-y-3">
              {$ && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold border border-rose-200 flex items-center gap-2">
                  <CircleAlertIcon className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{$}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={f}
                    onChange={(Z) => d(Z.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    placeholder="e.g. Amit Sharma"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={p}
                    onChange={(Z) => h(Z.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    placeholder="Choose unique username"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Official Government Email
                </label>
                <div className="relative">
                  <MailIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={y}
                    onChange={(Z) => x(Z.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    placeholder="name@gem.gov.in"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <PhoneIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={g}
                    onChange={(Z) => v(Z.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    placeholder="+91 98200 XXXXX"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <LockIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={V ? 'text' : 'password'}
                      required
                      value={m}
                      onChange={(Z) => b(Z.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                      placeholder="Min 6 chars"
                    />
                    <button
                      type="button"
                      onClick={() => X(!V)}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      {V ? (
                        <EyeOffIcon className="w-3.5 h-3.5" />
                      ) : (
                        <EyeIcon className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Confirm
                  </label>
                  <div className="relative">
                    <LockIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={j}
                      onChange={(Z) => w(Z.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                      placeholder="Re-enter"
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={R}
                className="w-full py-3 bg-gradient-to-r from-pine-800 to-teal-800 hover:from-pine-900 hover:to-teal-900 text-white text-xs font-bold rounded-xl shadow-glow-teal transition-all flex items-center justify-center gap-2 group mt-1"
              >
                {R ? (
                  'Creating Account...'
                ) : (
                  <>
                    <UserPlusIcon className="w-4 h-4" />
                    <span>{'Create Profile & Verify Email'}</span>
                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}
          {r === 'register' && _ === 'otp' && Jv(KO)}
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[10.5px] text-slate-500 leading-tight">
            Secure officer sign-in. All authentication attempts are logged for CVC vigilance review.
          </div>
        </div>
      </div>
      <footer className="w-full max-w-5xl py-3 text-center text-[11px] text-slate-400 border-t border-slate-800/80">
        {'AI-Powered Public Procurement Compliance & Verification Platform • Smart India Hackathon'}
      </footer>
    </div>
  );
};
