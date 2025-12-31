import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import { useVectorStore } from '../store/useVectorStore';

export function MetricRadar() {
  const { attributes } = useVectorStore();

  // FIX: Mapping the 6 new attributes correctly
  const data = [
    { subject: 'STRENGTH', A: attributes.strength?.level || 0, fullMark: 100 },
    { subject: 'INTELLECT', A: attributes.intellect?.level || 0, fullMark: 100 },
    { subject: 'CREATE', A: attributes.create?.level || 0, fullMark: 100 },
    { subject: 'MIND', A: attributes.mind?.level || 0, fullMark: 100 },
    { subject: 'WORK', A: attributes.work?.level || 0, fullMark: 100 },
    { subject: 'OTHERS', A: attributes.others?.level || 0, fullMark: 100 },
  ];

  return (
    <div className="w-full h-[250px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#333" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} />
          <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
          <Radar
            name="Vector"
            dataKey="A"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}