
'use client';

import { useState, useEffect, useRef } from 'react';

interface Note {
    id: string;
    title: string;
    fileUrl: string;
    fileType: 'pdf' | 'image';
    createdAt: string;
}

export function MeetingNotes() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const res = await fetch('/api/meeting-notes');
            if (res.ok) {
                const data = await res.json();
                setNotes(data);
            }
        } catch (error) {
            console.error('Failed to fetch notes', error);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('Ukuran file maksimal 5MB');
            return;
        }

        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            alert('Hanya file PDF dan JPEG/JPG yang diizinkan');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/meeting-notes', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                await fetchNotes(); // refresh list
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                alert('Gagal mengupload file');
            }
        } catch (error) {
            console.error('Upload failed', error);
            alert('Terjadi kesalahan saat upload');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="card p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Catatan Rapat</h3>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium"
                >
                    {uploading ? (
                        <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Upload
                        </>
                    )}
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUpload}
                    accept=".pdf,.jpg,.jpeg"
                    className="hidden"
                />
            </div>

            {notes.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    Belum ada catatan rapat
                </div>
            ) : (
                <>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar mb-2">
                        {notes.slice(0, 5).map((note) => (
                            <div key={note.id} className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${note.fileType === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    {note.fileType === 'pdf' ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate" title={note.title}>{note.title}</p>
                                    <p className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleDateString('id-ID')}</p>
                                </div>
                                <a
                                    href={note.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        ))}
                    </div>
                    {notes.length > 0 && (
                        <div className="text-center pt-2 border-t border-gray-100">
                            <a href="/notes" className="text-sm text-green-600 hover:text-green-700 font-medium hover:underline inline-flex items-center gap-1">
                                Lihat Semua ({notes.length} file)
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </a>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
