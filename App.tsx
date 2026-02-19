
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ViewType, Employee } from './types';
import { NAV_ITEMS, MOCK_EMPLOYEES } from './constants';
import StatCard from './components/StatCard';
import EmployeeTable from './components/EmployeeTable';
import EmployeeModal from './components/EmployeeModal';
import LoginView from './components/LoginView';
import { getNextPromotion, getNextKgb, getRetirementDate, isNear, isDueInPeriod, isDueSoon, parseDateString } from './utils/dateUtils';
import { getAIAnalysis } from './services/geminiService';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DEFAULT_LOGO = "https://upload.wikimedia.org/wikipedia/commons/0/07/Coat_of_arms_of_West_Nusa_Tenggara.png";

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<ViewType>('DASHBOARD');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [dbMode, setDbMode] = useState<'CLOUD' | 'LOCAL'>('LOCAL');
  const [aiReport, setAiReport] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null);
  const [deptLogo, setDeptLogo] = useState<string>(DEFAULT_LOGO);
  const [lastSync, setLastSync] = useState<string>('');
  
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Filter States
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth());
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const session = sessionStorage.getItem('hr_pro_auth');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
    
    const savedLogo = localStorage.getItem('dept_logo_base64');
    if (savedLogo) {
      setDeptLogo(savedLogo);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  const handleLogin = (status: boolean) => {
    if (status) {
      setIsAuthenticated(true);
      sessionStorage.setItem('hr_pro_auth', 'true');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('hr_pro_auth');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setDeptLogo(base64);
      localStorage.setItem('dept_logo_base64', base64);
      setToast({ message: 'Logo instansi diperbarui!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const loadInitialData = async () => {
    setIsLoadingData(true);
    
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .order('nama', { ascending: true });

        if (error) throw error;
        
        setEmployees(data || []);
        setDbMode('CLOUD');
        setLastSync(new Date().toLocaleTimeString('id-ID'));
        setToast({ message: 'Data Online Berhasil Disinkronkan', type: 'success' });
      } catch (err: any) {
        console.warn("Koneksi Cloud bermasalah:", err.message);
        setEmployees(MOCK_EMPLOYEES);
        setDbMode('LOCAL');
      }
    } else {
      setEmployees(MOCK_EMPLOYEES);
      setDbMode('LOCAL');
    }
    
    setIsLoadingData(false);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchEmployees = async () => {
    if (!supabase || dbMode === 'LOCAL') return;
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('nama', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
      setLastSync(new Date().toLocaleTimeString('id-ID'));
    } catch (err: any) {
      console.error("Sinkronisasi gagal:", err.message);
    }
  };

  const handleSaveEmployee = async (emp: Employee) => {
    if (dbMode === 'CLOUD' && supabase) {
      try {
        const payload = { ...emp };
        delete (payload as any).avatar;

        let result;
        if (selectedEmployee) {
          result = await supabase.from('employees').update(payload).eq('id', emp.id);
        } else {
          result = await supabase.from('employees').insert([payload]);
        }
        
        if (result.error) throw result.error;
        await fetchEmployees();
        setToast({ message: 'Berhasil disimpan ke Cloud (Terlihat oleh semua staf)!', type: 'success' });
      } catch (err: any) {
        setToast({ message: 'Gagal simpan ke cloud: ' + err.message, type: 'error' });
      }
    } else {
      if (selectedEmployee) {
        setEmployees(prev => prev.map(e => e.id === emp.id ? emp : e));
      } else {
        setEmployees(prev => [emp, ...prev]);
      }
      setToast({ message: 'Data disimpan di memori lokal', type: 'info' });
    }
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteEmployee = async (id: string) => {
    if (dbMode === 'CLOUD' && supabase) {
      try {
        await supabase.from('employees').delete().eq('id', id);
        await fetchEmployees();
        setToast({ message: 'Data dihapus dari sistem online', type: 'success' });
      } catch (err) {}
    } else {
      setEmployees(prev => prev.filter(e => e.id !== id));
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
    { label: 'Usul Pangkat', value: employees.filter(e => isDueSoon(e.tmtGolongan, 4)).length, color: 'bg-orange-100 text-orange-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg> },
    { label: 'Usul KGB', value: employees.filter(e => isDueSoon(e.tmtKgb, 2)).length, color: 'bg-emerald-100 text-emerald-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1"/></svg> },
    { label: 'Pensiun', value: employees.filter(e => isNear(getRetirementDate(e.tanggalLahir))).length, color: 'bg-red-100 text-red-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"/></svg> },
  ];

  const chartData = useMemo(() => {
    const groups = employees.reduce((acc, curr) => {
      acc[curr.golongan] = (acc[curr.golongan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [employees]);

  const monitoringData = useMemo(() => {
    return employees.filter(e => {
      const matchesSearch = e.nama.toLowerCase().includes(searchQuery.toLowerCase()) || e.nip.includes(searchQuery);
      if (!matchesSearch) return false;

      if (currentView === 'KONTROL_PANGKAT') {
        return isDueInPeriod(e.tmtGolongan, filterMonth, filterYear, 4);
      }
      if (currentView === 'KONTROL_KGB') {
        return isDueInPeriod(e.tmtKgb, filterMonth, filterYear, 2);
      }
      if (currentView === 'KONTROL_PENSIUN') {
        const pensionDate = getRetirementDate(e.tanggalLahir);
        return pensionDate.getMonth() === filterMonth && pensionDate.getFullYear() === filterYear;
      }
      return true;
    });
  }, [employees, currentView, filterMonth, filterYear, searchQuery]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 10; i++) years.push(i);
    return years;
  }, []);

  if (!isAuthenticated) return <LoginView onLogin={handleLogin} />;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-slate-900">
      <aside className="w-72 bg-slate-900 text-white flex flex-col hidden lg:flex shadow-2xl relative z-20">
        <div className="p-8 border-b border-slate-800 flex items-center space-x-4">
          <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center font-black text-2xl">H</div>
          <div>
            <span className="text-xl font-black tracking-tight block">HR-Pro</span>
            <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">DPMPTSP NTB</span>
          </div>
        </div>
        
        <div className="px-8 py-4 space-y-3">
           <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest ${dbMode === 'CLOUD' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'}`}>
              <div className={`w-2 h-2 rounded-full ${dbMode === 'CLOUD' ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500'}`}></div>
              <span>Status: {dbMode === 'CLOUD' ? 'Online & Terbagi' : 'Mode Offline'}</span>
           </div>
           {dbMode === 'CLOUD' && (
             <div className="px-4 text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                Sinkron Terakhir: {lastSync}
             </div>
           )}
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setCurrentView(item.id as ViewType)} className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all ${currentView === item.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <div className={`${currentView === item.id ? 'text-white' : 'text-slate-500'}`}>{item.icon}</div>
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-6 space-y-3 border-t border-slate-800">
          <div className="flex items-center space-x-3 px-5 py-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-[10px] font-bold text-indigo-400">
              ST
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-200">Staf Kepegawaian</p>
              <p className="text-[8px] text-slate-500 uppercase font-bold">Akses Admin Tim</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-3 px-5 py-4 rounded-2xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all font-bold text-xs uppercase tracking-widest border border-transparent hover:border-rose-500/20">
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {toast && (
          <div className="fixed top-24 right-8 z-50 animate-slideInRight">
            <div className={`px-8 py-4 rounded-2xl shadow-2xl border ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : toast.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
              <p className="font-black text-xs uppercase tracking-widest">{toast.message}</p>
            </div>
          </div>
        )}

        <header className="bg-white border-b border-gray-100 px-10 py-8 flex items-center justify-between z-10 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{NAV_ITEMS.find(n => n.id === currentView)?.label}</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sistem Kolaborasi Kepegawaian</p>
          </div>
          <div className="flex items-center space-x-6">
            <button 
              onClick={loadInitialData}
              title="Refresh Data Online"
              className="p-3.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all"
            >
              <svg className={`w-5 h-5 ${isLoadingData ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </span>
              <input type="text" placeholder="Cari Pegawai..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-14 pr-8 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-slate-700 outline-none w-[18rem] focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-gray-50/50">
          {isLoadingData ? (
             <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Menarik Data dari Cloud...</p>
             </div>
          ) : (
            <div className="space-y-10">
              {currentView === 'DASHBOARD' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {stats.map((s, idx) => <StatCard key={idx} {...s} />)}
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-xl border border-white">
                      <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Distribusi Golongan</h3>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                            <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={40}>
                              {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center space-x-3 mb-6">
                           <div className="p-3 bg-white/10 rounded-2xl">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                           </div>
                           <h3 className="text-lg font-black tracking-tight">Akses Multi-Staf</h3>
                        </div>
                        <p className="text-sm font-medium text-indigo-100 leading-relaxed">
                          Aplikasi ini tersinkronisasi secara online. Bagikan URL ini kepada staf kepegawaian lain agar mereka dapat membantu mengelola data secara real-time.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                           <p className="text-[8px] uppercase font-black text-indigo-200 tracking-[0.2em] mb-1">Kode Akses Tim</p>
                           <p className="text-lg font-mono font-black tracking-widest">admin123</p>
                        </div>
                        <button 
                          onClick={() => { navigator.clipboard.writeText(window.location.href); setToast({message: 'Link aplikasi disalin!', type: 'info'}); setTimeout(()=>setToast(null), 2000); }}
                          className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center justify-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                          <span>Bagikan Link Aplikasi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {currentView === 'DATA_PEGAWAI' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Database Pusat</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Terhubung: {dbMode === 'CLOUD' ? 'Cloud NTB' : 'Internal'}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept=".ico,.png,.jpg,.jpeg" />
                      <button onClick={() => logoInputRef.current?.click()} className="bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center space-x-3 shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        <span>Set Logo</span>
                      </button>
                      <button onClick={() => { setSelectedEmployee(null); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center space-x-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                        <span>Pegawai Baru</span>
                      </button>
                    </div>
                  </div>
                  <EmployeeTable employees={filteredEmployees} onAction={(e) => { setSelectedEmployee(e); setIsModalOpen(true); }} onDelete={handleDeleteEmployee} type="NORMAL" />
                </div>
              )}

              {(currentView === 'KONTROL_PANGKAT' || currentView === 'KONTROL_KGB' || currentView === 'KONTROL_PENSIUN') && (
                <div className="space-y-8">
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                    <div className="flex-1">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">Monitoring {currentView.split('_')[1]}</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pilih periode pemantauan</p>
                    </div>
                    <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                      <select value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value))} className="bg-transparent border-none font-black text-[10px] uppercase tracking-widest text-slate-700 outline-none cursor-pointer focus:ring-0">
                        {MONTHS.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
                      </select>
                      <div className="w-px h-5 bg-slate-200"></div>
                      <select value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))} className="bg-transparent border-none font-black text-[10px] uppercase tracking-widest text-slate-700 outline-none cursor-pointer focus:ring-0">
                        {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                  <EmployeeTable 
                    employees={monitoringData} 
                    onAction={(e) => { setSelectedEmployee(e); setIsModalOpen(true); }} 
                    onDelete={handleDeleteEmployee}
                    type={currentView === 'KONTROL_PANGKAT' ? 'PANGKAT' : currentView === 'KONTROL_KGB' ? 'KGB' : 'PENSIUN'} 
                    selectedPeriod={{ month: filterMonth, year: filterYear }}
                  />
                </div>
              )}

              {currentView === 'AI_REPORT' && (
                <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-indigo-50 text-center space-y-8 max-w-3xl mx-auto">
                  <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-100">
                     <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Analisis Kepegawaian AI</h2>
                  <p className="text-sm text-slate-500 font-medium max-w-md mx-auto leading-relaxed">AI akan memproses seluruh data pegawai di cloud untuk memberikan rekomendasi regenerasi dan pemantauan pensiun.</p>
                  <button onClick={generateAiReport} disabled={isLoadingAi} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100">
                    {isLoadingAi ? 'Menganalisis Cloud...' : 'Mulai Analisis Sekarang'}
                  </button>
                  {aiReport && (
                    <div className="text-left bg-slate-50 p-8 rounded-[2rem] border border-slate-100 animate-fadeIn whitespace-pre-wrap font-medium text-slate-700 text-sm leading-relaxed">
                      {aiReport}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <EmployeeModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedEmployee(null); }} 
        onSave={handleSaveEmployee} 
        initialData={selectedEmployee} 
        onDelete={handleDeleteEmployee} 
        deptLogo={deptLogo}
      />
    </div>
  );
};

export default App;
