import { apiRequest } from './api';

/**
 * Frontend API client for Wholesale Product Catalogue.
 */
export const productsService = {
  /**
   * Lists products with pagination, search, and category filtering.
   */
  async listProducts({ page = 1, limit = 20, search = '', category = '', isAvailable = null } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (search && search.trim()) {
      params.append('search', search.trim());
    }

    if (category && category !== 'All') {
      params.append('category', category);
    }

    if (isAvailable !== null && isAvailable !== undefined) {
      params.append('is_available', String(isAvailable));
    }

    return apiRequest(`/api/v1/products?${params.toString()}`);
  },

  /**
   * Retrieves single product by ID.
   */
  async getProduct(productId) {
    return apiRequest(`/api/v1/products/${productId}`);
  },

  /**
   * Creates a new product and initializes stock.
   */
  async createProduct(data) {
    return apiRequest('/api/v1/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Updates an existing product.
   */
  async updateProduct(productId, data) {
    return apiRequest(`/api/v1/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Deactivates a product.
   */
  async deleteProduct(productId) {
    return apiRequest(`/api/v1/products/${productId}`, {
      method: 'DELETE',
    });
  },
};

