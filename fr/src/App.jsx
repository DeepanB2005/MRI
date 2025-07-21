import React, { useState, useRef, useEffect } from 'react';
import { Upload, Send, FileImage, Brain, MessageCircle, FileText, AlertCircle, CheckCircle, Activity, Bot, User, Sparkles, Heart } from 'lucide-react';

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [report, setReport] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  const [serverStatus, setServerStatus] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const API_BASE = 'http://localhost:5000/api';

  // Check server health on component mount
  useEffect(() => {
    checkServerHealth();
  }, []);

  // Auto-scroll chat messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const checkServerHealth = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      const data = await response.json();
      setServerStatus(data);
      
      if (!data.models_loaded) {
        setError('ML models not loaded on server. Please check server logs.');
      } else if (!data.gemini_configured) {
        setError('Gemini API key not configured on server.');
      } else {
        setError('');
      }
    } catch (error) {
      setServerStatus(null);
      setError('Cannot connect to server. Please ensure the Flask server is running on port 5000.');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      
      // Validate file size (max 10MB)  
      if (file.size > 10 * 1024 * 1024) {
        setError('File size too large. Please select an image smaller than 10MB.');
        return;
      }
      
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setPredictions(null);
      setReport('');
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setPredictions(data);
        setActiveTab('results');
        setError('');
      } else {
        setError('Prediction failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Network error. Please check if the server is running and try again.');
    }
    setLoading(false);
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { id: Date.now(), type: 'user', message: userMessage }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          diagnosis: predictions?.top_prediction?.disease || ''
        }),
      });

      const data = await response.json();
      if (data.success) {
        setChatMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', message: data.response }]);
      } else {
        setChatMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', message: `Error: ${data.error || 'Sorry, I encountered an error. Please try again.'}` }]);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', message: 'Connection error. Please check your internet connection and ensure the server is running.' }]);
    }
    setChatLoading(false);
  };

  const generateReport = async () => {
    if (!predictions?.top_prediction) return;

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosis: predictions.top_prediction.disease,
          confidence: predictions.top_prediction.confidence
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setReport(data.report);
        setActiveTab('report');
        setError('');
      } else {
        setError('Report generation failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Report generation error:', error);
      setError('Network error. Please check if the server is running and try again.');
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChat();
    }
  };

  const useTypewriter = (text, speed = 20) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
      if (!text) return;
      setDisplayedText('');
      setIsComplete(false);
      let i = 0;
      const timer = setInterval(() => {
        if (i < text.length) {
          setDisplayedText(prev => prev + text.charAt(i));
          i++;
        } else {
          setIsComplete(true);
          clearInterval(timer);
        }
      }, speed);
      return () => clearInterval(timer);
    }, [text, speed]);

    return { displayedText, isComplete };
  };

  const TypewriterMessage = ({ message, onComplete }) => {
    const { displayedText, isComplete } = useTypewriter(message, 20);
    useEffect(() => {
      if (isComplete && onComplete) {
        onComplete();
      }
    }, [isComplete, onComplete]);
    return (
      <div className="flex justify-start animate-fadeIn">
        <div className="flex items-start space-x-3 max-w-md">
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-md border border-gray-200">
            <p className="text-sm text-gray-800 leading-relaxed">
              {displayedText}
              {!isComplete && <span className="animate-pulse ml-1 text-emerald-500">|</span>}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">MedAI Diagnostics</h1>
                <p className="text-sm text-gray-600">Advanced Medical Image Analysis</p>
              </div>
            </div>
            
            {/* Server Status */}
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                serverStatus?.status === 'healthy' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  serverStatus?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span>{serverStatus?.status === 'healthy' ? 'Server Online' : 'Server Offline'}</span>
              </div>
              <button
                onClick={checkServerHealth}
                className="p-2 text-gray-500 hover:text-gray-700"
                title="Check server status"
              >
                <Activity className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'upload', label: 'Upload & Analyze', icon: Upload },
            { id: 'results', label: 'Results', icon: CheckCircle },
            { id: 'chat', label: 'AI Assistant', icon: MessageCircle },
            { id: 'report', label: 'Medical Report', icon: FileText }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        
        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FileImage className="h-5 w-5 mr-2 text-blue-600" />
                Upload Medical Image
              </h2>
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                {previewUrl ? (
                  <div className="space-y-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg shadow-md"
                    />
                    <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                    <p className="text-xs text-gray-500">
                      {selectedFile && `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">Click to upload image</p>
                      <p className="text-sm text-gray-500">Supports eye scans, MRIs, X-rays and other medical images</p>
                      <p className="text-xs text-gray-400 mt-2">Max file size: 10MB</p>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFile && (
                <button
                  onClick={handleUpload}
                  disabled={loading || !serverStatus?.models_loaded}
                  className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      <span>Analyze Image</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Info Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">How it works</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">1</div>
                  <div>
                    <p className="font-medium text-gray-900">Upload Medical Image</p>
                    <p className="text-sm text-gray-600">Select and upload your medical scan or image</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">2</div>
                  <div>
                    <p className="font-medium text-gray-900">AI Analysis</p>
                    <p className="text-sm text-gray-600">Our advanced AI model analyzes the image for potential conditions</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">3</div>
                  <div>
                    <p className="font-medium text-gray-900">Get Results</p>
                    <p className="text-sm text-gray-600">Receive predictions with confidence scores and detailed reports</p>
                  </div>
                </div>
              </div>

              {/* Server Status Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">System Status</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Server Connection</span>
                    <span className={serverStatus ? 'text-green-600' : 'text-red-600'}>
                      {serverStatus ? '✓ Connected' : '✗ Disconnected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ML Models</span>
                    <span className={serverStatus?.models_loaded ? 'text-green-600' : 'text-red-600'}>
                      {serverStatus?.models_loaded ? '✓ Loaded' : '✗ Not Loaded'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>AI Assistant</span>
                    <span className={serverStatus?.gemini_configured ? 'text-green-600' : 'text-red-600'}>
                      {serverStatus?.gemini_configured ? '✓ Ready' : '✗ Not Configured'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Medical Disclaimer</p>
                    <p className="text-xs text-amber-800 mt-1">This AI tool is for educational purposes only. Always consult with qualified healthcare professionals for medical diagnosis and treatment.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            {predictions ? (
              <>
                {/* Top Prediction */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Primary Diagnosis</h2>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{predictions.top_prediction.disease}</h3>
                        <p className="text-gray-600 mt-1">Most likely diagnosis</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">
                          {predictions.top_prediction.confidence.toFixed(1)}%
                        </div>
                        <p className="text-sm text-gray-600">Confidence</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* All Predictions */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">All Predictions</h2>
                  <div className="space-y-3">
                    {predictions.all_predictions.map((pred, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900">{pred.disease}</span>
                        <div className="flex items-center space-x-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${pred.confidence}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold text-blue-600 w-12">{pred.confidence.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-4">
                  <button
                    onClick={generateReport}
                    disabled={loading || !serverStatus?.gemini_configured}
                    className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Generate Medical Report</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    disabled={!serverStatus?.gemini_configured}
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Ask AI Assistant</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
                <p className="text-gray-600">Upload and analyze an image to see predictions here.</p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700"
                >
                  Upload Image
                </button>
              </div>
            )}
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="relative p-6 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 text-white overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4">
                  <Heart className="h-8 w-8 animate-pulse" />
                </div>
                <div className="absolute top-8 right-8">
                  <Activity className="h-6 w-6 animate-bounce" />
                </div>
                <div className="absolute bottom-4 left-1/2">
                  <Sparkles className="h-5 w-5 animate-ping" />
                </div>
              </div>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">AI Medical Assistant</h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                      <span className="text-sm opacity-90">Online & Ready to Help</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm opacity-90">Your intelligent health companion for medical questions and guidance</p>
                {!serverStatus?.gemini_configured && (
                  <div className="mt-4 p-3 bg-red-500 bg-opacity-30 rounded-xl backdrop-blur-sm border border-red-300 border-opacity-30">
                    <p className="text-sm flex items-center">
                      <span className="mr-2">⚠️</span>
                      AI Assistant temporarily unavailable - Please check back soon
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="h-96 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-500 mt-16 animate-fadeIn">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <MessageCircle className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Welcome to Your AI Health Assistant</h3>
                  <p className="text-sm leading-relaxed max-w-sm mx-auto">
                    I'm here to help answer your medical questions and provide health guidance. 
                    Feel free to ask about symptoms, treatments, or general health topics.
                  </p>
                  {predictions?.top_prediction && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 max-w-sm mx-auto">
                      <div className="flex items-center justify-center mb-2">
                        <Sparkles className="h-4 w-4 text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-blue-700">Suggested Topic</span>
                      </div>
                      <p className="text-sm text-blue-800">
                        Ask me about: "{predictions.top_prediction.disease}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-6">
                {chatMessages.map((msg, index) => {
                  if (msg.type === 'user') {
                    return (
                      <div key={msg.id} className="flex justify-end animate-slideIn">
                        <div className="flex items-start space-x-3 max-w-md">
                          <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-3 rounded-2xl rounded-tr-sm shadow-lg">
                            <p className="text-sm text-white leading-relaxed">{msg.message}</p>
                          </div>
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    // Only animate the last AI message
                    const isLastAI = msg.type === 'ai' && index === chatMessages.length - 1 && chatLoading;

                    return isLastAI ? (
                      <TypewriterMessage
                        key={msg.id}
                        message={msg.message}
                        onComplete={() => setChatLoading(false)}
                      />
                    ) : (
                      <div key={msg.id} className="flex justify-start animate-fadeIn">
                        <div className="flex items-start space-x-3 max-w-md">
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-md border border-gray-200">
                            <p className="text-sm text-gray-800 leading-relaxed">{msg.message}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}

                {chatLoading && (
                  <div className="flex justify-start animate-fadeIn">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-md border border-gray-200">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-sm text-gray-600">AI is analyzing...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      serverStatus?.gemini_configured 
                        ? "Type your medical question here..."
                        : "AI Assistant unavailable - check server configuration"
                    }
                    disabled={!serverStatus?.gemini_configured || chatLoading}
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <MessageCircle className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <button
                  onClick={handleChat}
                  disabled={chatLoading || !chatInput.trim() || !serverStatus?.gemini_configured}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
                >
                  <Send className="h-5 w-5" />
                  <span className="hidden sm:inline font-medium">Send</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                This AI assistant provides general medical information and should not replace professional medical advice.
              </p>
            </div>

            {/* Animations */}
            <style jsx>{`
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes slideIn {
                from { opacity: 0; transform: translateX(20px); }
                to { opacity: 1; transform: translateX(0); }
              }
              .animate-fadeIn {
                animation: fadeIn 0.5s ease-out;
              }
              .animate-slideIn {
                animation: slideIn 0.3s ease-out;
              }
            `}</style>
          </div>
        )}

        {/* Report Tab */}
        {activeTab === 'report' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            {report ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-purple-600" />
                    Medical Report
                  </h2>
                  <button
                    onClick={() => window.print()}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700"
                  >
                    Print Report
                  </button>
                </div>
                <div className="prose max-w-none">
                  <div className="bg-gray-50 p-6 rounded-lg whitespace-pre-wrap text-sm leading-relaxed">
                    {report}
                  </div>
                </div>
                
                {/* Report Actions */}
                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => {
                      const blob = new Blob([report], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `medical-report-${new Date().toISOString().split('T')[0]}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
                  >
                    Download Report
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    disabled={!serverStatus?.gemini_configured}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Discuss with AI
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
                <p className="text-gray-600 mb-4">Generate a medical report from your diagnosis results.</p>
                {predictions ? (
                  <button
                    onClick={generateReport}
                    disabled={loading || !serverStatus?.gemini_configured}
                    className="bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Generating...' : 'Generate Report'}
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700"
                  >
                    Upload Image First
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}