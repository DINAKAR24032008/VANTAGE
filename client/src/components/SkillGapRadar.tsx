import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import { GapItem } from '../types';

interface Props {
  breakdown: GapItem[];
}

export const SkillGapRadar: React.FC<Props> = ({ breakdown }) => {
  if (!breakdown || breakdown.length === 0) {
    return (
      <div className="p-8 text-center text-textSecondary text-sm">
        No competency profile data available. Complete self-assessment to view skill gap analytics.
      </div>
    );
  }

  const chartData = breakdown.map((item) => ({
    name: item.competencyName.length > 24 ? `${item.competencyName.slice(0, 22)}...` : item.competencyName,
    fullName: item.competencyName,
    'Current Level': item.currentLevel,
    'Required Level': item.requiredLevel,
    'Skill Gap': item.gap,
  }));

  return (
    <div className="w-full">
      <div className="h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#163016" />
            <XAxis
              dataKey="name"
              stroke="#6FA36F"
              fontSize={11}
              interval={0}
              angle={-15}
              textAnchor="end"
            />
            <YAxis
              domain={[0, 5]}
              ticks={[1, 2, 3, 4, 5]}
              stroke="#6FA36F"
              fontSize={12}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-surface text-textPrimary p-3 rounded-xl shadow-xl text-xs border border-surfaceBorder">
                      <p className="font-bold text-accent mb-1">{data.fullName}</p>
                      <p className="text-textSecondary">
                        Current Level: <span className="font-bold text-textPrimary">{data['Current Level']} / 5</span>
                      </p>
                      <p className="text-textSecondary">
                        Required Benchmark: <span className="font-bold text-textPrimary">{data['Required Level']} / 5</span>
                      </p>
                      <p className="text-amber-400 font-semibold mt-1">
                        Deficiency Gap: {data['Skill Gap']} levels
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: '#6FA36F' }} />
            <Bar dataKey="Current Level" fill="#39FF14" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Required Level" fill="#CFFFC2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Metric Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {breakdown.map((item) => (
          <div
            key={item.competencyId}
            className={`p-3 rounded-xl border flex flex-col justify-between ${
              item.gap === 0
                ? 'bg-surface border-accent/30'
                : item.gap >= 2
                ? 'bg-surface border-rose-500/30'
                : 'bg-surface border-amber-500/30'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-xs text-textPrimary line-clamp-1">{item.competencyName}</span>
              <span
                className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                  item.gap === 0
                    ? 'bg-accent/15 text-accent border-accent/40 shadow-[0_0_6px_rgba(57,255,20,0.3)]'
                    : item.gap >= 2
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                }`}
              >
                {item.gap === 0 ? 'Target Met' : `-${item.gap} Gap`}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-textSecondary mt-2">
              <span>Level {item.currentLevel} of {item.requiredLevel}</span>
              <div className="w-20 bg-border rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full ${item.gap === 0 ? 'bg-accent' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, (item.currentLevel / item.requiredLevel) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
