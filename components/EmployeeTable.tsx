
import React from 'react';
import { Employee } from '../types';
import { formatDate } from '../utils/dateUtils';

interface EmployeeTableProps {
  employees: Employee[];
  type?: 'NORMAL' | 'PANGKAT' | 'KGB' | 'PENSIUN';
  onAction?: (emp: Employee) => void;
  onDelete?: (id: string) => void;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({ employees, type = 'NORMAL', onAction, onDelete }) => {
  const handleDelete = (e: React.MouseEvent, emp: Employee) => {
    e.stopPropagation(); // Mencegah bubbling jika ada aksi baris
    if (window.confirm(`Apakah Anda yakin ingin menghapus data pegawai "${emp.nama}" secara permanen dari sistem?`)) {
      if (onDelete) {
        onDelete(emp.id);
      }
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-slate-50/50">
          <tr>
            <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pegawai</th>
            <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">NIP</th>
            <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Jabatan / Golongan</th>
            {type === 'PANGKAT' && <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rencana Naik Pangkat</th>}
            {type === 'KGB' && <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estimasi KGB</th>}
            {type === 'PENSIUN' && <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estimasi Pensiun</th>}
            <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Opsi</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-50">
          {employees.map((emp) => (
            <tr key={emp.id} className="hover:bg-slate-50/50 transition-all group">
              <td className="px-8 py-6 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-12 w-12 flex-shrink-0 relative">
                    <img className="h-12 w-12 rounded-2xl border-2 border-white shadow-sm object-cover" src={emp.avatar} alt="" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{emp.nama}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Profil Terverifikasi</div>
                  </div>
                </div>
              </td>
              <td className="px-8 py-6 whitespace-nowrap">
                 <span className="text-xs font-bold text-slate-600 font-mono tracking-tighter bg-slate-100 px-3 py-1 rounded-lg">{emp.nip}</span>
              </td>
              <td className="px-8 py-6 whitespace-nowrap">
                <div className="text-xs text-slate-700 font-black mb-1">{emp.jabatan}</div>
                <span className="inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100/50">
                  Gol. {emp.golongan}
                </span>
              </td>

              {type === 'PANGKAT' && (
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Terakhir: {formatDate(emp.tmtGolongan)}</div>
                  <div className="text-sm font-black text-orange-600 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 11l7-7 7 7M5 19l7-7 7 7"/></svg>
                    <span>{formatDate(new Date(new Date(emp.tmtGolongan).getFullYear() + 4, new Date(emp.tmtGolongan).getMonth(), 1))}</span>
                  </div>
                </td>
              )}

              {type === 'KGB' && (
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Terakhir: {formatDate(emp.tmtKgb)}</div>
                  <div className="text-sm font-black text-emerald-600 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1"/></svg>
                    <span>{formatDate(new Date(new Date(emp.tmtKgb).getFullYear() + 2, new Date(emp.tmtKgb).getMonth(), 1))}</span>
                  </div>
                </td>
              )}

              {type === 'PENSIUN' && (
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Lahir: {formatDate(emp.tanggalLahir)}</div>
                  <div className="text-sm font-black text-rose-600 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 14l9-5-9-5-9 5 9 5z"/></svg>
                    <span>{formatDate(new Date(new Date(emp.tanggalLahir).getFullYear() + 58, new Date(emp.tanggalLahir).getMonth() + 1, 1))}</span>
                  </div>
                </td>
              )}

              <td className="px-8 py-6 whitespace-nowrap text-right">
                <div className="flex items-center justify-end space-x-2">
                  <button 
                    onClick={() => onAction?.(emp)}
                    className="inline-flex items-center space-x-2 bg-white hover:bg-indigo-600 hover:text-white text-indigo-600 px-5 py-2.5 rounded-2xl transition-all duration-300 font-black text-[10px] uppercase tracking-widest border border-indigo-100 hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-200"
                  >
                    <span>Detail & Kelola</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                  </button>
                  
                  <button 
                    onClick={(e) => handleDelete(e, emp)}
                    className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all duration-300 border border-transparent hover:border-rose-100"
                    title="Hapus Pegawai"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {employees.length === 0 && (
            <tr>
              <td colSpan={10} className="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                Tidak ada data ditemukan
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;
