import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Login from './Login';

// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
}));

const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actualNav = jest.requireActual('react-router-dom');
  return {
    ...actualNav,
    useNavigate: () => mockedNavigate,
  };
});

Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

window.matchMedia = window.matchMedia || function () {
  return {
    matches: false,
    addListener: function () { },
    removeListener: function () { }
  };
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('LOGIN FORM')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
    expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    expect(screen.getByText('LOGIN')).toBeInTheDocument();
  });

  it('should navigate to forgot password page when clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Forgot Password'));
    expect(mockedNavigate).toHaveBeenCalledWith('/forgot-password');
    expect(mockedNavigate).toHaveBeenCalledTimes(1);
  });

  it('inputs should be initially empty', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('LOGIN FORM')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Your Email').value).toBe('');
    expect(screen.getByPlaceholderText('Enter Your Password').value).toBe('');
  });

  it('should allow typing email and password', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    expect(screen.getByPlaceholderText('Enter Your Email').value).toBe('test@example.com');
    expect(screen.getByPlaceholderText('Enter Your Password').value).toBe('password123');
  });

  it('should not submit the form when the email is invalid', () => {
    const handleSubmit = jest.fn();
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login onSubmit={handleSubmit}/>} />
        </Routes>
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test' } });
    fireEvent.click(screen.getByText('LOGIN'));
    expect(screen.getByPlaceholderText('Enter Your Email').validity.valid).toBe(false);
    expect(screen.getByPlaceholderText('Enter Your Email').validity.typeMismatch).toBe(true);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('should not submit the form when the email is empty', () => {
    const handleSubmit = jest.fn();
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login onSubmit={handleSubmit}/>} />
        </Routes>
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: '' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('LOGIN'));
    expect(screen.getByPlaceholderText('Enter Your Email').validity.valid).toBe(false);
    expect(screen.getByPlaceholderText('Enter Your Email').validity.valueMissing).toBe(true);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('should not submit the form when the password is empty', () => {
    const handleSubmit = jest.fn();
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login onSubmit={handleSubmit}/>} />
        </Routes>
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: '' } });
    fireEvent.click(screen.getByText('LOGIN'));
    expect(screen.getByPlaceholderText('Enter Your Password').validity.valid).toBe(false);
    expect(screen.getByPlaceholderText('Enter Your Password').validity.valueMissing).toBe(true);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('should login the user successfully', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        user: { id: 1, name: 'John Doe', email: 'test@example.com' },
        token: 'mockToken'
      }
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('LOGIN'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(undefined, {
      duration: 5000,
      icon: '🙏',
      style: {
        background: 'green',
        color: 'white'
      }
    });
  });

  /*
  Currently passes this unit test, but the toast error message displayed is wrong due to
  the API response received being wrong (A HTTPcode 404 is received instead of a HTTPcode 200).
  Also, API response has a mis-spelled 'registerd' as the message.
  */
  it('should display error message on invalid login email', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: false,
        message: 'Email is not registered'
      }
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('LOGIN'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Email is not registered');
  });
  
  it('should display error message on invalid login password', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: false,
        message: 'Invalid Password'
      }
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('LOGIN'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Invalid Password');
  });

  it('should display error message on timeout from no database connection', async () => {
    axios.post.mockRejectedValueOnce({
      status: 404,
      statusText: 'Not Found',
      data: {
        success: false,
        message: 'Error in login'
      }
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('LOGIN'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('should have the password field hidden with (type="password")', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Enter Your Password')).toHaveAttribute('type', 'password');
  });
});
