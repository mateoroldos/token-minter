<script>
  import { theme } from "$lib/stores/ThemeStore"
  import { TransparentCard, NumberBall, Stack } from "$lib/components/atoms/index";
  import Arrow from "$lib/components/svgs/Arrow.svelte";

  export let step;
  export let stepNumber;
  export let arrows = 2;
</script>

<TransparentCard padding="0.8em">
  <Stack direction="row" align="center" gap="0.3em">
    <div class="image-container">
      {#if $theme === "dark"}
       <img src={step.originThumbnailURLWhite} alt={step.name}>
      {:else}
        <img src={step.originThumbnailURL} alt={step.name}>
      {/if} 
    </div>
    <Stack direction="column">
      <Stack direction="row">
        <NumberBall>
          1
        </NumberBall>
        aaj
      </Stack>
      <Arrow class="right"/>
      <Arrow class="left"/>
      <Stack direction="row">
        <NumberBall>
          1
        </NumberBall>
        aaj
      </Stack>
    </Stack>
    <div class="image-container">
      {#if $theme === "dark"}
       <img src={step.destinyThumbnailURLWhite} alt={step.name}>
      {:else}
        <img src={step.destinyThumbnailURL} alt={step.name}>
      {/if} 
    </div>
  </Stack>
</TransparentCard>

<style type="scss">
  .image-container {
    padding: 1em;
    max-width: 10em;
  }
</style>