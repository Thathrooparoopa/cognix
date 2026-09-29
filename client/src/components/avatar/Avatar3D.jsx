import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
  useAnimations,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";

const AVATAR_ASSETS = {
  explorer: "/avatars/explorer/character.glb",
  inventor: "/avatars/inventor/character.glb",
  gamer: "/avatars/gamer/character.glb",
  artist: "/avatars/artist/character.glb",
  scientist: "/avatars/scientist/character.glb",
};

function LoadingAvatar() {
  return (
    <mesh>
      <sphereGeometry args={[0.55, 24, 24]} />
      <meshStandardMaterial
        color="#F6B73C"
        roughness={0.65}
      />
    </mesh>
  );
}

function AvatarModel({
  type = "explorer",
  scale = 1,
  state = "idle",
  rotate = true,
}) {
  const group = useRef();

  const modelPath =
    AVATAR_ASSETS[type] || AVATAR_ASSETS.explorer;

  const { scene, animations } = useGLTF(modelPath);

  const { actions, names } = useAnimations(
    animations,
    group
  );

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;

        if (object.material) {
          object.material =
            object.material.clone();
        }
      }
    });

    return clone;
  }, [scene]);

  useEffect(() => {
    if (!actions || names.length === 0) {
      return;
    }

    Object.values(actions).forEach((action) => {
      action?.stop();
    });

    const normalizedState =
      state.toLowerCase();

    const preferredNames = {
      idle: ["Idle", "idle", "IDLE"],
      happy: [
        "Happy",
        "happy",
        "Cheer",
        "cheer",
      ],
      thinking: [
        "Thinking",
        "thinking",
      ],
      confused: [
        "Confused",
        "confused",
      ],
      success: [
        "Victory",
        "victory",
        "Success",
        "success",
        "Celebrate",
        "celebrate",
      ],
      levelup: [
        "Victory",
        "victory",
        "Celebrate",
        "celebrate",
      ],
    };

    const candidates =
      preferredNames[normalizedState] ||
      preferredNames.idle;

    let selectedName = candidates.find(
      (name) => actions[name]
    );

    if (!selectedName) {
      selectedName = names.find((name) =>
        name
          .toLowerCase()
          .includes(normalizedState)
      );
    }

    if (!selectedName) {
      selectedName =
        names.find((name) =>
          name.toLowerCase().includes("idle")
        ) || names[0];
    }

    const action = actions[selectedName];

    if (action) {
      action.reset().fadeIn(0.25).play();

      return () => {
        action.fadeOut(0.25);
      };
    }
  }, [actions, names, state]);

  useFrame((_, delta) => {
    if (!group.current) {
      return;
    }

    if (rotate) {
      group.current.rotation.y +=
        delta * 0.18;
    }

    group.current.scale.x =
      THREE.MathUtils.lerp(
        group.current.scale.x,
        scale,
        0.08
      );

    group.current.scale.y =
      THREE.MathUtils.lerp(
        group.current.scale.y,
        scale,
        0.08
      );

    group.current.scale.z =
      THREE.MathUtils.lerp(
        group.current.scale.z,
        scale,
        0.08
      );
  });

  return (
    <group ref={group}>
      <primitive object={clonedScene} />
    </group>
  );
}

export default function Avatar3D({
  type = "explorer",
  scale = 1,
  state = "idle",
  interactive = false,
  className = "",
}) {
  return (
    <div
      className={`h-full min-h-[240px] w-full ${className}`}
      style={{ touchAction: "none" }}
    >
      <Canvas
        shadows
        camera={{
          position: [0, 1.25, 4.2],
          fov: 38,
        }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={1.8} />

        <directionalLight
          position={[3, 5, 4]}
          intensity={2.2}
          castShadow
        />

        <directionalLight
          position={[-3, 2, 2]}
          intensity={1}
        />

        <Suspense fallback={<LoadingAvatar />}>
          <AvatarModel
            type={type}
            scale={scale}
            state={state}
            rotate={!interactive}
          />

          <Environment preset="city" />
        </Suspense>

        {interactive && (
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 2.5}
            maxPolarAngle={Math.PI / 1.8}
          />
        )}
      </Canvas>
    </div>
  );
}

Object.values(AVATAR_ASSETS).forEach(
  (path) => {
    useGLTF.preload(path);
  }
);