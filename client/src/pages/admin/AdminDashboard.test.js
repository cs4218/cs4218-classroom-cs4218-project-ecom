import React from 'react';
import { render } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';
import { useAuth } from '../../context/auth';
import "@testing-library/jest-dom";

// Mock components
jest.mock('../../context/auth');
jest.mock('../../components/AdminMenu', () => () => <div>AdminMenu Component</div>);
jest.mock('../../components/Layout', () => ({ children }) => <div>{children}</div>);

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the AdminDashboard with admin details', () => {
    useAuth.mockReturnValue([
      {
        user: {
          name: 'Admin User',
          email: 'admin@example.com',
          phone: '123-456-7890',
        },
      },
    ]);

    const { getByText } = render(<AdminDashboard />);

    expect(getByText('AdminMenu Component')).toBeInTheDocument();

    expect(getByText('Admin Name : Admin User')).toBeInTheDocument();
    expect(getByText('Admin Email : admin@example.com')).toBeInTheDocument();
    expect(getByText('Admin Contact : 123-456-7890')).toBeInTheDocument();
  });

  it('renders fallback when no admin details are provided', () => {
    useAuth.mockReturnValue([{}]);

    const { getByText } = render(<AdminDashboard />);

    expect(getByText('AdminMenu Component')).toBeInTheDocument();

    expect(getByText('Admin Name :')).toBeInTheDocument();
    expect(getByText('Admin Email :')).toBeInTheDocument();
    expect(getByText('Admin Contact :')).toBeInTheDocument();
  });
});
