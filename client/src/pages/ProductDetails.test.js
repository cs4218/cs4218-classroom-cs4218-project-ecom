import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ProductDetails from './ProductDetails';
import axios from 'axios';
import * as ReactRouter from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect'; 

// Mock the axios module
jest.mock('axios');

// Mock the react-router-dom hooks
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

// Mock the context modules
jest.mock('../context/auth');
jest.mock('../context/cart');
jest.mock('../context/search');

// Mock the Layout component
jest.mock('./../components/Layout', () => {
  return ({ children }) => <div>{children}</div>; 
});

describe('ProductDetails Component', () => {
  const mockProduct = {
    _id: '1',
    name: 'Test Product',
    slug: 'test-product',
    description: 'This is a test product.',
    price: 100,
    quantity: 50, // Added quantity
    category: {
      _id: 'c1',
      name: 'Test Category',
    },
    shipping: true, // Added shipping
    photo: {
      data: Buffer.from('samplebuffer'),
      contentType: 'image/png',
    },
  };

  const mockRelatedProducts = [
    {
      _id: '2',
      name: 'Related Product 1',
      price: 80,
      description: 'Description for related product 1.',
      slug: 'related-product-1',
    },
    {
      _id: '3',
      name: 'Related Product 2',
      price: 90,
      description: 'Description for related product 2.',
      slug: 'related-product-2',
    },
  ];

  const navigate = jest.fn(); 

  beforeEach(() => {
    ReactRouter.useParams.mockReturnValue({ slug: 'test-product' });
    ReactRouter.useNavigate.mockReturnValue(navigate);

    axios.get.mockImplementation((url) => {
      if (url.includes('/get-product/')) {
        return Promise.resolve({ data: { product: mockProduct } });
      } else if (url.includes('/related-product/')) {
        return Promise.resolve({ data: { products: mockRelatedProducts } });
      }
      return Promise.reject(new Error('Not Found'));
    });
  });

  it('renders product details correctly', async () => {
    render(<ProductDetails />);
  
    await waitFor(() => {
      expect(screen.getByText(/Test Product/)).toBeInTheDocument();
      expect(screen.getByText(/This is a test product./)).toBeInTheDocument();
      expect(screen.getByText(/\$100.00/)).toBeInTheDocument();
      expect(screen.getByText(/Test Category/)).toBeInTheDocument();
    });
  });
  
  it('renders similar products correctly', async () => {
    render(<ProductDetails />);

    await waitFor(() => {
      expect(screen.getByText(/Similar Products ➡️/i)).toBeInTheDocument();
      expect(screen.getByText(/Related Product 1/)).toBeInTheDocument();
      expect(screen.getByText(/\$80.00/i)).toBeInTheDocument(); // Price formatted as currency
      expect(screen.getByText(/Related Product 2/)).toBeInTheDocument();
      expect(screen.getByText(/\$90.00/i)).toBeInTheDocument(); // Price formatted as currency
    });
  });

  it('navigates to related product details when More Details button is clicked', async () => {
    render(<ProductDetails />);

    await waitFor(() => {
      const buttons = screen.getAllByText(/More Details/i);
      fireEvent.click(buttons[0]); // Simulate button click

      expect(navigate).toHaveBeenCalledWith('/product/related-product-1'); 
    });
  });

  it('renders product image correctly', async () => {
    render(<ProductDetails />);

    await waitFor(() => {
      const imgElement = screen.getByAltText(/Test Product/i); // Use the product name for the alt text
      expect(imgElement).toBeInTheDocument();
      expect(imgElement).toHaveAttribute('src', '/api/v1/product/product-photo/1'); // Check for the correct image src
    });
  });

  it('renders message when no similar products are found', async () => {
    const product = {
      _id: '1',
      name: 'Test Product',
      category: { _id: 'cat1' },
    };
  
    axios.get
      .mockResolvedValueOnce({ data: { product } }) // Mocking get product
      .mockResolvedValueOnce({ data: { products: [] } }); // Mocking no related products
  
    render(<ProductDetails />);
  
    expect(await screen.findByText(/No Similar Products found/i)).toBeInTheDocument();
  });

  it('renders product price in correct currency format', async () => {
    const product = {
      _id: '1',
      name: 'Test Product',
      price: 50,
      description: 'This is a test product.',
      category: { name: 'Test Category' },
    };
  
    axios.get.mockResolvedValueOnce({ data: { product } });
    render(<ProductDetails />);
  
    const price = await screen.findByText(/\$50.00/i); // Check for proper formatting
    expect(price).toBeInTheDocument();
  });

  it('renders product category correctly', async () => {
    const product = {
      _id: '1',
      name: 'Test Product',
      category: { name: 'Test Category' },
    };
  
    axios.get.mockResolvedValueOnce({ data: { product } });
    render(<ProductDetails />);
  
    const category = await screen.findByText(/Category : Test Category/i);
    expect(category).toBeInTheDocument();
  });

  it('renders product description correctly', async () => {
    const product = {
      _id: '1',
      name: 'Test Product',
      category: { name: 'Test Category' },
      description: 'This is a test product.',
    };
  
    axios.get.mockResolvedValueOnce({ data: { product } });
    render(<ProductDetails />);

    expect(await screen.findByText(/This is a test product/i)).toBeInTheDocument();
  });
  
  // it('throws error message when product API fails', async () => {
  //   // Mock the axios get method to reject with an error
  //   axios.get.mockRejectedValueOnce(new Error('Failed to fetch product'));

  //   render(<ProductDetails />);

  //   const logSpy = jest.spyOn(console, 'log');
    
  //   // Wait for the asynchronous effects to finish
  //   await new Promise((resolve) => setTimeout(resolve, 0)); 

  //   expect(logSpy).toHaveBeenCalledWith(expect.any(Error)); // Check that error was logged
  //   logSpy.mockRestore(); 

  //   // specific UI elements that would normally render are not displayed (to be improved)
  //   // expect(screen.queryByText(/ADD TO CART/i)).not.toBeInTheDocument();
  //   // expect(screen.queryByText(/Category/i)).not.toBeInTheDocument();
  // });

  // it('handles error when price is not a number', async () => {
  //   const product = {
  //     _id: '1',
  //     name: 'Test Product',
  //     price: null,
  //     description: 'This is a test product.',
  //     category: { name: 'Test Category' },
  //   };
  
  //   axios.get.mockResolvedValueOnce({ data: { product } });
  //   render(<ProductDetails />);
  
  //   expect(await screen.findByText(/Price not available/i)).toBeInTheDocument();
  // });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test to avoid interference
  });
});
