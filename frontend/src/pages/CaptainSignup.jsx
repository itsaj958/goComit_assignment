import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { CaptainDataContext } from '../context/CapatainContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const CaptainSignup = () => {

  const navigate = useNavigate()

  const [ email, setEmail ] = useState('')
  const [ password, setPassword ] = useState('')
  const [ firstName, setFirstName ] = useState('')
  const [ lastName, setLastName ] = useState('')

  const [ vehicleColor, setVehicleColor ] = useState('')
  const [ vehiclePlate, setVehiclePlate ] = useState('')
  const [ vehicleCapacity, setVehicleCapacity ] = useState('')
  const [ vehicleType, setVehicleType ] = useState('')


  const { captain, setCaptain } = React.useContext(CaptainDataContext)


  const submitHandler = async (e) => {
    e.preventDefault()
    const captainData = {
      fullname: {
        firstname: firstName,
        lastname: lastName
      },
      email: email,
      password: password,
      vehicle: {
        color: vehicleColor,
        plate: vehiclePlate,
        capacity: parseInt(vehicleCapacity, 10),
        vehicleType: vehicleType
      }
    }

    const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/captains/register`, captainData)

    if (response.status === 201) {
      const data = response.data
      setCaptain(data.captain)
      localStorage.setItem('token', data.token)
      navigate('/captain-home')
    }

    setEmail('')
    setFirstName('')
    setLastName('')
    setPassword('')
    setVehicleColor('')
    setVehiclePlate('')
    setVehicleCapacity('')
    setVehicleType('')

  }
  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4 py-8'>
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
          <h2 className='text-3xl font-bold text-gray-800 mb-2'>Become a Captain</h2>
          <p className='text-gray-600 mb-8'>Join goComet's driver network</p>

          <form onSubmit={(e) => {
            submitHandler(e)
          }}>
            <div className='mb-6'>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Full Name</label>
              <div className='flex gap-3'>
                <input
                  required
                  className='w-1/2 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-800 placeholder-gray-400'
                  type="text"
                  placeholder='First name'
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value)
                  }}
                />
                <input
                  required
                  className='w-1/2 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-800 placeholder-gray-400'
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
                placeholder='Create a password'
              />
            </div>

            <div className='mb-6'>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Vehicle Information</label>
              <div className='flex gap-3 mb-3'>
                <input
                  required
                  className='w-1/2 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-800 placeholder-gray-400'
                  type="text"
                  placeholder='Vehicle Color'
                  value={vehicleColor}
                  onChange={(e) => {
                    setVehicleColor(e.target.value)
                  }}
                />
                <input
                  required
                  className='w-1/2 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-800 placeholder-gray-400'
                  type="text"
                  placeholder='Vehicle Plate'
                  value={vehiclePlate}
                  onChange={(e) => {
                    setVehiclePlate(e.target.value)
                  }}
                />
              </div>
              <div className='flex gap-3'>
                <input
                  required
                  className='w-1/2 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-800 placeholder-gray-400'
                  type="number"
                  placeholder='Capacity'
                  value={vehicleCapacity}
                  onChange={(e) => {
                    setVehicleCapacity(e.target.value)
                  }}
                />
                <select
                  required
                  className='w-1/2 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-800'
                  value={vehicleType}
                  onChange={(e) => {
                    setVehicleType(e.target.value)
                  }}
                >
                  <option value="" disabled>Vehicle Type</option>
                  <option value="car">Car</option>
                  <option value="auto">Auto</option>
                  <option value="motorcycle">Moto</option>
                </select>
              </div>
            </div>

            <button
              className='w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 mb-4'
            >
              Create Captain Account
            </button>
          </form>

          <p className='text-center text-gray-600 mb-6'>
            Already have an account? <Link to='/captain-login' className='text-green-600 font-semibold hover:text-green-700'>Sign In</Link>
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

export default CaptainSignup