import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

const MONTHS: Record<string, [string, string, string]> = {
    "JAN": ["JANUARI", "01", "JAN"],
    "JANUARI": ["JANUARI", "01", "JAN"],
    "FEB": ["FEBRUARI", "02", "FEB"],
    "FEBRUARI": ["FEBRUARI", "02", "FEB"],
    "MAR": ["MARET", "03", "MAR"],
    "MARET": ["MARET", "03", "MAR"],
    "APR": ["APRIL", "04", "APR"],
    "APRIL": ["APRIL", "04", "APR"],
    "MEI": ["MEI", "05", "MEI"],
    "JUN": ["JUNI", "06", "JUN"],
    "JUNI": ["JUNI", "06", "JUN"],
    "JUL": ["JULI", "07", "JUL"],
    "JULI": ["JULI", "07", "JUL"],
    "AGS": ["AGUSTUS", "08", "AGS"],
    "AGUSTUS": ["AGUSTUS", "08", "AGS"],
    "SEP": ["SEPTEMBER", "09", "SEP"],
    "SEPTEMBER": ["SEPTEMBER", "09", "SEP"],
    "OKT": ["OKTOBER", "10", "OKT"],
    "OKTOBER": ["OKTOBER", "10", "OKT"],
    "NOV": ["NOVEMBER", "11", "NOV"],
    "NOVEMBER": ["NOVEMBER", "11", "NOV"],
    "DES": ["DESEMBER", "12", "DES"],
    "DESEMBER": ["DESEMBER", "12", "DES"],
};

function parseNamaFile(filename: string, tahun = 2026) {
    let base = filename.replace(/\.(xls|xlsx)$/i, '').toUpperCase();
    base = base.replace(/_/g, ' ').replace(/-/g, ' ');

    const match = base.match(/(\d{1,2})\s*([A-Z]+)/);
    if (!match) {
        throw new Error("Nama file harus mengandung tanggal dan bulan, contoh: 13 APRIL.xls");
    }

    const hari = parseInt(match[1], 10);
    const bulanKey = match[2].toUpperCase();

    if (!MONTHS[bulanKey]) {
        throw new Error(`Bulan tidak dikenali: ${bulanKey}`);
    }

    const [bulanPanjang, bulanAngka, bulanSingkat] = MONTHS[bulanKey];
    const hariStr = hari.toString().padStart(2, '0');
    
    const sheetName = `${hariStr} ${bulanSingkat}`;
    const tanggal = `${hariStr}-${bulanAngka}-${tahun}`;
    const outputName = `REKAP TONASE ${bulanPanjang} ${tahun}.xlsx`;

    return { sheetName, tanggal, outputName };
}

