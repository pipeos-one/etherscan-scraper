// const etherscanBase = 'https://etherscan.io'
// const etherscanApiBase = 'https://api.etherscan.io/api'
// const startBlock = 7650153

const etherscanBase = 'https://ropsten.etherscan.io'
const etherscanApiBase = 'https://api-ropsten.etherscan.io/api'
const startBlock = 6000000

// const etherscanBase = 'https://kovan.etherscan.io'
// const etherscanApiBase = 'https://api-kovan.etherscan.io/api'
// const startBlock = 10000000
//
// const etherscanBase = 'https://rinkeby.etherscan.io'
// const etherscanApiBase = 'https://api-rinkeby.etherscan.io/api'
// const startBlock = 5000000

// const etherscanBase = 'https://goerli.etherscan.io'
// const etherscanApiBase = 'https://api-goerli.etherscan.io/api'
// const startBlock = 200000


const blockURL = `${etherscanBase}/txs?block=`
const verifiedContractPage = `${etherscanBase}/contractsVerified/`

// const sleepTimeOne = 1000
// const sleepTimeThousand = 30000
// const sleepTimeVerifiedPage = 1500
// const sleepTimeBlockGap = 1500
// const sleepTimeNewBlock = 1500
// const sleepTimeFindNewBlocks = 60000
// const sleepTimeCheckVerifiedPage = 1800000
// const sleepTimeBlockPage = 1000

const sleepTimeOne = 1
const sleepTimeThousand = 5000
const sleepTimeVerifiedPage = 1000
const sleepTimeBlockGap = 1000
const sleepTimeNewBlock = 1000
const sleepTimeFindNewBlocks = 60000
const sleepTimeCheckVerifiedPage = 1800000
const sleepTimeBlockPage = 1000

const verfiedContractPageStart = 1
const verfiedContractPageEnd = 20
const totalTransactionsOnPage = 25

module.exports = {
  etherscanBase,
  etherscanApiBase,
  startBlock,
  blockURL,
  verifiedContractPage,
  sleepTimeOne,
  sleepTimeThousand,
  sleepTimeVerifiedPage,
  sleepTimeBlockGap,
  sleepTimeNewBlock,
  sleepTimeFindNewBlocks,
  sleepTimeCheckVerifiedPage,
  sleepTimeBlockPage,
  verfiedContractPageStart,
  verfiedContractPageEnd,
  totalTransactionsOnPage
}
