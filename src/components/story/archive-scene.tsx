"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

type SceneProps = {
  progress: number;
  reducedMotion: boolean;
};

function ArchiveDust({ progress, reducedMotion }: SceneProps) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const buffer = new Float32Array(720 * 3);
    for (let index = 0; index < 720; index += 1) {
      const seed = index * 12.9898;
      buffer[index * 3] = (Math.sin(seed) * 0.5 + 0.5) * 22 - 11;
      buffer[index * 3 + 1] = (Math.sin(seed * 1.7) * 0.5 + 0.5) * 12 - 6;
      buffer[index * 3 + 2] = (Math.sin(seed * 2.3) * 0.5 + 0.5) * 18 - 10;
    }
    return buffer;
  }, []);

  useFrame((state, delta) => {
    if (!points.current || reducedMotion) return;
    points.current.rotation.y += delta * (0.012 + progress * 0.018);
    points.current.position.y = Math.sin(state.clock.elapsedTime * 0.09) * 0.18;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#bca66c" opacity={0.28} size={0.018} sizeAttenuation transparent />
    </points>
  );
}

function ArchiveInstrument({ progress, reducedMotion }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current || !inner.current) return;
    const targetX = -2.2 + Math.min(progress * 2.8, 1.2);
    const targetY = 0.2 - progress * 0.55;
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, targetX, 0.035);
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, targetY, 0.035);
    if (!reducedMotion) {
      group.current.rotation.y += delta * 0.035;
      inner.current.rotation.z = state.clock.elapsedTime * -0.055 - progress * 0.7;
    }
  });

  return (
    <group ref={group} position={[-2.2, 0.2, -1.2]} rotation={[0.28, -0.18, 0.08]}>
      <mesh>
        <torusGeometry args={[2.25, 0.018, 12, 160]} />
        <meshStandardMaterial color="#8d7b50" metalness={0.8} roughness={0.34} />
      </mesh>
      <mesh rotation={[Math.PI / 2.45, 0, 0.45]}>
        <torusGeometry args={[1.75, 0.01, 8, 140]} />
        <meshBasicMaterial color="#4b5572" transparent opacity={0.58} />
      </mesh>
      <group ref={inner}>
        <mesh rotation={[0.4, 0.2, 0]}>
          <torusGeometry args={[1.18, 0.012, 8, 120]} />
          <meshBasicMaterial color="#ba9d5d" transparent opacity={0.7} />
        </mesh>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
          const angle = (index / 8) * Math.PI * 2;
          return (
            <mesh
              key={index}
              position={[Math.cos(angle) * 1.18, Math.sin(angle) * 1.18, 0]}
              rotation={[0, 0, angle]}
            >
              <boxGeometry args={[0.14, 0.035, 0.025]} />
              <meshBasicMaterial color={index % 2 ? "#536282" : "#ab8d50"} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function Akshar({ progress, reducedMotion }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const scanner = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.elapsedTime;
    group.current.position.x = -0.45 + Math.sin(progress * Math.PI * 2.3) * 0.45;
    group.current.position.y = 0.75 - progress * 1.1 + (reducedMotion ? 0 : Math.sin(time * 1.35) * 0.09);
    group.current.position.z = 1.1 + Math.sin(progress * Math.PI) * 0.8;
    group.current.rotation.y = -0.45 + progress * 1.8;
    if (scanner.current && !reducedMotion) scanner.current.rotation.z = time * 0.7;
  });

  return (
    <group ref={group} position={[-0.45, 0.75, 1.1]} scale={0.66}>
      <pointLight color="#356dff" intensity={5.2} distance={3.6} />
      <mesh>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial color="#294fba" emissive="#173dba" emissiveIntensity={1.15} metalness={0.72} roughness={0.26} />
      </mesh>
      <mesh ref={scanner} rotation={[1.1, 0.25, 0]}>
        <torusGeometry args={[0.53, 0.018, 8, 80]} />
        <meshBasicMaterial color="#80a6ff" transparent opacity={0.82} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.44, 0.03, 0]} rotation={[0.1, 0, side * -0.32]}>
          <mesh rotation={[0, 0, side * 0.62]}>
            <octahedronGeometry args={[0.22, 0]} />
            <meshStandardMaterial color="#9d8959" emissive="#1b2e62" emissiveIntensity={0.6} metalness={0.9} roughness={0.32} />
          </mesh>
          <mesh position={[side * 0.18, 0, 0]} scale={[1.2, 0.06, 0.06]}>
            <boxGeometry args={[0.26, 0.12, 0.08]} />
            <meshBasicMaterial color="#416cde" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Gati({ progress, reducedMotion }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const orbitA = useRef<THREE.Mesh>(null);
  const orbitB = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.elapsedTime;
    group.current.position.x = 1.7 - progress * 0.45 + (reducedMotion ? 0 : Math.cos(time * 0.62) * 0.1);
    group.current.position.y = -0.35 + Math.sin(progress * Math.PI * 1.8) * 0.75;
    group.current.position.z = 0.1 + Math.cos(progress * Math.PI) * 0.55;
    if (orbitA.current && !reducedMotion) orbitA.current.rotation.x = time * 0.9;
    if (orbitB.current && !reducedMotion) orbitB.current.rotation.y = time * -1.15;
  });

  return (
    <group ref={group} position={[1.7, -0.35, 0.1]} scale={0.58}>
      <pointLight color="#ff5e21" intensity={7} distance={4.2} />
      <mesh>
        <dodecahedronGeometry args={[0.32, 1]} />
        <meshStandardMaterial color="#bd3d16" emissive="#ff4a13" emissiveIntensity={2.2} metalness={0.38} roughness={0.3} />
      </mesh>
      <mesh ref={orbitA} rotation={[0.9, 0.2, 0.25]}>
        <torusGeometry args={[0.62, 0.025, 8, 90]} />
        <meshBasicMaterial color="#ff713b" transparent opacity={0.82} />
      </mesh>
      <mesh ref={orbitB} rotation={[0.2, 0.8, 1.1]}>
        <torusGeometry args={[0.48, 0.012, 8, 90]} />
        <meshBasicMaterial color="#e6a26b" transparent opacity={0.55} />
      </mesh>
      {[0, 1, 2, 3, 4].map((index) => {
        const angle = (index / 5) * Math.PI * 2;
        return (
          <mesh key={index} position={[Math.cos(angle) * 0.84, Math.sin(angle) * 0.5, -0.12]}>
            <tetrahedronGeometry args={[0.07, 0]} />
            <meshBasicMaterial color={index % 2 ? "#ff9a62" : "#8f482b"} />
          </mesh>
        );
      })}
    </group>
  );
}

