const express = require('express')
const cheerio = require('cheerio')
const https = require('https')

const app = express()
const port = 3000

const formatLink = link => {
  if (link.startsWith('http://')) {
    return link.replace('http://', 'https://')
  } else if (link.startsWith('https://')) {
    return link
  } else {
    if (link.startsWith('www.')) {
      return `https://${link}`
    } else {
      return `https://www.${link}`
    }
  }
}
const getTitle = (link, callback) => {
  const url = formatLink(link)
  https
    .get(url, res => {
      let data = ''

      res.on('data', chunk => {
        data += chunk
      })

      res.on('end', () => {
        const $ = cheerio.load(data)
        const title = $('title').text()
        callback(null, title)
      })
    })
    .on('error', error => {
      callback(error)
    })
}

const generateHTML = response => {
  const html = `
    <html>
      <head></head>
      <body>
        <h1>Following are the titles of given websites:</h1>
        <ul>

          ${Object.keys(response)
            .map(key => `<li>${key} - "${response[key]}"</li>`)
            .join('\n')}

        </ul>
      </body>
    </html>
  `

  return html
}
app.get('/I/want/title', async (req, res) => {
  const { address } = req.query
  const multipleAddr = Array.isArray(address)
  let addresses
  if (multipleAddr) {
    addresses = address
  } else {
    addresses = [address]
  }

  try {
    const response = {}

    const fetchTitles = index => {
      if (index >= addresses.length) {
        const html = generateHTML(response)
        res.send(html)
        return
      }

      getTitle(addresses[index], (error, title) => {
        if (error) {
          response[addresses[index]] = 'NO RESPONSE'
        } else {
          response[addresses[index]] = title
        }
        fetchTitles(index + 1)
      })
    }

    fetchTitles(0)
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve title/titles' })
  }
})

app.use('*', (req, res) => {
  res.status(404).send('404 - Address not found')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
