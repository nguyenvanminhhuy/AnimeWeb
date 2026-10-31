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
import { AdminAnimePage } from '@/app/routes/admin/anime';
import { AdminAnimeFormPage } from '@/app/routes/admin/anime-form';
import { AdminGenresPage } from '@/app/routes/admin/genres';
import { AdminUsersPage } from '@/app/routes/admin/users';
import { AdminNotFoundPage } from '@/app/routes/admin/not-found';

export const router = createBrowserRouter([
  {
    path: routePatterns.admin,
    element: <AdminRoot />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: routePatterns.adminAnime, element: <AdminAnimePage /> },
      { path: routePatterns.adminAnimeNew, element: <AdminAnimeFormPage /> },
      { path: routePatterns.adminAnimeEdit, element: <AdminAnimeFormPage /> },
      { path: routePatterns.adminGenres, element: <AdminGenresPage /> },
      { path: routePatterns.adminUsers, element: <AdminUsersPage /> },
      {
        path: routePatterns.adminEpisodes,
        lazy: async () => ({
          Component: (await import('@/app/routes/admin/episodes')).AdminEpisodesPage,
        }),
      },
      {
        path: routePatterns.adminEpisodeNew,
        lazy: async () => ({
          Component: (await import('@/app/routes/admin/episode-form')).AdminEpisodeFormPage,
        }),
      },
      {
        path: routePatterns.adminEpisodeEdit,
        lazy: async () => ({
          Component: (await import('@/app/routes/admin/episode-form')).AdminEpisodeFormPage,
        }),
      },
      { path: '*', element: <AdminNotFoundPage /> },
      {
        path: routePatterns.adminComments,
        lazy: async () => ({
          Component: (await import('@/app/routes/admin/comments')).AdminCommentsPage,
        }),
      },
      {
        path: routePatterns.adminPlayback,
        lazy: async () => ({
          Component: (await import('@/app/routes/admin/playback')).AdminPlaybackPage,
        }),
      },
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
      {
        path: routePatterns.changePassword,
        lazy: async () => ({
          Component: (await import('@/app/routes/change-password')).ChangePasswordPage,
        }),
      },
      { path: routePatterns.login, element: <LoginPage /> },
      { path: routePatterns.register, element: <RegisterPage /> },
      { path: '*', element: <DestinationPage /> },
    ],
  },
]);
