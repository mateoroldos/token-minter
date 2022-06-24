<script>
  import { theme } from "$lib/stores/ThemeStore"
  import Arrow from "$lib/components/svgs/Arrow.svelte";
  import { TransparentCard, AdaptableGrid, NumberBall, Stack } from "$lib/components/atoms/index";
  import AssetStorageStep from "$lib/components/guide-diagrams/AssetStorageStep.svelte"
  
  let steps = [
    {
      name: "GUI (Front-end)",
      originThumbnailURL: "/images/guide/ui-design.png",
      originThumbnailURLWhite: "/images/guide/ui-design-white.png",
      destinyThumbnailURL: "/images/guide/database.png",
      destinyThumbnailURLWhite: "/images/guide/database-white.png",
    },
    {
      name: "Smart Contract",
      thumbnailURL: "/images/guide/search.png",
      thumbnailURLWhite: "/images/guide/search-white.png",
    },
    {
      name: "Blockchain, NFT Metadata",
      thumbnailURL: "/images/guide/blockchain.png",
      thumbnailURLWhite: "/images/guide/blockchain-white.png",
    },
    {
      name: "Inter Planetary File System (IPFS), NFT Image",
      thumbnailURL: "/images/guide/database.png",
      thumbnailURLWhite: "/images/guide/database-white.png",
    }
  ];
</script>

 <AdaptableGrid minWidth="20em" gap="0.8em">
  {#each steps as step, i}
    <AssetStorageStep step={step} stepNumber={i}/>
  {/each}
</AdaptableGrid>