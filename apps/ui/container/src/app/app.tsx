import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, Link, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import store from "./redux/store";
import RootToast from "./RootToast";
import { injectFontFaces } from "../styles/fonts";

const IworkApp = lazy(() => import("iwork/App"));
const IbpApp = lazy(() => import("ibp/App"));

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false },
  },
});

export function App() {
  const location = useLocation();
  const isMicroFrontendRoute =
    location.pathname.startsWith("/iwork") ||
    location.pathname.startsWith("/ibp");

  useEffect(() => {
    injectFontFaces();
  }, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        {!isMicroFrontendRoute && (
          <>
            {/* Only show nav if NOT in MFE */}
            <br />
            <hr />
            <br />
            <div role="navigation">
              <ul>
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <Link to="/iwork">Iwork</Link>
                </li>
                <li>
                  <Link to="/ibp">Ibp</Link>
                </li>
              </ul>
            </div>
          </>
        )}

        <Routes>
          <Route
            path="/"
            element={
              <div>
                This is the generated root route.{" "}
                <Link to="/iwork">Go to Iwork.</Link>
              </div>
            }
          />
          <Route
            path="/iwork/*"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                {/* <IworkApp /> */}
                <IworkApp key={location.key} />
              </Suspense>
            }
          />
          <Route
            path="/ibp/*"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                {/* <IbpApp /> */}
                <IbpApp key={location.key} />
              </Suspense>
            }
          />
        </Routes>
        <RootToast />
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
