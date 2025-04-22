 import EventForm, { action as eventFormAction } from "./EventForm"
import {render, screen, waitFor } from '@testing-library/react'
import {createMemoryRouter, RouterProvider, useNavigate, redirect} from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import EventsRootLayout from "../pages/EventsRoot"


const renderWithRouter = ({mockedAction= () => null}) => {
    const route = '/events/new'
    const routes = [{
        path: route,
        element: <EventForm method='post'/>,
        action: mockedAction
    },     {
        path: '/events',
        element: <EventsRootLayout/>,
      },]

    const router = createMemoryRouter(routes, {initialEntries: [route]})

    return render(<RouterProvider router={router}/>)
}

    jest.mock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: jest.fn(),
        // useActionData: jest.fn()
        //useNavigation: jest.fn()
     }))

describe ('EventForm component', () => {
    test ('renders input fields correctly', () => {
        renderWithRouter({})

        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/image/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    })
    test('allows typing into input fields', async () => {
        renderWithRouter({})

        const user = userEvent.setup()

        const titleElement = screen.getByLabelText(/title/i)
        const imageElement = screen.getByLabelText(/image/i)
        const dateElement = screen.getByLabelText(/date/i)
        const descriptionElement = screen.getByLabelText(/description/i)

        const testUrl = 'https://example.com/image.jpg';

        await user.type(titleElement, 'Event')
        await user.type(imageElement, testUrl)
        await user.type(dateElement, '2025-04-22')
        await user.type(descriptionElement, 'this a description field')

        expect(titleElement).toHaveValue('Event')

        expect(imageElement).toHaveValue(testUrl);
        expect(imageElement.value).toMatch(/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i);

        expect(dateElement).toHaveValue('2025-04-22')
        expect(descriptionElement).toHaveValue('this a description field')
    })

    test('shows error messages for invalid inputs', async () => {
        // useActionData.mockReturnValue({
        //     errors: {title: 'Invalid title.', image: 'Invalid image.', date :'Invalid date.', description:'Invalid description.'} 
        // })
        const mockedData = {
            errors: {title: 'Invalid title.', image: 'Invalid image.', date :'Invalid date.', description:'Invalid description.'},
            message: 'Adding the event failed due to validation errors.'
        }
        renderWithRouter({mockedAction: () => mockedData})

        const user = userEvent.setup()
        await user.click(screen.getByText('Save'))

        expect(screen.getByText(/invalid title./i)).toBeInTheDocument();
        expect(screen.getByText(/invalid image./i)).toBeInTheDocument();
        expect(screen.getByText(/invalid date./i)).toBeInTheDocument();
        expect(screen.getByText(/invalid description./i)).toBeInTheDocument();
    })

    test('submits form data correctly', async () => {
        const user = userEvent.setup()

        const mockedAction = jest.fn(async () => {return null})
        renderWithRouter({mockedAction})

        // Fill form
        await user.type(screen.getByLabelText(/title/i), 'Sample Title');
        await user.type(screen.getByLabelText(/image/i), 'https://example.com/image.jpg');
        await user.type(screen.getByLabelText(/date/i), '2025-04-30');
        await user.type(screen.getByLabelText(/description/i), 'This is a sample description.');

        // Submit
        await user.click(screen.getByRole('button', { name: /save/i }));

        expect(mockedAction).toHaveBeenCalled()

        // Ensure the action was called
        const actionArg = mockedAction.mock.calls[0][0]
        const data = await actionArg.request.formData()

        //inspect the `FormData`
        expect(data.get('title')).toBe('Sample Title');
        expect(data.get('image')).toBe('https://example.com/image.jpg');
        expect(data.get('date')).toBe('2025-04-30');
        expect(data.get('description')).toBe('This is a sample description.');
    })

    test('render Submitting while the form is submitting', async () => {
        // const mockNavigation = { state: 'submitting' };
        // useNavigation.mockReturnValue(mockNavigation);

        let resolveSubmit;
        const slowAction = () => new Promise((resolve) => resolveSubmit = resolve);
        
        renderWithRouter({mockedAction: slowAction})

        const user = userEvent.setup()

        const buttonElement = screen.getByRole('button', {name: /save/i})
        await user.click(buttonElement)

        expect(buttonElement).toBeDisabled()
        expect(buttonElement).toHaveTextContent(/submitting.../i);

        resolveSubmit()
    })
    test('cancels form submissions', async () => {
        const navigate = jest.fn();
        useNavigate.mockReturnValue(navigate);
        
        renderWithRouter({})

        const user = userEvent.setup()

        const cancelButtonElement = screen.getByRole('button', {name:/cancel/i})
        await user.click(cancelButtonElement)

        expect(navigate).toHaveBeenCalledWith('..')
    })

    test('handles server error on form submission', async () => {
        const mockSubmit = jest.fn(() => {
          throw new Error('Could not save event');
        });
        renderWithRouter({mockedAction: mockSubmit})

        const user = userEvent.setup()
      
        const titleElement = screen.getByLabelText(/title/i);
        await userEvent.type(titleElement, 'Event Title');
      
        const submitButton = screen.getByRole('button', { name: /save/i });
        await userEvent.click(submitButton);
      
        // Check if error message is displayed when the submission fails
        expect(screen.getAllByText(/could not save event/i)).toHaveLength(2);
      });

    //   test('redirects to /events after successful form submission', async () => {
    //     const user = userEvent.setup();
      
    //     const testAction = jest.fn(async () => {
    //       return redirect('/events');
    //     });
      
      
    //     renderWithRouter({mockedAction: testAction});
      
    //     await user.type(screen.getByLabelText(/title/i), 'Test Event');
    //     await user.type(screen.getByLabelText(/image/i), 'https://example.com/image.jpg');
    //     await user.type(screen.getByLabelText(/date/i), '2025-04-30');
    //     await user.type(screen.getByLabelText(/description/i), 'Description test');
      
    //     await user.click(screen.getByRole('button', { name: /save/i }));

    //     // Wait for redirect and assert new screen
    //     expect(await screen.findByRole('link', {name:/all events/i})).toBeInTheDocument();
    //   });
})


// // Mock auth token util
// jest.mock('../util/auth', () => ({
//     getAuthToken: () => 'mock-token',
//   }));
  
//   beforeEach(() => {
//     global.fetch = jest.fn(() =>
//       Promise.resolve({
//         ok: true,
//         status: 200,
//         json: () => Promise.resolve({}),
//       })
//     );
//   });
  
//   afterEach(() => {
//     jest.resetAllMocks();
//   });
  
//   test('submits form and redirects to /events', async () => {
//     const user = userEvent.setup();
  
//    renderWithRouter({mockedAction:eventFormAction})

  
//     // Fill out form
//     await user.type(screen.getByLabelText(/title/i), 'Sample Event');
//     await user.type(screen.getByLabelText(/image/i), 'https://example.com/image.jpg');
//     await user.type(screen.getByLabelText(/date/i), '2025-04-30');
//     await user.type(screen.getByLabelText(/description/i), 'Some description');
  
//     // Submit
//     await user.click(screen.getByRole('button', { name: /save/i }));
  
//     // Expect redirect to /events
//     await waitFor(() => {
//       expect(screen.getByText('Events Page')).toBeInTheDocument();
//     });
  
//     // Optionally, verify fetch was called correctly
//     expect(fetch).toHaveBeenCalledWith(
//       'http://localhost:8080/events',
//       expect.objectContaining({
//         method: 'POST',
//         headers: expect.objectContaining({
//           Authorization: 'Bearer mock-token',
//         }),
//       })
//     );
//   });