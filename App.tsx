
import React, { useState, useMemo, useEffect } from 'react';
import { ViewType, Employee } from './types';
import { NAV_ITEMS, MOCK_EMPLOYEES } from './constants';
import StatCard from './components/StatCard';
import EmployeeTable from './components/EmployeeTable';
import EmployeeModal from './components/EmployeeModal';
import { getNextPromotion, getNextKgb, getRetirementDate, isNear } from './utils/dateUtils';
import { getAIAnalysis } from './services/geminiService';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('DASHBOARD');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(isSupabaseConfigured);
  const [aiReport, setAiReport] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null);

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<number | string>('');
  const [selectedYear, setSelectedYear] = useState<number | string>('');

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 2 + i);
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  // Fetch data from Supabase only if configured
  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchEmployees();
    } else {
      // Fallback to local data or empty if not configured to prevent crash
      setEmployees([]);
      setIsLoadingData(false);
    }
  }, []);

  const fetchEmployees = async () => {
    if (!supabase) return;
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (err: any) {
      console.error('Fetch error:', err.message);
      setToast({ message: 'Gagal sinkronisasi Cloud. Pastikan tabel "employees" sudah dibuat.', type: 'error' });
    } finally {
      setIsLoadingData(false);
    }
  };

  // Rendering Helper for Configuration Error
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-2xl w-full bg-slate-800 rounded-[3rem] p-12 shadow-2xl border border-slate-700 animate-fadeIn text-center">
          <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-500/20">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
          </div>
          <h1 className="text-3xl font-black mb-4 tracking-tight">Konfigurasi Cloud Diperlukan</h1>
          <p className="text-slate-400 mb-10 leading-relaxed font-medium">
            Aplikasi tidak dapat tampil karena variabel database Supabase belum diatur di panel kontrol Vercel Anda.
          </p>
          <div className="bg-slate-900/50 rounded-2xl p-6 mb-10 text-left border border-slate-700">
            <h2 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-4">Langkah Perbaikan:</h2>
            <ol className="text-sm space-y-3 text-slate-300">
              <li className="flex items-start"><span className="bg-indigo-600 text-[10px] w-5 h-5 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">1</span> Buka Dashboard Vercel Proyek Anda</li>
              <li className="flex items-start"><span className="bg-indigo-600 text-[10px] w-5 h-5 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">2</span> Masuk ke menu <b className="text-white">Settings → Environment Variables</b></li>
              <li className="flex items-start"><span className="bg-indigo-600 text-[10px] w-5 h-5 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">3</span> Tambahkan <code className="text-indigo-300">SUPABASE_URL</code> dan <code className="text-indigo-300">SUPABASE_ANON_KEY</code></li>
              <li className="flex items-start"><span className="bg-indigo-600 text-[10px] w-5 h-5 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">4</span> Lakukan <b className="text-white">Redeploy</b> di Vercel</li>
            </ol>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">DPM-PTSP NTB • HR Analytics System</p>
        </div>
      </div>
    );
  }

  const handleSaveEmployee = async (emp: Employee) => {
    if (!supabase) return;
    try {
      if (selectedEmployee) {
        const { error } = await supabase.from('employees').update(emp).eq('id', emp.id);
        if (error) throw error;
        setEmployees(prev => prev.map(e => e.id === emp.id ? emp : e));
        setToast({ message: `Data ${emp.nama} diperbarui!`, type: 'success' });
      } else {
        const { error } = await supabase.from('employees').insert([emp]);
        if (error) throw error;
        setEmployees(prev => [emp, ...prev]);
        setToast({ message: `Pegawai ${emp.nama} ditambahkan!`, type: 'success' });
      }
    } catch (err: any) {
      setToast({ message: 'Gagal menyimpan ke cloud. Cek koneksi.', type: 'error' });
    }
    setTimeout(() => setToast(null), 4000);
    setSelectedEmployee(null);
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
      setEmployees(prev => prev.filter(e => e.id !== id));
      setToast({ message: 'Data telah dihapus dari cloud.', type: 'info' });
    } catch (err: any) {
      setToast({ message: 'Gagal menghapus data.', type: 'error' });
    }
    setTimeout(() => setToast(null), 4000);
  };

  const handleClearDatabase = async () => {
    if (!supabase) return;
    if (window.confirm('Hapus seluruh database cloud?')) {
      const confirmation = window.prompt('Ketik "HAPUS":');
      if (confirmation === 'HAPUS') {
        try {
          const ids = employees.map(e => e.id);
          const { error } = await supabase.from('employees').delete().in('id', ids);
          if (error) throw error;
          setEmployees([]);
          setToast({ message: 'Database cloud dikosongkan.', type: 'error' });
        } catch (err) {
          setToast({ message: 'Gagal membersihkan database.', type: 'error' });
        }
        setTimeout(() => setToast(null), 4000);
      }
    }
  };

  const pangkatEligible = useMemo(() => {
    return employees.filter(e => {
      const nextDate = getNextPromotion(e.tmtGolongan);
      const matchesMonth = selectedMonth === '' || nextDate.getMonth() === Number(selectedMonth);
      const matchesYear = selectedYear === '' || nextDate.getFullYear() === Number(selectedYear);
      return (selectedMonth === '' && selectedYear === '') ? isNear(nextDate) : (matchesMonth && matchesYear);
    });
  }, [employees, selectedMonth, selectedYear]);

  const kgbEligible = useMemo(() => {
    return employees.filter(e => {
      const nextDate = getNextKgb(e.tmtKgb);
      const matchesMonth = selectedMonth === '' || nextDate.getMonth() === Number(selectedMonth);
      const matchesYear = selectedYear === '' || nextDate.getFullYear() === Number(selectedYear);
      return (selectedMonth === '' && selectedYear === '') ? isNear(nextDate) : (matchesMonth && matchesYear);
    });
  }, [employees, selectedMonth, selectedYear]);

  const retirementEligible = useMemo(() => employees.filter(e => isNear(getRetirementDate(e.tanggalLahir))), [employees]);

  const filteredEmployees = useMemo(() => 
    employees.filter(e => e.nama.toLowerCase().includes(searchQuery.toLowerCase()) || e.nip.includes(searchQuery)),
    [employees, searchQuery]
  );

  const stats = [
    { label: 'Total Pegawai', value: employees.length, color: 'bg-blue-100 text-blue-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg> },
    { label: 'Usul Pangkat', value: pangkatEligible.length, color: 'bg-orange-100 text-orange-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg> },
    { label: 'Usul KGB', value: kgbEligible.length, color: 'bg-emerald-100 text-emerald-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1"/></svg> },
    { label: 'Pensiun', value: retirementEligible.length, color: 'bg-red-100 text-red-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"/></svg> },
  ];

  const chartData = useMemo(() => {
    const groups = employees.reduce((acc, curr) => {
      acc[curr.golongan] = (acc[curr.golongan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [employees]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <aside className="w-72 bg-slate-900 text-white flex flex-col hidden lg:flex shadow-2xl relative z-20">
        <div className="p-8 border-b border-slate-800 flex items-center space-x-4">
          <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-500/30">H</div>
          <div>
            <span className="text-xl font-black tracking-tight block">HR-Pro</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Cloud Connected</span>
          </div>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setCurrentView(item.id as ViewType)} className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${currentView === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'}`}>
              <div className={`${currentView === item.id ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`}>{item.icon}</div>
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-5 border border-slate-700/50 text-center">
             <div className="flex items-center justify-center space-x-2 mb-2">
               <div className={`w-2 h-2 rounded-full ${isLoadingData ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`}></div>
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                 {isLoadingData ? 'Synchronizing...' : 'Cloud Verified'}
               </span>
             </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {toast && (
          <div className="fixed top-24 right-8 z-50 animate-slideInRight">
            <div className={`px-8 py-5 rounded-[2rem] shadow-2xl flex items-center space-x-4 border ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : toast.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
              <div className={`p-2 rounded-xl ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'} text-white shadow-lg`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
              </div>
              <p className="font-black text-sm uppercase tracking-tight">{toast.message}</p>
            </div>
          </div>
        )}

        <header className="bg-white border-b border-gray-100 px-10 py-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{NAV_ITEMS.find(n => n.id === currentView)?.label}</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">DPMPTSP PROVINSI NTB</p>
          </div>
          <div className="flex items-center space-x-8">
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </span>
              <input type="text" placeholder="Cari NIP atau Nama..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-14 pr-8 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-300 outline-none w-[24rem] transition-all shadow-sm" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 bg-gray-50/50">
          {isLoadingData ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Menghubungkan ke Cloud Database...</p>
            </div>
          ) : (
            <div className="space-y-12 animate-fadeIn">
              {currentView === 'DASHBOARD' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {stats.map((s, idx) => <StatCard key={idx} {...s} />)}
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                    <div className="xl:col-span-2 bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-white">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-10">Statistik Golongan</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 800}} dy={15} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 800}} />
                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px', fontWeight: 'bold'}} />
                            <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={45}>
                              {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {currentView === 'DATA_PEGAWAI' && (
                <div className="space-y-10 animate-fadeIn">
                  <div className="flex justify-between items-end">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Database Pegawai Cloud</h2>
                    <div className="flex space-x-4">
                      <button onClick={handleClearDatabase} className="bg-rose-50 text-rose-600 px-8 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all border border-rose-100">Kosongkan Database</button>
                      <button onClick={() => { setSelectedEmployee(null); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center space-x-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                        <span>Tambah Pegawai</span>
                      </button>
                    </div>
                  </div>
                  <EmployeeTable employees={filteredEmployees} onAction={(e) => { setSelectedEmployee(e); setIsModalOpen(true); }} onDelete={handleDeleteEmployee} type="NORMAL" />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <EmployeeModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedEmployee(null); }} onSave={handleSaveEmployee} initialData={selectedEmployee} />
    </div>
  );
};

export default App;
