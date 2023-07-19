const hre = require("hardhat");
const config = require('../src/config.json')

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

const wait = (seconds) => {
    const milliseconds = seconds * 1000
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function main() {
    const accounts = await ethers.getSigners()
    const { chainId } = await ethers.provider.getNetwork()
    console.log("Using chainID:", chainId)

    const ZeqToken = await ethers.getContractAt('Token', config[chainId].ZeqToken.address)
    console.log(`Zeq Token fetched: ${ZeqToken.address}`)

    const mETH = await ethers.getContractAt('Token', config[chainId].mETH.address)
    console.log(`mETH fetched: ${mETH.address}`)

    const mDAI = await ethers.getContractAt('Token', config[chainId].mDAI.address)
    console.log(`mDAI fetched: ${mDAI.address}`)

    const exchange = await ethers.getContractAt('Exchange', config[chainId].exchange.address)
    console.log(`exchange fetched: ${exchange.address}`)

    // Give tokens to account[1]
    const sender = accounts[0]
    const receiver = accounts[1]
    let amount = tokens(10000)

    // user1 transfers 10000 meth
    let transaction, result
    transaction = await mETH.connect(sender).transfer(receiver.address, amount)
    console.log(`Transferred ${amount} tokens from ${sender.address} to ${receiver.address}`)

    // setup exchange users
    const user1 = accounts[0]
    const user2 = accounts[1]
    amount = tokens(10000)

    // user1 approves 10000 zeq token
    transaction = await ZeqToken.connect(user1).approve(exchange.address, amount)
    await transaction.wait()
    console.log(`Approved ${amount} tokens from ${user1.address}`)

    // user1 deposits 10000 zeq token
    transaction = await exchange.connect(user1).depositToken(ZeqToken.address, amount)
    await transaction.wait()
    console.log(`Deposited ${amount} tokens from ${user1.address}`)

    // user2 approves 10000 mETH
    transaction = await mETH.connect(user2).approve(exchange.address, amount)
    await transaction.wait()
    console.log(`Approved ${amount} tokens from ${user2.address}`)


    // user2 deposits 10000 mETH
    transaction = await exchange.connect(user2).depositToken(mETH.address, amount)
    await transaction.wait()
    console.log(`Deposited ${amount} tokens from ${user2.address}`)

    /////////////////////////////////////////////////
    // Seed a canceled order

    let orderId
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), ZeqToken.address, tokens(5))
    result = await transaction.wait()
    console.log(`Made order from ${user1.address}`)

    // Cancel order
    orderId = result.events[0].args.id
    transaction = await exchange.connect(user1).cancelOrder(orderId)
    await transaction.wait()
    console.log(`Cancelled order from ${user1.address}`)

    await wait(1)

    // make orders
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), ZeqToken.address, tokens(10))
    result = await transaction.wait()
    console.log(`Made order from ${user1.address}`)

    // Fill order
    orderId = result.events[0].args.id
    transaction = await exchange.connect(user2).fillOrder(orderId)
    await transaction.wait()
    console.log(`Order filled from ${user2.address}`)

    await wait(1)

    // make another order
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(50), ZeqToken.address, tokens(15))
    result = await transaction.wait()
    console.log(`Made order from ${user1.address}`)

    // user 2 Fill order again
    orderId = result.events[0].args.id
    transaction = await exchange.connect(user2).fillOrder(orderId)
    result = await transaction.wait()
    console.log(`Order filled from ${user2.address}`)


    await wait(1)

    // make final order
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(200), ZeqToken.address, tokens(20))
    result = await transaction.wait()
    console.log(`Made order from ${user1.address}`)

    // user 2 Fill final order
    orderId = result.events[0].args.id
    transaction = await exchange.connect(user2).fillOrder(orderId)
    await transaction.wait()
    console.log(`Order filled from ${user2.address}`)

    await wait(1)

    //////////////////////////////////////////
    // seed open orders

    // user 1 and 2 makes orders
    for (let i = 1; i <= 10; i++) {
        transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(10 * i), ZeqToken.address, tokens(10))
        await transaction.wait()
        await wait(1)
        console.log(`Made order from user 1 ${user1.address}`)
        transaction = await exchange.connect(user2).makeOrder(ZeqToken.address, tokens(10), mETH.address, tokens(10 * i))
        await transaction.wait()
        await wait(1)
        console.log(`Made order from user 2 ${user2.address}`)
    }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  