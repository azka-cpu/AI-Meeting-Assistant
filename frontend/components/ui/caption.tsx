
interface CaptionProps {
    children: React.ReactNode;
    className?: string;
    color?: 'blue' | 'purple' | 'slate';
}

const colorStyles = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    slate: 'text-slate-400',
};

export default function Caption({
    children,
    className = '',
    color = 'blue',
}: CaptionProps) {
    return (
        <p
            style={{ fontFamily: 'var(--font-handwritten)' }}
            className={`text-2xl leading-tight ${colorStyles[color]} ${className}`}
        >
            {children}
        </p>
    );
}
