const common = require('./common')
const constants = require('./constants')

const {
  importSourceCode,
  processBlocks,
  scrapeVerifiedContracts,
  sleep,
  checkSourceCodeImport,
  checkNewBlocks,
  checkVerifiedContractsPage,
  addBlockInfo
} = common

const {
  verfiedContractPageStart,
  verfiedContractPageEnd,
  sleepTimeVerifiedPage
} = constants

startApp()

async function startApp () {
  // loop through verified contracts page, only inserts addresses
  for (let y = verfiedContractPageStart; y <= verfiedContractPageEnd; y++) {
    scrapeVerifiedContracts(y)
    await sleep(sleepTimeVerifiedPage)
  }

  // looks through unchecked, verified addresses (from verified page)
  importSourceCode(true, 1)

  // looks through unchecked, unverified addresses
  importSourceCode(true)

  // insert info for addresses from the verified page
  // importVerifiedSourceCode(true)

  // looks through checked = 1 && failed = 0 && abi NULL
  // fixme
  // checkSourceCodeImport()

  addBlockInfo(true)

  // processes each block to look for contract creations
  processBlocks()

  // check Transaction page every minute
  checkNewBlocks()

  // check verified contract page every minute
  checkVerifiedContractsPage(1)

  // check pending addresses for verified accounts
  // importSourceCode(true)
}