function cleanText(value: unknown): string {
    if (value === null || value === undefined) return "";
    return String(value).trim();
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const tahunStr = formData.get("tahun") as string;
        const tahun = tahunStr ? parseInt(tahunStr, 10) : 2026;

        if (!file) return NextResponse.json({ error: "File sumber tidak ditemukan" }, { status: 400 });

        let fileInfo;
        try {
            fileInfo = parseNamaFile(file.name, tahun);
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            return NextResponse.json({ error: errorMessage }, { status: 400 });
        }
        const { sheetName, tanggal, outputName } = fileInfo;

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sourceSheetName = workbook.SheetNames[0];
        const sourceSheet = workbook.Sheets[sourceSheetName];
        
        const df: unknown[][] = XLSX.utils.sheet_to_json(sourceSheet, { header: 1, defval: '' }) as unknown[][];

        const dataRows = [];
        let noUrut = 1;

        for (const row of df) {
            if (!row || !Array.isArray(row)) continue;

            const cleanCells = row.map(cleanText).filter(x => x !== "");
            if (cleanCells.length < 5) continue;

            const rowText = cleanCells.join(" ").toLowerCase();
            if (rowText.includes("total pembelian") || rowText.includes("jumlah")) continue;

            let noTiket = "";
            let platNo = "";
            let idxPlat = -1;

            for (let i = 0; i < cleanCells.length; i++) {
                const cellUpper = cleanCells[i].toUpperCase();
                if (cellUpper.startsWith("INV/")) {
                    noTiket = cellUpper;
                } else if (/^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$/.test(cellUpper)) {
                    platNo = cellUpper;
                    idxPlat = i;
                }
            }

            if (!noTiket || !platNo) continue;

            const namaSupir = (idxPlat + 1 < cleanCells.length) ? cleanCells[idxPlat + 1] : "";
            const namaKebun = (idxPlat + 2 < cleanCells.length) ? cleanCells[idxPlat + 2] : "";

            const angkaValid: number[] = [];

            for (const cell of cleanCells) {
                const strVal = String(cell).replace(/,/g, '').trim();
                const num = parseFloat(strVal);
                
                if (!isNaN(num) && strVal !== "") {
                    if (num < 40000) {
                        angkaValid.push(Math.trunc(num));
                    }
                }
            }

            let gross = 0, tare = 0, netto1 = 0, rafaksi = 0, netto2 = 0;

            if (angkaValid.length >= 5) {
                const slice = angkaValid.slice(-5);
                [gross, tare, netto1, rafaksi, netto2] = slice;
            } else if (angkaValid.length === 4) {
                const slice = angkaValid.slice(-4);
                [gross, tare, netto1, netto2] = slice;
                rafaksi = 0;
            } else {
                continue;
            }

            let pengirim = namaKebun.toUpperCase();
            if (pengirim && !pengirim.startsWith("LPS")) {
                pengirim = `LPS ${pengirim}`;
            }

            dataRows.push({
                "NO": noUrut,
                "NO TIKET": noTiket,
                "NO POLISI": platNo,
                "NAMA SUPIR": namaSupir.toUpperCase(),
                "JENIS MOBIL": "",
                "PENGIRIM": pengirim,
                "JENIS SAMPAH": "SAMPAH",
                "GROSS (KG)": gross,
                "TARE (KG)": tare,
                "NETTO 1 (KG)": netto1,
                "RAFAKSI": rafaksi,
                "NETTO 2 (Kg)": netto2,
                "RITASI": 1,
            });

            noUrut++;
        }

        if (dataRows.length === 0) {
            return NextResponse.json({ error: "Tidak ada transaksi valid yang ditemukan dari file sumber." }, { status: 400 });
        }

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet(sheetName);

        const thinBorder: Partial<ExcelJS.Borders> = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        };

        const centerAlignment: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle', wrapText: true };
        const leftAlignment: Partial<ExcelJS.Alignment> = { horizontal: 'left', vertical: 'middle', wrapText: true };

        ws.mergeCells("A1:M1");
        const titleCell = ws.getCell("A1");
        titleCell.value = "DAFTAR REKAPITULASI TONASE SAMPAH YANG MASUK KE TRANS DEPO HARAPAN JAYA";
        titleCell.font = { bold: true, size: 12 };
        titleCell.alignment = centerAlignment;

        ws.getCell("A3").value = "PEKERJAAN";
        ws.getCell("D3").value = ": JASA ANGKUTAN PERSAMPAHAN";

        ws.getCell("A4").value = "PELAKSANA";
        ws.getCell("D4").value = ": LPS KOTA PEKANBARU";
        ws.getCell("K4").value = `TANGGAL : ${tanggal}`;

        ["A3", "A4", "D3", "D4", "K4"].forEach(cellRef => {
            ws.getCell(cellRef).font = { bold: true };
        });

        const headers = [
            "NO", "NO TIKET", "NO POLISI", "NAMA SUPIR", "JENIS MOBIL", 
            "PENGIRIM", "JENIS SAMPAH", "GROSS (KG)", "TARE (KG)", 
            "NETTO 1 (KG)", "RAFAKSI", "NETTO 2 (Kg)", "RITASI"
        ];

        const startRow = 5;

        for (let col = 1; col <= headers.length; col++) {
            const cell = ws.getCell(startRow, col);
            cell.value = headers[col - 1];
            cell.font = { bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
            cell.border = thinBorder;
            cell.alignment = centerAlignment;
        }

        for (let rIdx = 0; rIdx < dataRows.length; rIdx++) {
            const item = dataRows[rIdx];
            const rowNum = startRow + 1 + rIdx;

            const values = [
                item["NO"],
                item["NO TIKET"],
                item["NO POLISI"],
                item["NAMA SUPIR"],
                item["JENIS MOBIL"],
                item["PENGIRIM"],
                item["JENIS SAMPAH"],
                item["GROSS (KG)"],
                item["TARE (KG)"],
                item["NETTO 1 (KG)"],
                item["RAFAKSI"],
                item["NETTO 2 (Kg)"],
                item["RITASI"],
            ];

            for (let cIdx = 1; cIdx <= values.length; cIdx++) {
                const cell = ws.getCell(rowNum, cIdx);
                cell.value = values[cIdx - 1] as string | number;
                cell.border = thinBorder;
                cell.alignment = [2, 4, 6, 7].includes(cIdx) ? leftAlignment : centerAlignment;
                
                if ([8, 9, 10, 11, 12, 13].includes(cIdx)) {
                    cell.numFmt = '#,##0';
                }
            }
        }

        const totalRow = startRow + dataRows.length + 1;
        ws.mergeCells(totalRow, 1, totalRow, 9);
        const totalLabelCell = ws.getCell(totalRow, 1);
        totalLabelCell.value = "TOTAL";
        totalLabelCell.font = { bold: true };
        totalLabelCell.alignment = centerAlignment;

        ws.getCell(totalRow, 10).value = { formula: `SUM(J${startRow + 1}:J${totalRow - 1})` };
        ws.getCell(totalRow, 13).value = { formula: `SUM(M${startRow + 1}:M${totalRow - 1})` };

        for (let col = 1; col <= 13; col++) {
            const cell = ws.getCell(totalRow, col);
            cell.border = thinBorder;
            cell.font = { bold: true };
            if (col === 10 || col === 13) {
                 cell.numFmt = '#,##0';
                 cell.alignment = centerAlignment;
            } else if (col !== 1) {
                 cell.alignment = centerAlignment;
            }
        }

        const widths: Record<string, number> = {
            "A": 5, "B": 22, "C": 15, "D": 22, "E": 15, "F": 24,
            "G": 18, "H": 14, "I": 14, "J": 14, "K": 12, "L": 14, "M": 10,
        };

        Object.keys(widths).forEach(colStr => {
            const col = ws.getColumn(colStr);
            col.width = widths[colStr];
        });

        ws.getRow(1).height = 25;
        ws.getRow(5).height = 35;

        ws.views = [
            { state: 'frozen', ySplit: 5 }
        ];

        const xlsxBuffer = await wb.xlsx.writeBuffer();
        
        const stats = {
            totalRawRows: df.length,
            processed: dataRows.length,
            skippedNoise: df.length - dataRows.length,
            skippedHeaders: 0,
            skippedEmpty: 0,
            skippedTotals: 0,
            formatDetected: 'Laporan Transaksi Pembelian',
            dateSource: 'Nama File',
        };

        return new NextResponse(xlsxBuffer as ArrayBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${outputName}"`,
                'X-Stats': JSON.stringify(stats),
            },
        });

    } catch (error: unknown) {
        console.error("Transform Error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: "Gagal memproses file: " + errorMessage },
            { status: 500 }
        );
    }
}

