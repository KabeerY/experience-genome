"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

type SceneProps = { progress: number; reducedMotion: boolean };

function Pollen({ progress, reducedMotion }: SceneProps) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(280 * 3);
    for (let index = 0; index < 280; index += 1) {
      const seed = index * 19.173;
      values[index * 3] = Math.sin(seed) * 7.8;
      values[index * 3 + 1] = Math.cos(seed * 1.33) * 4.5;
      values[index * 3 + 2] = Math.sin(seed * 2.17) * 5 - 2;
    }
    return values;
  }, []);

  useFrame((state, delta) => {
    if (!points.current || reducedMotion) return;
    points.current.rotation.y += delta * .018;
    points.current.position.x = Math.sin(state.clock.elapsedTime * .08) * .22 + progress * .25;
  });

  return (
    <points ref={points}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial color="#d49242" opacity={.28} size={.026} sizeAttenuation transparent />
    </points>
  );
}

function Akshar({ progress, reducedMotion }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.elapsedTime;
    group.current.position.x = -1.9 + progress * 2.2;
    group.current.position.y = .45 + Math.sin(progress * Math.PI * 4) * .65 + (reducedMotion ? 0 : Math.sin(time * 1.2) * .07);
    group.current.rotation.z = -.12 + progress * .5;
  });

  return (
    <group ref={group} position={[-1.9, .45, 1]} scale={.52}>
      <pointLight color="#5e8ee9" intensity={2.8} distance={2.5} />
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[.62, .62, .22]} />
        <meshStandardMaterial color="#315fa9" emissive="#244c91" emissiveIntensity={.45} metalness={.22} roughness={.48} />
      </mesh>
      <mesh position={[0, -.62, 0]}><boxGeometry args={[.055, .72, .04]} /><meshBasicMaterial color="#315fa9" transparent opacity={.65} /></mesh>
      <mesh position={[-.72, -.76, 0]}><boxGeometry args={[1.45, .022, .025]} /><meshBasicMaterial color="#315fa9" transparent opacity={.4} /></mesh>
      <mesh position={[-1.38, -.59, 0]}><boxGeometry args={[.7, .018, .02]} /><meshBasicMaterial color="#315fa9" transparent opacity={.23} /></mesh>
    </group>
  );
}

function Gati({ progress, reducedMotion }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.elapsedTime;
    group.current.position.x = 2.2 - progress * 1.6;
    group.current.position.y = -.25 + Math.sin(progress * Math.PI * 3.2) * .9 + (reducedMotion ? 0 : Math.cos(time * 1.4) * .1);
    group.current.rotation.z = progress * -.7;
  });

  return (
    <group ref={group} position={[2.2, -.25, .5]} scale={.5}>
      <pointLight color="#f29a45" intensity={3.8} distance={3} />
      <mesh scale={[1.2, .8, .9]}>
        <icosahedronGeometry args={[.42, 2]} />
        <meshStandardMaterial color="#e88434" emissive="#df6d24" emissiveIntensity={.8} roughness={.38} />
      </mesh>
      {[0, 1, 2, 3].map((index) => (
        <mesh key={index} position={[-.7 - index * .45, -.08 + Math.sin(index) * .16, -.05]} scale={[1.4 - index * .18, .22, .18]}>
          <sphereGeometry args={[.22, 16, 10]} />
          <meshBasicMaterial color="#ef9a46" transparent opacity={.55 - index * .1} />
        </mesh>
      ))}
    </group>
  );
}

function EvidencePath({ progress }: { progress: number }) {
  const reveal = THREE.MathUtils.smoothstep(progress, .2, .54);
  return (
    <group position={[0, -1.75, -1.8]} rotation={[-.35, 0, 0]}>
      {[0, 1, 2].map((index) => (
        <group key={index} position={[-1.35 + index * 1.35, index * .17, index * -.5]} scale={.25 + reveal * .75}>
          <mesh><boxGeometry args={[.82, .08, .72]} /><meshStandardMaterial color={index === 2 ? "#e0a35b" : "#cdb48b"} roughness={.85} /></mesh>
          <mesh position={[0, .075, 0]}><boxGeometry args={[.35, .03, .2]} /><meshBasicMaterial color={index === 2 ? "#e88835" : "#315fa9"} transparent opacity={.35 + reveal * .5} /></mesh>
        </group>
      ))}
    </group>
  );
}

function GenomeSapling({ progress, reducedMotion }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const reveal = THREE.MathUtils.smoothstep(progress, .5, .74);
  useFrame((state) => {
    if (!group.current) return;
    group.current.scale.setScalar(.2 + reveal * .8);
    if (!reducedMotion) group.current.rotation.y = Math.sin(state.clock.elapsedTime * .18) * .16;
  });

  return (
    <group ref={group} position={[0, -.75, -2.8]} scale={.2}>
      <mesh><cylinderGeometry args={[.04, .08, 1.8, 8]} /><meshStandardMaterial color="#8f744e" roughness={.82} /></mesh>
      {[-1, 1].flatMap((side) => [0, 1, 2].map((level) => (
        <group key={`${side}-${level}`} position={[side * (.32 + level * .08), -.35 + level * .45, 0]} rotation={[0, 0, side * (-.75 + level * .08)]}>
          <mesh><boxGeometry args={[.7, .025, .025]} /><meshBasicMaterial color="#8f744e" /></mesh>
          <mesh position={[side * .38, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[.24, .24, .05]} />
            <meshStandardMaterial color={level === 2 ? "#e18a3a" : "#65825a"} roughness={.64} />
          </mesh>
        </group>
      )))}
    </group>
  );
}

function World(props: SceneProps) {
  const world = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!world.current) return;
    world.current.position.z = THREE.MathUtils.lerp(world.current.position.z, props.progress * .35, .025);
    world.current.rotation.z = THREE.MathUtils.lerp(world.current.rotation.z, props.progress * -.035, .025);
  });
  return (
    <group ref={world}>
      <Pollen {...props} />
      <Akshar {...props} />
      <Gati {...props} />
      <EvidencePath progress={props.progress} />
      <GenomeSapling {...props} />
    </group>
  );
}

export function ArchiveScene(props: SceneProps) {
  return (
    <Canvas camera={{ position: [0, .1, 7], fov: 42 }} dpr={[1, 1.45]} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
      <fog attach="fog" args={["#dcebea", 7, 17]} />
      <ambientLight intensity={1.8} color="#fff4da" />
      <directionalLight position={[4, 7, 5]} intensity={2.2} color="#fff0c9" />
      <directionalLight position={[-5, 2, 2]} intensity={.9} color="#9fc8de" />
      <Suspense fallback={null}><World {...props} /></Suspense>
    </Canvas>
  );
}
