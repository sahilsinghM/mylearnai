const PUBLIC_PATH_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/auth/callback",
  "/roadmap",
];

export function isPublicPath(pathname: string): boolean {
  return pathname === "/" || PUBLIC_PATH_PREFIXES.some((path) => pathname.startsWith(path));
}
