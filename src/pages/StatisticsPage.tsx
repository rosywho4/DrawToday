import React from 'react';
import { INITIAL_STATS } from '../data/mockData';
import Header from '../components/layout/Header';

export default function StatisticsPage() {
  const stats = INITIAL_STATS;

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
            <button className="text-primary text-sm font-bold">查看全部</button>
          </div>
          <div className="space-y-3">
            {[
              { date: '今天', count: 8, time: '45分钟', img: 'https://picsum.photos/seed/eye/100/100' },
              { date: '昨天', count: 12, time: '1小时 10分', img: 'https://picsum.photos/seed/face/100/100' },
              { date: '10月24日', count: 5, time: '30分钟', img: 'https://picsum.photos/seed/hand/100/100' }
            ].map((item, i) => (
              <div key={i} className="bg-white p-4 rounded-3xl border border-black/5 flex items-center justify-between active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-slate-50 overflow-hidden border border-slate-100">
                    <img src={item.img} alt="History" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-black text-text-main">{item.date}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.time} • {item.count}张作品</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-200">chevron_right</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
