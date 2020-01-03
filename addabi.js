const mysql = require('./resources/mysql')
const axios = require('./resources/axios')

// https://api.etherscan.io/api?module=contract&action=getabi&address=0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413&apikey=YourApiKeyToken

const sleepTime = 10

const apiKeyEtherscan = 'RTQFC6E17RAF51RZE715514Z4CRWCA4NXB';
const baseEtherscanApi = 'https://api.etherscan.io/api'
const contractEtherscanApi = (apikey) => (action) => (address) => `${baseEtherscanApi}?module=contract&action=${action}&address=${address}&apikey=${apikey}`
const abiEtherscanApi = contractEtherscanApi(apiKeyEtherscan)('getabi')

// const contractEtherscanApi2 = (action) => (address) => `${baseEtherscanApi}?module=contract&action=${action}&address=${address}`
// const abiEtherscanApi2 = contractEtherscanApi2('getabi')



checkNextAbi()
let count = 0

async function checkNextAbi () {
  const emptyAbiRow = await mysql.checkAbiAddresses()
  if (!emptyAbiRow) {
    console.log('--Finished ABIs--')
    return
  }

  const address = emptyAbiRow[0].address
  const url = abiEtherscanApi(address)

  count++
  console.log('--- count', count, address)

  let data = await axios.fetchPageNoProxy(url)

  try {
    const parsedData = JSON.parse(data)
    const abi = parsedData.result
    let abi_verified = 0

    // try {
    //   JSON.parse(abi)
    //   abi_verified = 1
    // } catch (e) {
    //   console.log('- could not parse abi')
    // }

    const upd = await mysql.updateAddressesAbi(address, abi, abi_verified)
    console.log('- upd', upd)
  } catch (e) {
    console.log('----', address, e)
  }

  await sleep(sleepTime)

  checkNextAbi()
}

async function sleep (millis) {
  return new Promise(resolve => setTimeout(resolve, millis))
}
