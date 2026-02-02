import React, { useMemo } from 'react';
import { useSession } from '../contexts/SessionContext';
import Header from '../components/layout/Header';

export default function StatisticsPage() {
  const { practiceHistory, clearPracticeHistory } = useSession();

  // 计算统计数据
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 计算连续练习天数
    let streak = 0;
    let checkDate = new Date(today);
    const practiceDates = new Set(
      practiceHistory.map(h => {
        const d = new Date(h.date);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      })
    );
    
    while (practiceDates.has(checkDate.getTime())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // 总时长和总作品数
    const totalMinutes = practiceHistory.reduce((sum, h) => sum + h.duration, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const totalWorks = practiceHistory.reduce((sum, h) => sum + h.imageCount, 0);
    
    // 本周趋势（最近7天）
    const weeklyTrend = [];
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateTime = date.getTime();
      const dayMinutes = practiceHistory
        .filter(h => {
          const hDate = new Date(h.date);
          const hDateTime = new Date(hDate.getFullYear(), hDate.getMonth(), hDate.getDate()).getTime();
          return hDateTime === dateTime;
        })
        .reduce((sum, h) => sum + h.duration, 0);
      
      weeklyTrend.push({
        day: days[date.getDay()],
        minutes: dayMinutes
      });
    }
    
    return {
      streak,
      totalHours,
      totalMinutes: remainingMinutes,
      totalWorks,
      weeklyTrend
    };
  }, [practiceHistory]);
  
  // 格式化日期显示
  const formatDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const targetDate = new Date(date);
    const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    
    if (targetDay.getTime() === today.getTime()) return '今天';
    if (targetDay.getTime() === yesterday.getTime()) return '昨天';
    
    return `${targetDate.getMonth() + 1}月${targetDate.getDate()}日`;
  };
  
  // 格式化时长
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时 ${mins}分钟` : `${hours}小时`;
  };
  
  // 最近3条记录
  const recentHistory = practiceHistory.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen bg-bg-serenity pb-32">
      <Header title="练习统计报告" />

      <main className="p-4 space-y-4 pt-6">
        <div className="bg-gradient-to-br from-primary to-[#2193b0] p-6 rounded-[2rem] text-white shadow-xl shadow-primary/20 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-white/80 text-sm font-medium mb-1">已连续练习</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter">{stats.streak}</span>
              <span className="text-xl font-bold">天</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <span className="material-symbols-outlined text-[150px] rotate-12">brush</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[2rem] border border-black/5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-xl">schedule</span>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">总时长</p>
            </div>
            <div className="flex items-baseline gap-1 text-text-main">
              <span className="text-2xl font-black">{stats.totalHours}</span>
              <span className="text-xs font-bold text-slate-300">h</span>
              <span className="text-2xl font-black ml-1">{stats.totalMinutes}</span>
              <span className="text-xs font-bold text-slate-300">m</span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-[2rem] border border-black/5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-xl">palette</span>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">作品数</p>
            </div>
            <div className="flex items-baseline gap-1 text-text-main">
              <span className="text-2xl font-black">{stats.totalWorks}</span>
              <span className="text-xs font-bold text-slate-300">张</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-black/5 shadow-sm">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-lg font-black">本周趋势</h3>
              <p className="text-sm text-slate-400 font-medium">累计练习 {stats.weeklyTrend.reduce((sum, day) => sum + day.minutes, 0)} 分钟</p>
            </div>
            <div className="flex items-center gap-1 text-primary bg-primary/10 px-3 py-1.5 rounded-xl">
              <span className="material-symbols-outlined text-sm font-bold">trending_up</span>
              <span className="text-xs font-bold">+15%</span>
            </div>
          </div>

          <div className="h-48 w-full flex items-end justify-between gap-2">
            {stats.weeklyTrend.map((day, i) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-slate-100 rounded-full relative" style={{ height: '120px' }}>
                  <div
                    className={`absolute bottom-0 left-0 right-0 rounded-full ${i === stats.weeklyTrend.length - 1 ? 'bg-primary' : 'bg-slate-200'}`}
                    style={{ height: `${(day.minutes / 90) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="text-lg font-black">最近记录</h3>
            {practiceHistory.length > 0 && (
              <button 
                onClick={clearPracticeHistory}
                className="text-rose-500 text-sm font-bold active:scale-95 transition-transform"
              >
                清空记录
              </button>
            )}
          </div>
          {recentHistory.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-black/5 text-center">
              <div className="size-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-4xl text-slate-300">history</span>
              </div>
              <p className="text-slate-400 font-bold">暂无练习记录</p>
              <p className="text-sm text-slate-300 mt-2">完成练习后会在这里显示</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentHistory.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-3xl border border-black/5 flex items-center justify-between active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-4">
                    <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-[#2193b0] flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-2xl">brush</span>
                    </div>
                    <div>
                      <p className="font-black text-text-main">{formatDate(item.date)}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {formatDuration(item.duration)} • {item.imageCount}张作品
                      </p>
                      <p className="text-[10px] text-slate-300 mt-0.5">{item.folderName}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-200">chevron_right</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
