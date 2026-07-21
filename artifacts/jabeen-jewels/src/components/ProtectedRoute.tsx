import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetAdminMe } from "@workspace/api-client-react";

interface ProtectedRouteProps {
  component: React.ComponentType;
}

export function ProtectedRoute({ component: Component }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { data, isLoading, isError } = useGetAdminMe();

  useEffect(() => {
    if (!isLoading && (isError || !data)) {
      setLocation("/admin/login");
    }
  }, [isLoading, isError, data, setLocation]);

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
