import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Categories from "./Categories";
import useCategory from "../hooks/useCategory";
import '@testing-library/jest-dom'

jest.mock('../hooks/useCategory', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock("./../components/Layout", () => ({ children }) => <div>{children}</div>);


window.matchMedia = window.matchMedia || function () {
    return {
        matches: false,
        addListener: function () { },
        removeListener: function () { }
    };
};

describe("Categories Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    const mockCategories = [{
        _id: "c1",
        name: "category_1",
        slug: "c1"
    },
    {
        _id: "c2",
        name: "category_2",
        slug: "c2"
    }]

    const renderComponent = () =>
        render(
            <MemoryRouter initialEntries={['/categories']}>
                <Routes>
                    <Route path="/categories" element={<Categories />} />
                </Routes>
            </MemoryRouter>
        );

    it("should render categories correctly", async () => {

        useCategory.mockImplementation(jest.fn(() => mockCategories));

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText("category_1")).toBeInTheDocument();
            expect(screen.getByText("category_2")).toBeInTheDocument()

            expect(screen.getByText("category_1")).toHaveAttribute('href', '/category/c1');
            expect(screen.getByText("category_2")).toHaveAttribute('href', '/category/c2');
        });
    });

});