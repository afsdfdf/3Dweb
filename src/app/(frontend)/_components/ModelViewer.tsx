'use client'

import { Float, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'

type ModelViewerProps = {
  accent?: 'blue' | 'violet'
  className?: string
  label?: string
}

function CharacterFigure({ accent = 'violet' }: { accent?: 'blue' | 'violet' }) {
  const bodyColor = accent === 'blue' ? '#5ca8ff' : '#8b6cff'
  const glowColor = accent === 'blue' ? '#7ac4ff' : '#b098ff'

  return (
    <Float floatIntensity={1.2} rotationIntensity={0.35} speed={2}>
      <group position={[0, -0.3, 0]}>
        <mesh position={[0, 1.55, 0]} castShadow>
          <sphereGeometry args={[0.42, 48, 48]} />
          <meshStandardMaterial color="#f2f6ff" metalness={0.15} roughness={0.3} />
        </mesh>

        <mesh position={[0, 0.55, 0]} castShadow>
          <capsuleGeometry args={[0.5, 1.7, 12, 24]} />
          <meshStandardMaterial color={bodyColor} metalness={0.2} roughness={0.35} />
        </mesh>

        <mesh position={[-0.95, 0.55, 0.05]} rotation={[0.2, 0.15, -0.4]} castShadow>
          <capsuleGeometry args={[0.16, 1.2, 8, 18]} />
          <meshStandardMaterial color="#dce6ff" metalness={0.35} roughness={0.25} />
        </mesh>

        <mesh position={[0.92, 0.48, 0.1]} rotation={[0.1, -0.1, 0.28]} castShadow>
          <capsuleGeometry args={[0.15, 1.3, 8, 18]} />
          <meshStandardMaterial color="#dce6ff" metalness={0.42} roughness={0.22} />
        </mesh>

        <mesh position={[-0.55, 0.35, 0.55]} rotation={[0.35, 0.15, -0.18]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 1.7, 24]} />
          <meshStandardMaterial color="#eef4ff" metalness={0.62} roughness={0.18} />
        </mesh>

        <mesh position={[-0.52, 1.03, 0.62]} rotation={[0.1, 0, 0]} castShadow>
          <coneGeometry args={[0.24, 0.52, 24]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.35} roughness={0.3} />
        </mesh>

        <mesh position={[0.8, 0.42, 0.5]} rotation={[0.2, -0.25, 0.2]} castShadow>
          <cylinderGeometry args={[0.52, 0.52, 0.16, 40]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.18} metalness={0.28} roughness={0.36} />
        </mesh>

        <mesh position={[0, -0.9, 0]} rotation={[-0.12, 0.3, 0]} receiveShadow>
          <torusGeometry args={[1.22, 0.045, 16, 100]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.4} />
        </mesh>
      </group>
    </Float>
  )
}

export function ModelViewer({ accent = 'violet', className, label }: ModelViewerProps) {
  return (
    <div className={className}>
      <Canvas camera={{ fov: 36, position: [0, 1.6, 5.4] }} shadows dpr={[1, 1.8]}>
        <color attach="background" args={['#0a101b']} />
        <fog attach="fog" args={['#0a101b', 8, 14]} />
        <ambientLight intensity={1.1} />
        <directionalLight castShadow intensity={2.6} position={[4, 6, 5]} shadow-mapSize-height={1024} shadow-mapSize-width={1024} />
        <pointLight intensity={12} position={[-3, 2, 2]} color={accent === 'blue' ? '#67b4ff' : '#8b6cff'} />
        <spotLight angle={0.45} intensity={20} penumbra={0.6} position={[0, 6, 2]} color="#dfe8ff" />

        <CharacterFigure accent={accent} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} receiveShadow>
          <circleGeometry args={[3.2, 64]} />
          <meshStandardMaterial color="#0e1728" />
        </mesh>

        <OrbitControls autoRotate autoRotateSpeed={1.6} enablePan={false} maxDistance={7} minDistance={4} />
      </Canvas>

      {label ? <div className="viewer-overlay-label">{label}</div> : null}
    </div>
  )
}
