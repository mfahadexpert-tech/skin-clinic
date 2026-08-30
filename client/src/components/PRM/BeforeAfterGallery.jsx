/**
 * ==============================================================================
 * SkinLab AI - PRM Before & After Clinical Photo Gallery
 * ==============================================================================
 * Interactive before/after progress slider for aesthetic treatments
 * (HydraFacial, Carbon Peels, Laser Hair Reduction, Botox).
 * ==============================================================================
 */

'use client';

import React, { useState } from 'react';
import { Sparkles, Calendar, ArrowLeftRight } from 'lucide-react';

export default function BeforeAfterGallery({ patient, onClose }) {
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel p-6 max-w-xl w-full border border-white/20 shadow-2xl space-y-4">
        
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Clinical Progress Documentation (Before & After)</span>
            </h3>
            <p className="text-xs text-slate-400">Patient: <strong className="text-teal-300">{patient.name}</strong> ({patient.mrn})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Visual Progress Card */}
        <div className="relative h-64 rounded-xl overflow-hidden border border-white/10 bg-slate-900 flex items-center justify-center">
          
          {/* Simulated Before Layer */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-950/40 to-slate-900 flex items-center justify-start pl-8">
            <div className="space-y-1">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                BEFORE (Session 1)
              </span>
              <div className="text-xs text-slate-300 font-medium">Visible post-acne erythema & enlarged pores</div>
              <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>Captured: 2026-08-10</span>
              </div>
            </div>
          </div>

          {/* Simulated After Layer */}
          <div 
            className="absolute inset-0 bg-gradient-to-l from-teal-950/60 to-slate-900 flex items-center justify-end pr-8 border-l-2 border-teal-400"
            style={{ clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }}
          >
            <div className="space-y-1 text-right">
              <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px] font-bold border border-teal-500/30">
                AFTER (Session 3)
              </span>
              <div className="text-xs text-teal-200 font-medium">85% reduction in hyperpigmentation & radiant glow</div>
              <div className="text-[10px] text-teal-400 flex items-center justify-end space-x-1">
                <Calendar className="w-3 h-3" />
                <span>Captured: Today</span>
              </div>
            </div>
          </div>

          {/* Slider Handle */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-10"
          />

          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-teal-400 shadow-lg pointer-events-none z-0"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center shadow-lg">
              <ArrowLeftRight className="w-3 h-3" />
            </div>
          </div>

        </div>

        <p className="text-center text-[11px] text-slate-400">
          Drag slider horizontally to evaluate clinical skin texture refinement.
        </p>

        <div className="flex justify-end pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
}
