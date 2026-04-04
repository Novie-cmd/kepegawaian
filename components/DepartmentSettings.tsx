
import React, { useState, useEffect } from 'react';
import { DepartmentInfo } from '../types';
import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

interface DepartmentSettingsProps {
  onSaveSuccess?: () => void;
}

const DepartmentSettings: React.FC<DepartmentSettingsProps> = ({ onSaveSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deptInfo, setDeptInfo] = useState<DepartmentInfo>({
    namaDinas: 'Badan Kesatuan Bangsa dan Politik Dalam Negeri',
    namaKepalaDinas: 'H. Irnadi Kusuma, S.STP., ME',
    nipKepalaDinas: '19771231 199703 1 004',
    jabatanKepalaDinas: 'Pembina Utama Muda (IV/c)',
    alamat: 'Jl. Pendidikan No.2, Dasan Agung - Mataram NTB',
    telepon: '(0370) 631060 - 632632',
    email: '',
    website: ''
  });

  useEffect(() => {
    const docRef = doc(db, 'settings', 'department');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setDeptInfo(docSnap.data() as DepartmentInfo);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDeptInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'department'), deptInfo);
      if (onSaveSuccess) onSaveSuccess();
    } catch (error) {
      console.error("Error saving department info:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-10 rounded-[2.5rem] shadow-xl border border-white animate-fadeIn">
      <div className="flex items-center space-x-4 mb-10">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Data Dinas & Pejabat</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Pengaturan Identitas Instansi & Penanda Tangan</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Dinas / Instansi</label>
            <input
              required
              name="namaDinas"
              value={deptInfo.namaDinas}
              onChange={handleChange}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all"
              placeholder="Contoh: Badan Kesatuan Bangsa dan Politik Dalam Negeri"
            />
          </div>

          <div className="md:col-span-2 border-t border-slate-50 pt-8">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
              Pejabat Penanda Tangan
            </h3>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Kepala Dinas</label>
            <input
              required
              name="namaKepalaDinas"
              value={deptInfo.namaKepalaDinas}
              onChange={handleChange}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all"
              placeholder="Nama Lengkap & Gelar"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">NIP Kepala Dinas</label>
            <input
              required
              name="nipKepalaDinas"
              value={deptInfo.nipKepalaDinas}
              onChange={handleChange}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all"
              placeholder="NIP Pejabat"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Jabatan / Pangkat</label>
            <input
              required
              name="jabatanKepalaDinas"
              value={deptInfo.jabatanKepalaDinas}
              onChange={handleChange}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all"
              placeholder="Contoh: Pembina Utama Muda (IV/c)"
            />
          </div>

          <div className="md:col-span-2 border-t border-slate-50 pt-8">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
              Informasi Kontak (KOP Surat)
            </h3>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Alamat Lengkap</label>
            <textarea
              name="alamat"
              value={deptInfo.alamat}
              onChange={handleChange}
              rows={2}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all"
              placeholder="Alamat Kantor"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Telepon / Fax</label>
            <input
              name="telepon"
              value={deptInfo.telepon}
              onChange={handleChange}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Dinas</label>
            <input
              name="email"
              value={deptInfo.email}
              onChange={handleChange}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 transition-all"
            />
          </div>
        </div>

        <div className="pt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DepartmentSettings;
