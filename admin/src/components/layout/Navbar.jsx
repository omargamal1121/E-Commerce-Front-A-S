import React, { useState } from 'react'
import { assets } from '../../assets/assets'

const Navbar = ({ setToken, toggleSidebar }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className='sticky top-0 z-40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200'>
      <div className='mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8'>
        <div className='flex h-14 items-center justify-between'>
          <div className="flex items-center">
            <button
              type="button"
              className="mr-3 inline-flex items-center p-2 text-gray-500 rounded-lg md:hidden hover:bg-gray-100"
              onClick={toggleSidebar}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            <img className='h-8 w-auto' src={assets.logo} alt="logo" />
          </div>
          <div className={`md:flex items-center hidden ${isOpen ? '' : 'hidden'}`}>
            <button
              className='inline-flex items-center rounded-full bg-gray-800 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800'
              onClick={() => {
                setToken("");
                localStorage.removeItem("token");
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar