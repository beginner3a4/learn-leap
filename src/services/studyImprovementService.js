// services/studyImprovementService.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI (replace with your actual API key)
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const generateStudyResources = async (
  mainTopic,
  score,
  totalQuestions,
  weakAreas = []
) => {
  try {
    // ✅ Use the correct Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const scorePercentage = Math.round((score / totalQuestions) * 100);
    let performanceLevel = "excellent";

    if (scorePercentage < 60) {
      performanceLevel = "needs improvement";
    } else if (scorePercentage < 80) {
      performanceLevel = "good";
    }

    const prompt = `
      Based on a quiz about "${mainTopic}" where the student scored ${score}/${totalQuestions} (${scorePercentage}%),
      their performance is ${performanceLevel}.
      ${weakAreas.length > 0 ? `They particularly struggled with: ${weakAreas.join(', ')}.` : ''}

      Please suggest exactly 3 YouTube videos and 2 articles to improve their understanding.
      Focus on ${scorePercentage < 70 ? 'fundamental concepts and basics' : 'advanced concepts and practice'}.

      Format the response as a JSON object with this structure:
      {
        "performanceAnalysis": "Brief analysis of their performance and what they need to focus on",
        "youtubeVideos": [
          { "title": "Video title", "channel": "Channel name", "description": "Why this video will help", "url": "https://youtube.com/watch?v=example", "duration": "10 minutes" }
        ],
        "articles": [
          { "title": "Article title", "source": "Website/Publication name", "description": "Why this article will help", "url": "https://example.com/article", "readingTime": "5 minutes" }
        ],
        "studyTips": ["Specific study tip 1", "Specific study tip 2", "Specific study tip 3"]
      }

      Return only the JSON object, no additional text.
    `;

    // ✅ Correct API call for Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON safely
    const cleanText = text.trim();
    
    // Remove any markdown formatting or extra characters
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error("JSON parsing error:", parseError);
        throw new Error("Invalid JSON response from AI");
      }
    }

    // If no valid JSON found, throw error to trigger fallback
    throw new Error("No valid JSON in response");

  } catch (error) {
    console.error("Error generating study resources:", error);
    
    // Enhanced fallback with better error handling
    return generateFallbackResources(mainTopic, scorePercentage, weakAreas);
  }
};

// Separate fallback function for better organization
const generateFallbackResources = (mainTopic, scorePercentage, weakAreas) => {
  const topicEncoded = encodeURIComponent(mainTopic);
  const weakAreasText = weakAreas.length > 0 ? ` particularly focusing on ${weakAreas.join(', ')}` : '';
  
  return {
    performanceAnalysis: `Based on your ${scorePercentage}% score on ${mainTopic}, you should focus on strengthening your understanding of the core concepts${weakAreasText}. ${scorePercentage < 70 ? 'Start with fundamental concepts and build your foundation.' : 'Work on advanced applications and problem-solving techniques.'}`,
    youtubeVideos: [
      {
        title: `${mainTopic} - Complete Tutorial`,
        channel: "Khan Academy",
        description: "Comprehensive overview of key concepts with clear explanations",
        url: `https://youtube.com/results?search_query=${topicEncoded}+tutorial+explained`,
        duration: "15 minutes"
      },
      {
        title: `${mainTopic} - Practice Problems`,
        channel: "Professor Leonard",
        description: "Step-by-step solutions to common problems",
        url: `https://youtube.com/results?search_query=${topicEncoded}+practice+problems+solutions`,
        duration: "12 minutes"
      },
      {
        title: `${mainTopic} - Common Mistakes to Avoid`,
        channel: "Crash Course",
        description: "Learn from typical errors and misconceptions",
        url: `https://youtube.com/results?search_query=${topicEncoded}+common+mistakes+avoid`,
        duration: "8 minutes"
      }
    ],
    articles: [
      {
        title: `Understanding ${mainTopic}: A Comprehensive Guide`,
        source: "StudyGuide.org",
        description: "In-depth explanation with examples and practice exercises",
        url: `https://www.google.com/search?q=${topicEncoded}+comprehensive+guide+tutorial`,
        readingTime: "10 minutes"
      },
      {
        title: `${mainTopic} - Key Concepts and Real-World Applications`,
        source: "Academic Resources",
        description: "Practical examples showing how concepts apply in real situations",
        url: `https://www.google.com/search?q=${topicEncoded}+examples+applications+explained`,
        readingTime: "7 minutes"
      }
    ],
    studyTips: [
      scorePercentage < 60 
        ? "Start with the absolute basics - make sure you understand fundamental definitions and concepts"
        : "Review core concepts briefly, then focus on application and problem-solving",
      weakAreas.length > 0 
        ? `Pay special attention to ${weakAreas.slice(0, 2).join(' and ')} - these areas need extra practice`
        : "Practice a variety of problems to identify any remaining weak spots",
      "Create summary notes or flashcards for quick revision of key points",
      scorePercentage >= 70
        ? "Challenge yourself with more advanced problems and real-world applications"
        : "Use the spaced repetition technique - review material at increasing intervals"
    ].slice(0, 3) // Ensure we only return 3 tips
  };
};

export const getMotivationalMessage = (scorePercentage) => {
  if (scorePercentage >= 90) {
    return {
      title: "Outstanding Performance!",
      message: "You've mastered this topic! Let's explore some advanced resources to deepen your expertise.",
      emoji: "🏆"
    };
  } else if (scorePercentage >= 75) {
    return {
      title: "Great Job!",
      message: "You're doing well! These resources will help you achieve mastery.",
      emoji: "🌟"
    };
  } else if (scorePercentage >= 60) {
    return {
      title: "Good Effort!",
      message: "You're on the right track! Let's strengthen your understanding with these resources.",
      emoji: "📚"
    };
  } else {
    return {
      title: "Keep Learning!",
      message: "Every expert was once a beginner. These resources will help build your foundation.",
      emoji: "💪"
    };
  }
};