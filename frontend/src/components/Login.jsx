import React, { useState } from 'react';
import { createClient, API_BASE } from '../hooks/useApi';
import { toast } from 'react-toastify';

const Login = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: 'admin', password: 'admin123' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const client = createClient();
      const response = await client.post('/auth.php', form);
      toast.success('ورود موفقیت‌آمیز بود.');
      onSuccess(response.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8 text-right">
      <h1 className="text-2xl font-bold text-mining-accent mb-2">خوش آمدید</h1>
      <p className="text-sm text-slate-500 mb-6">برای ورود به سامانه تعمیرات معدن، اطلاعات کاربری را وارد کنید.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">نام کاربری</label>
          <input
            type="text"
            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-mining-accent"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            dir="ltr"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">رمز عبور</label>
          <input
            type="password"
            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-mining-accent"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            dir="ltr"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-mining-accent text-white py-2 rounded-md hover:bg-amber-500 disabled:opacity-60"
        >
          {loading ? 'در حال ورود...' : 'ورود'}
        </button>
      </form>
      <p className="text-xs text-slate-400 mt-4">آدرس API: {API_BASE}</p>
    </div>
  );
};

export default Login;
