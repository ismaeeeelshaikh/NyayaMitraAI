import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import CrisisButton from '../shared/CrisisButton';

export default function AppLayout() {
    return (
        <div className="min-h-screen h-screen bg-surface-50 text-slate-800 flex flex-col font-sans antialiased overflow-hidden">
            <Navbar />
            <main className="flex-1 w-full relative min-h-0 overflow-y-auto">
                <Outlet />
                <Footer />
            </main>
            <CrisisButton />
        </div>
    );
}
