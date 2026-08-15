import re

file_path = r'd:\project\LPS\lps-app\src\app\dashboard\laporan-lps\baru\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

iuran_tab_start = content.find('{/* Tab Iuran */}')
iuran_tab_end = content.find('{/* Action Buttons */}', iuran_tab_start)

iuran_content = content[iuran_tab_start:iuran_tab_end]

# We know every input/textarea in that block has a className starting with "w-full"
# We just need to prepend `required ` before `className="w-full`
iuran_content = iuran_content.replace('className="w-full', 'required className="w-full')

content = content[:iuran_tab_start] + iuran_content + content[iuran_tab_end:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
