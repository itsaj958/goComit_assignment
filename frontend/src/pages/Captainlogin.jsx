import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { CaptainDataContext } from '../context/CapatainContext'

const Captainlogin = () => {

  const [ email, setEmail ] = useState('')
  const [ password, setPassword ] = useState('')

  const { captain, setCaptain } = React.useContext(CaptainDataContext)
  const navigate = useNavigate()



  const submitHandler = async (e) => {
    e.preventDefault();
    const captain = {
      email: email,
      password
    }

    const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/captains/login`, captain)

    if (response.status === 200) {
      const data = response.data

      setCaptain(data.captain)
      localStorage.setItem('token', data.token)
      navigate('/captain-home')

    }

    setEmail('')
    setPassword('')
  }
  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        {/* Logo */}
        <div className='flex items-center justify-center mb-8'>
          <div className='w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg'>
            <svg className='w-10 h-10 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
            </svg>
          </div>
          <h1 className='text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent ml-3'>goComet</h1>
        </div>

        {/* Card */}
        <div className='bg-white rounded-3xl shadow-2xl p-8'>
          <h2 className='text-3xl font-bold text-gray-800 mb-2'>Captain Login</h2>
          <p className='text-gray-600 mb-8'>Welcome back to goComet</p>

          <form onSubmit={(e) => {
            submitHandler(e)
          }}>
            <div className='mb-6'>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Email Address</label>
              <input
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                }}
                className='w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-800 placeholder-gray-400'
                type="email"
                placeholder='email@example.com'
              />
            </div>

            <div className='mb-6'>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Password</label>
              <input
                className='w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-800 placeholder-gray-400'
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                }}
                required type="password"
                placeholder='Enter your password'
              />
            </div>

            <button
              className='w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 mb-4'
            >
              Sign In
            </button>
          </form>

          <p className='text-center text-gray-600 mb-6'>
            Join our fleet? <Link to='/captain-signup' className='text-green-600 font-semibold hover:text-green-700'>Register as Captain</Link>
          </p>

          <div className='border-t border-gray-200 pt-6'>
            <Link
              to='/login'
              className='flex items-center justify-center w-full bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200'
            >
              <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
              </svg>
              Sign in as User
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Captainlogin