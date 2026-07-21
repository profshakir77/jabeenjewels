import { useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetAdminMe } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  component: React.ComponentType;
}

export function ProtectedRoute({ component: Component }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { data, isLoading, isError } = useGetAdminMe({
    query: { retry: false, staleTime: 0 }
  });

  const redirected = useRef(false);

  useEffect(() => {
    if (!isLoading && (isError || !data) && !redirected.current) {
      redirected.current = true;
      setLocation("/admin/login");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isError, data]);

  // Show spinner while checking auth OR while redirect is in flight
  if (isLoading || (isError || !data)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <Component />;
}
