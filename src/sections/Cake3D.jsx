import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const PI = Math.PI;

/* ---------- dimensions (world units) ---------- */
const PLATE_R = 1.95;
const PLATE_H = 0.1;
const R1 = 1.5; // bottom tier
const H1 = 1.0;
const R2 = 1.0; // top tier
const H2 = 0.8;
const Y1 = PLATE_H;
const Y2 = Y1 + H1;
const Y_TOP = Y2 + H2;

const GAP = 0.05; // width of the dark "cut" groove while the cake is closed
const SPLIT_X = 2.05; // how far each half travels
const YAW = 0.28; // each half turns its cut face towards the viewer
const TILT = 0.07; // and leans slightly outward

const FOV = 35;
const TARGET = new THREE.Vector3(0, 1.1, 0);
const NEED_W_CLOSED = 4.9; // world width to keep visible when closed
const NEED_W_OPEN = 8.2; // ... and when split
const NEED_H = 4.6;

/* ---------- helpers ---------- */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const easeInOutCubic = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

// Layer colours seen on the cut face, listed top -> bottom as [colour, fraction].
const BANDS_BOTTOM = [
  ['#F1DFC4', 0.07],
  ['#D9B787', 0.25],
  ['#F8EEDB', 0.07],
  ['#6B4331', 0.25],
  ['#F8EEDB', 0.07],
  ['#D9B787', 0.29],
];
const BANDS_TOP = [
  ['#B07C58', 0.1],
  ['#6B4331', 0.3],
  ['#F8EEDB', 0.09],
  ['#D9B787', 0.31],
  ['#F8EEDB', 0.07],
  ['#6B4331', 0.13],
];

function makeCutTexture(bands, seed) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const g = canvas.getContext('2d');
  let y = 0;
  bands.forEach(([color, fraction]) => {
    const h = fraction * 256;
    g.fillStyle = color;
    g.fillRect(0, y, 128, Math.ceil(h));
    y += h;
  });
  const rand = rng(seed);
  for (let i = 0; i < 460; i++) {
    g.fillStyle = rand() > 0.5 ? 'rgba(255,240,215,0.22)' : 'rgba(70,40,20,0.15)';
    g.fillRect(rand() * 128, rand() * 256, 1 + rand() * 1.6, 1 + rand() * 1.6);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function useCakeMaterials() {
  const mats = useMemo(() => {
    const std = (color, extra = {}) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...extra });
    return {
      cream: std('#F4E6D0', { roughness: 0.5 }),
      creamLight: std('#FBF3E6', { roughness: 0.42 }),
      mocha: std('#9B6C4C', { roughness: 0.5 }),
      choc: new THREE.MeshPhysicalMaterial({
        color: '#4B2D1D',
        roughness: 0.32,
        clearcoat: 0.6,
        clearcoatRoughness: 0.3,
      }),
      rose: std('#E48CA6', { roughness: 0.42 }),
      plate: std('#F8F1E7', { roughness: 0.25, metalness: 0.05 }),
      wax: std('#FFF6EA', { roughness: 0.6 }),
      wick: std('#2A1A12'),
      seam: std('#3F2618', { roughness: 0.95 }),
      flame: new THREE.MeshBasicMaterial({ color: '#FFD37A', toneMapped: false }),
      halo: new THREE.MeshBasicMaterial({
        color: '#FFB454',
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        toneMapped: false,
      }),
      cutBottom: new THREE.MeshStandardMaterial({
        map: makeCutTexture(BANDS_BOTTOM, 7),
        roughness: 0.85,
      }),
      cutTop: new THREE.MeshStandardMaterial({
        map: makeCutTexture(BANDS_TOP, 19),
        roughness: 0.85,
      }),
    };
  }, []);

  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
    },
    [mats]
  );
  return mats;
}

