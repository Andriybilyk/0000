import React from 'react';
import { CheckCircle, Info, Wrench, Cpu, Zap, DollarSign } from 'lucide-react';

export default function Documentation() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-900/40 to-zinc-900 border border-emerald-900/50 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Kiln Controller Enhancement Plan</h1>
        <p className="text-zinc-400 text-lg">
          Refactoring the open-source kiln controller to emulate the commercial TAP II controller.
        </p>
      </div>

      {/* Summary of Changes */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Info className="text-emerald-500" size={24} />
          <h2 className="text-2xl font-bold text-white">Summary of Changes</h2>
        </div>
        
        <div className="space-y-6 text-zinc-300">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-zinc-800 rounded-lg mt-1"><Cpu className="text-blue-400" size={20} /></div>
            <div>
              <h3 className="text-lg font-bold text-white">1. Hardware & Firmware (C++)</h3>
              <p className="mt-1 text-zinc-400 leading-relaxed">
                Migrated to ESP32-S3 for better performance and native USB. Integrated <code className="text-emerald-400 bg-emerald-400/10 px-1 py-0.5 rounded">TFT_eSPI</code> and <code className="text-emerald-400 bg-emerald-400/10 px-1 py-0.5 rounded">LVGL</code> for a local 4.3" touchscreen interface mirroring the TAP II design. Enhanced PID control with time-proportional SSR output, added critical safety limits (watchdog, max temp, door switch), and integrated <code className="text-emerald-400 bg-emerald-400/10 px-1 py-0.5 rounded">PID_AutoTune_v0</code> for automatic PID coefficient tuning.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="p-2 bg-zinc-800 rounded-lg mt-1"><Zap className="text-orange-400" size={20} /></div>
            <div>
              <h3 className="text-lg font-bold text-white">2. Backend API (Node.js/Express)</h3>
              <p className="mt-1 text-zinc-400 leading-relaxed">
                Added robust REST endpoints for Schedule CRUD operations and WebSocket integration for real-time dashboard updates (1-2s latency). Schedules are persisted locally as JSON. Added support for skipping steps during an active firing.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="p-2 bg-zinc-800 rounded-lg mt-1"><Wrench className="text-purple-400" size={20} /></div>
            <div>
              <h3 className="text-lg font-bold text-white">3. Frontend UI (React/Vite)</h3>
              <p className="mt-1 text-zinc-400 leading-relaxed">
                Rebuilt the web interface with a dark, professional aesthetic. Added a drag-and-drop Schedule Editor (using <code className="text-emerald-400 bg-emerald-400/10 px-1 py-0.5 rounded">dnd-kit</code>) supporting Ramp, Hold, and Cool steps, along with a real-time firing cost estimator. Implemented a real-time firing monitor using Recharts with "Skip Step" functionality. Added full i18n support (English/Ukrainian).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bill of Materials */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <div className="flex items-center space-x-3 mb-6">
          <DollarSign className="text-emerald-500" size={24} />
          <h2 className="text-2xl font-bold text-white">Bill of Materials (BOM) &lt; $50</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-sm uppercase tracking-wider">
                <th className="pb-3 pr-4 font-medium">Component</th>
                <th className="pb-3 pr-4 font-medium">Description</th>
                <th className="pb-3 pr-4 font-medium">Source</th>
                <th className="pb-3 font-medium text-right">Est. Cost</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300 divide-y divide-zinc-800/50">
              <tr>
                <td className="py-4 pr-4 font-medium text-white">ESP32-S3 Dev Board</td>
                <td className="py-4 pr-4 text-zinc-400">Core MCU with WiFi/BLE</td>
                <td className="py-4 pr-4 text-zinc-400">AliExpress</td>
                <td className="py-4 text-right text-emerald-400 font-mono">$6.00</td>
              </tr>
              <tr>
                <td className="py-4 pr-4 font-medium text-white">4.3" TFT Touchscreen</td>
                <td className="py-4 pr-4 text-zinc-400">ILI9488 + XPT2046 (e.g., ESP32-2432S028)</td>
                <td className="py-4 pr-4 text-zinc-400">AliExpress</td>
                <td className="py-4 text-right text-emerald-400 font-mono">$14.00</td>
              </tr>
              <tr>
                <td className="py-4 pr-4 font-medium text-white">MAX31855 Module</td>
                <td className="py-4 pr-4 text-zinc-400">K-Type Thermocouple Amplifier</td>
                <td className="py-4 pr-4 text-zinc-400">Amazon/AliExpress</td>
                <td className="py-4 text-right text-emerald-400 font-mono">$5.00</td>
              </tr>
              <tr>
                <td className="py-4 pr-4 font-medium text-white">K-Type Thermocouple</td>
                <td className="py-4 pr-4 text-zinc-400">High temp probe (up to 1300°C)</td>
                <td className="py-4 pr-4 text-zinc-400">Amazon</td>
                <td className="py-4 text-right text-emerald-400 font-mono">$8.00</td>
              </tr>
              <tr>
                <td className="py-4 pr-4 font-medium text-white">40A SSR (Solid State Relay)</td>
                <td className="py-4 pr-4 text-zinc-400">Fotek SSR-40 DA or similar</td>
                <td className="py-4 pr-4 text-zinc-400">Amazon</td>
                <td className="py-4 text-right text-emerald-400 font-mono">$8.00</td>
              </tr>
              <tr>
                <td className="py-4 pr-4 font-medium text-white">5V Power Supply</td>
                <td className="py-4 pr-4 text-zinc-400">MeanWell RS-15-5 or USB adapter</td>
                <td className="py-4 pr-4 text-zinc-400">Amazon</td>
                <td className="py-4 text-right text-emerald-400 font-mono">$6.00</td>
              </tr>
              <tr className="bg-zinc-800/20 font-bold">
                <td colSpan={3} className="py-4 pr-4 text-right text-white uppercase tracking-wider text-sm">Total Estimated Cost</td>
                <td className="py-4 text-right text-emerald-400 font-mono text-lg">$47.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Testing Instructions */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <div className="flex items-center space-x-3 mb-6">
          <CheckCircle className="text-emerald-500" size={24} />
          <h2 className="text-2xl font-bold text-white">Testing & Deployment</h2>
        </div>
        
        <ol className="list-decimal list-inside space-y-4 text-zinc-300">
          <li className="pl-2">
            <strong className="text-white">Hardware Assembly:</strong> Connect the MAX31855 to ESP32 SPI pins (CLK=14, CS=13, DO=12). Connect SSR control to GPIO 15. Ensure high-voltage AC wiring is isolated and fused.
          </li>
          <li className="pl-2">
            <strong className="text-white">Firmware Flash:</strong> Use PlatformIO to build <code className="text-emerald-400 bg-emerald-400/10 px-1 py-0.5 rounded">enhanced_main.cpp</code>. Upload to ESP32-S3 via USB. Monitor serial output at 115200 baud.
          </li>
          <li className="pl-2">
            <strong className="text-white">Backend Setup:</strong> Run <code className="text-emerald-400 bg-emerald-400/10 px-1 py-0.5 rounded">npm install</code> and <code className="text-emerald-400 bg-emerald-400/10 px-1 py-0.5 rounded">npm run dev</code> in the backend directory to start the Express/WebSocket server.
          </li>
          <li className="pl-2">
            <strong className="text-white">Frontend Setup:</strong> Run the React app. Navigate to the Dashboard to view real-time simulated data. Use the Schedule Editor to create a test firing profile.
          </li>
          <li className="pl-2">
            <strong className="text-white">Dry Run:</strong> Start a firing schedule without AC power connected to the SSR. Verify the SSR indicator LED pulses according to the PID output.
          </li>
        </ol>
      </section>
    </div>
  );
}
