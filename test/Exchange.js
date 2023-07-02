const { ethers } = require('hardhat');
const { expect } = require('chai')

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Exchange', async () => {
    let accounts, deployer, feeAccount, exchange, user1, user2, token1

    const feePercent = 10

    beforeEach(async () => {
        const Exchange = await ethers.getContractFactory('Exchange')
        const Token1 = await ethers.getContractFactory('Token')

        token1 = await Token1.deploy("Zeq Token", "ZEQ", 1000000)

        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]
        user1 = accounts[2]
        user2 = accounts[3]

        let transaction = await token1.connect(deployer).transfer(user1.address, tokens(100))
        await transaction.wait()

        exchange = await Exchange.deploy(feeAccount.address, feePercent)

        
    })

    describe('Deployment', () => {

        it('tracks the fee account', async () => {
            expect(await exchange.feeAccount()).to.equal(feeAccount.address)
        })

        it('tracks the fee percent', async () => {
            expect(await exchange.feePercent()).to.equal(feePercent)
        })
    })

    describe('Deposit Tokens', () => {
        let transaction, result
        let amount = tokens(10)

        beforeEach(async () => {
            transaction = await token1.connect(user1).approve(exchange.address, amount)
            result = await transaction.wait()
            transaction = await exchange.connect(user1).depositToken(token1.address, amount)
            result = await transaction.wait()
        })

        describe('Success', () => {
            it('tracks the token deposit', async () => {
                expect(await token1.balanceOf(exchange.address)).to.equal(amount)
                expect(await exchange.tokens(token1.address, user1.address)).to.equal(amount)
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
            })

            it('emits a deposit event', async () => {
                expect(result.events[1].event).to.equal('Deposit')
                expect(result.events[1].args.user).to.equal(user1.address)
                expect(result.events[1].args.token).to.equal(token1.address)
                expect(result.events[1].args.amount).to.equal(amount)
                expect(result.events[1].args.balance).to.equal(amount)
            })
        })

        describe('Failure', async () => {
            it('fails when not approved', async () => {
                await expect(exchange.connect(user1).depositToken(token1.address, amount)).to.be.reverted
                
            })
        })


    })

})