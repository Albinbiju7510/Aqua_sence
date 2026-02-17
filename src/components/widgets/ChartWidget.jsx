import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ChartWidget({ title, data, dataKey, color = "#2ecc71" }) {
    return (
        <div className="blynk-card h-full min-h-[200px] flex flex-col">
            <div className="mb-4 text-[#8e8e93] text-xs font-semibold uppercase tracking-wider pl-2">
                {title}
            </div>

            <div className="grow w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <XAxis
                            dataKey="time"
                            hide={true}
                        />
                        <YAxis
                            hide={true}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e1e1e',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                            itemStyle={{ color: color }}
                            labelStyle={{ color: '#888' }}
                        />
                        <Line
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 0, fill: '#fff' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
