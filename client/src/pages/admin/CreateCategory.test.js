import React from 'react';
import { render, fireEvent, waitFor, screen, within } from '@testing-library/react';
import axios from 'axios';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import CreateCategory from './CreateCategory';
import { useAuth } from '../../context/auth';
import { useCart } from '../../context/cart';
import { useSearch } from '../../context/search';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import e from 'express';

jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../../context/auth');
jest.mock('../../context/cart');
jest.mock('../../context/search');

describe('CreateCategory Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Mock useAuth to return valid values
        useAuth.mockReturnValue([{
            user: { name: 'Admin User', email: 'admin@example.com' },
        }, jest.fn()]);

        // Mock useCart to return an empty cart
        useCart.mockReturnValue([[], jest.fn()]);

        // Mock useSearch to return an empty search keyword
        useSearch.mockReturnValue([{ keyword: '' }, jest.fn()]);

    });

    it('renders the CreateCategory page', () => {
        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/create-category']}>
                <Routes>
                    <Route path="/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>);

        expect(getByText('Manage Category')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter new category')).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();

    });

    // TC-301
    it('renders the category list', async () => {
        const categories = [
            { _id: '1', name: 'Category 1' },
            { _id: '2', name: 'Category 2' },
        ];
        axios.get.mockReturnValue(Promise.resolve({ data: { success: true, message: "All Categories List", category: categories } }));

        const { getByText, getAllByRole } = render(
            <MemoryRouter initialEntries={['/create-category']}>
                <Routes>
                    <Route path="/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>);

        await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category'));

        await waitFor(() => {
            const table = screen.getAllByRole('row');
            expect(table).toHaveLength(3);
            expect(within(table[1]).getByText('Category 1')).toBeInTheDocument();
            expect(within(table[2]).getByText('Category 2')).toBeInTheDocument();
        });
    });

    // TC-302
    it.failing('handles error when fetching categories fails', async () => {
        axios.get.mockRejectedValue(new Error('Failed to fetch categories'));

        render(
            <MemoryRouter initialEntries={['/create-category']}>
                <Routes>
                    <Route path="/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Something went wrong in getting category');
        });

        expect(screen.queryByText('Category 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Category 2')).not.toBeInTheDocument();
    });

    // TC-315
    it('should display success message when category is created', async () => {
        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/create-category']}>
                <Routes>
                    <Route path="/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>);

        axios.post.mockReturnValue(Promise.resolve({ data: { success: true, message: 'new category created' } }));

        fireEvent.change(getByPlaceholderText('Enter new category'), {
            target: { value: 'Test Category' },
        });

        fireEvent.click(getByText('Submit'));

        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(toast.success).toHaveBeenCalledWith('Test Category is created');
    });

    // TC-316
    it.failing('should display error message on failed category creation', async () => {
        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/create-category']}>
                <Routes>
                    <Route path="/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>);

        fireEvent.change(getByPlaceholderText('Enter new category'), {
            target: { value: 'Test Category' },
        });

        fireEvent.click(getByText('Submit'));

        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(toast.error).toHaveBeenCalledWith('something went wrong in input form');
    });

    // TC-311
    it.failing('should display error message when category to be created already exists', async () => {
        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/create-category']}>
                <Routes>
                    <Route path="/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>);

        axios.post.mockReturnValue(Promise.resolve({ data: { success: true, message: 'Category already exists' } }));

        fireEvent.change(getByPlaceholderText('Enter new category'), {
            target: { value: 'Test Category' },
        });

        fireEvent.click(getByText('Submit'));

        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(toast.error).toHaveBeenCalledWith('Category already exists');
    });

    // TC-312
    it('should display middleware error message when user is not admin', async () => {
        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/create-category']}>
                <Routes>
                    <Route path="/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>);

        axios.post.mockReturnValue(Promise.resolve({ data: { success: false, message: "Error in admin middleware" } }));

        fireEvent.change(getByPlaceholderText('Enter new category'), {
            target: { value: 'Test Category' },
        });

        fireEvent.click(getByText('Submit'));

        await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/api/v1/category/create-category', { "name": "Test Category" }));
        expect(toast.error).toHaveBeenCalledWith('Error in admin middleware');
    });

    // TC-313
    it('should display unauthorized message when user is not admin', async () => {
        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/create-category']}>
                <Routes>
                    <Route path="/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>);

        axios.post.mockReturnValue(Promise.resolve({ data: { success: false, message: 'UnAuthorized Access' } }));

        fireEvent.change(getByPlaceholderText('Enter new category'), {
            target: { value: 'Test Category' },
        });

        fireEvent.click(getByText('Submit'));

        await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/api/v1/category/create-category', { "name": "Test Category" }));
        expect(toast.error).toHaveBeenCalledWith('UnAuthorized Access');
    });

    /// TC-321
    it('should display succee message when category is deleted', async () => {
        const categories = [
            { _id: '1', name: 'Category 1' },
        ];
        axios.get.mockReturnValue(Promise.resolve({ data: { success: true, message: "All Categories List", category: categories } }));

        axios.delete.mockReturnValue(Promise.resolve({ data: { success: true, message: 'Categry Deleted Successfully' } }));

        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/create-category']}>
                <Routes>
                    <Route path="/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>);

        await waitFor(async () => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            fireEvent.click(getByText(/delete/i));
        });

        await waitFor(() => expect(axios.delete).toHaveBeenCalledWith('/api/v1/category/delete-category/1'));
        expect(toast.success).toHaveBeenCalledWith('category is deleted');
    });

    // TC-322
    it.failing('should display error message when category cannot be deleted', async () => {
        const categories = [
            { _id: '1', name: 'Category 1' },
        ];
        axios.get.mockReturnValue(Promise.resolve({ data: { success: true, message: "All Categories List", category: categories } }));

        axios.delete.mockRejectedValue(new Error('Failed to delete category'));

        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/create-category']}>
                <Routes>
                    <Route path="/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>);

        await waitFor(async () => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
            fireEvent.click(getByText(/delete/i));
        });

        await waitFor(() => expect(axios.delete).toHaveBeenCalledWith('/api/v1/category/delete-category/1'));
        expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });

    // TC-331
    it.failing('should display error message when category ID not exist when updating', async () => {
        const categories = [
            { _id: '1', name: 'Category 1' },
        ];
        axios.get.mockReturnValueOnce(Promise.resolve({ data: { success: true, message: "All Categories List", category: categories } }));

        const newCategories = categories
        axios.get.mockReturnValueOnce(Promise.resolve({ data: { success: true, message: "All Categories List", category: newCategories } }));
        axios.put.mockReturnValueOnce(Promise.resolve({ data: { success: true, message: 'Category Updated Successfully', category: null } }));

        const { getByText,getByRole, getAllByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/create-category']}>
                <Routes>
                    <Route path="/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>);


        await waitFor(async () => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
            fireEvent.click(getByText(/edit/i));
            const modal = getByRole('dialog');

            const inputFields = within(modal).getAllByPlaceholderText(/Enter new category/i);
            fireEvent.change(inputFields[0], { target: { value: 'Updated Category 1' } });
        
            const updateButton = within(modal).getByText(/submit/i);
            fireEvent.click(updateButton);
        });

        await waitFor(() => expect(axios.put).toHaveBeenCalledWith('/api/v1/category/update-category/1', { name: 'Updated Category 1' }));

        // a check in the CUD to be done to see if category is null, and if so, display error message
        expect(toast.error).toHaveBeenCalledWith('Category not found');

        await waitFor(async () => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
            expect(getByText('Updated Category 1')).not.toBeInTheDocument();
        });
    });

    // TC-332
    it('should display success message when category is updated', async () => {
        const categories = [
            { _id: '1', name: 'Category 1' },
        ];
        axios.get.mockReturnValueOnce(Promise.resolve({ data: { success: true, message: "All Categories List", category: categories } }));

        const newCategory = { _id: '1', name: 'Updated Category 1' }
        const newCategories = [
            newCategory
        ];
        axios.get.mockReturnValueOnce(Promise.resolve({ data: { success: true, message: "All Categories List", category: newCategories } }));
        axios.put.mockReturnValue(Promise.resolve({ data: { success: true, message: 'Category Updated Successfully' , newCategory} }));

        const { getByText,getByRole, getAllByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/create-category']}>
                <Routes>
                    <Route path="/create-category" element={<CreateCategory />} />
                </Routes>
            </MemoryRouter>);


        await waitFor(async () => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
            fireEvent.click(getByText(/edit/i));
            const modal = getByRole('dialog');

            const inputFields = within(modal).getAllByPlaceholderText(/Enter new category/i);
            fireEvent.change(inputFields[0], { target: { value: 'Updated Category 1' } });
        
            const updateButton = within(modal).getByText(/submit/i);
            fireEvent.click(updateButton);

        });

        await waitFor(() => expect(axios.put).toHaveBeenCalledWith('/api/v1/category/update-category/1', { name: 'Updated Category 1' }));

        expect(toast.success).toHaveBeenCalledWith('Updated Category 1 is updated');

        await waitFor(async () => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
            expect(getByText('Updated Category 1')).toBeInTheDocument();
        });
    });
});