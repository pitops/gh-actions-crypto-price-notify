require('dotenv').config()

const fetch = require('node-fetch')
const Slack = require('slack-node')
const util = require('util')

const slackWebhookSecret = process.env.SLACK_WEBHOOK_SECRET
const coinMarketCapAPIKey = process.env.COINMARKETCAP_API_KEY

const CRYPTOCURRENCIES = ['XRP']

const slack = new Slack()
slack.setWebhook(`https://hooks.slack.com/services/${slackWebhookSecret}`)

// Promisify the slack webhook method
const slackWebhook = util.promisify(slack.webhook)

const postToSlack = async message => {
  await slackWebhook({
    channel: '#general',
    username: 'Kokoras',
    text: message
  })
}

const coinMarketCapEndPoint =
  'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=XRP'

const cryptoURL = symbol => {
  const url = new URL(coinMarketCapEndPoint)

  url.searchParams.set('symbol', symbol)

  return url
}

const getCryptoPrice = async symbol => {
  const resp = await fetch(cryptoURL(symbol), {
    headers: {
      'X-CMC_PRO_API_KEY': coinMarketCapAPIKey
    }
  })
  const body = await resp.json()
  return body
}

const main = async () => {
  const message = []
  for (let i = 0; i < CRYPTOCURRENCIES.length; i++) {
    const symbol = CRYPTOCURRENCIES[i]

    try {
      const cryptoData = await getCryptoPrice(symbol)
      const cryptoString = `Current price for ${symbol} is *$${cryptoData.data[
        symbol
      ].quote.USD.price.toFixed(4)}*, last updated *${
        cryptoData.data[symbol].last_updated
      }*`
      message.push(cryptoString)
    } catch (err) {
      message.push(
        `Unable to get crypto data for ${symbol}. Error: ${err.message}`
      )
    }
  }
  await postToSlack(message.join('\n'))
}

main()
