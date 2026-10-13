import { useEffect, useRef, useState } from 'react';
import { Music, VolumeX } from 'lucide-react';

// Music only appears if you drop a legitimate audio file into src/assets/music/
// (mp3, ogg, wav, m4a). It is OFF by default and never autoplays.
const tracks = Object.values(
  import.meta.glob('../assets/music/*.{mp3,ogg,wav,m4a}', {
    eager: true,
    query: '?url',
    import: 'default',
  })
);

export default function MusicToggle() {
  const audio = useRef(null);
  const [on, setOn] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => () => audio.current?.pause(), []);

  if (tracks.length === 0) return null;

  const toggle = async () => {
    try {
      if (!audio.current) {
        audio.current = new Audio(tracks[0]);
        audio.current.loop = true;
        audio.current.volume = 0.5;
      }
      if (on) {
        audio.current.pause();
        setOn(false);
      } else {
        await audio.current.play();
        setOn(true);
      }
      setNote('');
    } catch {
      setOn(false);
      setNote('The music could not start. Please try again.');
    }
  };

  return (
    <div className="music">
      {note && (
        <span className="music__note" role="status">
          {note}
        </span>
      )}
      <button
        type="button"
        className="music__btn"
        onClick={toggle}
        aria-pressed={on}
        aria-label={on ? 'Turn music off' : 'Turn music on'}
      >
        {on ? <Music size={18} /> : <VolumeX size={18} />}
      </button>
    </div>
  );
}
