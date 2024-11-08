import React from "react";
import { render, screen } from "@testing-library/react";
import Contact from "./Contact";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import { useSearch } from "../context/search";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

jest.mock("../context/auth");
jest.mock("../context/cart");
jest.mock("../context/search");

describe("Contact Component", () => {
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

  it("renders Contact Us title", () => {
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );

    expect(screen.getByText("CONTACT US")).toBeInTheDocument();
  });

  it("renders email, phone, and support info", () => {
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );

    // Check if the email, phone, and support details are rendered
    expect(
      screen.getByText(/www\.help@ecommerceapp\.com/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/012-3456789/i)).toBeInTheDocument();
    expect(screen.getByText(/1800-0000-0000/i)).toBeInTheDocument();
  });

  it("displays the correct image for contact", () => {
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );

    // Check if the contact image is rendered
    const img = screen.getByAltText("contactus");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/contactus.jpeg");
  });
});
