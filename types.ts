
export enum Golongan {
  IA = 'I/a', IB = 'I/b', IC = 'I/c', ID = 'I/d',
  IIA = 'II/a', IIB = 'II/b', IIC = 'II/c', IID = 'II/d',
  IIIA = 'III/a', IIIB = 'III/b', IIIC = 'III/c', IIID = 'III/d',
  IVA = 'IV/a', IVB = 'IV/b', IVC = 'IV/c', IVD = 'IV/d', IVE = 'IV/e'
}

export interface Employee {
  id: string;
  nip: string;
  nama: string;
  jabatan: string;
  golongan: Golongan;
  tmtGolongan: string;
  tmtKgb: string;
  tanggalLahir: string;
  tempatLahir?: string;
  noHp?: string;
  unitKerja?: string;
  avatar?: string;

  // SKP Lama
  gajiPokokLama?: string;
  nomorSkpTerakhir?: string;
  tglSkpTerakhir?: string;
  tglMulaiGajiLama?: string;
  masaKerjaGolonganLama?: string;

  // SKP Baru
  gajiPokokBaru?: string;
  masaKerjaBaru?: string;
  golonganBaru?: string;
  tglSuratKgb?: string;
  keterangan?: string;
  uid?: string;
}

export interface AgencyConfig {
  namaPemerintah: string;
  namaSkpd: string;
  namaSkpdPendek: string;
  alamat: string;
  telepon: string;
  fax: string;
  website?: string;
  email?: string;
  logoBase64?: string;
  namaKepala: string;
  nipKepala: string;
  pangkatKepala: string;
  jabatanKepala: string;
  uid?: string;
}

export type ViewType = 'DASHBOARD' | 'DATA_PEGAWAI' | 'KONTROL_PANGKAT' | 'KONTROL_KGB' | 'KONTROL_PENSIUN' | 'AI_REPORT' | 'DATA_DINAS';
