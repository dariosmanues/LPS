import csv
import pandas as pd
import sys
import re

def run_etl_v2(input_file, output_file, tanggal="11-06-2026"):
    print(f"[*] Membaca file {input_file}...")
    data_rows = []
    
    with open(input_file, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.reader(f)
        row_num = 1
        
        for row in reader:
            # 1. Bersihkan sel kosong untuk menormalkan data yang bergeser
            clean_cells = [str(x).strip() for x in row if str(x).strip() != '']
            
            # Abaikan baris yang terlalu pendek atau baris total
            if len(clean_cells) < 5:
                continue
            row_text = " ".join(clean_cells).lower()
            if "total pembelian" in row_text or "jumlah" in row_text:
                continue
            
            # 2. Cari NO TIKET (INV/) dan PLAT NOMOR menggunakan Regex
            no_tiket = ""
            plat_no = ""
            idx_plat = -1
            
            for i, cell in enumerate(clean_cells):
                if cell.startswith("INV/"):
                    no_tiket = cell
                # Regex membaca pola plat (Contoh: BM 9885 TS atau BA 9745 AC)
                elif re.match(r'^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$', cell.upper()):
                    plat_no = cell.upper()
                    idx_plat = i
            
            # Jika tidak ada plat nomor, lewati (bukan baris transaksi)
            if not plat_no:
                continue
                
            # 3. Ekstrak data Supir, Kebun, dan Jenis Sampah (berada setelah Plat Nomor)
            nama_supir = clean_cells[idx_plat + 1] if (idx_plat + 1) < len(clean_cells) else ""
            nama_kebun = clean_cells[idx_plat + 2] if (idx_plat + 2) < len(clean_cells) else ""
            jenis_sampah = clean_cells[idx_plat + 3] if (idx_plat + 3) < len(clean_cells) else "SAMPAH RUMAH TANGGA"
            
            # Abaikan cell jenis sampah jika isinya adalah angka berat
            try:
                float(jenis_sampah.replace(',', ''))
                # Jika tidak error, berarti jenis_sampah terambil dari angka berat (produk kosong)
                jenis_sampah = "SAMPAH RUMAH TANGGA"
            except ValueError:
                pass
            
            # 4. Ekstrak Angka Berat secara Dinamis
            angka_valid = []
            for cell in clean_cells:
                try:
                    num = float(cell.replace(',', ''))
                    # FILTER PENTING: Abaikan Serial Date Excel (misal 46125 = 11 Juni 2026)
                    # Dan pastikan kita hanya mengambil angka yang masuk akal sebagai tonase atau rafaksi (0)
                    if num < 40000:
                        angka_valid.append(int(num))
                except ValueError:
                    pass
            
            # Ambil 5 angka berat terakhir (Gross, Tare, Netto1, Rafaksi, Netto2)
            if len(angka_valid) >= 5:
                gross, tare, netto1, rafaksi, netto2 = angka_valid[-5:]
            elif len(angka_valid) == 4:
                # Jika Rafaksi kosong
                gross, tare, netto1, netto2 = angka_valid[-4:]
                rafaksi = 0
            else:
                continue # Skip jika data timbangan korup/tidak lengkap
            
            # Format nama pengirim (tambahkan LPS jika belum ada)
            pengirim_final = f"LPS {nama_kebun}" if not nama_kebun.upper().startswith("LPS") else nama_kebun
            
            data_rows.append({
                "NO": row_num,
                "NO TIKET": no_tiket,
                "NO POLISI": plat_no,
                "NAMA SUPIR": nama_supir,
                "JENIS MOBIL": "PICKUP",
                "PENGIRIM": pengirim_final,
                "JENIS SAMPAH": jenis_sampah,
                "GROSS (KG)": gross,
                "TARE (KG)": tare,
                "NETTO 1 (KG)": netto1,
                "RAFAKSI": rafaksi,
                "NETTO 2 (Kg)": netto2,
                "RITASI": 1
            })
            row_num += 1

    print(f"[*] Berhasil memproses {len(data_rows)} transaksi valid.")

    # 5. Ekspor ke Excel dengan Header Kustom
    df = pd.DataFrame(data_rows)
    print(f"[*] Menyimpan ke {output_file}...")
    
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        # Startrow=4 (index 0) is Row 5 in Excel
        df.to_excel(writer, sheet_name="Rekapitulasi", index=False, startrow=4)
        worksheet = writer.sheets["Rekapitulasi"]
        
        # Suntik Baris Header Statis
        worksheet.cell(row=1, column=1, value="DAFTAR REKAPITULASI TONASE SAMPAH YANG MASUK KE TRANS DEPO HARAPAN JAYA")
        worksheet.cell(row=3, column=1, value="PEKERJAAN   : JASA ANGKUTAN PERSAMPAHAN")
        
        # Gunakan 3 baris header format ringkas seperti permintaan terakhir
        worksheet.cell(row=4, column=1, value="PELAKSANA   : LPS KOTA PEKANBARU")
        worksheet.cell(row=4, column=10, value=f"TANGGAL : {tanggal}")

    print("[*] Selesai!")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Penggunaan: python etl_fix.py <input.csv> <output.xlsx> [tanggal]")
        sys.exit(1)
        
    run_etl_v2(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "11-06-2026")
