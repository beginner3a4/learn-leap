import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Clock,
  CheckCircle,
  FileText,
  Loader2,
  ChevronRight,
  RotateCcw,
  Bot,
  XCircle,
  ArrowRight,
  Brain,
  BookOpen,
  Trophy,
  Timer,
  Eye,
  BarChart,
  Award,
  Target,
  Flame,
  Users,
  TrendingUp,
  Zap,
  Plus,
  FileType,
  ThumbsUp,
  MessageCircle,
  Share2,
  Minimize2,
  Maximize2,
} from "lucide-react";
import StudyImprovementPopup from './StudyImprovementPopup';
import { extractTextFromPDF, cleanExtractedText } from "../utils/pdfUtils";
import {
  generateQuizFromContent,
  analyzeContentForQuiz,
} from "../services/geminiService";

const PdfQuizGenerator = () => {
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [contentAnalysis, setContentAnalysis] = useState(null);
  const [contentComplexity, setContentComplexity] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [pdfMeta, setPdfMeta] = useState(null);
  
  // Study Improvement Popup state
  const [showStudyPopup, setShowStudyPopup] = useState(false);
  const [weakAreas, setWeakAreas] = useState([]);
  
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Quiz-related data for sidebars
  const [leaderboard, setLeaderboard] = useState([
    { rank: "🥇", name: "Deepesh", avatar: "D", quizzes: 12, score: 95 },
    { rank: "🥈", name: "Aryan", avatar: "A", quizzes: 10, score: 92 },
    { rank: "🥉", name: "Shivam", avatar: "S", quizzes: 8, score: 88 },
  ]);

  const [challengeProgress, setChallengeProgress] = useState(75);
  const [streakDays, setStreakDays] = useState(7);
  const [activityLog, setActivityLog] = useState([
    {
      type: "quiz",
      text: "Completed Algebra Quiz",
      score: "95%",
      time: "2h ago",
    },
    {
      type: "quiz",
      text: "Started Calculus Quiz",
      score: "In progress",
      time: "3h ago",
    },
  ]);

  const [trendingQuizzes, setTrendingQuizzes] = useState([
    { id: 1, title: "Machine Learning Basics", completions: 42 },
    { id: 2, title: "Calculus Derivatives", completions: 38 },
  ]);

  const [aiTip, setAiTip] = useState(
    "Focus on understanding concepts rather than memorizing answers for better long-term retention!"
  );

  const [poll, setPoll] = useState({
    question: "Which subject do you find most challenging?",
    options: { Mathematics: 15, Physics: 8, Programming: 12 },
    userVote: null,
  });

  // Quiz challenge state with localStorage persistence
  const [quizChallenge, setQuizChallenge] = useState(() => {
    try {
      const saved = localStorage.getItem("quizChallenge");
      return saved ? JSON.parse(saved) : {
        currentStreak: 0,
        longestStreak: 0,
        totalQuizzes: 0,
        lastQuizDate: null,
        progress: 0,
        challengeDays: 100,
        todayQuizzes: 0,
      };
    } catch (error) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalQuizzes: 0,
        lastQuizDate: null,
        progress: 0,
        challengeDays: 100,
        todayQuizzes: 0,
      };
    }
  });

  const [todayQuizzes, setTodayQuizzes] = useState(0);

  // Update localStorage whenever quizChallenge changes
  useEffect(() => {
    try {
      localStorage.setItem("quizChallenge", JSON.stringify(quizChallenge));
    } catch (error) {
      console.warn("Failed to save quiz challenge to localStorage:", error);
    }
  }, [quizChallenge]);

  // Check if user completed a quiz today
  useEffect(() => {
    const today = new Date().toDateString();
    const lastQuizDate = quizChallenge.lastQuizDate
      ? new Date(quizChallenge.lastQuizDate).toDateString()
      : null;

    if (lastQuizDate === today) {
      setTodayQuizzes(quizChallenge.todayQuizzes || 0);
    } else if (lastQuizDate && lastQuizDate !== today) {
      // Check if streak is broken (missed a day)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (
        lastQuizDate !== yesterday.toDateString() &&
        quizChallenge.currentStreak > 0
      ) {
        // Streak broken
        setQuizChallenge((prev) => ({
          ...prev,
          currentStreak: 0,
          todayQuizzes: 0,
        }));
        setTodayQuizzes(0);
      }
    }
  }, [quizChallenge.lastQuizDate, quizChallenge.currentStreak]);

  // Update progress calculation
  const progressPercentage = Math.min(
    (quizChallenge.currentStreak / quizChallenge.challengeDays) * 100,
    100
  );

  // Function to update challenge when quiz is completed
  const updateQuizChallenge = () => {
    const today = new Date().toDateString();
    const lastQuizDate = quizChallenge.lastQuizDate
      ? new Date(quizChallenge.lastQuizDate).toDateString()
      : null;

    setQuizChallenge((prev) => {
      let newStreak = prev.currentStreak;
      let newTodayQuizzes = prev.todayQuizzes || 0;

      // If first quiz today or continuing streak
      if (lastQuizDate !== today) {
        newTodayQuizzes = 1;
        
        // Check if this continues a streak (quiz done yesterday)
        if (lastQuizDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (lastQuizDate === yesterday.toDateString()) {
            newStreak = prev.currentStreak + 1;
          } else if (lastQuizDate !== today) {
            // New streak starting
            newStreak = 1;
          }
        } else {
          // First quiz ever
          newStreak = 1;
        }
      } else {
        // Another quiz today
        newTodayQuizzes = (prev.todayQuizzes || 0) + 1;
      }

      setTodayQuizzes(newTodayQuizzes);

      return {
        ...prev,
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, prev.longestStreak),
        totalQuizzes: prev.totalQuizzes + 1,
        lastQuizDate: new Date().toISOString(),
        todayQuizzes: newTodayQuizzes,
      };
    });
  };

  const handleFileUpload = async (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setIsLoading(true);
      setLoadingMessage("Processing PDF...");
      setError(null);

      try {
        // Use the backend service to extract text and analyze complexity
        const result = await extractTextFromPDF(selectedFile);
        const cleanedText = cleanExtractedText(result.text);
        setFileContent(cleanedText);

        // Set complexity from backend analysis
        setContentComplexity(result.complexity);

        // Store PDF metadata
        setPdfMeta(result.meta);

        // Analyze content to get key concepts
        setLoadingMessage("Analyzing content with AI...");
        const analysis = await analyzeContentForQuiz(cleanedText);
        setContentAnalysis(analysis);
      } catch (err) {
        setError(`Error processing PDF: ${err.message}`);
        console.error("PDF processing error:", err);
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("Please upload a PDF file");
    }
  };

  // Generate quiz using Gemini AI
  const generateQuiz = async () => {
    setIsLoading(true);
    setLoadingMessage("Generating questions with AI...");
    setError(null);

    try {
      // Generate questions based on content complexity
      const questionCount =
        contentComplexity?.complexityLevel === "Basic"
          ? 5
          : contentComplexity?.complexityLevel === "Intermediate"
          ? 7
          : 10;

      const generatedQuestions = await generateQuizFromContent(
        fileContent,
        questionCount
      );
      setQuestions(generatedQuestions);
    } catch (err) {
      setError(`Failed to generate quiz: ${err.message}`);
      console.error("Quiz generation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Start the quiz
  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizCompleted(false);
    setScore(0);
    setElapsedTime(0);

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId, answer) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // Analyze weak areas based on quiz results
  const analyzeWeakAreas = () => {
    const incorrectQuestions = questions.filter(
      (question) => selectedAnswers[question.id] !== question.correctAnswer
    );
    
    // Create weak areas array with question topics or main topic
    const areas = [];
    
    if (incorrectQuestions.length > 0) {
      // Add main topic if many questions were wrong
      if (incorrectQuestions.length >= questions.length * 0.4) {
        areas.push(contentAnalysis?.mainTopics?.[0] || "General Knowledge");
      }
      
      // Add specific concepts from key concepts if available
      if (contentAnalysis?.keyConcepts && contentAnalysis.keyConcepts.length > 0) {
        const concepts = contentAnalysis.keyConcepts.slice(0, 2);
        areas.push(...concepts);
      }
    }
    
    return [...new Set(areas)]; // Remove duplicates
  };

  // Move to next question and handle quiz completion
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Quiz completed
      clearInterval(timerRef.current);
      setQuizCompleted(true);

      // Calculate score
      let correctCount = 0;
      questions.forEach((question) => {
        if (selectedAnswers[question.id] === question.correctAnswer) {
          correctCount++;
        }
      });

      setScore(correctCount);

      // Analyze weak areas
      const areas = analyzeWeakAreas();
      setWeakAreas(areas);

      // Update quiz challenge
      updateQuizChallenge();

      // Update activity log
      setActivityLog((prev) => [
        {
          type: "quiz",
          text: `Completed ${contentAnalysis?.mainTopics?.[0] || "PDF"} Quiz`,
          score: `${Math.round((correctCount / questions.length) * 100)}%`,
          time: "Just now",
        },
        ...prev,
      ]);

      // Show study improvement popup after a short delay
      setTimeout(() => {
        setShowStudyPopup(true);
      }, 2000);
    }
  };

  // Handle continuing learning from popup
  const handleContinueLearning = () => {
    // Reset quiz for retake
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizCompleted(false);
    setScore(0);
    setElapsedTime(0);
    setShowStudyPopup(false);

    // Start timer again
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  };

  // Handle closing study popup
  const handleCloseStudyPopup = () => {
    setShowStudyPopup(false);
  };

  // Initialize progress bar with animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setChallengeProgress(progressPercentage);
    }, 100);

    return () => clearTimeout(timer);
  }, [progressPercentage]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle file browser button click
  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  // Reset the entire process
  const resetProcess = () => {
    setFile(null);
    setFileContent("");
    setContentAnalysis(null);
    setContentComplexity(null);
    setQuestions([]);
    setQuizStarted(false);
    setQuizCompleted(false);
    setError(null);
    setShowStudyPopup(false);
    setWeakAreas([]);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setScore(0);
    setElapsedTime(0);
    
    // Clear timer if running
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // Handle poll voting
  const handleVote = (option) => {
    if (!poll.userVote) {
      setPoll((prev) => ({
        ...prev,
        options: { ...prev.options, [option]: prev.options[option] + 1 },
        userVote: option,
      }));
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const currentQuestion = questions[currentQuestionIndex];

  // Create a preview of the content (limit length)
  const contentPreview =
    fileContent.length > 500
      ? fileContent.substring(0, 500) + "..."
      : fileContent;

  return (
    <>
      {/* Study Improvement Popup */}
      <StudyImprovementPopup
        isOpen={showStudyPopup}
        onClose={handleCloseStudyPopup}
        onContinue={handleContinueLearning}
        score={score}
        totalQuestions={questions.length}
        mainTopic={contentAnalysis?.mainTopics?.[0] || "General Knowledge"}
        weakAreas={weakAreas}
        contentAnalysis={contentAnalysis}
      />

      <div className="flex min-h-screen p-6 gap-6 justify-center flex-wrap relative left-[15%] bg-[#f6fbf6] w-[85%]">
        {/* Left Sidebar - Conditionally rendered based on fullscreen state */}
        {!fullscreen && (
          <aside className="w-[500px] bg-white p-4 rounded-xl shadow-md flex flex-col gap-4 flex-shrink-0 h-fit sticky top-6">
            <h3 className="text-xl font-bold mb-2 text-[#28595a] pb-2 border-b border-[#dbf0dd]">
              Quiz Hub
            </h3>

            {/* Leaderboard */}
            <div className="bg-[#f6fbf6] p-4 rounded-xl shadow-sm">
              <h4 className="text-base font-medium mb-3 text-[#28595a] flex items-center">
                <Award size={18} className="mr-2 text-[#ff8400]" />
                Quiz Leaderboard
              </h4>
              {leaderboard.map((user, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 py-2 border-b border-[#dbf0dd] last:border-0"
                >
                  <span className="text-base mr-2">{user.rank}</span>
                  <div className="w-[30px] h-[30px] bg-[#28595a] text-white flex items-center justify-center rounded-full font-medium text-sm">
                    {user.avatar}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">{user.name}</span>
                    <p className="text-xs text-gray-500">
                      {user.quizzes} Quizzes • Avg: {user.score}%
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Daily Goals */}
            <div className="bg-[#f6fbf6] p-4 rounded-xl shadow-sm">
              <h4 className="text-base font-medium mb-3 text-[#28595a] flex items-center">
                <Target size={18} className="mr-2 text-[#ff8400]" />
                100-Day Quiz Challenge
              </h4>

              <div className="flex items-center justify-center mb-3">
                <div className="relative">
                  <Trophy className="h-12 w-12 text-[#ff8400]" />
                  <div className="absolute -top-1 -right-1 bg-[#28595a] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {quizChallenge.currentStreak}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-800">
                    {quizChallenge.currentStreak} Day Streak
                  </p>
                  <p className="text-xs text-gray-600">
                    Best: {quizChallenge.longestStreak} days
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-2 text-center">
                {todayQuizzes > 0
                  ? `Completed ${todayQuizzes} quiz(s) today`
                  : "Complete a quiz today to start your streak!"}
              </p>

              <div className="w-full h-[8px] bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-[#28595a] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-sm mb-3">
                <span className="text-gray-600">
                  {Math.round(progressPercentage)}% Complete
                </span>
                <span className="text-gray-600">
                  {quizChallenge.currentStreak}/{quizChallenge.challengeDays} days
                </span>
              </div>

              {progressPercentage === 100 ? (
                <div className="bg-[#dbf0dd] p-2 rounded-lg text-center">
                  <p className="text-sm font-medium text-[#28595a]">
                    🎉 Challenge Completed!
                  </p>
                </div>
              ) : (
                <button
                  className="w-full mt-2 p-2 bg-[#ff8400] text-white rounded-lg hover:bg-[#e67700] transition-colors font-medium text-sm"
                  onClick={() => {
                    if (file && questions.length > 0) {
                      startQuiz();
                    } else {
                      handleBrowseClick();
                    }
                  }}
                >
                  {file && questions.length > 0 ? "Start Quiz" : "Upload PDF"}
                </button>
              )}

              <div className="mt-3 pt-3 border-t border-[#dbf0dd] text-xs text-gray-500">
                <p>Total Quizzes: {quizChallenge.totalQuizzes}</p>
                <p>Today's Quizzes: {todayQuizzes}</p>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content - Adjust width based on fullscreen state */}
        <main
          className={`flex-1 flex flex-col gap-6 ${
            fullscreen ? "w-full max-w-none" : "max-w-[800px]"
          } min-w-[500px]`}
        >
          <div
            className={`${
              fullscreen ? "w-full max-w-none" : "max-w-4xl"
            } mx-auto w-full`}
          >
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Header */}
              <div className="bg-[#28595a] p-6 text-white relative">
                <div className="flex items-center justify-center">
                  <Brain size={28} className="text-[#dbf0dd] mr-3" />
                  <h1 className="text-2xl font-bold">PDF to Quiz Generator</h1>
                </div>
                <p className="text-center text-[#dbf0dd] mt-2">
                  Upload any PDF document and our AI will generate a custom quiz
                  to test your knowledge
                </p>

                {/* Full-screen icon */}
                <button
                  className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[#1e4445] transition-colors"
                  onClick={toggleFullscreen}
                  aria-label="Toggle fullscreen"
                >
                  {fullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                </button>
              </div>

              {/* Main Content */}
              <div className="p-8">
                {!quizStarted ? (
                  <div className="space-y-6">
                    {!file ? (
                      <>
                        <div className="border-2 border-dashed border-[#dbf0dd] rounded-xl p-10 text-center flex flex-col items-center justify-center bg-[#f6fbf6]">
                          <FileText className="h-16 w-16 text-[#28595a] mb-4" />
                          <h3 className="text-lg font-semibold text-[#28595a] mb-2">
                            Upload Your Study Material
                          </h3>
                          <p className="text-gray-600 mb-6 max-w-md">
                            Drag and drop your PDF or click to browse. Our AI will
                            analyze the content and create customized quiz
                            questions.
                          </p>

                          <button
                            onClick={handleBrowseClick}
                            className="px-5 py-3 bg-[#ff8400] text-white rounded-lg hover:bg-[#e67700] transition-colors font-medium flex items-center shadow-sm"
                          >
                            <Upload className="mr-2 h-5 w-5" />
                            Browse Files
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                          />

                          <p className="mt-4 text-xs text-gray-500">
                            Supported format: PDF (Max size: 10MB)
                          </p>

                          {error && (
                            <div className="mt-4 text-red-500 bg-red-50 px-4 py-2 rounded-md">
                              <div className="flex items-center">
                                <XCircle className="h-4 w-4 mr-2" />
                                {error}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* How It Works Section */}
                        <div className="bg-white p-6 rounded-xl border border-[#dbf0dd] shadow-sm mt-6">
                          <h3 className="text-lg font-semibold text-[#28595a] mb-6 flex items-center justify-center">
                            <Zap className="h-6 w-6 mr-2 text-[#ff8400]" />
                            How It Works
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Step 1 - Upload */}
                            <div className="text-center p-4 bg-[#f6fbf6] rounded-lg border border-[#dbf0dd] hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                              <div className="relative mb-4">
                                <div className="w-12 h-12 bg-[#28595a] text-white rounded-full flex items-center justify-center mx-auto text-lg font-bold shadow-md">
                                  1
                                </div>
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#ff8400] rounded-full flex items-center justify-center">
                                  <Upload className="h-4 w-4 text-white" />
                                </div>
                              </div>
                              <h4 className="font-semibold text-[#28595a] mb-2">
                                Upload PDF
                              </h4>
                              <p className="text-sm text-gray-600">
                                Drag and drop or select your study material in PDF
                                format
                              </p>
                            </div>

                            {/* Step 2 - AI Analysis */}
                            <div className="text-center p-4 bg-[#f6fbf6] rounded-lg border border-[#dbf0dd] hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                              <div className="relative mb-4">
                                <div className="w-12 h-12 bg-[#28595a] text-white rounded-full flex items-center justify-center mx-auto text-lg font-bold shadow-md">
                                  2
                                </div>
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#ff8400] rounded-full flex items-center justify-center">
                                  <Brain className="h-4 w-4 text-white" />
                                </div>
                              </div>
                              <h4 className="font-semibold text-[#28595a] mb-2">
                                AI Analysis
                              </h4>
                              <p className="text-sm text-gray-600">
                                Our AI analyzes content and generates personalized
                                quiz questions
                              </p>
                            </div>

                            {/* Step 3 - Quiz & Progress */}
                            <div className="text-center p-4 bg-[#f6fbf6] rounded-lg border border-[#dbf0dd] hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                              <div className="relative mb-4">
                                <div className="w-12 h-12 bg-[#28595a] text-white rounded-full flex items-center justify-center mx-auto text-lg font-bold shadow-md">
                                  3
                                </div>
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#ff8400] rounded-full flex items-center justify-center">
                                  <Trophy className="h-4 w-4 text-white" />
                                </div>
                              </div>
                              <h4 className="font-semibold text-[#28595a] mb-2">
                                Learn & Track
                              </h4>
                              <p className="text-sm text-gray-600">
                                Test your knowledge, get instant feedback, and
                                track your progress
                              </p>
                            </div>
                          </div>

                          {/* Stats Section */}
                          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                            <div className="bg-[#f6fbf6] p-3 rounded-lg border border-[#dbf0dd]">
                              <div className="text-2xl font-bold text-[#28595a]">
                                95%
                              </div>
                              <div className="text-xs text-gray-600">
                                Accuracy Rate
                              </div>
                            </div>
                            <div className="bg-[#f6fbf6] p-3 rounded-lg border border-[#dbf0dd]">
                              <div className="text-2xl font-bold text-[#28595a]">
                                2.5x
                              </div>
                              <div className="text-xs text-gray-600">
                                Faster Learning
                              </div>
                            </div>
                            <div className="bg-[#f6fbf6] p-3 rounded-lg border border-[#dbf0dd]">
                              <div className="text-2xl font-bold text-[#28595a]">
                                10k+
                              </div>
                              <div className="text-xs text-gray-600">
                                Quizzes Generated
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      // File uploaded but quiz not started yet
                      <div className="space-y-6">
                        {/* File Info Card */}
                        <div className="bg-[#f6fbf6] rounded-xl p-6 border border-[#dbf0dd]">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <FileText className="h-8 w-8 text-[#28595a] mr-3" />
                              <div>
                                <h3 className="font-semibold text-[#28595a]">
                                  {file.name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {pdfMeta?.pages || "Unknown"} pages •{" "}
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={resetProcess}
                              className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                              title="Remove file"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </div>

                          {/* Content Analysis */}
                          {contentAnalysis && (
                            <div className="mt-4 p-4 bg-white rounded-lg border border-[#dbf0dd]">
                              <h4 className="font-medium text-[#28595a] mb-3 flex items-center">
                                <Brain className="h-4 w-4 mr-2 text-[#ff8400]" />
                                Content Analysis
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-700">
                                    Main Topics:
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {contentAnalysis.mainTopics
                                      ?.slice(0, 3)
                                      .map((topic, index) => (
                                        <span
                                          key={index}
                                          className="px-2 py-1 bg-[#dbf0dd] text-[#28595a] text-xs rounded-full"
                                        >
                                          {topic}
                                        </span>
                                      ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">
                                    Complexity:
                                  </p>
                                  <span
                                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                                      contentComplexity?.complexityLevel ===
                                      "Basic"
                                        ? "bg-green-100 text-green-800"
                                        : contentComplexity?.complexityLevel ===
                                          "Intermediate"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {contentComplexity?.complexityLevel ||
                                      "Analyzing..."}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Content Preview */}
                          <div className="mt-4">
                            <h4 className="font-medium text-[#28595a] mb-2 flex items-center">
                              <Eye className="h-4 w-4 mr-2 text-[#ff8400]" />
                              Content Preview
                            </h4>
                            <div className="bg-white p-4 rounded-lg border border-[#dbf0dd] max-h-40 overflow-y-auto">
                              <p className="text-sm text-gray-700">
                                {contentPreview}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Generate Quiz Button */}
                        {!questions.length && !isLoading && (
                          <div className="text-center">
                            <button
                              onClick={generateQuiz}
                              className="px-8 py-4 bg-[#ff8400] hover:bg-[#e67700] text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 flex items-center justify-center mx-auto"
                              disabled={isLoading}
                            >
                              <Bot className="h-6 w-6 mr-2" />
                              Generate Quiz Questions
                            </button>
                          </div>
                        )}

                        {/* Loading State */}
                        {isLoading && (
                          <div className="text-center py-8">
                            <Loader2 className="h-12 w-12 animate-spin text-[#28595a] mx-auto mb-4" />
                            <p className="text-gray-600">{loadingMessage}</p>
                          </div>
                        )}

                        {/* Quiz Ready State */}
                        {questions.length > 0 && !isLoading && (
                          <div className="text-center">
                            <div className="bg-[#dbf0dd] p-6 rounded-xl mb-6">
                              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                              <h3 className="text-xl font-semibold text-[#28595a] mb-2">
                                Quiz Ready!
                              </h3>
                              <p className="text-gray-600 mb-4">
                                We've generated {questions.length} questions based
                                on your document.
                              </p>
                              <div className="flex justify-center gap-4">
                                <div className="bg-white px-4 py-2 rounded-lg border border-[#dbf0dd]">
                                  <p className="text-sm text-gray-600">
                                    Questions
                                  </p>
                                  <p className="font-semibold text-[#28595a]">
                                    {questions.length}
                                  </p>
                                </div>
                                <div className="bg-white px-4 py-2 rounded-lg border border-[#dbf0dd]">
                                  <p className="text-sm text-gray-600">
                                    Difficulty
                                  </p>
                                  <p className="font-semibold text-[#28595a]">
                                    {contentComplexity?.complexityLevel}
                                  </p>
                                </div>
                                <div className="bg-white px-4 py-2 rounded-lg border border-[#dbf0dd]">
                                  <p className="text-sm text-gray-600">
                                    Est. Time
                                  </p>
                                  <p className="font-semibold text-[#28595a]">
                                    {Math.ceil(questions.length * 0.5)} min
                                  </p>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={startQuiz}
                              className="px-8 py-4 bg-[#28595a] hover:bg-[#1e4445] text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 flex items-center justify-center mx-auto"
                            >
                              <BookOpen className="h-6 w-6 mr-2" />
                              Start Quiz Now
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  // Quiz in progress or completed
                  <div className="space-y-6">
                    {/* Quiz Header */}
                    <div className="flex justify-between items-center bg-[#f6fbf6] p-4 rounded-xl border border-[#dbf0dd]">
                      <div className="flex items-center">
                        <Timer className="h-5 w-5 text-[#28595a] mr-2" />
                        <span className="font-medium text-[#28595a]">
                          {formatTime(elapsedTime)}
                        </span>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Question</p>
                        <p className="font-semibold text-[#28595a]">
                          {currentQuestionIndex + 1} of {questions.length}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Score</p>
                        <p className="font-semibold text-[#28595a]">
                          {score} / {questions.length}
                        </p>
                      </div>
                    </div>

                    {/* Current Question */}
                    {!quizCompleted && currentQuestion && (
                      <div className="bg-white p-6 rounded-xl border border-[#dbf0dd]">
                        <h3 className="text-lg font-semibold text-[#28595a] mb-6">
                          {currentQuestion.question}
                        </h3>

                        <div className="space-y-3">
                          {currentQuestion.options.map((option, index) => (
                            <button
                              key={index}
                              onClick={() =>
                                handleAnswerSelect(currentQuestion.id, option)
                              }
                              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                                selectedAnswers[currentQuestion.id] === option
                                  ? "border-[#28595a] bg-[#f6fbf6] shadow-sm"
                                  : "border-gray-200 hover:border-[#28595a] hover:bg-[#f6fbf6]"
                              }`}
                            >
                              <div className="flex items-center">
                                <div
                                  className={`w-6 h-6 rounded-full border flex items-center justify-center mr-4 ${
                                    selectedAnswers[currentQuestion.id] ===
                                    option
                                      ? "border-[#28595a] bg-[#28595a] text-white"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {String.fromCharCode(65 + index)}
                                </div>
                                <span className="text-gray-800">{option}</span>
                              </div>
                            </button>
                          ))}
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between items-center mt-8">
                          <button
                            onClick={() =>
                              setCurrentQuestionIndex((prev) =>
                                Math.max(0, prev - 1)
                              )
                            }
                            disabled={currentQuestionIndex === 0}
                            className="px-6 py-2 border border-[#dbf0dd] text-[#28595a] rounded-lg hover:bg-[#f6fbf6] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>

                          <button
                            onClick={handleNextQuestion}
                            disabled={!selectedAnswers[currentQuestion.id]}
                            className="px-8 py-2 bg-[#28595a] text-white rounded-lg hover:bg-[#1e4445] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          >
                            {currentQuestionIndex === questions.length - 1
                              ? "Finish Quiz"
                              : "Next Question"}
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quiz Results */}
                    {quizCompleted && (
                      <div className="text-center space-y-6">
                        <div className="bg-gradient-to-r from-[#28595a] to-[#1e4445] p-8 rounded-xl text-white">
                          <Trophy className="h-16 w-16 mx-auto mb-4 text-[#ff8400]" />
                          <h2 className="text-2xl font-bold mb-2">
                            Quiz Completed!
                          </h2>
                          <p className="text-[#dbf0dd] mb-4">
                            You scored {score} out of {questions.length} questions
                            correctly
                          </p>
                          <div className="text-4xl font-bold text-[#ff8400]">
                            {Math.round((score / questions.length) * 100)}%
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-[#f6fbf6] p-4 rounded-xl border border-[#dbf0dd]">
                            <Clock className="h-8 w-8 text-[#28595a] mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Time Taken</p>
                            <p className="font-semibold text-[#28595a]">
                              {formatTime(elapsedTime)}
                            </p>
                          </div>
                          <div className="bg-[#f6fbf6] p-4 rounded-xl border border-[#dbf0dd]">
                            <BarChart className="h-8 w-8 text-[#28595a] mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Accuracy</p>
                            <p className="font-semibold text-[#28595a]">
                              {Math.round((score / questions.length) * 100)}%
                            </p>
                          </div>
                          <div className="bg-[#f6fbf6] p-4 rounded-xl border border-[#dbf0dd]">
                            <Target className="h-8 w-8 text-[#28595a] mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Performance</p>
                            <p className="font-semibold text-[#28595a]">
                              {score >= questions.length * 0.8
                                ? "Excellent"
                                : score >= questions.length * 0.6
                                ? "Good"
                                : "Needs Improvement"}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-center gap-4">
                          <button
                            onClick={resetProcess}
                            className="px-6 py-3 border border-[#dbf0dd] text-[#28595a] rounded-lg hover:bg-[#f6fbf6] flex items-center"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            New Quiz
                          </button>
                          <button
                            onClick={() => {
                              setQuizStarted(false);
                              setQuizCompleted(false);
                            }}
                            className="px-6 py-3 bg-[#28595a] text-white rounded-lg hover:bg-[#1e4445] flex items-center"
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Review Content
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Conditionally rendered based on fullscreen state */}
        {!fullscreen && (
          <aside className="w-[500px] bg-white p-4 rounded-xl shadow-md flex flex-col gap-4 flex-shrink-0 h-fit sticky top-6">
            <h3 className="text-xl font-bold mb-2 text-[#28595a] pb-2 border-b border-[#dbf0dd]">
              Learning Community
            </h3>

            {/* AI Study Tip */}
            <div className="bg-gradient-to-r from-[#ff8400] to-[#ffaa33] p-4 rounded-xl text-white">
              <div className="flex items-start mb-3">
                <Bot className="h-6 w-6 mr-2 flex-shrink-0" />
                <p className="text-sm font-medium">{aiTip}</p>
              </div>
            </div>

            {/* Trending Quizzes */}
            <div className="bg-[#f6fbf6] p-4 rounded-xl shadow-sm">
              <h4 className="text-base font-medium mb-3 text-[#28595a] flex items-center">
                <Flame size={18} className="mr-2 text-[#ff8400]" />
                Trending Quizzes
              </h4>
              {trendingQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between py-2 border-b border-[#dbf0dd] last:border-0"
                >
                  <span className="font-medium text-gray-800">
                    {quiz.title}
                  </span>
                  <span className="text-sm text-gray-500">
                    {quiz.completions} completions
                  </span>
                </div>
              ))}
            </div>

            {/* Community Poll */}
            <div className="bg-[#f6fbf6] p-4 rounded-xl shadow-sm">
              <h4 className="text-base font-medium mb-3 text-[#28595a] flex items-center">
                <Users size={18} className="mr-2 text-[#ff8400]" />
                Community Poll
              </h4>
              <p className="text-sm text-gray-700 mb-3">{poll.question}</p>
              <div className="space-y-2">
                {Object.entries(poll.options).map(([option, votes]) => {
                  const totalVotes = Object.values(poll.options).reduce(
                    (a, b) => a + b,
                    0
                  );
                  const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                  
                  return (
                    <div key={option}>
                      <button
                        onClick={() => handleVote(option)}
                        disabled={poll.userVote}
                        className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                          poll.userVote === option
                            ? "bg-[#28595a] text-white"
                            : "bg-white text-gray-700 hover:bg-[#dbf0dd]"
                        } ${poll.userVote && poll.userVote !== option ? "opacity-50" : ""}`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{option}</span>
                          {poll.userVote && (
                            <span>{Math.round(percentage)}%</span>
                          )}
                        </div>
                      </button>
                      {poll.userVote && (
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-[#28595a] rounded-full transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {!poll.userVote && (
                <p className="text-xs text-gray-500 mt-2">
                  Vote to see results
                </p>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-[#f6fbf6] p-4 rounded-xl shadow-sm">
              <h4 className="text-base font-medium mb-3 text-[#28595a] flex items-center">
                <TrendingUp size={18} className="mr-2 text-[#ff8400]" />
                Recent Activity
              </h4>
              {activityLog.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center py-2 border-b border-[#dbf0dd] last:border-0"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      activity.type === "quiz"
                        ? "bg-[#dbf0dd] text-[#28595a]"
                        : "bg-[#ffedcc] text-[#ff8400]"
                    }`}
                  >
                    {activity.type === "quiz" ? (
                      <BookOpen size={14} />
                    ) : (
                      <MessageCircle size={14} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {activity.text}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                  {activity.score && (
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        activity.score === "In progress"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {activity.score}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </>
  );
};

export default PdfQuizGenerator;