function GenomeCore({ progress, reducedMotion }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const visible = THREE.MathUtils.smoothstep(progress, 0.48, 0.72);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.scale.setScalar(0.35 + visible * 0.65);
    group.current.position.y = -0.2 + visible * 0.3;
    if (!reducedMotion) group.current.rotation.y += delta * (0.12 + visible * 0.18);
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.18) * 0.12;
  });

  return (
    <group ref={group} position={[0, -0.2, -1.5]} scale={0.35}>
      <pointLight color="#d2b771" intensity={visible * 4.5} distance={5} />
      <mesh>
        <icosahedronGeometry args={[0.9, 2]} />
        <meshStandardMaterial color="#171917" emissive="#806d3f" emissiveIntensity={visible * 0.65} metalness={0.9} roughness={0.24} transparent opacity={0.18 + visible * 0.62} wireframe />
      </mesh>
      {[1.16, 1.42, 1.7].map((radius, index) => (
        <mesh key={radius} rotation={[0.35 + index * 0.45, index * 0.7, index * 0.36]}>
          <torusGeometry args={[radius, 0.012 + index * 0.004, 8, 120]} />
          <meshBasicMaterial color={index === 1 ? "#436dd2" : index === 2 ? "#cf6634" : "#aa9258"} transparent opacity={visible * (0.42 + index * 0.12)} />
        </mesh>
      ))}
    </group>
  );
}

function ArchiveSteps({ progress }: { progress: number }) {
  return (
    <group position={[0, -2.3, -4]} rotation={[0, -0.12, 0]}>
      {Array.from({ length: 11 }, (_, index) => (
        <mesh key={index} position={[(index % 2 ? 1 : -1) * (2.6 + index * 0.18), index * 0.28, -index * 0.62 + progress * 1.2]}>
          <boxGeometry args={[3.6 + index * 0.16, 0.08, 0.9]} />
          <meshStandardMaterial color={index % 2 ? "#111310" : "#0c0e0d"} metalness={0.12} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function World({ progress, reducedMotion }: SceneProps) {
  const world = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!world.current) return;
    world.current.rotation.z = THREE.MathUtils.lerp(world.current.rotation.z, progress * -0.06, 0.025);
    world.current.position.z = THREE.MathUtils.lerp(world.current.position.z, progress * 0.6, 0.02);
  });

  return (
    <group ref={world}>
      <ArchiveDust progress={progress} reducedMotion={reducedMotion} />
      <ArchiveSteps progress={progress} />
      <ArchiveInstrument progress={progress} reducedMotion={reducedMotion} />
      <GenomeCore progress={progress} reducedMotion={reducedMotion} />
      <Akshar progress={progress} reducedMotion={reducedMotion} />
      <Gati progress={progress} reducedMotion={reducedMotion} />
    </group>
  );
}

export function ArchiveScene(props: SceneProps) {
  return (
    <Canvas camera={{ position: [0, 0.15, 7], fov: 42 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
      <fog attach="fog" args={["#070807", 5.5, 18]} />
      <ambientLight intensity={0.32} color="#c8bd9c" />
      <directionalLight position={[4, 6, 5]} intensity={1.25} color="#d3bd82" />
      <directionalLight position={[-5, -1, 3]} intensity={0.7} color="#3156b7" />
      <Suspense fallback={null}><World {...props} /></Suspense>
    </Canvas>
  );
}
