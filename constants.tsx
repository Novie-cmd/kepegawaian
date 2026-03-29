
import React from 'react';
import { Employee, Golongan, AgencyConfig } from './types';

export const DEFAULT_AGENCY_CONFIG: AgencyConfig = {
  namaPemerintah: 'Pemerintah Provinsi Nusa Tenggara Barat',
  namaSkpd: 'Badan Kesatuan Bangsa dan Politik Dalam Negeri',
  namaSkpdPendek: 'KESBANGPOLDAGRI NTB',
  alamat: 'Jalan Udayana No. 4 Selaparang. Kota Mataram, Nusa Tenggara Barat 83122',
  telepon: '(0370) 631060 - 632632',
  fax: '(0370) 6634926',
  email: 'kesbangpoldagri@ntbprov.go.id',
  namaKepala: 'H. Mohammad Rum, MT',
  nipKepala: '19661231 199403 1 012',
  pangkatKepala: 'Pembina Utama Madya',
  jabatanKepala: 'Kepala Dinas'
};

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: '1',
    nip: '198501012010011001',
    nama: 'Ahmad Zulkarnaen, S.T.',
    jabatan: 'Penata Ruang Ahli Muda',
    golongan: Golongan.IIIC,
    tmtGolongan: '2021-04-01',
    tmtKgb: '2023-10-01',
    tanggalLahir: '1985-01-01',
    unitKerja: 'Bidang Tata Ruang - KESBANGPOLDAGRI',
    avatar: 'https://i.pravatar.cc/150?u=ahmad'
  },
  {
    id: '2',
    nip: '199205122015032005',
    nama: 'Siti Aminah, M.Ak',
    jabatan: 'Analis Keuangan',
    golongan: Golongan.IIIB,
    tmtGolongan: '2020-10-01',
    tmtKgb: '2022-12-01',
    tanggalLahir: '1992-05-12',
    unitKerja: 'Sekretariat - KESBANGPOLDAGRI',
    avatar: 'https://i.pravatar.cc/150?u=siti'
  },
  {
    id: '3',
    nip: '197008201995031002',
    nama: 'Drs. H. Bambang Irawan',
    jabatan: 'Kepala Bidang Perizinan',
    golongan: Golongan.IVB,
    tmtGolongan: '2019-04-01',
    tmtKgb: '2023-01-01',
    tanggalLahir: '1970-08-20',
    unitKerja: 'Bidang Perizinan - KESBANGPOLDAGRI',
    avatar: 'https://i.pravatar.cc/150?u=bambang'
  }
];

export const NAV_ITEMS = [
  { id: 'DASHBOARD', label: 'Dashboard', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
  )},
  { id: 'DATA_PEGAWAI', label: 'Data Pegawai', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
  )},
  { id: 'KONTROL_PANGKAT', label: 'Kenaikan Pangkat', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
  )},
  { id: 'KONTROL_KGB', label: 'Kenaikan Gaji (KGB)', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
  )},
  { id: 'KONTROL_PENSIUN', label: 'Pensiun', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
  )},
  { id: 'AI_REPORT', label: 'Laporan AI Gemini', icon: (
    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
  )},
  { id: 'DATA_DINAS', label: 'Data Dinas', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
  )},
];
