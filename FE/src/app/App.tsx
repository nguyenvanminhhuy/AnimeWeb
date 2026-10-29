import { SessionProvider } from '../features/auth/SessionProvider';
import { RouterProvider } from 'react-router-dom';
import { router } from '../routes/router';
export function App() {
  return (
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  );
}
