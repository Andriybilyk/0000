import { Express, Request, Response } from 'express';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';

// Mock State
let kilnState = {
  currentTemp: 22.5,
  setpoint: 0,
  state: 'idle',
  currentScheduleId: null,
  currentStepIndex: 0,
  timeRemaining: 0,
  error: null
};

// Schedules Storage
const SCHEDULES_FILE = path.join(__dirname, 'schedules.json');

const loadSchedules = () => {
  if (fs.existsSync(SCHEDULES_FILE)) {
    return JSON.parse(fs.readFileSync(SCHEDULES_FILE, 'utf-8'));
  }
  return [];
};

const saveSchedules = (schedules: any) => {
  fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(schedules, null, 2));
};

export const setupEnhancedApi = (app: Express, io: Server) => {
  // --- REST Endpoints ---
  
  // Get Status
  app.get('/api/status', (req: Request, res: Response) => {
    res.json(kilnState);
  });

  // Control Kiln
  app.post('/api/control', (req: Request, res: Response) => {
    const { action, scheduleId } = req.body;
    if (action === 'start') {
      kilnState.state = 'heating';
      kilnState.currentScheduleId = scheduleId;
      kilnState.currentStepIndex = 0;
      io.emit('status', kilnState);
      res.json({ success: true, message: 'Firing started' });
    } else if (action === 'stop') {
      kilnState.state = 'idle';
      kilnState.currentScheduleId = null;
      io.emit('status', kilnState);
      res.json({ success: true, message: 'Firing stopped' });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  });

  // Autotune
  app.post('/api/autotune', (req: Request, res: Response) => {
    kilnState.state = 'autotune';
    io.emit('status', kilnState);
    
    // Simulate autotune completion after 10 seconds
    setTimeout(() => {
      if (kilnState.state === 'autotune') {
        kilnState.state = 'idle';
        io.emit('status', kilnState);
        console.log('Autotune complete. Kp: 2.5, Ki: 5.2, Kd: 1.1');
      }
    }, 10000);

    res.json({ success: true, message: 'Autotune started' });
  });

  // Schedule CRUD
  app.get('/api/schedules', (req: Request, res: Response) => {
    res.json(loadSchedules());
  });

  app.post('/api/schedules', (req: Request, res: Response) => {
    const newSchedule = req.body;
    const schedules = loadSchedules();
    schedules.push(newSchedule);
    saveSchedules(schedules);
    res.json({ success: true, schedule: newSchedule });
  });

  app.put('/api/schedules/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updatedSchedule = req.body;
    let schedules = loadSchedules();
    schedules = schedules.map((s: any) => s.id === id ? updatedSchedule : s);
    saveSchedules(schedules);
    res.json({ success: true });
  });

  app.delete('/api/schedules/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    let schedules = loadSchedules();
    schedules = schedules.filter((s: any) => s.id !== id);
    saveSchedules(schedules);
    res.json({ success: true });
  });

  // --- WebSocket Real-time Updates ---
  io.on('connection', (socket) => {
    console.log('Client connected to WebSocket');
    socket.emit('status', kilnState);
    
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // Simulation loop for demo purposes
  setInterval(() => {
    if (kilnState.state === 'heating') {
      kilnState.currentTemp += 2.5; // Simulate heating
      if (kilnState.currentTemp > 1000) kilnState.state = 'holding';
      io.emit('status', kilnState);
    }
  }, 2000);
};
