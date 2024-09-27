const { imgUploadPre, SERVER_HOST } = require('./constants')

require('babel-polyfill')

const environment = {
  development: {
    isProduction: false,
  },
  production: {
    isProduction: true,
  },
}[process.env.NODE_ENV || 'development']

const scriptInnerHTMLURL = imgUploadPre + '/projects'
const scriptInnerHTML = `
                  {
                    "@context": "http://schema.org",
                    "@type": "WebPage",
                    "name" : "DataTurks",
                    "url": ${scriptInnerHTMLURL}
                  }
                `
const schema = {
  type: 'application/ld+json',
  innerHTML: scriptInnerHTML,
}

module.exports = Object.assign(
  {
    host: process.env.HOST || 'localhost',
    port: process.env.PORT,
    apiHost: process.env.APIHOST || 'localhost',
    apiPort: process.env.APIPORT,
    // apiURL: process.env.BASE_URL || 'https://dataturks.com/dataturks/',
    apiURL: process.env.BASE_URL || SERVER_HOST + '/dataturks/',
    // servingEnv: process.env.NODE_DEST || "online",
    servingEnv: process.env.NODE_DEST || 'onpremise',
    app: {
      title: 'Dataturks',
      description:
        'Just upload your data, invite your team members and start tagging. The best way to tag training/evaluation data for your machine learning projects.',
      head: {
        titleTemplate: 'Dataturks: %s',
        meta: [
          {
            name: 'description',
            content:
              'Image Bounding Box, Image Classification, Text Classification, NER, NLP and other Machine Learning datasets',
          },
          { script: [schema] },
          { charset: 'utf-8' },
          { property: 'og:site_name', content: 'DataTurks' },
          { property: 'og:locale', content: 'en_US' },
          {
            property: 'og:title',
            content: 'Best online platform for your ML data annotation needs',
          },
          {
            property: 'og:description',
            content:
              'Just upload your data, invite your team members and start tagging. The best way to tag training/evaluation data for your machine learning projects.',
          },
          { property: 'og:card', content: 'summary' },
          { property: 'og:site', content: '@MedLabel-VIPA' },
          { property: 'og:creator', content: '@MedLabel-VIPA' },
          { property: 'og:image:width', content: '200' },
          { property: 'og:image:height', content: '200' },
        ],
      },
    },
  },
  environment
)
