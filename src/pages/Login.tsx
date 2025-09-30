import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value === '') {
      setEmailError('ایمیل الزامی است');
    } else if (!validateEmail(value)) {
      setEmailError('فرمت ایمیل نامعتبر است');
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (value === '') {
      setPasswordError('رمز عبور الزامی است');
    } else if (value.length < 6) {
      setPasswordError('رمز عبور باید حداقل ۶ کاراکتر باشد');
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (emailError || passwordError) {
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('ورود با موفقیت انجام شد');
      navigate('/dashboard');
    } catch (error) {
      toast.error('خطا در ورود: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 page-fade">
      <div className="bg-white shadow-strong rounded-lg p-8 max-w-md w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out transform focus:scale-[1.02] ${emailError ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
            {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">رمز عبور</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out transform focus:scale-[1.02] ${passwordError ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
            {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/signup" className="text-primary hover:underline">
            ثبت نام
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;