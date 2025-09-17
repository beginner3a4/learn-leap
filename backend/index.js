// server.js
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer setup for PDFs
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueName + '-' + file.originalname);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Parse PDF → text
app.post('/api/parse-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded' });
    const filePath = req.file.path;
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const extractedText = cleanExtractedText(data.text);
    fs.unlinkSync(filePath);

    const complexity = analyzeContentComplexity(extractedText);

    res.json({
      text: extractedText,
      complexity,
      meta: { pageCount: data.numpages, info: data.info }
    });
  } catch (err) {
    console.error('Error parsing PDF:', err);
    res.status(500).json({ error: 'Failed to parse PDF', details: err.message });
  }
});

// Analyze text with Gemini
app.post('/api/analyze-content', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0)
      return res.status(400).json({ error: 'No content provided' });

    const analysis = await analyzeContentForQuiz(content);
    res.json(analysis);
  } catch (err) {
    console.error('Error analyzing content:', err);
    res.status(500).json({ error: 'Failed to analyze content', details: err.message });
  }
});

// Generate quiz with Gemini
app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { content, questionCount = 5 } = req.body;
    if (!content || content.trim().length === 0)
      return res.status(400).json({ error: 'No content provided' });

    const questions = await generateQuizFromContent(content, questionCount);
    res.json(questions);
  } catch (err) {
    console.error('Error generating quiz:', err);
    res.status(500).json({ error: 'Failed to generate quiz', details: err.message });
  }
});

// ---------- Helpers ----------
function cleanExtractedText(text) {
  return text
    .replace(/[^\x20-\x7E\n\r\t]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .replace(/\.\s+/g, '. ')
    .trim();
}

function analyzeContentComplexity(text) {
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readingTimeMinutes = Math.ceil(wordCount / 225);
  const sentences = text.split(/[.!?]+\s+/).filter(Boolean);
  const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;
  const totalChars = words.reduce((sum, w) => sum + w.length, 0);
  const avgWordLength = words.length > 0 ? totalChars / words.length : 0;

  const complexityScore = (avgWordLength * 0.7) + (avgSentenceLength * 0.3);

  let complexityLevel = 'Basic';
  if (complexityScore > 6.5) complexityLevel = 'Advanced';
  else if (complexityScore > 5) complexityLevel = 'Intermediate';

  return {
    wordCount,
    sentenceCount: sentences.length,
    readingTimeMinutes,
    complexityScore: parseFloat(complexityScore.toFixed(2)),
    complexityLevel,
    avgSentenceLength: parseFloat(avgSentenceLength.toFixed(2)),
    avgWordLength: parseFloat(avgWordLength.toFixed(2))
  };
}

async function analyzeContentForQuiz(content) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `
    Analyze the following educational content and extract:
    1. Main topic(s)
    2. 5-8 key concepts
    3. Key terms
    
    Format JSON:
    {
      "mainTopics": [...],
      "keyConcepts": [...],
      "keyTerms": [...]
    }
    
    Content:
    ${content.substring(0, 10000)}
  `;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const responseText = response.text();
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response');
  return JSON.parse(jsonMatch[0]);
}

async function generateQuizFromContent(content, questionCount = 5) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  let limitedContent = content.length > 15000 ? content.substring(0, 15000) + '...' : content;

  const prompt = `
    Generate ${questionCount} multiple-choice questions from content:
    - 4 plausible options
    - One correct answer
    - JSON array format
    
    Content:
    ${limitedContent}
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const responseText = response.text();
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Invalid AI response for quiz');
  return JSON.parse(jsonMatch[0]);
}

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
