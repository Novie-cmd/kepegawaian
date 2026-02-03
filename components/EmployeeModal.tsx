
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

const LetterPreview: React.FC<{ formData: Partial<Employee>, setShowPreview: (show: boolean) => void }> = ({ formData, setShowPreview }) => {
  const handlePrint = () => {
    window.print();
  };

  const ntbLogoUrl = "https://upload.wikimedia.org/wikipedia/commons/0/07/Coat_of_arms_of_West_Nusa_Tenggara.png";

  return (
    <div id="print-area" className="fixed inset-0 z-[100] bg-slate-900/60 p-4 md:p-8 overflow-y-auto animate-fadeIn backdrop-blur-sm print:bg-white print:p-0 print:overflow-visible">
      <div className="max-w-[850px] mx-auto bg-white shadow-2xl p-10 md:p-16 text-black font-serif relative leading-normal print:shadow-none print:max-w-none print:w-full print:p-0">
        
        <div className="absolute top-4 right-4 flex space-x-3 no-print">
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

        <div className="flex items-center border-b-[3px] border-black pb-1 mb-1 relative print:mt-2 min-h-[140px]">
          <div className="w-28 flex-shrink-0 flex justify-center items-center py-2 h-28 mr-4">
             <img src={ntbLogoUrl} alt="Logo NTB" className="h-24 w-auto object-contain block" crossOrigin="anonymous" />
          </div>
          <div className="flex-1 text-center pr-12">
            <h1 className="text-[19px] font-bold uppercase tracking-tight leading-tight">Pemerintah Provinsi Nusa Tenggara Barat</h1>
            <h2 className="text-[17px] font-bold uppercase leading-tight mt-1">Dinas Penanaman Modal Dan</h2>
            <h2 className="text-[17px] font-bold uppercase leading-tight">Pelayanan Terpadu Satu Pintu</h2>
            <p className="text-[10px] mt-2 font-sans font-medium">Jalan Udayana No. 4 Selaparang. Kota Mataram, Nusa Tenggara Barat 83122</p>
            <p className="text-[10px] font-sans font-medium">Telepon (0370) 631060 - 632632, Faksimile (0370) 6634926</p>
          </div>
        </div>
        <div className="border-b-[1px] border-black mb-6"></div>

        <div className="flex justify-between mb-6 text-[12px]">
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

        <div className="mb-6 text-[12px]">
          <p className="font-bold">Yth. Kepala Badan Pengelola Keuangan</p>
          <p className="font-bold ml-8">dan Aset Daerah Provinsi NTB</p>
          <p className="ml-8 text-sm">di -</p>
          <p className="ml-14 font-bold">Mataram</p>
        </div>

        <div className="text-[12px] text-justify space-y-4">
          <p>Dengan ini dipermaklumkan bahwa sehubungan dengan telah dipenuhinya masa kerja dan syarat-syarat lainnya kepada :</p>
          
          <div className="grid grid-cols-[30px_170px_10px_1fr] gap-y-1 ml-4">
            <div>1.</div><div>Nama/ Tanggal Lahir</div><div>:</div><div className="font-bold uppercase">{formData.nama} / {formData.tanggalLahir ? formatDate(formData.tanggalLahir).split(' ').join('-') : '-'}</div>
            <div>2.</div><div>NIP</div><div>:</div><div className="font-bold">{formData.nip}</div>
            <div>3.</div><div>Pangkat/ Jabatan</div><div>:</div><div>{formData.golongan} / {formData.jabatan}</div>
            <div>4.</div><div>Unit Kerja</div><div>:</div><div className="font-bold uppercase">{formData.unitKerja || 'DPMPTSP PROV. NTB'}</div>
            <div>5.</div><div>Gaji Pokok Lama</div><div>:</div><div><span className="font-bold">Rp. {formData.gajiPokokLama || '-'}</span></div>
          </div>

          <p className="ml-10 italic font-medium">(Atas dasar SKP Terakhir tentang gaji / pangkat yang telah ditetapkan) :</p>
          
          <div className="grid grid-cols-[60px_130px_10px_1fr] gap-y-0.5 ml-4">
            <div></div><div>a. Oleh Pejabat</div><div>:</div><div className="uppercase">KEPALA DPMPTSP PROVINSI NTB</div>
            <div></div><div>b. Tanggal</div><div>:</div><div>{formData.tglSkpTerakhir ? formatDate(formData.tglSkpTerakhir) : '-'}</div>
            <div></div><div>c. Nomor</div><div>:</div><div>{formData.nomorSkpTerakhir || '-'}</div>
            <div></div><div>d. Tanggal mulai berlaku</div><div>:</div><div>{formData.tglMulaiGajiLama ? formatDate(formData.tglMulaiGajiLama) : '-'}</div>
            <div></div><div>e. Masa kerja golongan</div><div>:</div><div>{formData.masaKerjaGolonganLama || '-'}</div>
          </div>

          <p>Diberikan kenaikan gaji berkala hingga memperoleh :</p>

          <div className="grid grid-cols-[30px_170px_10px_1fr] gap-y-1 ml-4">
            <div className="font-bold">6.</div><div className="font-bold">Gaji Pokok Baru</div><div className="font-bold">:</div><div className="font-bold">Rp. {formData.gajiPokokBaru || '-'}</div>
            <div>7.</div><div>Berdasarkan Masa Kerja</div><div>:</div><div>{formData.masaKerjaBaru || '-'}</div>
            <div>8.</div><div>Dalam Golongan / Ruang</div><div>:</div><div>{formData.golonganBaru || formData.golongan}</div>
            <div className="font-bold">9.</div><div className="font-bold">Mulai Tanggal</div><div className="font-bold">:</div><div className="font-bold">{formData.tmtKgb ? formatDate(formData.tmtKgb) : '-'}</div>
          </div>
        </div>

        <div className="mt-12 flex justify-end">
          <div className="text-left w-[300px] text-[12px]">
            <p className="font-bold uppercase italic">a.n. GUBERNUR NUSA TENGGARA BARAT</p>
            <p className="font-bold uppercase ml-8">KEPALA DINAS,</p>
            <div className="h-20"></div>
            <p className="font-bold underline uppercase tracking-tight">H. Irnadi Kusuma, S.STP., ME</p>
            <p className="font-medium">Pembina Utama Muda (IV/c)</p>
            <p>NIP. 19771231 199703 1 004</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
  const [activeTab, setActiveTab] = useState<'DATA' | 'SKP_LAMA' | 'SKP_BARU'>('DATA');
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
    unitKerja: 'DPMPTSP PROV. NTB',
    gajiPokokLama: '',
    nomorSkpTerakhir: '',
    tglSkpTerakhir: '',
    tglMulaiGajiLama: '',
    masaKerjaGolonganLama: '',
    gajiPokokBaru: '',
    masaKerjaBaru: '',
    golonganBaru: '',
    tmtGolongan: '',
    tmtKgb: '',
    keterangan: '',
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
        unitKerja: 'DPMPTSP PROV. NTB',
        gajiPokokLama: '',
        nomorSkpTerakhir: '',
        tglSkpTerakhir: '',
        tglMulaiGajiLama: '',
        masaKerjaGolonganLama: '',
        gajiPokokBaru: '',
        masaKerjaBaru: '',
        golonganBaru: '',
        tmtGolongan: '',
        tmtKgb: '',
        keterangan: '',
      });
    }
    setActiveTab('DATA');
    setShowPreview(false);
  }, [initialData, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'gajiPokokLama' || name === 'gajiPokokBaru') {
      setFormData(prev => ({ ...prev, [name]: formatRupiah(value) }));
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
        setFormData(prev => ({ ...prev, ...extractedData }));
      }
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(formData as Employee),
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      avatar: initialData?.avatar || `https://i.pravatar.cc/150?u=${formData.nip}`
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-100">
        
        {showPreview && <LetterPreview formData={formData} setShowPreview={setShowPreview} />}

        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {initialData ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sistem Kontrol Kepegawaian</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
             <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 disabled:opacity-50"
              >
                {isScanning ? 'Mengekstrak...' : 'Scan Dokumen AI'}
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
              </button>
            <button onClick={onClose} className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div className="flex px-8 border-b border-slate-50 bg-white">
          {['DATA', 'SKP_LAMA', 'SKP_BARU'].map((tab) => (
            <button 
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab as any)} 
              className={`py-4 px-6 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === tab ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent'}`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30">
          <form id="employee-form" onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
            {activeTab === 'DATA' && (
              <div className="grid grid-cols-2 gap-6 animate-fadeIn">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nama Lengkap & Gelar</label>
                  <input required name="nama" value={formData.nama} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">NIP</label>
                  <input required name="nip" value={formData.nip} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Golongan Saat Ini</label>
                  <select name="golongan" value={formData.golongan} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none">
                    {Object.values(Golongan).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">TMT Golongan</label>
                  <input type="date" name="tmtGolongan" value={formData.tmtGolongan} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Jabatan</label>
                  <input required name="jabatan" value={formData.jabatan} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tempat Lahir</label>
                  <input name="tempatLahir" value={formData.tempatLahir} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tanggal Lahir</label>
                  <input type="date" name="tanggalLahir" value={formData.tanggalLahir} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Unit Kerja</label>
                  <input name="unitKerja" value={formData.unitKerja} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">No. HP / WhatsApp</label>
                  <input name="noHp" value={formData.noHp} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
                </div>
              </div>
            )}

            {activeTab === 'SKP_LAMA' && (
              <div className="grid grid-cols-2 gap-6 animate-fadeIn">
                <div className="col-span-2">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                    Dasar Gaji/Pangkat Terakhir
                  </h3>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Gaji Pokok Lama</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</span>
                    <input name="gajiPokokLama" value={formData.gajiPokokLama} onChange={handleInputChange} placeholder="0" className="w-full pl-10 pr-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Masa Kerja Golongan</label>
                  <input name="masaKerjaGolonganLama" value={formData.masaKerjaGolonganLama} onChange={handleInputChange} placeholder="Contoh: 10 Tahun 00 Bulan" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nomor SKP / SK KGB Terakhir</label>
                  <input name="nomorSkpTerakhir" value={formData.nomorSkpTerakhir} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tanggal SKP</label>
                  <input type="date" name="tglSkpTerakhir" value={formData.tglSkpTerakhir} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tanggal Mulai Berlaku</label>
                  <input type="date" name="tglMulaiGajiLama" value={formData.tglMulaiGajiLama} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
                </div>
              </div>
            )}

            {activeTab === 'SKP_BARU' && (
              <div className="grid grid-cols-2 gap-6 animate-fadeIn">
                <div className="col-span-2 flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                    Usulan Kenaikan Gaji (KGB)
                  </h3>
                  <button type="button" onClick={() => setShowPreview(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    <span>Preview Surat KGB</span>
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Gaji Pokok Baru</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</span>
                    <input name="gajiPokokBaru" value={formData.gajiPokokBaru} onChange={handleInputChange} className="w-full pl-10 pr-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">TMT KGB (Mulai Tanggal)</label>
                  <input type="date" name="tmtKgb" value={formData.tmtKgb} onChange={handleInputChange} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Masa Kerja Baru</label>
                  <input name="masaKerjaBaru" value={formData.masaKerjaBaru} onChange={handleInputChange} placeholder="Contoh: 12 Tahun 00 Bulan" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Golongan/Ruang Baru</label>
                  <input name="golonganBaru" value={formData.golonganBaru} onChange={handleInputChange} placeholder="Contoh: III/d" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Keterangan / Catatan</label>
                  <textarea name="keterangan" value={formData.keterangan} onChange={handleInputChange} rows={3} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="px-8 py-5 border-t border-slate-100 flex justify-end space-x-4 bg-white">
          <button onClick={onClose} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Batal</button>
          <button type="submit" form="employee-form" className="px-10 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">
            Simpan Data Pegawai
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeModal;
