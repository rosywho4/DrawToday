
import React, { useState } from 'react';

interface OnboardingGuideProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "欢迎使用 Sketch Serenity",
    description: "专为艺术家打造的极简速写辅助工具。在这里，通过专注的练习，捕捉每一个灵感的瞬间。",
    icon: "palette",
    button: "开启探索"
  },
  {
    title: "长按管理你的图库",
    description: "在首页长按任何图库封面，即可快速进行重命名、复制副本或彻底删除。让你的素材库井井有条。",
    icon: "touch_app",
    button: "关于练习"
  },
  {
    title: "沉浸式的练习体验",
    description: "在练习中通过双指缩放、旋转和翻转来观察细节。点击屏幕任何位置即可调出控制台或隐藏 UI。",
    icon: "gesture",
    button: "开始创作"
  }
];

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-500" />
      
      <div className="relative w-full max-w-sm bg-white rounded-[3rem] p-8 shadow-2xl flex flex-col items-center text-center animate-in zoom-in duration-300">
        {/* Step Indicator */}
        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-primary' : 'w-1.5 bg-slate-100'}`} 
            />
          ))}
        </div>

        {/* Icon */}
        <div className="size-24 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-8 animate-bounce">
          <span className="material-symbols-outlined text-5xl text-primary filled">{step.icon}</span>
        </div>

        {/* Text Content */}
        <h2 className="text-2xl font-black mb-4 tracking-tight leading-tight">{step.title}</h2>
        <p className="text-slate-400 text-base font-bold leading-relaxed mb-10 px-2">
          {step.description}
        </p>

        {/* Action */}
        <button 
          onClick={nextStep}
          className="w-full py-5 bg-primary text-white rounded-[2rem] font-black text-lg shadow-xl shadow-primary/20 active:scale-95 transition-transform"
        >
          {step.button}
        </button>

        {currentStep < steps.length - 1 && (
          <button 
            onClick={onComplete}
            className="mt-4 text-slate-300 text-sm font-black uppercase tracking-widest"
          >
            跳过引导
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingGuide;
