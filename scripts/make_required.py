import re

file_path = r'd:\project\LPS\lps-app\src\app\dashboard\laporan-lps\baru\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

validation_code = '''
        if (!formData.bulan || !formData.kelurahan) {
            alert('Bulan dan Kelurahan wajib diisi!')
            return
        }

        const iuran = formData.kinerjaIuran;
        if (!iuran.pemanfaatanIuran || !iuran.permasalahan || !iuran.aksiYangDilakukan) {
            alert('Seluruh field teks pada tab Iuran wajib diisi!');
            setActiveTab('iuran');
            return;
        }'''
content = content.replace('''
        if (!formData.bulan || !formData.kelurahan) {
            alert('Bulan dan Kelurahan wajib diisi!')
            return
        }''', validation_code)

iuran_tab_start = content.find('{/* Tab Iuran */}')
iuran_tab_end = content.find('{/* Action Buttons */}', iuran_tab_start)

iuran_content = content[iuran_tab_start:iuran_tab_end]

iuran_content = re.sub(
    r'(<label[^>]*>)(.*?)(</label>)',
    r'\1\2 <span className="text-red-500">*</span>\3',
    iuran_content
)

iuran_content = re.sub(
    r'(<(?:input|textarea)[^>]*?)(className=[\'\"].*?[\'\"])',
    r'\1required \2',
    iuran_content
)

content = content[:iuran_tab_start] + iuran_content + content[iuran_tab_end:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
