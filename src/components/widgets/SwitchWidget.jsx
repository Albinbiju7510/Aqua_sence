import { Power } from 'lucide-react';

export default function SwitchWidget({ title, isOn, onToggle, color = "#2ecc71" }) {
    return (
        <div className="blynk-card flex flex-col items-center justify-center h-full min-h-[140px]">
            <div className="mb-4 text-[#8e8e93] text-xs font-semibold uppercase tracking-wider">
                {title}
            </div>

            <button
                onClick={onToggle}
                className={`
          w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl
          ${isOn ? 'scale-110 shadow-[0_0_20px_rgba(0,0,0,0.3)]' : 'bg-[#161616] text-[#333] scale-100'}
        `}
                style={{
                    backgroundColor: isOn ? color : '#161616',
                    boxShadow: isOn ? `0 0 20px ${color}40` : 'none'
                }}
            >
                <Power size={24} className={isOn ? 'text-white' : 'text-[#333]'} />
            </button>

            <div className="mt-4 text-xs font-medium" style={{ color: isOn ? color : '#555' }}>
                {isOn ? 'ACTIVE' : 'OFF'}
            </div>
        </div>
    );
}
