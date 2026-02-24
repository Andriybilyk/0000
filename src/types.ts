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

export interface ZoneStatus {
  temp: number;
  setpoint: number;
  output: number; // 0-100%
}

export interface KilnStatus {
  currentTemp: number; // Average or primary
  setpoint: number;
  state: 'idle' | 'delayed' | 'heating' | 'holding' | 'cooling' | 'error' | 'autotune';
  currentScheduleId?: string;
  currentStepIndex?: number;
  timeRemaining?: number;
  delayRemaining?: number;
  error?: string;
  relayCycles?: number;
  tcOffset?: number;
  zones?: ZoneStatus[];
  safetyAlert?: string;
  elementHealth?: number; // 0-100%
}
