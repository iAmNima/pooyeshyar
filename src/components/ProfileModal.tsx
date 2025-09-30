import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; organization?: string }>({});

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setOrganization(currentUser.organization || '');
    }
  }, [currentUser]);

  const validateForm = () => {
    const newErrors: { name?: string; organization?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'نام الزامی است';
    } else if (name.trim().length < 2) {
      newErrors.name = 'نام باید حداقل ۲ کاراکتر باشد';
    }

    if (!organization.trim()) {
      newErrors.organization = 'سازمان الزامی است';
    } else if (organization.trim().length < 2) {
      newErrors.organization = 'سازمان باید حداقل ۲ کاراکتر باشد';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await updateProfile(name.trim(), organization.trim());
      toast.success('پروفایل با موفقیت بروزرسانی شد');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('خطا در بروزرسانی پروفایل');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('با موفقیت خارج شدید');
      onClose();
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('خطا در خروج');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">پروفایل</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                  errors.name
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:border-primary dark:bg-gray-700 dark:text-white'
                }`}
                placeholder="نام خود را وارد کنید"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                سازمان
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                  errors.organization
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:border-primary dark:bg-gray-700 dark:text-white'
                }`}
                placeholder="نام سازمان را وارد کنید"
              />
              {errors.organization && (
                <p className="text-red-500 text-sm mt-1">{errors.organization}</p>
              )}
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                حالت تاریک
              </span>
              <button
                type="button"
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isDarkMode ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? '-translate-x-6' : '-translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
              >
                لغو
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
            >
              خروج از حساب
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;