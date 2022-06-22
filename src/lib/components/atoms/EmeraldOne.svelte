<script>
  import {
    CircleBufferGeometry,
    MeshStandardMaterial,
    BoxBufferGeometry,
    DoubleSide
  } from "three";
  import {
    Canvas,
    DirectionalLight,
    HemisphereLight,
    Mesh,
    OrbitControls,
    PerspectiveCamera,
    GLTF
  } from "threlte";
</script>

  <Canvas>
    <PerspectiveCamera position={{ x: 10, y: 10, z: 10 }}>
      <OrbitControls autoRotate />
    </PerspectiveCamera>

    <DirectionalLight shadow color={'white'} position={{ x: -15, y: 45, z: 20 }} />
    <HemisphereLight skyColor={'white'} groundColor={'#ac844c'} intensity={0.4} />

    <GLTF
      url="/Emerald.glb"
      interactive
    />
  </Canvas>
