import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve({
    ok: false,
    json: () => Promise.resolve([])
  }));
});

afterEach(() => jest.restoreAllMocks());

test('renders the student helpdesk home page', async () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /student helpdesk/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /events/i })).toBeInTheDocument();
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
});
