import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Products from "./Products";
import { useAuth } from "../../context/auth";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import toast from "react-hot-toast";
import "@testing-library/jest-dom/extend-expect"; // for matchers like toBeInTheDocument

// Mock necessary modules
jest.mock("axios");
jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(() => [null, jest.fn()]),
}));
jest.mock("react-hot-toast");
jest.mock("../../components/AdminMenu", () => () => <div>AdminMenu Mock</div>);
jest.mock("../../components/Layout", () => ({ children }) => <div>{children}</div>);

describe("Products Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the products when API call is successful", async () => {
    const mockAuth = {
        token: "fake-token",
        user: { name: "Test User" },
    };
    useAuth.mockReturnValue([mockAuth]);

    const mockProducts = [
      {
        _id: "1",
        name: "Test Product 1",
        description: "Description for product 1",
        slug: "test-product-1",
      },
      {
        _id: "2",
        name: "Test Product 2",
        description: "Description for product 2",
        slug: "test-product-2",
      },
    ];

    axios.get.mockResolvedValue({ data: { products: mockProducts } });

    render(
          <MemoryRouter initialEntries={['/dashboard/admin/products']}>
                <Routes>
                    <Route path="/dashboard/admin/products" element={<Products />} />
                </Routes>
            </MemoryRouter>
    );

    await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product"));

    expect(screen.getByText("All Products List")).toBeInTheDocument();
    expect(await screen.findByText("Test Product 1")).toBeInTheDocument();
    expect(await screen.findByText("Description for product 1")).toBeInTheDocument();
    expect(await screen.findByText("Test Product 2")).toBeInTheDocument();
    expect(await screen.findByText("Description for product 2")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Test Product 1 Test Product 1 Description for product 1" })).toHaveAttribute(
      "href",
      "/dashboard/admin/product/test-product-1"
    );
    expect(screen.getByRole("link", { name: "Test Product 2 Test Product 2 Description for product 2" })).toHaveAttribute(
      "href",
      "/dashboard/admin/product/test-product-2"
    );
  });

  it("shows an error toast when API call fails", async () => {
    // Mock axios GET request to throw an error
    axios.get.mockRejectedValueOnce(new Error("Failed to fetch products"));

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    // Assert that the API call was made
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product"));

    // Assert that the error toast is shown
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Someething Went Wrong"));
  });

  it("renders the empty products state when no products are available", async () => {
    // Mock axios GET request to return no products
    axios.get.mockResolvedValueOnce({ data: { products: [] } });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    // Assert that the API call was made
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product"));

    // Ensure the "All Products List" title is rendered
    expect(screen.getByText("All Products List")).toBeInTheDocument();

    // Ensure that no product cards are rendered
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
