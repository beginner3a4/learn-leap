import React, { useState, useEffect, useRef } from "react";
import {
  Youtube,
  Loader2,
  ArrowRight,
  Brain,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Home,
  RotateCcw
} from "lucide-react";
import {
  analyzeContentForQuiz,
  generateQuizFromContent,
} from "../services/geminiService";
import { YOUTUBE_TRANSCRIPTS } from "../data/transcript";

const YouTubeQuizGenerator = () => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState(null);
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
  const [manualTranscript, setManualTranscript] = useState("");
  const [needsTranscript, setNeedsTranscript] = useState(false);
  const timerRef = useRef(null);

  // --- Handlers ---
  const handleYouTubeUrlSubmit = async () => {
    if (!youtubeUrl.trim()) {
      setError("Please enter a YouTube URL.");
      return;
    }
    resetState();
    setError(null);

    const savedTranscript = localStorage.getItem(youtubeUrl);

    if (savedTranscript) {
      // Found in localStorage
      setTranscript(savedTranscript);
      await runAnalysis(savedTranscript);
    } else if (YOUTUBE_TRANSCRIPTS[youtubeUrl]) {
      // Found in our predefined mapping
      const autoTranscript = YOUTUBE_TRANSCRIPTS[youtubeUrl];
      localStorage.setItem(youtubeUrl, autoTranscript);
      setTranscript(autoTranscript);
      await runAnalysis(autoTranscript);
    } else {
      // Ask user to paste
      setNeedsTranscript(true);
    }
  };

  const handleSaveTranscript = async () => {
    if (!manualTranscript.trim()) {
      setError("Please paste transcript text.");
      return;
    }
    localStorage.setItem(youtubeUrl, manualTranscript);
    setTranscript(manualTranscript);
    setNeedsTranscript(false);
    await runAnalysis(manualTranscript);
  };

  const runAnalysis = async (text) => {
    try {
      setIsLoading(true);
      setLoadingMessage("Analyzing transcript with AI...");
      const analysisResult = await analyzeContentForQuiz(text);
      setAnalysis(analysisResult);
    } catch (err) {
      setError(`Analysis error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuiz = async () => {
    setIsLoading(true);
    setLoadingMessage("Generating questions with AI...");
    try {
      const questionCount = 10; // Changed to 10 questions
      const generatedQuestions = await generateQuizFromContent(
        transcript,
        questionCount
      );
      setQuestions(generatedQuestions);
    } catch (err) {
      setError(`Failed to generate quiz: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setTranscript("");
    setManualTranscript("");
    setAnalysis(null);
    setQuestions([]);
    setQuizStarted(false);
    setQuizCompleted(false);
    setError(null);
    setNeedsTranscript(false);
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizCompleted(false);
    setScore(0);
    setElapsedTime(0);
    timerRef.current = setInterval(
      () => setElapsedTime((prev) => prev + 1),
      1000
    );
  };

  const handleAnswerSelect = (id, ans) => {
    setSelectedAnswers((prev) => ({ ...prev, [id]: ans }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      clearInterval(timerRef.current);
      setQuizCompleted(true);
      let correctCount = 0;
      questions.forEach((q) => {
        if (selectedAnswers[q.id] === q.correctAnswer) correctCount++;
      });
      setScore(correctCount);
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    return () => timerRef.current && clearInterval(timerRef.current);
  }, []);

  // --- UI Components ---
  const renderInitialView = () => (
    <div className="border-2 border-dashed border-[#28595a]/30 rounded-2xl p-8 md:p-10 text-center bg-white transition-all hover:shadow-md">
      <div className="bg-[#28595a]/10 p-4 rounded-full inline-flex mb-6">
        <Youtube className="h-10 w-10 text-[#28595a]" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">Generate Quiz from YouTube</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Paste a YouTube URL to generate an educational quiz from the video content
      </p>
      <div className="flex flex-col sm:flex-row max-w-lg mx-auto gap-2">
        <input
          type="text"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="Paste YouTube URL here"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#28595a] focus:border-transparent transition"
        />
        <button
          onClick={handleYouTubeUrlSubmit}
          className="px-5 py-3 bg-[#ff8400] text-white rounded-lg flex items-center justify-center gap-2 hover:bg-[#e67600] transition"
        >
          <span>Analyze</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );

  const renderManualTranscriptInput = () => (
    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      <h3 className="font-semibold text-lg mb-3 text-gray-800">Paste Transcript</h3>
      <p className="text-gray-600 mb-4">We couldn't find a transcript for this video. Please paste it below to generate a quiz.</p>
      <textarea
        rows="8"
        value={manualTranscript}
        onChange={(e) => setManualTranscript(e.target.value)}
        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#28595a] focus:border-transparent transition"
        placeholder="Paste the video transcript here..."
      />
      <div className="flex gap-3 mt-4">
        <button
          onClick={() => {
            setNeedsTranscript(false);
            setManualTranscript("");
          }}
          className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveTranscript}
          className="px-5 py-2 bg-[#28595a] text-white rounded-lg hover:bg-[#1e4546] transition flex items-center gap-2"
        >
          <CheckCircle size={18} />
          Save Transcript
        </button>
      </div>
    </div>
  );

  const renderAnalysisView = () => (
    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-gray-800">Transcript Loaded</h3>
        <button 
          onClick={resetState}
          className="text-sm text-gray-500 hover:text-[#28595a] transition flex items-center gap-1"
        >
          <Home size={16} />
          New URL
        </button>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <p className="text-gray-600">
          {transcript.length > 200
            ? transcript.substring(0, 200) + "..."
            : transcript}
        </p>
      </div>
      
      {analysis && (
        <div className="mt-6 mb-6">
          <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
            <Brain size={18} className="text-[#28595a]" />
            Key Concepts Identified
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.keyConcepts?.map((c, i) => (
              <span key={i} className="px-3 py-1 bg-[#28595a]/10 text-[#28595a] rounded-full text-sm">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <button
        onClick={generateQuiz}
        className="w-full py-3 bg-[#28595a] text-white rounded-lg hover:bg-[#1e4546] transition flex items-center justify-center gap-2"
      >
        <Brain size={18} />
        Generate 10-Question Quiz
      </button>
    </div>
  );

  const renderQuizInProgressView = () => {
    const q = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    
    return (
      <div className="p-4 md:p-6">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={16} />
              {formatTime(elapsedTime)}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#28595a] h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">{q.question}</h3>
          
          <div className="space-y-3">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswerSelect(q.id, opt)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedAnswers[q.id] === opt
                    ? "border-[#28595a] bg-[#28595a]/5"
                    : "border-gray-200 hover:border-[#28595a]/50 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center mr-3 ${
                    selectedAnswers[q.id] === opt
                      ? "border-[#28595a] bg-[#28595a] text-white"
                      : "border-gray-300"
                  }`}>
                    {selectedAnswers[q.id] === opt && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <span>{opt}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className={`px-5 py-2 rounded-lg ${currentQuestionIndex === 0 
              ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
          >
            Previous
          </button>
          
          <button
            onClick={handleNextQuestion}
            disabled={!selectedAnswers[q.id]}
            className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
              !selectedAnswers[q.id]
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#ff8400] text-white hover:bg-[#e67600]"
            }`}
          >
            {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderQuizCompletedView = () => {
    const percentage = Math.round((score / questions.length) * 100);
    let resultColor = "text-red-600";
    let resultMessage = "Keep practicing!";
    
    if (percentage >= 80) {
      resultColor = "text-green-600";
      resultMessage = "Excellent work!";
    } else if (percentage >= 60) {
      resultColor = "text-yellow-600";
      resultMessage = "Good effort!";
    }
    
    return (
      <div className="p-4 md:p-6">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-[#28595a]/10 rounded-full mb-4">
            <Trophy className="h-12 w-12 text-yellow-500" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">Quiz Completed!</h3>
          <p className="text-gray-600 mb-6">
            You answered {score} out of {questions.length} questions correctly
          </p>
          
          <div className="flex justify-center items-center gap-6 mb-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${resultColor}`}>{percentage}%</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            
            <div className="h-12 w-px bg-gray-300"></div>
            
            <div className="text-center">
              <div className="text-xl font-bold text-gray-800">{formatTime(elapsedTime)}</div>
              <div className="text-sm text-gray-600">Time</div>
            </div>
          </div>
          
          <p className={`font-medium ${resultColor}`}>{resultMessage}</p>
        </div>

        <div className="space-y-4 mb-8">
          {questions.map((q, index) => {
            const userAnswer = selectedAnswers[q.id];
            const isCorrect = userAnswer === q.correctAnswer;
            
            return (
              <div key={index} className="p-4 border rounded-lg bg-white">
                <h4 className="font-semibold mb-3 text-gray-800">
                  Q{index + 1}. {q.question}
                </h4>
                
                <div className="space-y-2">
                  {q.options.map((opt, i) => {
                    const isUserChoice = opt === userAnswer;
                    const isCorrectOption = opt === q.correctAnswer;
                    
                    let optionStyle = "bg-gray-50 border-gray-200";
                    let icon = null;
                    
                    if (isCorrectOption) {
                      optionStyle = "bg-green-50 border-green-200";
                      icon = <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />;
                    } else if (isUserChoice && !isCorrect) {
                      optionStyle = "bg-red-50 border-red-200";
                      icon = <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />;
                    }
                    
                    return (
                      <div 
                        key={i} 
                        className={`p-3 border rounded-md flex items-center gap-3 ${optionStyle}`}
                      >
                        {icon}
                        <span className={isCorrectOption ? "text-green-800 font-medium" : 
                                         isUserChoice && !isCorrect ? "text-red-800 line-through" : 
                                         "text-gray-700"}>
                          {opt}
                        </span>
                        {isUserChoice && isCorrectOption && (
                          <span className="ml-auto text-sm text-green-600 font-medium">Your answer</span>
                        )}
                        {isUserChoice && !isCorrect && (
                          <span className="ml-auto text-sm text-red-600 font-medium">Your answer</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              setQuizStarted(false);
              setQuizCompleted(false);
              window.location.reload();
            }}
            className="px-5 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center justify-center gap-2"
          >
            <Home size={18} />
            Back to Home
          </button>
          
          <button
            onClick={startQuiz}
            className="px-5 py-3 bg-[#28595a] text-white rounded-lg hover:bg-[#1e4546] transition flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            Try Again
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center ml-32 bg-gray-50 py-8 px-4">
      <div className="max-w-5xl w-full">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative transition-all">
          <div className="bg-gradient-to-r from-[#28595a] to-[#1e4546] p-6 text-white text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Brain className="h-8 w-8" />
              <h1 className="text-2xl font-bold">YouTube Quiz Generator</h1>
            </div>
            <p className="opacity-90">Transform any YouTube video into an interactive learning experience</p>
          </div>
          
          <div className="p-4 md:p-6">
            {!quizStarted ? (
              !transcript ? (
                needsTranscript ? (
                  renderManualTranscriptInput()
                ) : (
                  renderInitialView()
                )
              ) : !questions.length ? (
                renderAnalysisView()
              ) : (
                <div className="text-center py-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Ready to test your knowledge?</h3>
                  <p className="text-gray-600 mb-6">We've generated a 10-question quiz based on the video content</p>
                  <button
                    onClick={startQuiz}
                    className="px-8 py-3 bg-[#28595a] text-white rounded-lg hover:bg-[#1e4546] transition shadow-md hover:shadow-lg"
                  >
                    Start Quiz
                  </button>
                </div>
              )
            ) : !quizCompleted ? (
              renderQuizInProgressView()
            ) : (
              renderQuizCompletedView()
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
                <XCircle size={18} />
                {error}
              </div>
            )}
          </div>
          
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl">
              <Loader2 className="animate-spin h-10 w-10 text-[#28595a] mb-3" />
              <span className="text-gray-700">{loadingMessage}</span>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>AI-powered quiz generation from YouTube content</p>
        </div>
      </div>
    </div>
  );
};

export default YouTubeQuizGenerator;