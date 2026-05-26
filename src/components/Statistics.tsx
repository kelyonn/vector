import { useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Calendar, Target, Zap, Award } from 'lucide-react';

import { calculateStatistics } from '@/lib/statistics';
import { useVectorStore } from '@/store/useVectorStore';
import type { AttributeType } from '@/types';

export function Statistics() {
  const { snapshots, attributes } = useVectorStore();
  const stats = useMemo(() => calculateStatistics(snapshots), [snapshots]);

  // Prepare chart data (last 30 days or all if less)
  const chartData = useMemo(() => {
    const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
    const last30 = sorted.slice(-30);
    
    return last30.map(snapshot => ({
      date: new Date(snapshot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      integrity: snapshot.integrity,
      energy: snapshot.energy,
      tasksCompleted: snapshot.tasksCompleted,
      tasksTotal: snapshot.tasksTotal,
      completionRate: snapshot.tasksTotal > 0 ? Math.round((snapshot.tasksCompleted / snapshot.tasksTotal) * 100) : 0,
    }));
  }, [snapshots]);

  // Attribute growth data
  const attributeData = useMemo(() => {
    const attributeTypes: AttributeType[] = ['strength', 'intellect', 'create', 'mind', 'work', 'others'];
    return attributeTypes.map(type => ({
      name: type.toUpperCase(),
      growth: stats.attributeGrowth[type],
      current: attributes[type]?.level || 0,
    }));
  }, [stats.attributeGrowth, attributes]);

  if (snapshots.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px]">
        <Calendar className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
        <p className="text-muted-foreground text-sm text-center max-w-sm">
          No data yet. Start tracking to see your statistics! Days you were inactive are recorded
          without task completion data and do not affect streaks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Days</span>
          </div>
          <div className="text-2xl font-bold font-mono">{stats.totalDays}</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Current Streak</span>
          </div>
          <div className="text-2xl font-bold font-mono text-primary">{stats.currentStreak}</div>
          <div className="text-xs text-muted-foreground mt-1">Best: {stats.longestStreak}</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Tasks Done</span>
          </div>
          <div className="text-2xl font-bold font-mono">{stats.totalTasksCompleted}</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Avg Integrity</span>
          </div>
          <div className="text-2xl font-bold font-mono">{Math.round(stats.averageIntegrity)}%</div>
        </div>
      </div>

      {/* Integrity & Energy Trend */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-muted-foreground">System Status Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#666" fontSize={10} />
            <YAxis stroke="#666" fontSize={10} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '4px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Area type="monotone" dataKey="integrity" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
            <Area type="monotone" dataKey="energy" stackId="2" stroke="#eab308" fill="#eab308" fillOpacity={0.3} />
            <Legend />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Task Completion Rate */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-muted-foreground">Task Completion Rate</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#666" fontSize={10} />
            <YAxis stroke="#666" fontSize={10} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '4px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Line type="monotone" dataKey="completionRate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Attribute Growth */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-muted-foreground">Attribute Growth</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={attributeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#666" fontSize={10} />
            <YAxis stroke="#666" fontSize={10} />
            <Tooltip
              contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '4px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="growth" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Best Day */}
      {stats.bestDay && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Best Day</h3>
          </div>
          <div className="text-lg font-mono">
            {new Date(stats.bestDay.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Completed {stats.bestDay.tasksCompleted} tasks
          </div>
        </div>
      )}
    </div>
  );
}

