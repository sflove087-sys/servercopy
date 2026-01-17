
import React, { useState } from 'react';
import { SearchFilters } from '../types';

interface SearchBoxProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading: boolean;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onSearch, isLoading }) => {
  const [nidQuery, setNidQuery] = useState('');
  const [dob, setDob] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ nidQuery, dob });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-200 p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">NID Identification</label>
          <input
            type="text"
            value={nidQuery}
            onChange={(e) => setNidQuery(e.target.value.replace(/\D/g, ''))}
            placeholder="Last 4 digits or Full NID"
            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none font-mono font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-sans placeholder:font-medium"
            required
          />
          <p className="text-[9px] text-slate-400 font-medium ml-1 italic">* Enter exactly 4 digits for suffix search or the full number.</p>
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Date of Birth</label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none font-mono font-bold text-slate-900"
            required
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-4 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.3em] text-white transition-all transform active:scale-[0.98] ${
          isLoading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 hover:shadow-indigo-300'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Querying Intelligence...
          </span>
        ) : 'Execute Secure Lookup'}
      </button>
    </form>
  );
};

export default SearchBox;