/* ---------- building blocks for ONE half ---------- */
// A half-cylinder plus the flat "cut face" that shows once the cake opens.
function HalfCylinder({ side, radius, height, y, body, cut }) {
  const thetaStart = side === 'right' ? 0 : PI;
  return (
    <group position={[0, y, 0]}>
      <mesh material={body} position={[0, height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, height, 56, 1, false, thetaStart, PI]} />
      </mesh>
      <mesh
        material={cut}
        position={[0, height / 2, 0]}
        rotation={[0, side === 'right' ? -PI / 2 : PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[radius * 2, height]} />
      </mesh>
    </group>
  );
}

// Half a torus lying flat: used for the frosting piping around the tier edges.
function Rim({ side, radius, y, tube = 0.07, material }) {
  return (
    <mesh
      material={material}
      position={[0, y, 0]}
      rotation={[PI / 2, 0, side === 'right' ? -PI / 2 : PI / 2]}
      castShadow
    >
      <torusGeometry args={[radius - 0.03, tube, 14, 48, PI]} />
    </mesh>
  );
}

// Points evenly spread over this half, at a given radius.
function arc(side, count, radius) {
  const start = side === 'right' ? -PI / 2 : PI / 2;
  return Array.from({ length: count }, (_, k) => {
    const psi = start + ((k + 0.5) * PI) / count;
    return { x: radius * Math.cos(psi), z: radius * Math.sin(psi), psi };
  });
}

function Pearls({ side, count, radius, y, size, materials }) {
  const points = useMemo(() => arc(side, count, radius), [side, count, radius]);
  return points.map((p, k) => (
    <mesh
      key={k}
      material={materials[k % materials.length]}
      position={[p.x, y, p.z]}
      scale={[1, 0.85, 1]}
      castShadow
    >
      <sphereGeometry args={[size, 14, 14]} />
    </mesh>
  ));
}

function Drips({ side, count, radius, topY, material, seed }) {
  const items = useMemo(() => {
    const rand = rng(seed);
    return arc(side, count, radius - 0.01).map((p) => ({ ...p, len: 0.16 + rand() * 0.34 }));
  }, [side, count, radius, seed]);
  const r = 0.07;
  return items.map((d, k) => (
    <mesh
      key={k}
      material={material}
      position={[d.x, topY - d.len / 2 - r + 0.01, d.z]}
      castShadow
    >
      <capsuleGeometry args={[r, d.len, 6, 12]} />
    </mesh>
  ));
}

function Shavings({ side, count, material, seed }) {
  const items = useMemo(() => {
    const rand = rng(seed);
    const start = side === 'right' ? -PI / 2 : PI / 2;
    return Array.from({ length: count }, () => {
      const psi = start + 0.25 + rand() * (PI - 0.5);
      const rad = 0.2 + rand() * 0.55;
      return {
        x: rad * Math.cos(psi),
        z: rad * Math.sin(psi),
        rot: [rand() * 0.5 - 0.25, rand() * PI, rand() * 0.5 - 0.25],
        w: 0.14 + rand() * 0.1,
      };
    });
  }, [side, count, seed]);
  return items.map((s, k) => (
    <mesh key={k} material={material} position={[s.x, Y_TOP + 0.03, s.z]} rotation={s.rot} castShadow>
      <boxGeometry args={[s.w, 0.022, 0.05]} />
    </mesh>
  ));
}

function Candle({ x, z, index, fx, mats, rose }) {
  const flame = useRef();
  useFrame(({ clock }) => {
    if (!flame.current) return;
    const t = clock.elapsedTime;
    const { flick, glow } = fx.current;
    const s = Math.sin(t * 16 + index * 2.1) * 0.6 + Math.sin(t * 27 + index) * 0.4;
    flame.current.scale.set(1 - 0.05 * s * flick, 1 + 0.14 * s * flick + 0.25 * glow, 1 - 0.05 * s * flick);
    flame.current.rotation.z = 0.08 * Math.sin(t * 9 + index) * flick;
  });
  return (
    <group position={[x, Y_TOP, z]}>
      <mesh material={rose ? mats.rose : mats.wax} position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.052, 0.052, 0.5, 18]} />
      </mesh>
      <mesh material={mats.creamLight} position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.056, 0.056, 0.05, 18]} />
      </mesh>
      <mesh material={mats.creamLight} position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.056, 0.056, 0.05, 18]} />
      </mesh>
      <mesh material={mats.wick} position={[0, 0.535, 0]}>
        <cylinderGeometry args={[0.007, 0.007, 0.07, 6]} />
      </mesh>
      <group ref={flame} position={[0, 0.62, 0]}>
        <mesh material={mats.flame} scale={[1, 1.7, 1]}>
          <sphereGeometry args={[0.055, 16, 16]} />
        </mesh>
        <mesh material={mats.halo}>
          <sphereGeometry args={[0.17, 16, 16]} />
        </mesh>
      </group>
    </group>
  );
}

