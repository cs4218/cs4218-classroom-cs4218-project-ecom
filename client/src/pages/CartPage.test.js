import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CartPage from './CartPage';
import axios from 'axios';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import { useCart } from '../context/cart';
import { useAuth } from '../context/auth';
import toast from 'react-hot-toast';
import DropIn from "braintree-web-drop-in-react";

jest.mock('braintree-web-drop-in-react', () => ({
    __esModule: true,
    default: jest.fn(() => <div>DropIn Mock</div>),
}));

jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock("./../components/Layout", () => ({ children }) => <div>{children}</div>);

jest.mock('../context/cart', () => ({
    useCart: jest.fn(() => [[], jest.fn()])
}));

jest.mock('../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock('../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
}));

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn()
}));

Object.defineProperty(window, 'localStorage', {
    value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
    },
    writable: true,
});

describe('CartPage Component', () => {
    const mockCart = [
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

    window.localStorage.setItem("cart", JSON.stringify(mockCart))

    const mockAuth = {
        token: 'mock-token',
        user: {
            name: 'John Doe',
            address: '123 Main St'
        }
    };

    beforeEach(() => {
        useCart.mockReturnValue([mockCart, jest.fn()]);
        useAuth.mockReturnValue([mockAuth, jest.fn()]);
        axios.get.mockResolvedValue({ data: { clientToken: 'mock-client-token' } });
        //axios.post.mockResolvedValue({ data: { success: true } });
        //toast.success.mockClear();
        //toast.error.mockClear();
    });

    afterEach(() => {
        jest.clearAllMocks();
        window.localStorage.setItem.mockClear();
        window.localStorage.removeItem.mockClear();
    });

    const renderComponent = () =>
        render(
            <MemoryRouter initialEntries={['/cart']}>
                <Routes>
                    <Route path="/cart" element={<CartPage />} />
                </Routes>
            </MemoryRouter>
        );
    
    //Combinatorial pairwise testing
    /* 
    test cases:
    1. User is authenticated and has an empty cart
    2. User is authenticated and has items in cart 
    3. Guest user and empty cart 
    4. Guest user and has items in cart
    */

    // test case 1
    it("renders CartPage and displays empty cart when user has login", async () => {
        useCart.mockReturnValue([[], jest.fn()]);
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Hello John Doe')).toBeInTheDocument();
            expect(screen.getByText('Your Cart Is Empty')).toBeInTheDocument();
            expect(screen.getByText('123 Main St')).toBeInTheDocument();
        });
    });

    // test case 2
    it("renders CartPage and displays cart items when user has login", async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Hello John Doe')).toBeInTheDocument();
            expect(screen.getByText('You Have 2 items in your cart')).toBeInTheDocument();
            expect(screen.getByText('test_product_1')).toBeInTheDocument();
            expect(screen.getByText('test_product_2')).toBeInTheDocument();
            expect(screen.getByText('123 Main St')).toBeInTheDocument();
        });
    });

    // test case 3
    it("renders CartPage and displays empty cart when user is guest", async () => {
        useAuth.mockReturnValue([{ token: null, user: null }, jest.fn()]);
        useCart.mockReturnValue([[], jest.fn()]);
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Hello Guest')).toBeInTheDocument();
            expect(screen.getByText('Your Cart Is Empty')).toBeInTheDocument();
        });
    });

    // test case 4
    it("renders CartPage and displays cart items when user is guest", async () => {
        useAuth.mockReturnValue([{ token: null, user: null }, jest.fn()]);
        renderComponent();
        await waitFor(() => {
            expect(screen.getByText('Hello Guest')).toBeInTheDocument();
            expect(screen.getByText('You Have 2 items in your cart please login to checkout !')).toBeInTheDocument();
            expect(screen.getByText('test_product_1')).toBeInTheDocument();
            expect(screen.getByText('test_product_2')).toBeInTheDocument();
        });
    });

    it('navigates to user profile if user is logged in', async () => {
        //useAuth.mockReturnValue([{ ...mockAuth, user: { ...mockAuth.user, address: null } }, jest.fn()]);
        const navigate = jest.fn();
        useNavigate.mockReturnValue(navigate);
        renderComponent();

        fireEvent.click(screen.getByText('Update Address'));

        await waitFor(() => {
            expect(navigate).toHaveBeenCalledWith('/dashboard/user/profile');
        });
    });

    it('navigates to login if address is not present and user is not logged in', async () => {
        useAuth.mockReturnValue([{ token: null, user: null }, jest.fn()]);
        const navigate = jest.fn();
        useNavigate.mockReturnValue(navigate);
        renderComponent();

        fireEvent.click(screen.getByText('Plase Login to checkout'));
        await waitFor(() => {
            expect(screen.getByText('Hello Guest')).toBeInTheDocument();
            expect(screen.getByText('You Have 2 items in your cart please login to checkout !')).toBeInTheDocument();
            expect(screen.getByText('test_product_1')).toBeInTheDocument();
            expect(screen.getByText('test_product_2')).toBeInTheDocument();
        });
        await waitFor(() => {
            expect(navigate).toHaveBeenCalledWith('/login', { state: '/cart' });
        });
    });

    it("renders DropIn Mock and make payment button", async () => {
        const mockInstance = {
            requestPaymentMethod: jest.fn().mockResolvedValue({ nonce: 'mock-nonce' }),
        };

        DropIn.mockImplementation(({ onInstance }) => {
            onInstance(mockInstance);
            return <div>DropIn Mock</div>;
        });

        renderComponent();

        await waitFor(() => {
            const dropInMockElement = screen.getByText('DropIn Mock');
            expect(dropInMockElement).toBeInTheDocument();
        });
        const paymentButton = screen.getByText('Make Payment');
        expect(paymentButton).toBeDisabled(); // make payment should be disabled initially
    })

    it('removes item from cart', async () => {
        const setCart = jest.fn();
        useCart.mockReturnValue([mockCart, setCart]);

        renderComponent();
        fireEvent.click(screen.getAllByText('Remove')[0]);

        await waitFor(() => {
            expect(setCart).toHaveBeenCalledWith([mockCart[1]]);
            expect(window.localStorage.setItem).toHaveBeenCalledWith(
                "cart",
                JSON.stringify([
                    {
                        _id: "2",
                        name: "test_product_2",
                        description: "this is test product 2",
                        slug: "pdt2",
                        price: 22,
                        category: "c1"
                    }
                ])
            );
        });
    });

    it('handles failed payment', async () => {
        const mockInstance = {
            requestPaymentMethod: jest.fn().mockResolvedValue({ nonce: 'mock-nonce' }),
        };

        DropIn.mockImplementation(({ onInstance }) => {
            onInstance(mockInstance);
            return <div>DropIn Mock</div>;
        });

        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        axios.post.mockRejectedValue(new Error('Payment failed'));

        renderComponent();
        await waitFor(() => {
            const dropInMockElement = screen.getByText('DropIn Mock');
            expect(dropInMockElement).toBeInTheDocument();
        });
        const makePaymentButton = screen.getByText('Make Payment');
        expect(makePaymentButton).not.toBeDisabled();
        fireEvent.click(makePaymentButton);
        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith('/api/v1/product/braintree/payment', {
                nonce: 'mock-nonce',
                cart: mockCart,
            });
            expect(logSpy).toHaveBeenCalledWith(expect.any(Error));
            expect(logSpy.mock.calls[0][0].message).toBe('Payment failed');
        });
    });

    it('handles successful payment', async () => {
        const mockInstance = {
            requestPaymentMethod: jest.fn().mockResolvedValue({ nonce: 'mock-nonce' }),
        };

        DropIn.mockImplementation(({ onInstance }) => {
            onInstance(mockInstance);
            return <div>DropIn Mock</div>;
        });

        axios.post.mockResolvedValue({ data: { success: true } });
        const navigate = jest.fn();
        useNavigate.mockReturnValue(navigate);
        renderComponent();

        await waitFor(() => {
            const dropInMockElement = screen.getByText('DropIn Mock');
            expect(dropInMockElement).toBeInTheDocument();
        });
        const makePaymentButton = screen.getByText('Make Payment');
        expect(makePaymentButton).not.toBeDisabled();

        fireEvent.click(makePaymentButton);
        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith('/api/v1/product/braintree/payment', {
                nonce: 'mock-nonce',
                cart: mockCart,
            });
            expect(toast.success).toHaveBeenCalledWith('Payment Completed Successfully ');
            expect(window.localStorage.removeItem).toHaveBeenCalledWith('cart');
            expect(navigate).toHaveBeenCalledWith('/dashboard/user/orders');
        });
    });
});
