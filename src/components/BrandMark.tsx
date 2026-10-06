/** Animated wordmark: letters rise in, hold, sweep out and return on a loop; a lapis bar scans across. */
export function BrandMark({ text = "BlackGust" }: { text?: string }) {
  return (
    <span className="bm" aria-label={text}>
      <span className="bm-l" aria-hidden="true">
        {Array.from(text).map((ch, i) => (
          <span key={i} className="bm-c" style={{ ["--i" as string]: i }}>{ch}</span>
        ))}
      </span>
      <span className="bm-scan" aria-hidden="true" />
    </span>
  );
}
