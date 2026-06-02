import axios from 'axios';

const httpClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData && config.headers) {
    const headers = config.headers;
    if (typeof headers.delete === 'function') {
      headers.delete('Content-Type');
    } else if (typeof headers === 'object') {
      delete (headers as Record<string, string>)['Content-Type'];
    }
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.localStorage.removeItem('ej-user');
    }

    console.error('[API Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });

    return Promise.reject(error);
  }
);

export default httpClient;
