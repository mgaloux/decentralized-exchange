const { ethers } = require('hardhat');
const { expect } = require('chai')

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Token', async () => {
    let token, accounts, deployer, receiver

    beforeEach(async () => {
        // Fetch token
        const Token = await ethers.getContractFactory('Token')
        token = await Token.deploy('Zeq Token', 'ZEQ', 1000000)

        accounts = await ethers.getSigners()
        deployer = accounts[0]
        receiver = accounts[1]
    })

    describe('Deployment', () => {
        const name = 'Zeq Token'
        const symbol = 'ZEQ'
        const decimals = 18
        const totalSupply = tokens('1000000')

        it('has a name', async () => {
            expect(await token.name()).to.equal(name)
        })
    
        it('has a symbol', async () => {
            expect(await token.symbol()).to.equal(symbol)
        })
    
        it('has a decimals', async () => {
            expect(await token.decimals()).to.equal(decimals)
        })
    
        it('has a totalSupply', async () => {
            expect(await token.totalSupply()).to.equal(totalSupply)
        })

        it('assigns total supply to deployer', async () => {
            expect(await token.balanceOf(deployer.address)).to.equal(totalSupply)
        })
    })

    describe('Sending Tokens', () => {
        let amount, transaction, result

        describe('Success', () => {
            beforeEach(async () => {
                amount = tokens(100)
                transaction = await token.connect(deployer).transfer(receiver.address, amount)
                result = await transaction.wait()
            })
    
            it('transfers token balances', async () => {
                expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900))
                expect(await token.balanceOf(receiver.address)).to.equal(amount)
            })
    
            it('emits a transfer event', async () => {
                expect(result.events[0].event).to.equal('Transfer')
                expect(result.events[0].args.from).to.equal(deployer.address)
                expect(result.events[0].args.to).to.equal(receiver.address)
                expect(result.events[0].args.value).to.equal(amount)
            })
        })

        describe('Failure', () => {
            it('rejects insufficient funds', async () => {
                const invalidAmount = tokens(100000000)
                await expect(token.connect(deployer).transfer(receiver.address, invalidAmount)).to.be.reverted
            })

            it('rejects invalid recipient', async () => {
                const amount = tokens(100)
                await expect(token.connect(deployer).transfer('0x0000000000000000000000000000000000000000', amount)).to.be.reverted

            })
        })
    })
})