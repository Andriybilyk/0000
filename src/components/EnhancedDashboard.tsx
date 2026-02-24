import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Play, Square, Pause, AlertTriangle, Thermometer, Clock, Activity, SkipForward, Settings2, Timer, Plus, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { KilnStatus } from '../types';

interface Props {
  status: KilnStatus;
  onStart: () => void;
  onDelayStart: (seconds: number) => void;
  onStop: () => void;
  onSkip: () => void;
  onAutotune: () => void;
  onAddTime: () => void;
  onAddTemp: () => void;
}

export default function EnhancedDashboard({ status, onStart, onDelayStart, onStop, onSkip, onAutotune, onAddTime, onAddTemp }: Props) {
  const { t } = useTranslation();
  const [history, setHistory] = useState<{ time: string; temp: number; setpoint: number }[]>([]);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayH, setDelayH] = useState(1);
  const [delayM, setDelayM] = useState(0);

  useEffect(() => {
    if (status) {
      setHistory(prev => {
        const newPoint: any = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          temp: status.currentTemp,
          setpoint: status.setpoint
        };
        
        if (status.zones && status.zones.length >= 3) {
          newPoint.zone2 = status.zones[1].temp;
          newPoint.zone3 = status.zones[2].temp;
        }

        const newHistory = [...prev, newPoint];
        if (newHistory.length > 50) newHistory.shift();
        return newHistory;
      });
    }
  }, [status]);

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'idle': return 'text-gray-400';
      case 'delayed': return 'text-yellow-500';
      case 'heating': return 'text-red-500';
      case 'holding': return 'text-orange-500';
      case 'cooling': return 'text-blue-500';
      case 'error': return 'text-red-600';
      case 'autotune': return 'text-purple-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">{t('currentTemp')}</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-4xl font-mono font-bold text-white">{status.currentTemp.toFixed(1)}</span>
              <span className="text-zinc-500 font-mono">°C</span>
            </div>
          </div>
          <div className={`p-4 rounded-full bg-zinc-800/50 ${getStatusColor(status.state)}`}>
            <Thermometer size={32} />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">{t('status')}</p>
            <div className="mt-1">
              <span className={`text-2xl font-bold uppercase tracking-wide ${getStatusColor(status.state)}`}>
                {t(status.state)}
              </span>
            </div>
            {status.state !== 'idle' && status.state !== 'error' && (
              <p className="text-zinc-500 text-sm mt-1">{t('step')} {status.currentStepIndex !== undefined ? status.currentStepIndex + 1 : '-'}</p>
            )}
          </div>
          <div className={`p-4 rounded-full bg-zinc-800/50 ${getStatusColor(status.state)}`}>
            <Activity size={32} />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">{status.state === 'delayed' ? t('delayStart') : t('timeRemaining')}</p>
            <div className="mt-1">
              <span className="text-3xl font-mono font-bold text-white">
                {status.state === 'delayed' 
                  ? (status.delayRemaining ? `${Math.floor(status.delayRemaining / 3600)}h ${Math.floor((status.delayRemaining % 3600) / 60)}m` : '--:--')
                  : (status.timeRemaining ? `${Math.floor(status.timeRemaining / 60)}h ${status.timeRemaining % 60}m` : '--:--')
                }
              </span>
            </div>
          </div>
          <div className="p-4 rounded-full bg-zinc-800/50 text-zinc-400">
            <Clock size={32} />
          </div>
        </div>
      </div>

      {/* Safety Alert */}
      {status.safetyAlert && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start space-x-3 mb-6">
          <ShieldAlert className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-500 font-bold">{t('systemError')}</h3>
            <p className="text-red-400 text-sm mt-1">{t(status.safetyAlert)}</p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {status.state === 'error' && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start space-x-3">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-500 font-bold">{t('systemError')}</h3>
            <p className="text-red-400 text-sm mt-1">{status.error || 'Unknown error occurred. Heating aborted.'}</p>
          </div>
        </div>
      )}

      {/* Main Chart Area */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{t('firingProfile')}</h2>
          
          {/* Controls */}
          <div className="flex space-x-3">
            {status.state === 'idle' ? (
              <>
                <button 
                  onClick={onAutotune}
                  className="flex items-center space-x-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 px-6 py-2.5 rounded-xl font-medium transition-colors border border-purple-500/30"
                >
                  <Settings2 size={18} />
                  <span>{t('autotune')}</span>
                </button>
                <button 
                  onClick={() => setShowDelayModal(true)}
                  className="flex items-center space-x-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-500 px-6 py-2.5 rounded-xl font-medium transition-colors border border-yellow-500/30"
                >
                  <Timer size={18} />
                  <span>{t('delayStart')}</span>
                </button>
                <button 
                  onClick={onStart}
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
                >
                  <Play size={18} />
                  <span>{t('startFiring')}</span>
                </button>
              </>
            ) : status.state === 'autotune' || status.state === 'delayed' ? (
              <button 
                onClick={onStop}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
              >
                <Square size={18} />
                <span>{t('abort')}</span>
              </button>
            ) : (
              <>
                {status.state === 'holding' && (
                  <>
                    <button 
                      onClick={onAddTime}
                      className="flex items-center space-x-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-4 py-2.5 rounded-xl font-medium transition-colors border border-blue-500/30"
                    >
                      <Plus size={18} />
                      <span>{t('addTime')}</span>
                    </button>
                    <button 
                      onClick={onAddTemp}
                      className="flex items-center space-x-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 px-4 py-2.5 rounded-xl font-medium transition-colors border border-orange-500/30"
                    >
                      <Plus size={18} />
                      <span>{t('addTemp')}</span>
                    </button>
                  </>
                )}
                <button 
                  className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
                >
                  <Pause size={18} />
                  <span>{t('pause')}</span>
                </button>
                <button 
                  onClick={onSkip}
                  className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
                >
                  <SkipForward size={18} />
                  <span>{t('skipStep')}</span>
                </button>
                <button 
                  onClick={onStop}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
                >
                  <Square size={18} />
                  <span>{t('abort')}</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#71717a" 
                tick={{ fill: '#71717a', fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis 
                stroke="#71717a" 
                tick={{ fill: '#71717a', fontSize: 12 }}
                tickMargin={10}
                domain={[0, 1300]}
                unit="°"
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                itemStyle={{ color: '#e4e4e7' }}
              />
              <ReferenceLine y={status.setpoint} stroke="#f97316" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Setpoint', fill: '#f97316', fontSize: 12 }} />
              <Line 
                type="monotone" 
                dataKey="temp" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#10b981', stroke: '#18181b', strokeWidth: 2 }}
                isAnimationActive={false}
                name={t('currentTemp')}
              />
              <Line 
                type="stepAfter" 
                dataKey="setpoint" 
                stroke="#a1a1aa" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={false}
                name="Plan (Setpoint)"
              />
              {status.zones ? (
                <>
                  <Line type="monotone" dataKey="temp" stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive={false} name={`${t('zone')} 1`} />
                  <Line type="monotone" dataKey="zone2" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} name={`${t('zone')} 2`} />
                  <Line type="monotone" dataKey="zone3" stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} name={`${t('zone')} 3`} />
                </>
              ) : (
                <Line 
                  type="monotone" 
                  dataKey="temp" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#18181b', strokeWidth: 2 }}
                  isAnimationActive={false}
                  name={t('currentTemp')}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Delay Modal */}
      {showDelayModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">{t('delayStart')}</h3>
            <div className="flex space-x-4 mb-6">
              <div className="flex-1">
                <label className="block text-zinc-400 text-sm mb-1">{t('delayHours')}</label>
                <input 
                  type="number" 
                  min="0" 
                  max="24" 
                  value={delayH} 
                  onChange={e => setDelayH(Number(e.target.value))} 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white font-mono" 
                />
              </div>
              <div className="flex-1">
                <label className="block text-zinc-400 text-sm mb-1">{t('delayMinutes')}</label>
                <input 
                  type="number" 
                  min="0" 
                  max="59" 
                  value={delayM} 
                  onChange={e => setDelayM(Number(e.target.value))} 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white font-mono" 
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowDelayModal(false)} 
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-xl transition-colors font-medium"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={() => { 
                  onDelayStart(delayH * 3600 + delayM * 60); 
                  setShowDelayModal(false); 
                }} 
                className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded-xl transition-colors font-medium"
              >
                {t('confirmDelay')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
