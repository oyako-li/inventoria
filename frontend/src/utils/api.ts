// APIクライアントユーティリティ

// 開発環境では相対パスを使用し、本番環境では完全なURLを使用
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
// const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const DEBUG = false;

export interface ApiConfig {
  baseURL: string;
  debug: boolean;
}

export const apiConfig: ApiConfig = {
  baseURL: API_BASE_URL,
  debug: DEBUG
};

// ログアウト処理のコールバック関数
let logoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

export const getApiUrl = (endpoint: string): string => {
  const url = `${apiConfig.baseURL}${endpoint}`;
  if (apiConfig.debug) {
    console.log(`API Request: ${url}`);
  }
  return url;
};

export const apiRequest = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const url = getApiUrl(endpoint);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (apiConfig.debug) {
    console.log(`API Request: ${url}`, defaultOptions);
  }

  const response = await fetch(url, defaultOptions);

  if (apiConfig.debug) {
    console.log(`API Response: ${url}`, response.status, response.statusText);
  }

  // 401エラー（Invalid token）の場合、ログアウト処理を実行
  if (response.status === 401) {
    console.warn('Invalid token detected. Logging out...');
    if (logoutCallback) {
      logoutCallback();
    }
  }

  return response;
};

export const apiGet = async (endpoint: string, headers?: Record<string, string>) => {
  return apiRequest(endpoint, { 
    method: 'GET',
    headers 
  });
};

export const apiPost = async (endpoint: string, data?: any, headers?: Record<string, string>) => {
  return apiRequest(endpoint, {
    method: 'POST',
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
};

export const apiPut = async (endpoint: string, data?: any, headers?: Record<string, string>) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
};

export const apiDelete = async (endpoint: string, headers?: Record<string, string>) => {
  return apiRequest(endpoint, {
    method: 'DELETE',
    headers,
  });
}; 