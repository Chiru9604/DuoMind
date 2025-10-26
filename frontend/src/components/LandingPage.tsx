import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Zap, 
  Shield, 
  Users, 
  Code, 
  Sparkles, 
  ArrowRight, 
  MessageSquare,
  Search,
  BookOpen,
  Lightbulb,
  Target,
  Rocket,
  Star,
  FileText,
  Upload,
  ToggleLeft,
  Clock
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleExploreChatClick = () => {
    navigate('/chat');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Logo/Brand */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="w-3 h-3 text-yellow-800" />
                </div>
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-emerald-600 bg-clip-text text-transparent mb-6 animate-fade-in">
              DuoMind
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-4 animate-fade-in-delay-1">
              Dual-Mode RAG Chat Application
            </p>
            
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-3xl mx-auto mb-12 animate-fade-in-delay-2">
              Upload your documents and chat with them intelligently. Switch between Normal mode for factual, grounded answers and Pro mode for creative reasoning that goes beyond the text. Transform how you interact with your PDFs and DOCX files.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-fade-in-delay-3">
              <button
                onClick={handleExploreChatClick}
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-emerald-600 text-white font-semibold rounded-2xl shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
              >
                <MessageSquare className="w-5 h-5" />
                Explore Chat
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-emerald-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity -z-10"></div>
              </button>
              
              <button 
                onClick={() => {
                  const featuresSection = document.getElementById('features');
                  featuresSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 border-2 border-purple-300 text-purple-600 dark:text-purple-400 dark:border-purple-500 font-semibold rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 flex items-center gap-3"
              >
                <BookOpen className="w-5 h-5" />
                Learn More
              </button>
            </div>

            {/* Feature Preview Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto animate-fade-in-delay-4">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-purple-200 dark:border-purple-800 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Normal Mode</h3>
                <p className="text-gray-600 dark:text-gray-300">Get factual, grounded answers directly from your uploaded documents. Perfect for precise information retrieval with a beautiful purple theme.</p>
              </div>
              
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-emerald-200 dark:border-emerald-800 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Pro Mode</h3>
                <p className="text-gray-600 dark:text-gray-300">Creative reasoning and insights that go beyond the text. Advanced perspective-driven analysis of your documents with sleek emerald accents.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
              Transform Your Document Experience
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Upload, chat, and discover insights from your documents like never before. Experience the power of dual-mode RAG technology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-purple-100 dark:border-purple-800">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Document Upload</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Seamlessly upload PDF and DOCX files. Drag & drop or click to upload - your documents are processed instantly and securely.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-emerald-900/20 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-emerald-100 dark:border-emerald-800">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Intelligent Chat</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Ask questions about your documents naturally. Get contextual answers powered by advanced RAG technology and LLM intelligence.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-gradient-to-br from-white to-pink-50 dark:from-gray-800 dark:to-pink-900/20 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-pink-100 dark:border-pink-800">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ToggleLeft className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Dual Mode System</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Switch between Normal mode for factual answers and Pro mode for creative insights. Two perspectives, infinite possibilities.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group relative bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100 dark:border-blue-800">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Secure & Private</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Your documents and conversations are protected with enterprise-grade security. Local processing ensures complete privacy.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group relative bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-900/20 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-indigo-100 dark:border-indigo-800">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Persistent History</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Your chat history is automatically saved. Return anytime to continue conversations and build upon previous insights.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group relative bg-gradient-to-br from-white to-yellow-50 dark:from-gray-800 dark:to-yellow-900/20 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-yellow-100 dark:border-yellow-800">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Lightning Fast</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Powered by Groq LLM API and ChromaDB for blazing-fast responses. Get answers in seconds, not minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 via-pink-600 to-emerald-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-8 h-8 text-yellow-400 fill-current" />
              ))}
            </div>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Chat with Your Documents?
          </h2>
          
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Upload your PDFs and DOCX files and experience the future of document interaction with dual-mode AI intelligence.
          </p>
          
          <button
            onClick={handleExploreChatClick}
            className="group relative px-12 py-6 bg-white text-purple-600 font-bold text-xl rounded-2xl shadow-2xl hover:shadow-white/25 transform hover:scale-105 transition-all duration-300 flex items-center gap-4 mx-auto"
          >
            <Upload className="w-6 h-6" />
            Start Chatting with Documents
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </section>


    </div>
  );
};

export default LandingPage;