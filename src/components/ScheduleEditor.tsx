import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Save, Copy, GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Schedule, ScheduleStep } from '../types';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  schedules: Schedule[];
  onSave: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
}

interface SortableStepProps {
  key?: string | number;
  step: ScheduleStep;
  index: number;
  onUpdate: (index: number, field: keyof ScheduleStep, value: any) => void;
  onRemove: (index: number) => void;
}

function SortableStep({ step, index, onUpdate, onRemove }: SortableStepProps) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 flex items-center gap-4">
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab hover:text-white text-zinc-500">
        <GripVertical size={20} />
      </div>

      {/* Step Type Indicator */}
      <div className="w-24 shrink-0">
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          step.type === 'ramp' ? 'bg-orange-500/20 text-orange-400' :
          step.type === 'hold' ? 'bg-blue-500/20 text-blue-400' :
          'bg-emerald-500/20 text-emerald-400'
        }`}>
          {step.type}
        </span>
      </div>

      {/* Step Inputs */}
      <div className="flex-1 grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">{t('targetTemp')}</label>
          <input 
            type="number" 
            value={step.targetTemp}
            onChange={(e) => onUpdate(index, 'targetTemp', Number(e.target.value))}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        
        {step.type !== 'hold' && (
          <div>
            <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">{t('rate')}</label>
            <input 
              type="number" 
              value={step.rate}
              onChange={(e) => onUpdate(index, 'rate', Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {step.type === 'hold' && (
          <div>
            <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">{t('duration')}</label>
            <input 
              type="number" 
              value={step.duration}
              onChange={(e) => onUpdate(index, 'duration', Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {/* Delete Step */}
      <button 
        onClick={() => onRemove(index)}
        className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

export default function ScheduleEditor({ schedules, onSave, onDelete }: Props) {
  const { t } = useTranslation();
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  
  // Settings for cost estimation
  const [powerKw, setPowerKw] = useState(3.0); // 3kW default
  const [tariff, setTariff] = useState(0.15); // $0.15/kWh default

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleCreateNew = () => {
    setSelectedSchedule({
      id: Date.now().toString(),
      name: t('newSchedule'),
      steps: []
    });
  };

  const handleAddStep = (type: 'ramp' | 'hold' | 'cool') => {
    if (!selectedSchedule) return;
    
    const newStep: ScheduleStep = {
      id: Date.now().toString(),
      type,
      targetTemp: 0,
    };
    
    if (type === 'ramp' || type === 'cool') newStep.rate = 100;
    if (type === 'hold') newStep.duration = 60;

    setSelectedSchedule({
      ...selectedSchedule,
      steps: [...selectedSchedule.steps, newStep]
    });
  };

  const handleUpdateStep = (index: number, field: keyof ScheduleStep, value: any) => {
    if (!selectedSchedule) return;
    const newSteps = [...selectedSchedule.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSelectedSchedule({ ...selectedSchedule, steps: newSteps });
  };

  const handleRemoveStep = (index: number) => {
    if (!selectedSchedule) return;
    const newSteps = [...selectedSchedule.steps];
    newSteps.splice(index, 1);
    setSelectedSchedule({ ...selectedSchedule, steps: newSteps });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && selectedSchedule) {
      const oldIndex = selectedSchedule.steps.findIndex(s => s.id === active.id);
      const newIndex = selectedSchedule.steps.findIndex(s => s.id === over?.id);
      
      setSelectedSchedule({
        ...selectedSchedule,
        steps: arrayMove(selectedSchedule.steps, oldIndex, newIndex)
      });
    }
  };

  // Calculate estimated cost
  const estimatedCost = useMemo(() => {
    if (!selectedSchedule) return 0;
    let totalHours = 0;
    let currentTemp = 20; // Assume starting at 20C

    selectedSchedule.steps.forEach(step => {
      if (step.type === 'ramp' || step.type === 'cool') {
        if (step.rate && step.rate > 0) {
          const tempDiff = Math.abs(step.targetTemp - currentTemp);
          totalHours += tempDiff / step.rate;
        }
      } else if (step.type === 'hold') {
        if (step.duration) {
          totalHours += step.duration / 60;
        }
      }
      currentTemp = step.targetTemp;
    });

    // Assume 60% duty cycle on average for heating/holding
    const energyKwh = totalHours * powerKw * 0.6;
    return energyKwh * tariff;
  }, [selectedSchedule, powerKw, tariff]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
      {/* Sidebar: Schedule List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">{t('library')}</h2>
          <button 
            onClick={handleCreateNew}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2">
          {schedules.map(schedule => (
            <div 
              key={schedule.id}
              onClick={() => setSelectedSchedule(schedule)}
              className={`p-4 rounded-xl cursor-pointer transition-colors border ${
                selectedSchedule?.id === schedule.id 
                  ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400' 
                  : 'bg-zinc-800/50 border-transparent hover:bg-zinc-800 text-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{schedule.name}</h3>
                <span className="text-xs opacity-60">{schedule.steps.length} {t('step').toLowerCase()}s</span>
              </div>
            </div>
          ))}
          {schedules.length === 0 && (
            <div className="text-center p-8 text-zinc-500 text-sm">
              {t('noSchedules')}
            </div>
          )}
        </div>
      </div>

      {/* Main Area: Editor */}
      <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col h-full overflow-hidden">
        {selectedSchedule ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <input 
                type="text"
                value={selectedSchedule.name}
                onChange={(e) => setSelectedSchedule({ ...selectedSchedule, name: e.target.value })}
                className="bg-transparent text-2xl font-bold text-white border-b border-transparent hover:border-zinc-700 focus:border-emerald-500 focus:outline-none pb-1 w-1/2"
                placeholder={t('scheduleName')}
              />
              <div className="flex space-x-2">
                <button 
                  onClick={() => onSave(selectedSchedule)}
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                >
                  <Save size={16} />
                  <span>{t('save')}</span>
                </button>
                <button 
                  onClick={() => onDelete(selectedSchedule.id)}
                  className="flex items-center space-x-2 bg-red-600/20 hover:bg-red-600/30 text-red-500 px-4 py-2 rounded-xl font-medium transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Cost Estimation Panel */}
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4 mb-4 flex items-center justify-between">
              <div className="flex space-x-4">
                <div>
                  <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">{t('power')}</label>
                  <input type="number" value={powerKw} onChange={e => setPowerKw(Number(e.target.value))} className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-sm text-white w-24" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">{t('tariff')}</label>
                  <input type="number" value={tariff} step="0.01" onChange={e => setTariff(Number(e.target.value))} className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-sm text-white w-24" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">{t('estimatedCost')}</p>
                <p className="text-xl font-bold text-emerald-400">${estimatedCost.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={selectedSchedule.steps.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {selectedSchedule.steps.map((step, index) => (
                    <SortableStep 
                      key={step.id} 
                      step={step} 
                      index={index} 
                      onUpdate={handleUpdateStep} 
                      onRemove={handleRemoveStep} 
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {/* Add Step Buttons */}
              <div className="flex gap-3 pt-4">
                <button onClick={() => handleAddStep('ramp')} className="flex-1 py-3 border border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-800/50 transition-colors flex items-center justify-center space-x-2">
                  <Plus size={16} /> <span>{t('addRamp')}</span>
                </button>
                <button onClick={() => handleAddStep('hold')} className="flex-1 py-3 border border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-800/50 transition-colors flex items-center justify-center space-x-2">
                  <Plus size={16} /> <span>{t('addHold')}</span>
                </button>
                <button onClick={() => handleAddStep('cool')} className="flex-1 py-3 border border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-800/50 transition-colors flex items-center justify-center space-x-2">
                  <Plus size={16} /> <span>{t('addCool')}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
              <Copy size={24} />
            </div>
            <p className="text-lg">{t('selectSchedule')}</p>
            <p className="text-sm mt-1">{t('orCreateNew')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
