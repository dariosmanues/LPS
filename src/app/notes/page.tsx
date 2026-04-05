
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Note {
    id: string;
    title: string;
    fileUrl?: string;
    content?: string;
    fileType: 'pdf' | 'image' | 'summary';
    createdAt: string;
}

interface ToDo {
    id: string;
    text: string;
    date: string;
    isDone: boolean;
    category: string;
}

interface Summary {
    content: string;
}

interface ArchiveSummary {
    id: string;
    content: string;
    archivedAt: string;
}

const CATEGORIES = [
    { id: 'RAPAT', label: 'Rapat', color: 'bg-blue-100 text-blue-700' },
    { id: 'KUNJUNGAN', label: 'Kunjungan ke LPS', color: 'bg-purple-100 text-purple-700' },
    { id: 'SURVEY', label: 'Survey Lapangan', color: 'bg-green-100 text-green-700' },
];

export default function NotesPage() {
    // --- States ---
    const [notes, setNotes] = useState<Note[]>([]);
    const [todos, setTodos] = useState<ToDo[]>([]);
    const [summary, setSummary] = useState('');
    const [uploading, setUploading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedSummary, setSelectedSummary] = useState<string | null>(null);

    // Add Form State
    const [newTodo, setNewTodo] = useState('');
    const [newCategory, setNewCategory] = useState('RAPAT');

    // Edit Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [editCategory, setEditCategory] = useState('');

    const [savingSummary, setSavingSummary] = useState(false);
    const [currentTime, setCurrentTime] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Effects ---
    useEffect(() => {
        fetchNotesAndArchives();
        fetchTodos();
        fetchSummary();
        // Set initial time on client only
        setCurrentTime(new Date().toLocaleTimeString());
        // Update time every second
        const interval = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // --- Fetchers ---
    const fetchNotesAndArchives = async () => {
        try {
            const [notesRes, archivesRes] = await Promise.all([
                fetch('/api/meeting-notes'),
                fetch('/api/meeting-summary/archive')
            ]);

            let allNotes: Note[] = [];

            if (notesRes.ok) {
                const fetchedNotes = await notesRes.json();
                allNotes = [...allNotes, ...fetchedNotes];
            }

            if (archivesRes.ok) {
                const archives: ArchiveSummary[] = await archivesRes.json();
                const archiveNotes: Note[] = archives.map(a => ({
                    id: a.id,
                    title: `Meeting Summary - ${new Date(a.archivedAt).toLocaleDateString('id-ID')}`,
                    content: a.content,
                    fileType: 'summary',
                    createdAt: a.archivedAt
                }));
                allNotes = [...allNotes, ...archiveNotes];
            }

            // Sort by date desc
            allNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setNotes(allNotes);
        } catch (e) {
            console.error('Error fetching data:', e);
        }
    };

    const fetchTodos = async () => {
        try {
            const res = await fetch('/api/todos');
            if (res.ok) setTodos(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchSummary = async () => {
        try {
            const res = await fetch('/api/meeting-summary');
            if (res.ok) {
                const data = await res.json();
                setSummary(data.content || '');
            }
        } catch (e) { console.error(e); }
    };

    // --- Handlers ---
    // ... File Upload (unchanged)
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) return alert('Max 10MB');

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/meeting-notes', { method: 'POST', body: formData });
            if (res.ok) {
                await fetchNotesAndArchives();
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else alert('Upload failed');
        } catch (e) { alert('Error uploading'); }
        finally { setUploading(false); }
    };

    const handleAddTodo = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch('/api/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: newTodo || 'Jadwal Baru',
                    date: selectedDate,
                    category: newCategory
                })
            });
            if (res.ok) {
                setNewTodo('');
                setNewCategory('RAPAT');
                fetchTodos();
            }
        } catch (e) { console.error(e); }
    };

    const toggleTodo = async (id: string, isDone: boolean) => {
        try {
            setTodos(todos.map(t => t.id === id ? { ...t, isDone } : t));
            await fetch('/api/todos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isDone })
            });
        } catch (e) { fetchTodos(); }
    };

    const startEditing = (todo: ToDo) => {
        setEditingId(todo.id);
        setEditText(todo.text);
        setEditCategory(todo.category || 'RAPAT');
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditText('');
        setEditCategory('');
    };

    const saveEdit = async () => {
        if (!editingId) return;
        try {
            const res = await fetch('/api/todos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingId,
                    text: editText,
                    category: editCategory
                })
            });
            if (res.ok) {
                fetchTodos();
                cancelEditing();
            }
        } catch (e) { alert('Gagal menyimpan perubahan'); }
    };

    const deleteTodo = async (id: string) => {
        if (!confirm('Hapus jadwal ini?')) return;
        try {
            setTodos(todos.filter(t => t.id !== id));
            await fetch(`/api/todos?id=${id}`, { method: 'DELETE' });
        } catch (e) { fetchTodos(); }
    };

    const saveSummary = async () => {
        if (!summary || summary.trim() === '') {
            alert('Meeting summary kosong, tidak ada yang disimpan ke arsip');
            return;
        }

        setSavingSummary(true);
        try {
            // Archive the current summary
            const archiveRes = await fetch('/api/meeting-summary/archive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: summary })
            });

            if (archiveRes.ok) {
                // Clear the summary
                setSummary('');
                alert('Meeting summary berhasil disimpan ke arsip!');
                // Refresh list
                fetchNotesAndArchives();
            } else {
                const errorData = await archiveRes.json();
                alert('Gagal menyimpan ke arsip: ' + (errorData.error || 'Unknown error'));
            }
        } catch (e) {
            console.error('Error saving summary:', e);
            alert('Gagal menyimpan summary ke arsip');
        } finally {
            setSavingSummary(false);
        }
    };

    // --- Helpers ---
    const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()));

    // Calendar Logic
    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();

    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

    const isSameDay = (d1: Date, d2: Date) =>
        d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear();

    const getTodosForDay = (day: number) => {
        const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
        return todos.filter(t => isSameDay(new Date(t.date), date));
    };

    const currentTodos = todos.filter(t => isSameDay(new Date(t.date), selectedDate));

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Catatan & Jadwal Tim LPS</h1>
                        <p className="text-gray-500">Kelola jadwal tim, rapat, kunjungan dan arsip dokumen.</p>
                    </div>
                    <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Kembali
                    </Link>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Col: Calendar & Schedule */}
                    <div className="space-y-6">
                        {/* Calendar */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-800">
                                    {selectedDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                </h3>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))}
                                        className="p-1 hover:bg-gray-100 rounded"
                                    >←</button>
                                    <button
                                        onClick={() => setSelectedDate(new Date())}
                                        className="text-xs font-medium text-green-600 hover:bg-green-50 px-2 py-1 rounded"
                                    >Hari Ini</button>
                                    <button
                                        onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))}
                                        className="p-1 hover:bg-gray-100 rounded"
                                    >→</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-400 mb-2">
                                <div>M</div><div>S</div><div>S</div><div>R</div><div>K</div><div>J</div><div>S</div>
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {calendarDays.map((day, i) => {
                                    if (!day) return <div key={i} />;
                                    const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
                                    const isSelected = isSameDay(date, selectedDate);
                                    const dayTodos = getTodosForDay(day);
                                    const hasTodos = dayTodos.length > 0;
                                    const allDone = hasTodos && dayTodos.every(t => t.isDone);

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedDate(date)}
                                            className={`
                                                relative w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm transition-all
                                                ${isSelected ? 'bg-green-600 text-white shadow-md shadow-green-200' : 'hover:bg-gray-100 text-gray-700'}
                                            `}
                                        >
                                            {day}
                                            {hasTodos && !isSelected && (
                                                <div className={`absolute bottom-0.5 w-1 h-1 rounded-full ${allDone ? 'bg-green-400' : 'bg-orange-400'}`} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Schedule List */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-[500px] flex flex-col">
                            <div className="mb-4">
                                <h3 className="font-semibold text-gray-800">Jadwal Tim LPS</h3>
                                <p className="text-xs text-gray-500">{selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                                {currentTodos.length === 0 && (
                                    <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">
                                        Tidak ada jadwal
                                    </div>
                                )}
                                {currentTodos.map(todo => (
                                    <div key={todo.id} className="relative group bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-green-200 transition-colors">
                                        {/* Edit Mode */}
                                        {editingId === todo.id ? (
                                            <div className="space-y-3">
                                                <select
                                                    value={editCategory}
                                                    onChange={(e) => setEditCategory(e.target.value)}
                                                    className="w-full text-xs font-medium p-2 rounded border border-gray-200"
                                                >
                                                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                                </select>
                                                <textarea
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    className="w-full text-sm p-2 rounded border border-gray-200 resize-none h-20"
                                                    placeholder="Keterangan..."
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={cancelEditing} className="text-xs text-gray-500 hover:bg-gray-200 px-2 py-1 rounded">Batal</button>
                                                    <button onClick={saveEdit} className="text-xs bg-green-600 text-white px-2 py-1 rounded">Simpan</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-start justify-between mb-2">
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${CATEGORIES.find(c => c.id === todo.category)?.color || 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {CATEGORIES.find(c => c.id === todo.category)?.label || todo.category}
                                                    </span>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => startEditing(todo)}
                                                            className="p-1 hover:bg-white rounded text-gray-400 hover:text-blue-500"
                                                            title="Edit"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => deleteTodo(todo.id)}
                                                            className="p-1 hover:bg-white rounded text-gray-400 hover:text-red-500"
                                                            title="Hapus"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={todo.isDone}
                                                        onChange={(e) => toggleTodo(todo.id, e.target.checked)}
                                                        className="mt-1 w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer"
                                                    />
                                                    <p className={`text-sm flex-1 ${todo.isDone ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                                        {todo.text}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleAddTodo} className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500 font-medium ml-1">Kategori Kegiatan</label>
                                    <div className="grid grid-cols-1 gap-2 mt-1">
                                        <select
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                            className="w-full text-sm bg-gray-50 border-none rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                                        >
                                            {CATEGORIES.map(c => (
                                                <option key={c.id} value={c.id}>{c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={newTodo}
                                    onChange={e => setNewTodo(e.target.value)}
                                    placeholder="Keterangan / Detail..."
                                    className="w-full bg-gray-50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                                >
                                    + Tambah Jadwal
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Middle Col: Meeting Summary */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Meeting Summary
                            </h3>
                            <button
                                onClick={saveSummary}
                                disabled={savingSummary}
                                className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 font-medium transition-colors"
                            >
                                {savingSummary ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="Tulis ringkasan rapat disini..."
                            className="flex-1 w-full p-4 bg-yellow-50/30 rounded-xl border border-yellow-100 text-gray-700 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-yellow-200 focus:border-transparent min-h-[400px]"
                        />
                        <p className="text-xs text-gray-400 mt-2 text-right">Terakhir disimpan: {currentTime || '--:--:--'}</p>
                    </div>

                    {/* Right Col: File Archive */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-gray-800">Arsip File</h3>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-100 text-xs font-medium transition-colors flex items-center gap-1"
                            >
                                {uploading ? '...' : '+ Upload'}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleUpload}
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                            />
                        </div>

                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Cari file..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                            {filteredNotes.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 text-sm">Belum ada file atau arsip</div>
                            ) : (
                                filteredNotes.map(note => (
                                    <div key={note.id} className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg group transition-colors">
                                        <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${note.fileType === 'pdf' ? 'bg-red-100 text-red-600' :
                                            note.fileType === 'summary' ? 'bg-orange-100 text-orange-600' :
                                                'bg-blue-100 text-blue-600'
                                            }`}>
                                            <span className="text-[10px] font-bold uppercase">
                                                {note.fileType === 'summary' ? 'TXT' : note.fileType}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-700 truncate" title={note.title}>{note.title}</p>
                                            <p className="text-[10px] text-gray-400">{new Date(note.createdAt).toLocaleDateString('id-ID')}</p>
                                        </div>

                                        {note.fileType === 'summary' ? (
                                            <button
                                                onClick={() => setSelectedSummary(note.content || '')}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                        ) : (
                                            <a href={note.fileUrl} target="_blank" className="text-gray-400 hover:text-gray-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary View Modal */}
            {selectedSummary && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Detail Meeting Summary</h3>
                            <button
                                onClick={() => setSelectedSummary(null)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="whitespace-pre-wrap text-base text-gray-700 leading-relaxed font-mono">
                                {selectedSummary}
                            </p>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => setSelectedSummary(null)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
