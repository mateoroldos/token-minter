import { browser } from '$app/env';
import { get } from 'svelte/store';
import { Buffer } from 'buffer';

import * as fcl from '@onflow/fcl';
import './config';

import { user, transactionStatus, transactionInProgress, contractInfo, contractCode, FLOWTOKEN_ADDR, NONFUNGIBLETOKEN_ADDR } from './stores';
import { resultCID } from "$lib/stores/generator/IPFSstore.ts";

import { onNext } from '$lib/stores/generator/updateFunctions';

///////////////
// Cadence code 
///////////////
// Scripts
import getCollectionInfoScript from "./cadence/scripts/get_collection_info.cdc?raw";
import getContractsScript from "./cadence/scripts/get_contracts.cdc?raw";
import getContractDisplaysScript from "./cadence/scripts/get_contract_displays.cdc?raw";
// Transactions
import createMetadatasTx from "./cadence/transactions/create_metadatas.cdc?raw";
import deployContractTx from "./cadence/transactions/deploy_contract.cdc?raw";
import purchaseNFTTx from "./cadence/transactions/purchase_nft.cdc?raw";

if (browser) {
  // set Svelte $user store to currentUser,
  // so other components can access it
  fcl.currentUser.subscribe(user.set, []);
}

// Lifecycle FCL Auth functions
export const unauthenticate = () => fcl.unauthenticate();
export const logIn = async () => await fcl.logIn();
export const signUp = () => fcl.signUp();

function switchNetwork(network) {
  if (network === 'emulator') {
    fcl
      .config()
      .put('accessNode.api', 'http://localhost:8080')
      .put('discovery.wallet', 'http://localhost:8701/fcl/authn')
  } else if (network === 'testnet') {
    fcl
      .config()
      .put('accessNode.api', 'https://rest-testnet.onflow.org')
      .put('discovery.wallet', 'https://fcl-discovery.onflow.org/testnet/authn');
  } else if (network === 'mainnet') {
    fcl
      .config()
      .put('accessNode.api', 'https://rest-mainnet.onflow.org')
      .put('discovery.wallet', 'https://fcl-discovery.onflow.org/authn');
  }
}

export const deployToTestnet = async () => {
  switchNetwork('testnet');
  deployContract();
};

export const deployToMainnet = async () => {
  switchNetwork('mainnet');
  deployContract();
};

function initTransactionState() {
  transactionInProgress.set(true);
  transactionStatus.set(-1);
}

// ****** Transactions ****** //

async function deployContract() {
  const hexCode = Buffer.from(get(contractCode)).toString('hex');
  const info = get(contractInfo);

  initTransactionState();

  try {
    const transactionId = await fcl.mutate({
      cadence: deployContractTx,
      args: (arg, t) => [
        arg(info.name.replace(/\s+/g, ''), t.String),
        arg(hexCode, t.String),
        arg(info.name, t.String),
        arg(info.description, t.String),
        arg(info.image.name, t.String),
        arg(info.startMinting, t.Bool),
        arg(Number(info.payment).toFixed(2), t.UFix64),
        arg(get(resultCID), t.String)
      ],
      payer: fcl.authz,
      proposer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 9999,
    });
    console.log({ transactionId });
    fcl.tx(transactionId).subscribe((res) => {
      transactionStatus.set(res.status);
      console.log(res);
      if (res.status === 4) {
        // If deployment is successful
        if (res.statusCode === 0) {
          console.log("Successfully deployed the contract.")
          onNext();
        }
        setTimeout(() => transactionInProgress.set(false), 2000);
      }
    });
  } catch (e) {
    console.log(e);
    transactionStatus.set(99);
  }
}

export const purchaseNFT = async (serial, price, contractName, contractAddress) => {
  const transaction = purchaseNFTTx
    .replace('"../ExampleNFT.cdc"', contractAddress)
    .replace('"../utility/FlowToken.cdc"', FLOWTOKEN_ADDR)
    .replace('"../utility/NonFungibleToken.cdc"', NONFUNGIBLETOKEN_ADDR)
    .replaceAll('ExampleNFT', contractName)

  initTransactionState();

  try {
    const transactionId = await fcl.mutate({
      cadence: transaction,
      args: (arg, t) => [
        arg(serial, t.UInt64),
        arg(price, t.UFix64)
      ],
      payer: fcl.authz,
      proposer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 9999,
    });
    console.log({ transactionId });
    fcl.tx(transactionId).subscribe((res) => {
      transactionStatus.set(res.status);
      console.log(res);
      if (res.status === 4) {
        setTimeout(() => transactionInProgress.set(false), 2000);
      }
    });
  } catch (e) {
    console.log(e);
    transactionStatus.set(99);
  }
}

