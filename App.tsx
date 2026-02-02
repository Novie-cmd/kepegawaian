
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
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [aiReport, setAiReport] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null);

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<number | string>('');
  const [selectedYear, setSelectedYear] = useState<number | string>('');

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    if (isSupabaseConfigured && supabase) {
      await fetchEmployees();
    } else {
      // Jika belum setting Supabase, pakai data demo agar aplikasi tidak kosong
      setEmployees(MOCK_EMPLOYEES);
      setIsLoadingData(false);
    }
  };

  const fetchEmployees = async () => {
    if (!supabase) return;
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('nama', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setEmployees(data);
      } else if (data && data.length === 0) {
        // Jika database baru dibuat dan masih kosong, isi dengan data awal
        setEmployees(MOCK_EMPLOYEES);
      }
    } catch (err: any) {
      console.error('Fetch error:', err.message);
      setToast({ message: 'Cloud error: Menggunakan data lokal sementara.', type: 'error' });
      setEmployees(MOCK_EMPLOYEES);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSaveEmployee = async (emp: Employee) => {
    if (isSupabaseConfigured && supabase) {
      try {
        if (selectedEmployee) {
          const { error } = await supabase.from('employees').update(emp).eq('id', emp.id);
          if (error) throw error;
          setEmployees(prev => prev.map(e => e.id === emp.id ? emp : e));
          setToast({ message: `Data ${emp.nama} diperbarui di Cloud!`, type: 'success' });
        } else {
          const { error } = await supabase.from('employees').insert([emp]);
          if (error) throw error;
          setEmployees(prev => [emp, ...prev]);
          setToast({ message: `Pegawai ${emp.nama} berhasil disimpan ke Cloud!`, type: 'success' });
        }
      } catch (err: any) {
        setToast({ message: 'Gagal simpan ke Cloud: ' + err.message, type: 'error' });
      }
    } else {
      // Demo Mode
      if (selectedEmployee) {
        setEmployees(prev => prev.map(e => e.id === emp.id ? emp : e));
      } else {
        setEmployees(prev => [emp, ...prev]);
      }
      setToast({ message: 'Mode Demo: Disimpan di browser ini saja.', type: 'info' });
    }
    setTimeout(() => setToast(null), 3000);
    setSelectedEmployee(null);
  };

  const handleDeleteEmployee = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('employees').delete().eq('id', id);
        if (error) throw error;
        setEmployees(prev => prev.filter(e => e.id !== id));
        setToast({ message: 'Data dihapus dari sistem Cloud', type: 'success' });
      } catch (err: any) {
        setToast({ message: 'Gagal hapus di Cloud.', type: 'error' });
      }
    } else {
      setEmployees(prev => prev.filter(e => e.id !== id));
      setToast({ message: 'Data dihapus (Mode Demo)', type: 'info' });
    }
    setTimeout(() => setToast(null), 3000);
  };

  const generateAiReport = async () => {
    setIsLoadingAi(true);
    const report = await getAIAnalysis(employees);
    setAiReport(report);
    setIsLoadingAi(false);
  };

  const filteredEmployees = useMemo(() => 
    employees.filter(e => e.nama.toLowerCase().includes(searchQuery.toLowerCase()) || e.nip.includes(searchQuery)),
    [employees, searchQuery]
  );

  const stats = [
    { label: 'Total Pegawai', value: employees.length, color: 'bg-blue-100 text-blue-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg> },
    { label: 'Usul Pangkat', value: employees.filter(e => isNear(getNextPromotion(e.tmtGolongan))).length, color: 'bg-orange-100 text-orange-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg> },
    { label: 'Usul KGB', value: employees.filter(e => isNear(getNextKgb(e.tmtKgb))).length, color: 'bg-emerald-100 text-emerald-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1"/></svg> },
    { label: 'Pensiun', value: employees.filter(e => isNear(getRetirementDate(e.tanggalLahir))).length, color: 'bg-red-100 text-red-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"/></svg> },
  ];

  const chartData = useMemo(() => {
    const groups = employees.reduce((acc, curr) => {
      acc[curr.golongan] = (acc[curr.golongan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [employees]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-slate-900">
      <aside className="w-72 bg-slate-900 text-white flex flex-col hidden lg:flex shadow-2xl relative z-20">
        <div className="p-8 border-b border-slate-800 flex items-center space-x-4">
          <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-500/30">H</div>
          <div>
            <span className="text-xl font-black tracking-tight block">HR-Pro</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
              {isSupabaseConfigured ? 'Sistem Terintegrasi' : 'Mode Demo'}
            </span>
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
               <div className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`}></div>
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                 {isSupabaseConfigured ? 'Database Online' : 'Local Storage Only'}
               </span>
             </div>
             {!isSupabaseConfigured && (
               <p className="text-[9px] text-slate-500 mt-2 font-medium leading-relaxed italic">Hapus proyek Vercel lama dan masukkan API Key untuk mengaktifkan Cloud.</p>
             )}
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
            <button onClick={fetchEmployees} className={`p-3 text-slate-400 hover:text-indigo-600 transition-all ${isLoadingData ? 'animate-spin' : ''}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </span>
              <input type="text" placeholder="Cari NIP atau Nama..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-14 pr-8 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-300 outline-none w-[20rem] transition-all shadow-sm" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 bg-gray-50/50">
          {isLoadingData ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Sinkronisasi Data...</p>
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
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-10">Distribusi Golongan</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 800}} dy={15} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 800}} />
                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px', fontWeight: 'bold'}} />
                            <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={45}>
                              {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {currentView === 'DATA_PEGAWAI' && (
                <div className="space-y-10">
                  <div className="flex justify-between items-center">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Master Data Pegawai</h2>
                    <button onClick={() => { setSelectedEmployee(null); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center space-x-4">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                      <span>Tambah Pegawai</span>
                    </button>
                  </div>
                  <EmployeeTable employees={filteredEmployees} onAction={(e) => { setSelectedEmployee(e); setIsModalOpen(true); }} onDelete={handleDeleteEmployee} type="NORMAL" />
                </div>
              )}

              {(currentView === 'KONTROL_PANGKAT' || currentView === 'KONTROL_KGB' || currentView === 'KONTROL_PENSIUN') && (
                <div className="space-y-10">
                   <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap items-center gap-6">
                    <div className="flex-1">
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Monitoring {currentView === 'KONTROL_PANGKAT' ? 'Kenaikan Pangkat' : currentView === 'KONTROL_KGB' ? 'Kenaikan Gaji Berkala' : 'Pensiun'}</h2>
                      <p className="text-xs text-slate-400 font-bold uppercase mt-1">Data otomatis ditarik dari Database Cloud</p>
                    </div>
                  </div>
                  <EmployeeTable 
                    employees={employees.filter(e => {
                      if (currentView === 'KONTROL_PANGKAT') return isNear(getNextPromotion(e.tmtGolongan));
                      if (currentView === 'KONTROL_KGB') return isNear(getNextKgb(e.tmtKgb));
                      return isNear(getRetirementDate(e.tanggalLahir));
                    })} 
                    onAction={(e) => { setSelectedEmployee(e); setIsModalOpen(true); }} 
                    onDelete={handleDeleteEmployee}
                    type={currentView === 'KONTROL_PANGKAT' ? 'PANGKAT' : currentView === 'KONTROL_KGB' ? 'KGB' : 'PENSIUN'} 
                  />
                </div>
              )}

              {currentView === 'AI_REPORT' && (
                <div className="space-y-10 max-w-4xl mx-auto">
                  <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-indigo-50 text-center space-y-8">
                    <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-indigo-200">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                    </div>
                    <div className="space-y-4">
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">Analisis Data Strategis AI</h2>
                      <p className="text-slate-500 font-medium">Berdasarkan data cloud terbaru yang diinput semua orang.</p>
                    </div>
                    <button onClick={generateAiReport} disabled={isLoadingAi} className="bg-indigo-600 text-white px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center space-x-4 mx-auto disabled:opacity-50">
                      {isLoadingAi ? <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>}
                      <span>Mulai Analisis Global</span>
                    </button>
                    {aiReport && (
                      <div className="text-left bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 animate-fadeIn whitespace-pre-wrap font-medium leading-relaxed text-slate-700 shadow-inner">
                        {aiReport}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <EmployeeModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedEmployee(null); }} onSave={handleSaveEmployee} initialData={selectedEmployee} onDelete={handleDeleteEmployee} />
    </div>
  );
};

export default App;
