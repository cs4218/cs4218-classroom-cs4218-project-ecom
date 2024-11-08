import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomePage from './HomePage';
import axios from 'axios';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';

// Mock axios
jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../context/cart', () => ({
    useCart: jest.fn(() => [[], jest.fn()])
}));

jest.mock('../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock('../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
}));

jest.mock("./../components/Layout", () => ({ children }) => <div>{children}</div>);

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn()
}));


window.matchMedia = window.matchMedia || function () {
    return {
        matches: false,
        addListener: function () { },
        removeListener: function () { }
    };
};

Object.defineProperty(window, 'localStorage', {
    value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
    },
    writable: true,
});

describe('HomePage Component', () => {

    const mockProducts = [{
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
    },
    {
        _id: "3",
        name: "test_product_3",
        price: 50,
        description: "this is test product 3",
        slug: "pdt3",
        category: "c2"
    },
    {
        _id: "4",
        name: "test_product_4",
        price: 70,
        description: "this is test product 4",
        slug: "pdt4",
        category: "c2"
    },
    {
        _id: "5",
        name: "test_product_5",
        price: 87,
        description: "this is test product 5",
        slug: "pdt5",
        category: "c2"
    },
    {
        _id: "6",
        name: "test_product_6",
        price: 107,
        description: "this is test product 6",
        slug: "pdt6",
        category: "c2"
    },
    {
        _id: "7",
        name: "test_product_7",
        description: "this is test product 7",
        slug: "pdt7",
        price: 108,
        category: "c1"
    }
    ]

    const mockCategories = [{
        _id: "c1",
        name: "category_1"
    },
    {
        _id: "c2",
        name: "category_2"
    }]

    const mockReload = jest.fn();

    beforeEach(() => {
        axios.get.mockImplementation((url) => {
            if (url.includes("/api/v1/category/get-category")) {
                return Promise.resolve({ data: { success: true, category: mockCategories } });
            }
            if (url.includes("/api/v1/product/product-list/1")) {
                return Promise.resolve({ data: { products: mockProducts.slice(0, 6) } });
            }
            if (url.includes("/api/v1/product/product-list/2")) {
                return Promise.resolve({ data: { products: mockProducts } });
            }
            if (url.includes("/api/v1/product/product-count")) {
                return Promise.resolve({ data: { total: mockProducts.length } });
            }
            return Promise.reject(new Error("Not Found"));
        });


        axios.post.mockImplementation((url, data) => {
            if (url.includes('/api/v1/product/product-filters')) {
                const filteredProducts = mockProducts.filter(p => {
                    const categoryMatch = !data.checked.length || data.checked.includes(p.category);
                    const priceMatch = !data.radio.length || (p.price >= data.radio[0] && p.price <= data.radio[1]);
                    return categoryMatch && priceMatch;
                });
                return Promise.resolve({ data: { products: filteredProducts } });
            }
        });

        Object.defineProperty(window, "location", {
            writable: true,
            value: { reload: mockReload },
        });

    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const renderComponent = () =>
        render(
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                </Routes>
            </MemoryRouter>
        );


    it("renders HomePage and fetches categories and products for page 1", async () => {
        renderComponent();

        expect(screen.getByText("All Products")).toBeInTheDocument();
        expect(screen.getByText("Filter By Category")).toBeInTheDocument();

        await waitFor(() => {
            const categoryItems = screen.getAllByText("category_1");
            expect(categoryItems.length).toBeGreaterThan(0);
        });

        await waitFor(() => {
            const categoryItems = screen.getAllByText("category_2");
            expect(categoryItems.length).toBeGreaterThan(0);
        });

        await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1"));

        await waitFor(() => {
            expect(screen.getByText("test_product_1")).toBeInTheDocument();
            expect(screen.getByText("test_product_2")).toBeInTheDocument();
            expect(screen.getByText("test_product_3")).toBeInTheDocument();
            expect(screen.getByText("test_product_4")).toBeInTheDocument();
            expect(screen.getByText("test_product_5")).toBeInTheDocument();
            expect(screen.getByText("test_product_6")).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.queryByText("test_product_7")).not.toBeInTheDocument();
        });
    });

    it("adds product to cart when ADD TO CART button is clicked", async () => {
        renderComponent();

        await waitFor(() => screen.getByText("test_product_1"));

        fireEvent.click(screen.getAllByText("ADD TO CART")[0]);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
        });
        
        expect(window.localStorage.setItem).toHaveBeenCalledWith(
            "cart",
            JSON.stringify([
                {
                    _id: "1",
                    name: "test_product_1",
                    description: "this is test product 1",
                    slug: "pdt1",
                    price: 11,
                    category: "c1"
                }
            ])
        );
    });


    it("renders more details of product", async () => {
        const navigate = jest.fn();
        useNavigate.mockReturnValue(navigate);
        renderComponent();
        await waitFor(() => screen.getByText("test_product_1"));

        fireEvent.click(screen.getAllByText("More Details")[0]);

        expect(navigate).toHaveBeenCalledWith("/product/pdt1");
    })

    /* Combinatorial testing for filtering products
    create 5 tests for the 5 price ranges leaving both categories unchecked
    create 2 tests on the categories with t1 checked, t2 unchecked then t1 unchecked, t2 checked.
    Then create tests for the rest of the combinations
    1. t1-checked and t2-unchecked for each price range 1-5
    2. t1-unchecked and t2-checked for each price range 1-5
    */

    it("filters product by category, category 1", async () => {
        renderComponent();

        await waitFor(() => screen.getAllByText("category_1"));
        fireEvent.click(screen.getByLabelText("category_1"));
        await waitFor(() => expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
            checked: ["c1"],
            radio: [],
        }));
        await waitFor(() => {
            expect(screen.getByText("test_product_1")).toBeInTheDocument();
            expect(screen.getByText("test_product_2")).toBeInTheDocument();
            expect(screen.getByText("test_product_7")).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.queryByText("test_product_3")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_4")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_5")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_6")).not.toBeInTheDocument();
        });

    })

    it("filters product by category, category 2", async () => {
        renderComponent();

        await waitFor(() => screen.getAllByText("category_2"));
        fireEvent.click(screen.getByLabelText("category_2"));
        await waitFor(() => expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
            checked: ["c2"],
            radio: [],
        }));
        await waitFor(() => {
            expect(screen.getByText("test_product_3")).toBeInTheDocument();
            expect(screen.getByText("test_product_4")).toBeInTheDocument();
            expect(screen.getByText("test_product_5")).toBeInTheDocument();
            expect(screen.getByText("test_product_6")).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.queryByText("test_product_1")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_2")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_7")).not.toBeInTheDocument();
        });

    })

    it("filters product by category and price, category 1 and $0 to 19", async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText("test_product_1")).toBeInTheDocument());
        const priceRadio = screen.getByLabelText("$0 to 19");
        fireEvent.click(priceRadio);
        const categoryCheckbox = screen.getByLabelText("category_1");
        fireEvent.click(categoryCheckbox);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
                checked: ["c1"],
                radio: [0, 19],
            });
        });
        await waitFor(() => {
            expect(screen.getByText("test_product_1")).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.queryByText("test_product_2")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_3")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_4")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_5")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_6")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_7")).not.toBeInTheDocument();
        });
    });

    it("filters product by category and price, category 2 and $0 to 19", async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText("test_product_1")).toBeInTheDocument());
        const priceRadio = screen.getByLabelText("$0 to 19");
        fireEvent.click(priceRadio);
        const categoryCheckbox = screen.getByLabelText("category_2");
        fireEvent.click(categoryCheckbox);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
                checked: ["c2"],
                radio: [0, 19],
            });
        });
        await waitFor(() => {
            expect(screen.queryByText("test_product_1")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_2")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_3")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_4")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_5")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_6")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_7")).not.toBeInTheDocument();
        });
    });

    it("filters product by category and price, category 1 and $20 to 39", async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText("test_product_1")).toBeInTheDocument());
        const priceRadio = screen.getByLabelText("$20 to 39");
        fireEvent.click(priceRadio);
        const categoryCheckbox = screen.getByLabelText("category_1");
        fireEvent.click(categoryCheckbox);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
                checked: ["c1"],
                radio: [20, 39],
            });
        });
        await waitFor(() => {
            expect(screen.getByText("test_product_2")).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.queryByText("test_product_1")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_3")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_4")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_5")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_6")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_7")).not.toBeInTheDocument();
        });
    });

    it("filters product by category and price, category 2 and $20 to 39", async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText("test_product_1")).toBeInTheDocument());
        const priceRadio = screen.getByLabelText("$20 to 39");
        fireEvent.click(priceRadio);
        const categoryCheckbox = screen.getByLabelText("category_2");
        fireEvent.click(categoryCheckbox);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
                checked: ["c2"],
                radio: [20, 39],
            });
        });
        await waitFor(() => {
            expect(screen.getByText("test_product_3")).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.queryByText("test_product_1")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_2")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_4")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_5")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_6")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_7")).not.toBeInTheDocument();
        });
    });

    it("filters product by category and price, category 1 and $40 to 59", async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText("test_product_1")).toBeInTheDocument());
        const priceRadio = screen.getByLabelText("$40 to 59");
        fireEvent.click(priceRadio);
        const categoryCheckbox = screen.getByLabelText("category_1");
        fireEvent.click(categoryCheckbox);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
                checked: ["c1"],
                radio: [40, 59],
            });
        });
        await waitFor(() => {
            expect(screen.queryByText("test_product_1")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_2")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_3")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_4")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_5")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_6")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_7")).not.toBeInTheDocument();
        });
    });

    it("filters product by category and price, category 2 and $40 to 59", async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText("test_product_1")).toBeInTheDocument());
        const priceRadio = screen.getByLabelText("$40 to 59");
        fireEvent.click(priceRadio);
        const categoryCheckbox = screen.getByLabelText("category_2");
        fireEvent.click(categoryCheckbox);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
                checked: ["c2"],
                radio: [40, 59],
            });
        });
        await waitFor(() => {
            expect(screen.getByText("test_product_3")).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.queryByText("test_product_1")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_2")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_4")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_5")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_6")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_7")).not.toBeInTheDocument();
        });
    });

    it("filters product by category and price, category 1 and $60 to 79", async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText("test_product_1")).toBeInTheDocument());
        const priceRadio = screen.getByLabelText("$60 to 79");
        fireEvent.click(priceRadio);
        const categoryCheckbox = screen.getByLabelText("category_1");
        fireEvent.click(categoryCheckbox);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
                checked: ["c1"],
                radio: [60, 79],
            });
        });
        await waitFor(() => {
            expect(screen.queryByText("test_product_1")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_2")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_3")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_4")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_5")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_6")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_7")).not.toBeInTheDocument();
        });
    });

    it("filters product by category and price, category 2 and $60 to 79", async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText("test_product_1")).toBeInTheDocument());
        const priceRadio = screen.getByLabelText("$60 to 79");
        fireEvent.click(priceRadio);
        const categoryCheckbox = screen.getByLabelText("category_2");
        fireEvent.click(categoryCheckbox);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
                checked: ["c2"],
                radio: [60, 79],
            });
        });
        await waitFor(() => {
            expect(screen.getByText("test_product_4")).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.queryByText("test_product_1")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_2")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_3")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_5")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_6")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_7")).not.toBeInTheDocument();
        });
    });

    it("filters product by category and price, category 1 and $80 to 99", async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText("test_product_1")).toBeInTheDocument());
        const priceRadio = screen.getByLabelText("$80 to 99");
        fireEvent.click(priceRadio);
        const categoryCheckbox = screen.getByLabelText("category_1");
        fireEvent.click(categoryCheckbox);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
                checked: ["c1"],
                radio: [80, 99],
            });
        });
        await waitFor(() => {
            expect(screen.queryByText("test_product_1")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_2")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_3")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_4")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_5")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_6")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_7")).not.toBeInTheDocument();
        });
    });

    it("filters product by category and price, category 2 and $80 to 99", async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText("test_product_1")).toBeInTheDocument());
        const priceRadio = screen.getByLabelText("$80 to 99");
        fireEvent.click(priceRadio);
        const categoryCheckbox = screen.getByLabelText("category_2");
        fireEvent.click(categoryCheckbox);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
                checked: ["c2"],
                radio: [80, 99],
            });
        });
        await waitFor(() => {
            expect(screen.getByText("test_product_5")).toBeInTheDocument();
        });
        await waitFor(() => {
            expect(screen.queryByText("test_product_1")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_2")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_3")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_4")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_6")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_7")).not.toBeInTheDocument();
        });
    });

    it("filters product by category and price, category 1 and $100 or more", async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText("test_product_1")).toBeInTheDocument());
        const priceRadio = screen.getByLabelText("$100 or more");
        fireEvent.click(priceRadio);
        const categoryCheckbox = screen.getByLabelText("category_1");
        fireEvent.click(categoryCheckbox);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
                checked: ["c1"],
                radio: [100, 9999],
            });
        });
        await waitFor(() => {
            expect(screen.getByText("test_product_7")).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.queryByText("test_product_1")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_2")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_3")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_4")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_5")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_6")).not.toBeInTheDocument();
        });
    });

    it("filters product by category and price, category 2 and $100 or more", async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText("test_product_1")).toBeInTheDocument());
        const priceRadio = screen.getByLabelText("$100 or more");
        fireEvent.click(priceRadio);
        const categoryCheckbox = screen.getByLabelText("category_2");
        fireEvent.click(categoryCheckbox);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
                checked: ["c2"],
                radio: [100, 9999],
            });
        });
        await waitFor(() => {
            expect(screen.getByText("test_product_6")).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.queryByText("test_product_1")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_2")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_3")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_4")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_5")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_7")).not.toBeInTheDocument();
        });
    });

    it("filters product by price, $0 to 19", async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText("test_product_1")).toBeInTheDocument());
        const priceRadio = screen.getByLabelText("$0 to 19");
        fireEvent.click(priceRadio);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
                checked: [],
                radio: [0, 19],
            });
        });
        await waitFor(() => {
            expect(screen.getByText("test_product_1")).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.queryByText("test_product_2")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_3")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_4")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_5")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_6")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_7")).not.toBeInTheDocument();
        });

    })

    it("filters product by price, $20 to 39", async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText("test_product_1")).toBeInTheDocument());
        const priceRadio = screen.getByLabelText("$20 to 39");
        fireEvent.click(priceRadio);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
                checked: [],
                radio: [20, 39],
            });
        });
        await waitFor(() => {
            expect(screen.getByText("test_product_2")).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.queryByText("test_product_1")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_3")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_4")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_5")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_6")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_7")).not.toBeInTheDocument();
        });

    })

    it("filters product by price, $40 to 59", async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText("test_product_1")).toBeInTheDocument());
        const priceRadio = screen.getByLabelText("$40 to 59");
        fireEvent.click(priceRadio);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
                checked: [],
                radio: [40, 59],
            });
        });
        await waitFor(() => {
            expect(screen.getByText("test_product_3")).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.queryByText("test_product_2")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_1")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_4")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_5")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_6")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_7")).not.toBeInTheDocument();
        });
    })

    it("filters product by price, $60 to 79", async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText("test_product_1")).toBeInTheDocument());
        const priceRadio = screen.getByLabelText("$60 to 79");
        fireEvent.click(priceRadio);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
                checked: [],
                radio: [60, 79],
            });
        });
        await waitFor(() => {
            expect(screen.getByText("test_product_4")).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.queryByText("test_product_2")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_3")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_1")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_5")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_6")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_7")).not.toBeInTheDocument();
        });

    })

    it("filters product by price, $80 to 99", async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText("test_product_1")).toBeInTheDocument());
        const priceRadio = screen.getByLabelText("$80 to 99");
        fireEvent.click(priceRadio);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
                checked: [],
                radio: [80, 99],
            });
        });
        await waitFor(() => {
            expect(screen.getByText("test_product_5")).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.queryByText("test_product_2")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_3")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_4")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_1")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_6")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_7")).not.toBeInTheDocument();
        });

    })

    it("filters product by price, $100 or more", async () => {
        renderComponent();
        await waitFor(() => expect(screen.getByText("test_product_1")).toBeInTheDocument());
        const priceRadio = screen.getByLabelText("$100 or more");
        fireEvent.click(priceRadio);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
                checked: [],
                radio: [100, 9999],
            });
        });
        await waitFor(() => {
            expect(screen.getByText("test_product_6")).toBeInTheDocument();
            expect(screen.getByText("test_product_7")).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.queryByText("test_product_2")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_3")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_4")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_5")).not.toBeInTheDocument();
            expect(screen.queryByText("test_product_1")).not.toBeInTheDocument();
        });

    })

    it("loads more products on click", async () => {
        renderComponent();

        const loadMoreButton = await screen.findByText(/Loadmore/i);
        fireEvent.click(loadMoreButton);

        await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/2"));

        await waitFor(() => {
            expect(screen.getByText("test_product_7")).toBeInTheDocument();
        });
    });

    it("should call window.location.reload when the reset filters button is clicked", () => {
        // Render the component
        renderComponent();

        const resetButton = screen.getByText("RESET FILTERS");
    
        fireEvent.click(resetButton);
    
        expect(mockReload).toHaveBeenCalled();
      });

})

