// Ruta del fichero: /frontend/src/router/Router.tsx

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from '@layouts/MainLayout';
import ProjectList from '@pages/ProjectList';
import ProjectEdit from '@pages/ProjectEdit';
import ErrorBoundary from '@components/common/ErrorBoundary';
import { useAuth } from '@context/AuthContext';
import Loading from '@components/common/Loading';

const Router = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  const router = createBrowserRouter([
    {
      path: '/',
      element: <MainLayout />,
      errorElement: <ErrorBoundary />,
      children: [
        {
          index: true,
          element: <ProjectList />,
        },
        {
          path: 'projects',
          children: [
            {
              index: true,
              element: <ProjectList />,
            },
            {
              path: ':id',
              element: <ProjectEdit />,
            }
          ]
        },
        {
          path: 'servers',
          children: [
            {
              path: 'caspar/config',
              element: <CasparServerConfig />
            }
          ]
        }
      ]
    }
  ]);

  return <RouterProvider router={router} />;
};

export default Router;