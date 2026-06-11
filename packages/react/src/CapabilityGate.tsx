import type { ReactNode } from "react";

/**
 * Renders `children` when the capability is present, otherwise `fallback`.
 * e.g. <CapabilityGate has={caps.webgpu} fallback={<ServerChat/>}><LocalChat/></CapabilityGate>
 */
export function CapabilityGate({
  has,
  fallback,
  children,
}: {
  has: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  return <>{has ? children : fallback ?? null}</>;
}
