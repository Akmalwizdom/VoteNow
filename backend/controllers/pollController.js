import { db } from '../firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

let io;

export const setSocketIO = (socketIO) => {
  io = socketIO;
};

export const createPoll = async (req, res) => {
  try {
    const { title, description, options, expiresAt, settings } = req.body;
    const user = req.user;

    if (!title || !options || options.length < 2) {
      return res.status(400).json({ error: 'Title and at least 2 options are required' });
    }

    const pollData = {
      title,
      description: description || '',
      options: options.map((opt, index) => ({
        id: `opt_${index}_${Date.now()}`,
        text: opt.text || opt,
        voteCount: 0,
      })),
      createdBy: user.uid,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: expiresAt || null,
      settings: {
        isAnonymous: settings?.isAnonymous || false,
        allowMultiple: settings?.allowMultiple || false,
      },
    };

    const pollRef = await db.collection('polls').add(pollData);
    const poll = await pollRef.get();

    res.status(201).json({ id: pollRef.id, ...poll.data() });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ error: 'Failed to create poll' });
  }
};

export const getPolls = async (req, res) => {
  try {
    const pollsSnapshot = await db.collection('polls')
      .orderBy('createdAt', 'desc')
      .get();

    const polls = pollsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(polls);
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
};

export const getPollById = async (req, res) => {
  try {
    const { id } = req.params;
    const pollDoc = await db.collection('polls').doc(id).get();

    if (!pollDoc.exists) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    res.status(200).json({ id: pollDoc.id, ...pollDoc.data() });
  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({ error: 'Failed to fetch poll' });
  }
};

export const voteOnPoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { optionIds } = req.body;
    const user = req.user;

    if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
      return res.status(400).json({ error: 'At least one option must be selected' });
    }

    const pollRef = db.collection('polls').doc(id);
    const votesRef = db.collection('votes');

    await db.runTransaction(async (transaction) => {
      const pollDoc = await transaction.get(pollRef);

      if (!pollDoc.exists) {
        throw new Error('Poll not found');
      }

      const pollData = pollDoc.data();

      const existingVoteQuery = await votesRef
        .where('pollId', '==', id)
        .where('userId', '==', user.uid)
        .get();

      if (!existingVoteQuery.empty) {
        throw new Error('User has already voted on this poll');
      }

      const allowMultiple = pollData.settings?.allowMultiple || false;
      if (!allowMultiple && optionIds.length > 1) {
        throw new Error('Multiple votes not allowed for this poll');
      }

      const validOptionIds = pollData.options.map(opt => opt.id);
      const invalidOptions = optionIds.filter(id => !validOptionIds.includes(id));
      if (invalidOptions.length > 0) {
        throw new Error(`Invalid option IDs: ${invalidOptions.join(', ')}`);
      }

      const updatedOptions = pollData.options.map(option => {
        if (optionIds.includes(option.id)) {
          return { ...option, voteCount: option.voteCount + 1 };
        }
        return option;
      });

      transaction.update(pollRef, { options: updatedOptions });

      const voteData = {
        pollId: id,
        userId: user.uid,
        optionIds,
        timestamp: FieldValue.serverTimestamp(),
      };

      const newVoteRef = votesRef.doc();
      transaction.set(newVoteRef, voteData);
    });

    const updatedPollDoc = await pollRef.get();
    const updatedPollData = { id: updatedPollDoc.id, ...updatedPollDoc.data() };

    if (io) {
      io.to(`poll_${id}`).emit('update_poll', updatedPollData);
    }

    res.status(200).json({ message: 'Vote recorded successfully', poll: updatedPollData });
  } catch (error) {
    console.error('Error voting on poll:', error);
    
    if (error.message === 'Poll not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'User has already voted on this poll') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('Invalid option IDs') || error.message === 'Multiple votes not allowed for this poll') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to record vote' });
  }
};
