import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import TicketFormSkeleton from './TicketFormSkeleton';

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
  const [problemError, setProblemError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

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
    const value = e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
    if (e.target.name === 'problem') {
      if (value === '') {
        setProblemError('توضیح مشکل الزامی است');
      } else if (value.length < 10) {
        setProblemError('توضیح مشکل باید حداقل ۱۰ کاراکتر باشد');
      } else {
        setProblemError('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser || problemError) return;

    setLoading(true);

    try {
      console.log('Creating ticket for user:', currentUser.uid);
      await addDoc(collection(db, 'tickets'), {
        companyId: currentUser.uid,
        name: formData.name,
        organization: formData.organization,
        problem: formData.problem,
        status: 'open',
        createdAt: serverTimestamp()
      });
      console.log('Ticket created successfully:', {
        companyId: currentUser.uid,
        name: formData.name,
        organization: formData.organization,
        problem: formData.problem,
        status: 'open'
      });
      toast.success('تیکت با موفقیت ایجاد شد!');
      setFormData({ ...formData, problem: '' }); // Clear problem field
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('خطا در ایجاد تیکت: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <TicketFormSkeleton inline={inline} />;
  }

  return (
    <div className={inline ? "bg-white p-4 rounded-lg shadow-soft w-full" : "min-h-screen flex items-center justify-center bg-gray-100 p-4"}>
      <div className={inline ? "w-full" : "bg-white p-8 rounded-lg shadow-soft w-full max-w-md"}>
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
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24 resize-none transition-all duration-200 ease-in-out transform focus:scale-[1.02] ${problemError ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
            {problemError && <p className="text-red-500 text-sm mt-1">{problemError}</p>}
          </div>
          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? 'در حال ارسال...' : 'ارسال'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketForm;