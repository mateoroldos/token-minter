import EmeraldPass from "./utility/EmeraldPass.cdc"

pub contract TouchstoneContracts {

  pub let ContractsBookStoragePath: StoragePath
  pub let ContractsBookPublicPath: PublicPath
  pub let GlobalContractsBookStoragePath: StoragePath
  pub let GlobalContractsBookPublicPath: PublicPath

  pub enum ReservationStatus: UInt8 {
    pub case notFound // was never made
    pub case expired // this means someone made it but their Emerald Pass expired
    pub case active // is currently active
  }

  pub resource interface ContractsBookPublic {
    pub fun getContracts(): [String]
  }

  pub resource ContractsBook: ContractsBookPublic {
    pub let contractNames: {String: Bool}

    pub fun addContract(contractName: String) {
      let me: Address = self.owner!.address
      self.contractNames[contractName] = true
      
      let globalContractsBook = TouchstoneContracts.account.borrow<&GlobalContractsBook>(from: TouchstoneContracts.GlobalContractsBookStoragePath)!
      globalContractsBook.addUser(address: me)

      if EmeraldPass.isActive(user: me) {
        globalContractsBook.reserve(contractName: contractName, user: me)
      }
    }

    pub fun removeContract(contractName: String) {
      self.contractNames.remove(key: contractName)
    }

    pub fun getContracts(): [String] {
      return self.contractNames.keys
    }

    init() {
      self.contractNames = {}
    }
  }

  pub resource interface GlobalContractsBookPublic {
    pub fun getAllUsers(): [Address]
    pub fun getAllReservations(): {String: Address}
    pub fun getAddressFromContractName(contractName: String): Address?
    pub fun getReservationStatus(contractName: String): ReservationStatus
  }

  pub resource GlobalContractsBook: GlobalContractsBookPublic {
    pub let allUsers: {Address: Bool}
    pub let reservedContractNames: {String: Address}

    pub fun addUser(address: Address) {
      self.allUsers[address] = true
    }

    pub fun reserve(contractName: String, user: Address) {
      pre {
        self.getReservationStatus(contractName: contractName) != ReservationStatus.active: contractName.concat(" is already taken!")
        EmeraldPass.isActive(user: user): "This user does not have an active Emerald Pass subscription."
      }
      self.reservedContractNames[contractName] = user
    }

    pub fun removeReservation(contractName: String) {
      self.reservedContractNames.remove(key: contractName)
    }

    pub fun getAllUsers(): [Address] {
      return self.allUsers.keys
    }

    pub fun getAllReservations(): {String: Address} {
      return self.reservedContractNames
    }

    pub fun getReservationStatus(contractName: String): ReservationStatus {
      let reservedBy = self.reservedContractNames[contractName]
      if reservedBy == nil {
        return ReservationStatus.notFound
      } else if !EmeraldPass.isActive(user: reservedBy!) {
        let userEmeraldPass = getAccount(reservedBy!).getCapability(EmeraldPass.VaultPublicPath).borrow<&EmeraldPass.Vault{EmeraldPass.VaultPublic}>() ?? panic("This account no longer has an Emerald Pass Vault for some reason.")
        
        // If the user's Emerald Pass has been expired for more than a month, allow replacement
        if userEmeraldPass.endDate + 2629743.0 < getCurrentBlock().timestamp {
          return ReservationStatus.expired
        }
      }
      return ReservationStatus.active
    }

    pub fun getAddressFromContractName(contractName: String): Address? {
      if self.getReservationStatus(contractName: contractName) == ReservationStatus.active {
        return self.reservedContractNames[contractName]
      }
      return nil
    }

    init() {
      self.allUsers = {}
      self.reservedContractNames = {}
    }
  }

  pub fun createContractsBook(): @ContractsBook {
    return <- create ContractsBook()
  }

  pub fun getUserTouchstoneCollections(user: Address): [String] {
    let collections = getAccount(user).getCapability(TouchstoneContracts.ContractsBookPublicPath)
                        .borrow<&ContractsBook{ContractsBookPublic}>()
                        ?? panic("This user has not set up a Collections yet.")

    return collections.getContracts()
  }

  pub fun getGlobalContractsBook(): &GlobalContractsBook{GlobalContractsBookPublic} {
    return self.account.getCapability(TouchstoneContracts.GlobalContractsBookPublicPath)
            .borrow<&GlobalContractsBook{GlobalContractsBookPublic}>()!
  }

  init() {
    self.ContractsBookStoragePath = /storage/TouchstoneContractsBookv2
    self.ContractsBookPublicPath = /public/TouchstoneContractsBookv2
    self.GlobalContractsBookStoragePath = /storage/TouchstoneGlobalContractsBookv2
    self.GlobalContractsBookPublicPath = /public/TouchstoneGlobalContractsBookv2

    self.account.save(<- create GlobalContractsBook(), to: TouchstoneContracts.GlobalContractsBookStoragePath)
    self.account.link<&GlobalContractsBook{GlobalContractsBookPublic}>(TouchstoneContracts.GlobalContractsBookPublicPath, target: TouchstoneContracts.GlobalContractsBookStoragePath)
  }

}
 