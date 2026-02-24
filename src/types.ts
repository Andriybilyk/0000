export interface ScheduleStep {
  id: string;
  type: 'ramp' | 'hold' | 'cool';
  targetTemp: number; // °C
  rate?: number; // °C/min (for ramp/cool)
  duration?: number; // minutes (for hold)
  alarm?: boolean;
}

export interface Schedule {
  id: string;
  name: string;
  steps: ScheduleStep[];
  estimatedCost?: number;
}

export interface KilnStatus {
  currentTemp: number;
  setpoint: number;
  state: 'idle' | 'heating' | 'holding' | 'cooling' | 'error' | 'autotune';
  currentScheduleId?: string;
  currentStepIndex?: number;
  timeRemaining?: number;
  error?: string;
}
