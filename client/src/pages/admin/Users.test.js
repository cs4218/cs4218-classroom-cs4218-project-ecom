import React from 'react';
import { render, screen } from '@testing-library/react';
import Users from './Users';
import Layout from '../../components/Layout';
import AdminMenu from '../../components/AdminMenu';
import '@testing-library/jest-dom/extend-expect'; // Import for jest-dom matchers

jest.mock('../../components/Layout', () => ({ children }) => <div>{children}</div>);
jest.mock('../../components/AdminMenu', () => () => <div>Admin Menu</div>);

describe('Users Component', () => {
  test('renders AdminMenu and All Users heading', () => {
    render(<Users />);
    
    expect(screen.getByText(/Admin Menu/i)).toBeInTheDocument();
    
    expect(screen.getByRole('heading', { name: /All Users/i })).toBeInTheDocument();
  });

});
