
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
  const [aiReport, setAiReport] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null);
  const [deptLogo, setDeptLogo] = useState<string>(DEFAULT_LOGO);
  
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Filter States
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth());
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const session = sessionStorage.getItem('hr_pro_auth');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
    
    // Load saved logo
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
    if (isSupabaseConfigured && supabase) {
      await fetchEmployees();
    } else {
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
      setEmployees(data || []);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setToast({ message: 'Gagal memuat data cloud', type: 'error' });
      setEmployees(MOCK_EMPLOYEES);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSaveEmployee = async (emp: Employee) => {
    const payload = {
      id: emp.id,
      nip: emp.nip || '',
      nama: emp.nama || '',
      jabatan: emp.jabatan || '',
      golongan: emp.golongan,
      tmtGolongan: emp.tmtGolongan,
      tmtKgb: emp.tmtKgb,
      tanggalLahir: emp.tanggalLahir,
      tempatLahir: emp.tempatLahir || null,
      noHp: emp.noHp || null,
      unitKerja: emp.unitKerja || null,
      avatar: emp.avatar || null,
      gajiPokokLama: emp.gajiPokokLama || null,
      nomorSkpTerakhir: emp.nomorSkpTerakhir || null,
      tglSkpTerakhir: emp.tglSkpTerakhir || null,
      tglMulaiGajiLama: emp.tglMulaiGajiLama || null,
      masaKerjaGolonganLama: emp.masaKerjaGolonganLama || null,
      gajiPokokBaru: emp.gajiPokokBaru || null,
      masaKerjaBaru: emp.masaKerjaBaru || null,
      golonganBaru: emp.golonganBaru || null,
      keterangan: emp.keterangan || null
    };

    if (isSupabaseConfigured && supabase) {
      try {
        let result;
        if (selectedEmployee) {
          result = await supabase.from('employees').update(payload).eq('id', emp.id);
        } else {
          result = await supabase.from('employees').insert([payload]);
        }
        if (result.error) throw result.error;
        await fetchEmployees();
        setToast({ message: 'Berhasil sinkronisasi!', type: 'success' });
      } catch (err: any) {
        setToast({ message: `Error DB: ${err.message}`, type: 'error' });
      }
    } else {
      if (selectedEmployee) {
        setEmployees(prev => prev.map(e => e.id === emp.id ? emp : e));
      } else {
        setEmployees(prev => [emp, ...prev]);
      }
      setToast({ message: 'Tersimpan (Lokal)', type: 'info' });
    }
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteEmployee = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('employees').delete().eq('id', id);
        setEmployees(prev => prev.filter(e => e.id !== id));
      } catch (err) {}
    } else {
      setEmployees(prev => prev.filter(e => e.id !== id));
    }
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

  // Logika filter gabungan untuk monitoring yang diperbaiki
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
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setCurrentView(item.id as ViewType)} className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all ${currentView === item.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <div className={`${currentView === item.id ? 'text-white' : 'text-slate-500'}`}>{item.icon}</div>
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6">
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-3 px-5 py-4 rounded-2xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all font-bold text-xs uppercase tracking-widest border border-transparent hover:border-rose-500/20">
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {toast && (
          <div className="fixed top-24 right-8 z-50 animate-slideInRight">
            <div className={`px-8 py-4 rounded-2xl shadow-2xl border ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
              <p className="font-black text-xs uppercase tracking-widest">{toast.message}</p>
            </div>
          </div>
        )}

        <header className="bg-white border-b border-gray-100 px-10 py-8 flex items-center justify-between z-10 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{NAV_ITEMS.find(n => n.id === currentView)?.label}</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sistem Kontrol Pegawai</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </span>
              <input type="text" placeholder="Cari Pegawai..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-14 pr-8 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-slate-700 outline-none w-[18rem] focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-gray-50/50">
          <div className="space-y-10">
            {currentView === 'DASHBOARD' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {stats.map((s, idx) => <StatCard key={idx} {...s} />)}
                </div>
                <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-white">
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
              </>
            )}

            {currentView === 'DATA_PEGAWAI' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Daftar Pegawai</h2>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      onChange={handleLogoUpload} 
                      className="hidden" 
                      accept=".ico,.png,.jpg,.jpeg" 
                    />
                    <button 
                      onClick={() => logoInputRef.current?.click()} 
                      className="bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center space-x-3 shadow-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      <span>Set Logo (.ico)</span>
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
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pilih periode untuk pemantauan tepat</p>
                  </div>
                  
                  {/* Period Selection Filters */}
                  <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <div className="flex items-center space-x-2 px-3">
                       <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                       <select value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value))} className="bg-transparent border-none font-black text-[10px] uppercase tracking-widest text-slate-700 outline-none cursor-pointer focus:ring-0">
                          {MONTHS.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
                       </select>
                    </div>
                    <div className="w-px h-5 bg-slate-200"></div>
                    <div className="px-3">
                       <select value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))} className="bg-transparent border-none font-black text-[10px] uppercase tracking-widest text-slate-700 outline-none cursor-pointer focus:ring-0">
                          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                       </select>
                    </div>
                  </div>
                </div>
                
                <EmployeeTable 
                  employees={monitoringData} 
                  onAction={(e) => { setSelectedEmployee(e); setIsModalOpen(true); }} 
                  onDelete={handleDeleteEmployee}
                  type={currentView === 'KONTROL_PANGKAT' ? 'PANGKAT' : currentView === 'KONTROL_KGB' ? 'KGB' : 'PENSIUN'} 
                  selectedPeriod={{ month: filterMonth, year: filterYear }}
                />

                {monitoringData.length === 0 && (
                  <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-[2rem] p-16 text-center">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tidak ada data untuk periode ini</p>
                  </div>
                )}
              </div>
            )}

            {currentView === 'AI_REPORT' && (
              <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-indigo-50 text-center space-y-8 max-w-3xl mx-auto">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                   <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Analisis Kepegawaian AI</h2>
                <button onClick={generateAiReport} disabled={isLoadingAi} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all">
                  {isLoadingAi ? 'Menganalisis...' : 'Mulai Analisis'}
                </button>
                {aiReport && (
                  <div className="text-left bg-slate-50 p-8 rounded-[2rem] border border-slate-100 animate-fadeIn whitespace-pre-wrap font-medium text-slate-700 text-sm leading-relaxed">
                    {aiReport}
                  </div>
                )}
              </div>
            )}
          </div>
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
