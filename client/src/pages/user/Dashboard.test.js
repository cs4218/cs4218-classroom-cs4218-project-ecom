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

  // User has missing fields
  it("should render partial user information when some fields are missing", () => {
    const mockAuth = {
      user: {
        name: "tyy",
        email: null,
        address: "123 Orchard Road",
      },
    };

    useAuth.mockReturnValue([mockAuth]);

    render(<Dashboard />);

    expect(screen.getByText("tyy")).toBeInTheDocument();
    expect(screen.queryByText("tyy@gmail.com")).not.toBeInTheDocument();
    expect(screen.getByText("123 Orchard Road")).toBeInTheDocument();
  });

  // User has empty strings for fields
  it("should handle empty string fields for user information", () => {
    const mockAuth = {
      user: {
        name: "",
        email: "",
        address: "",
      },
    };

    useAuth.mockReturnValue([mockAuth]);

    render(<Dashboard />);

    expect(screen.queryByText("tyy")).not.toBeInTheDocument();
    expect(screen.queryByText("tyy@gmail.com")).not.toBeInTheDocument();
    expect(screen.queryByText("123 Orchard Road")).not.toBeInTheDocument();
  });

  // User has very long strings for fields
  it("should render long user information strings without truncation", () => {
    const mockAuth = {
      user: {
        name: "a".repeat(1000),
        email: "longemail@example.com",
        address: "b".repeat(1000),
      },
    };

    useAuth.mockReturnValue([mockAuth]);

    render(<Dashboard />);

    expect(screen.getByText("a".repeat(1000))).toBeInTheDocument();
    expect(screen.getByText("longemail@example.com")).toBeInTheDocument();
    expect(screen.getByText("b".repeat(1000))).toBeInTheDocument();
  });

  // Invalid email format
  it("should still render if the email format is invalid", () => {
    const mockAuth = {
      user: {
        name: "tyy",
        email: "invalid-email",
        address: "123 Orchard Road",
      },
    };

    useAuth.mockReturnValue([mockAuth]);

    render(<Dashboard />);

    expect(screen.getByText("tyy")).toBeInTheDocument();
    expect(screen.getByText("invalid-email")).toBeInTheDocument();
    expect(screen.getByText("123 Orchard Road")).toBeInTheDocument();
  });

  // Email contains special characters
  it("should render user information with non-standard characters in email", () => {
    const mockAuth = {
      user: {
        name: "tyy",
        email: "tyy+special@domain.com",
        address: "123 Orchard Road",
      },
    };

    useAuth.mockReturnValue([mockAuth]);

    render(<Dashboard />);

    expect(screen.getByText("tyy")).toBeInTheDocument();
    expect(screen.getByText("tyy+special@domain.com")).toBeInTheDocument();
    expect(screen.getByText("123 Orchard Road")).toBeInTheDocument();
  });

  // Address contains special characters
  it("should render user information with special characters in address", () => {
    const mockAuth = {
      user: {
        name: "tyy",
        email: "tyy@gmail.com",
        address: "#123, Orchard Road!@",
      },
    };

    useAuth.mockReturnValue([mockAuth]);

    render(<Dashboard />);

    expect(screen.getByText("tyy")).toBeInTheDocument();
    expect(screen.getByText("tyy@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("#123, Orchard Road!@")).toBeInTheDocument();
  });

  // Email has mixed case letters
  it("should render user information with mixed-case email", () => {
    const mockAuth = {
      user: {
        name: "tyy",
        email: "TyY@Domain.Com",
        address: "123 Orchard Road",
      },
    };

    useAuth.mockReturnValue([mockAuth]);

    render(<Dashboard />);

    expect(screen.getByText("TyY@Domain.Com")).toBeInTheDocument();
  });

  // User fields are undefined
  it("should render nothing when all user fields are undefined", () => {
    const mockAuth = {
      user: {
        name: undefined,
        email: undefined,
        address: undefined,
      },
    };

    useAuth.mockReturnValue([mockAuth]);

    render(<Dashboard />);

    expect(screen.queryByText("undefined")).not.toBeInTheDocument();
  });

  // Short address values

  it("should render user information with very short address", () => {
    const mockAuth = {
      user: {
        name: "tyy",
        email: "tyy@gmail.com",
        address: "A",
      },
    };

    useAuth.mockReturnValue([mockAuth]);

    render(<Dashboard />);

    expect(screen.getByText("tyy")).toBeInTheDocument();
    expect(screen.getByText("tyy@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});
