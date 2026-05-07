import React from 'react'
import Header from '../components/Header'
import { Link } from 'react-router'
import { Mic, Globe, Shield, Zap, ArrowRight } from "lucide-react";
import Footer from '../components/Footer';
 


const Landing = () => {
    
  return (
    <>
    <div className="min-h-screen  w-[100%] overflow-x-hidden bg-white">
      {/* Top Navigation */}
     <Header/>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-24 text-center">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-black mb-4 sm:mb-6">
          Speak Without Language Barriers
        </h1>
        <p className="text-base sm:text-xl text-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
          Real-time AI voice translation between English and Urdu
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
          <Link
            to="/signup"
            className="px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 text-white rounded-lg text-base sm:text-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            Get Started
          </Link>
          <Link
            to="/signin"
            className="px-6 sm:px-8 py-3 sm:py-4 bg-gray-100 text-black rounded-lg text-base sm:text-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Join Meeting
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-12 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-bold text-black text-center mb-8 sm:mb-16">
            Features
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">
                Real-time Speech Translation
              </h3>
              <p className="text-gray-600">
                Instant translation between English and Urdu with natural voice output
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Mic className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">
                Live Captions
              </h3>
              <p className="text-gray-600">
                Dual language captions displayed in real-time during conversations
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">
                Low Latency Communication
              </h3>
              <p className="text-gray-600">
                Less than 2 second delay for seamless conversations
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">
                Secure Meetings
              </h3>
              <p className="text-gray-600">
                End-to-end encrypted meetings with privacy-first design
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-bold text-black text-center mb-8 sm:mb-16">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-black mb-2">
                Join or create meeting
              </h3>
              <p className="text-gray-600">Start instantly or schedule ahead</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-black mb-2">
                Speak naturally
              </h3>
              <p className="text-gray-600">Talk in your preferred language</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-black mb-2">
                System translates instantly
              </h3>
              <p className="text-gray-600">AI processes and converts speech</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-lg font-bold text-black mb-2">
                Other user hears in their language
              </h3>
              <p className="text-gray-600">Seamless conversation flow</p>
            </div>
          </div>
        </div>
      </section>

      {/* Translation Pipeline */}
      <section className="bg-gray-50 py-12 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-bold text-black text-center mb-8 sm:mb-16">
            Translation Pipeline
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            <div className="bg-white px-3 sm:px-6 py-2 sm:py-4 rounded-lg shadow-sm font-medium text-black text-sm sm:text-base">
              Speech
            </div>
            <ArrowRight className="text-gray-400 w-4 h-4 sm:w-6 sm:h-6" />
            <div className="bg-white px-3 sm:px-6 py-2 sm:py-4 rounded-lg shadow-sm font-medium text-black text-sm sm:text-base">
              AI Processing
            </div>
            <ArrowRight className="text-gray-400 w-4 h-4 sm:w-6 sm:h-6" />
            <div className="bg-white px-3 sm:px-6 py-2 sm:py-4 rounded-lg shadow-sm font-medium text-black text-sm sm:text-base">
              Language Detection
            </div>
            <ArrowRight className="text-gray-400 w-4 h-4 sm:w-6 sm:h-6" />
            <div className="bg-white px-3 sm:px-6 py-2 sm:py-4 rounded-lg shadow-sm font-medium text-black text-sm sm:text-base">
              Translation
            </div>
            <ArrowRight className="text-gray-400 w-4 h-4 sm:w-6 sm:h-6" />
            <div className="bg-white px-3 sm:px-6 py-2 sm:py-4 rounded-lg shadow-sm font-medium text-black text-sm sm:text-base">
              Voice Output
            </div>
          </div>
        </div>
      </section>

    <Footer/>
      
    </div>
    </>
  )
}

export default Landing;