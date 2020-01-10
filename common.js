const axios = require('./resources/axios')
const parser = require('./resources/parser')
const mysql = require('./resources/mysql')
// const proxy = require('./resources/proxies')
const colors = require('colors')
const cheerio = require('cheerio')
const constants = require('./constants')

const {
  sleepTimeOne,
  sleepTimeThousand,
  sleepTimeBlockGap,
  sleepTimeNewBlock,
  sleepTimeFindNewBlocks,
  sleepTimeCheckVerifiedPage,
  sleepTimeBlockPage,
  totalTransactionsOnPage,
  etherscanBase,
  etherscanApiBase,
  startBlock,
  blockURL,
  verifiedContractPage
} = constants

async function processBlocks () {
  // get current block number
  let currentBlock = await latestBlock()
  console.log('Current Block Number on chain: ', currentBlock)
  await mysql.insertIndexedBlock(currentBlock).catch(e => console.log(e.message))

  // get last block indexed on Ethereum
  let finalBlock = await mysql.lastBlockIndexed()
  console.log('Last Block Indexed from DB: ', finalBlock)

  // check startBlock
  await mysql.checkStartBlock(startBlock)
  console.log('Checking to see if the start block is indexed...')
  console.log(startBlock, finalBlock)

  if (finalBlock === 0) {
    console.log('No blocks found indexed in DB')
  } else {
    // check and insert block gaps
    let blockGaps = await mysql.blockGaps()
    console.log(blockGaps)
    console.log('Checking block gaps...')
    if (blockGaps.length > 0) {
      for (let u = 1; u < blockGaps.length; u++) {
        for (let p = blockGaps[u].gap_starts_at; p <= blockGaps[u].gap_ends_at; p++) {
          scrapeBlockPage(p)
          mysql.insertIndexedBlock(p)
          await sleep(sleepTimeBlockGap)
        }
      }
    }
  }
}

async function checkNewBlocks () {
  console.log('Checking for new blocks...')
  let currentBlock = await latestBlock()
  let finalBlock = await mysql.lastBlockIndexed()
  for (let i = currentBlock; i > finalBlock; i--) {
    scrapeBlockPage(i)
    mysql.insertIndexedBlock(i)
    await sleep(sleepTimeNewBlock)
  }
  console.log(colors.blue('Sleeping for 60 seconds...'))
  await sleep(sleepTimeFindNewBlocks)
  checkNewBlocks()
}

async function checkVerifiedContractsPage (p) {
  console.log('Rechecking Verified Contract page #', p)
  scrapeVerifiedContracts(1)
  console.log(colors.blue('Sleeping for an hour and then rechecking smart contract page...'))
  await sleep(sleepTimeCheckVerifiedPage)
  p++
  checkVerifiedContractsPage(p)
}

async function scrapeVerifiedContracts (page) {
  console.log('Scraping Verified Contracts page ' + page + '...')
  // let host = proxy.generateProxy()
  let verifiedContractURL = verifiedContractPage + page
  // let data = await axios.fetchPage(verifiedContractURL, host)
  let data = await axios.fetchPageNoProxy(verifiedContractURL)
  return parseVerifiedContractPage(data)
}

async function scrapeBlockPage (block) {
  console.log('Scraping Page 1 of Block #' + block + '...')
  // let host = proxy.generateProxy()
  let blockPageURL = blockURL + block
  // let data = await axios.fetchPage(blockPageURL, host)
  let data = await axios.fetchPageNoProxy(blockPageURL)
  let totalTransactions = getBlockPages(data)
  console.log('totalTransactions', totalTransactions)
  let totalpages = Math.ceil(totalTransactions / totalTransactionsOnPage)
  parseTransactionsTable(data, block)

  if (totalpages > 1) {
    for (let i = 2; i < totalpages; i++) {
      await sleep(sleepTimeBlockPage)
      console.log('Scraping Page ' + i + ' of Block #' + block + '...')
      let blockPagePaginated = blockURL + block + '&p=' + i
      // let paginatedData = await axios.fetchPage(blockPagePaginated, host)
      let paginatedData = await axios.fetchPageNoProxy(blockPagePaginated)
      parseTransactionsTable(paginatedData, block)
    }
  }
}

function parseVerifiedContractPage (data) {
  let addressArray = []
  let $ = cheerio.load(data)
  $('tbody > tr > td').each(function (i, element) {
    let res = $(this)
    let parsedData = res.children().text()
    if (parsedData !== null) {
      if (parsedData) {
        let address = parsedData.trim()
        addressArray.push(address)
      }
    }
  })
  storeAddresses(addressArray, true)
}

function parseTransactionsTable (data, block) {
  let addressArray = []
  let $ = cheerio.load(data)
  let lastTxhash;
  $('tbody > tr > td').each(function (i, element) {
    let res = $(this)
    // let parsedData = res.children().html()
    let parsedData = res.html()
    if (parsedData !== null) {
      if (parsedData.includes('/tx/')) {
        lastTxhash = callbackGetTxhash(parsedData)
      }
      // transaction to contract or contract creation
      // if (parsedData.includes('fa-file-alt')) {

      if (parsedData.includes('Contract Creation')) {
        let address = callback(parsedData)
        // addressArray.push(address)
        addressArray.push({address, txhash: lastTxhash, block});
      }
    }
  })
  storeAddresses(addressArray)
}

function storeAddresses (addresses, isVerifiedPage = false) {
  let data = removeDuplicates(addresses)
  data.forEach(function (val) {
    mysql.insertAddress(val, isVerifiedPage)
  })
}

function callbackGetTxhash (data) {
  var re = new RegExp('href="/tx/(.*?)">', 'i')
  let txhash = data.match(re)
  if (txhash) {
    return txhash[1]
  }
}

