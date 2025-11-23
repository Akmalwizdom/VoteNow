import Poll from '../models/Poll.js';

let io;

export const setSocketIO = (socketIO) => {
  io = socketIO;
};

export const createPoll = async (req, res) => {
  try {
    const { title, description, options } = req.body;
    const user = req.user;

    if (!title || !options || options.length < 2) {
      return res.status(400).json({ error: 'Title and at least 2 options are required' });
    }

    const pollData = {
      title,
      description: description || '',
      options: options.map(opt => ({
        text: opt.text || opt,
        votes: 0,
      })),
      createdBy: user.uid,
      createdAt: new Date(),
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
    const polls = await Poll.find().sort({ createdAt: -1 });
    res.status(200).json(polls);
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
};

export const getPollById = async (req, res) => {
  try {
    const { id } = req.params;
    const poll = await Poll.findById(id);

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
    const { optionIndex } = req.body;

    if (optionIndex === undefined || optionIndex < 0) {
      return res.status(400).json({ error: 'Valid optionIndex is required' });
    }

    const poll = await Poll.findById(id);

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (optionIndex >= poll.options.length) {
      return res.status(400).json({ error: 'Invalid option index' });
    }

    poll.options[optionIndex].votes += 1;
    await poll.save();

    if (io) {
      io.to(`poll_${id}`).emit('update_poll', poll);
    }

    res.status(200).json({ message: 'Vote recorded successfully', poll });
  } catch (error) {
    console.error('Error voting on poll:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
};
