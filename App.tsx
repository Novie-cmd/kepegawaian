
import React, { useState, useMemo, useEffect } from 'react';
import { ViewType, Employee } from './types';
import { NAV_ITEMS } from './constants';
import StatCard from './components/StatCard';
import EmployeeTable from './components/EmployeeTable';
import EmployeeModal from './components/EmployeeModal';
import { getNextPromotion, getNextKgb, getRetirementDate, isNear } from './utils/dateUtils';
import { getAIAnalysis } from './services/geminiService';
import { supabase } from './services/supabaseClient';
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

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 2 + i);
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  // Fetch data from Supabase on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
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
      setToast({ message: 'Gagal memuat data dari Cloud.', type: 'error' });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSaveEmployee = async (emp: Employee) => {
    try {
      if (selectedEmployee) {
        // Update existing
        const { error } = await supabase
          .from('employees')
          .update(emp)
          .eq('id', emp.id);
        
        if (error) throw error;
        setEmployees(prev => prev.map(e => e.id === emp.id ? emp : e));
        setToast({ message: `Data ${emp.nama} berhasil diperbarui di Cloud!`, type: 'success' });
      } else {
        // Insert new
        const { error } = await supabase
          .from('employees')
          .insert([emp]);
        
        if (error) throw error;
        setEmployees(prev => [emp, ...prev]);
        setToast({ message: `Pegawai ${emp.nama} berhasil ditambahkan ke Database!`, type: 'success' });
      }
    } catch (err: any) {
      console.error('Save error:', err.message);
      setToast({ message: 'Terjadi kesalahan saat menyimpan ke Cloud.', type: 'error' });
    }
    setTimeout(() => setToast(null), 4000);
    setSelectedEmployee(null);
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      const empToDelete = employees.find(e => e.id === id);
      setEmployees(prev => prev.filter(e => e.id !== id));
      setToast({ message: `Pegawai ${empToDelete?.nama || 'pilihan'} telah dihapus.`, type: 'info' });
    } catch (err: any) {
      console.error('Delete error:', err.message);
      setToast({ message: 'Gagal menghapus data dari Cloud.', type: 'error' });
    }
    setTimeout(() => setToast(null), 4000);
    if (selectedEmployee?.id === id) {
      setSelectedEmployee(null);
      setIsModalOpen(false);
    }
  };

  const handleClearDatabase = async () => {
    if (window.confirm('PERINGATAN: Anda akan menghapus SELURUH database pegawai di CLOUD. Tindakan ini tidak dapat dibatalkan. Lanjutkan?')) {
      const confirmation = window.prompt('Ketik "HAPUS" untuk mengonfirmasi penghapusan seluruh database:');
      if (confirmation === 'HAPUS') {
        try {
          // In Supabase, often we use a function or delete without filter (if RLS allows)
          // For safety, let's delete all rows that have an ID
          const ids = employees.map(e => e.id);
          const { error } = await supabase
            .from('employees')
            .delete()
            .in('id', ids);
          
          if (error) throw error;
          setEmployees([]);
          setToast({ message: 'Seluruh database cloud telah dikosongkan.', type: 'error' });
        } catch (err: any) {
          setToast({ message: 'Gagal membersihkan database cloud.', type: 'error' });
        }
        setTimeout(() => setToast(null), 4000);
      }
    }
  };

  // Logic for Pangkat Filtering
  const pangkatEligible = useMemo(() => {
    return employees.filter(e => {
      const nextDate = getNextPromotion(e.tmtGolongan);
      const matchesMonth = selectedMonth === '' || nextDate.getMonth() === Number(selectedMonth);
      const matchesYear = selectedYear === '' || nextDate.getFullYear() === Number(selectedYear);
      
      if (selectedMonth === '' && selectedYear === '') {
        return isNear(nextDate);
      }
      return matchesMonth && matchesYear;
    });
  }, [employees, selectedMonth, selectedYear]);

  // Logic for KGB Filtering
  const kgbEligible = useMemo(() => {
    return employees.filter(e => {
      const nextDate = getNextKgb(e.tmtKgb);
      const matchesMonth = selectedMonth === '' || nextDate.getMonth() === Number(selectedMonth);
      const matchesYear = selectedYear === '' || nextDate.getFullYear() === Number(selectedYear);
      
      if (selectedMonth === '' && selectedYear === '') {
        return isNear(nextDate);
      }
      return matchesMonth && matchesYear;
    });
  }, [employees, selectedMonth, selectedYear]);

  const retirementEligible = useMemo(() => 
    employees.filter(e => isNear(getRetirementDate(e.tanggalLahir))),
    [employees]
  );

  const filteredEmployees = useMemo(() => 
    employees.filter(e => 
      e.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
      e.nip.includes(searchQuery)
    ),
    [employees, searchQuery]
  );

  const stats = [
    { label: 'Total Pegawai', value: employees.length, color: 'bg-blue-100 text-blue-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg> },
    { label: 'Usul Pangkat (Filter)', value: pangkatEligible.length, color: 'bg-orange-100 text-orange-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg> },
    { label: 'Usul KGB (Filter)', value: kgbEligible.length, color: 'bg-emerald-100 text-emerald-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1"/></svg> },
    { label: 'Pensiun (12 Bln)', value: retirementEligible.length, color: 'bg-red-100 text-red-600', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"/></svg> },
  ];

  const handleGenerateAI = async () => {
    setIsLoadingAi(true);
    const result = await getAIAnalysis(employees);
    setAiReport(result || 'Gagal memuat laporan AI.');
    setIsLoadingAi(false);
  };

  const handleOpenDetail = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsModalOpen(true);
  };

  const resetFilters = () => {
    setSelectedMonth('');
    setSelectedYear('');
  };

  const chartData = useMemo(() => {
    const groups = employees.reduce((acc, curr) => {
      acc[curr.golongan] = (acc[curr.golongan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [employees]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const FilterBar = () => (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-white flex flex-wrap items-end gap-8 mb-10">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Filter Bulan Pelaksanaan</label>
        <select 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-300 transition-all"
        >
          <option value="">Semua Bulan</option>
          {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
      </div>
      <div className="flex-1 min-w-[200px]">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Filter Tahun Pelaksanaan</label>
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(e.target.value)}
          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-300 transition-all"
        >
          <option value="">Semua Tahun</option>
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <button 
        onClick={resetFilters}
        className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
      >
        Bersihkan Filter
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <aside className="w-72 bg-slate-900 text-white flex flex-col hidden lg:flex shadow-2xl relative z-20">
        <div className="p-8 border-b border-slate-800 flex items-center space-x-4">
          <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-500/30">H</div>
          <div>
            <span className="text-xl font-black tracking-tight block">HR-Pro</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Cloud Enterprise</span>
          </div>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id as ViewType);
                resetFilters();
              }}
              className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                currentView === item.id 
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 translate-x-1' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'
              }`}
            >
              <div className={`${currentView === item.id ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`}>
                {item.icon}
              </div>
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-5 border border-slate-700/50 text-center">
             <div className="flex items-center justify-center space-x-2 mb-2">
               <div className={`w-2 h-2 rounded-full ${isLoadingData ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`}></div>
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                 {isLoadingData ? 'Syncing...' : 'Cloud Connected'}
               </span>
             </div>
             <p className="text-[10px] text-slate-500 font-bold">Data terpusat untuk seluruh tim</p>
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
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {NAV_ITEMS.find(n => n.id === currentView)?.label}
            </h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Sistem Manajemen SDM Terintegrasi</p>
          </div>
          <div className="flex items-center space-x-8">
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </span>
              <input 
                type="text" 
                placeholder="Cari NIP atau Nama..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 pr-8 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-300 outline-none w-[24rem] transition-all shadow-sm"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 bg-gray-50/50">
          {isLoadingData ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Menyinkronkan dengan Database Cloud...</p>
            </div>
          ) : (
            <>
              {currentView === 'DASHBOARD' && (
                <div className="space-y-12 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {stats.map((s, idx) => <StatCard key={idx} {...s} />)}
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                    <div className="xl:col-span-2 bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-white">
                      <div className="flex justify-between items-center mb-10">
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Profil Golongan Pegawai</h3>
                      </div>
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
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-white flex flex-col">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-8">Akses Cepat</h3>
                      <div className="grid grid-cols-1 gap-6 flex-1">
                        <button onClick={() => { setSelectedEmployee(null); setIsModalOpen(true); }} className="flex items-center p-6 bg-indigo-600 rounded-[2rem] hover:bg-indigo-700 transition-all group shadow-2xl shadow-indigo-600/30">
                          <div className="bg-white/20 p-4 rounded-2xl mr-5 group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                          </div>
                          <div className="text-left">
                            <span className="text-base font-black text-white block uppercase tracking-wider">Tambah Pegawai</span>
                            <span className="text-xs text-indigo-200 font-bold uppercase tracking-widest opacity-80">Manual / AI Scan</span>
                          </div>
                        </button>
                        <button onClick={() => setCurrentView('KONTROL_PANGKAT')} className="flex items-center p-6 bg-white border-2 border-slate-50 rounded-[2rem] hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group shadow-sm">
                          <div className="bg-orange-100 p-4 rounded-2xl mr-5 text-orange-600 group-hover:scale-110 transition-transform shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                          </div>
                          <div className="text-left"><span className="text-base font-black text-slate-800 block uppercase tracking-wider">Cek Pangkat</span></div>
                        </button>
                        <button onClick={() => setCurrentView('KONTROL_KGB')} className="flex items-center p-6 bg-white border-2 border-slate-50 rounded-[2rem] hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group shadow-sm">
                          <div className="bg-emerald-100 p-4 rounded-2xl mr-5 text-emerald-600 group-hover:scale-110 transition-transform shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1"/></svg>
                          </div>
                          <div className="text-left"><span className="text-base font-black text-slate-800 block uppercase tracking-wider">Monitoring KGB</span></div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentView === 'DATA_PEGAWAI' && (
                <div className="space-y-10 animate-fadeIn">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-4xl font-black text-slate-900 tracking-tight">Database Pegawai</h2>
                      <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-2">Arsip Digital Terpusat (Cloud)</p>
                    </div>
                    <div className="flex space-x-4">
                      <button 
                        onClick={handleClearDatabase}
                        className="bg-rose-50 text-rose-600 px-8 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-rose-600 hover:text-white hover:-translate-y-1 transition-all flex items-center space-x-4 border border-rose-100"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        <span>Kosongkan Cloud</span>
                      </button>
                      <button onClick={() => { setSelectedEmployee(null); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center space-x-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                        <span>Tambah Pegawai</span>
                      </button>
                    </div>
                  </div>
                  <EmployeeTable employees={filteredEmployees} onAction={handleOpenDetail} onDelete={handleDeleteEmployee} type="NORMAL" />
                </div>
              )}

              {currentView === 'KONTROL_PANGKAT' && (
                <div className="space-y-10 animate-fadeIn">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-12 rounded-[3.5rem] shadow-2xl shadow-orange-500/20 text-white flex items-center justify-between mb-10 border border-orange-400/20">
                    <div className="max-w-xl">
                      <h2 className="text-4xl font-black tracking-tight mb-4">Kontrol Kenaikan Pangkat</h2>
                      <p className="text-orange-100 font-bold text-base leading-relaxed opacity-90">Sistem cerdas memprediksi masa kenaikan pangkat setiap 4 tahun secara otomatis.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[7rem] font-black leading-none opacity-20 -mb-6 tracking-tighter">{pangkatEligible.length}</p>
                      <p className="font-black uppercase tracking-widest text-xs">Total Usulan</p>
                    </div>
                  </div>
                  <FilterBar />
                  <EmployeeTable employees={pangkatEligible} type="PANGKAT" onAction={handleOpenDetail} onDelete={handleDeleteEmployee} />
                </div>
              )}

              {currentView === 'KONTROL_KGB' && (
                <div className="space-y-10 animate-fadeIn">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-12 rounded-[3.5rem] shadow-2xl shadow-emerald-500/20 text-white flex items-center justify-between mb-10 border border-emerald-400/20">
                    <div className="max-w-xl">
                      <h2 className="text-4xl font-black tracking-tight mb-4">Kenaikan Gaji Berkala (KGB)</h2>
                      <p className="text-emerald-100 font-bold text-base leading-relaxed opacity-90">Pemantauan berkala setiap 2 tahun untuk akurasi penggajian pegawai.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[7rem] font-black leading-none opacity-20 -mb-6 tracking-tighter">{kgbEligible.length}</p>
                      <p className="font-black uppercase tracking-widest text-xs">Pegawai Aktif</p>
                    </div>
                  </div>
                  <FilterBar />
                  <EmployeeTable employees={kgbEligible} type="KGB" onAction={handleOpenDetail} onDelete={handleDeleteEmployee} />
                </div>
              )}

              {currentView === 'KONTROL_PENSIUN' && (
                <div className="space-y-10 animate-fadeIn">
                  <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-12 rounded-[3.5rem] shadow-2xl shadow-rose-500/20 text-white flex items-center justify-between mb-10 border border-rose-400/20">
                    <div className="max-w-xl">
                      <h2 className="text-4xl font-black tracking-tight mb-4">Monitoring Pensiun</h2>
                      <p className="text-rose-100 font-bold text-base leading-relaxed opacity-90">Perencanaan strategis untuk regenerasi SDM berkelanjutan.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[7rem] font-black leading-none opacity-20 -mb-6 tracking-tighter">{retirementEligible.length}</p>
                      <p className="font-black uppercase tracking-widest text-xs">Masa Pensiun</p>
                    </div>
                  </div>
                  <EmployeeTable employees={retirementEligible} type="PENSIUN" onAction={handleOpenDetail} onDelete={handleDeleteEmployee} />
                </div>
              )}

              {currentView === 'AI_REPORT' && (
                <div className="space-y-10 animate-fadeIn">
                  <div className="bg-white p-14 rounded-[4rem] shadow-2xl shadow-slate-200/40 border border-white">
                    <div className="flex items-center justify-between mb-14">
                      <div className="flex items-center space-x-8">
                        <div className="p-6 bg-indigo-600 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-600/30">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                        </div>
                        <div>
                          <h2 className="text-4xl font-black text-slate-900 tracking-tight">AI Strategy Insight</h2>
                          <p className="text-slate-400 font-black uppercase tracking-widest text-xs mt-2">Gemini Analysis Engine 2.5</p>
                        </div>
                      </div>
                      <button onClick={handleGenerateAI} disabled={isLoadingAi} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-1 transition-all flex items-center space-x-4 disabled:opacity-50">
                        {isLoadingAi ? <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>}
                        <span>{isLoadingAi ? 'Menganalisis...' : 'Generate AI Report'}</span>
                      </button>
                    </div>
                    <div className="bg-gray-50/70 p-12 rounded-[3.5rem] border-2 border-dashed border-gray-100 min-h-[600px] relative overflow-hidden">
                      {aiReport ? <div className="relative z-10 animate-fadeIn"><div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-bold text-xl prose prose-indigo max-w-none">{aiReport}</div></div> : <div className="h-full flex flex-col items-center justify-center py-24 text-slate-300"><div className="w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center mb-8 shadow-sm"><svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg></div><p className="font-black uppercase tracking-[0.2em] text-xs">Sistem Siap Menganalisis</p></div>}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <EmployeeModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedEmployee(null); }} onSave={handleSaveEmployee} onDelete={handleDeleteEmployee} initialData={selectedEmployee} />
    </div>
  );
};

export default App;
