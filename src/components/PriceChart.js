import { useSelector } from "react-redux";
import Banner from './Banner.js';
import ReactApexChart from "react-apexcharts";
import { options, defaultSeries } from "./PriceChart.config.js";
import { priceChartSelector } from "../store/selectors.js";
import { use } from "chai";
import arrowDown from '../assets/down-arrow.svg'
import arrowUp from '../assets/up-arrow.svg'

const PriceChart = () => {

    // are you connected with metamask
    const account = useSelector(state => state.provider.account)
    const symbols = useSelector(state => state.tokens.symbols)
    const priceChart = useSelector(priceChartSelector)
    console.log(priceChart)

    return (
      <div className="component exchange__chart">
        <div className='component__header flex-between'>
          <div className='flex'>
  
            <h2>{symbols && `${symbols[0]}/${symbols[1]}`}</h2>
  
            { priceChart && 
                <div className='flex'>
                <img
                    src={priceChart.lastPriceChange == '+' ?
                    arrowUp : arrowDown}
                    alt={priceChart.lastPriceChange == '+' ?
                    'Arrow Up' : 'Arrow Down'} />
                <span className='up'>{priceChart.lastPrice}</span>
                </div>
            }
            
  
          </div>
        </div>
  
        {!account ?
        <Banner text='Please Connect with MetaMask'></Banner>
        :
        <ReactApexChart
            type="candlestick"
            options={options}
            series={priceChart ? priceChart.series : defaultSeries}
            width="100%"
            height="100%"
        />
        }
  
      </div>
    );
  }
  
  export default PriceChart;