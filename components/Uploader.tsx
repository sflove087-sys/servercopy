
import React, { useRef, useState, useCallback } from 'react';
import { extractNIDData } from '../services/geminiService.ts';
import { NIDRecord } from '../types.ts';

interface UploaderProps {
  onDataExtracted: (records: NIDRecord[]) => void;
  driveFolderId: string;
}

interface FileProgress {
  name: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  error?: string;
  count?: number;
}

const Uploader: React.FC<UploaderProps> = ({ onDataExtracted, driveFolderId }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queue, setQueue] = useState<FileProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processBatch = async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    const initialQueue: FileProgress[] = files.map(f => ({ name: f.name, status: 'pending' }));
    setQueue(initialQueue);

    let allExtractedRecords: NIDRecord[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      setQueue(prev => prev.map((item, idx) => 
        idx === i ? { ...item, status: 'processing' } : item
      ));

      try {
        const base64Data = await fileToBase64(file);
        const records = await extractNIDData(base64Data, file.type, file.name, 'LOCAL');
        
        if (records.length > 0) {
          allExtractedRecords = [...allExtractedRecords, ...records];
          setQueue(prev => prev.map((item, idx) => 
            idx === i ? { ...item, status: 'done', count: records.length } : item
          ));
        } else {
          setQueue(prev => prev.map((item, idx) => 
            idx === i ? { ...item, status: 'failed', error: 'No records found' } : item
          ));
        }
      } catch (err: any) {
        setQueue(prev => prev.map((item, idx) => 
          idx === i ? { ...item, status: 'failed', error: err.message || 'Processing error' } : item
        ));
      }
    }

    if (allExtractedRecords.length > 0) {
      onDataExtracted(allExtractedRecords);
    }
    setIsProcessing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processBatch(files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf' || f.type.startsWith('image/'));
    processBatch(files);
  };

  const handleSyncDrive = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const mockDriveRecords: NIDRecord[] = [
        {
          id: `drive-${Date.now()}`,
          fullNameEn: 'Cloud Sync User',
          fullNameBn: 'ক্লাউড সিঙ্ক ইউজার',
          nidNumber: '1990987654321',
          dateOfBirth: '1990-12-31',
          sourceFile: 'Drive_Batch_Index.pdf',
          sourceType: 'DRIVE'
        }
      ];
      onDataExtracted(mockDriveRecords);
      setIsSyncing(false);
    }, 2000);
  };

  const doneCount = queue.filter(q => q.status === 'done').length;
  const failCount = queue.filter(q => q.status === 'failed').length;
  const totalExtracted = queue.reduce((sum, item) => sum + (item.count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative group bg-white border-2 border-dashed rounded-[2.5rem] p-10 text-center transition-all duration-300 ${
            isDragging ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${
            isDragging ? 'bg-indigo-600 text-white animate-bounce' : 'bg-slate-100 text-slate-400'
          }`}>
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
          </div>
          
          <h3 className="text-xl font-black text-slate-900 mb-2">Multi-PDF Batch Engine</h3>
          <p className="text-sm text-slate-500 font-medium mb-8">
            Drag and drop your PDF files or images here <br/>
            <span className="text-indigo-600 font-bold">একসাথে একাধিক PDF বা ছবি আপলোড করুন</span>
          </p>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*,application/pdf" 
            multiple 
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing || isSyncing}
            className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all disabled:bg-slate-300 shadow-xl shadow-indigo-100 active:scale-95"
          >
            {isProcessing ? 'Processing Batch...' : 'Select Files to Process'}
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-sm">
           <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
              </svg>
           </div>
           <h3 className="text-xl font-black text-slate-900 mb-2">Cloud Infrastructure</h3>
           <p className="text-sm text-slate-500 font-medium mb-8">Connect to server storage <br/> <span className="text-green-600 font-bold tracking-tight">সার্ভার থেকে সরাসরি ইনডেক্স করুন</span></p>
           <button
            onClick={handleSyncDrive}
            disabled={isProcessing || isSyncing}
            className="w-full px-10 py-4 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-green-700 transition-all disabled:bg-slate-300 flex items-center justify-center gap-3 shadow-xl shadow-green-100 active:scale-95"
          >
            {isSyncing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing Drive...
              </>
            ) : 'Start Drive Sync'}
          </button>
        </div>
      </div>

      {queue.length > 0 && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl animate-in slide-in-from-top-4 duration-500">
          <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center">
             <div>
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Batch Processing Pipeline</h4>
                <p className="text-[10px] font-bold text-slate-400">Processing {queue.length} files in parallel sequence</p>
             </div>
             <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-xl font-black text-indigo-400">{doneCount}</div>
                  <div className="text-[8px] font-black uppercase tracking-widest text-slate-500">Success</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-red-400">{failCount}</div>
                  <div className="text-[8px] font-black uppercase tracking-widest text-slate-500">Failed</div>
                </div>
                <div className="text-center ml-4 border-l border-slate-700 pl-6">
                   <div className="text-xl font-black text-green-400">{totalExtracted}</div>
                   <div className="text-[8px] font-black uppercase tracking-widest text-slate-500">Extracted</div>
                </div>
             </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
             {queue.map((item, idx) => (
               <div key={idx} className="px-8 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4 truncate">
                    {item.status === 'processing' && (
                      <svg className="animate-spin h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {item.status === 'done' && (
                       <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                       </svg>
                    )}
                    {item.status === 'failed' && (
                       <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                       </svg>
                    )}
                    {item.status === 'pending' && (
                       <div className="w-5 h-5 rounded-full border-2 border-slate-200"></div>
                    )}
                    <span className="text-sm font-bold text-slate-700 truncate">{item.name}</span>
                  </div>
                  
                  <div className="text-right shrink-0">
                    {item.status === 'done' && <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest">+{item.count} records</span>}
                    {item.status === 'processing' && <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest animate-pulse">Analyzing...</span>}
                    {item.status === 'failed' && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">{item.error}</span>}
                    {item.status === 'pending' && <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Queued</span>}
                  </div>
               </div>
             ))}
          </div>

          {!isProcessing && (
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
               <button 
                onClick={() => setQueue([])}
                className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
               >
                 Clear History
               </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Uploader;
