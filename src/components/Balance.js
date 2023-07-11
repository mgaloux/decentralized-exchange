import dapp from '../assets/dapp.svg'
import eth from '../assets/eth.svg'
import { useSelector, useDispatch } from 'react-redux'
import { loadBalances, transferTokens } from '../store/interactions'
import { useEffect, useState, useRef } from 'react'

const Balance = () => {
    const dispatch = useDispatch()
    const symbols = useSelector(state => state.tokens.symbols)
    const tokensBalances = useSelector(state => state.tokens.balances)
    const provider = useSelector(state => state.provider.connection)
    const exchangeBalances = useSelector(state => state.exchange.balances)
    const transferInProgress = useSelector(state => state.exchange.transferInProgress)
    const exchange = useSelector(state => state.exchange.contract)
    const tokens = useSelector(state => state.tokens.contracts)
    const account = useSelector(state => state.provider.account)
    const [token1TransferAmount , setToken1TransferAmount] = useState(0)
    const [token2TransferAmount , setToken2TransferAmount] = useState(0)

    const withdrawRef = useRef(null)
    const depositRef = useRef(null)
    const [isDeposit , setIsDeposit] = useState(true)
    

    const amountHandler = (e, token) => {
        if (token.address == tokens[0].address) {
            setToken1TransferAmount(e.target.value)
        } else {
            setToken2TransferAmount(e.target.value)
        }
    }

    const tabHandler = (e) => {
        if (e.target.className !== depositRef.current.className) {
            e.target.className = 'tab tab--active'
            depositRef.current.className = 'tab'
            setIsDeposit(false)
        } else {
            e.target.className = 'tab tab--active'
            withdrawRef.current.className = 'tab'
            setIsDeposit(true)
        }
    }

    const depositHandler = (e, token) => {
        e.preventDefault()
        if (token.address == tokens[0].address) {
            transferTokens(provider, exchange, 'Deposit', tokens[0], token1TransferAmount, dispatch)
            setToken1TransferAmount(0)
        } else {
            transferTokens(provider, exchange, 'Deposit', tokens[1], token2TransferAmount, dispatch)
            setToken2TransferAmount(0)
        }
    }

    const withdrawHandler = (e, token) => {
        e.preventDefault()
        if (token.address == tokens[0].address) {
            transferTokens(provider, exchange, 'Withdraw', tokens[0], token1TransferAmount, dispatch)
            setToken1TransferAmount(0)
        } else {
            transferTokens(provider, exchange, 'Withdraw', tokens[1], token2TransferAmount, dispatch)
            setToken2TransferAmount(0)
        }
    }

    useEffect(() => {
        if (exchange && tokens[0] && tokens[1] && account) {
            loadBalances(exchange, tokens, account, dispatch)
        }
    }, [exchange, tokens, account, transferInProgress])


    return (
      <div className='component exchange__transfers'>
        <div className='component__header flex-between'>
          <h2>Balance</h2>
          <div className='tabs'>
            <button onClick={tabHandler} ref={depositRef} className='tab tab--active'>Deposit</button>
            <button onClick={tabHandler} ref={withdrawRef} className='tab'>Withdraw</button>
          </div>
        </div>
  
        {/* Deposit/Withdraw Component 1 (DApp) */}
  
        <div className='exchange__transfers--form'>
          <div className='flex-between'>
            <p>
                <small>Token</small>
                <br/>
                <img src={dapp} alt="Token Logo"/>
                {symbols && symbols[0]}
            </p>
            <p>
                <small>Wallet</small>
                <br/>
                {tokensBalances && tokensBalances[0]}
            </p>
            <p>
                <small>Exchange</small>
                <br/>
                {exchangeBalances && exchangeBalances[0]}
            </p>
          </div>
  
          <form onSubmit={ isDeposit ?
            (e) => depositHandler(e, tokens[0]) :
            (e) => withdrawHandler(e, tokens[0]) }>
            <label htmlFor="token0">{symbols && symbols[0]} Amount</label>
            <input
            type="text"
            id='token0'
            placeholder='0.0000'
            value={token1TransferAmount === 0 ? '' : token1TransferAmount}
            onChange={(e) => amountHandler(e, tokens[0])}/>
  
            <button className='button' type='submit'>
                {
                    isDeposit ?
                    <span>Deposit</span>
                    :
                    <span>Withdraw</span>
                }
            </button>
          </form>
        </div>
  
        <hr />
  
        {/* Deposit/Withdraw Component 2 (mETH) */}
  
        <div className='exchange__transfers--form'>
          <div className='flex-between'>
          <p>
                <small>Token</small>
                <br/>
                <img src={eth} alt="Token Logo"/>
                {symbols && symbols[1]}
            </p>
            <p>
                <small>Wallet</small>
                <br/>
                {tokensBalances && tokensBalances[1]}
            </p>
            <p>
                <small>Exchange</small>
                <br/>
                {exchangeBalances && exchangeBalances[1]}
            </p>
          </div>
  
          <form onSubmit={isDeposit ?
            (e) => depositHandler(e, tokens[1]) :
            (e) => withdrawHandler(e, tokens[1])}>
            <label htmlFor="token1">{symbols && symbols[1]} Amount</label>
            <input
            type="text"
            id='token1'
            placeholder='0.0000'
            value={token2TransferAmount === 0 ? '' : token2TransferAmount}
            onChange={(e) => amountHandler(e, tokens[1])}/>
            <button className='button' type='submit'>
                {
                    isDeposit ?
                    <span>Deposit</span>
                    :
                    <span>Withdraw</span>
                }
            </button>
          </form>
        </div>
  
        <hr />
      </div>
    );
  }
  
  export default Balance;
  