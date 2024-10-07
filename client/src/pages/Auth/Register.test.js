import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Register from './Register';

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


describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders register form', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('REGISTER FORM')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Your Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Your Phone')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Your Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Your DOB')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What is Your Favorite sports')).toBeInTheDocument();
    expect(screen.getByText('REGISTER')).toBeInTheDocument();
  });

  it('inputs should be initially empty', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('REGISTER FORM')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Your Name').value).toBe('');
    expect(screen.getByPlaceholderText('Enter Your Email').value).toBe('');
    expect(screen.getByPlaceholderText('Enter Your Password').value).toBe('');
    expect(screen.getByPlaceholderText('Enter Your Phone').value).toBe('');
    expect(screen.getByPlaceholderText('Enter Your Address').value).toBe('');
    expect(screen.getByPlaceholderText('Enter Your DOB').value).toBe('');
    expect(screen.getByPlaceholderText('What is Your Favorite sports').value).toBe('');
  });

  it('should allow typing in all input fields', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });
    expect(screen.getByPlaceholderText('Enter Your Name').value).toBe('John Doe');
    expect(screen.getByPlaceholderText('Enter Your Email').value).toBe('test@example.com');
    expect(screen.getByPlaceholderText('Enter Your Password').value).toBe('password123');
    expect(screen.getByPlaceholderText('Enter Your Phone').value).toBe('1234567890');
    expect(screen.getByPlaceholderText('Enter Your Address').value).toBe('123 Street');
    expect(screen.getByPlaceholderText('Enter Your DOB').value).toBe('2000-01-01');
    expect(screen.getByPlaceholderText('What is Your Favorite sports').value).toBe('Football');
  });

  it('should not submit the form when the name field is empty', () => {
    const handleSubmit = jest.fn();
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register onSubmit={handleSubmit} />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: '' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });
    fireEvent.click(screen.getByText('REGISTER'));
    expect(screen.getByPlaceholderText('Enter Your Name').validity.valid).toBe(false);
    expect(screen.getByPlaceholderText('Enter Your Name').validity.valueMissing).toBe(true);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('should not submit the form when the email field is invalid', () => {
    const handleSubmit = jest.fn();
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register onSubmit={handleSubmit} />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });
    fireEvent.click(screen.getByText('REGISTER'));
    expect(screen.getByPlaceholderText('Enter Your Email').validity.valid).toBe(false);
    expect(screen.getByPlaceholderText('Enter Your Email').validity.typeMismatch).toBe(true);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('should not submit the form when the email field is empty', () => {
    const handleSubmit = jest.fn();
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register onSubmit={handleSubmit} />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: '' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });
    fireEvent.click(screen.getByText('REGISTER'));
    expect(screen.getByPlaceholderText('Enter Your Email').validity.valid).toBe(false);
    expect(screen.getByPlaceholderText('Enter Your Email').validity.valueMissing).toBe(true);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('should not submit the form when the password field is empty', () => {
    const handleSubmit = jest.fn();
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register onSubmit={handleSubmit} />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: '' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });
    fireEvent.click(screen.getByText('REGISTER'));
    expect(screen.getByPlaceholderText('Enter Your Password').validity.valid).toBe(false);
    expect(screen.getByPlaceholderText('Enter Your Password').validity.valueMissing).toBe(true);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('should not submit the form when the phone field is empty', () => {
    const handleSubmit = jest.fn();
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register onSubmit={handleSubmit} />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });
    fireEvent.click(screen.getByText('REGISTER'));
    expect(screen.getByPlaceholderText('Enter Your Phone').validity.valid).toBe(false);
    expect(screen.getByPlaceholderText('Enter Your Phone').validity.valueMissing).toBe(true);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('should not submit the form when the address field is empty', () => {
    const handleSubmit = jest.fn();
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register onSubmit={handleSubmit} />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });
    fireEvent.click(screen.getByText('REGISTER'));
    expect(screen.getByPlaceholderText('Enter Your Address').validity.valid).toBe(false);
    expect(screen.getByPlaceholderText('Enter Your Address').validity.valueMissing).toBe(true);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('should not submit the form when the DOB field is empty', () => {
    const handleSubmit = jest.fn();
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register onSubmit={handleSubmit} />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '' } });
    fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });
    fireEvent.click(screen.getByText('REGISTER'));
    expect(screen.getByPlaceholderText('Enter Your DOB').validity.valid).toBe(false);
    expect(screen.getByPlaceholderText('Enter Your DOB').validity.valueMissing).toBe(true);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('should not submit the form when the sports field is empty', () => {
    const handleSubmit = jest.fn();
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register onSubmit={handleSubmit} />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: '' } });
    fireEvent.click(screen.getByText('REGISTER'));
    expect(screen.getByPlaceholderText('What is Your Favorite sports').validity.valid).toBe(false);
    expect(screen.getByPlaceholderText('What is Your Favorite sports').validity.valueMissing).toBe(true);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('should register the user successfully and navigate to login', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

    fireEvent.click(screen.getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Register Successfully, please login');
    expect(mockedNavigate).toHaveBeenCalledWith('/login');
    expect(mockedNavigate).toHaveBeenCalledTimes(1);
  });

  // Actual message from API is "Already Register please login"
  it('should display error message on failed registration - duplicate user', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: false,
        message: 'User is already registered. Please login.'
      }
    });

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

    fireEvent.click(screen.getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('User is already registered. Please login.');
  });

  // API response mis-spelled "Errro in Registeration"
  it('should display error message on timeout from no database connection', async () => {
    axios.post.mockRejectedValueOnce({
      status: 500,
      statusText: 'Internal Server Error',
      data: {
        success: false,
        message: 'Error in Registeration'
      }
    });

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

    fireEvent.click(screen.getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('should have the password field hidden with (type="password")', async () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Enter Your Password')).toHaveAttribute('type', 'password');
  });
});
