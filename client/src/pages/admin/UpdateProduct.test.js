import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import UpdateProduct from './UpdateProduct';
import axios from 'axios';
import toast from 'react-hot-toast';
import "@testing-library/jest-dom";

jest.mock('axios');
jest.mock('react-hot-toast');
jest.mock("../../components/Layout", () => ({ children }) => (
    <div>{children}</div>
));
jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(() => [null, jest.fn()]),
}));
jest.mock('../../components/AdminMenu', () => () => <div>AdminMenu Mock</div>);

describe('UpdateProduct Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render and fetch product data', async () => {
        const productData = {
            product: {
                _id: '123',
                name: 'Test Product',
                description: 'Test Description',
                price: 100,
                quantity: 10,
                shipping: 1,
                category: { _id: 'categoryId' },
            },
        };
        
        axios.get.mockResolvedValueOnce({ data: productData });

        const {getByPlaceholderText} = render(
            <MemoryRouter initialEntries={['/update-product/test-product']}>
                <Routes>
                    <Route path="/update-product/:slug" element={<UpdateProduct />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/v1/product/get-product/test-product'));

        await waitFor(() => {
            expect(screen.getByPlaceholderText('write a name')).toHaveValue('Test Product');
        });

        expect(await screen.findByPlaceholderText('write a description')).toHaveValue('Test Description');
    });

    it('should update product and display success message', async () => {
        const productData = {
            product: {
                _id: '123',
                name: 'Test Product',
                description: 'Test Description',
                price: 100,
                quantity: 10,
                shipping: 1,
                category: { _id: 'categoryId' },
            },
        };

        axios.get.mockResolvedValueOnce({ data: productData });
        axios.put.mockResolvedValueOnce({ data: { success: true, message: 'Product updated successfully' } });

        render(
            <MemoryRouter initialEntries={['/update-product/test-product']}>
                <Routes>
                    <Route path="/update-product/:slug" element={<UpdateProduct />} />
                </Routes>
            </MemoryRouter>
        );

        // Wait for the product data to be fetched and rendered
        await waitFor(() => {
            expect(screen.getByPlaceholderText('write a name')).toHaveValue('Test Product');
        });

        // Update fields
        fireEvent.change(screen.getByPlaceholderText('write a name'), { target: { value: 'Updated Product' } });
        fireEvent.change(screen.getByPlaceholderText('write a description'), { target: { value: 'Updated Description' } });
        fireEvent.change(screen.getByPlaceholderText('write a Price'), { target: { value: '200' } });
        fireEvent.change(screen.getByPlaceholderText('write a quantity'), { target: { value: '20' } });
        fireEvent.click(screen.getByText('UPDATE PRODUCT'));

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledWith(
                `/api/v1/product/update-product/123`,
                expect.any(FormData)
            );
            expect(toast.success).toHaveBeenCalledWith('Product Updated Successfully');
        });
    });

    it('should display error message on failed update', async () => {
        const productData = {
            product: {
                _id: '123',
                name: 'Test Product',
                description: 'Test Description',
                price: 100,
                quantity: 10,
                shipping: 1,
                category: { _id: 'categoryId' },
            },
        };

        axios.get.mockResolvedValueOnce({ data: productData });
        axios.put.mockImplementation(() => {
            throw new Error();
          });


        render(
            <MemoryRouter initialEntries={['/update-product/test-product']}>
                <Routes>
                    <Route path="/update-product/:slug" element={<UpdateProduct />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByPlaceholderText('write a name')).toHaveValue('Test Product');
        });

        fireEvent.change(screen.getByPlaceholderText('write a name'), { target: { value: 'Updated Product' } });
        fireEvent.click(screen.getByText('UPDATE PRODUCT'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('something went wrong');
        });
    });

    it('should delete the product and display success message', async () => {
        const productData = {
            product: {
                _id: '123',
                name: 'Test Product',
                description: 'Test Description',
                price: 100,
                quantity: 10,
                shipping: 1,
                category: { _id: 'categoryId' },
            },
        };

        axios.get.mockResolvedValueOnce({ data: productData });
        axios.delete.mockResolvedValueOnce({ data: { success: true } });

        const { getByText } = render(
            <MemoryRouter initialEntries={['/update-product/test-product']}>
                <Routes>
                    <Route path="/update-product/:slug" element={<UpdateProduct />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(getByText('DELETE PRODUCT')).toBeInTheDocument();
        });

        window.prompt = jest.fn(() => 'yes');

        fireEvent.click(getByText('DELETE PRODUCT'));

        await waitFor(() => {
            // expect(axios.delete).toHaveBeenCalledWith('/api/v1/product/delete-product/123');
            expect(toast.success).toHaveBeenCalledWith('Product DEleted Succfully');
        });
    });

    it('should handle delete cancellation', async () => {
        const productData = {
            product: {
                _id: '123',
                name: 'Test Product',
                description: 'Test Description',
                price: 100,
                quantity: 10,
                shipping: 1,
                category: { _id: 'categoryId' },
            },
        };

        axios.get.mockResolvedValueOnce({ data: productData });

        render(
            <MemoryRouter initialEntries={['/update-product/test-product']}>
                <Routes>
                    <Route path="/update-product/:slug" element={<UpdateProduct />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('DELETE PRODUCT')).toBeInTheDocument();
        });

        window.prompt = jest.fn(() => null);

        fireEvent.click(screen.getByText('DELETE PRODUCT'));

        await waitFor(() => {
            expect(axios.delete).not.toHaveBeenCalled();
        });
    });
});
