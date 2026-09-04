import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, LogOut, FileText, LayoutGrid, List } from 'lucide-react';

const Navbar = ({
  searchQuery,
  setSearchQuery,
  onOpenCreateModal,
  onOpenProfileModal,
  viewMode,
  setViewMode,
}) => {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="navbar-container glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, position: 'sticky', top: 0, zIndex: 50, backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
          <div style={{ background: 'linear-gradient(135deg, #059669, #10b981)', padding: '0.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(5,150,105,0.3)' }}>
            <FileText size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827' }}>
              NoteSphere
            </h1>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ flex: '1', maxWidth: '480px', position: 'relative', minWidth: '220px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search notes by title, content or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.75rem', paddingRight: searchQuery ? '2.25rem' : '1rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', fontSize: '0.9rem' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', color: 'var(--text-muted)', fontSize: '1rem' }}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '2px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('grid')}
              className="btn-icon"
              style={{ padding: '0.4rem', backgroundColor: viewMode === 'grid' ? 'var(--accent-primary)' : 'transparent', color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)' }}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="btn-icon"
              style={{ padding: '0.4rem', backgroundColor: viewMode === 'list' ? 'var(--accent-primary)' : 'transparent', color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)' }}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>

          {/* New Note Button */}
          <button className="btn-primary" onClick={onOpenCreateModal} style={{ padding: '0.55rem 1.1rem', fontSize: '0.9rem' }}>
            <Plus size={18} />
            <span>New Note</span>
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={onOpenProfileModal}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)' }}
            title="User Profile"
          >
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
              {getInitials(user?.name)}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'User'}
            </span>
          </button>

          {/* Logout Button */}
          <button className="btn-icon" onClick={logout} title="Logout" style={{ color: 'var(--danger-color)' }}>
            <LogOut size={18} />
          </button>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