const Half = ({ side, fx, mats, groupRef }) => {
  const s = side === 'right' ? 1 : -1;
  const light = useRef();
  const candles = [
    { x: s * 0.42, z: -0.2, rose: side === 'left' },
    { x: s * 0.46, z: 0.26, rose: side === 'right' },
  ];

  useFrame(({ clock }) => {
    if (!light.current) return;
    const t = clock.elapsedTime;
    light.current.intensity =
      (1.1 + 0.15 * Math.sin(t * 13 + s)) * (1 + fx.current.glow * 1.6);
  });

  return (
    <group ref={groupRef} position={[s * (GAP / 2), 0, 0]}>
      {/* plate */}
      <HalfCylinder side={side} radius={PLATE_R} height={PLATE_H} y={0} body={mats.plate} cut={mats.plate} />

      {/* bottom tier: cream frosting, chocolate drips, rose ribbon */}
      <HalfCylinder side={side} radius={R1} height={H1} y={Y1} body={mats.cream} cut={mats.cutBottom} />
      <Rim side={side} radius={R1} y={Y2} material={mats.creamLight} />
      <Rim side={side} radius={R1 + 0.03} y={Y1 + 0.42} tube={0.028} material={mats.rose} />
      <Drips side={side} count={7} radius={R1} topY={Y2} material={mats.choc} seed={side === 'right' ? 11 : 23} />
      <Pearls side={side} count={13} radius={R1 + 0.015} y={Y1 + 0.09} size={0.085} materials={[mats.creamLight]} />
      <Pearls side={side} count={8} radius={1.26} y={Y2 + 0.08} size={0.1} materials={[mats.rose, mats.creamLight]} />

      {/* top tier: coffee frosting, cream piping, pink details */}
      <HalfCylinder side={side} radius={R2} height={H2} y={Y2} body={mats.mocha} cut={mats.cutTop} />
      <Rim side={side} radius={R2} y={Y_TOP} material={mats.creamLight} />
      <Pearls side={side} count={9} radius={R2 + 0.012} y={Y2 + 0.08} size={0.065} materials={[mats.creamLight, mats.rose]} />
      <Pearls side={side} count={4} radius={0.74} y={Y_TOP + 0.06} size={0.07} materials={[mats.rose]} />
      <Shavings side={side} count={7} material={mats.choc} seed={side === 'right' ? 5 : 9} />

      {/* candles */}
      {candles.map((c, i) => (
        <Candle key={i} x={c.x} z={c.z} index={i + (side === 'right' ? 2 : 0)} fx={fx} mats={mats} rose={c.rose} />
      ))}
      <pointLight
        ref={light}
        position={[s * 0.45, Y_TOP + 0.7, 0.05]}
        color="#FFB765"
        distance={3.4}
        decay={2}
        intensity={1.1}
      />
    </group>
  );
};

