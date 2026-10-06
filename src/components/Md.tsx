import { Fragment, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/**
 * Tiny inline markdown for message strings: [text](href), **bold**, *em*.
 * Internal links (starting with "/") go through the locale-aware Link.
 */
export function Md({ text }: { text: string }) {
  return <>{parse(text)}</>;
}

const TOKEN = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;

function parse(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(text))) {
    if (m.index > last) out.push(<Fragment key={i++}>{text.slice(last, m.index)}</Fragment>);
    if (m[1] !== undefined) {
      const href = m[2];
      out.push(
        href.startsWith("/") ? (
          <Link key={i++} href={href} className="u">{m[1]}</Link>
        ) : (
          <a key={i++} href={href} className="u" target="_blank" rel="noopener">{m[1]}</a>
        ),
      );
    } else if (m[3] !== undefined) out.push(<b key={i++}>{m[3]}</b>);
    else if (m[4] !== undefined) out.push(<em key={i++}>{m[4]}</em>);
    last = TOKEN.lastIndex;
  }
  if (last < text.length) out.push(<Fragment key={i++}>{text.slice(last)}</Fragment>);
  return out;
}
