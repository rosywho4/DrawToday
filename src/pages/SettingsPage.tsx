import React, { useState } from 'react';
import { useSession } from '../contexts/SessionContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { PracticePreset, DEFAULT_PRESETS } from '../types';
import Header from '../components/layout/Header';
import OnboardingGuide from '../components/features/OnboardingGuide';

export default function SettingsPage() {
  const { presets, savePreset, deletePreset } = useSession();
  const { completeOnboarding } = useOnboarding();
  const [showTutorial, setShowTutorial] = useState(false);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PracticePreset | null>(null);
  const [presetName, setPresetName] = useState('');
  const [imageCount, setImageCount] = useState(10);
  const [minutes, setMinutes] = useState(1);
  const [seconds, setSeconds] = useState(30);

  const customPresets = presets.filter(p => !DEFAULT_PRESETS.some(dp => dp.id === p.id));

  const openNewPreset = () => {
    setEditingPreset(null);
    setPresetName(`预设 ${customPresets.length + 1}`);
    setImageCount(10);
    setMinutes(1);
    setSeconds(30);
    setShowPresetDialog(true);
  };

  const saveCurrentPreset = () => {
    if (!presetName.trim()) return;
    
    const totalSec = minutes * 60 + seconds;
    const newPreset: PracticePreset = {
      id: editingPreset?.id || `custom-${Date.now()}`,
      name: presetName.trim(),
      duration: Math.ceil(totalSec / 60),
      imageSelection: 'all',
      autoAdvance: false,
      imageCount,
      timePerImage: totalSec
    };
    
    if (editingPreset) {
      deletePreset(editingPreset.id);
    }
    savePreset(newPreset);
    setShowPresetDialog(false);
  };

  const handleDeletePreset = (id: string) => {
    deletePreset(id);
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-serenity pb-32">
      <Header title="设置中心" />

      <main className="flex-1 px-4 pt-6 space-y-8">
        {/* 练习预设 */}
        <section>
          <div className="flex items-center justify-between mb-3 px-4">
            <h3 className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em]">练习预设</h3>
            <button 
              onClick={openNewPreset}
              className="text-primary text-sm font-bold active:scale-95 transition-transform"
            >
              + 新建预设
            </button>
          </div>
          <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
            {customPresets.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-2xl text-slate-300">settings</span>
                </div>
                <p className="text-slate-400 text-sm font-bold">暂无自定义预设</p>
                <p className="text-slate-300 text-xs mt-1">点击右上角创建预设</p>
              </div>
            ) : (
              customPresets.map((preset, i) => (
                <div
                  key={preset.id}
                  className={`flex items-center gap-4 px-5 py-4 justify-between ${i !== customPresets.length - 1 ? 'border-b border-slate-50' : ''}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="material-symbols-outlined text-primary">timer</span>
                    <div className="flex-1">
                      <p className="text-[15px] font-bold text-text-main">{preset.name}</p>
                      <p className="text-xs text-slate-400">
                        {preset.imageCount}张 • {Math.floor(preset.timePerImage / 60)}分{preset.timePerImage % 60}秒/张
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeletePreset(preset.id)}
                    className="text-rose-400 active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 帮助与支持 */}
        <section>
          <h3 className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] px-4 pb-2">帮助与支持</h3>
          <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
            <button
              onClick={() => setShowTutorial(true)}
              className="w-full flex items-center gap-4 px-5 py-5 justify-between active:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary">school</span>
                <p className="text-[15px] font-medium text-text-main">使用教程</p>
              </div>
              <span className="material-symbols-outlined text-slate-200">chevron_right</span>
            </button>
          </div>
        </section>

        {/* 关于应用 */}
        <div className="flex flex-col items-center justify-center py-10 opacity-20">
          <div className="w-10 h-10 border-2 border-primary rounded-xl flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-primary text-2xl">brush</span>
          </div>
          <p className="text-[10px] tracking-[0.4em] font-black uppercase">DrawToday</p>
          <p className="text-[9px] text-slate-400 mt-1">v1.0.0</p>
        </div>
      </main>

      {/* 预设编辑对话框 */}
      {showPresetDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-6">
          <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-black mb-6">
              {editingPreset ? '编辑预设' : '新建预设'}
            </h3>
            
            <div className="space-y-4">
              {/* 预设名称 */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">预设名称</label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:outline-none font-bold"
                  placeholder="输入预设名称"
                />
              </div>

              {/* 图片数量 */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">图片数量</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setImageCount(Math.max(1, imageCount - 1))}
                    className="size-10 rounded-full bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-2xl font-black">{imageCount}</span>
                    <span className="text-sm text-slate-400 ml-1">张</span>
                  </div>
                  <button
                    onClick={() => setImageCount(imageCount + 1)}
                    className="size-10 rounded-full bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>

              {/* 每张时长 */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">每张时长</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <input
                      type="number"
                      value={minutes}
                      onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-2xl font-black text-center bg-transparent focus:outline-none"
                      min="0"
                    />
                    <p className="text-xs text-slate-400 font-bold mt-1">分钟</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <input
                      type="number"
                      value={seconds}
                      onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="w-full text-2xl font-black text-center bg-transparent focus:outline-none"
                      min="0"
                      max="59"
                    />
                    <p className="text-xs text-slate-400 font-bold mt-1">秒</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPresetDialog(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold active:scale-95 transition-transform"
              >
                取消
              </button>
              <button
                onClick={saveCurrentPreset}
                className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 教程弹窗 */}
      {showTutorial && (
        <OnboardingGuide onComplete={() => setShowTutorial(false)} />
      )}
    </div>
  );
}
