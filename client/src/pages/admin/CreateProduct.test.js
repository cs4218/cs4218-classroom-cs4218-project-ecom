import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import '@testing-library/jest-dom/extend-expect'; // For matchers like toBeInTheDocument
import toast from 'react-hot-toast';
import CreateProduct from './CreateProduct';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import { message } from 'antd';

// Mock axios for API calls
jest.mock('axios');
jest.mock("../../components/Layout", () => ({ children }) => (
    <div>{children}</div>
));
jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(() => [null, jest.fn()]),
}));
jest.mock('react-hot-toast');

const mockedUsedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedUsedNavigate, // Return an empty jest function to test whether it was called or not...I'm not depending on the results so no need to put in a return value
}));

describe('CreateProduct Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        useAuth.mockReturnValue([{
            user: { name: 'Admin User', email: 'admin@example.com' },
        }, jest.fn()]);

        axios.get.mockResolvedValueOnce({
            data: {
                success: true,
                category: [{ _id: '1', name: 'Category 1' }, { _id: '2', name: 'Category 2' }],
            },
        });
    });

    it('renders the CreateProduct form', async () => {
        const { getByText, getByPlaceholderText, getByRole } = render(
            <MemoryRouter initialEntries={['/create-product']}>
                <Routes>
                    <Route path="/create-product" element={<CreateProduct />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category'))

        const categorySelect = await screen.findByTestId('category-select');
        expect(categorySelect).toBeInTheDocument();
        expect(getByText('Upload Photo')).toBeInTheDocument();

        expect(getByPlaceholderText('write a name')).toBeInTheDocument();
        expect(getByPlaceholderText('write a description')).toBeInTheDocument();
        expect(getByPlaceholderText('write a Price')).toBeInTheDocument();

        const shippingSelect = await screen.findByTestId('shipping-select');
        expect(shippingSelect).toBeInTheDocument();

        expect(getByText('CREATE PRODUCT')).toBeInTheDocument();

    });


    // TC-402
    it.failing('should display corresponding "description is required" error message when description, price and quantity are empty', async () => {
        axios.post.mockReturnValue(() => {
            throw new Error("Description is Required");
        });

        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/create-product']}>
                <Routes>
                    <Route path="/create-product" element={<CreateProduct />} />
                </Routes>
            </MemoryRouter>
        );


        await waitFor(async () => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            const selectPlaceholder = getByText(/select a category/i);
            fireEvent.mouseDown(selectPlaceholder);
            const category = await getByText(/Category 1/i);
            fireEvent.click(category);
        });

        fireEvent.change(getByPlaceholderText('write a name'), {
            target: { value: 'Test Product' },
        });

        const selectShipping = getByText(/select shipping/i);
        fireEvent.mouseDown(selectShipping);
        const shipping = getByText("Yes");
        fireEvent.click(shipping);

        fireEvent.click(getByText('CREATE PRODUCT'));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                '/api/v1/product/create-product',
                expect.any(FormData)
            );
            expect(toast.error).toHaveBeenCalledWith('Description is Required');
            expect(mockedUsedNavigate).not.toHaveBeenCalledWith('/dashboard/admin/products');
        });
    });


    // TC-404
    it.failing('should display corresponding "name is required" error message when name and price are empty', async () => {
        axios.post.mockReturnValue(() => {
            throw new Error("Name is Required");
        });

        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/create-product']}>
                <Routes>
                    <Route path="/create-product" element={<CreateProduct />} />
                </Routes>
            </MemoryRouter>
        );


        await waitFor(async () => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            const selectPlaceholder = getByText(/select a category/i);
            fireEvent.mouseDown(selectPlaceholder);
            const category = await getByText(/Category 1/i);
            fireEvent.click(category);
        });

        fireEvent.change(getByPlaceholderText('write a description'), {
            target: { value: 'This is a test product' },
        });

        fireEvent.change(getByPlaceholderText('write a quantity'), {
            target: { value: '10' },
        });

        const selectShipping = getByText(/select shipping/i);
        fireEvent.mouseDown(selectShipping);
        const shipping = getByText("Yes");
        fireEvent.click(shipping);

        fireEvent.click(getByText('CREATE PRODUCT'));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                '/api/v1/product/create-product',
                expect.any(FormData)
            );
            expect(toast.error).toHaveBeenCalledWith('Name is Required');
            expect(mockedUsedNavigate).not.toHaveBeenCalledWith('/dashboard/admin/products');
        });
    });

    // TC-409
    it.failing('should submit form data and display success message on product creation when all fields are valid', async () => {
        axios.post.mockReturnValue({
            data: { success: true, message: 'Product Created Successfully' },
        });

        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/create-product']}>
                <Routes>
                    <Route path="/create-product" element={<CreateProduct />} />
                </Routes>
            </MemoryRouter>
        );


        await waitFor(async () => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            const selectPlaceholder = getByText(/select a category/i);
            fireEvent.mouseDown(selectPlaceholder);
            const category = await getByText(/Category 1/i);
            fireEvent.click(category);
        });

        fireEvent.change(getByPlaceholderText('write a name'), {
            target: { value: 'Test Product' },
        });
        fireEvent.change(getByPlaceholderText('write a description'), {
            target: { value: 'This is a test product' },
        });
        fireEvent.change(getByPlaceholderText('write a Price'), {
            target: { value: '100' },
        });
        fireEvent.change(getByPlaceholderText('write a quantity'), {
            target: { value: '10' },
        });

        const selectShipping = getByText(/select shipping/i);
        fireEvent.mouseDown(selectShipping);
        const shipping = getByText("Yes");
        fireEvent.click(shipping);

        fireEvent.click(getByText('CREATE PRODUCT'));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                '/api/v1/product/create-product',
                expect.any(FormData)
            );
            expect(toast.success).toHaveBeenCalledWith('Product Created Successfully');
            expect(mockedUsedNavigate).toHaveBeenCalledWith('/dashboard/admin/products');
        });
    });

    // TC-412
    it.failing('should show photo size error message when image size is too big', async () => {
        axios.post.mockReturnValue(() => {
            throw new Error("photo is Required and should be less then 1mb");
        });

        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/create-product']}>
                <Routes>
                    <Route path="/create-product" element={<CreateProduct />} />
                </Routes>
            </MemoryRouter>
        );


        await waitFor(async () => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            const selectPlaceholder = getByText(/select a category/i);
            fireEvent.mouseDown(selectPlaceholder);
            const category = await getByText(/Category 1/i);
            fireEvent.click(category);
        });

        const largeFile = new File(['large_image'], 'large_image.png', {
            type: 'image/png',
            size: 1000001, 
        });
        const fileInput = getByText(/upload photo/i);
        fireEvent.change(fileInput, {
            target: { files: [largeFile] },
        });

        fireEvent.change(getByPlaceholderText('write a name'), {
            target: { value: 'Test Product' },
        });
        fireEvent.change(getByPlaceholderText('write a description'), {
            target: { value: 'This is a test product' },
        });
        fireEvent.change(getByPlaceholderText('write a Price'), {
            target: { value: '100' },
        });
        fireEvent.change(getByPlaceholderText('write a quantity'), {
            target: { value: '10' },
        });

        const selectShipping = getByText(/select shipping/i);
        fireEvent.mouseDown(selectShipping);
        const shipping = getByText("Yes");
        fireEvent.click(shipping);

        fireEvent.click(getByText('CREATE PRODUCT'));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                '/api/v1/product/create-product',
                expect.any(FormData)
            );
            expect(toast.error).toHaveBeenCalledWith('photo is Required and should be less then 1mb');
            expect(mockedUsedNavigate).not.toHaveBeenCalledWith('/dashboard/admin/products');
        });
    });

    // TC-414
    it('should display all categories in the dropdown', async () => {
        const { getByText } = render(
            <MemoryRouter initialEntries={['/create-product']}>
                <Routes>
                    <Route path="/create-product" element={<CreateProduct />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
            const selectPlaceholder = getByText(/select a category/i);
            fireEvent.mouseDown(selectPlaceholder);
            expect(getByText('Category 1')).toBeInTheDocument();
            expect(getByText('Category 2')).toBeInTheDocument();
        });
    });

    // TC-416
    it('should display error message on failed product creation', async () => {
        axios.post.mockImplementation(() => {
            throw new Error();
        });

        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/create-product']}>
                <Routes>
                    <Route path="/create-product" element={<CreateProduct />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(async () => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            const selectPlaceholder = getByText(/select a category/i);
            fireEvent.mouseDown(selectPlaceholder);
            const category = await getByText(/Category 1/i);
            fireEvent.click(category);
        });

        const selectShipping = getByText(/select shipping/i);
        fireEvent.mouseDown(selectShipping);
        const shipping = getByText("Yes");
        fireEvent.click(shipping);

        fireEvent.change(getByPlaceholderText('write a name'), {
            target: { value: 'Test Product' },
        });
        fireEvent.change(getByPlaceholderText('write a description'), {
            target: { value: 'This is a test product' },
        });
        fireEvent.change(getByPlaceholderText('write a Price'), {
            target: { value: '100' },
        });
        fireEvent.change(getByPlaceholderText('write a quantity'), {
            target: { value: '10' },
        });

        fireEvent.click(getByText('CREATE PRODUCT'));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                '/api/v1/product/create-product',
                expect.any(FormData)
            );

            expect(toast.error).toHaveBeenCalledWith('something went wrong');
        });
    });

    // TC-417
    it.failing('should submit form data with all fields accurately filled when all fields are valid', async () => {
        axios.post.mockReturnValue({
            data: { success: true, message: 'Product Created Successfully' },
        });

        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/create-product']}>
                <Routes>
                    <Route path="/create-product" element={<CreateProduct />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(async () => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            const selectPlaceholder = getByText(/select a category/i);
            fireEvent.mouseDown(selectPlaceholder);
            const category = await getByText(/Category 1/i);
            fireEvent.click(category);
        });

        fireEvent.change(getByPlaceholderText('write a name'), {
            target: { value: 'Test Product' },
        });
        fireEvent.change(getByPlaceholderText('write a description'), {
            target: { value: 'This is a test product' },
        });
        fireEvent.change(getByPlaceholderText('write a Price'), {
            target: { value: '100' },
        });
        fireEvent.change(getByPlaceholderText('write a quantity'), {
            target: { value: '10' },
        });

        const selectShipping = getByText(/select shipping/i);
        fireEvent.mouseDown(selectShipping);
        const shipping = getByText("Yes");
        fireEvent.click(shipping);

        fireEvent.click(getByText('CREATE PRODUCT'));

        const expectedFormData = new FormData();
        expectedFormData.append("name", "Test Product");
        expectedFormData.append("description", "This is a test product");
        expectedFormData.append("price", "100");
        expectedFormData.append("quantity", "10");
        expectedFormData.append("photo", "");
        expectedFormData.append("category", "1"); 
        expectedFormData.append("shipping", "Yes"); 
        
        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                '/api/v1/product/create-product',
                expectedFormData
            );
        });
    });
});
