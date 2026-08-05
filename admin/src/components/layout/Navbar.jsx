import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { assets } from '../../assets/assets'
import authService from '../../services/authService'

const Navbar = ({ setToken, toggleSidebar }) => {
  const { t, i18n } = useTranslation()
  const [loggingOut, setLoggingOut] = useState(false)

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar'
    i18n.changeLanguage(newLang)
  }

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      setToken('')
      sessionStorage.removeItem('token')
      try { await authService.logout() } catch (_) {}
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className='sticky top-0 z-40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200'>
      <div className='mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8'>
        <div className='flex h-14 items-center justify-between'>
          {/* Left: hamburger + logo */}
          <div className="flex items-center">
            <button
              type="button"
              aria-label="Open navigation menu"
              className="mr-3 inline-flex items-center p-2 text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
              onClick={toggleSidebar}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            <img className='h-8 w-auto' src={assets.logo} alt="Admin logo" />
          </div>

          {/* Right: Language toggle + Logout */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-200"
              title={i18n.language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
            >
              <span className="font-bold">{i18n.language === 'ar' ? '🇬🇧 EN' : '🇸🇦 AR'}</span>
            </button>
            <button
              className='inline-flex items-center gap-2 rounded-full bg-gray-800 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed'
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {loggingOut ? '...' : t('logout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar