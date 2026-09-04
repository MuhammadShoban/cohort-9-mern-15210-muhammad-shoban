import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import Navbar from '../components/Navbar';
import NoteCard from '../components/NoteCard';
import NoteEditorModal from '../components/NoteEditorModal';
import UserProfileModal from '../components/UserProfileModal';
import { Plus, Pin, FileText, SearchX, Loader2, StickyNote } from 'lucide-react';

const Dashboard = () => {
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  // Fetch Notes from Backend
  const fetchNotes = useCallback(async (query = '') => {
    try {
      setLoading(true);
      setError('');
      const endpoint = query ? `/notes?search=${encodeURIComponent(query)}` : '/notes';
      const { data } = await API.get(endpoint);
      if (data.success) {
        setNotes(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
      setError('Could not load notes. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotes(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchNotes]);

  // Handlers for Create/Edit Save
  const handleSaveNote = async (noteData) => {
    if (selectedNote) {
      // Update existing note
      const { data } = await API.put(`/notes/${selectedNote._id}`, noteData);
      if (data.success) {
        setNotes((prev) =>
          prev.map((n) => (n._id === selectedNote._id ? data.data : n))
        );
      }
    } else {
      // Create new note
      const { data } = await API.post('/notes', noteData);
      if (data.success) {
        setNotes((prev) => [data.data, ...prev]);
      }
    }
    fetchNotes(searchQuery);
  };

  // Toggle Pin
  const handleTogglePin = async (id) => {
    try {
      setNotes((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isPinned: !n.isPinned } : n))
      );
      await API.patch(`/notes/${id}/pin`);
      fetchNotes(searchQuery);
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  // Delete Note
  const handleDeleteNote = async (id) => {
    try {
      setNotes((prev) => prev.filter((n) => n._id !== id));
      await API.delete(`/notes/${id}`);
    } catch (err) {
      console.error('Failed to delete note:', err);
      fetchNotes(searchQuery);
    }
  };

  // Open Editor for Creation
  const handleOpenCreate = () => {
    setSelectedNote(null);
    setIsEditorOpen(true);
  };

  // Open Editor for Editing
  const handleOpenEdit = (note) => {
    setSelectedNote(note);
    setIsEditorOpen(true);
  };

  // Separate pinned and unpinned notes
  const pinnedNotes = notes.filter((n) => n.isPinned);
  const otherNotes = notes.filter((n) => !n.isPinned);

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenCreateModal={handleOpenCreate}
        onOpenProfileModal={() => setIsProfileOpen(true)}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* Dashboard Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              My Notes <span style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent-primary)', border: '1px solid var(--border-color)' }}>{notes.length}</span>
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {searchQuery ? `Search results for "${searchQuery}"` : 'Manage, create and organize your notes efficiently'}
            </p>
          </div>

          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Create Note</span>
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <Loader2 size={36} className="spin" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem', color: 'var(--accent-primary)' }} />
            <p style={{ fontSize: '0.95rem' }}>Loading your notes...</p>
          </div>
        )}

        {/* Error Alert */}
        {error && !loading && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', margin: '2rem 0' }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Empty State */}
            {notes.length === 0 && (
              <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '520px', margin: '3rem auto', backgroundColor: '#ffffff' }}>
                {searchQuery ? (
                  <>
                    <SearchX size={52} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Notes Found</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                      No notes matched your search query "{searchQuery}". Try searching for another word.
                    </p>
                    <button className="btn-secondary" onClick={() => setSearchQuery('')}>
                      Clear Search
                    </button>
                  </>
                ) : (
                  <>
                    <StickyNote size={52} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Notes Yet</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                      Capture your thoughts, ideas, or task lists with our rich text note editor.
                    </p>
                    <button className="btn-primary" onClick={handleOpenCreate}>
                      <Plus size={18} />
                      Create Your First Note
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Pinned Notes Section */}
            {pinnedNotes.length > 0 && (
              <section style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--pin-gold)', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  <Pin size={16} fill="var(--pin-gold)" /> Pinned Notes ({pinnedNotes.length})
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr',
                    gap: '1.25rem',
                  }}
                >
                  {pinnedNotes.map((note) => (
                    <NoteCard
                      key={note._id}
                      note={note}
                      onEdit={handleOpenEdit}
                      onDelete={handleDeleteNote}
                      onTogglePin={handleTogglePin}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Other / All Notes Section */}
            {otherNotes.length > 0 && (
              <section>
                {pinnedNotes.length > 0 && (
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                    Other Notes ({otherNotes.length})
                  </h3>
                )}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr',
                    gap: '1.25rem',
                  }}
                >
                  {otherNotes.map((note) => (
                    <NoteCard
                      key={note._id}
                      note={note}
                      onEdit={handleOpenEdit}
                      onDelete={handleDeleteNote}
                      onTogglePin={handleTogglePin}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Note Editor Modal */}
      <NoteEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveNote}
        initialData={selectedNote}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        noteCount={notes.length}
      />
    </div>
  );
};

export default Dashboard;
