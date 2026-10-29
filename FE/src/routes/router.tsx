import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { HomePage } from '../pages/HomePage';
import { ExplorePage } from '../pages/ExplorePage';
import { DestinationPage } from '../pages/DestinationPage';
import { routePatterns } from './paths';
import { LibraryPage } from '../pages/LibraryPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { AnimeDetailPage } from '../pages/AnimeDetailPage';

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: routePatterns.home, element: <HomePage /> },
      { path: routePatterns.explore, element: <ExplorePage /> },
      { path: routePatterns.animeDetail, element: <AnimeDetailPage /> },
      { path: routePatterns.watch, element: <DestinationPage kind="watch" /> },
      { path: routePatterns.library, element: <LibraryPage /> },
      { path: routePatterns.login, element: <LoginPage /> },
      { path: routePatterns.register, element: <RegisterPage /> },
      { path: '*', element: <DestinationPage kind="not-found" /> },
    ],
  },
]);
