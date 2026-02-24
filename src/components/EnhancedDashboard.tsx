import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Play, Square, Pause, AlertTriangle, Thermometer, Clock, Activity, SkipForward, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { KilnStatus } from '../types';

interface Props {
  status: KilnStatus;
  onStart: () => void;
  onStop: () => void;
  onSkip: () => void;
  onAutotune: () => void;
}

export default function EnhancedDashboard({ status, onStart, onStop, onSkip, onAutotune }: Props) {
  const { t } = useTranslation();
  const [history, setHistory] = useState<{ time: string; temp: number; setpoint: number }[]>([]);

  useEffect(() => {
    if (status) {
      setHistory(prev => {
        const newHistory = [...prev, {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          temp: status.currentTemp,
          setpoint: status.setpoint
        }];
        if (newHistory.length > 50) newHistory.shift();
        return newHistory;
      });
    }
  }, [status]);

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'idle': return 'text-gray-400';
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
            <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">{t('timeRemaining')}</p>
            <div className="mt-1">
              <span className="text-3xl font-mono font-bold text-white">
                {status.timeRemaining ? `${Math.floor(status.timeRemaining / 60)}h ${status.timeRemaining % 60}m` : '--:--'}
              </span>
            </div>
          </div>
          <div className="p-4 rounded-full bg-zinc-800/50 text-zinc-400">
            <Clock size={32} />
          </div>
        </div>
      </div>

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
                  onClick={onStart}
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
                >
                  <Play size={18} />
                  <span>{t('startFiring')}</span>
                </button>
              </>
            ) : status.state === 'autotune' ? (
              <button 
                onClick={onStop}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
              >
                <Square size={18} />
                <span>{t('abort')}</span>
              </button>
            ) : (
              <>
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
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
