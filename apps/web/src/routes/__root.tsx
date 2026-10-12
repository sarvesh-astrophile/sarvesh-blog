import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { Toaster } from "@sarvesh-blog/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouteContext,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";
import { ThemeProvider } from "next-themes";

import { authClient } from "@/lib/auth-client";
import { getToken } from "@/lib/auth-server";

import Header from "../components/header";

import appCss from "../index.css?url";

const getAuth = createServerFn({ method: "GET" }).handler(async () => {
  return await getToken();
});

export interface RouterAppContext {
  queryClient: QueryClient;
  convexQueryClient: ConvexQueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "My App",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: RootDocument,
  beforeLoad: async (ctx) => {
    const token = await getAuth();
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
    }
    return {
      isAuthenticated: !!token,
      token,
    };
  },
});

function RootDocument() {
  const context = useRouteContext({ from: Route.id });
  const isHome = useRouterState({
    select: (state) => state.location.pathname === "/",
  });
  return (
    <ConvexBetterAuthProvider
      client={context.convexQueryClient.convexClient}
      authClient={authClient}
      initialToken={context.token}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <HeadContent />
        </head>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className={isHome ? "min-h-svh" : "grid h-svh grid-rows-[auto_1fr]"}>
              {!isHome && <Header />}
              <Outlet />
            </div>
            <Toaster richColors />
            <TanStackRouterDevtools position="bottom-left" />
          </ThemeProvider>
          <Scripts />
        </body>
      </html>
    </ConvexBetterAuthProvider>
  );
}
