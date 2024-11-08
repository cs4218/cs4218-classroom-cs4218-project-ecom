import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import AdminOrders from './AdminOrders';
import axios from "axios";
import { useAuth } from "../../context/auth";
import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("axios");

jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../components/Layout", () => ({ children }) => (
    <div>{children}</div>
));

describe("AdminOrders Component", () => {
    it("should render the orders from the API", async () => {
        const mockAuth = {
            token: "fake-token",
            user: { name: "Test User" },
        };
        useAuth.mockReturnValue([mockAuth]);

        const mockOrders = [
            {
                _id: "Order 1",
                status: "Delivered",
                buyer: { name: "John Doe" },
                createAt: "2024-09-09T12:00:00Z",
                payment: { success: true },
                products: [
                    {
                        _id: "1",
                        name: "Product 1",
                        description: "Description of Product 1",
                        price: 10,
                    },
                ],
            },
        ];

        axios.get.mockResolvedValue({ data: mockOrders });

        render(
            <MemoryRouter initialEntries={['/admin/orders']}>
                <Routes>
                    <Route path="/admin/orders" element={<AdminOrders />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/all-orders'));

        expect(await screen.findByText("All Orders")).toBeInTheDocument();
        expect(await screen.findByText("Delivered")).toBeInTheDocument();
        expect(await screen.findByText("John Doe")).toBeInTheDocument();
        expect(await screen.findByText("Success")).toBeInTheDocument();
        expect(await screen.findByText("Product 1")).toBeInTheDocument();
        expect(await screen.findByText("Price : 10")).toBeInTheDocument();
    });

    it('should update the order status when status is changed', async () => {
        const mockAuth = {
            token: "fake-token",
            user: { name: "Test User" },
        };
        useAuth.mockReturnValue([mockAuth]);
    
        const mockOrders = [
            {
                _id: "Order1",
                status: "Processing",
                buyer: { name: "John Doe" },
                createAt: "2024-09-09T12:00:00Z",
                payment: { success: true },
                products: [
                    {
                        _id: "1",
                        name: "Product 1",
                        description: "Description of Product 1",
                        price: 10,
                    },
                ],
            },
        ];
    
        axios.get.mockResolvedValue({ data: mockOrders });
    
        render(
            <MemoryRouter initialEntries={['/admin/orders']}>
                <Routes>
                    <Route path="/admin/orders" element={<AdminOrders />} />
                </Routes>
            </MemoryRouter>
        );
    
        expect(await screen.findByText("Processing")).toBeInTheDocument();

        // test select and change status
        const select = await screen.findByRole('combobox');
        expect(select).toBeInTheDocument();
    
        userEvent.click(select);

        await waitFor(() => screen.getByText('Shipped'));
    
        fireEvent.click(screen.getByText('Shipped'));

        expect(await screen.findByText("Shipped")).toBeInTheDocument();
    
        await waitFor(() => expect(axios.put).toHaveBeenCalledWith('/api/v1/auth/order-status/Order1', { status: 'Shipped' }));
    });

    
    it('should display an error message when fetching orders fails', async () => {
        axios.get.mockRejectedValueOnce(new Error('Failed to fetch orders'));

        const { getByText } = render(
            <MemoryRouter initialEntries={['/admin/orders']}>
                <Routes>
                    <Route path="/admin/orders" element={<AdminOrders />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/all-orders'));

        expect(getByText('All Orders')).toBeInTheDocument();
    });
});