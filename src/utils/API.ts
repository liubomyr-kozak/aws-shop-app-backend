import API_PATHS from "~/constants/apiPaths";

class Api {
  // ...existing code...

  async getProductsList() {
    const url = `${API_PATHS.product}/products`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // ...existing code...
}

export default new Api();

