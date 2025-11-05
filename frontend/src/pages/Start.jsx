
import React from 'react'
import { Link } from 'react-router-dom'

const Start = () => {
  return (
    <div className='relative h-screen overflow-hidden'>
      {/* Gradient Background */}
      <div className='absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900'></div>
      
      {/* Animated Background Elements */}
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob'></div>
        <div className='absolute top-40 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000'></div>
        <div className='absolute -bottom-8 left-1/2 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000'></div>
      </div>

      {/* Content */}
      <div className='relative h-full flex flex-col justify-between p-8'>
        {/* Logo */}
        <div className='mt-8'>
          <div className='flex items-center gap-3'>
            <div className='w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl'>
              <svg className='w-10 h-10 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
              </svg>
            </div>
            <h1 className='text-4xl font-bold text-white'>goComet</h1>
          </div>
        </div>

        {/* Bottom Section */}
        <div className='bg-white/95 backdrop-blur-lg rounded-3xl p-8 shadow-2xl mb-8'>
          <h2 className='text-4xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent mb-2'>
            Ride with Speed
          </h2>
          <p className='text-gray-600 text-lg mb-8'>Your journey, our mission. Fast, reliable, and safe rides whenever you need them.</p>
          <Link 
            to='/login' 
            className='flex items-center justify-center w-full bg-gradient-to-r from-indigo-600 to-pink-600 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200'
          >
            Get Started
            <svg className='w-5 h-5 ml-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 7l5 5m0 0l-5 5m5-5H6' />
            </svg>
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

export default Start