const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const ytTranscript = require("yt-transcript");

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.post("/api/transcribe", async (req, res) => {
  try {
    let { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: "videoUrl is required in body" });
    }

    let videoId = null;

    // ✅ Handle normal YouTube URLs: https://www.youtube.com/watch?v=abcd1234
    if (videoUrl.includes("v=")) {
      videoId = videoUrl.split("v=")[1]?.split("&")[0];
    }

    // ✅ Handle short links: https://youtu.be/abcd1234
    if (!videoId && videoUrl.includes("youtu.be/")) {
      videoId = videoUrl.split("youtu.be/")[1]?.split("?")[0];
    }

    if (!videoId) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    // ✅ Fetch transcript
    const transcript = await ytTranscript(videoId, { lang: "en" });

    if (!transcript || transcript.length === 0) {
      throw new Error("Transcript not available.");
    }

    const transcriptText = transcript.map(t => t.text).join(" ");
    res.json({ transcript: transcriptText });
  } catch (error) {
    console.error("Transcript error:", error);
    res.status(500).json({ error: error.message });
  }
});


app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
