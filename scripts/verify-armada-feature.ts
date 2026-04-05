
import fetch from 'node-fetch';

async function verifyArmadaFields() {
    const baseUrl = 'http://localhost:3000';

    // 1. Create Armada with new fields
    console.log('Creating test Armada...');
    const payload = {
        namaLps: 'Test Verifikasi LPS',
        platNomor: `BM ${Math.floor(Math.random() * 9000) + 1000} TEST`,
        namaSupir: 'Supir Test',
        noTlpKetuaLps: '08123456789',
        lokasiTransdepo: 'AIRHITAM',
        jenisArmada: 'DUMPTRUCK'
    };

    try {
        const res = await fetch(`${baseUrl}/api/armada`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Failed to create: ${res.status} ${err}`);
        }

        const data: any = await res.json();
        console.log('Created Armada:', data);

        // 2. Verify fields
        const checks = [
            data.namaLps === payload.namaLps,
            data.noTlpKetuaLps === payload.noTlpKetuaLps,
            data.lokasiTransdepo === payload.lokasiTransdepo,
            data.jenisArmada === payload.jenisArmada
        ];

        if (checks.every(Boolean)) {
            console.log('✅ All fields verifiable!');
        } else {
            console.error('❌ Field mismatch:', {
                expected: payload,
                received: {
                    namaLps: data.namaLps,
                    noTlpKetuaLps: data.noTlpKetuaLps,
                    lokasiTransdepo: data.lokasiTransdepo,
                    jenisArmada: data.jenisArmada
                }
            });
        }

        // 3. Clean up
        console.log('Cleaning up...');
        const delRes = await fetch(`${baseUrl}/api/armada/${data.id}`, {
            method: 'DELETE'
        });

        if (delRes.ok) {
            console.log('✅ Test data deleted successfully.');
        } else {
            console.error('❌ Failed to delete test data.');
        }

    } catch (error) {
        console.error('Verification failed:', error);
    }
}

verifyArmadaFields();
