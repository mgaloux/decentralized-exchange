import config from '../config.json'
import { useSelector, useDispatch } from 'react-redux'
import { loadTokens } from '../store/interactions'

const Markets = () => {
    const chainId = useSelector(state => state.provider.chainId)
    const provider = useSelector(state => state.provider.connection)
    const dispatch = useDispatch()

    const marketHandler = (e) => {
        loadTokens(provider, (e.target.value).split(','), dispatch)
    }

    return(
      <div className='component exchange__markets'>
        <div className='component__header'>
            <h2>Select Market</h2>
            
        </div>
        { chainId && config[chainId] ? 
            <select name="markets" id="markets" onChange={marketHandler}>
                <option value={`${config[chainId].ZeqToken.address},${config[chainId].mETH.address}`}>ZEQ / mETH</option>
                <option value={`${config[chainId].ZeqToken.address},${config[chainId].mDAI.address}`}>ZEQ / mDAI</option>
            </select>
            : 
            'no chain id'
        }
        
        <hr />
      </div>
    )
  }
  
  export default Markets;
