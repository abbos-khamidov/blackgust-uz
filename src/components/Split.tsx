import { Fragment } from "react";

/**
 * Renders a heading's words as masked spans (.w > .wi) so GSAP can reveal them.
 * Supports *emphasis* segments. Words stay real text for SEO and screen readers.
 * CJK text has no spaces, so it is split into short character runs instead.
 */
export function Split({ text }: { text: string }) {
  const segments = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  let k = 0;
  return (
    <>
      {segments.map((seg, si) => {
        const em = seg.startsWith("*") && seg.endsWith("*");
        const body = em ? seg.slice(1, -1) : seg;
        const words = tokenize(body);
        const content = words.map((w) =>
          /^\s+$/.test(w) ? (
            <Fragment key={`s${k++}`}> </Fragment>
          ) : (
            <span className="w" key={`w${k++}`}><span className="wi">{w}</span></span>
          ),
        );
        return em ? <em key={si}>{content}</em> : <Fragment key={si}>{content}</Fragment>;
      })}
    </>
  );
}

function tokenize(s: string): string[] {
  if (/[぀-ヿ㐀-鿿]/.test(s) && !/ /.test(s.trim())) {
    // CJK: chunk into runs of up to 4 characters, keeping punctuation attached
    return s.match(/.{1,4}/gu) ?? [s];
  }
  return s.split(/( +)/).filter(Boolean);
}
