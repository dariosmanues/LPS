import csv
import pandas as pd
import sys
import os

def run_etl(input_file, output_file, tanggal="13-04-2026"):
    print(f"[*] Memulai proses ekstraksi data dari {input_file}...")
    
    data_rows = []
    
    # 1. EKSTRAKSI DAN FILTERING DATA
    # Menggunakan modul csv untuk membaca file mentah yang berisi koma berlebih
    with open(input_file, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.reader(f)
        
        row_num = 1
        for row in reader:
            # Skip baris yang tidak memiliki cukup kolom (minimal 29 kolom untuk index 28)
            if len(row) < 29:
                continue
                
            no_transaksi = row[2].strip()
            
            # Filter 1: Abaikan baris yang bukan transaksi (harus berawalan INV/)
            if not no_transaksi.startswith("INV/"):
                continue
                
            # Filter 2: Abaikan baris Total Pembelian
            row_text = " ".join(row).lower()
            if "total pembelian" in row_text:
                continue
            
            # 2. EKSTRAKSI DAN TRANSFORMASI (Mapping berdasarkan Index)
            try:
                plat_no = row[3].strip()
                nama_supir = row[5].strip()
                nama_kebun = row[9].strip()
                nama_produk = row[11].strip()
                
                # Helper function untuk convert string angka (misal "2920.0" -> 2920)
                def parse_weight(val_str):
                    v = val_str.strip().replace(',', '')
                    if not v:
                        return 0
                    return int(float(v))
                
                gross = parse_weight(row[16])
                tare = parse_weight(row[20])
                netto1 = parse_weight(row[23])
                rafaksi = parse_weight(row[25])
                netto2 = parse_weight(row[28])
                
                # Penanganan untuk nilai negatif (Tetap dibiarkan namun format angkanya integer/float agar valid di Excel)
                if gross < 0 or netto1 < 0:
                    print(f"[!] Warning: Terdapat nilai negatif pada baris transaksi {no_transaksi}")
                
                # Memasukkan data ke dalam dictionary sesuai struktur output
                data_rows.append({
                    "NO": row_num,
                    "NO TIKET": no_transaksi,
                    "NO POLISI": plat_no,
                    "NAMA SUPIR": nama_supir,
                    "JENIS MOBIL": "PICKUP",
                    "PENGIRIM": f"LPS {nama_kebun}" if nama_kebun else "LPS",
                    "JENIS SAMPAH": nama_produk,
                    "GROSS (KG)": gross,
                    "TARE (KG)": tare,
                    "NETTO 1 (KG)": netto1,
                    "RAFAKSI": rafaksi,
                    "NETTO 2 (Kg)": netto2,
                    "RITASI": 1
                })
                row_num += 1
                
            except Exception as e:
                print(f"[X] Gagal memparsing baris {no_transaksi}: {e}")
                continue

    print(f"[*] Berhasil memproses {len(data_rows)} baris data transaksi.")

    # 3. LOAD DATA KE EXCEL
    # Ubah list of dict menjadi Pandas DataFrame
    df = pd.DataFrame(data_rows)
    
    print(f"[*] Menyimpan data ke file output: {output_file}...")
    # Menggunakan openpyxl sebagai engine untuk menulis file Excel
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        # Tulis dataframe mulai di baris ke-5 (startrow=4 karena index di pandas dari 0)
        df.to_excel(writer, sheet_name="Rekap Tonase", index=False, startrow=4)
        
        # Ambil objek worksheet untuk menyuntikkan header di bagian atas
        worksheet = writer.sheets["Rekap Tonase"]
        
        # Tulis 4 Baris Header Statis
        worksheet.cell(row=1, column=1, value="DAFTAR REKAPITULASI TONASE SAMPAH YANG MASUK KE TRANS DEPO HARAPAN JAYA")
        # Baris 2 kosong
        worksheet.cell(row=3, column=1, value="PEKERJAAN   : JASA ANGKUTAN PERSAMPAHAN")
        worksheet.cell(row=4, column=1, value=f"PELAKSANA   : LPS KOTA PEKANBARU       TANGGAL : {tanggal}")

    print("[*] Selesai! File rekapitulasi harian siap digunakan.")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Penggunaan: python etl_timbangan.py <input_file.xls> <output_file.xlsx> [tanggal_opsional]")
        print("Contoh: python etl_timbangan.py \"13 APRIL.xls\" \"REKAP TONASE APRIL 2026.xlsx - 13 APR\" \"13-04-2026\"")
        sys.exit(1)
        
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    tgl = sys.argv[3] if len(sys.argv) > 3 else "13-04-2026"
    
    run_etl(input_path, output_path, tgl)
