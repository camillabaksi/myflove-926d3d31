import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { AppError } from "./components/app-error";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: false,
    defaultPreloadStaleTime: 0,
    defaultViewTransition: true,
    // Utan detta blir varje renderingsfel en vit skärm.
    defaultErrorComponent: ({ error }) => <AppError error={error} />,
  });

  return router;
};
