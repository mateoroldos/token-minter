<script>
  import {
    Section,
    Container,
    Stack,
    AdaptableGrid,
    WalletAddress,
    NFTPrice,
    Button,
    MadeWithTouchstone,
    NftImage,
    HtmlHead,
    TransactionModal
  } from "$atoms";
  import {
    getCollectionInfo,
    getNFTInfo,
    purchaseNFT,
  } from "$flow/actions.js";
  import { transactionInProgress, transactionStatus } from "$stores/FlowStore";
  import { page } from "$app/stores";
  import { user } from "$stores/FlowStore"

  async function getInfo() {
    const nftInfo = await getNFTInfo(
      $page.params.collection,
      $page.params.address,
      $page.params.nft
    );
    const collectionInfo = await getCollectionInfo(
      $page.params.collection,
      $page.params.address
    );
    const owner = collectionInfo.primaryBuyers[nftInfo.metadataId];
    console.log({ collectionInfo, nftInfo, owner });
    return { collectionInfo, nftInfo, owner };
  }

  let checkNftInfo = getInfo();
  let purchased = false; // flag to check if user has bought the NFT
  
  async function buyNft(price) {
    const transactionResult = await purchaseNFT($page.params.nft, price, $page.params.collection, $page.params.address)
    if (transactionResult && $transactionStatus.status === 4 && $transactionStatus.statusCode === 0) {
      purchased = true
    };
  }
</script>

<HtmlHead title="Discover"/>

<TransactionModal />
<Section class="padding-top-small">
  <Container>
    <AdaptableGrid>
      {#await checkNftInfo then info}
        <Stack direction="column" align="flex-start">
          <div class="image-wrapper">
            <NftImage
              thumbnailURL={`https://nftstorage.link/ipfs/${info.nftInfo.thumbnail.cid}/${info.nftInfo.thumbnail.path}`}
              name={`${info.nftInfo.name} NFT`} />
          </div>
          <Stack direction="column" align="flex-start" gap="0.4em">
            <h4>Description</h4>
            <p>{info.nftInfo.description}</p>
          </Stack>
          <Stack direction="column" align="flex-start" gap="0.4em">
            <h4>Metadata</h4>
            <table>
              {#each Object.entries(info.nftInfo.extra) as metadataArray}
                <tr>
                  {#each metadataArray as metadata, i}
                    {#if i === 0}
                      <th class="title">{`${metadata}:`}</th>
                    {:else}
                      <th>{metadata}</th>
                    {/if}
                  {/each}
                </tr>
              {/each}
            </table>
          </Stack>
        </Stack>
        <div class="sticky">
          <Stack direction="column" align="flex-start">
            <Stack direction="column" gap="0.6em" align="flex-start">
              <MadeWithTouchstone />
              <WalletAddress address={$page.params.address}>By</WalletAddress>
            </Stack>
            <h1>{info.nftInfo.name}</h1>
            <!-- TODO: ADD VERIFIERS AND BLOCK BUY BUTTON IF USER DOESN'T HAVE VERIFIERS -->
            {#if !info.owner && !purchased}
              <NFTPrice
                price={info.nftInfo.price}
                width="34px"
                fontSize="var(--fs-500)"
                currentPrice={true} />
              <Button
                leftIcon="wallet"
                loading={$transactionInProgress}
                on:click={() => buyNft(Number(info.nftInfo.price).toFixed(3))} >
                {#if $transactionInProgress}  
                  Loading Transaction
                {:else}
                  Buy NFT
                {/if} 
              </Button>
            {:else if !info.owner && purchased}
              <Button leftIcon="checkmark-circle" done={true}>
                Bought by you
              </Button>
            {:else}
              {#if info.owner === $user.addr}
                <Button leftIcon="checkmark-circle" done={true}>
                  Bought by you
                </Button>
              {:else}
                <Button done={true}>
                  Bought by: {info.owner}
                </Button>
              {/if}
            {/if}
          </Stack>
        </div>
      {/await}
    </AdaptableGrid>
  </Container>
</Section>

<style type="scss">
  @use "../../../../../lib/styles/abstracts" as *;

  .image-wrapper {
    border-radius: 0.4rem;
    border: 3px var(--clr-accent-soft-t8) solid;
  }
  .sticky {
    @include mq(medium) {
      position: sticky;
      top: 5rem;
      height: fit-content;
    }
  }

  h1 {
    font-size: var(--fs-700);
  }

  h4 {
    padding-bottom: 0.2em;
    font-size: var(--fs-400);
  }

  p {
    color: var(--clr-font-text-soft);
  }

  table {
    border-spacing: 1;
    border-collapse: collapse;
    background: var(--clr-accent-soft-t9);
    border-radius: 0.4rem;
    overflow: hidden;
    width: 100%;
    margin: 0 auto;
    position: relative;

    th {
      border: 1px var(--clr-accent-soft-t8) solid;
      padding-inline: 1em;
      padding-block: 0.4em;
      font-size: var(--fs-400);
      text-align: left;
      font-weight: 300;
    }
    .title {
      color: var(--clr-accent-main-t2);
      font-weight: 600;
    }
  }
</style>
