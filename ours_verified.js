const common = require('./common')
const {
  importSourceCode,
  checkSourceCodeImport,
  addBlockInfo
} = common

// INSERT INTO `addresses`(`address`, `contractName`, `txhash`) SELECT ContractAddress, ContractName, Txhash FROM `TABLE 1` WHERE 1

// UPDATE `addresses` SET checked = 0 WHERE abi IS NULL

startApp()

async function startApp () {
  // looks through unchecked, unverified addresses
  importSourceCode(true)

  addBlockInfo(true)

  // looks through checked = 1 && failed = 0 && abi NULL
  checkSourceCodeImport()
}
