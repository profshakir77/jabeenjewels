import { useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetAdminMe } from "@workspace/api-client-react";

interface ProtectedRouteProps {
  component: React.ComponentType;
}

export function ProtectedRoute({ component: Component }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { data, isLoading, isError } = useGetAdminMe({
    query: { retry: false, staleTime: 0 }
  });

  // Use a ref so the redirect only fires once — avoids the infinite loop caused
  // by wouter's setLocation not being referentially stable across renders.
  const redirected = useRef(false);

  useEffect(() => {
    if (!isLoading && (isError || !data) && !redirected.current) {
      redirected.current = true;
      setLocation("/admin/login");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isError, data]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return null;
  }

  return <Component />;
}
