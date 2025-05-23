const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant."
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    res.json({
      response: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('ChatGPT API Error:', error);
    res.status(500).json({ error: 'Failed to get response from ChatGPT' });
  }
});

// Analysis report endpoint
router.post('/analysis-report', async (req, res) => {
  try {
    const { analysis, profile } = req.body;

    if (!analysis || !profile) {
      return res.status(400).json({ error: 'Analysis and profile data are required' });
    }

    // Create a detailed prompt for the analysis
    const prompt = `Please analyze the following health data for ${profile.name} (${profile.sex}, ${profile.age} years old):

Recent Analysis Date: ${analysis.date}

Biomarkers:
- Creatinine: ${analysis.biomarkers.creatinine.value} (Reference: ${analysis.biomarkers.creatinine.reference})
- Glucose: ${analysis.biomarkers.glucose.value} (Reference: ${analysis.biomarkers.glucose.reference})
- Albumin: ${analysis.biomarkers.albumin.value} (Reference: ${analysis.biomarkers.albumin.reference})
- Nitrites: ${analysis.biomarkers.nitrites.value} (Reference: ${analysis.biomarkers.nitrites.reference})
- NT-proBNP: ${analysis.biomarkers.ntProBNP.value} (Reference: ${analysis.biomarkers.ntProBNP.reference})
- NGAL: ${analysis.biomarkers.ngal.value} (Reference: ${analysis.biomarkers.ngal.reference})
- OHdG: ${analysis.biomarkers.ohDG.value} (Reference: ${analysis.biomarkers.ohDG.reference})
- MCP1: ${analysis.biomarkers.mcp1.value} (Reference: ${analysis.biomarkers.mcp1.reference})

Please provide a comprehensive health report that includes:
1. An overall assessment of the health status
2. Analysis of any concerning biomarkers
3. Recommendations for improvement
4. Areas that are within healthy ranges
5. Any potential risk factors to monitor

Please format the response in a clear, professional manner suitable for a medical report.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a medical analysis assistant that provides clear, professional health reports based on biomarker data. Focus on being informative while maintaining a professional tone."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    res.json({
      report: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('ChatGPT API Error:', error);
    res.status(500).json({ error: 'Failed to generate analysis report' });
  }
});

module.exports = router; 