import { CssBaseline, ThemeProvider } from "@mui/material";
import AppRoutes from "./app.routes";
import { AuthProvider } from "./providers/AuthProvider";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { theme, store, SecurityManager } from "@ui/ui-lib";
import { useAuth } from "./providers/AuthProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export function isStandalone(): boolean {
  return !window.location.pathname.startsWith("/iwork");
}

const InnerApp = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <Provider store={store}>
      <AuthProvider>
        <AuthConsumer>
          <AppRoutes />
        </AuthConsumer>
      </AuthProvider>
    </Provider>
  </ThemeProvider>
);

const AuthConsumer = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return <SecurityManager user={user}>{children}</SecurityManager>;
};

export function App() {
  if (isStandalone()) {
    return (
      <QueryClientProvider client={queryClient}>
        <InnerApp />
      </QueryClientProvider>
    );
  }

  return <InnerApp />;
}

export default App;
