import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings2, Activity, Thermometer, Upload, Download, ShieldAlert, Zap } from 'lucide-react';

interface Props {
  tcOffset: number;
  relayCycles: number;
  elementHealth?: number;
  onUpdateOffset: (offset: number) => void;
}

export default function Settings({ tcOffset, relayCycles, elementHealth = 100, onUpdateOffset }: Props) {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(tcOffset.toString());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const val = parseFloat(offset);
    if (!isNaN(val)) {
      onUpdateOffset(val);
    }
  };

  const handleDownloadLog = () => {
    // Simulate downloading a CSV log
    const csvContent = "data:text/csv;charset=utf-8,Time,Setpoint,Zone1,Zone2,Zone3\n0,20,20,20,20\n60,100,98,102,99\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "kiln_log.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      alert(`Simulating OTA update with ${e.target.files[0].name}...`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-6 border-b border-zinc-800 pb-4">
          <Settings2 className="text-purple-400" size={24} />
          <h2 className="text-xl font-bold text-white">{t('maintenance')}</h2>
        </div>

        <div className="space-y-8">
          {/* Thermocouple Offset */}
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-zinc-800 rounded-xl">
              <Thermometer className="text-orange-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-white">{t('tcOffset')}</h3>
              <p className="text-zinc-400 text-sm mt-1 mb-3">
                Calibrate the thermocouple reading by adding or subtracting an offset value.
              </p>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  step="0.1"
                  value={offset}
                  onChange={(e) => setOffset(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 text-white px-4 py-2 rounded-xl focus:outline-none focus:border-purple-500 w-32 font-mono"
                />
                <button
                  onClick={handleSave}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl transition-colors font-medium"
                >
                  {t('save')}
                </button>
              </div>
            </div>
          </div>

          {/* Relay Cycles */}
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-zinc-800 rounded-xl">
              <Activity className="text-blue-400" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">{t('relayCycles')}</h3>
              <p className="text-zinc-400 text-sm mt-1 mb-2">
                Solid State Relays (SSR) have a limited lifespan. Monitor cycle count to predict failure.
              </p>
              <div className="inline-block bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-xl">
                <span className="text-2xl font-mono font-bold text-white">{relayCycles.toLocaleString()}</span>
                <span className="text-zinc-500 ml-2">cycles</span>
              </div>
            </div>
          </div>
          {/* Element Health */}
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-zinc-800 rounded-xl">
              <Zap className={elementHealth < 50 ? "text-red-500" : "text-yellow-400"} size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-white">{t('elementHealth')}</h3>
              <p className="text-zinc-400 text-sm mt-1 mb-3">
                {elementHealth < 50 ? t('elementWearWarning') : 'Elements are operating within normal parameters.'}
              </p>
              <div className="w-full bg-zinc-800 rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-full ${elementHealth < 50 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${elementHealth}%` }}
                ></div>
              </div>
              <div className="text-right text-xs text-zinc-500 mt-1">{elementHealth}%</div>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-6">
            <div className="flex items-center space-x-3 mb-6">
              <ShieldAlert className="text-red-400" size={24} />
              <h2 className="text-xl font-bold text-white">{t('safety')} & {t('dataLogging')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Data Logging */}
              <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl">
                <h3 className="text-lg font-medium text-white mb-2">{t('dataLogging')}</h3>
                <p className="text-zinc-400 text-sm mb-4">Download the latest firing history for analysis.</p>
                <button 
                  onClick={handleDownloadLog}
                  className="flex items-center justify-center space-x-2 w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-xl transition-colors font-medium"
                >
                  <Download size={18} />
                  <span>{t('downloadLog')}</span>
                </button>
              </div>

              {/* OTA Update */}
              <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl">
                <h3 className="text-lg font-medium text-white mb-2">{t('firmwareUpdate')}</h3>
                <p className="text-zinc-400 text-sm mb-4">Upload a compiled .bin file to update the controller.</p>
                <input 
                  type="file" 
                  accept=".bin" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center space-x-2 w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 py-2.5 rounded-xl transition-colors font-medium"
                >
                  <Upload size={18} />
                  <span>{t('uploadBin')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
