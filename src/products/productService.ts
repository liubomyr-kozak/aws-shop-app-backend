export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number;
}

export function getProducts() {
  return Promise.resolve(products);
}

const products: Product[] = [
  {
    id: "1",
    title: "Wireless Mouse",
    description: "Ergonomic wireless mouse with adjustable DPI.",
    price: 25.99,
    count: 100,
  },
  {
    id: "2",
    title: "Mechanical Keyboard",
    description: "RGB backlit mechanical keyboard with blue switches.",
    price: 89.99,
    count: 50,
  },
  {
    id: "3",
    title: "Gaming Headset",
    description: "Surround sound gaming headset with noise-canceling mic.",
    price: 59.99,
    count: 70,
  },
  {
    id: "4",
    title: "4K Monitor",
    description: "27-inch 4K UHD monitor with HDR support.",
    price: 299.99,
    count: 20,
  },
  {
    id: "5",
    title: "Laptop Stand",
    description: "Adjustable aluminum laptop stand with cooling design.",
    price: 39.99,
    count: 150,
  },
  {
    id: "6",
    title: "USB-C Hub",
    description: "Multiport adapter with HDMI, USB 3.0, and card reader.",
    price: 29.99,
    count: 200,
  },
  {
    id: "7",
    title: "Portable SSD",
    description: "1TB high-speed portable solid-state drive.",
    price: 129.99,
    count: 60,
  },
  {
    id: "8",
    title: "Smartphone Tripod",
    description: "Flexible tripod with Bluetooth remote for smartphones.",
    price: 19.99,
    count: 80,
  },
  {
    id: "9",
    title: "Wireless Charger",
    description: "Fast wireless charging pad compatible with Qi devices.",
    price: 34.99,
    count: 120,
  },
  {
    id: "10",
    title: "Noise Cancelling Earbuds",
    description: "Compact true wireless earbuds with ANC and long battery life.",
    price: 99.99,
    count: 90,
  },
];
