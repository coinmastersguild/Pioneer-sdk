import Link from "next/link";

type PrivateRouteProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

const RequireAuth = ({
  children,
  redirectTo = '/login',
}: PrivateRouteProps) => {
  // add your own authentication logic here
  const isAuthenticated = true;

  return isAuthenticated ? (
    (children as React.ReactElement)
  ) : (
    <Link href={redirectTo} />
  );
};

export default RequireAuth;
