import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import CreateCategory from './CreateCategory';
import { useAuth } from '../../context/auth';
import { useCart } from '../../context/cart';
import { useSearch } from '../../context/search';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

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

        // Ensure that the page renders the form and the category list
        expect(getByText('Manage Category')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter new category')).toBeInTheDocument();
    });

    it('should display error message on failed category creation', async () => {
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

        // Wait for the axios call and check if error toast is displayed
        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(toast.error).toHaveBeenCalledWith('somthing went wrong in input form');
    });
});
