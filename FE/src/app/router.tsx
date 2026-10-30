import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/main-layout';
import { HomePage } from '@/app/routes/home';
import { ExplorePage } from '@/app/routes/explore';
import { DestinationPage } from '@/app/routes/destination';
import { routePatterns } from '@/config/paths';
import { LibraryPage } from '@/app/routes/library';
import { LoginPage } from '@/app/routes/login';
import { RegisterPage } from '@/app/routes/register';
import { AnimeDetailPage } from '@/app/routes/anime-detail';
import { WatchPage } from '@/app/routes/watch';
import { ProfilePage } from '@/app/routes/profile';
import { AdminRoot } from '@/app/routes/admin/root';
import { AdminDashboardPage } from '@/app/routes/admin/dashboard';
import { AdminNotFoundPage } from '@/app/routes/admin/not-found';

export const router = createBrowserRouter([
  {
    path: routePatterns.admin,
    element: <AdminRoot />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: '*', element: <AdminNotFoundPage /> },
    ],
  },
  {
    element: <MainLayout />,
    children: [
      { path: routePatterns.home, element: <HomePage /> },
      { path: routePatterns.explore, element: <ExplorePage /> },
      { path: routePatterns.animeDetail, element: <AnimeDetailPage /> },
      { path: routePatterns.watch, element: <WatchPage /> },
      { path: routePatterns.library, element: <LibraryPage /> },
      { path: routePatterns.profile, element: <ProfilePage /> },
      { path: routePatterns.login, element: <LoginPage /> },
      { path: routePatterns.register, element: <RegisterPage /> },
      { path: '*', element: <DestinationPage /> },
    ],
  },
]);
