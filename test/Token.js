const { ethers } = require('hardhat');
const { expect } = require('chai')

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Token', async () => {
    let token, accounts, deployer

    beforeEach(async () => {
        // Fetch token
        const Token = await ethers.getContractFactory('Token')
        token = await Token.deploy('Zeq Token', 'ZEQ', 1000000)

        accounts = await ethers.getSigners()
        deployer = accounts[0]
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
})