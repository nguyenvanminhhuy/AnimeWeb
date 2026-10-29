import { AppProvider } from './provider';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/router';
export function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}
