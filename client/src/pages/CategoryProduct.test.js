import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '@testing-library/jest-dom/extend-expect';
import CategoryProduct from './CategoryProduct';

// Mock axios
jest.mock('axios');
jest.mock("./../components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn()
}));

const mockProducts =  [
    {
        _id: "1",
        name: "test_product_1",
        description: "this is test product 1",
        slug: "pdt1",
        price: 11,
        category: "c1"
    },
    {
        _id: "2",
        name: "test_product_2",
        description: "this is test product 2",
        slug: "pdt2",
        price: 22,
        category: "c1"
    }
];

const mockCategory = {
    name: 'category_1'
};

describe('CategoryProduct', () => {
    beforeEach(() => {
        axios.get.mockResolvedValue({
            data: {
                products: mockProducts,
                category: mockCategory
            }
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const renderComponent = () =>
        render(
            <MemoryRouter initialEntries={['/category/c1']}>
                <Routes>
                    <Route path="/category/:slug" element={<CategoryProduct />} />
                </Routes>
            </MemoryRouter>
        );

    it('renders CategoryProduct component', async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Category - category_1')).toBeInTheDocument();
            expect(screen.getByText('2 result found')).toBeInTheDocument();
        });
    });

    it('fetches and displays products', async () => {
        renderComponent()

        await waitFor(() => {
            mockProducts.forEach(product => {
                expect(screen.getByText(product.name)).toBeInTheDocument();
                expect(screen.getByText(product.price.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                }))).toBeInTheDocument();
                expect(screen.getByText(product.description.substring(0, 60) + '...')).toBeInTheDocument();
            });
        });
    });

    it('handles API errors gracefully', async () => {
        axios.get.mockRejectedValue(new Error('API error'));

        renderComponent();

        await waitFor(() => {
            expect(screen.queryByText('Category - category_1')).not.toBeInTheDocument();
            expect(screen.queryByText('2 result found')).not.toBeInTheDocument();
        });
    });

    it('navigates to product detail page on button click', async () => {
        renderComponent();
        const mockNavigate = jest.fn();
        useNavigate.mockReturnValue(mockNavigate);

        await waitFor(() => screen.getByText("test_product_1"));

        fireEvent.click(screen.getAllByText('More Details')[0]);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/product/pdt1');
        });
    });

});