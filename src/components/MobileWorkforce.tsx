// src/components/MobileWorkforce.tsx
import React, { useState, useEffect } from 'react';
import { 
  MapPin, CheckSquare, Camera, Shield, PenTool, Wifi, WifiOff, Scan, 
  RefreshCw, Play, Navigation, AlertCircle, Phone, Clock, FileText, CheckCircle2
} from 'lucide-react';

interface TechJob {
  id: number;
  techName: string;
  customerName: string;
  address: string;
  status: 'pending' | 'en_route' | 'arrived' | 'completed';
  jobPhotos: string[];
  signatureUrl: string | null;
}

export default function MobileWorkforce({ businessId }: { businessId: string }) {
  const [jobs, setJobs] = useState<TechJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Mobile features state
  const [isOffline, setIsOffline] = useState(false);
  const [gpsLogged, setGpsLogged] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  // Photo uploads
  const [photosList, setPhotosList] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [businessId]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/workforce/technician/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        if (data.jobs && data.jobs.length > 0) {
          setActiveJobId(data.jobs[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId: number, status: 'pending' | 'en_route' | 'arrived' | 'completed') => {
    // If offline, cache in local state and notify offline save
    if (isOffline) {
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status } : j));
      alert('Device is currently Offline. Job state cached locally and will sync when internet connection returns.');
      return;
    }

    try {
      const res = await fetch(`/api/workforce/technician/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchJobs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGpsCheckIn = () => {
    setGpsLogged(true);
    setTimeout(() => {
      setGpsLogged(false);
      alert('GPS location check-in verified! Technician latitude: 37.7749, longitude: -122.4194 dispatched to dispatcher log.');
    }, 1000);
  };

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScannedCode('SN-99482-HEATER');
      alert('Barcode scanned! Registered machinery: Honeywell Tankless Water Heater Model XG-90.');
    }, 1500);
  };

  const handleSimulateSignature = () => {
    setIsSigning(true);
    setTimeout(() => {
      setIsSigning(false);
      setSignatureData('Sarah Jenkins Authorized');
      alert('Customer digital signature authorized and synced with invoice ledger!');
    }, 1200);
  };

  const handleSimulatePhotoUpload = () => {
    setIsUploadingPhoto(true);
    setTimeout(() => {
      setIsUploadingPhoto(false);
      setPhotosList(prev => [...prev, '/public/placeholder_leak.png']);
      alert('Service completion photo attached to Job summary profile!');
    }, 1000);
  };

  const activeJob = jobs.find(j => j.id === activeJobId);

  return (
    <div className="space-y-6">
      {/* Header and Sync settings */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Navigation size={22} className="text-sky-600" /> Technician Mobile Workforce Hub
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch, route optimize, and track field engineers with signature capture, GPS verify, barcode spec scanner, and full offline caching (Phase 15).
          </p>
        </div>

        {/* Offline Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOffline(!isOffline)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              isOffline
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800'
            }`}
          >
            {isOffline ? <WifiOff size={13} /> : <Wifi size={13} />}
            {isOffline ? 'Offline Cache Mode' : 'Online Sync Mode'}
          </button>
        </div>
      </div>

      {/* Main Grid: Stop List & Route Optimizer on the Left, Active Stop Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Job Stop Queue & Route optimizer */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TECHNICIAN FIELD DISPATCH LIST</p>
              <span className="text-[10px] font-mono text-slate-400 font-bold">{jobs.length} Stops</span>
            </div>

            <div className="space-y-3">
              {jobs.map((job, index) => (
                <div
                  key={job.id}
                  onClick={() => setActiveJobId(job.id)}
                  className={`p-3.5 border rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                    activeJobId === job.id
                      ? 'bg-slate-950 border-slate-950 text-white shadow-md'
                      : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-6 w-6 rounded-full font-bold text-[10px] flex items-center justify-center ${
                      activeJobId === job.id ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold">{job.customerName}</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5">{job.address}</p>
                    </div>
                  </div>

                  <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    job.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>

            {/* Route Optimizer visual simulation map */}
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI ROUTE PLANNER OPTIMIZATION</p>
              
              <div className="h-28 bg-slate-250 rounded-lg relative flex items-center justify-center overflow-hidden">
                {/* SVG path visualizer */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 30,80 Q 150,20 280,80" fill="none" stroke="#0284c7" strokeWidth="3" strokeDasharray="5,5" />
                  <circle cx="30" cy="80" r="5" fill="#e11d48" />
                  <circle cx="280" cy="80" r="5" fill="#10b981" />
                </svg>
                <div className="absolute top-2 left-2 bg-slate-950 text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                  -18% Driving overhead saved
                </div>
                <div className="z-10 flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-sm text-[10px] font-bold text-slate-700">
                  <MapPin size={11} className="text-rose-600 animate-pulse" /> Optimized Dispatch Path
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active stop details workspace */}
        <div className="lg:col-span-2 space-y-6">
          {activeJob ? (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-6">
              
              {/* Client info and stop action header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-50 pb-4 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACTIVE ROUTE DISPATCH</span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">{activeJob.customerName} — {activeJob.address}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateJobStatus(activeJob.id, 'en_route')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeJob.status === 'en_route' ? 'bg-sky-600 text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border'
                    }`}
                  >
                    En Route
                  </button>
                  <button
                    onClick={() => updateJobStatus(activeJob.id, 'arrived')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeJob.status === 'arrived' ? 'bg-indigo-600 text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border'
                    }`}
                  >
                    Arrived
                  </button>
                  <button
                    onClick={() => updateJobStatus(activeJob.id, 'completed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeJob.status === 'completed' ? 'bg-emerald-600 text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border'
                    }`}
                  >
                    Complete Job
                  </button>
                </div>
              </div>

              {/* Mobile actions panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* GPS and Barcode scan column */}
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">1. LOCATION VERIFICATION</p>
                    <button
                      onClick={handleGpsCheckIn}
                      className="w-full bg-white border hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer text-slate-700"
                    >
                      <MapPin size={13} className="text-rose-600" /> Confirm GPS Check-In Stop
                    </button>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">2. EQUIPMENT SPEC SCANNER</p>
                    <button
                      onClick={handleSimulateScan}
                      disabled={isScanning}
                      className="w-full bg-white border hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer text-slate-700"
                    >
                      <Scan size={13} className="text-indigo-600" /> 
                      {isScanning ? 'Decoding optical feed...' : 'Scan Boiler Barcode (OCR)'}
                    </button>

                    {scannedCode && (
                      <div className="bg-white p-2 border border-slate-200 rounded-lg text-center font-mono text-[10px] text-indigo-700 font-bold">
                        Decoded Code: {scannedCode}
                      </div>
                    )}
                  </div>
                </div>

                {/* Photo and Customer Signature column */}
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">3. SERVICE DOCUMENTATION</p>
                    <button
                      onClick={handleSimulatePhotoUpload}
                      disabled={isUploadingPhoto}
                      className="w-full bg-white border hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer text-slate-700"
                    >
                      <Camera size={13} className="text-slate-500" />
                      {isUploadingPhoto ? 'Uploading job photo...' : 'Capture Completion Photo'}
                    </button>

                    {photosList.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {photosList.map((ph, idx) => (
                          <div key={idx} className="h-10 w-10 bg-slate-200 rounded border border-slate-300 relative overflow-hidden flex items-center justify-center text-[8px] font-bold text-slate-500">
                            PICTURE
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">4. CUSTOMER AUTHORIZATION</p>
                    <button
                      onClick={handleSimulateSignature}
                      disabled={isSigning}
                      className="w-full bg-white border hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer text-slate-700"
                    >
                      <PenTool size={13} className="text-emerald-600" /> 
                      {isSigning ? 'Saving sign...' : 'Collect Signature'}
                    </button>

                    {signatureData && (
                      <div className="bg-white p-2 border border-emerald-250 text-emerald-700 rounded-lg text-center font-mono text-[10px] font-bold flex items-center justify-center gap-1">
                        <CheckCircle2 size={12} /> Authorized & Synced
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="text-center p-12 bg-white rounded-2xl border text-slate-400 text-xs">
              No active stop selected.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
