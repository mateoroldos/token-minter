import { writable, get, derived } from 'svelte/store';

const EMULATOR_ADDR = "0xf8d6e0586b0a20c7";
const NONFUNGIBLETOKEN_ADDR = "0x631e88ae7f1d7c20";
const FLOWTOKEN_ADDR = "0x7e60df042a9c0868";
const FUNGIBLETOKEN_ADDR = "0x9a0766d93b6608b7";

export const user = writable(null);
export const profile = writable(null);
export const transactionStatus = writable(null);
export const transactionInProgress = writable(false);

export const contractInfo = writable({
	name: 'ExampleNFT',
	maxSupply: null,
	payment: null,
	openMinting: true,
	startMinting: true
})

export const contractCode = derived(
	[contractInfo, user],
	([$contractInfo, $user]) => `
	// This is an example implementation of a Flow Non-Fungible Token
	// It is not part of the official standard but it assumed to be
	// very similar to how many NFTs would implement the core functionality.
	import NonFungibleToken from ${NONFUNGIBLETOKEN_ADDR}
	import MetadataViews from ${NONFUNGIBLETOKEN_ADDR}
	${$contractInfo.payment ?
			`import FungibleToken from ${FUNGIBLETOKEN_ADDR}
	import FlowToken from ${FLOWTOKEN_ADDR}
	`
			: ''
		}
	
	pub contract ${$contractInfo.name}: NonFungibleToken {
	
			pub var totalSupply: UInt64
			pub var minting: Bool
	
			pub event ContractInitialized()
			pub event Withdraw(id: UInt64, from: Address?)
			pub event Deposit(id: UInt64, to: Address?)
	
			pub let CollectionStoragePath: StoragePath
			pub let CollectionPublicPath: PublicPath
			pub let MinterStoragePath: StoragePath
			pub let AdministratorStoragePath: StoragePath
	
			pub resource NFT: NonFungibleToken.INFT, MetadataViews.Resolver {
					pub let id: UInt64
					pub let serial: UInt64
	
					pub let name: String
					pub let description: String
					pub let thumbnail: String
	
					init(
						_serial: UInt64,
						_name: String,
						_description: String,
						_thumbnail: String
					) {
						pre {
							${$contractInfo.name}.minting:
								"Minting is currently closed by the Administrator!"
						}
						self.id = self.uuid
						self.serial = _serial
						self.name = _name
						self.description = _description
						self.thumbnail = _thumbnail
	
						${$contractInfo.name}.totalSupply = ${$contractInfo.name}.totalSupply + 1
							${$contractInfo.maxSupply
			?
			`
						if (${$contractInfo.name}.totalSupply > ${$contractInfo.maxSupply}) {
							panic("You cannot mint any more NFTs!")
						}`
			:
			''
		}
					}
			
					pub fun getViews(): [Type] {
							return [
									Type<MetadataViews.Display>()
							]
					}
	
					pub fun resolveView(_ view: Type): AnyStruct? {
							switch view {
								case Type<MetadataViews.Display>():
										return MetadataViews.Display(
											name: self.name,
											description: self.description,
											thumbnail: MetadataViews.IPFSFile(
													cid: self.thumbnail,
													path: nil
											)
										)
							}
							return nil
					}
			}
	
			pub resource interface NFTCollectionPublic {
					pub fun deposit(token: @NonFungibleToken.NFT)
					pub fun getIDs(): [UInt64]
					pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT
			}
	
			pub resource Collection: NFTCollectionPublic, NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic, MetadataViews.ResolverCollection {
				// dictionary of NFT conforming tokens
				// NFT is a resource type with an 'UInt64' ID field
				pub var ownedNFTs: @{UInt64: NonFungibleToken.NFT}

				init () {
					self.ownedNFTs <- {}
				}

				// withdraw removes an NFT from the collection and moves it to the caller
				pub fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
					let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")

					emit Withdraw(id: token.id, from: self.owner?.address)

					return <-token
				}

				// deposit takes a NFT and adds it to the collections dictionary
				// and adds the ID to the id array
				pub fun deposit(token: @NonFungibleToken.NFT) {
					let token <- token as! @${$contractInfo.name}.NFT

					let id: UInt64 = token.id

					// add the new token to the dictionary
					self.ownedNFTs[id] <-! token

					emit Deposit(id: id, to: self.owner?.address)
				}

				// getIDs returns an array of the IDs that are in the collection
				pub fun getIDs(): [UInt64] {
					return self.ownedNFTs.keys
				}

				// borrowNFT gets a reference to an NFT in the collection
				// so that the caller can read its metadata and call its methods
				pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT {
					return &self.ownedNFTs[id] as &NonFungibleToken.NFT
				}

				pub fun borrowViewResolver(id: UInt64): &AnyResource{MetadataViews.Resolver} {
					let token = &self.ownedNFTs[id] as auth &NonFungibleToken.NFT
					let nft = token as! &${$contractInfo.name}.NFT
					return nft as &AnyResource{MetadataViews.Resolver}
				}

				destroy() {
					destroy self.ownedNFTs
				}
			}
	
			// public function that anyone can call to create a new empty collection
			pub fun createEmptyCollection(): @NonFungibleToken.Collection {
				return <- create Collection()
			}

			${$contractInfo.openMinting
			?
			`
			pub fun mintNFT(
				recipient: &{NonFungibleToken.CollectionPublic},
				name: String,
				description: String,
				thumbnail: String,
				${$contractInfo.payment ? 'payment: @FlowToken.Vault' : ''}
			) {
				${$contractInfo.payment
				?
				`
				pre {
					payment.balance == ${$contractInfo.payment.toFixed(2)}: "You did not pass in the correct amount of FlowToken."
				}

				let paymentRecipient = ${$contractInfo.name}.account.getCapability(/public/flowTokenReceiver)
																	.borrow<&FlowToken.Vault{FungibleToken.Receiver}>()!

				paymentRecipient.deposit(from: <- payment)
				`
				:
				''}
				// create a new NFT
				var newNFT <- create NFT(
						_serial: ${$contractInfo.name}.totalSupply,
						_name: name,
						_description: description,
						_thumbnail: thumbnail
				)

				// deposit it in the recipient's account using their reference
				recipient.deposit(token: <- newNFT)
			}
			`
			:
			`
			// Resource that an admin or something similar would own to be
			// able to mint new NFTs
			//
			pub resource NFTMinter {
	
				// mintNFT mints a new NFT with a new ID
				// and deposit it in the recipients collection using their collection reference
				pub fun mintNFT(
						recipient: &{NonFungibleToken.CollectionPublic},
						name: String,
						description: String,
						thumbnail: String,
						${$contractInfo.payment ? 'payment: @FlowToken.Vault' : ''}
				) {
						${$contractInfo.payment
				?
				`
						pre {
							payment.balance == ${$contractInfo.payment.toFixed(2)}: "You did not pass in the correct amount of FlowToken."
						}

						let paymentRecipient = ${$contractInfo.name}.account.getCapability(/public/flowTokenReceiver)
																			.borrow<&FlowToken.Vault{FungibleToken.Receiver}>()!

						paymentRecipient.deposit(from: <- payment)
						`
				:
				''}
						// create a new NFT
						var newNFT <- create NFT(
								_serial: ${$contractInfo.name}.totalSupply,
								_name: name,
								_description: description,
								_thumbnail: thumbnail
						)

						// deposit it in the recipient's account using their reference
						recipient.deposit(token: <- newNFT)
				}
		}
		`
		}

			pub resource Administator {
				${!$contractInfo.openMinting
				?
				`
				pub fun createMinter(): @NFTMinter {
					return <- create NFTMinter()
				}
				`
				:
				''
			}
				pub fun toggleMinting(): Bool {
					ExampleNFT.minting = !ExampleNFT.minting
					return ExampleNFT.minting
				}
			}
	
			init() {
				// Initialize the total supply
				self.totalSupply = 0
				self.minting = ${$contractInfo.startMinting}

				// Set the named paths
				self.CollectionStoragePath = /storage/${$user?.addr}${$contractInfo.name}Collection
				self.CollectionPublicPath = /public/${$user?.addr}${$contractInfo.name}Collection
				self.MinterStoragePath = /storage/${$user?.addr}${$contractInfo.name}Minter
				self.AdministratorStoragePath = /storage/${$user?.addr}${$contractInfo.name}Administrator

				// Create a Collection resource and save it to storage
				let collection <- create Collection()
				self.account.save(<-collection, to: self.CollectionStoragePath)

				// create a public capability for the collection
				self.account.link<&${$contractInfo.name}.Collection{NonFungibleToken.CollectionPublic, ${$contractInfo.name}.NFTCollectionPublic, MetadataViews.ResolverCollection}>(
					self.CollectionPublicPath,
					target: self.CollectionStoragePath
				)

				// Create a Administrator resource and save it to storage
				let administrator <- create Administrator()
				self.account.save(<- administator, to: self.AdministratorStoragePath)
	
					${!$contractInfo.openMinting
			?
			`
				// Create a Minter resource and save it to storage
				let minter <- create NFTMinter()
				self.account.save(<- minter, to: self.MinterStoragePath)
			`
			: ''
		}
				emit ContractInitialized()
			}
	}
  `);