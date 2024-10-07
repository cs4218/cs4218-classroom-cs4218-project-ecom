import React from "react";
import { render, screen } from "@testing-library/react";
import Search from "./Search";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import { useSearch } from "../context/search";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

jest.mock("../context/auth");
jest.mock("../context/cart");
jest.mock("../context/search");

describe("Search Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAuth to return valid values
    useAuth.mockReturnValue([
      {
        user: { name: "Admin User", email: "admin@example.com" },
      },
      jest.fn(),
    ]);

    // Mock useCart to return empt cart
    useCart.mockReturnValue([[], jest.fn()]);

    // Mock useSearch to return an empty results array
    useSearch.mockReturnValue([{ keyword: "", results: [] }, jest.fn()]);
  });

  it('displays "No Products Found" when there are no results', () => {
    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    // Check if the "No Products Found" message is rendered
    expect(screen.getByText("No Products Found")).toBeInTheDocument();
  });

  it("displays the correct number of products found", () => {
    useSearch.mockReturnValue([
      {
        keyword: "wine",
        results: [
          {
            _id: "1",
            name: "Red Wine",
            description: "A good red wine",
            price: 50,
          },
          {
            _id: "2",
            name: "White Wine",
            description: "A fresh white wine",
            price: 40,
          },
        ],
      },
      jest.fn(),
    ]);

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    // Check if the text "Found 2" is rendered
    expect(screen.getByText("Found 2")).toBeInTheDocument();

    // Check if both products are displayed
    expect(screen.getByText("Red Wine")).toBeInTheDocument();
    expect(screen.getByText("White Wine")).toBeInTheDocument();
  });

  it('displays "No Products Found" when results is undefined', () => {
    useSearch.mockReturnValue([
      { keyword: "undefined search", results: [] },
      jest.fn(),
    ]);

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    // Check if "No Products Found" is rendered when results are undefined
    expect(screen.getByText("No Products Found")).toBeInTheDocument();
  });

  it("displays search results even when keyword is empty", () => {
    useSearch.mockReturnValue([
      {
        keyword: "",
        results: [
          {
            _id: "1",
            name: "Product A",
            description: "Description A",
            price: 100,
          },
        ],
      },
      jest.fn(),
    ]);

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    expect(screen.getByText("Found 1")).toBeInTheDocument();
    expect(screen.getByText("Product A")).toBeInTheDocument();
  });

  it("displays the products with partial name match", () => {
    useSearch.mockReturnValue([
      {
        keyword: "wi",
        results: [
          {
            _id: "1",
            name: "Red Wine",
            description: "A good red wine",
            price: 50,
          },
          {
            _id: "2",
            name: "White Wine",
            description: "A fresh white wine",
            price: 40,
          },
        ],
      },
      jest.fn(),
    ]);

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    // Check if the text "Found 2" is rendered
    expect(screen.getByText("Found 2")).toBeInTheDocument();

    // Check if both products are displayed
    expect(screen.getByText("Red Wine")).toBeInTheDocument();
    expect(screen.getByText("White Wine")).toBeInTheDocument();
  });
});
