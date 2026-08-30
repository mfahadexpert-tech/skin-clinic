/**
 * ==============================================================================
 * SkinLab AI - Premium Clinical Before & After Visual Skin Analysis
 * Enterprise $5,000+ Feature Extension
 * ==============================================================================
 */

'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Layers, 
  Sliders, 
  CheckCircle2, 
  Calendar, 
  Camera, 
  FileText
} from 'lucide-react';

export default function BeforeAfterGallery({ patient, onClose }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [selectedTreatment, setSelectedTreatment] = useState('Carbon Laser Peel (6 Sessions)');

  const beforeImage = "https://images.unsplash.com/photo-1512290900673-0cd923e20e40?w=600&auto=format&fit=crop&q=80"; // Baseline Acne & Pigmentation
  const afterImage = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80";  // Post 6 Sessions Clear Glow

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-4 border border-slate-100 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0f172a]">Clinical Before & After Skin Analysis</h3>
              <p className="text-xs text-slate-500 font-medium">Patient: {patient?.name} ({patient?.mrn}) • Skin Tone: {patient?.skin_type || 'Medium Asian'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>

        {/* Treatment Selector */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <span className="text-xs font-bold text-[#0f172a]">Select Procedure Record:</span>
          <select
            value={selectedTreatment}
            onChange={(e) => setSelectedTreatment(e.target.value)}
            className="bg-white border border-slate-200 text-xs font-bold text-[#0f172a] rounded-xl px-3 py-1.5 outline-none"
          >
            <option value="Carbon Laser Peel (6 Sessions)">Carbon Laser Peel (6 Sessions)</option>
            <option value="HydraFacial Deluxe (4 Sessions)">HydraFacial Deluxe (4 Sessions)</option>
            <option value="PRP Vampire Facial with Microneedling">PRP Vampire Facial with Microneedling</option>
          </select>
        </div>

        {/* Interactive Before/After Comparison Slider */}
        <div className="relative w-full h-80 rounded-2xl overflow-hidden shadow-inner select-none border border-slate-200">
          {/* Before Image (Left Base) */}
          <img src={beforeImage} className="absolute inset-0 w-full h-full object-cover" alt="Before Treatment" />
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full shadow">
            Baseline (Session 1)
          </div>

          {/* After Image (Right Clipped) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)` }}
          >
            <img src={afterImage} className="absolute inset-0 w-full h-full object-cover" alt="After Treatment" />
            <div className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full shadow">
              Post-Care (Session 6)
            </div>
          </div>

          {/* Vertical Slider Handle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize flex items-center justify-center"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="w-8 h-8 rounded-full bg-white text-[#0f172a] shadow-xl flex items-center justify-center font-bold text-xs border border-slate-200">
              ↔
            </div>
          </div>

          {/* Hidden Input for Dragging */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={(e) => setSliderPosition(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
          />
        </div>

        {/* Clinical Metrics & Notes */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Pore Size Reduction</span>
            <span className="text-base font-extrabold text-emerald-600 font-mono">-42%</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Melasma Clearance</span>
            <span className="text-base font-extrabold text-teal-600 font-mono">+68%</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Skin Hydration Index</span>
            <span className="text-base font-extrabold text-blue-600 font-mono">88 / 100</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#0f172a] text-white font-bold rounded-xl text-xs shadow hover:bg-slate-800 transition"
          >
            Close Analysis
          </button>
        </div>

      </div>
    </div>
  );
}
