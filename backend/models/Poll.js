import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  _id: false,
  text: {
    type: String,
    required: true,
    trim: true
  },
  votes: {
    type: Number,
    default: 0
  }
});

const pollSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  options: [optionSchema],

  // Prevent double voting
  votedBy: {
    type: [String],
    default: []
  },

  createdBy: {
    type: String,
    required: true
  },

  createdByEmail: {
    type: String,
    default: ''
  },

  createdByName: {
    type: String,
    default: ''
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Poll = mongoose.model('Poll', pollSchema);

export default Poll;
