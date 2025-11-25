import Poll from '../models/Poll.js';
import sanitizeHtml from 'sanitize-html';
import axios from 'axios';

let io;

export const setSocketIO = (socketIO) => {
  io = socketIO;
};

// Helper to find poll
const findPoll = async (id) => {
  return await Poll.findById(id);
};

export const createPoll = async (req, res) => {
  try {
    const { title, description, options } = req.body;
    const user = req.user;

    // Validation
    if (!title || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Title and at least 2 valid options are required' });
    }

    // Sanitize input
    const cleanTitle = sanitizeHtml(title);
    const cleanDescription = sanitizeHtml(description || '');

    const mappedOptions = options
      .map(opt => {
        const text = typeof opt === 'string' ? opt : opt.text;

        if (!text || typeof text !== 'string') return null;

        return {
          text: sanitizeHtml(text),
          votes: 0
        };
      })
      .filter(o => o !== null);

    if (mappedOptions.length < 2) {
      return res.status(400).json({ error: 'Options must contain at least 2 valid text values' });
    }

    const pollData = {
      title: cleanTitle,
      description: cleanDescription,
      options: mappedOptions,
      createdBy: user.uid,
      createdByEmail: user.email,
      createdByName: user.displayName,
      createdAt: new Date()
    };

    const poll = await Poll.create(pollData);

    res.status(201).json(poll);
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ error: 'Failed to create poll' });
  }
};

export const getPolls = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const polls = await Poll.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const count = await Poll.countDocuments();

    res.status(200).json({
      page,
      limit,
      total: count,
      data: polls
    });
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
};

export const getPollById = async (req, res) => {
  try {
    const { id } = req.params;
    const poll = await findPoll(id);

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    res.status(200).json(poll);
  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({ error: 'Failed to fetch poll' });
  }
};

export const voteOnPoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { optionIndex, voterId } = req.body;
    
    // Support both authenticated and anonymous voting
    // For authenticated users: use req.user.uid
    // For anonymous users: use voterId from frontend (IP-based or session-based ID)
    const userId = req.user ? req.user.uid : voterId;

    if (!userId) {
      return res.status(400).json({ error: 'Voter identification is required' });
    }

    if (optionIndex === undefined || optionIndex < 0) {
      return res.status(400).json({ error: 'Valid optionIndex is required' });
    }

    const poll = await findPoll(id);

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (optionIndex >= poll.options.length) {
      return res.status(400).json({ error: 'Invalid option index' });
    }

    // Prevent double voting
    if (poll.votedBy.includes(userId)) {
      return res.status(403).json({ error: 'You have already voted on this poll' });
    }

    poll.options[optionIndex].votes += 1;
    poll.votedBy.push(userId);

    await poll.save();

    // Emit update safely
    if (io) {
      const room = `poll_${id}`;
      io.to(room).emit('update_poll', poll);
    }

    res.status(200).json({ message: 'Vote recorded successfully', poll });
  } catch (error) {
    console.error('Error voting on poll:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
};

export const updatePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, options } = req.body;
    const user = req.user;

    const poll = await findPoll(id);

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Authorization: Only creator can edit
    if (poll.createdBy !== user.uid) {
      return res.status(403).json({ error: 'You are not authorized to edit this poll' });
    }

    // Validation
    if (!title || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Title and at least 2 valid options are required' });
    }

    // Sanitize input
    const cleanTitle = sanitizeHtml(title);
    const cleanDescription = sanitizeHtml(description || '');

    const mappedOptions = options
      .map(opt => {
        const text = typeof opt === 'string' ? opt : opt.text;
        const votes = typeof opt === 'object' && opt.votes !== undefined ? opt.votes : 0;

        if (!text || typeof text !== 'string') return null;

        return {
          text: sanitizeHtml(text),
          votes: votes
        };
      })
      .filter(o => o !== null);

    if (mappedOptions.length < 2) {
      return res.status(400).json({ error: 'Options must contain at least 2 valid text values' });
    }

    // Update poll
    poll.title = cleanTitle;
    poll.description = cleanDescription;
    poll.options = mappedOptions;
    poll.updatedAt = new Date();

    await poll.save();

    // Emit update to connected clients
    if (io) {
      const room = `poll_${id}`;
      io.to(room).emit('update_poll', poll);
    }

    res.status(200).json({ message: 'Poll updated successfully', poll });
  } catch (error) {
    console.error('Error updating poll:', error);
    res.status(500).json({ error: 'Failed to update poll' });
  }
};

export const deletePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const poll = await findPoll(id);

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Authorization: Only creator can delete
    if (poll.createdBy !== user.uid) {
      return res.status(403).json({ error: 'You are not authorized to delete this poll' });
    }

    await Poll.findByIdAndDelete(id);

    // Emit deletion to connected clients
    if (io) {
      const room = `poll_${id}`;
      io.to(room).emit('poll_deleted', { pollId: id });
    }

    res.status(200).json({ message: 'Poll deleted successfully' });
  } catch (error) {
    console.error('Error deleting poll:', error);
    res.status(500).json({ error: 'Failed to delete poll' });
  }
};

export const getShareLink = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const poll = await findPoll(id);

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Authorization: Only creator can get share link
    if (poll.createdBy !== user.uid) {
      return res.status(403).json({ error: 'You are not authorized to share this poll' });
    }

    // Fetch ngrok public URL
    let ngrokUrl = null;
    try {
      const ngrokResponse = await axios.get('http://127.0.0.1:4040/api/tunnels');
      const tunnels = ngrokResponse.data.tunnels;
      
      // Find the HTTPS tunnel
      const httpsTunnel = tunnels.find(tunnel => tunnel.proto === 'https');
      
      if (httpsTunnel) {
        ngrokUrl = httpsTunnel.public_url;
      } else {
        // Fallback to any available tunnel
        const anyTunnel = tunnels.find(tunnel => tunnel.public_url);
        if (anyTunnel) {
          ngrokUrl = anyTunnel.public_url.replace('http://', 'https://');
        }
      }
    } catch (ngrokError) {
      console.error('Error fetching ngrok URL:', ngrokError.message);
      // If ngrok is not running, return a fallback URL (frontend URL)
      const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';
      return res.status(503).json({ 
        error: 'Ngrok is not running. Please start ngrok first.',
        fallbackUrl: `${frontendUrl}/poll/${id}`
      });
    }

    if (!ngrokUrl) {
      const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';
      return res.status(503).json({ 
        error: 'No active ngrok tunnel found',
        fallbackUrl: `${frontendUrl}/poll/${id}`
      });
    }

    // Generate share link
    const shareLink = `${ngrokUrl}/poll/${id}`;

    res.status(200).json({ 
      shareLink,
      pollId: id,
      pollTitle: poll.title
    });
  } catch (error) {
    console.error('Error generating share link:', error);
    res.status(500).json({ error: 'Failed to generate share link' });
  }
};
