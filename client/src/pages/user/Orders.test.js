import React from "react";
import { render, screen } from "@testing-library/react";
import Orders from "./Orders";
import axios from "axios";
import { useAuth } from "../../context/auth";
import "@testing-library/jest-dom";

jest.mock("axios");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));
jest.mock("../../components/UserMenu", () => () => <div>User Menu</div>);

describe("Orders Component", () => {
  it("should render the orders from the API", async () => {
    const mockAuth = {
      token: "fake-token",
      user: { name: "Test User" },
    };
    useAuth.mockReturnValue([mockAuth]);

    const mockOrders = [
      {
        _id: "order1",
        status: "Delivered",
        buyer: { name: "tyy" },
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

    render(<Orders />);

    expect(await screen.findByText("All Orders")).toBeInTheDocument();
    expect(await screen.findByText("Delivered")).toBeInTheDocument();
    expect(await screen.findByText("tyy")).toBeInTheDocument();
    expect(await screen.findByText("Success")).toBeInTheDocument();
    expect(await screen.findByText("Product 1")).toBeInTheDocument();
    expect(await screen.findByText("Price : 10")).toBeInTheDocument();
  });

  it("should render UserMenu and Layout components", () => {
    const mockAuth = {
      token: "fake-token",
      user: { name: "Test User" },
    };
    useAuth.mockReturnValue([mockAuth]);

    render(<Orders />);

    expect(screen.getByText("User Menu")).toBeInTheDocument();

    expect(screen.getByText("All Orders")).toBeInTheDocument();
  });

  // Multiple products in an order

  it("should render orders with multiple products", async () => {
    const mockAuth = {
      token: "fake-token",
      user: { name: "Test User" },
    };
    useAuth.mockReturnValue([mockAuth]);

    const mockOrders = [
      {
        _id: "order1",
        status: "Delivered",
        buyer: { name: "tyy" },
        createAt: "2024-09-09T12:00:00Z",
        payment: { success: true },
        products: [
          {
            _id: "1",
            name: "Product 1",
            description: "Description of Product 1",
            price: 10,
          },
          {
            _id: "2",
            name: "Product 2",
            description: "Description of Product 2",
            price: 20,
          },
        ],
      },
    ];

    axios.get.mockResolvedValue({ data: mockOrders });

    render(<Orders />);

    expect(await screen.findByText("Product 1")).toBeInTheDocument();
    expect(await screen.findByText("Product 2")).toBeInTheDocument();
  });

  // Failed payment

  it("should render a failed payment status", async () => {
    const mockAuth = {
      token: "fake-token",
      user: { name: "Test User" },
    };
    useAuth.mockReturnValue([mockAuth]);

    const mockOrders = [
      {
        _id: "order1",
        status: "Not Process",
        buyer: { name: "tyy" },
        createAt: "2024-09-09T12:00:00Z",
        payment: { success: false },
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

    render(<Orders />);

    expect(await screen.findByText("Not Process")).toBeInTheDocument();
    expect(await screen.findByText("Failed")).toBeInTheDocument();
  });

  it("should render an order even if some product information is missing", async () => {
    const mockAuth = {
      token: "fake-token",
      user: { name: "Test User" },
    };
    useAuth.mockReturnValue([mockAuth]);

    const mockOrders = [
      {
        _id: "order1",
        status: "Delivered",
        buyer: { name: "tyy" },
        createAt: "2024-09-09T12:00:00Z",
        payment: { success: true },
        products: [
          {
            _id: "1",
            name: null,
            description: "Description of Product 1",
            price: null,
          },
        ],
      },
    ];

    axios.get.mockResolvedValue({ data: mockOrders });

    render(<Orders />);

    expect(
      await screen.findByText("Description of Product 1")
    ).toBeInTheDocument();
    expect(screen.queryByText("Price : ")).not.toBeInTheDocument();
  });
});
