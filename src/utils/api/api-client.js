const axios = require("axios");
const Bottleneck = require("bottleneck");
class ApiClient {
  constructor(baseUrl, defaultHeaders = {}, options = {}) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      allowAbsoluteUrls: true,
      headers: { "User-Agent": "Snappy-Discord-Bot/1.0", ...defaultHeaders },
      timeout: options.timeout || 10000,
    });
    this.rateLimiter = options.rateLimiter || null;

    if (this.rateLimiter) {
      // Wrap all request with bottleneck
      this.client.request = this.rateLimiter.wrap(
        this.client.request.bind(this.client),
      );
    }
  }
  async request(method, endpoint, params = {}) {
    const fullUrl = new URL(endpoint, this.client.defaults.baseURL || undefined)
      .href;
    try {
      const response = await this.client.request({
        method: method,
        url: endpoint,
        params,
      });
      console.log(`[ApiClient] Making ${method} request to ${fullUrl}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 429) {
        console.warn(`Rate limited ${this.constructor.name}`);
      }
      if (error.response) {
        throw new Error(
          `API Error ${error.response.status}: ${error.response.data}`,
        );
      } else {
        throw new Error(`Request failed ${error.message}`);
      }
    }
  }

  async get(endpoint, params = {}) {
    return await this.request("GET", endpoint, params);
  }
}

module.exports = ApiClient;
