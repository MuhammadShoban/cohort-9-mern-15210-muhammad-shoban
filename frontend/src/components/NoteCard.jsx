import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { Pin, Edit3, Trash2, Tag, Calendar, Check, X } from 'lucide-react';

const NoteCard = ({ note, onEdit, onDelete, onTogglePin, viewMode }) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPlainTextPreview = (htmlContent) => {
    if (!htmlContent) return 'No additional text...';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = DOMPurify.sanitize(htmlContent);
    const text = tmp.textContent || tmp.innerText || '';
    return text.length > 150 ? text.slice(0, 150) + '...' : text;
  };

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justify: 'space-between',
        position: 'relative',
        transition: 'all var(--transition-normal)',
        borderLeft: note.isPinned ? '4px solid var(--pin-gold)' : (note.color !== '#ffffff' && note.color ? `4px solid ${note.color}` : '1px solid var(--border-color)'),
        backgroundColor: '#ffffff',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div>
        {/* Card Header: Title & Pin Button */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.65rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
            {note.title}
          </h3>
          <button
            onClick={() => onTogglePin(note._id)}
            className="btn-icon"
            style={{
              color: note.isPinned ? 'var(--pin-gold)' : 'var(--text-muted)',
              padding: '0.25rem',
            }}
            title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
          >
            <Pin size={18} fill={note.isPinned ? 'var(--pin-gold)' : 'none'} />
          </button>
        </div>

        {/* Card Content Snippet */}
        <div
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            marginBottom: '1rem',
            lineHeight: 1.5,
            minHeight: viewMode === 'grid' ? '60px' : 'auto',
          }}
        >
          {getPlainTextPreview(note.content)}
        </div>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
            {note.tags.map((tag, idx) => (
              <span key={idx} className="tag-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                <Tag size={10} />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer: Date & Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '0.75rem',
          marginTop: '0.5rem',
        }}
      >
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Calendar size={12} />
          {formatDate(note.updatedAt || note.createdAt)}
        </span>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {!showConfirmDelete ? (
            <>
              <button
                onClick={() => onEdit(note)}
                className="btn-icon"
                title="Edit note"
                style={{ padding: '0.35rem' }}
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="btn-icon"
                title="Delete note"
                style={{ padding: '0.35rem', color: 'var(--danger-color)' }}
              >
                <Trash2 size={16} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(239,68,68,0.1)', padding: '0.2rem 0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--danger-color)', fontWeight: 600 }}>Delete?</span>
              <button
                onClick={() => {
                  onDelete(note._id);
                  setShowConfirmDelete(false);
                }}
                className="btn-icon"
                style={{ padding: '0.2rem', color: 'var(--danger-color)' }}
                title="Confirm delete"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="btn-icon"
                style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                title="Cancel"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
