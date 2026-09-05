export default () => ({
    port: parseInt(process.env.PORT || '5000', 10),
    openAi: {
      apiKey: process.env.AZURE_OPENAI_MODEL_KEY,
      endpoint: process.env.AZURE_OPENAI_MODEL_ENDPOINT,
      apiVersion: process.env.AZURE_OPENAI_MODEL_API_VERSION,
      deploymentName: process.env.AZURE_OPENAI_MODEL_NAME,
      searchEndPoint : process.env.AZURE_SEARCH_ENDPOINT,
      searchKey : process.env.AZURE_SEARCH_KEY,
      searchIndexName : process.env.AZURE_SEARCH_INDEX_NAME,
      intelligenceEndpoint: process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
      intelligenceKey: process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY,
    },
    upload: {
      destination: process.env.UPLOAD_DESTINATION || 'uploads',
    },
    perplexity: {
      endpoint: process.env.PERPLEXITY_API_ENDPOINT,
      apiKey: process.env.PERPLEXITY_API_KEY,
    },
  });