import { Navigate, useLocation } from 'react-router-dom';
import AppLayout from '../layout/AppLayout';
import { useSession } from '../../context/SessionContext';

export default function ProtectedAppLayout() {
    const { session } = useSession();
    const location = useLocation();

    if (!session?.session_id) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return <AppLayout />;
}
