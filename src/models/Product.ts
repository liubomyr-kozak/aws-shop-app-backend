import * as Yup from "yup";

export const ProductSchema = Yup.object({
  id: Yup.string(),
  title: Yup.string().default(""),
  description: Yup.string().default(""),
  price: Yup.number().positive().defined().default(0),
});

export const AvailableProductSchema = ProductSchema.shape({
  count: Yup.number().integer().min(0).defined().default(0),
});

export type Product = Yup.InferType<typeof ProductSchema>;
export type AvailableProduct = Yup.InferType<typeof AvailableProductSchema>;
