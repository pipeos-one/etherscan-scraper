var connection = require('./database')

let self = module.exports = {
  insertAddress: async ({address, txhash, block}, isVerified) => {
    let results = await new Promise((resolve, reject) =>
      connection.query('SELECT * from addresses WHERE address = ?', [address], (err, res) => {
        if (err) {
          reject(err)
        } else {
          if (res.length === 0) {
            if (address) {
              console.log('Inserting ' + address + ' into the DB...')
              connection.query('INSERT INTO addresses (address, verified, txhash, block) VALUES (?, ?, ?, ?)', [address, isVerified, txhash, block])
            }
          } else {
            if (isVerified === true && res[0].blockscout === 0 && res[0].failed === 0) {
              self.updateAddresses(res[0].address, 0, 1, 0, 0, txhash, block)
            }
          }
        }
      })
    )
    return results
  },
  sourceCodeAddresses: async () => {
    let results = await new Promise((resolve, reject) => {
      connection.query('SELECT * FROM addresses WHERE (blockscout = ? AND contractName IS NULL) OR (failed = ? AND contractName IS NULL) LIMIT 1', [1, 1], (err, res) => {
        if (err) {
          console.log(err)
        }
        resolve(res)
      })
    })
    return results
  },
  sourceCodeAddresses2: async () => {
    let results = await new Promise((resolve, reject) => {
      connection.query('SELECT * FROM addresses WHERE (verified = ? AND contractName IS NULL) OR (failed = ? AND contractName IS NULL) LIMIT 1', [1, 1], (err, res) => {
        if (err) {
          console.log(err)
        }
        resolve(res)
      })
    })
    return results
  },
  lastBlockIndexed: async () => {
    let results = await new Promise((resolve, reject) =>
      connection.query('SELECT * FROM blocks ORDER BY block DESC LIMIT 1', (err, res) => {
        if (err) {
          reject(err)
        } else {
          if (res.length > 0) {
            resolve(res[0].block)
          } else {
            resolve(0)
          }
        }
      })
    )
    return results
  },
  insertIndexedBlock: async (block) => {
    let results = await new Promise((resolve, reject) =>
      connection.query('INSERT INTO blocks (block) VALUES (?)', [block], (err, res) => {
        if (err) {
          reject(err)
        } else {
          resolve(res)
        }
      })
    )
    return results
  },
  checkAddresses: async () => {
    let results = await new Promise((resolve, reject) =>
      connection.query('SELECT * FROM addresses WHERE checked = ? AND blockscout = ? AND id > ? ORDER BY id DESC LIMIT 1000', [0, 0, 0], (err, res) => {
        if (err) {
          reject(err)
        } else {
          resolve(res)
        }
      })
    )
    return results
  },
  checkVerifiedAddresses: async () => {
    let results = await new Promise((resolve, reject) =>
      connection.query('SELECT * FROM addresses WHERE verified = ? AND checked = ? AND blockscout = ? AND id > ? ORDER BY id DESC LIMIT 1000', [1, 0, 0, 0], (err, res) => {
        if (err) {
          reject(err)
        } else {
          resolve(res)
        }
      })
    )
    return results
  },
  updateAddresses: async (address, blockscout, verified, checked, failed, txhash = null, block = null, contractName = null, compilerVersion = null, optimization = null, runs = null, evmVersion = null, sourceCode = null, bytecode = null, constructorArguments = null, libraries = null, abi = null) => {
    if (libraries) {
      libraries = 1
    }
    let upd = 'UPDATE addresses SET blockscout = ?, verified = ?, checked = ?, failed = ?, contractName = ?, compilerVersion = ?, optimization = ?, runs = ?, evmVersion = ?, sourceCode = ?, bytecode = ?, constructorArguments = ?, libraries = ?, abi = ?'
    let args = [blockscout, verified, checked, failed, contractName, compilerVersion, optimization, runs, evmVersion, sourceCode, bytecode, constructorArguments, libraries, abi]
    if (txhash) {
      upd += ', txhash = ?'
      args.push(txhash)
    }
    if (block) {
      upd += ', block = ?'
      args.push(block)
    }
    args.push(address)
    let results = await new Promise((resolve, reject) =>
      connection.query(upd + ' WHERE address = ?', args, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve(true)
        }
      })
    )
    return results
  },
  checkStartBlock: async (start) => {
    let results = await new Promise((resolve, reject) => {
      connection.query('SELECT * FROM blocks ORDER BY block ASC', (err, results) => {
        if (err) {
          console.log(err)
        }
        if (results.length > 0 && results[0].block === start) {
          resolve(true)
        } else {
          connection.query('INSERT INTO blocks (block) VALUES (?)', [start], (error) => {
            if (error) {
              console.log(error)
            }
            resolve(true)
          })
        }
      })
    })
    return results
  },
  blockGaps: async () => {
    let results = await new Promise((resolve, reject) => {
      connection.query('SELECT (t1.block + 1) as gap_starts_at, (SELECT MIN(t3.block) -1 FROM blocks t3 WHERE t3.block > t1.block) as gap_ends_at FROM blocks t1 WHERE NOT EXISTS (SELECT t2.block FROM blocks t2 WHERE t2.block = t1.block + 1) HAVING gap_ends_at IS NOT NULL', (err, res) => {
        if (err) {
          console.log(err)
        }
        resolve(res)
      })
    })
    return results
  },
  storeSource: async (address, contract) => {
    let results = await new Promise((resolve, reject) => {
      connection.query('UPDATE addresses SET name = ?, compiler = ?, optimization = ?, runs = ?, source = ?, constructor = ?, libraries = ?, bytecode = ? WHERE address = ?', [contract.contractName, contract.compilerVersion, contract.optimization, contract.runs, contract.sourceCode, contract.constructorArguments, contract.libraries, contract.bytecode, address], (err, res) => {
        if (err) {
          console.log(err)
          reject(err)
        } else {
          resolve(true)
        }
      })
    })
    return results
  },
  updateAddressesAbi: async (address, abi = '[]', abi_verified = 0) => {
    let results = await new Promise((resolve, reject) =>
      connection.query('UPDATE addresses SET abi = ?, abi_verified = ? WHERE address = ?', [abi, abi_verified, address], (err) => {
        if (err) {
          reject(err)
        } else {
          resolve(true)
        }
      })
    )
    return results
  },
  checkAbiAddresses: async () => {
    let results = await new Promise((resolve, reject) => {
      connection.query('SELECT * FROM addresses WHERE verified = ? AND abi IS NULL LIMIT 1', [1], (err, res) => {
        if (err) {
          console.log(err)
        }
        resolve(res)
      })
    })
    return results
  },
}
