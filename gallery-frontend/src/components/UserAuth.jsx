import React, { useState } from 'react';
import { User, Mail, Lock, ImageIcon } from 'lucide-react';
// REMOVED: import { supabase } from '../supabaseClient';

function AuthPage({ onLogin, theme }) { // CHANGED: onLogin will now handle the token
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!isLogin) {
      if (!formData.username) newErrors.username = 'Username is required';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      const endpoint = isLogin ? '/api/users/login' : '/api/users/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password, username: formData.username };

      // --- CHANGED: Switched to fetch from backend API ---
const baseURL = import.meta.env.VITE_API_BASE_URL;
const response = await fetch(`${baseURL}${endpoint}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An error occurred.');
      }
      
      // onLogin is passed from App.jsx to handle the successful auth
      onLogin(data); 

    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  // ... rest of the component remains the same (JSX)
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 transition-all duration-500"
      style={{ backgroundColor: theme.background }}>
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full"
              style={{ backgroundColor: theme.primary + '20' }}>
              <ImageIcon className="w-12 h-12" style={{ color: theme.primary }} />
            </div>
          </div>
          <h2 className="text-3xl font-bold" style={{ color: theme.text }}>
            Welcome to ImageGallery
          </h2>
          <p className="mt-2 text-sm" style={{ color: theme.secondary }}>
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {/* Auth Form */}
        <div className="rounded-2xl shadow-xl p-8 border transition-all duration-300"
          style={{
            backgroundColor: theme.background,
            borderColor: theme.secondary + '30'
          }}>

          {errors.general && (
            <div className="mb-4 p-3 rounded-lg text-sm border"
              style={{
                backgroundColor: '#FEE2E2',
                borderColor: '#FCA5A5',
                color: '#B91C1C'
              }}>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5" style={{ color: theme.secondary }} />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200`}
                    style={{
                      borderColor: errors.username ? '#F87171' : theme.secondary + '60',
                      backgroundColor: theme.background,
                      color: theme.text,
                      '--tw-ring-color': theme.primary
                    }}
                    placeholder="Enter your username"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm" style={{ color: '#EF4444' }}>{errors.username}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5" style={{ color: theme.secondary }} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200`}
                  style={{
                    borderColor: errors.email ? '#F87171' : theme.secondary + '60',
                    backgroundColor: theme.background,
                    color: theme.text,
                    '--tw-ring-color': theme.primary
                  }}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm" style={{ color: '#EF4444' }}>{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5" style={{ color: theme.secondary }} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200`}
                  style={{
                    borderColor: errors.password ? '#F87171' : theme.secondary + '60',
                    backgroundColor: theme.background,
                    color: theme.text,
                    '--tw-ring-color': theme.primary
                  }}
                  placeholder="Enter your password"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm" style={{ color: '#EF4444' }}>{errors.password}</p>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5" style={{ color: theme.secondary }} />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200`}
                    style={{
                      borderColor: errors.confirmPassword ? '#F87171' : theme.secondary + '60',
                      backgroundColor: theme.background,
                      color: theme.text,
                      '--tw-ring-color': theme.primary
                    }}
                    placeholder="Confirm your password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm" style={{ color: '#EF4444' }}>{errors.confirmPassword}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:opacity-90"
              style={{
                backgroundColor: theme.primary,
                color: 'white'
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Please wait...</span>
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: theme.secondary }}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 font-medium hover:opacity-80 transition-opacity"
                style={{ color: theme.primary }}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;