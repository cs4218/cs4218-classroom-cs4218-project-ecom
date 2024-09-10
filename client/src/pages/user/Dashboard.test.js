import React from "react";
import { render, screen } from "@testing-library/react";
import { useAuth } from "../../context/auth";
import Dashboard from "./Dashboard";
import "@testing-library/jest-dom";

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));
jest.mock("../../components/UserMenu", () => () => <div>User Menu</div>);

describe("Dashboard Component", () => {
  it("should render the Dashboard with user information", () => {
    const mockAuth = {
      user: {
        name: "tyy",
        email: "tyy@gmail.com",
        address: "123 Orchard Road",
      },
    };

    useAuth.mockReturnValue([mockAuth]);

    render(<Dashboard />);

    expect(screen.getByText("tyy")).toBeInTheDocument();
    expect(screen.getByText("tyy@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("123 Orchard Road")).toBeInTheDocument();
  });
});
