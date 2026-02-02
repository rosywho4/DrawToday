import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface OnboardingGuideProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "欢迎使用 DrawToday",
    description: "专为艺术家打造的极简绘画练习辅助工具。在这里，通过专注的练习，捕捉每一个灵感的瞬间，让每一次练习都有记录、有进步。",
    icon: "palette",
    button: "开始了解"
  },
  {
    title: "创建你的第一个图库",
    description: "点击首页的「新建图库」按钮，为你的参考图片创建分类。可以按主题分类，比如「人物速写」「风景练习」「动物研究」等，让素材管理井井有条。",
    icon: "create_new_folder",
    button: "继续"
  },
  {
    title: "导入参考图片",
    description: "进入图库后，通过顶部的拖拽区域或右下角的悬浮按钮导入图片。支持批量导入，所有图片都会安全存储在本地，离线也能使用。",
    icon: "add_photo_alternate",
    button: "继续"
  },
  {
    title: "设置封面让图库更美观",
    description: "长按图库卡片，选择「设置封面」，从图库中挑选一张喜欢的图片作为封面。刷新后封面会自动保存，让你的首页更加个性化。",
    icon: "image",
    button: "继续"
  },
  {
    title: "长按管理你的图库",
    description: "在首页长按任何图库卡片，即可快速进行重命名、复制副本、设置封面或彻底删除。所有操作都有确认提示，不用担心误操作。",
    icon: "touch_app",
    button: "继续"
  },
  {
    title: "图库内的图片管理",
    description: "在图库详情页，点击右上角第三个按钮进入选择模式。可以批量标记图片为「已完成」，或批量删除不需要的图片。已完成的图片会有绿色对勾标记。",
    icon: "checklist",
    button: "继续"
  },
  {
    title: "开始你的练习",
    description: "点击「开始练习」配置练习参数：选择图片数量和每张的练习时长。系统会自动过滤已完成的图片，确保每次练习都是新鲜的挑战。",
    icon: "play_circle",
    button: "继续"
  },
  {
    title: "沉浸式的练习体验",
    description: "练习中可以双指缩放观察细节、旋转调整角度、翻转镜像对比。点击屏幕任意位置显示/隐藏控制台。倒计时结束或点击对钩都会标记为已完成。",
    icon: "gesture",
    button: "继续"
  },
  {
    title: "查看练习统计",
    description: "完成练习后，在统计页面查看你的进步：连续练习天数、总练习时长、完成作品数，以及最近7天的练习趋势图。所有数据都会自动保存。",
    icon: "analytics",
    button: "继续"
  },
  {
    title: "练习预设让重复更简单",
    description: "在设置页面创建自定义预设，保存你常用的练习配置（如「快速练习：5张30秒」「深度练习：10张3分钟」），下次直接选用即可。",
    icon: "settings",
    button: "开始创作"
  }
];

export default function OnboardingGuide({ onComplete }: OnboardingGuideProps) {
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
        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-primary' : 'w-1.5 bg-slate-100'}`}
            />
          ))}
        </div>

        <div className="size-24 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-8 animate-bounce">
          <span className="material-symbols-outlined text-5xl text-primary filled">{step.icon}</span>
        </div>

        <h2 className="text-2xl font-black mb-4 tracking-tight leading-tight">{step.title}</h2>
        <p className="text-slate-400 text-base font-bold leading-relaxed mb-10 px-2">
          {step.description}
        </p>

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
}
