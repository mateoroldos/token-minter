<script>
  import { TransparentCard, Button, NFTCardContent } from "$atoms";

  export let thumbnailURL;
  export let name;
  export let description;
  export let backgroundColor;
  export let price;
  export let buy = false;
  export let withLink = false;
  export let url;
  export let purchase;
  export let flowPrice;
</script>

<TransparentCard padding="0.8em" hoverShadow={true} border={true}>
  {#if withLink}
    <a href={url}>
      <NFTCardContent
        {flowPrice}
        {thumbnailURL}
        {name}
        {description}
        {backgroundColor}
        {price} />
      {#if buy}
        <Button class="small full-width no-shadow ghost">Buy Now</Button>
      {/if}
    </a>
  {:else}
    <NFTCardContent
      {flowPrice}
      {thumbnailURL}
      {name}
      {description}
      {backgroundColor}
      {price} />
    {#if buy}
      {#if purchase}
        <Button class="small full-width no-shadow ghost" on:click={purchase}
          >Buy Now</Button>
      {:else}
        <Button class="small full-width no-shadow ghost">Buy Now</Button>
      {/if}
    {/if}
  {/if}
</TransparentCard>

<style type="scss">
  a {
    text-decoration: none;
  }
</style>
