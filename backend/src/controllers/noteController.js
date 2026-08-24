import Note from '../models/Note.js';
import logger from '../utils/logger.js';

/**
 * @desc    Create a new note owned by the authenticated user
 * @route   POST /api/notes
 * @access  Private
 */
export const createNote = async (req, res, next) => {
  const log = req.log || logger;
  try {
    const { title, content, tags, isPinned } = req.body;

    if (!title) {
      res.status(400);
      return next(new Error('Note title is required'));
    }

    if (!content) {
      res.status(400);
      return next(new Error('Note content is required'));
    }

    const note = await Note.create({
      user: req.user._id,
      title,
      content,
      tags: tags || [],
      isPinned: isPinned || false,
    });

    log.info({ noteId: note._id, userId: req.user._id }, 'Note created successfully');

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: note,
    });
  } catch (error) {
    log.error({ err: error, userId: req.user?._id }, 'Error creating note');
    next(error);
  }
};

/**
 * @desc    Get all notes belonging to the authenticated user
 * @route   GET /api/notes
 * @access  Private
 */
export const getNotes = async (req, res, next) => {
  const log = req.log || logger;
  try {
    // Sort pinned notes first, then latest updated notes
    const notes = await Note.find({ user: req.user._id }).sort({
      isPinned: -1,
      updatedAt: -1,
    });

    log.info({ userId: req.user._id, count: notes.length }, 'Fetched all user notes');

    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    log.error({ err: error, userId: req.user?._id }, 'Error fetching notes');
    next(error);
  }
};

/**
 * @desc    Get a specific note by ID
 * @route   GET /api/notes/:id
 * @access  Private
 */
export const getNoteById = async (req, res, next) => {
  const log = req.log || logger;
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      res.status(404);
      return next(new Error('Note not found'));
    }

    // Security Check: Enforce user data isolation
    if (note.user.toString() !== req.user._id.toString()) {
      log.warn(
        { noteId: req.params.id, userId: req.user._id, noteOwner: note.user },
        'Unauthorized access attempt to note'
      );
      res.status(403);
      return next(new Error('Forbidden: You can only access your own notes'));
    }

    log.info({ noteId: note._id, userId: req.user._id }, 'Fetched specific note');

    res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error) {
    log.error({ err: error, noteId: req.params.id, userId: req.user?._id }, 'Error retrieving note');
    next(error);
  }
};

/**
 * @desc    Update an existing note
 * @route   PUT /api/notes/:id
 * @access  Private
 */
export const updateNote = async (req, res, next) => {
  const log = req.log || logger;
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      res.status(404);
      return next(new Error('Note not found'));
    }

    // Security Check: Enforce user data isolation
    if (note.user.toString() !== req.user._id.toString()) {
      log.warn(
        { noteId: req.params.id, userId: req.user._id, noteOwner: note.user },
        'Unauthorized update attempt to note'
      );
      res.status(403);
      return next(new Error('Forbidden: You can only update your own notes'));
    }

    const { title, content, tags, isPinned } = req.body;

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = tags;
    if (isPinned !== undefined) note.isPinned = isPinned;

    const updatedNote = await note.save();

    log.info({ noteId: updatedNote._id, userId: req.user._id }, 'Note updated successfully');

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: updatedNote,
    });
  } catch (error) {
    log.error({ err: error, noteId: req.params.id, userId: req.user?._id }, 'Error updating note');
    next(error);
  }
};

/**
 * @desc    Delete a note
 * @route   DELETE /api/notes/:id
 * @access  Private
 */
export const deleteNote = async (req, res, next) => {
  const log = req.log || logger;
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      res.status(404);
      return next(new Error('Note not found'));
    }

    // Security Check: Enforce user data isolation
    if (note.user.toString() !== req.user._id.toString()) {
      log.warn(
        { noteId: req.params.id, userId: req.user._id, noteOwner: note.user },
        'Unauthorized deletion attempt to note'
      );
      res.status(403);
      return next(new Error('Forbidden: You can only delete your own notes'));
    }

    await note.deleteOne();

    log.info({ noteId: req.params.id, userId: req.user._id }, 'Note deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    log.error({ err: error, noteId: req.params.id, userId: req.user?._id }, 'Error deleting note');
    next(error);
  }
};
