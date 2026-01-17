
import React, { useState, useEffect, useCallback } from 'react';
import { NIDRecord, SearchFilters, AppView } from './types.ts';
import SearchBox from './components/SearchBox.tsx';
import Uploader from './components/Uploader.tsx';

const DEFAULT_DRIVE_FOLDER_ID = "1RlLX_K0YAwvrKbhg9L8yWRILn9P-70mE";

const App: React.FC = () => {
  const [records, setRecords] = useState<NIDRecord[]>([]);
  const [searchResults, setSearchResults] = useState<NIDRecord[]>([]);
  const [view, setView] = useState<AppView>(AppView.SEARCH);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [driveFolderId, setDriveFolderId] = useState(DEFAULT_DRIVE_FOLDER_ID);
  const [isSettingDrive, setIsSettingDrive] = useState(false);
  const [tempDriveInput, setTempDriveInput] = useState('');

  useEffect(() => {
    const savedRecords = localStorage.getItem('nid_index_v4');
    if (savedRecords) {
      try {
        const parsed = JSON.parse(savedRecords);
        if (Array.isArray(parsed)) setRecords(parsed);
      } catch (e) {
        console.error("Failed to load records");
      }
    }

    const savedDriveId = localStorage.getItem('nid_drive_id');
    if (savedDriveId) {
      setDriveFolderId(savedDriveId);
    }
  }, []);

  const handleAddRecords = (newRecords: NIDRecord[]) => {
    setRecords(prev => {
      const existingNids = new Set(prev.map(r => r.nidNumber));
      const filtered = newRecords.filter(r => r.nidNumber && !existingNids.has(r.nidNumber));
      const updated = [...prev, ...filtered];
      localStorage.setItem('nid_index_v4', JSON.stringify(updated));
      return updated;
    });
    if (records.length === 0 && newRecords.length > 0) {
      setTimeout(() => setView(AppView.SEARCH), 1000);
    }
  };

  const extractFolderId = (input: string) => {
    const match = input.match(/[-\w]{25,}/);
    return match ? match[0] : input.trim();
  };

  const saveDriveConfig = () => {
    const newId = extractFolderId(tempDriveInput);
    if (newId) {
      setDriveFolderId(newId);
      localStorage.setItem('nid_drive_id', newId);
      setIsSettingDrive(false);
      setTempDriveInput('');
    }
  };

  const handleSearch = useCallback(({ nidQuery, dob }: SearchFilters) => {
    setIsSearching(true);
    setHasSearched(true);
    
    setTimeout(() => {
      const targetQuery = nidQuery.trim();
      const targetDob = dob.trim();

      const filtered = records.filter(r => {
        const cleanNid = String(r.nidNumber).replace(/\D/g, '');
        const recordDob = r.dateOfBirth.trim();
        if (recordDob !== targetDob) return false;
        if (targetQuery.length === 4) return cleanNid.slice(-4) === targetQuery;
        return cleanNid === targetQuery;
      });
      
      setSearchResults(filtered);
      setIsSearching(false);
    }, 400);
  }, [records]);

  const exportToCSV = (data: NIDRecord[], filename: string) => {
    if (data.length === 0) return;

    const headers = [
      "NID Number", "Full Name (EN)", "Full Name (BN)", "Date of Birth", 
      "Father (EN)", "Father (BN)", "Mother (EN)", "Mother (BN)", 
      "Voter Serial", "Address (EN)", "Address (BN)", "Blood Group", "Source File"
    ];

    const csvContent = [
      headers.join(","),
      ...data.map(r => [
        `"${r.nidNumber}"`,
        `"${(r.fullNameEn || '').replace(/"/g, '""')}"`,
        `"${(r.fullNameBn || '').replace(/"/g, '""')}"`,
        `"${r.dateOfBirth}"`,
        `"${(r.fatherNameEn || '').replace(/"/g, '""')}"`,
        `"${(r.fatherNameBn || '').replace(/"/g, '""')}"`,
        `"${(r.motherNameEn || '').replace(/"/g, '""')}"`,
        `"${(r.motherNameBn || '').replace(/"/g, '""')}"`,
        `"${(r.voterSerial || '')}"`,
        `"${(r.addressEn || '').replace(/"/g, '""')}"`,
        `"${(r.addressBn || '').replace(/"/g, '""')}"`,
        `"${(r.bloodGroup || '')}"`,
        `"${(r.sourceFile || '').replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printServerCopy = (rec: NIDRecord) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>NID Server Copy - ${rec.fullNameEn}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;700&display=swap');
            body { font-family: 'Hind Siliguri', 'Inter', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { font-size: 24px; margin: 0; text-transform: uppercase; }
            .header p { font-size: 14px; margin: 5px 0 0; font-weight: bold; }
            .content { display: grid; grid-template-columns: 1fr 200px; gap: 40px; }
            .data-table { width: 100%; border-collapse: collapse; }
            .data-table td { padding: 12px 5px; border-bottom: 1px solid #eee; vertical-align: top; }
            .label { font-weight: bold; width: 150px; font-size: 13px; color: #666; }
            .value-bn { font-size: 18px; font-weight: bold; margin-bottom: 2px; }
            .value-en { font-size: 14px; color: #333; text-transform: uppercase; }
            .photo-box { border: 1px solid #ccc; width: 150px; height: 180px; text-align: center; line-height: 180px; color: #ccc; font-size: 12px; }
            .footer { margin-top: 50px; font-size: 11px; text-align: center; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
            .stamp { position: absolute; right: 40px; bottom: 100px; border: 2px solid #ddd; padding: 10px; opacity: 0.3; transform: rotate(-15deg); font-weight: bold; color: #ddd; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/84/Government_Seal_of_Bangladesh.svg" style="height: 60px; margin-bottom: 10px;">
            <h1>Government of the People's Republic of Bangladesh</h1>
            <p>National ID Service - Server Verification Copy</p>
          </div>
          <div class="content">
            <div>
              <table class="data-table">
                <tr>
                  <td class="label">নাম (বাংলা)<br>Name (English)</td>
                  <td>
                    <div class="value-bn">${rec.fullNameBn}</div>
                    <div class="value-en">${rec.fullNameEn}</div>
                  </td>
                </tr>
                <tr>
                  <td class="label">পিতা<br>Father</td>
                  <td>
                    <div class="value-bn">${rec.fatherNameBn}</div>
                    <div class="value-en">${rec.fatherNameEn}</div>
                  </td>
                </tr>
                <tr>
                  <td class="label">মাতা<br>Mother</td>
                  <td>
                    <div class="value-bn">${rec.motherNameBn}</div>
                    <div class="value-en">${rec.motherNameEn}</div>
                  </td>
                </tr>
                <tr>
                  <td class="label">জাতীয় পরিচয়পত্র নং<br>NID No</td>
                  <td><div class="value-bn" style="font-size: 22px; color: #000;">${rec.nidNumber}</div></td>
                </tr>
                <tr>
                  <td class="label">জন্ম তারিখ<br>Date of Birth</td>
                  <td><div class="value-en" style="font-size: 18px; font-weight: bold;">${rec.dateOfBirth}</div></td>
                </tr>
                <tr>
                  <td class="label">ঠিকানা<br>Address</td>
                  <td>
                    <div class="value-bn" style="font-size: 14px;">${rec.addressBn}</div>
                    <div class="value-en" style="font-size: 12px;">${rec.addressEn}</div>
                  </td>
                </tr>
                ${rec.bloodGroup ? `
                <tr>
                  <td class="label">রক্তের গ্রুপ<br>Blood Group</td>
                  <td><div class="value-en" style="font-size: 18px; font-weight: bold; color: red;">${rec.bloodGroup}</div></td>
                </tr>` : ''}
              </table>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 20px;">
              <div class="photo-box">PHOTO PLACEHOLDER</div>
              <div style="border: 1px dashed #ccc; width: 150px; height: 60px; text-align: center; line-height: 60px; color: #ccc; font-size: 10px;">SIGNATURE</div>
            </div>
          </div>
          <div class="stamp">VERIFIED RECORD</div>
          <div class="footer">
            Generated on: ${new Date().toLocaleString()} | Source: ${rec.sourceFile} | Ref: ${rec.id}
          </div>
          <div style="text-align: center; margin-top: 30px;" class="no-print">
            <button onclick="window.print()" style="padding: 10px 30px; background: #000; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Print Now</button>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const clearIndex = () => {
    if (confirm("Clear database? / ডাটাবেস মুছে ফেলবেন?")) {
      setRecords([]);
      localStorage.removeItem('nid_index_v4');
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-slate-50 font-sans">
      <nav className="glass sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m1 5l4-4m0 0l4 4m-4-4v12"></path>
              </svg>
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">NID <span className="text-indigo-600">Pro</span></span>
          </div>
          <div className="flex bg-slate-200/50 p-1 rounded-2xl">
            <button onClick={() => setView(AppView.SEARCH)} className={`px-5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === AppView.SEARCH ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Search</button>
            <button onClick={() => setView(AppView.INDEXER)} className={`px-5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === AppView.INDEXER ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Indexer</button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 mt-10">
        {view === AppView.SEARCH ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="text-center space-y-2">
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Identity Portal</h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">Secure Server Verification</p>
            </header>

            <SearchBox onSearch={handleSearch} isLoading={isSearching} />

            {hasSearched && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Search Results</h2>
                    <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">{searchResults.length} Match</span>
                  </div>
                  {searchResults.length > 0 && (
                    <button 
                      onClick={() => exportToCSV(searchResults, 'search_results')}
                      className="text-[10px] font-black text-indigo-600 flex items-center gap-1.5 hover:text-indigo-800 transition-colors uppercase tracking-widest"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                      </svg>
                      Export CSV
                    </button>
                  )}
                </div>

                {searchResults.map((result) => (
                  <div key={result.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl relative group transition-all hover:border-indigo-200 overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -z-10 group-hover:bg-indigo-100/50"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between gap-8">
                      <div className="flex-1 space-y-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block mb-1">Full Name / নাম</span>
                            <div className="text-2xl font-black text-slate-900 leading-none">{result.fullNameBn}</div>
                            <div className="text-sm font-bold text-slate-400 uppercase mt-1 tracking-tight">{result.fullNameEn}</div>
                          </div>
                          {result.voterSerial && (
                            <div className="bg-slate-100 px-3 py-1.5 rounded-xl text-center">
                              <span className="text-[8px] font-black text-slate-400 uppercase block tracking-tighter">Voter Serial</span>
                              <span className="text-sm font-black text-indigo-600">{result.voterSerial}</span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Father / পিতা</span>
                            <div className="text-xs font-bold text-slate-800">{result.fatherNameBn || 'N/A'}</div>
                            <div className="text-[10px] text-slate-400 uppercase">{result.fatherNameEn || 'N/A'}</div>
                          </div>
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Mother / মাতা</span>
                            <div className="text-xs font-bold text-slate-800">{result.motherNameBn || 'N/A'}</div>
                            <div className="text-[10px] text-slate-400 uppercase">{result.motherNameEn || 'N/A'}</div>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                           <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">NID Identification</span>
                           <div className="text-2xl font-mono font-black text-slate-900">{result.nidNumber}</div>
                        </div>
                      </div>

                      <div className="flex flex-col justify-between items-end gap-6 shrink-0">
                        <div className="text-right">
                          <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">DOB / জন্ম তারিখ</span>
                          <div className="text-lg font-mono font-black text-slate-800">{result.dateOfBirth}</div>
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                          <button 
                            onClick={() => printServerCopy(result)}
                            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg transition-all active:scale-95"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z"></path>
                            </svg>
                            Print Server Copy
                          </button>
                          <div className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter text-center italic">Includes BN/ENG Layout</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {searchResults.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No match / খুঁজে পাওয়া যায়নি</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Database Management</h1>
                <p className="text-slate-500 text-xs">Processing BN/ENG Identity Files</p>
              </div>
              <div className="bg-white px-5 py-2 rounded-2xl border border-slate-200 text-center shadow-sm">
                <span className="text-[9px] font-black text-slate-400 uppercase block tracking-tighter">Records</span>
                <span className="text-xl font-black text-indigo-600">{records.length}</span>
              </div>
            </header>

            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-xl text-green-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cloud Drive Sync Settings</h3>
                    <p className="text-sm font-black text-slate-800 truncate max-w-[200px] md:max-w-md">ID: <span className="text-green-600 font-mono">{driveFolderId}</span></p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSettingDrive(!isSettingDrive)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 transition-colors"
                >
                  {isSettingDrive ? 'Cancel' : 'Setup Link'}
                </button>
              </div>

              {isSettingDrive && (
                <div className="animate-in slide-in-from-top-2 duration-300 p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Paste Drive Folder URL or ID</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={tempDriveInput}
                        onChange={(e) => setTempDriveInput(e.target.value)}
                        placeholder="https://drive.google.com/drive/folders/..."
                        className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/20 text-xs font-medium"
                      />
                      <button 
                        onClick={saveDriveConfig}
                        className="px-6 py-3 bg-green-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-100 active:scale-95"
                      >
                        Save Configuration
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-400 italic mt-2 ml-1">Example: https://drive.google.com/drive/folders/<b>1RlLX_K...</b></p>
                  </div>
                </div>
              )}
            </div>

            <Uploader onDataExtracted={handleAddRecords} driveFolderId={driveFolderId} />

            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/20">
               <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Records</h3>
                    {records.length > 0 && (
                      <button 
                        onClick={() => exportToCSV(records, 'full_database')}
                        className="text-[10px] font-black text-indigo-600 flex items-center gap-1.5 hover:text-indigo-800 transition-colors uppercase tracking-widest"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        Export CSV
                      </button>
                    )}
                  </div>
                  <button onClick={clearIndex} className="text-[10px] font-black text-red-400 hover:text-red-600 transition-colors uppercase tracking-widest">Wipe All</button>
               </div>
               <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                 {records.length > 0 ? records.map(rec => (
                    <div key={rec.id} className="p-4 flex justify-between items-center hover:bg-slate-50 group">
                       <div className="flex-1 truncate">
                          <div className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors truncate">{rec.fullNameBn}</div>
                          <div className="flex gap-2 items-center">
                            <span className="text-[10px] text-slate-400 font-mono font-bold tracking-tight">{rec.nidNumber}</span>
                            {rec.voterSerial && <span className="text-[8px] font-black bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded uppercase">Ser: {rec.voterSerial}</span>}
                          </div>
                       </div>
                       <div className="text-right shrink-0">
                          <div className="text-[9px] font-black text-slate-300 uppercase truncate max-w-[120px] mb-0.5">{rec.sourceFile}</div>
                          <div className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md inline-block">{rec.dateOfBirth}</div>
                       </div>
                    </div>
                 )).reverse() : <div className="p-16 text-center text-slate-300 text-xs font-black uppercase tracking-widest italic">No records indexed yet</div>}
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
