import axios, { AxiosError } from "axios";
import React from "react";
import { useQuery, useQueryClient, useMutation } from "react-query";
import { API_PATHS } from "~/constants/apiPaths";
import { OrderStatus } from "~/constants/order";
import { Order } from "~/models/Order";

export function useOrders() {
  return useQuery<Order[], AxiosError>("orders", async () => {
    const api = await API_PATHS;
    const res = await axios.get<Order[]>(`${api.order}/order`);
    return res.data;
  });
}

export function useInvalidateOrders() {
  const queryClient = useQueryClient();
  return React.useCallback(
    () => queryClient.invalidateQueries("orders", { exact: true }),
    []
  );
}

export function useUpdateOrderStatus() {
  return useMutation(
    async (values: { id: string; status: OrderStatus; comment: string }) => {
      const api = await API_PATHS;
      const { id, ...data } = values;
      return axios.put(`${api.order}/order/${id}/status`, data, {
        headers: {
          Authorization: `Basic ${localStorage.getItem("authorization_token")}`,
        },
      });
    }
  );
}

export function useSubmitOrder() {
  return useMutation(async (values: Omit<Order, "id">) => {
    const api = await API_PATHS;
    return axios.put<Omit<Order, "id">>(`${api.order}/order`, values, {
      headers: {
        Authorization: `Basic ${localStorage.getItem("authorization_token")}`,
      },
    });
  });
}

export function useInvalidateOrder() {
  const queryClient = useQueryClient();
  return React.useCallback(
    (id: string) =>
      queryClient.invalidateQueries(["order", { id }], { exact: true }),
    []
  );
}

export function useDeleteOrder() {
  return useMutation(async (id: string) => {
    const api = await API_PATHS;
    return axios.delete(`${api.order}/order/${id}`, {
      headers: {
        Authorization: `Basic ${localStorage.getItem("authorization_token")}`,
      },
    });
  });
}
