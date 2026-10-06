import type { ReactNode } from "react";

/** Re-mounts on every navigation: lapis shutter retracts to reveal the new page (pure CSS, works without JS). */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="shutter" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
      {children}
    </>
  );
}
