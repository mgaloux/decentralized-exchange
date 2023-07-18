import { useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { myEventsSelector } from "../store/selectors";
import config from '../config.json'

const Alert = () => {
    const isPending = useSelector(state => state.exchange.transaction.isPending)
    const isSuccessful = useSelector(state => state.exchange.transaction.isSuccessful)
    const network = useSelector(state => state.provider.network) 
    
    const alertRef = useRef(null)

    const events = useSelector(myEventsSelector)

    const [msg, setMsg] = useState('Transaction Pending...')
    const [eventInfo, setEventInfo] = useState('')
    const [transactionLink, setTransactionLink] = useState('#')

    useEffect(() => {
        if (isPending) {
            setMsg('Transaction Pending...')
            setEventInfo('')
            setTransactionLink('#')
            alertRef.current.className = 'alert'
        } else if (isSuccessful && !events[0]) {
            setMsg('Transaction validated !')
            setTimeout(() => {
                alertRef.current.className = 'alert alert--remove'
            }, 10000);
        } else if (isSuccessful && events[0]) {
            setMsg('Transaction validated !')
            setEventInfo(
                events[0].transactionHash.slice(0, 6)
                + '...'
                + events[0].transactionHash.slice(60, 66)
            )
            setTransactionLink(config[network] ? 
                `${config[network].explorer}/tx/${events[0].transactionHash}`
                :
                '#')
            setTimeout(() => {
                alertRef.current.className = 'alert alert--remove'
            }, 10000);
            setTimeout(() => {
                setEventInfo('')
                setTransactionLink('#')
            }, 11000);
        } else {
            setMsg('DRAMATIC ERROR')
        }
    }, [isPending, events, isSuccessful, network])

    const removeHandler = () => {
        alertRef.current.className = 'alert alert--remove'
    }

    return (
        <div className="alert alert--remove" ref={alertRef}
        onClick={() => removeHandler()}>
            <h1>{msg}</h1>
            <a href={transactionLink}>{eventInfo}</a>
        </div>
    );
  }
  
  export default Alert;
  