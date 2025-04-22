import {screen, render} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthForm from './AuthForm';
import RootLayout from '../pages/Root'
import AuthenticationPage from '../pages/Authentication'
import { createMemoryRouter, RouterProvider } from 'react-router-dom';


const  renderWithRouter= ({ route = '/auth?mode=login', mockedAction = () => null }) => {
    const routes = [
      {
            path: 'auth', 
            element: <AuthenticationPage />, 
            action: mockedAction 
      },
    ];
  
    const router = createMemoryRouter(routes, { initialEntries: [route], future: { v7_startTransition: true }});
  
    return render(<RouterProvider router={router} />);
  }

  const mockedAction = async ({request}) => {
    const formData = await request.formData();
    const email = formData.get('email');
    const password = formData.get('password');
  
    const errors = {};
    if (!email.includes('@')) errors.email = 'Invalid email';
    if (!password || password.length < 6) errors.password = 'Password too short';

    if (Object.keys(errors).length > 0) {
        return {
          message: 'Validation failed',
          errors,
        };
      }
    
      return { message: 'Success' };
  }

describe('AuthForm component', () => {
    test('renders login mode with correct heading and button',() => {
        renderWithRouter({ route: '/auth?mode=login' });
 
        const headingElement = screen.getByRole('heading', { name: /log in/i })
        expect(headingElement).toBeInTheDocument();

        const buttonElement = screen.getByRole('link', { name: /create new user/i })
        expect(buttonElement).toBeInTheDocument();
    })

    test('renders signup mode with correct heading and button', () => {
        renderWithRouter({ route: '/auth?mode=signup' });

        const headingElement = screen.getByRole('heading', { name: /create a new user/i })
        expect(headingElement).toBeInTheDocument();

        const buttonElement = screen.getByRole('link', { name: /login/i })
        expect(buttonElement).toBeInTheDocument();

    })

    test('allows typing into the input fields', async () => {
        await renderWithRouter({})

        const user = userEvent.setup()

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        
        await user.type(emailInput, 'ikram@example.com');
        await user.type(passwordInput, 'mypassword');

        expect(emailInput).toHaveValue('ikram@example.com');
        expect(passwordInput).toHaveValue('mypassword');
    })

    test('submits form and receives validation errors from action', async () => {
        const user = userEvent.setup();

        renderWithRouter({mockedAction})
      
        // Fill in invalid values
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        await user.clear(emailInput);
        await user.type(emailInput, 'invalidemail');
      
        await user.clear(passwordInput);
        await user.type(passwordInput, '123');
      
        // Submit the form
        await user.click(screen.getByRole('button', { name: /save/i }));
      
        // Wait for action to finish and data to be rendered
        expect(await screen.getByText(/invalid email/i)).toBeInTheDocument();
        expect(screen.getByText(/password too short/i)).toBeInTheDocument();
        expect(screen.getByText(/validation failed/i)).toBeInTheDocument();
      });

      test('displays error messages from useActionData', async () => {
        const actionData = {
          errors: {
            email: 'Invalid email',
            password: 'Invalid password',
          },
          message: 'Validation failed',
        };
      
        renderWithRouter({ mockedAction: () => actionData });

        const user = userEvent.setup()
        await user.click(screen.getByText('Save'));
      
        // Check if the error messages appear as list items
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
        expect(screen.getByText(/invalid password/i)).toBeInTheDocument();
        expect(screen.getByText(/validation failed/i)).toBeInTheDocument();
      });

      test('shows "Submitting..." while submitting', async () => {
        let resolveSubmit;
        const slowAction = () =>
          new Promise((resolve) => {
            resolveSubmit = resolve;
          });

        renderWithRouter({mockedAction: slowAction})
      
        const user = userEvent.setup();
        const button = screen.getByRole('button', { name: /save/i });
      
        // Submit form
        await user.click(button);
      
        // Button should now show "Submitting..." and be disabled
        expect(button).toBeDisabled();
        expect(button).toHaveTextContent(/submitting/i);
      
        // Resolve the submission to finish test
        resolveSubmit();
      });

 })

 