/* ---------- the rig: animation, camera, lights ---------- */
function CakeRig({ phase, reduced }) {
  const left = useRef();
  const right = useRef();
  const seam = useRef();
  const root = useRef();
  const ambient = useRef();
  const fx = useRef({ flick: 1, glow: 0 });
  const progress = useRef(0);
  const tween = useRef(null);
  const first = useRef(true);
  const mats = useCakeMaterials();

  const target = phase === 'split' || phase === 'open' ? 1 : 0;

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    tween.current = {
      from: progress.current,
      to: target,
      t0: null,
      dur: reduced ? 0.4 : target === 1 ? 1.35 : 1.0,
    };
  }, [target, reduced]);

  const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const dir = useMemo(() => new THREE.Vector3(0, 0.26, 1).normalize(), []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;

    // --- split tween ---
    const tw = tween.current;
    if (tw) {
      if (tw.t0 === null) tw.t0 = t;
      const k = Math.min(1, (t - tw.t0) / tw.dur);
      progress.current = tw.from + (tw.to - tw.from) * easeInOutCubic(k);
      if (k >= 1) tween.current = null;
    }
    const e = progress.current;

    // --- halves ---
    const place = (group, s) => {
      if (!group) return;
      group.position.set(s * (GAP / 2 + SPLIT_X * e), Math.sin(e * PI) * 0.1, 0.35 * e);
      group.rotation.set(0, s * YAW * e, -s * TILT * e);
    };
    place(left.current, -1);
    place(right.current, 1);
    if (seam.current) seam.current.visible = e < 0.012;

    // --- gentle float while closed ---
    if (root.current) {
      root.current.rotation.y = reduced ? 0 : Math.sin(t * 0.55) * 0.12 * (1 - e);
      root.current.position.y = reduced ? 0 : Math.sin(t * 1.05) * 0.045 * (1 - e);
    }

    // --- glow + flicker ---
    const glowTarget = phase === 'pulse' ? 1 : phase === 'split' ? 0.45 : 0;
    const flickTarget = phase === 'pulse' ? 2.6 : 1;
    fx.current.glow += (glowTarget - fx.current.glow) * Math.min(1, dt * 5);
    fx.current.flick += (flickTarget - fx.current.flick) * Math.min(1, dt * 8);
    if (ambient.current) ambient.current.intensity = 0.75 + fx.current.glow * 0.9;
    mats.halo.opacity = 0.2 + fx.current.glow * 0.3;

    // --- camera: tight on the closed cake, pulls back as it opens ---
    const aspect = state.size.width / state.size.height;
    const distClosed = Math.max(NEED_W_CLOSED / (2 * tanHalf * aspect), NEED_H / (2 * tanHalf));
    const distOpen = Math.max(NEED_W_OPEN / (2 * tanHalf * aspect), NEED_H / (2 * tanHalf));
    const dist = distClosed + (distOpen - distClosed) * e;
    state.camera.position.copy(dir).multiplyScalar(dist).add(TARGET);
    state.camera.lookAt(TARGET);
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0.75} color="#fff1e0" />
      <hemisphereLight args={['#fff6ea', '#bf9d82', 0.55]} />
      <directionalLight
        position={[4, 7, 6]}
        intensity={2.4}
        color="#fff2e2"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <directionalLight position={[-6, 3, 4]} intensity={0.7} color="#ffd8e3" />
      <directionalLight position={[0, 4, -6]} intensity={0.9} color="#ffffff" />

      <group ref={root}>
        <Half side="left" fx={fx} mats={mats} groupRef={left} />
        <Half side="right" fx={fx} mats={mats} groupRef={right} />

        {/* the dark groove that makes the centre cut visible while closed */}
        <group ref={seam}>
          <mesh material={mats.seam} position={[0, PLATE_H / 2, 0]}>
            <boxGeometry args={[GAP, PLATE_H, PLATE_R * 2 - 0.02]} />
          </mesh>
          <mesh material={mats.seam} position={[0, Y1 + H1 / 2, 0]}>
            <boxGeometry args={[GAP, H1, R1 * 2 - 0.02]} />
          </mesh>
          <mesh material={mats.seam} position={[0, Y2 + H2 / 2, 0]}>
            <boxGeometry args={[GAP, H2, R2 * 2 - 0.02]} />
          </mesh>
        </group>
      </group>

      <ContactShadows
        position={[0, 0.002, 0]}
        opacity={0.38}
        scale={11}
        blur={2.6}
        far={3}
        resolution={512}
        color="#5a3825"
      />
    </>
  );
}

export default function Cake3D({ phase, reduced, active }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: FOV, near: 0.1, far: 60, position: [0, 5, 14] }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={{ position: 'absolute', inset: 0, touchAction: 'pan-y' }}
    >
      <CakeRig phase={phase} reduced={reduced} />
    </Canvas>
  );
}
