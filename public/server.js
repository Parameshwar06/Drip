const express = require('express');
const axios = require('axios');
const cors = require('cors');

const GEMINI_API_KEY = 'AIzaSyBfgGDH66hDaIjJrHL7959MWTPAHfmXb8c'; // Your Gemini API key

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/gemini', async (req, res) => {
  const { prompt } = req.body;
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );
    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    res.json({ text });
  } catch (err) {
    // Improved error logging for debugging
    if (err.response) {
      console.error('Gemini API error:', err.response.status, err.response.data);
    } else {
      console.error('Gemini API error:', err.message);
    }
    res.status(500).json({ error: err.message, details: err.response?.data });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Gemini backend running on port ${PORT}`));