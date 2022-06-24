<script>
  import {
    DirectionalLight,
    HemisphereLight,
    Mesh,
    OrbitControls,
    PerspectiveCamera,
    GLTF,
  } from "threlte";
  import { useGltfAnimations } from 'threlte/extras'

  // `useGltfAnimations` returns stores that populate
  // when the `<GLTF>` component finished loading.
  const { gltf } = useGltfAnimations(({ actions }) => {
    // Either play your animations as soon as they are loaded
    actions['Card animation'].play()
    actions['emerald rotation '].play()
    actions['Empty'].play()
    actions['Text'].play()
    actions['Z axis movement'].play()
  })
</script>

<PerspectiveCamera position={{ x: 8, y: 0, z: 2 }}>
  <OrbitControls enableDamping />
</PerspectiveCamera>

<DirectionalLight shadow color={'white'} position={{ x: -15, y: 45, z: 20 }} />
<HemisphereLight skyColor={'white'} groundColor={'#ac844c'} intensity={0.4} />

<GLTF
  url="/emerald-one.glb"
  bind:gltf={$gltf}
  interactive
/>

