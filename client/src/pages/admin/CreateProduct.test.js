import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import '@testing-library/jest-dom/extend-expect'; // For matchers like toBeInTheDocument
import toast from 'react-hot-toast';
import CreateProduct from './CreateProduct';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import userEvent from '@testing-library/user-event';

// Mock axios for API calls
jest.mock('axios');
jest.mock("../../components/Layout", () => ({ children }) => (
    <div>{children}</div>
));
jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(() => [null, jest.fn()]),
}));
jest.mock('react-hot-toast');

describe('CreateProduct Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        useAuth.mockReturnValue([{
            user: { name: 'Admin User', email: 'admin@example.com' },
        }, jest.fn()]);

        axios.get.mockResolvedValueOnce({
            data: {
                success: true,
                category: [{ _id: '1', name: 'Category 1' }, { _id: '2', name: 'Category 2' }],
            },
        });
    });

    it('renders the CreateProduct form', async () => {
        const { getByText, getByPlaceholderText, getByRole } = render(
            <MemoryRouter initialEntries={['/create-product']}>
                <Routes>
                    <Route path="/create-product" element={<CreateProduct />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category'))

        const categorySelect = await screen.findByTestId('category-select');
        expect(categorySelect).toBeInTheDocument();
        expect(getByText('Upload Photo')).toBeInTheDocument();

        expect(getByPlaceholderText('write a name')).toBeInTheDocument();
        expect(getByPlaceholderText('write a description')).toBeInTheDocument();
        expect(getByPlaceholderText('write a Price')).toBeInTheDocument();

        const shippingSelect = await screen.findByTestId('shipping-select');
        expect(shippingSelect).toBeInTheDocument();

        expect(getByText('CREATE PRODUCT')).toBeInTheDocument();

    });

    it('should submit form data and display success message on product creation', async () => {
        axios.post.mockResolvedValueOnce({
            data: { success: true, message: 'Product Created Successfully' },
        });

        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/create-product']}>
                <Routes>
                    <Route path="/create-product" element={<CreateProduct />} />
                </Routes>
            </MemoryRouter>
        );

        // Fill in form inputs
        fireEvent.change(getByPlaceholderText('write a name'), {
            target: { value: 'Test Product' },
        });
        fireEvent.change(getByPlaceholderText('write a description'), {
            target: { value: 'This is a test product' },
        });
        fireEvent.change(getByPlaceholderText('write a Price'), {
            target: { value: '100' },
        });
        fireEvent.change(getByPlaceholderText('write a quantity'), {
            target: { value: '10' },
        });

        fireEvent.click(getByText('CREATE PRODUCT'));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                '/api/v1/product/create-product',
                expect.any(FormData)
            );
            expect(toast.success).toHaveBeenCalledWith('Product Created Successfully');
        });
    });

    it('should display error message on failed product creation', async () => {
        axios.post.mockImplementation(() => {
            throw new Error();
          });

        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/create-product']}>
                <Routes>
                    <Route path="/create-product" element={<CreateProduct />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText('write a name'), {
            target: { value: 'Test Product' },
        });
        fireEvent.change(getByPlaceholderText('write a description'), {
            target: { value: 'This is a test product' },
        });
        fireEvent.change(getByPlaceholderText('write a Price'), {
            target: { value: '100' },
        });
        fireEvent.change(getByPlaceholderText('write a quantity'), {
            target: { value: '10' },
        });

        fireEvent.click(getByText('CREATE PRODUCT'));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                '/api/v1/product/create-product',
                expect.any(FormData)
            );

            expect(toast.error).toHaveBeenCalledWith('something went wrong');
        });
    });

});
