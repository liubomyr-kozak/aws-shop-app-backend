import axios, { AxiosError } from "axios";
import { API_PATHS } from "~/constants/apiPaths";
import { AvailableProduct } from "~/models/Product";
import { useQuery, useQueryClient, useMutation } from "react-query";
import React from "react";

export function useAvailableProducts() {
  return useQuery<AvailableProduct[], AxiosError>(
    "available-products",
    async () => {
      const api = await API_PATHS;
      const res = await axios.get<AvailableProduct[]>(
        `${api.product}/products`
      );
      return res.data;
    }
  );
}

export function useInvalidateAvailableProducts() {
  const queryClient = useQueryClient();
  return React.useCallback(
    () => queryClient.invalidateQueries("available-products", { exact: true }),
    [queryClient]
  );
}

export function useAvailableProduct(id?: string) {
  return useQuery<AvailableProduct, AxiosError>(
    ["product", { id }],
    async () => {
      const api = await API_PATHS;
      const res = await axios.get<AvailableProduct>(
        `${api.product}/products/${id}`
      );
      return res.data;
    },
    { enabled: !!id }
  );
}

export function useRemoveProductCache() {
  const queryClient = useQueryClient();
  return React.useCallback(
    (id?: string) =>
      queryClient.removeQueries(["product", { id }], { exact: true }),
    [queryClient]
  );
}

export function useCreateProduct() {
  return useMutation(async (product: Omit<AvailableProduct, "id">) => {
    const api = await API_PATHS;
    return axios.post<AvailableProduct>(`${api.product}/products`, product);
  });
}

type CreatePayload = {
  title: string;
  description?: string;
  price: number;
  count: number;
};

export function useUpsertAvailableProduct() {
  return useMutation(async (values: CreatePayload & { id?: string }) => {
    if (values.id) {
      throw new Error(
        "Edit is not supported yet. Implement PUT /products/{id} on BE."
      );
    }

    const payload = {
      title: String(values.title || ""),
      description: String(values.description || ""),
      price: Number(values.price),
      count: Number(values.count),
    };

    const res = await fetch(`${API_PATHS.product}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`POST /products failed: ${res.status} ${text}`);
    }

    return res.json().catch(() => ({}));
  });
}

export function useDeleteAvailableProduct() {
  const queryClient = useQueryClient();

  return useMutation(
    async (productId: string) => {
      const api = await API_PATHS;
      await axios.delete(`${api.product}/products/${productId}`);
      return productId;
    },
    {
      onSuccess: (deletedProductId) => {
        queryClient.removeQueries(["product", { id: deletedProductId }], {
          exact: true,
        });

        queryClient.invalidateQueries("available-products", { exact: true });

        console.log(`Product ${deletedProductId} deleted successfully`);
      },
      onError: (error: AxiosError) => {
        console.error("Failed to delete product:", error);
      },
    }
  );
}
