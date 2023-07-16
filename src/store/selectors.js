import { createSelector } from 'reselect'
import { get, groupBy, reject, maxBy, minBy, max } from 'lodash'
import { ethers } from 'ethers'
import moment from 'moment'

const tokens = state => get(state, 'tokens.contracts')
const account = state => get(state, 'provider.account')
const allOrders = state => get(state, 'exchange.allOrders.data', [])
const cancelledOrders = state => get(state, 'exchange.cancelledOrders.data', [])
const filledOrders = state => get(state, 'exchange.filledOrders.data', [])


const openOrders = state => {
    const all = allOrders(state)
    const filled = filledOrders(state)
    const cancelled = cancelledOrders(state)

    const openOrders = reject(all, (order) => {
        // get boolean for this question : is there an order in the "filled" array
        // that has a corresponding id with the current order in the loop
        const orderFilled = filled.some((o) => o.id.toString() === order.id.toString())
        const orderCancelled = cancelled.some((o) => o.id.toString() === order.id.toString())

        return orderFilled || orderCancelled
    })

    return openOrders
}

const GREEN = '#25CE8F'
const RED = '#F45353'

export const decorateOrderBookOrders = (orders, tokens) => {
    return (
        orders.map((order) => {
            order = decorateOrder(order, tokens)
            order = decorateOrderBookOrder(order, tokens)
            return (order)
        })
    )
}

export const decorateOrderBookOrder = (order, tokens) => {
    const orderType = order.tokenGive === tokens[1].address ? 'buy' : 'sell'

    return ({
        ...order,
        orderType,
        orderTypeClass: (orderType === 'buy' ? GREEN : RED),
        orderFillAction: (orderType === 'buy' ? 'buy' : 'sell')
    })
}


// MY ORDERS
export const myOpenOrdersSelector = createSelector(
    account, tokens, openOrders, (account, tokens, orders) => {
        if (!tokens[0] || !tokens[1]) { return }


        // filter by account
        orders = orders.filter((o) => o.user === account)

        // Filter by trading pair
        orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
        orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)

        // add display attributes
        orders = decorateMyOpenOrders(orders, tokens)

        // sort descending
        orders = orders.sort((a,b) => b.timestamp - a.timestamp)

        return orders
    }
    
)

const decorateMyOpenOrders = (orders, tokens) => {
    return (
        orders.map((order) => {
            order = decorateOrder(order, tokens)
            order = decorateMyOpenOrder(order, tokens)
            
            return order
        })
    )
}

const decorateMyOpenOrder = (order, tokens) => {
    let orderType = order.tokenGive === tokens[1].address ? 'buy' : 'sell'

    return({
        ...order,
        orderType,
        orderTypeClass: (orderType === 'buy' ? GREEN : RED)
    })
}

export const decorateOrder = (order, tokens) => {
    let token0Amount, token1Amount

    if (order.tokenGive === tokens[1].address) {
        token0Amount = order.amountGive
        token1Amount = order.amountGet
    } else {
        token0Amount = order.amountGet
        token1Amount = order.amountGive
    }

    let tokenPrice = (token1Amount / token0Amount)
    tokenPrice =  Math.round(tokenPrice * 100000) / 100000

    let o = {
        ...order,
        token0Amount: ethers.utils.formatUnits(token0Amount, "ether"),
        token1Amount: ethers.utils.formatUnits(token1Amount, "ether"),
        tokenPrice,
        formattedTimestamp: moment.unix(order.timestamp).format('h:mm:ssa d MMM D')
    }

    return (o)
}

// ----------------------------------------------------------------------------
// ALL FILLED ORDERS

export const filledOrdersSelector = createSelector(
    filledOrders, tokens, (orders, tokens) => {
        if (!tokens[0] || !tokens[1]) { return }

        // Filter by trading pair
        orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
        orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)
        
        // sort orders by date ascending
        orders = orders.sort((a,b) => a.timestamp - b.timestamp)

        // apply order colors
        orders = decorateFilledOrders(orders, tokens)

        // sort orders by date DESCENDNIG for display
        orders = orders.sort((a,b) => b.timestamp - a.timestamp)

        return orders
    }
)

const decorateFilledOrders = (orders, tokens) => {
    let previousOrder = orders[0]

    return (
        orders.map((order) => {
            order = decorateOrder(order, tokens)
            order = decorateFilledOrder(order, previousOrder)
            previousOrder = order
            return order
        })
    )
}

const decorateFilledOrder = (order, previousOrder) => {
    return({
        ...order,
        tokenPriceClass: tokenPriceClass(order.tokenPrice, order.id, previousOrder)
    })
}

const tokenPriceClass = (tokenPrice, orderId, previousOrder) => {
    if (previousOrder.id === orderId) {
        return GREEN
    }

    return previousOrder.tokenPrice <= tokenPrice ? GREEN : RED
}

// ----------------------------------------------------------------------------
// ORDER BOOK

export const orderBookSelector = createSelector(
    openOrders,
    tokens,
    (orders, tokens) => {
        if (!tokens[0] || !tokens[1]) { return }


        // Filter by trading pair
        orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
        orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)

        // decorate orders
        orders = decorateOrderBookOrders(orders, tokens)

        // grouping
        orders = groupBy(orders, 'orderType')

        // sort buy orders by tokens price
        let buyOrders = get(orders, 'buy', [])
        orders = {
            ...orders,
            buyOrders: buyOrders.sort((a,b) => b.tokenPrice - a.tokenPrice)
        }

        // sort sell orders by token price
        let sellOrders = get(orders, 'sell', [])
        orders = {
            ...orders,
            sellOrders: sellOrders.sort((a,b) => b.tokenPrice - a.tokenPrice)
        }
        
        return orders
})

// PRICE CHART /////////////////////////////////////////////////
//

export const priceChartSelector = createSelector(
    filledOrders,
    tokens,
    (orders, tokens) => {
        if (!tokens[0] || !tokens[1]) { return }

        orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
        orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)

        // sort by timestamp (descending)
        orders = orders.sort((a, b) => a.timestamp - b.timestamp)

        orders = orders.map((o) => decorateOrder(o, tokens))

        let secondLastOrder, lastOrder
        [secondLastOrder, lastOrder] = orders.slice(orders.length - 2, orders.length)
        const lastPrice = get(lastOrder, 'tokenPrice', 0)
        const secondLastPrice = get(secondLastOrder, 'tokenPrice', 0)

       
        return ({
            lastPrice,
            lastPriceChange: (lastPrice >= secondLastPrice ? '+' : '-'),
            series: [{
                data: buildGraphData(orders)
            }]
        })
        

    }
)

const buildGraphData = (orders) => {
    // group orders by day. startOf can also work with hours, minutes etc
    orders = groupBy(orders, (o) => moment.unix(o.timestamp).startOf('hour').format())

    const hours = Object.keys(orders)


    return hours.map((hour) => {
        // Fetch all order from current hour
        const group = orders[hour]

        // Calculate price values
        const open = group[0] // first order
        const high = maxBy(group, 'tokenPrice') // maximum price
        const low = minBy(group, 'tokenPrice') // lowest price
        const close = group[group.length - 1] // last order

        return ({
            x: new Date(hour), 
            y: [open.tokenPrice, high.tokenPrice, low.tokenPrice, close.tokenPrice]
        })
    })
}
