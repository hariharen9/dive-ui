import React from 'react';
import { X, Palette, SlidersHorizontal, ToggleLeft, ToggleRight, Camera, Play, Pause, Sparkles, Droplets } from 'lucide-react';

// Define the type for the settings object, based on GridScanProps
type GridScanSettingsType = {
  isPaused: boolean;
  linesColor: string;
  scanColor: string;
  lineThickness: number;
  gridScale: number;
  lineJitter: number;
  scanGlow: number;
  scanSoftness: number;
  scanDepth: number;
  particleCount: number;
  colorMode: 'solid' | 'depth' | 'rainbow';
  depthColor: string;
  scanEffect: 'glow' | 'shadow';
  enablePost: boolean;
  chromaticAberration: number;
  noiseIntensity: number;
  enableWebcam: boolean;
  quality: 'high' | 'low';
};

type GridScanSettingsProps = {
  settings: GridScanSettingsType;
  onChange: (newSettings: Partial<GridScanSettingsType>) => void;
  onClose: () => void;
  isOpen: boolean;
};

const GridScanSettings: React.FC<GridScanSettingsProps> = ({ settings, onChange, onClose, isOpen }) => {

  const handleValueChange = (key: keyof GridScanSettingsType, value: any) => {
    onChange({ [key]: value });
  };

  const ControlRow: React.FC<{ label: string; children: React.ReactNode; icon?: React.ReactNode }> = ({ label, children, icon }) => (
    <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
      <div className="flex items-center space-x-3">
        {icon}
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      </div>
      {children}
    </div>
  );

  const Slider = ({ name, min, max, step }: { name: keyof GridScanSettingsType, min: number, max: number, step: number }) => (
    <div className="flex items-center space-x-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={settings[name] as number}
        onChange={(e) => handleValueChange(name, parseFloat(e.target.value))}
        className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
      />
      <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-10 text-right">
        {(settings[name] as number).toFixed(3)}
      </span>
    </div>
  );

  const Toggle = ({ name }: { name: keyof GridScanSettingsType }) => (
    <button
      onClick={() => handleValueChange(name, !settings[name])}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        settings[name] ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
          settings[name] ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const ColorPicker = ({ name }: { name: keyof GridScanSettingsType }) => (
    <input
      type="color"
      value={settings[name] as string}
      onChange={(e) => handleValueChange(name, e.target.value)}
      className="w-10 h-6 p-0 border-none rounded cursor-pointer bg-transparent"
      style={{ WebkitAppearance: 'none' }}
    />
  );


  return (
    <div className={`fixed bottom-24 left-6 z-[9999] bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 transform ${
      isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
    }`}>
      <div className="p-6 w-96">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Customize Grid Animations
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <X size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Controls */}
        <div className="max-h-80 overflow-y-auto pr-2">
            <ControlRow label="Play/Pause" icon={!settings.isPaused ? <Pause size={16} className="text-gray-400"/> : <Play size={16} className="text-gray-400"/>}>
                <Toggle name="isPaused" />
            </ControlRow>
            <ControlRow label="Quality" icon={<SlidersHorizontal size={16} className="text-gray-400"/>}>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleValueChange('quality', 'low')}
                  className={`px-3 py-1 text-xs rounded-md ${settings.quality === 'low' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}
                >
                  Low
                </button>
                <button
                  onClick={() => handleValueChange('quality', 'high')}
                  className={`px-3 py-1 text-xs rounded-md ${settings.quality === 'high' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}
                >
                  High
                </button>
              </div>
            </ControlRow>
            <ControlRow label="Lines Color" icon={<Palette size={16} className="text-gray-400"/>}>
                <ColorPicker name="linesColor" />
            </ControlRow>
            <ControlRow label="Scan Color" icon={<Palette size={16} className="text-gray-400"/>}>
                <ColorPicker name="scanColor" />
            </ControlRow>
            <ControlRow label="Line Thickness" icon={<SlidersHorizontal size={16} className="text-gray-400"/>}>
                <Slider name="lineThickness" min={0} max={5} step={0.1} />
            </ControlRow>
            <ControlRow label="Grid Scale" icon={<SlidersHorizontal size={16} className="text-gray-400"/>}>
                <Slider name="gridScale" min={0.01} max={1} step={0.01} />
            </ControlRow>
            <ControlRow label="Line Jitter" icon={<SlidersHorizontal size={16} className="text-gray-400"/>}>
                <Slider name="lineJitter" min={0} max={1} step={0.01} />
            </ControlRow>
            <ControlRow label="Scan Glow" icon={<SlidersHorizontal size={16} className="text-gray-400"/>}>
                <Slider name="scanGlow" min={0} max={2} step={0.1} />
            </ControlRow>
            <ControlRow label="Scan Softness" icon={<SlidersHorizontal size={16} className="text-gray-400"/>}>
                <Slider name="scanSoftness" min={0} max={10} step={0.1} />
            </ControlRow>
            <ControlRow label="Scan Depth" icon={<SlidersHorizontal size={16} className="text-gray-400"/>}>
                <Slider name="scanDepth" min={1} max={10} step={0.1} />
            </ControlRow>
            <ControlRow label="Particle Count" icon={<Sparkles size={16} className="text-gray-400"/>}>
                <Slider name="particleCount" min={0} max={500} step={10} />
            </ControlRow>
             <ControlRow label="Color Mode" icon={<Droplets size={16} className="text-gray-400"/>}>
                <div className="flex items-center space-x-1">
                    <button onClick={() => handleValueChange('colorMode', 'solid')} className={`px-2 py-1 text-xs rounded-md ${settings.colorMode === 'solid' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Solid</button>
                    <button onClick={() => handleValueChange('colorMode', 'depth')} className={`px-2 py-1 text-xs rounded-md ${settings.colorMode === 'depth' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Depth</button>
                    <button onClick={() => handleValueChange('colorMode', 'rainbow')} className={`px-2 py-1 text-xs rounded-md ${settings.colorMode === 'rainbow' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Rainbow</button>
                </div>
            </ControlRow>
            {settings.colorMode === 'depth' && (
                <ControlRow label="Depth Color" icon={<Palette size={16} className="text-gray-400"/>}>
                    <ColorPicker name="depthColor" />
                </ControlRow>
            )}
            <ControlRow label="Enable Post" icon={settings.enablePost ? <ToggleRight size={16} className="text-blue-500"/> : <ToggleLeft size={16} className="text-gray-400"/>}>
                <Toggle name="enablePost" />
            </ControlRow>
            <ControlRow label="Chromatic Aberration" icon={<SlidersHorizontal size={16} className="text-gray-400"/>}>
                <Slider name="chromaticAberration" min={0} max={0.02} step={0.0001} />
            </ControlRow>
            <ControlRow label="Noise Intensity" icon={<SlidersHorizontal size={16} className="text-gray-400"/>}>
                <Slider name="noiseIntensity" min={0} max={0.1} step={0.001} />
            </ControlRow>
            <ControlRow label="Enable FaceTracking" icon={<Camera size={16} className={settings.enableWebcam ? "text-blue-500" : "text-gray-400"}/>}>
                <Toggle name="enableWebcam" />
            </ControlRow>
        </div>
      </div>
    </div>
  );
};

export default GridScanSettings;