function callback (data) {
  var re = new RegExp('href="/address/(.*?)"', 'i')
  let address = data.match(re)
  if (address) {
    return address[1]
  }
}

function removeDuplicates (array) {
  // Use hashtable to remove duplicate addresses
  var seen = {}
  // return array.filter(function (item) {
  //   return seen.hasOwnProperty(item) ? false : (seen[item] = true)
  // })

  return array.filter(function (item) {
    return seen.hasOwnProperty(item.address) ? false : (seen[item.address] = true)
  })
}

async function sleep (millis) {
  return new Promise(resolve => setTimeout(resolve, millis))
}

async function latestBlock () {
  // fetch latest block from etherscan
  // let host = proxy.generateProxy()
  let esLastBlockURL = `${etherscanApiBase}?module=proxy&action=eth_blockNumber&apikey=YourApiKeyToken`
  // let block = JSON.parse(await axios.fetchPage(esLastBlockURL, host))
  let block = JSON.parse(await axios.fetchPageNoProxy(esLastBlockURL));
  return parseInt(block.result, 16)
}

function getBlockPages (data) {
  var re = new RegExp('total of(.*?)transaction', 'i')
  let total = data.match(re)
  if (total && total[1]) {
    return parseInt(total[1].trim())
  } else {
    console.log('getBlockPages no txns found')
  }
}

async function importSourceCode (repeat = false, verified = 0) {
  // let addresses = await mysql.checkAddresses()
  let addresses = await mysql.checkVerifiedAddresses(verified)
  if (addresses.length > 0) {
    for (let i = 0; i < addresses.length; i++) {
      let importAddress = addresses[i].address
      console.log(importAddress)
      // let importAddress = '0xC374BF3bbA0A7C1e502E698741776A21E5f6eb9e'
      let etherscanCodeURL = `${etherscanBase}/address/` + importAddress + '#code'
      // let verifiedContract = await parser.parsePage(etherscanCodeURL)
      let verifiedContract = await parser.parsePageNoProxy(etherscanCodeURL)
      // console.log(verifiedContract)

      if (verifiedContract) {
        if (verifiedContract.constructorArguments) {
          console.log(colors.yellow(importAddress))
        }

        mysql.updateAddresses(importAddress, 1, 1, 1, 0, verifiedContract.txhash, null, verifiedContract.contractName, verifiedContract.compilerVersion, verifiedContract.optimization, verifiedContract.runs, verifiedContract.evmVersion, verifiedContract.sourceCode, verifiedContract.bytecode, verifiedContract.constructorArguments, verifiedContract.libraries, verifiedContract.abi, verifiedContract.sourceCodeJson, verifiedContract.sourcemap, verifiedContract.swarm, verifiedContract.license)
      } else {
      // mark contract as not verified on Etherscan
        console.log(importAddress + ' not verified on Etherscan...')
        mysql.updateAddresses(importAddress, 0, 0, 1, 0)
      }

      await sleep(sleepTimeOne)
    }
  }

  if (repeat === true) {
    await sleep(sleepTimeThousand)
    console.log(colors.blue('Rechecking address list backlog...'))
    importSourceCode(true)
  }
}

async function checkSourceCodeImport () {
  let addressArray = await mysql.sourceCodeAddresses2()
  if (addressArray) {
    let address = addressArray[0].address
    let blockscout = addressArray[0].blockscout
    let verified = addressArray[0].verified
    let checked = addressArray[0].checked
    let failed = addressArray[0].failed
    let etherscanCodeURL = `${etherscanBase}/address/` + address + '#code'
    // let verifiedContract = await parser.parsePage(etherscanCodeURL)
    let verifiedContract = await parser.parsePageNoProxy(etherscanCodeURL)
    if (verifiedContract) {
      console.log(colors.cyan(address + ' source code fetched and imported...'))
      await mysql.updateAddresses(address, blockscout, verified, checked, failed, verifiedContract.txhash, null, verifiedContract.contractName, verifiedContract.compilerVersion, verifiedContract.optimization, verifiedContract.runs, verifiedContract.evmVersion, verifiedContract.sourceCode, verifiedContract.bytecode, verifiedContract.constructorArguments, verifiedContract.libraries, verifiedContract.abi, verifiedContract.sourceCodeJson, verifiedContract.sourcemap, verifiedContract.swarm, verifiedContract.license)
    }
    await sleep(sleepTimeOne)
  }
  checkSourceCodeImport()
}

async function addBlockInfo (repeat = false) {
  let addresses = await mysql.emptyBlockAddresses()
  if (addresses.length > 0) {
    for (let i = 0; i < addresses.length; i++) {
      const { address, txhash } = addresses[i]
      let etherscanCodeURL = `${etherscanBase}/tx/` + txhash
      let blockData = await parser.parseTxPageNoProxy(etherscanCodeURL)
      console.log('--block', address, blockData.block)

      if (blockData) {
        mysql.updateBlockInfo(address, blockData.block)
      }

      await sleep(sleepTimeOne)
    }
  }

  if (repeat === true) {
    await sleep(sleepTimeThousand)
    console.log(colors.blue('Rechecking address list backlog for block NULL...'))
    addBlockInfo(true)
  }
}

module.exports = {
  processBlocks,
  checkNewBlocks,
  checkVerifiedContractsPage,
  scrapeVerifiedContracts,
  scrapeBlockPage,
  parseVerifiedContractPage,
  parseTransactionsTable,
  storeAddresses,
  callbackGetTxhash,
  callback,
  removeDuplicates,
  sleep,
  latestBlock,
  getBlockPages,
  importSourceCode,
  checkSourceCodeImport,
  addBlockInfo
}
