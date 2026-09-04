
import Sidebar from '@/components/layout/Sidebar';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="ml-64 flex-1 overflow-y-auto bg-slate-50 min-h-screen">
                {children}
            </main>
        </div>
    );
}
