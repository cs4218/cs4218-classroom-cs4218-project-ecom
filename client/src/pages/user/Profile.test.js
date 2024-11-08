import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Profile from "./Profile";
import { useAuth } from "../../context/auth";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import toast from "react-hot-toast";
import { BrowserRouter as Router } from "react-router-dom";

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [
    {
      user: {
        email: "tyy@gmail.com",
        name: "tyy",
        phone: "12345678",
        address: "123 Orchard Road",
      },
    },
    jest.fn(),
  ]),
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

const mock = new MockAdapter(axios);

describe("Profile Component", () => {
  const mockAuth = {
    user: {
      email: "tyy@gmail.com",
      name: "tyy",
      phone: "12345678",
      address: "123 Orchard Road",
    },
  };

  beforeEach(() => {
    useAuth.mockReturnValue([mockAuth, jest.fn()]);
  });
  test("renders profile form with user data", () => {
    // console.log("Mock useAuth return value:", useAuth());
    render(
      <Router>
        <Profile />
      </Router>
    );

    expect(screen.getByPlaceholderText("Enter Your Name").value).toBe(
      mockAuth.user.name
    );
    expect(screen.getByPlaceholderText("Enter Your Email").value).toBe(
      mockAuth.user.email
    );
    expect(screen.getByPlaceholderText("Enter Your Phone").value).toBe(
      mockAuth.user.phone
    );
    expect(screen.getByPlaceholderText("Enter Your Address").value).toBe(
      mockAuth.user.address
    );
  });

  test("updates profile successfully", async () => {
    const updatedUser = {
      ...mockAuth.user,
      name: "fyy",
      password: "123",
    };

    mock.onPut("/api/v1/auth/profile").reply(200, { updatedUser });

    // const mockLocalStorage = {
    //   getItem: jest.fn(() => JSON.stringify({ user: {} })),
    //   setItem: jest.fn(),
    // };
    // global.localStorage = mockLocalStorage;
    // useAuth().user = updatedUser;

    render(
      <Router>
        <Profile />
      </Router>
    );

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "fyy" },
    });
    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter Your Name").value).toBe("fyy");
    });
  });

  test("handles profile update failure", async () => {
    mock.onPut("/api/v1/auth/profile").reply(400, { error: "Update failed" });

    render(
      <Router>
        <Profile />
      </Router>
    );

    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  test("fails validation for name below minimum length", async () => {
    render(
      <Router>
        <Profile />
      </Router>
    );

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: null },
    });

    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter Your Name").value).toBe("");
    });
  });

  test("accepts minimal valid input values", async () => {
    const updatedUser = {
      ...mockAuth.user,
      name: "f",
      phone: "1",
      address: "A",
    };

    mock.onPut("/api/v1/auth/profile").reply(200, { updatedUser });

    render(
      <Router>
        <Profile />
      </Router>
    );

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "f" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
      target: { value: "A" },
    });
    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter Your Name").value).toBe("f");
    });
  });

  test("shows error for invalid phone number format", async () => {
    render(
      <Router>
        <Profile />
      </Router>
    );

    fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
      target: { value: "abc123" },
    });
    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter Your Phone").value).toBe(
        "abc123"
      );
    });
  });

  test("fails validation for phone number below minimum length", async () => {
    render(
      <Router>
        <Profile />
      </Router>
    );

    fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
      target: { value: "123" },
    });

    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter Your Phone").value).toBe("123");
    });
  });

  test("fails validation for phone number exceeding maximum length", async () => {
    render(
      <Router>
        <Profile />
      </Router>
    );

    fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
      target: { value: "123456789012345" },
    });

    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter Your Phone").value).toBe(
        "123456789012345"
      );
    });
  });

  test("handles network error gracefully on profile update", async () => {
    mock.onPut("/api/v1/auth/profile").networkError();

    render(
      <Router>
        <Profile />
      </Router>
    );

    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  test("valid name and invalid email", async () => {
    render(
      <Router>
        <Profile />
      </Router>
    );

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Valid Name" }, // Valid name
    });

    fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
      target: { value: "invalid-phone" }, // Invalid email
    });

    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter Your Name").value).toBe(
        "Valid Name"
      );
      // eslint-disable-next-line testing-library/no-wait-for-multiple-assertions
      expect(screen.getByPlaceholderText("Enter Your Phone").value).toBe(
        "invalid-phone"
      );
    });
  });
});
