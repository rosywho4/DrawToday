
import React from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Cell } from 'recharts';
import { PracticeStats } from '../types';

interface StatisticsProps {
  stats: PracticeStats;
}

const Statistics: React.FC<StatisticsProps> = ({ stats }) => {
  return (
    <div className="flex flex-col min-h-screen bg-bg-serenity pb-32">
      <header className="sticky top-0 z-50 bg-bg-serenity/80 backdrop-blur-md px-6 pt-12 pb-4 flex items-center justify-center border-b border-black/5">
        <h2 className="text-lg font-black tracking-tight text-text-main">练习统计报告</h2>
      </header>

      <main className="p-4 space-y-4 pt-6">
        {/* Streak Card */}
        <div className="bg-gradient-to-br from-primary to-[#2193b0] p-6 rounded-[2rem] text-white shadow-xl shadow-primary/20 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-white/80 text-sm font-medium mb-1">已连续练习</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter">{stats.streak}</span>
              <span className="text-xl font-bold">天</span>
            </div>
            {/* User percentage badge removed as requested */}
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <span className="material-symbols-outlined text-[150px] rotate-12">brush</span>
          </div>
        </div>

        {/* Totals Grid */}
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

        {/* Weekly Chart */}
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

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyTrend}>
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} 
                  dy={10}
                />
                <Bar dataKey="minutes" radius={[20, 20, 20, 20]}>
                  {stats.weeklyTrend.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === stats.weeklyTrend.length - 1 ? '#6DD5ED' : '#F1F5F9'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* History List */}
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
};

export default Statistics;
