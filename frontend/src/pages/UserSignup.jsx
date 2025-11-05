import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { UserDataContext } from '../context/UserContext'



const UserSignup = () => {
  const [ email, setEmail ] = useState('')
  const [ password, setPassword ] = useState('')
  const [ firstName, setFirstName ] = useState('')
  const [ lastName, setLastName ] = useState('')
  const [ userData, setUserData ] = useState({})

  const navigate = useNavigate()



  const { user, setUser } = useContext(UserDataContext)




  const submitHandler = async (e) => {
    e.preventDefault()
    const newUser = {
      fullname: {
        firstname: firstName,
        lastname: lastName
      },
      email: email,
      password: password
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/register`, newUser)

      if (response.status === 201) {
        const data = response.data
        setUser(data.user)
        localStorage.setItem('token', data.token)
        navigate('/home')
      }

      setEmail('')
      setFirstName('')
      setLastName('')
      setPassword('')
    } catch (error) {
      console.error('Registration error:', error)
      if (error.code === 'ERR_NETWORK') {
        alert('Cannot connect to server. Please make sure the backend server is running on port 3000.')
      } else if (error.response) {
        // Server responded with error
        alert(error.response.data.message || 'Registration failed. Please try again.')
      } else {
        alert('An error occurred. Please try again.')
      }
    }
  }
  return (
    <div className='min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        {/* Logo */}
        <div className='flex items-center justify-center mb-8'>
          <div className='w-16 h-16 bg-gradient-to-br from-indigo-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg'>
            <svg className='w-10 h-10 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
            </svg>
          </div>
          <h1 className='text-3xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent ml-3'>goComet</h1>
        </div>

        {/* Card */}
        <div className='bg-white rounded-3xl shadow-2xl p-8'>
          <h2 className='text-3xl font-bold text-gray-800 mb-2'>Create Account</h2>
          <p className='text-gray-600 mb-8'>Join goComet and start your journey</p>

          <form onSubmit={(e) => {
            submitHandler(e)
          }}>
            <div className='mb-6'>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Full Name</label>
              <div className='flex gap-3'>
                <input
                  required
                  className='w-1/2 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-800 placeholder-gray-400'
                  type="text"
                  placeholder='First name'
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value)
                  }}
                />
                <input
                  required
                  className='w-1/2 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-800 placeholder-gray-400'
                  type="text"
                  placeholder='Last name'
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value)
                  }}
                />
              </div>
            </div>

            <div className='mb-6'>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Email Address</label>
              <input
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                }}
                className='w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-800 placeholder-gray-400'
                type="email"
                placeholder='email@example.com'
              />
            </div>

            <div className='mb-6'>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Password</label>
              <input
                className='w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-800 placeholder-gray-400'
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                }}
                required type="password"
                placeholder='Create a password'
              />
            </div>

            <button
              className='w-full bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 mb-4'
            >
              Create Account
            </button>
          </form>

          <p className='text-center text-gray-600 mb-6'>
            Already have an account? <Link to='/login' className='text-indigo-600 font-semibold hover:text-indigo-700'>Sign In</Link>
          </p>

          <div className='border-t border-gray-200 pt-6'>
            <p className='text-xs text-gray-500 leading-relaxed text-center'>
              By signing up, you agree to goComet's <span className='underline'>Terms of Service</span> and <span className='underline'>Privacy Policy</span>. 
              This site is protected by reCAPTCHA.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserSignup