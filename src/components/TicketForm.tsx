import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface TicketFormProps {
  inline?: boolean;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  organization: string;
  problem: string;
}

const TicketForm: React.FC<TicketFormProps> = ({ inline = false, onSuccess }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    organization: '',
    problem: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        organization: currentUser.organization || '',
        problem: ''
      });
    }
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setMessage('');

    try {
      await addDoc(collection(db, 'tickets'), {
        companyId: currentUser.uid,
        name: formData.name,
        organization: formData.organization,
        problem: formData.problem,
        status: 'open',
        createdAt: serverTimestamp()
      });
      setMessage('تیکت با موفقیت ایجاد شد!');
      setFormData({ ...formData, problem: '' }); // Clear problem field
      if (onSuccess) onSuccess();
    } catch (error) {
      setMessage('خطا در ایجاد تیکت: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={inline ? "bg-white p-4 rounded-lg shadow-md w-full" : "min-h-screen flex items-center justify-center bg-gray-100 p-4"}>
      <div className={inline ? "w-full" : "bg-white p-8 rounded-lg shadow-md w-full max-w-md"}>
        <h2 className="text-2xl font-bold text-center mb-6">ایجاد تیکت</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="problem">
              مشکل
            </label>
            <textarea
              id="problem"
              name="problem"
              value={formData.problem}
              onChange={handleChange}
              className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24 resize-none"
              required
            />
          </div>
          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              {loading ? 'در حال ارسال...' : 'ارسال'}
            </button>
          </div>
        </form>
        {message && (
          <p className={`mt-4 text-center ${message.includes('خطا') ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default TicketForm;