// ****** Scripts ****** //

export const getContracts = async (address) => {
  console.log(address)
  try {
    const response = await fcl.query({
      cadence: getContractsScript,
      args: (arg, t) => [
        arg(address, t.Address)
      ],
    });

    const contractCodes = response.map(thing => Buffer.from(thing, 'hex').toString());
    const createdByTouchstone = contractCodes.filter(contract => {
      return contract.code.includes("// CREATED BY: Touchstone (https://touchstone.city/), a platform crafted by your best friends at Emerald City DAO (https://ecdao.org/).") &&
        contract.code.includes("// STATEMENT: This contract promises to keep the 5% royalty off of primary sales to Emerald City DAO or risk permanent suspension from participation in the DAO and its tools.")
    });

    let imports = '';
    let displays = '';
    createdByTouchstone.forEach(contract => {
      imports += `import ${contract.name} from ${address}\n`;
      displays += `
      let display = ${contract.name}.getCollectionInfo()
      answer.append(CollectionDisplay(
        _name: display.name,
        _description: display.description,
        _image: display.image
      ))\n
      `
    })
    const script = getContractDisplaysScript.replace('// IMPORTS', imports).replace('// DISPLAYS', displays)

    try {
      const response = await fcl.query({
        cadence: script,
        args: (arg, t) => [],
      });
      console.log(response);

      return response;
    } catch (e) {
      console.log(e);
    }
  } catch (e) {
    console.log(e);
  }
};

export const getCollectionInfo = async (contractName, contractAddress) => {
  const script = getCollectionInfoScript
    .replace('"../ExampleNFT.cdc"', contractAddress)
    .replaceAll('ExampleNFT', contractName)

  try {
    const response = await fcl.query({
      cadence: script,
      args: (arg, t) => [],
    });

    console.log(response);
    return response;
  } catch (e) {
    console.log(e);
  }
};

export async function getNextMetadataId(contractName, userAddress) {
  try {
    const response = await fcl.query({
      cadence: `
      import ${contractName} from ${userAddress}

      pub fun main(): UInt64 {
        return ${contractName}.nextMetadataId
      }
      `,
      args: (arg, t) => [],
    });

    return Number(response);
  } catch (e) {
    console.log(e);
  }
};

// Function to upload metadata to the contract in batches of 500
export async function uploadMetadataToContract(contractName, metadatas, batchSize) {
  const userAddr = get(user).addr;
  // Get The MetadataId we should start at
  let names = [];
  let descriptions = [];
  let thumbnails = [];
  let extras = [];
  for (var i = 0; i < metadatas.length; i++) {
    const { name, description, image, ...rest } = metadatas[i];
    names.push(name);
    descriptions.push(description);
    thumbnails.push(image);
    let extra = [];
    for (const attribute in rest) {
      extra.push({ key: attribute, value: rest[attribute] });
    }
    extras.push(extra);
  }

  console.log('Uploading ' + batchSize + ' NFTs to the contract.')

  const transaction = createMetadatasTx
    .replace('"../ExampleNFT.cdc"', userAddr)
    .replaceAll('ExampleNFT', contractName)
    .replaceAll('500', batchSize);

  initTransactionState();

  try {
    const transactionId = await fcl.mutate({
      cadence: transaction,
      args: (arg, t) => [
        arg(names, t.Array(t.String)),
        arg(descriptions, t.Array(t.String)),
        arg(thumbnails, t.Array(t.String)),
        arg(extras, t.Array(t.Dictionary({ key: t.String, value: t.String })))
      ],
      payer: fcl.authz,
      proposer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 9999,
    });

    fcl.tx(transactionId).subscribe((res) => {
      transactionStatus.set(res.status);
      console.log(res);
      if (res.status === 4) {
        setTimeout(() => transactionInProgress.set(false), 2000);
      }
    });

    const { status, statusCode, errorMessage } = await fcl.tx(transactionId).onceSealed();
    if (status === 4 && statusCode === 0) {
      return { success: true };
    }
    return { success: false, error: errorMessage };
  } catch (e) {
    console.log(e);
    transactionStatus.set(99);
    return { success: false, error: e }
  }
}
