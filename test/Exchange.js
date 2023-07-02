const { ethers } = require('hardhat');
const { expect } = require('chai');
const { orderBy } = require('lodash');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Exchange', async () => {
    let accounts, deployer, feeAccount, exchange, user1, user2, token1, token2

    const feePercent = 10

    beforeEach(async () => {
        const Exchange = await ethers.getContractFactory('Exchange')
        const Token = await ethers.getContractFactory('Token')

        token1 = await Token.deploy("Zeq Token", "ZEQ", 1000000)
        token2 = await Token.deploy("Mock DAI", "mDAI", 1000000)

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


    describe('Withdraw Tokens', () => {
        let transaction, result
        let amount = tokens(10)

        describe('Success', () => {
            beforeEach(async () => {
                transaction = await token1.connect(user1).approve(exchange.address, amount)
                result = await transaction.wait()
                transaction = await exchange.connect(user1).depositToken(token1.address, amount)
                result = await transaction.wait()
    
                //Withdrawing
                transaction = await exchange.connect(user1).withdrawToken(token1.address, amount)
                result = await transaction.wait()
            })

            it('withdraws token funds', async () => {
                expect(await token1.balanceOf(exchange.address)).to.equal(0)
                expect(await exchange.tokens(token1.address, user1.address)).to.equal(0)
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(0)
            })

            it('emits a withdrawal event', async () => {
                expect(result.events[1].event).to.equal('Withdrawal')
                expect(result.events[1].args.user).to.equal(user1.address)
                expect(result.events[1].args.token).to.equal(token1.address)
                expect(result.events[1].args.amount).to.equal(amount)
                expect(result.events[1].args.balance).to.equal(0)
            })
        })

        describe('Failure', async () => {
            it('fails for insufficient balance', async () => {
                await expect(exchange.connect(user1).withdrawToken(token1.address, amount)).to.be.reverted
                
            })
        })
    })

    describe('Checking balances', () => {
        let transaction, result
        let amount = tokens(1)

        beforeEach(async () => {
            transaction = await token1.connect(user1).approve(exchange.address, amount)
            result = await transaction.wait()
            transaction = await exchange.connect(user1).depositToken(token1.address, amount)
            result = await transaction.wait()
        })

        it('returns user balance', async () => {
            expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
        })
    })

    describe('Making orders', async () => {
        let transaction, result
        let amount = tokens(1)

        describe('Success', async () => {
            beforeEach(async () => {
                transaction = await token1.connect(user1).approve(exchange.address, amount)
                result = await transaction.wait()
                transaction = await exchange.connect(user1).depositToken(token1.address, amount)
                result = await transaction.wait()
    
                //Withdrawing
                transaction = await exchange.connect(user1).makeOrder(
                    token2.address,
                    amount,
                    token1.address,
                    amount
                    )
                result = await transaction.wait()
            })

            it('tracks the newly created order', async () => {
                expect(await exchange.orderCount()).to.equal(1)
            })

            it('emits an order event', async () => {
                expect(result.events[0].event).to.equal('Order')
                expect(result.events[0].args.id).to.equal(1)
                expect(result.events[0].args.user).to.equal(user1.address)
                expect(result.events[0].args.tokenGet).to.equal(token2.address)
                expect(result.events[0].args.tokenGive).to.equal(token1.address)
                expect(result.events[0].args.amountGet).to.equal(amount)
                expect(result.events[0].args.amountGive).to.equal(amount)
                expect(result.events[0].args.timestamp).to.at.least(1)
            })
        })

        describe('Failure', async () => {
            it('fails for insufficient balance', async () => {
                await expect(exchange.connect(user1).makeOrder(token2.address, amount, token1.address, tokens(1))).to.be.reverted
            })
        })
    })
})