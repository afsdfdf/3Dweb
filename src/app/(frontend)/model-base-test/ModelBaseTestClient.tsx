"use client";

import { Bounds, OrbitControls } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import {
  Component,
  Suspense,
  useCallback,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

import styles from "./page.module.css";

const sharedDracoLoader = new DRACOLoader();
sharedDracoLoader.setDecoderPath("/three-draco/gltf/");

const BASE_TOP_Y = 0;
const DEFAULT_BASE_DIAMETER = 3.4;
const DEFAULT_MODEL_LIFT = 0.025;
const DEFAULT_MODEL_SCALE = 1;
const MODEL_MAX_NORMALIZED_WIDTH = 2.45;
const MODEL_MAX_NORMALIZED_HEIGHT = 2.35;

type ModelBaseTestClientProps = {
  basePlatformSrc: string;
  initialModelId: null | string;
  initialModelSrc: null | string;
};

type ViewerErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type ViewerErrorBoundaryState = {
  hasError: boolean;
};

class ViewerErrorBoundary extends Component<
  ViewerErrorBoundaryProps,
  ViewerErrorBoundaryState
> {
  state: ViewerErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidUpdate(previousProps: ViewerErrorBoundaryProps) {
    if (previousProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) return this.props.fallback;

    return this.props.children;
  }
}

function configureGLTFLoader(loader: GLTFLoader) {
  loader.setCrossOrigin("anonymous");
  loader.setDRACOLoader(sharedDracoLoader);
}

function buildModelViewerSrc(modelId: string) {
  return `/api/platform/models/${encodeURIComponent(modelId)}/viewer?format=glb`;
}

function normalizeText(value: string) {
  return value.trim();
}

function getGeometryBox(geometry: THREE.BufferGeometry) {
  geometry.computeBoundingBox();

  if (!geometry.boundingBox) {
    return new THREE.Box3(
      new THREE.Vector3(-1, -0.08, -1),
      new THREE.Vector3(1, 0.08, 1),
    );
  }

  return geometry.boundingBox.clone();
}

function LoadingPlatform({ baseDiameter }: { baseDiameter: number }) {
  return (
    <group position={[0, -0.08, 0]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[baseDiameter / 2, baseDiameter / 2, 0.16, 96]} />
        <meshStandardMaterial color="#171717" metalness={0.22} roughness={0.68} />
      </mesh>
      <mesh position={[0, 0.09, 0]} receiveShadow>
        <cylinderGeometry args={[baseDiameter * 0.42, baseDiameter * 0.45, 0.035, 96]} />
        <meshStandardMaterial color="#31281d" metalness={0.18} roughness={0.5} />
      </mesh>
    </group>
  );
}

function BasePlatform({
  baseDiameter,
  basePlatformSrc,
}: {
  baseDiameter: number;
  basePlatformSrc: string;
}) {
  const loadedGeometry = useLoader(STLLoader, basePlatformSrc);
  const { geometry, positionY, scale } = useMemo(() => {
    const geometryClone = loadedGeometry.clone();
    geometryClone.computeVertexNormals();
    const box = getGeometryBox(geometryClone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const diameter = Math.max(size.x, size.y, 0.001);
    const scale = baseDiameter / diameter;

    return {
      geometry: geometryClone,
      positionY: BASE_TOP_Y - box.max.z * scale,
      scale,
    };
  }, [baseDiameter, loadedGeometry]);

  return (
    <mesh
      geometry={geometry}
      position={[0, positionY, 0]}
      receiveShadow
      rotation={[-Math.PI / 2, 0, 0]}
      scale={scale}
    >
      <meshStandardMaterial color="#111111" metalness={0.28} roughness={0.56} />
    </mesh>
  );
}

function PreviewPlaceholderModel({
  lift,
  modelScale,
}: {
  lift: number;
  modelScale: number;
}) {
  const scale = 0.78 * modelScale;

  return (
    <group position={[0, BASE_TOP_Y + lift, 0]} scale={scale}>
      <mesh castShadow position={[0, 0.7, 0]}>
        <capsuleGeometry args={[0.32, 1.1, 12, 24]} />
        <meshStandardMaterial color="#8fb2ff" metalness={0.2} roughness={0.38} />
      </mesh>
      <mesh castShadow position={[0, 1.48, 0]}>
        <sphereGeometry args={[0.31, 36, 36]} />
        <meshStandardMaterial color="#f2e7d5" metalness={0.08} roughness={0.42} />
      </mesh>
      <mesh castShadow position={[-0.42, 0.38, 0.22]} rotation={[0.2, 0.08, -0.55]}>
        <capsuleGeometry args={[0.09, 0.82, 8, 16]} />
        <meshStandardMaterial color="#d9e2ff" metalness={0.3} roughness={0.36} />
      </mesh>
      <mesh castShadow position={[0.42, 0.38, 0.22]} rotation={[0.2, -0.08, 0.55]}>
        <capsuleGeometry args={[0.09, 0.82, 8, 16]} />
        <meshStandardMaterial color="#d9e2ff" metalness={0.3} roughness={0.36} />
      </mesh>
    </group>
  );
}

function LoadedModel({
  lift,
  modelScale,
  modelSrc,
}: {
  lift: number;
  modelScale: number;
  modelSrc: string;
}) {
  const gltf = useLoader(GLTFLoader, modelSrc, configureGLTFLoader);
  const { position, scale, scene } = useMemo(() => {
    const scene = gltf.scene.clone(true);

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxHorizontal = Math.max(size.x, size.z, 0.001);
    const maxHeight = Math.max(size.y, 0.001);
    const normalizedScale =
      Math.min(
        MODEL_MAX_NORMALIZED_WIDTH / maxHorizontal,
        MODEL_MAX_NORMALIZED_HEIGHT / maxHeight,
      ) * modelScale;
    const position: [number, number, number] = [
      -center.x * normalizedScale,
      BASE_TOP_Y + lift - box.min.y * normalizedScale,
      -center.z * normalizedScale,
    ];

    return {
      position,
      scale: normalizedScale,
      scene,
    };
  }, [gltf.scene, lift, modelScale]);

  return (
    <group position={position} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

function ViewerScene({
  baseDiameter,
  basePlatformSrc,
  lift,
  modelScale,
  modelSrc,
}: {
  baseDiameter: number;
  basePlatformSrc: string;
  lift: number;
  modelScale: number;
  modelSrc: null | string;
}) {
  return (
    <Bounds clip fit margin={1.18} observe>
      <Suspense fallback={<LoadingPlatform baseDiameter={baseDiameter} />}>
        <BasePlatform
          baseDiameter={baseDiameter}
          basePlatformSrc={basePlatformSrc}
        />
      </Suspense>
      <ViewerErrorBoundary
        fallback={
          <PreviewPlaceholderModel lift={lift} modelScale={modelScale} />
        }
      >
        <Suspense
          fallback={
            <PreviewPlaceholderModel lift={lift} modelScale={modelScale} />
          }
        >
          {modelSrc ? (
            <LoadedModel
              lift={lift}
              modelScale={modelScale}
              modelSrc={modelSrc}
            />
          ) : (
            <PreviewPlaceholderModel lift={lift} modelScale={modelScale} />
          )}
        </Suspense>
      </ViewerErrorBoundary>
    </Bounds>
  );
}

function updateAddress(nextQuery: Record<string, null | string>) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  url.search = "";

  for (const [key, value] of Object.entries(nextQuery)) {
    if (value) url.searchParams.set(key, value);
  }

  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

export function ModelBaseTestClient({
  basePlatformSrc,
  initialModelId,
  initialModelSrc,
}: ModelBaseTestClientProps) {
  const [activeModelId, setActiveModelId] = useState(initialModelId ?? "");
  const [activeModelSrc, setActiveModelSrc] = useState(initialModelSrc);
  const [modelIdValue, setModelIdValue] = useState(initialModelId ?? "");
  const [modelSrcValue, setModelSrcValue] = useState(initialModelSrc ?? "");
  const [baseDiameter, setBaseDiameter] = useState(DEFAULT_BASE_DIAMETER);
  const [modelLift, setModelLift] = useState(DEFAULT_MODEL_LIFT);
  const [modelScale, setModelScale] = useState(DEFAULT_MODEL_SCALE);

  const applyModelId = useCallback(
    (event?: FormEvent) => {
      event?.preventDefault();
      const nextModelId = normalizeText(modelIdValue);
      if (!nextModelId) return;

      const nextModelSrc = buildModelViewerSrc(nextModelId);
      setActiveModelId(nextModelId);
      setActiveModelSrc(nextModelSrc);
      setModelSrcValue(nextModelSrc);
      updateAddress({ modelId: nextModelId, modelSrc: null });
    },
    [modelIdValue],
  );

  const applyModelSrc = useCallback(
    (event?: FormEvent) => {
      event?.preventDefault();
      const nextModelSrc = normalizeText(modelSrcValue);
      if (!nextModelSrc) return;

      setActiveModelId("");
      setActiveModelSrc(nextModelSrc);
      setModelIdValue("");
      updateAddress({ modelId: null, modelSrc: nextModelSrc });
    },
    [modelSrcValue],
  );

  const resetModel = useCallback(() => {
    setActiveModelId("");
    setActiveModelSrc(null);
    setModelIdValue("");
    setModelSrcValue("");
    updateAddress({ modelId: null, modelSrc: null });
  }, []);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div>
          <span className={styles.kicker}>Viewer Sandbox</span>
          <h1>Model Base Test</h1>
        </div>
        <div className={styles.statusBar}>
          <span>Base STL</span>
          <strong>{basePlatformSrc}</strong>
        </div>
      </header>

      <section className={styles.workspace} aria-label="Model base test workspace">
        <div className={styles.viewerPanel}>
          <Canvas
            camera={{ fov: 36, position: [0, 2.2, 6.2] }}
            className={styles.canvas}
            dpr={[1, 1.5]}
            shadows
          >
            <color attach="background" args={["#07090d"]} />
            <fog attach="fog" args={["#07090d", 8, 16]} />
            <ambientLight intensity={1.4} />
            <directionalLight castShadow intensity={2.8} position={[4, 7, 5]} />
            <pointLight color="#d4ac65" intensity={3.6} position={[-3.5, 2.6, 2.8]} />
            <spotLight
              angle={0.42}
              color="#dbeafe"
              intensity={5.5}
              penumbra={0.6}
              position={[0, 5.8, 2.4]}
            />
            <ViewerScene
              baseDiameter={baseDiameter}
              basePlatformSrc={basePlatformSrc}
              lift={modelLift}
              modelScale={modelScale}
              modelSrc={activeModelSrc}
            />
            <mesh position={[0, -0.22, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[4.4, 96]} />
              <meshStandardMaterial color="#10151d" roughness={0.82} />
            </mesh>
            <OrbitControls
              enableDamping
              enablePan={false}
              makeDefault
              maxDistance={10}
              minDistance={2.3}
            />
          </Canvas>
          <div className={styles.viewerBadge}>
            {activeModelSrc ? "GLB + STL base" : "Placeholder + STL base"}
          </div>
        </div>

        <aside className={styles.controls} aria-label="Model base controls">
          <form className={styles.controlGroup} onSubmit={applyModelId}>
            <label htmlFor="model-base-test-id">Payload model ID</label>
            <div className={styles.inlineControl}>
              <input
                id="model-base-test-id"
                onChange={(event) => setModelIdValue(event.target.value)}
                placeholder="123"
                type="text"
                value={modelIdValue}
              />
              <button type="submit">Load ID</button>
            </div>
          </form>

          <form className={styles.controlGroup} onSubmit={applyModelSrc}>
            <label htmlFor="model-base-test-url">Direct GLB URL</label>
            <textarea
              id="model-base-test-url"
              onChange={(event) => setModelSrcValue(event.target.value)}
              placeholder="/api/platform/models/123/viewer?format=glb"
              rows={3}
              value={modelSrcValue}
            />
            <button type="submit">Load URL</button>
          </form>

          <div className={styles.controlGroup}>
            <div className={styles.rangeHeader}>
              <label htmlFor="model-base-test-diameter">Base diameter</label>
              <span>{baseDiameter.toFixed(2)}</span>
            </div>
            <input
              id="model-base-test-diameter"
              max="5.4"
              min="2.2"
              onChange={(event) => setBaseDiameter(Number(event.target.value))}
              step="0.05"
              type="range"
              value={baseDiameter}
            />
          </div>

          <div className={styles.controlGroup}>
            <div className={styles.rangeHeader}>
              <label htmlFor="model-base-test-scale">Model scale</label>
              <span>{modelScale.toFixed(2)}</span>
            </div>
            <input
              id="model-base-test-scale"
              max="1.8"
              min="0.45"
              onChange={(event) => setModelScale(Number(event.target.value))}
              step="0.01"
              type="range"
              value={modelScale}
            />
          </div>

          <div className={styles.controlGroup}>
            <div className={styles.rangeHeader}>
              <label htmlFor="model-base-test-lift">Model lift</label>
              <span>{modelLift.toFixed(3)}</span>
            </div>
            <input
              id="model-base-test-lift"
              max="0.25"
              min="-0.05"
              onChange={(event) => setModelLift(Number(event.target.value))}
              step="0.005"
              type="range"
              value={modelLift}
            />
          </div>

          <div className={styles.activeSource}>
            <span>Active source</span>
            <strong>{activeModelId || "Custom URL"}</strong>
            <code>{activeModelSrc || "No GLB loaded"}</code>
          </div>

          <button className={styles.resetButton} onClick={resetModel} type="button">
            Reset model
          </button>
        </aside>
      </section>
    </div>
  );
}
