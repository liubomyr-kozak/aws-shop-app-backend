const mockProducts = [
  {
    id: '1',
    title: 'iPhone 14 Pro',
    description: 'Latest Apple iPhone with Pro camera system',
    price: 999,
    count: 10,
    image: 'https://example.com/iphone14pro.jpg'
  },
  {
    id: '2',
    title: 'Samsung Galaxy S23',
    description: 'Flagship Android smartphone with advanced features',
    price: 799,
    count: 15,
    image: 'https://example.com/galaxys23.jpg'
  },
  {
    id: '3',
    title: 'MacBook Pro M2',
    description: 'Professional laptop with M2 chip',
    price: 1299,
    count: 8,
    image: 'https://example.com/macbookpro.jpg'
  },
  {
    id: '4',
    title: 'iPad Air',
    description: 'Versatile tablet for work and entertainment',
    price: 599,
    count: 12,
    image: 'https://example.com/ipadair.jpg'
  },
  {
    id: '5',
    title: 'AirPods Pro',
    description: 'Wireless earbuds with active noise cancellation',
    price: 249,
    count: 25,
    image: 'https://example.com/airpodspro.jpg'
  }
];

exports.handler = async (event, context) => {
  console.log('GetProductsById Lambda triggered');

  try {
    const productId = event.pathParameters?.productId;

    if (!productId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, OPTIONS'
        },
        body: JSON.stringify({ message: 'Product ID is required' })
      };
    }

    const product = mockProducts.find(p => p.id === productId);

    if (!product) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, OPTIONS'
        },
        body: JSON.stringify({ message: 'Product not found' })
      };
    }

    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify(product)
    };

    return response;
  } catch (error) {
    console.error('Error in GetProductsById Lambda:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};
