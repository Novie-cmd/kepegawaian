
import React, { useState } from 'react';

interface LoginViewProps {
  onLogin: (status: boolean) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Gunakan password default sederhana (bisa diganti sesuai keinginan)
    if (password === 'admin123') {
      onLogin(true);
    } else {
      setError('Kode akses salah. Silakan coba lagi.');
      setPassword('');
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
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Dashboard DPMPTSP Prov. NTB</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kode Akses Admin</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="••••••••" 
                className={`w-full px-6 py-5 bg-slate-50 border ${error ? 'border-rose-300' : 'border-slate-100'} rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-300 transition-all text-center tracking-[0.5em]`}
                autoFocus
              />
              {error && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-tight text-center animate-pulse">{error}</p>}
            </div>

            <button 
              type="submit" 
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 hover:-translate-y-1 transition-all"
            >
              Masuk Sistem
            </button>
          </form>

          <div className="pt-4 border-t border-slate-50 text-center">
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest italic leading-relaxed">Sistem ini hanya untuk akses internal.<br/>Segala aktivitas dicatat secara otomatis.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
