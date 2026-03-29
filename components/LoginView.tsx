
import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup } from '../firebase';

interface LoginViewProps {
  onLogin: (status: boolean) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      onLogin(true);
    } catch (err: any) {
      console.error("Login Error:", err);
      setError('Gagal login dengan Google. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dekorasi Background */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white rounded-[3rem] shadow-2xl p-12 space-y-10 animate-fadeIn">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center font-black text-4xl text-white mx-auto shadow-xl shadow-indigo-200">H</div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">HR-Pro Login</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Dashboard KESBANGPOLDAGRI PROV. NTB</p>
            </div>
          </div>

          <div className="space-y-6">
            <button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white border-2 border-slate-100 text-slate-900 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-sm hover:bg-slate-50 hover:-translate-y-1 transition-all flex items-center justify-center space-x-4"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{isLoading ? 'Menghubungkan...' : 'Masuk dengan Google'}</span>
            </button>
            
            {error && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-tight text-center animate-pulse">{error}</p>}
          </div>

          <div className="pt-4 border-t border-slate-50 text-center">
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest italic leading-relaxed">Sistem ini hanya untuk akses internal.<br/>Segala aktivitas dicatat secara otomatis.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
