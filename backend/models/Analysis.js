const mongoose = require('mongoose');

const biomarkerSchema = new mongoose.Schema({
  value: {
    type: Number,
    required: true
  },
  referenceValue: {
    type: String,
    required: true
  },
  interpretation: {
    type: String,
    required: true
  }
});

const analysisSchema = new mongoose.Schema({
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  biomarkers: {
    creatinine: biomarkerSchema,
    glucose: biomarkerSchema,
    albumin: biomarkerSchema,
    nitrites: biomarkerSchema,
    ntProBNP: biomarkerSchema,
    ngal: biomarkerSchema,
    ohDG: biomarkerSchema,
    mcp1: biomarkerSchema
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Analysis', analysisSchema); 