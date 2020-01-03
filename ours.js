const axios = require('./resources/axios')
const parser = require('./resources/parser')
const mysql = require('./resources/mysql')
// const proxy = require('./resources/proxies')
const colors = require('colors')
const cheerio = require('cheerio')

const etherscanBase = 'https://etherscan.io'
const etherscanApiBase = 'https://api.etherscan.io/api';
const blockURL = `${etherscanBase}/txs?block=`
const verifiedContractPage = `${etherscanBase}/contractsVerified/`
const start = 1
const startBlock = 7650153

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


const verfiedContractPageEnd = 20
const totalTransactionsOnPage = 25

startApp()

async function startApp () {
  // before looking for new addresses we check for existing verified contracts
  await importSourceCode()

  // loop through verified contracts page

  for (let y = start; y <= verfiedContractPageEnd; y++) {
    scrapeVerifiedContracts(y)
    await sleep(sleepTimeVerifiedPage)
  }

  // check verified contract page every minute
  checkVerifiedContractsPage(1)

  // check pending addresses for verified accounts
  importSourceCode(true)

  // get current block number
  let currentBlock = await latestBlock()
  console.log('Current Block Number on Mainnet: ', currentBlock)

  // get last block indexed on Ethereum
  let finalBlock = await mysql.lastBlockIndexed()
  console.log('Last Block Indexed from DB: ', finalBlock)

  // check startBlock
  await mysql.checkStartBlock(startBlock)
  console.log('Checking to see if the start block is indexed...')

  if (finalBlock === 0) {
    console.log('No blocks found indexed in DB')
  } else {
    // check and insert block gaps
    let blockGaps = await mysql.blockGaps()
    console.log(blockGaps)
    console.log('Checking block gaps...')
    if (blockGaps.length > 0) {
      for (let u = 0; u < blockGaps.length; u++) {
        for (let p = blockGaps[u].gap_starts_at; p <= blockGaps[u].gap_ends_at; p++) {
          scrapeBlockPage(p)
          mysql.insertIndexedBlock(p)
          await sleep(sleepTimeBlockGap)
        }
      }
    }
  }

  // import the source code into mysql
  checkSourceCodeImport()

  // check Transaction page every minute
  // checkNewBlocks()

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
  console.log(totalTransactions)
  let totalpages = Math.ceil(totalTransactions / totalTransactionsOnPage)
  parseTransactionsTable(data)
  if (totalpages > 1) {
    for (let i = 2; i < totalpages; i++) {
      await sleep(sleepTimeBlockPage)
      console.log('Scraping Page ' + i + ' of Block #' + block + '...')
      let blockPagePaginated = blockURL + block + '&p=' + i
      // let paginatedData = await axios.fetchPage(blockPagePaginated, host)
      let paginatedData = await axios.fetchPageNoProxy(blockPagePaginated)
      parseTransactionsTable(paginatedData)
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

function parseTransactionsTable (data) {
  let addressArray = []
  let $ = cheerio.load(data)
  $('tbody > tr > td').each(function (i, element) {
    let res = $(this)
    let parsedData = res.children().html()
    if (parsedData !== null) {
      if (parsedData.includes('fa-file-alt')) {
        let address = callback(parsedData)
        addressArray.push(address)
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

function callback (data) {
  var re = new RegExp('href="/address/(.*?)">', 'i')
  let address = data.match(re)
  if (address) {
    return address[1]
  }
}

function removeDuplicates (array) {
  // Use hashtable to remove duplicate addresses
  var seen = {}
  return array.filter(function (item) {
    return seen.hasOwnProperty(item) ? false : (seen[item] = true)
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
  let block = JSON.parse(await axios.fetchPageNoProxy(esLastBlockURL))
  return parseInt(block.result, 16)
}

function getBlockPages (data) {
  var re = new RegExp('total of(.*?)transactions', 'i')
  let total = data.match(re)[1]
  if (total) {
    return parseInt(total.trim())
  }
}

async function importSourceCode (repeat = false) {
  // let addresses = await mysql.checkAddresses()
  let addresses = await mysql.checkVerifiedAddresses()
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

        mysql.updateAddresses(importAddress, 1, 1, 1, 0, verifiedContract.contractName, verifiedContract.compilerVersion, verifiedContract.optimization, verifiedContract.runs, verifiedContract.evmVersion, verifiedContract.sourceCode, verifiedContract.bytecode, verifiedContract.constructorArguments, verifiedContract.libraries, verifiedContract.abi)
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
      await mysql.updateAddresses(address, blockscout, verified, checked, failed, verifiedContract.contractName, verifiedContract.compilerVersion, verifiedContract.optimization, verifiedContract.runs, verifiedContract.evmVersion, verifiedContract.sourceCode, verifiedContract.bytecode, verifiedContract.constructorArguments, verifiedContract.libraries, verifiedContract.abi)
    }
    await sleep(sleepTimeOne)
  }
  checkSourceCodeImport()
}
