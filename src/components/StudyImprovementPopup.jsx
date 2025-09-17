// components/StudyImprovementPopup.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Youtube,
  FileText,
  Clock,
  Target,
  BookOpen,
  Lightbulb,
  TrendingUp,
  Play,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { generateStudyResources, getMotivationalMessage } from '../services/studyImprovementService';

const StudyImprovementPopup = ({ 
  isOpen, 
  onClose, 
  onContinue,
  score, 
  totalQuestions, 
  mainTopic,
  weakAreas = [],
  contentAnalysis
}) => {
  const [studyResources, setStudyResources] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const scorePercentage = Math.round((score / totalQuestions) * 100);
  const motivationalData = getMotivationalMessage(scorePercentage);

  useEffect(() => {
    if (isOpen && !studyResources) {
      fetchStudyResources();
    }
  }, [isOpen]);

  const fetchStudyResources = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const resources = await generateStudyResources(
        mainTopic || contentAnalysis?.mainTopics?.[0] || 'General Knowledge',
        score,
        totalQuestions,
        weakAreas
      );
      setStudyResources(resources);
    } catch (err) {
      setError('Failed to load study recommendations. Please try again.');
      console.error('Error fetching study resources:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryFetch = () => {
    fetchStudyResources();
  };

  const handleVideoClick = (url) => {
    window.open(url, '_blank');
  };

  const handleArticleClick = (url) => {
    window.open(url, '_blank');
  };

  const handleContinueLearning = () => {
    onContinue();
    onClose();
  };

  // Handle backdrop click to close modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#28595a] to-[#1e4445] p-6 text-white rounded-t-xl">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <div className="text-3xl mr-3">{motivationalData.emoji}</div>
                <h2 className="text-2xl font-bold">{motivationalData.title}</h2>
              </div>
              <p className="text-white mb-4">{motivationalData.message}</p>
              
              <div className="flex items-center space-x-6">
                <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                  <div className="text-sm text-black">Your Score</div>
                  <div className="text-2xl font-bold text-black">{score}/{totalQuestions}</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                  <div className="text-sm text-black">Accuracy</div>
                  <div className="text-2xl font-bold text-black">{scorePercentage}%</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                  <div className="text-sm text-black">Topic</div>
                  <div className="text-lg font-medium truncate max-w-32 text-black">{mainTopic}</div>
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="ml-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-[#ff8400] text-[#ff8400]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Target className="inline w-4 h-4 mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'videos'
                  ? 'border-[#ff8400] text-[#ff8400]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Youtube className="inline w-4 h-4 mr-2" />
              Videos ({studyResources?.youtubeVideos?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('articles')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'articles'
                  ? 'border-[#ff8400] text-[#ff8400]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="inline w-4 h-4 mr-2" />
              Articles ({studyResources?.articles?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('tips')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tips'
                  ? 'border-[#ff8400] text-[#ff8400]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Lightbulb className="inline w-4 h-4 mr-2" />
              Study Tips
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#28595a] mb-4" />
              <p className="text-gray-600">Generating personalized study recommendations...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleRetryFetch}
                className="px-4 py-2 bg-[#28595a] text-white rounded-lg hover:bg-[#1e4445] transition-colors flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>
            </div>
          ) : studyResources ? (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Performance Analysis */}
                  <div className="bg-[#f6fbf6] rounded-lg p-6 border border-[#dbf0dd]">
                    <h3 className="text-lg font-semibold text-[#28595a] mb-3 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Performance Analysis
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {studyResources.performanceAnalysis}
                    </p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                      <Youtube className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">
                        {studyResources.youtubeVideos?.length || 0}
                      </div>
                      <div className="text-sm text-gray-500">Video Recommendations</div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                      <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">
                        {studyResources.articles?.length || 0}
                      </div>
                      <div className="text-sm text-gray-500">Article Recommendations</div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                      <Lightbulb className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">
                        {studyResources.studyTips?.length || 0}
                      </div>
                      <div className="text-sm text-gray-500">Study Tips</div>
                    </div>
                  </div>

                  {/* Quick Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Video Preview */}
                    {studyResources.youtubeVideos?.[0] && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                          <Youtube className="w-4 h-4 mr-2 text-red-500" />
                          Featured Video
                        </h4>
                        <div className="space-y-2">
                          <p className="font-medium text-sm text-gray-800">
                            {studyResources.youtubeVideos[0].title}
                          </p>
                          <p className="text-xs text-gray-600">
                            by {studyResources.youtubeVideos[0].channel}
                          </p>
                          <p className="text-xs text-gray-500">
                            {studyResources.youtubeVideos[0].description}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Top Article Preview */}
                    {studyResources.articles?.[0] && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-blue-500" />
                          Featured Article
                        </h4>
                        <div className="space-y-2">
                          <p className="font-medium text-sm text-gray-800">
                            {studyResources.articles[0].title}
                          </p>
                          <p className="text-xs text-gray-600">
                            from {studyResources.articles[0].source}
                          </p>
                          <p className="text-xs text-gray-500">
                            {studyResources.articles[0].description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Videos Tab */}
              {activeTab === 'videos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#28595a]">
                      Recommended Videos
                    </h3>
                    <span className="text-sm text-gray-500">
                      {studyResources.youtubeVideos?.length} videos
                    </span>
                  </div>
                  
                  {studyResources.youtubeVideos?.map((video, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleVideoClick(video.url)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
                            <Play className="w-8 h-8 text-red-500" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1 hover:text-[#28595a] transition-colors">
                            {video.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            by {video.channel}
                          </p>
                          <p className="text-sm text-gray-700 mb-3">
                            {video.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              {video.duration}
                            </div>
                            <div className="flex items-center text-sm text-[#28595a] hover:text-[#1e4445]">
                              <span className="mr-1">Watch Now</span>
                              <ExternalLink className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Articles Tab */}
              {activeTab === 'articles' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#28595a]">
                      Recommended Articles
                    </h3>
                    <span className="text-sm text-gray-500">
                      {studyResources.articles?.length} articles
                    </span>
                  </div>
                  
                  {studyResources.articles?.map((article, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleArticleClick(article.url)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-8 h-8 text-blue-500" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1 hover:text-[#28595a] transition-colors">
                            {article.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            from {article.source}
                          </p>
                          <p className="text-sm text-gray-700 mb-3">
                            {article.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              {article.readingTime}
                            </div>
                            <div className="flex items-center text-sm text-[#28595a] hover:text-[#1e4445]">
                              <span className="mr-1">Read Article</span>
                              <ExternalLink className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Study Tips Tab */}
              {activeTab === 'tips' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#28595a]">
                      Personalized Study Tips
                    </h3>
                  </div>
                  
                  <div className="grid gap-4">
                    {studyResources.studyTips?.map((tip, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-[#f6fbf6] to-white border border-[#dbf0dd] rounded-lg p-4"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-6 h-6 bg-[#ff8400] rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {index + 1}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-700 leading-relaxed">{tip}</p>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Additional Study Strategy */}
                  <div className="mt-6 bg-[#28595a] text-white rounded-lg p-6">
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Target className="w-5 h-5 mr-2" />
                      Next Steps for Improvement
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm opacity-90">
                      <li>Review the recommended resources above</li>
                      <li>Focus on your weaker areas first</li>
                      <li>Practice with additional quizzes</li>
                      <li>Apply concepts through real-world examples</li>
                      <li>Track your progress over time</li>
                    </ol>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Keep learning to improve your understanding of {mainTopic}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleContinueLearning}
                className="px-6 py-2 bg-[#ff8400] hover:bg-[#e67700] text-white font-medium rounded-lg transition-colors flex items-center"
              >
                Continue Learning
                <BookOpen className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyImprovementPopup;