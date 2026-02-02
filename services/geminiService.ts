
import { GoogleGenAI, Type } from "@google/genai";
import { Employee, Golongan } from "../types";

// Fungsi pencarian kunci yang sama dengan database
const getApiKey = (): string => {
  const searchKeys = ['API_KEY', 'VITE_API_KEY', 'NEXT_PUBLIC_API_KEY'];
  
  for (const key of searchKeys) {
    try {
      const metaEnv = (import.meta as any).env;
      if (metaEnv && metaEnv[key]) return metaEnv[key];
    } catch (e) {}
    
    try {
      if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
      }
    } catch (e) {}
  }
  return '';
};

const getAiClient = () => {
  const apiKey = getApiKey();
  return new GoogleGenAI({ apiKey });
};

export const getAIAnalysis = async (employees: Employee[]) => {
  try {
    const ai = getAiClient();
    const prompt = `
      Anda adalah pakar HR Analytics. Berdasarkan data pegawai berikut, berikan analisis ringkas:
      1. Ringkasan jumlah pegawai dan profil golongan.
      2. Berikan saran strategis untuk perencanaan kenaikan pangkat dan pensiun (regenerasi).
      3. Identifikasi jika ada pegawai yang sudah mendekati masa pensiun (asumsi 58 tahun).
      
      Data Pegawai:
      ${JSON.stringify(employees.map(e => ({
        nama: e.nama,
        golongan: e.golongan,
        tmtGolongan: e.tmtGolongan,
        tanggalLahir: e.tanggalLahir
      })))}
      
      Gunakan Bahasa Indonesia yang formal dan berikan poin-poin penting.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "Maaf, terjadi kesalahan saat melakukan analisis AI. Pastikan API_KEY sudah diatur di Environment Variables.";
  }
};

export const extractEmployeeDataFromImage = async (base64Image: string): Promise<Partial<Employee> | null> => {
  try {
    const ai = getAiClient();
    const prompt = `
      Extract employee information from this document.
      Return ONLY a JSON object.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { text: prompt },
        { inlineData: { mimeType: "image/jpeg", data: base64Image } }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text) as Partial<Employee>;
  } catch (error) {
    console.error("AI Extraction Error:", error);
    return null;
  }
};
