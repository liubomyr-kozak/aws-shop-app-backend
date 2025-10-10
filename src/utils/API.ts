import { API_PATHS } from "~/constants/apiPaths";

class Api {
  async getProductsList() {
    const api = await API_PATHS;
    const url = `${api.product}/products`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

export default new Api();
