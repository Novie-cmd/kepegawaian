
import React, { useState, useRef, useEffect } from 'react';
import { Employee, Golongan } from '../types';
import { extractEmployeeDataFromImage } from '../services/geminiService';
import { formatDate } from '../utils/dateUtils';
import { formatRupiah } from '../utils/numberUtils';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => void;
  onDelete?: (id: string) => void;
  initialData?: Employee | null;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
  const [activeTab, setActiveTab] = useState<'DATA_PEGAWAI' | 'SKP_LAMA' | 'SKP_BARU'>('DATA_PEGAWAI');
  const [isScanning, setIsScanning] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Employee>>({
    nama: '',
    nip: '',
    golongan: Golongan.IIIA,
    jabatan: '',
    tempatLahir: '',
    tanggalLahir: '',
    noHp: '',
    // SKP Lama
    gajiPokokLama: '',
    nomorSkpTerakhir: '',
    tglSkpTerakhir: '',
    tglMulaiGajiLama: '',
    masaKerjaGolonganLama: '',
    // SKP Baru
    gajiPokokBaru: '',
    masaKerjaBaru: '',
    golonganBaru: '',
    keterangan: '',
    unitKerja: 'DINAS PENANAMAN MODAL DAN PTSP PROV. NTB',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      setFormData({
        nama: '',
        nip: '',
        golongan: Golongan.IIIA,
        jabatan: '',
        tempatLahir: '',
        tanggalLahir: '',
        noHp: '',
        gajiPokokLama: '',
        nomorSkpTerakhir: '',
        tglSkpTerakhir: '',
        tglMulaiGajiLama: '',
        masaKerjaGolonganLama: '',
        gajiPokokBaru: '',
        masaKerjaBaru: '',
        golonganBaru: '',
        keterangan: '',
        unitKerja: 'DINAS PENANAMAN MODAL DAN PTSP PROV. NTB',
      });
    }
    setActiveTab('DATA_PEGAWAI');
    setShowPreview(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Auto formatting for Salary fields
    if (name === 'gajiPokokLama' || name === 'gajiPokokBaru') {
      const formattedValue = formatRupiah(value);
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      const extractedData = await extractEmployeeDataFromImage(base64String);
      if (extractedData) {
        // Ensure extracted salaries are formatted
        const formattedExtracted = { ...extractedData };
        if (formattedExtracted.gajiPokokLama) formattedExtracted.gajiPokokLama = formatRupiah(formattedExtracted.gajiPokokLama);
        if (formattedExtracted.gajiPokokBaru) formattedExtracted.gajiPokokBaru = formatRupiah(formattedExtracted.gajiPokokBaru);
        
        setFormData(prev => ({ ...prev, ...formattedExtracted }));
      }
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const employee: Employee = {
      ...(formData as Employee),
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      tmtGolongan: formData.tmtGolongan || new Date().toISOString().split('T')[0],
      tmtKgb: formData.tmtKgb || new Date().toISOString().split('T')[0],
      avatar: initialData?.avatar || `https://picsum.photos/seed/${formData.nama}/200`
    };
    onSave(employee);
    onClose();
  };

  const handleDelete = () => {
    if (initialData && onDelete) {
      if (window.confirm(`Apakah Anda yakin ingin menghapus data pegawai "${initialData.nama}" secara permanen?`)) {
        onDelete(initialData.id);
        onClose();
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const LetterPreview = () => (
    <div className="absolute inset-0 z-50 bg-slate-900/40 p-0 md:p-8 overflow-y-auto animate-fadeIn backdrop-blur-md print:bg-white print:p-0 print:overflow-visible">
      <div className="max-w-[850px] mx-auto bg-white shadow-2xl p-12 md:p-20 text-black font-serif relative leading-normal print:shadow-none print:max-w-none print:w-full print:p-0">
        
        {/* Floating Action Buttons */}
        <div className="absolute top-4 right-4 flex space-x-3 print:hidden">
          <button 
            onClick={handlePrint}
            className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-all shadow-lg font-bold text-xs uppercase tracking-widest"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            <span>Cetak Surat</span>
          </button>
          <button 
            onClick={() => setShowPreview(false)}
            className="p-2.5 bg-white text-rose-500 rounded-full hover:bg-rose-50 transition-colors shadow-lg border border-rose-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Kop Surat Sesuai NTB */}
        <div className="flex items-center border-b-[3px] border-black pb-4 mb-6 relative print:mt-10">
          <div className="w-24 flex-shrink-0 flex justify-center items-center">
             <img 
               src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Coat_of_arms_of_West_Nusa_Tenggara.png/300px-Coat_of_arms_of_West_Nusa_Tenggara.png" 
               alt="Logo Provinsi NTB" 
               className="h-28 w-auto object-contain block"
               onError={(e) => {
                 (e.target as HTMLImageElement).src = "https://via.placeholder.com/100x120?text=LOGO+NTB";
               }}
             />
          </div>
          <div className="flex-1 text-center pr-10">
            <h1 className="text-[20px] font-bold uppercase tracking-wide leading-tight">Pemerintah Provinsi Nusa Tenggara Barat</h1>
            <h2 className="text-[18px] font-bold uppercase leading-tight">Dinas Penanaman Modal Dan</h2>
            <h2 className="text-[18px] font-bold uppercase leading-tight">Pelayanan Terpadu Satu Pintu</h2>
            <p className="text-[11px] mt-2 font-sans">Jalan Udayana No. 4 Selaparang. Kota Mataram, Nusa Tenggara Barat 83122,</p>
            <p className="text-[11px] font-sans">Telepon (0370) 631060 - 632632, Faksimile (0370) 6634926</p>
            <p className="text-[10px] italic font-sans text-gray-700">Email: dpmptsp@ntbprov.go.id website: www.investasi-perizinan.ntbprov.go.id</p>
          </div>
          {/* Garis Ganda Kop Surat */}
          <div className="absolute bottom-[-5px] left-0 w-full border-b-[1px] border-black"></div>
        </div>

        {/* Tanggal & Nomor */}
        <div className="flex justify-between mb-6 text-[13px]">
          <div className="space-y-0.5">
            <p><span className="inline-block w-16">Nomor</span>: 822.3 / {formData.nomorSkpTerakhir?.split('/')[1] || '021'} /DPMPTSP/2026</p>
            <p><span className="inline-block w-16">Lamp.</span>: --</p>
            <p><span className="inline-block w-16">Perihal</span>: <span className="font-bold underline">Kenaikan Gaji Berkala</span></p>
            <p className="ml-16 font-bold uppercase">An. {formData.nama}</p>
          </div>
          <div className="text-right">
            <p>Mataram, <span className="font-bold">{new Date().getDate()} {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][new Date().getMonth()]} {new Date().getFullYear()}</span></p>
          </div>
        </div>

        {/* Alamat Tujuan */}
        <div className="mb-6 text-[13px]">
          <p className="font-bold">Yth. Kepala Badan Pengelola Keuangan</p>
          <p className="font-bold ml-8">dan Aset Daerah Provinsi NTB</p>
          <p className="ml-8 text-sm">di -</p>
          <p className="ml-14 font-bold">Mataram</p>
        </div>

        {/* Isi Surat Body */}
        <div className="text-[13px] text-justify space-y-4">
          <p>Dengan ini dipermaklumkan bahwa sehubungan dengan telah dipenuhinya masa kerja dan syarat-syarat lainnya kepada :</p>
          
          <div className="grid grid-cols-[30px_160px_10px_1fr] gap-y-1 ml-4">
            <div>1.</div><div>Nama/ Tanggal Lahir</div><div>:</div><div className="font-bold uppercase">{formData.nama} / {formData.tanggalLahir ? formatDate(formData.tanggalLahir).split(' ').join('-') : '-'}</div>
            <div>2.</div><div>NIP</div><div>:</div><div className="font-bold">{formData.nip}</div>
            <div>3.</div><div>Pangkat/ Jabatan</div><div>:</div><div>{formData.golongan} / {formData.jabatan}</div>
            <div>4.</div><div>Unit Kerja</div><div>:</div><div className="font-bold uppercase">{formData.unitKerja || 'DINAS PENANAMAN MODAL DAN PTSP PROV. NTB'}</div>
            <div>5.</div><div>Gaji Pokok Lama</div><div>:</div><div><span className="font-bold">Rp. {formData.gajiPokokLama || '-'}</span></div>
          </div>

          <p className="ml-10 italic">(Atas dasar SKP Terakhir tentang gaji / pangkat yang telah ditetapkan) :</p>
          
          <div className="grid grid-cols-[60px_130px_10px_1fr] gap-y-0.5 ml-4">
            <div></div><div>a. Oleh Pejabat</div><div>:</div><div className="uppercase">KEPALA DPMPTSP PROVINSI NTB</div>
            <div></div><div>b. Tanggal</div><div>:</div><div>{formData.tglSkpTerakhir ? formatDate(formData.tglSkpTerakhir) : '-'}</div>
            <div></div><div>c. Nomor</div><div>:</div><div>{formData.nomorSkpTerakhir || '-'}</div>
            <div></div><div>d. Tanggal mulai berlakunya gaji tersebut</div><div>:</div><div>{formData.tglMulaiGajiLama ? formatDate(formData.tglMulaiGajiLama) : '-'}</div>
            <div></div><div>e. Masa kerja golongan pada tanggal tersebut</div><div>:</div><div>{formData.masaKerjaGolonganLama || '-'}</div>
          </div>

          <p>Diberikan kenaikan gaji berkala hingga memperoleh :</p>

          <div className="grid grid-cols-[30px_160px_10px_1fr] gap-y-1 ml-4">
            <div className="font-bold">6.</div><div className="font-bold">Gaji Pokok Baru</div><div className="font-bold">:</div><div className="font-bold">Rp. {formData.gajiPokokBaru || '-'}</div>
            <div>7.</div><div>Berdasarkan Masa Kerja</div><div>:</div><div>{formData.masaKerjaBaru || '-'}</div>
            <div>8.</div><div>Dalam Golongan / Ruang</div><div>:</div><div>{formData.golonganBaru || formData.golongan}</div>
            <div className="font-bold">9.</div><div className="font-bold">Mulai Tanggal</div><div className="font-bold">:</div><div className="font-bold">{formData.tmtKgb ? formatDate(formData.tmtKgb) : '-'}</div>
            <div className="items-start">10.</div><div>Keterangan</div><div>:</div><div>{formData.keterangan || '-'}</div>
          </div>

          <p>Diharapkan agar sesuai dengan Peraturan Pemerintah Nomor 5 Tahun 2024 kepada Pegawai tersebut dapat dibayarkan penghasilannya berdasarkan gaji pokoknya yang baru.</p>
        </div>

        {/* Tanda Tangan */}
        <div className="mt-12 flex justify-end">
          <div className="text-left w-[320px] text-[13px]">
            <p className="font-bold uppercase italic">a.n. GUBERNUR NUSA TENGGARA BARAT</p>
            <p className="font-bold uppercase ml-8">KEPALA DINAS,</p>
            <div className="h-20"></div>
            <p className="font-bold underline uppercase tracking-tight">H. Irnadi Kusuma, S.STP., ME</p>
            <p>NIP. 19771231 199703 1 004</p>
          </div>
        </div>

        {/* Tembusan */}
        <div className="mt-12 text-[11px] border-t pt-4">
          <p className="font-bold italic underline mb-1">Tembusan disampaikan kepada Yth. :</p>
          <ol className="list-decimal ml-6 space-y-0">
            <li>Inspektur Inspektorat Provinsi NTB di Mataram;</li>
            <li>Kepala Badan Kepegawaian Daerah Provinsi NTB di Mataram;</li>
            <li>Kepala Badan Keuangan Dan Aset Daerah di Mataram;</li>
            <li>Kepala TASPEN (PERSERO) Cabang Mataram di Mataram;</li>
            <li>Pembuat Daftar Gaji pada DPMPTSP Provinsi NTB di Mataram;</li>
            <li>PNS yang bersangkutan;</li>
            <li>Arsip.</li>
          </ol>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn print:hidden">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-100 relative">
        
        {/* Letter Preview Overlay */}
        {showPreview && <LetterPreview />}

        {/* Header Section - Compact */}
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100 overflow-hidden">
              {initialData?.avatar ? <img src={initialData.avatar} className="w-full h-full object-cover" /> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                {initialData ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
              </h2>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Sistem Arsip Kepegawaian</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {!initialData && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
              >
                {isScanning ? <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/></svg>}
                <span>{isScanning ? 'Mengekstrak...' : 'Scan AI'}</span>
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
              </button>
            )}
            <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-xl transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation - Tighter */}
        <div className="flex px-8 border-b border-slate-50 bg-white relative z-10">
          {[
            { id: 'DATA_PEGAWAI', label: '1. Data Pegawai' },
            { id: 'SKP_LAMA', label: '2. SKP Lama' },
            { id: 'SKP_BARU', label: '3. SKP Baru' },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] transition-all border-b-2 ${activeTab === tab.id ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body - More Compact Spacing */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/20">
          <form id="employee-form" onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
            
            {/* MENU 1: DATA PEGAWAI */}
            {activeTab === 'DATA_PEGAWAI' && (
              <div className="grid grid-cols-2 gap-x-8 gap-y-5 animate-fadeIn">
                <div className="col-span-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nama Pegawai</label>
                  <input required name="nama" value={formData.nama} onChange={handleInputChange} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold text-base text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all" placeholder="Nama Lengkap Pegawai..." />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">NIP</label>
                  <input required name="nip" value={formData.nip} onChange={handleInputChange} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/5" placeholder="19XXXXXXXXXXXXXXX" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Gol/Ruang</label>
                  <select name="golongan" value={formData.golongan} onChange={handleInputChange} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none appearance-none cursor-pointer">
                    {Object.values(Golongan).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Jabatan</label>
                  <input required name="jabatan" value={formData.jabatan} onChange={handleInputChange} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Unit Kerja</label>
                  <input name="unitKerja" value={formData.unitKerja || ''} onChange={handleInputChange} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none" placeholder="Masukkan Unit Kerja..." />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tempat / Tgl. Lahir</label>
                  <div className="flex items-center space-x-2">
                    <input name="tempatLahir" value={formData.tempatLahir || ''} onChange={handleInputChange} className="flex-1 px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none" placeholder="Tempat" />
                    <input required type="date" name="tanggalLahir" value={formData.tanggalLahir} onChange={handleInputChange} className="flex-1 px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">No. HP</label>
                  <input name="noHp" value={formData.noHp || ''} onChange={handleInputChange} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none" placeholder="08XXXXXXXXXX" />
                </div>
              </div>
            )}

            {/* MENU 2: SKP LAMA */}
            {activeTab === 'SKP_LAMA' && (
              <div className="grid grid-cols-2 gap-x-8 gap-y-5 animate-fadeIn">
                <div className="col-span-2 bg-indigo-50/40 p-5 rounded-2xl border border-indigo-100 flex items-center mb-2">
                  <div className="bg-indigo-600 p-2.5 rounded-lg text-white mr-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <p className="text-sm font-black text-indigo-900 uppercase tracking-widest">Informasi SKP Terakhir (Lama)</p>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Gaji Pokok Lama</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp.</span>
                    <input name="gajiPokokLama" value={formData.gajiPokokLama || ''} onChange={handleInputChange} className="w-full pl-12 pr-5 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/5" placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nomer SKP Terakhir</label>
                  <input name="nomorSkpTerakhir" value={formData.nomorSkpTerakhir || ''} onChange={handleInputChange} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none" placeholder="Contoh: 822.3/17/DPM&PTSP/ 2024" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tgl. SKP Terakhir</label>
                  <input type="date" name="tglSkpTerakhir" value={formData.tglSkpTerakhir || ''} onChange={handleInputChange} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tgl. Mulai Gaji Pokok Lama</label>
                  <input type="date" name="tglMulaiGajiLama" value={formData.tglMulaiGajiLama || ''} onChange={handleInputChange} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Masa Kerja Golongan</label>
                  <input name="masaKerjaGolonganLama" value={formData.masaKerjaGolonganLama || ''} onChange={handleInputChange} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none" placeholder="Contoh: 28 Tahun 00 Bulan" />
                </div>
              </div>
            )}

            {/* MENU 3: SKP BARU */}
            {activeTab === 'SKP_BARU' && (
              <div className="grid grid-cols-2 gap-x-8 gap-y-5 animate-fadeIn">
                <div className="col-span-2 bg-emerald-50/40 p-5 rounded-2xl border border-emerald-100 flex items-center mb-2">
                  <div className="bg-emerald-600 p-2.5 rounded-lg text-white mr-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <p className="text-sm font-black text-emerald-900 uppercase tracking-widest">Penetapan SKP Baru</p>
                    <button 
                      type="button"
                      onClick={() => setShowPreview(true)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center space-x-2"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      <span>Preview Surat KGB</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Gaji Pokok Baru</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-sm">Rp.</span>
                    <input name="gajiPokokBaru" value={formData.gajiPokokBaru || ''} onChange={handleInputChange} className="w-full pl-12 pr-5 py-3 bg-white border border-emerald-100 rounded-xl font-black text-lg text-emerald-700 outline-none" placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Berdasarkan Masa Kerja</label>
                  <input name="masaKerjaBaru" value={formData.masaKerjaBaru || ''} onChange={handleInputChange} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none" placeholder="Contoh: 30 Tahun 00 Bulan" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Golongan/Ruang</label>
                  <input name="golonganBaru" value={formData.golonganBaru || ''} onChange={handleInputChange} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none" placeholder="Contoh: III/d" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Mulai Tanggal (TMT Baru)</label>
                  <input type="date" name="tmtKgb" value={formData.tmtKgb || ''} onChange={handleInputChange} className="w-full px-5 py-3 bg-white border border-emerald-100 rounded-xl font-bold text-sm text-emerald-700 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Keterangan</label>
                  <textarea name="keterangan" value={formData.keterangan || ''} onChange={handleInputChange} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none h-24 resize-none shadow-sm" placeholder="Contoh: a. Pegawai Negeri Sipil Daerah Provinsi NTB, b. Pendidikan : S1 Administrasi Negara Tahun 2015" />
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer Area - Compact */}
        <div className="px-8 py-4 border-t border-slate-100 bg-white relative z-10 flex justify-between items-center">
          <div>
            {initialData && (
              <button onClick={handleDelete} className="group px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-100 hover:border-rose-500 flex items-center space-x-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                <span>Hapus Data</span>
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button onClick={onClose} className="px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all border border-transparent">Batal</button>
            <button type="submit" form="employee-form" className="px-12 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-lg bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 hover:-translate-y-0.5 flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
              <span>{initialData ? 'Update Data' : 'Simpan Pegawai'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeModal;
