// Lightweight fallback used when WebGL is unavailable (or the 3D chunk fails
// to load). The cake is drawn twice, each copy clipped to one half, so the two
// halves genuinely separate.
function CakeArt() {
  return (
    <div className="cc">
      <div className="cc__plate" />
      <div className="cc__tier cc__tier--bottom" />
      <div className="cc__tier cc__tier--top" />
      <div className="cc__candle cc__candle--a"><i /></div>
      <div className="cc__candle cc__candle--b"><i /></div>
      <div className="cc__candle cc__candle--c"><i /></div>
    </div>
  );
}

export default function CakeCSS({ phase }) {
  const open = phase === 'split' || phase === 'open';
  return (
    <div
      className={`ccake${open ? ' is-open' : ''}${phase === 'pulse' ? ' is-pulse' : ''}`}
      aria-hidden="true"
    >
      <div className="ccake__stage">
        <div className="ccake__half ccake__half--left"><CakeArt /></div>
        <div className="ccake__half ccake__half--right"><CakeArt /></div>
        <div className="ccake__seam" />
      </div>
    </div>
  );
}
