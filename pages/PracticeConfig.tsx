
import React, { useState, useEffect, useMemo } from 'react';
import { Folder, Page, PracticeSession, PracticePreset } from '../types';

interface PracticeConfigProps {
  folder: Folder;
  onStart: (session: PracticeSession) => void;
  onBack: () => void;
}

const DEFAULT_PRESETS: PracticePreset[] = [
  { id: 'p1', name: '30s 极速练习', imageCount: 20, timePerImage: 30 },
  { id: 'p2', name: '2min 结构研究', imageCount: 10, timePerImage: 120 },
  { id: 'p3', name: '5min 细致写生', imageCount: 5, timePerImage: 300 },
];

const PracticeConfig: React.FC<PracticeConfigProps> = ({ folder, onStart, onBack }) => {
  const availableImages = useMemo(() => {
    return folder.references.filter(r => !r.completed);
  }, [folder.references]);

  const maxCount = availableImages.length;
  const [imageCount, setImageCount] = useState(Math.min(15, maxCount));
  const [minutes, setMinutes] = useState(2);
  const [seconds, setSeconds] = useState(30);
  const [mode, setMode] = useState<'random' | 'sequential'>('random');

  const [presets, setPresets] = useState<PracticePreset[]>(DEFAULT_PRESETS);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const totalTimeSeconds = (minutes * 60) + seconds;

  useEffect(() => {
    if (imageCount > maxCount) setImageCount(maxCount);
    if (imageCount === 0 && maxCount > 0) setImageCount(Math.min(1, maxCount));
  }, [maxCount]);

  const handleImageCountChange = (val: number) => {
    setImageCount(Math.max(0, Math.min(maxCount, val)));
  };

  const applyPreset = (preset: PracticePreset) => {
    setImageCount(Math.min(preset.imageCount, maxCount));
    setMinutes(Math.floor(preset.timePerImage / 60));
    setSeconds(preset.timePerImage % 60);
  };

  const saveCurrentAsPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: PracticePreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName,
      imageCount,
      timePerImage: totalTimeSeconds,
    };
    setPresets([...presets, newPreset]);
    setNewPresetName('');
    setShowSaveModal(false);
  };

  const formatEstimation = (totalSec: number) => {
    const total = totalSec * imageCount;
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    
    if (h > 0) return `${h}小时 ${m}分`;
    if (m > 0) return `${m}分 ${s}秒`;
    return `${s}秒`;
  };

  const handleStart = () => {
    if (maxCount === 0) return;
    const finalTime = Math.max(5, totalTimeSeconds);
    onStart({
      folderId: folder.id,
      imageCount,
      timePerImage: finalTime,
      mode
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-serenity p-6 pt-12 relative overflow-hidden">
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black mb-4">保存为新预设</h3>
            <input 
              autoFocus
              type="text"
              placeholder="预设名称"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 mb-6 focus:ring-2 focus:ring-primary/20 font-medium"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowSaveModal(false)} className="flex-1 py-4 font-bold text-slate-400 bg-slate-100 rounded-2xl">取消</button>
              <button onClick={saveCurrentAsPreset} disabled={!newPresetName.trim()} className="flex-1 py-4 font-bold text-white bg-primary rounded-2xl shadow-lg disabled:opacity-50">确定保存</button>
            </div>
          </div>
        </div>
      )}

      <header className="mb-8">
        <button onClick={onBack} className="mb-6 size-10 flex items-center justify-center rounded-full bg-white shadow-sm active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
        </button>
        <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">练习设置</h1>
        <p className="text-slate-400 text-sm mt-2 font-medium">跳过已完成，共 {maxCount} 张可练</p>
      </header>

      {maxCount === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="size-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
            <span className="material-symbols-outlined text-4xl text-secondary filled">check_circle</span>
          </div>
          <h2 className="text-xl font-bold mb-2">太棒了！</h2>
          <p className="text-slate-400 text-sm">该文件夹下的所有素材都已练完。</p>
        </div>
      ) : (
        <div className="space-y-6 flex-1 custom-scrollbar overflow-y-auto pb-10">
          <section>
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase">快速预设</h3>
              <button onClick={() => setShowSaveModal(true)} className="text-primary text-[10px] font-bold bg-primary/10 px-3 py-1 rounded-full">+ 保存当前</button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
              {presets.map(preset => (
                <button key={preset.id} onClick={() => applyPreset(preset)} className="flex-shrink-0 bg-white border border-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 text-left w-32">
                  <p className="font-bold text-[11px] mb-1 truncate">{preset.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{preset.imageCount}张 • {preset.timePerImage}s</p>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm">
            <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-slate-400">练习模式</h3>
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
              <button onClick={() => setMode('random')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${mode === 'random' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}>随机播放</button>
              <button onClick={() => setMode('sequential')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${mode === 'sequential' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}>顺序播放</button>
            </div>
          </section>

          <section className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">练习数量</h3>
              <span className="text-xl font-black text-primary">{imageCount} <span className="text-[10px] uppercase">张</span></span>
            </div>
            <input type="range" min="1" max={maxCount} value={imageCount} onChange={(e) => handleImageCountChange(parseInt(e.target.value))} className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-primary mb-6" />
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 20, maxCount].filter(v => v <= maxCount).map(val => (
                <button key={val} onClick={() => handleImageCountChange(val)} className={`py-2 rounded-lg text-xs font-bold border ${imageCount === val ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>{val === maxCount ? '全部' : val}</button>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm">
            <h3 className="text-sm font-bold mb-6 uppercase tracking-wider text-slate-400">单张限时</h3>
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center">
                <input type="number" value={minutes} onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))} className="w-20 bg-slate-50 border-none rounded-xl text-center text-3xl font-black text-secondary focus:ring-0" />
                <span className="text-[10px] font-bold text-slate-300 mt-2">分</span>
              </div>
              <span className="text-2xl font-black text-slate-200">:</span>
              <div className="flex flex-col items-center">
                <input type="number" value={seconds} onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))} className="w-20 bg-slate-50 border-none rounded-xl text-center text-3xl font-black text-secondary focus:ring-0" />
                <span className="text-[10px] font-bold text-slate-300 mt-2">秒</span>
              </div>
            </div>
          </section>
        </div>
      )}

      <div className="mt-4 pb-10">
        <div className="bg-white/90 p-5 rounded-[2rem] border border-white shadow-xl mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">总计时间预估</p>
            <p className="text-2xl font-black text-text-main mt-1">{formatEstimation(totalTimeSeconds)}</p>
          </div>
          <span className="material-symbols-outlined text-primary text-3xl">schedule</span>
        </div>
        <button onClick={handleStart} disabled={maxCount === 0} className={`w-full py-5 rounded-3xl font-black text-xl flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all ${maxCount === 0 ? 'bg-slate-200 text-slate-400' : 'bg-primary text-white shadow-primary/30'}`}>开始挑战</button>
      </div>
    </div>
  );
};

export default PracticeConfig;
