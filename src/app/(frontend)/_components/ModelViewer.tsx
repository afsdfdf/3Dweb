'use client'

import { Bounds, Center, Environment, Float, OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Component, Suspense, useEffect, useMemo } from 'react'
import * as THREE from 'three'

if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
  // Force GLTFLoader to use classic image loading instead of ImageBitmap for better
  // compatibility with embedded texture blobs in certain browser/driver combinations.
  ;(globalThis as any).createImageBitmap = undefined
}

type ModelViewerProps = {
  accent?: 'blue' | 'violet'
  className?: string
  label?: string
  src?: string | null
}

type ViewerErrorBoundaryProps = {
  children: React.ReactNode
  fallback: React.ReactNode
  onError?: () => void
}

type ViewerErrorBoundaryState = {
  hasError: boolean
}

class ViewerErrorBoundary extends Component<ViewerErrorBoundaryProps, ViewerErrorBoundaryState> {
  state: ViewerErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    }
  }

  componentDidCatch() {
    this.props.onError?.()
  }

  componentDidUpdate(prevProps: ViewerErrorBoundaryProps) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

function CharacterFigure({ accent = 'violet' }: { accent?: 'blue' | 'violet' }) {
  const bodyColor = accent === 'blue' ? '#5ca8ff' : '#8b6cff'
  const glowColor = accent === 'blue' ? '#7ac4ff' : '#b098ff'

  return (
    <Float floatIntensity={1.2} rotationIntensity={0.35} speed={2}>
      <group position={[0, -0.3, 0]}>
        <mesh castShadow position={[0, 1.55, 0]}>
          <sphereGeometry args={[0.42, 48, 48]} />
          <meshStandardMaterial color="#f2f6ff" metalness={0.15} roughness={0.3} />
        </mesh>

        <mesh castShadow position={[0, 0.55, 0]}>
          <capsuleGeometry args={[0.5, 1.7, 12, 24]} />
          <meshStandardMaterial color={bodyColor} metalness={0.2} roughness={0.35} />
        </mesh>

        <mesh castShadow position={[-0.95, 0.55, 0.05]} rotation={[0.2, 0.15, -0.4]}>
          <capsuleGeometry args={[0.16, 1.2, 8, 18]} />
          <meshStandardMaterial color="#dce6ff" metalness={0.35} roughness={0.25} />
        </mesh>

        <mesh castShadow position={[0.92, 0.48, 0.1]} rotation={[0.1, -0.1, 0.28]}>
          <capsuleGeometry args={[0.15, 1.3, 8, 18]} />
          <meshStandardMaterial color="#dce6ff" metalness={0.42} roughness={0.22} />
        </mesh>

        <mesh castShadow position={[-0.55, 0.35, 0.55]} rotation={[0.35, 0.15, -0.18]}>
          <cylinderGeometry args={[0.12, 0.12, 1.7, 24]} />
          <meshStandardMaterial color="#eef4ff" metalness={0.62} roughness={0.18} />
        </mesh>

        <mesh castShadow position={[-0.52, 1.03, 0.62]} rotation={[0.1, 0, 0]}>
          <coneGeometry args={[0.24, 0.52, 24]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.35} roughness={0.3} />
        </mesh>

        <mesh castShadow position={[0.8, 0.42, 0.5]} rotation={[0.2, -0.25, 0.2]}>
          <cylinderGeometry args={[0.52, 0.52, 0.16, 40]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.18} metalness={0.28} roughness={0.36} />
        </mesh>

        <mesh position={[0, -0.9, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.22, 0.045, 16, 100]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.4} />
        </mesh>
      </group>
    </Float>
  )
}

function LoadedModel({ src }: { src: string }) {
  const gltf = useGLTF(src)
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene])

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

  return (
    <Bounds clip fit margin={1.1} observe>
      <Center>
        <primitive object={scene} />
      </Center>
    </Bounds>
  )
}

export function ModelViewer({ accent = 'violet', className, label, src }: ModelViewerProps) {
  const pointLightColor = accent === 'blue' ? '#67b4ff' : '#8b6cff'

  useEffect(() => {
    THREE.Cache.enabled = true

    if (src) {
      useGLTF.preload(src)
    }
  }, [src])

  return (
    <div className={className}>
      <Canvas camera={{ fov: 36, position: [0, 1.6, 5.4] }} dpr={[1, 1.8]} shadows>
        <color attach="background" args={['#0a101b']} />
        <fog attach="fog" args={['#0a101b', 8, 14]} />
        <ambientLight intensity={1.2} />
        <directionalLight castShadow intensity={2.6} position={[4, 6, 5]} shadow-mapSize-height={1024} shadow-mapSize-width={1024} />
        <pointLight color={pointLightColor} intensity={12} position={[-3, 2, 2]} />
        <spotLight angle={0.45} color="#dfe8ff" intensity={20} penumbra={0.6} position={[0, 6, 2]} />
        <Environment preset="city" />

        <ViewerErrorBoundary fallback={<CharacterFigure accent={accent} />}>
          <Suspense fallback={<CharacterFigure accent={accent} />}>
            {src ? <LoadedModel src={src} /> : <CharacterFigure accent={accent} />}
          </Suspense>
        </ViewerErrorBoundary>

        <mesh position={[0, -1.2, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[3.2, 64]} />
          <meshStandardMaterial color="#0e1728" />
        </mesh>

        <OrbitControls autoRotate autoRotateSpeed={1.2} enablePan={false} maxDistance={7} minDistance={2.2} />
      </Canvas>

      {label ? (
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-white/10 bg-background/85 px-3 py-1 text-xs text-foreground shadow-sm">
          {label}
        </div>
      ) : null}
    </div>
  )
}
