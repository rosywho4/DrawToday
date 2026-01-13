
import React, { useState, useEffect, useMemo } from 'react';
import { Folder, Page, PracticeSession, PracticePreset } from '../types';

interface PracticeConfigProps {
  folder: Folder;
  onStart: (session: PracticeSession) => void;
  onBack: () => void;
}

const DEFAULT_PRESETS: PracticePreset[] = [
  { id: 'p1', name: '30s 极速', imageCount: 15, timePerImage: 30 },
  { id: 'p2', name: '2m 结构', imageCount: 8, timePerImage: 120 },
  { id: 'p3', name: '5m 细致', imageCount: 3, timePerImage: 300 },
];

const PracticeConfig: React.FC<PracticeConfigProps> = ({ folder, onStart, onBack }) => {
  const availableImages = useMemo(() => folder.references.filter(r => !r.completed), [folder.references]);
  const maxCount = availableImages.length;
  
  const [imageCount, setImageCount] = useState(Math.min(10, maxCount || 1));
  const [minutes, setMinutes] = useState(1);
  const [seconds, setSeconds] = useState(30);
  const [mode, setMode] = useState<'random' | 'sequential'>('random');
  const [isNamingPreset, setIsNamingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  
  const [presets, setPresets] = useState<PracticePreset[]>(() => {
    const saved = localStorage.getItem('sketch_serenity_presets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const customs = parsed.filter((p: PracticePreset) => !DEFAULT_PRESETS.some(dp => dp.id === p.id));
        return [...DEFAULT_PRESETS, ...customs];
      } catch (e) {
        return DEFAULT_PRESETS;
      }
    }
    return DEFAULT_PRESETS;
  });

  useEffect(() => {
    localStorage.setItem('sketch_serenity_presets', JSON.stringify(presets));
  }, [presets]);

  const totalSec = (minutes * 60) + seconds;

  const activePresetId = useMemo(() => {
    const found = presets.find(p => p.imageCount === imageCount && p.timePerImage === totalSec);
    return found ? found.id : null;
  }, [imageCount, totalSec, presets]);

  const deletePreset = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (DEFAULT_PRESETS.some(p => p.id === id)) return;
    setPresets(prev => prev.filter(p => p.id !== id));
  };

  const handleStart = () => {
    if (maxCount === 0) return;
    onStart({ folderId: folder.id, imageCount, timePerImage: Math.max(5, totalSec), mode });
  };

  const openSaveDialog = () => {
    setNewPresetName(`预设 ${presets.length + 1}`);
    setIsNamingPreset(true);
  };

  const confirmSavePreset = () => {
    if (newPresetName.trim()) {
      const newPreset: PracticePreset = {
        id: `custom-${Date.now()}`,
        name: newPresetName.trim(),
        imageCount: imageCount,
        timePerImage: totalSec
      };
      setPresets(prev => [...prev, newPreset]);
      setIsNamingPreset(false);
    }
  };

  const selectPreset = (p: PracticePreset) => {
    setImageCount(Math.min(p.imageCount, maxCount || 1)); 
    setMinutes(Math.floor(p.timePerImage / 60)); 
    setSeconds(p.timePerImage % 60);
  };

  const handleImageCountChange = (val: number) => {
    const safeVal = Math.min(maxCount, Math.max(1, val));
    setImageCount(safeVal);
  };

  return (
    <div className="flex flex-col h-screen bg-bg-serenity p-4 overflow-hidden">
      {/* 命名预设模态框 */}
      {isNamingPreset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-6">
          <div className="w-full max-w-xs bg-white rounded-[2rem] p-6 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-black mb-4">保存预设</h3>
            <div className="space-y-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-1">参数预览</p>
                <p className="text-base font-black text-slate-500">{imageCount}P • {minutes}m{seconds}s/P</p>
              </div>
              <input 
                autoFocus
                type="text" 
                value={newPresetName}
                onChange={e => setNewPresetName(e.target.value)}
                placeholder="名称..."
                className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold outline-none text-base focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsNamingPreset(false)} className="flex-1 py-4 text-base font-bold text-slate-400 bg-slate-100 rounded-xl">取消</button>
              <button onClick={confirmSavePreset} className="flex-1 py-4 text-base font-bold text-white bg-primary rounded-xl shadow-lg">保存</button>
            </div>
          </div>
        </div>
      )}

      <header className="flex items-center gap-4 mb-5">
        <button onClick={onBack} className="size-11 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
        </button>
        <div>
          <h1 className="text-xl font-black leading-none">练习设置</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{maxCount} 张待练习</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
        {/* 预设区域 */}
        <section>
          <div className="flex justify-between items-center mb-2 px-1">
            <h3 className="text-[13px] font-black uppercase text-slate-400 tracking-widest">练习预设</h3>
            <button onClick={openSaveDialog} className="flex items-center gap-1 text-primary text-[12px] font-black uppercase tracking-widest">
              <span className="material-symbols-outlined text-[16px]">save</span> 存为新预设
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {presets.map(p => {
              const isDefault = DEFAULT_PRESETS.some(dp => dp.id === p.id);
              const isActive = activePresetId === p.id;
              return (
                <div 
                  key={p.id} 
                  onClick={() => selectPreset(p)}
                  className={`flex-shrink-0 relative w-32 p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-24 ${
                    isActive 
                      ? 'bg-primary border-primary shadow-md shadow-primary/20' 
                      : 'bg-white border-black/5 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <p className={`font-black text-sm truncate leading-tight pr-1 ${isActive ? 'text-white' : 'text-text-main'}`}>{p.name}</p>
                    {!isDefault && (
                      <button 
                        onClick={(e) => deletePreset(e, p.id)} 
                        className={`size-6 flex items-center justify-center rounded-full ${isActive ? 'text-white/40 hover:text-white' : 'text-slate-200 hover:text-rose-500'}`}
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    )}
                  </div>
                  <p className={`text-[12px] font-bold ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                    {p.imageCount}P • {Math.floor(p.timePerImage / 60)}m{p.timePerImage % 60}s
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 核心配置 */}
        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-black/5 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-black text-slate-400 uppercase tracking-widest">模式</span>
            <div className="flex bg-slate-50 p-1.5 rounded-2xl">
              <button onClick={() => setMode('random')} className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${mode === 'random' ? 'bg-white shadow-sm text-primary' : 'text-slate-300'}`}>随机</button>
              <button onClick={() => setMode('sequential')} className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${mode === 'sequential' ? 'bg-white shadow-sm text-primary' : 'text-slate-300'}`}>顺序</button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="text-[13px] font-black text-slate-400 uppercase tracking-widest">数量</span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleImageCountChange(maxCount)}
                  className="text-xs font-black text-primary bg-primary/10 px-3 py-1.5 rounded-lg active:bg-primary/20 transition-colors"
                >
                  全部
                </button>
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                  <input 
                    type="number" 
                    value={imageCount} 
                    onChange={e => handleImageCountChange(parseInt(e.target.value) || 0)}
                    className="w-14 bg-transparent border-none text-center text-lg font-black text-primary p-0 outline-none"
                  />
                  <span className="text-sm font-black text-slate-300">P</span>
                </div>
              </div>
            </div>
            <input 
              type="range" 
              min="1" 
              max={Math.max(1, maxCount)} 
              value={imageCount} 
              onChange={e => setImageCount(parseInt(e.target.value))} 
              className="w-full h-2.5 bg-slate-100 rounded-full appearance-none accent-primary cursor-pointer" 
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="text-[13px] font-black text-slate-400 uppercase tracking-widest">单张计时</span>
              <span className="text-xs font-black text-slate-300 uppercase tracking-widest">MIN : SEC</span>
            </div>
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-1">
                <input 
                  type="number" 
                  value={minutes} 
                  onChange={e => setMinutes(Math.max(0, parseInt(e.target.value)||0))} 
                  className="w-24 bg-slate-50 border-none rounded-2xl text-center text-4xl font-black text-primary py-4 outline-none focus:ring-1 focus:ring-primary/20" 
                />
              </div>
              <span className="text-slate-200 font-black text-3xl">:</span>
              <div className="flex flex-col items-center gap-1">
                <input 
                  type="number" 
                  value={seconds} 
                  onChange={e => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value)||0)))} 
                  className="w-24 bg-slate-50 border-none rounded-2xl text-center text-4xl font-black text-primary py-4 outline-none focus:ring-1 focus:ring-primary/20" 
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 底部动作区域 */}
      <div className="pt-5 pb-3 space-y-4">
        <div className="bg-white/60 backdrop-blur-sm px-6 py-4 rounded-2xl border border-black/5 flex items-center justify-between shadow-sm">
          <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">预计总时长</span>
          <span className="text-xl font-black text-text-main tabular-nums">
            {Math.floor((totalSec * imageCount) / 60)}<span className="text-xs text-slate-300 font-bold ml-1 uppercase">M</span>
            <span className="mx-2"></span>
            {(totalSec * imageCount) % 60}<span className="text-xs text-slate-300 font-bold ml-1 uppercase">S</span>
          </span>
        </div>
        <button 
          onClick={handleStart} 
          disabled={maxCount === 0} 
          className={`w-full py-5 rounded-[2rem] font-black text-xl shadow-lg active:scale-[0.98] transition-all ${
            maxCount === 0 
              ? 'bg-slate-200 text-slate-400' 
              : 'bg-primary text-white shadow-primary/30'
          }`}
        >
          {maxCount === 0 ? '资源库已空' : '开启挑战'}
        </button>
      </div>
    </div>
  );
};

export default PracticeConfig;
