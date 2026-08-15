const fs = require('fs');

async function main() {
    const res = await fetch('https://id.wikipedia.org/wiki/Daftar_kecamatan_dan_kelurahan_di_Kota_Pekanbaru');
    const text = await res.text();
    
    // Extract everything in the tables under "Kelurahan"
    const regex = /title="([^"]+?)(?: \([^)]+\))?">([^<]+)<\/a>/g;
    let match;
    const wikiSet = new Set();
    while ((match = regex.exec(text)) !== null) {
        const name = match[2];
        if (name && !name.includes('Kecamatan') && !name.includes('Kota')) {
            wikiSet.add(name);
        }
    }
    
    const myArr = [
        'Agrowisata',          'Air Dingin',         'Air Hitam',
        'Air Putih',           'Bambu Kuning',       'Bandar Raya',
        'Binaraga',            'Binawidya',          'Cinta Raja',
        'Delima',              'Harjosari',          'Industri Tenayan',
        'Jadirejo',            'Kampung Bandar',     'Kampung Baru',
        'Kampung Dalam',       'Kampung Melayu',     'Kampung Tengah',
        'Kedung Sari',         'Kota Baru',          'Kota Tinggi',
        'Kulim',               'Labuh Baru Barat',   'Labuh Baru Timur',
        'Lembah Damai',        'Limbungan',          'Limbungan Baru',
        'Maharani',            'Maharatu',           'Melebung',
        'Mentangor',           'Meranti Pandak',     'Muara Fajar Barat',
        'Muara Fajar Timur',   'Padang Bulan',       'Padang Terubuk',
        'Palas',               'Pebatuan',           'Pematangkapau',
        'Perhentian Marpoyan', 'Pesisir',            'Pulau Karam',
        'Rantau Panjang',      'Rejosari',           'Rintis',
        'Rumbai Bukit',        'Rumbai Sipat',       'Sago',
        'Sekip',               'Sialang Munggu',     'Sialang Rampai',
        'Sialang Sakti',       'Sidomulyo Barat',    'Sidomulyo Timur',
        'Simpang Baru',        'Simpang Empat',      'Simpang Tiga',
        'Sri Meranti',         'Sukajadi',           'Sukamaju',
        'Sukamulya',           'Sukaramai',          'Sumahilang',
        'Sungai Ambang',       'Sungai Sibam',       'Sungai Ukai',
        'Tampan',              'Tanah Datar',        'Tangkerang Barat',
        'Tangkerang Labuai',   'Tangkerang Selatan', 'Tangkerang Tengah',
        'Tangkerang Timur',    'Tangkerang Utara',   'Tirta Siak',
        'Tobek Godang',        'Tuah Karya',         'Tuah Madani',
        'Tuah Negeri',         'Umban Sari',         'Wonorejo'
    ];
    
    console.log("Found in Wikipedia:", wikiSet.size);
    // Let's dump all wiki names that are NOT in myArr
    const missing = [];
    for (const w of wikiSet) {
        if (!myArr.includes(w) && !myArr.includes(w.replace('Kelurahan ', ''))) {
            missing.push(w);
        }
    }
    console.log("Missing from our list:", missing);
}

main().catch(console.error);
