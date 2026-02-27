import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import CrisisButton from '../shared/CrisisButton';

export default function AppLayout() {
    return (
        <div className="min-h-screen bg-surface-50 text-slate-800 flex flex-col font-sans antialiased">
            <main className="flex-1 w-full relative">
                <Outlet />
            </main>
            <Navbar />
            <CrisisButton />
        </div>
    );
}
