const S: Record<string, { cls: string; emoji: string }> = {
    LOW: { cls: 'bg-green-100  text-green-800  border-green-300', emoji: '🟢' },
    MEDIUM: { cls: 'bg-yellow-100 text-yellow-800 border-yellow-300', emoji: '🟡' },
    HIGH: { cls: 'bg-red-100   text-red-800    border-red-300', emoji: '🔴' },
};

export default function RiskBadge({ level, score }: { level: 'LOW' | 'MEDIUM' | 'HIGH'; score: number }) {
    const s = S[level] || S.LOW;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>
            {s.emoji} {level} Risk · {score}/100
        </span>
    );
}
