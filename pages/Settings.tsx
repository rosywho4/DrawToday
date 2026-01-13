
import React from 'react';

const Settings: React.FC = () => {
  const sections = [
    {
      title: '账户设置',
      items: [
        { label: '个人资料', icon: 'person' },
        { label: '账号与安全', icon: 'shield_person' },
      ]
    },
    {
      title: '练习偏好',
      items: [
        { label: '默认计时器', icon: 'timer', extra: '60秒' },
        { label: '深色模式', icon: 'dark_mode', toggle: false },
        { label: '自动保存', icon: 'auto_awesome', toggle: true },
      ]
    },
    {
      title: '图库管理',
      items: [
        { label: '参考图导入', icon: 'folder_open' },
        { label: '存储空间管理', icon: 'database', extra: '1.2 GB' },
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg-serenity pb-32">
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-lg px-6 pt-12 pb-4 flex items-center justify-between border-b border-black/5">
        <div className="size-10 flex items-center justify-center rounded-full bg-white shadow-sm active:bg-slate-100 transition-colors active:scale-90">
          <span className="material-symbols-outlined text-primary text-2xl">arrow_back_ios_new</span>
        </div>
        <h1 className="text-lg font-black text-text-main flex-1 text-center pr-10">设置中心</h1>
      </header>

      <main className="flex-1 px-4 pt-6 space-y-8">
        {sections.map((section, idx) => (
          <section key={idx}>
            <h3 className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] px-4 pb-2">
              {section.title}
            </h3>
            <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
              {section.items.map((item, i) => (
                <div 
                  key={i} 
                  className={`flex items-center gap-4 px-5 py-5 justify-between active:bg-slate-50 transition-colors ${
                    i !== section.items.length - 1 ? 'border-b border-slate-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-primary">{item.icon}</span>
                    <p className="text-[15px] font-medium text-text-main">{item.label}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.extra && <span className="text-sm text-slate-300 font-bold">{item.extra}</span>}
                    {item.toggle !== undefined ? (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={item.toggle} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-100 rounded-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full shadow-inner" />
                      </label>
                    ) : (
                      <span className="material-symbols-outlined text-slate-200">chevron_right</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <button className="w-full bg-white text-rose-400 font-black py-4 rounded-3xl border border-black/5 active:opacity-60 transition-opacity shadow-sm">
          退出登录
        </button>

        <div className="flex flex-col items-center justify-center py-10 opacity-20">
          <div className="w-10 h-10 border-2 border-primary rounded-xl flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-primary text-2xl">brush</span>
          </div>
          <p className="text-[10px] tracking-[0.4em] font-black uppercase">Sketch Serenity</p>
        </div>
      </main>
    </div>
  );
};

export default Settings;
