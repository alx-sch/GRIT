import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  // Mock the user profile endpoint for all tests in this group
  test.beforeEach(async ({ page }) => {
    await page.route('/api/users/me', async (route) => {
      const json = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        avatarKey: null,
      };
      await route.fulfill({ json });
    });
  });

  test('should allow user to login', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();

    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password');

    await page.getByRole('button', { name: 'Login' }).click();

    // URL param is stripped by useRouteToasts, so we check for the toast
    // Wait for the toast to appear or for the URL to change first to ensure stability
    await expect(page).toHaveURL('/');
    await expect(page.getByText('You are logged in')).toBeVisible();

    // Verify user is visible in Navbar
    // The avatar fallback uses the first letter of the name (T for Test User)
    await expect(page.getByRole('button', { name: 'Test User' })).toBeVisible();
  });

  test('should allow user to register', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible();

    await page.getByLabel('Name').fill('John Doe');
    await page.getByLabel('Email').fill('newuser@example.com');
    await page.getByLabel('Password').fill('Password123!');

    await page.getByRole('button', { name: 'Create account' }).click();

    // URL param is stripped by useRouteToasts (assuming we updated it to use signup_success)
    await expect(page.getByText('Account created')).toBeVisible();
    await expect(page).toHaveURL('/');
  });

  test('should navigate between login and register pages', async ({ page }) => {
    await page.goto('/login');
    // Use more specific selector for the link in the footer
    await page.getByRole('main').getByRole('link', { name: 'Register' }).click();
    await expect(page).toHaveURL('/register');

    // Login button is now in the Navbar as well, so we need to be specific or use the footer link
    await page.getByRole('main').getByRole('link', { name: 'Login' }).click();
    await expect(page).toHaveURL('/login');
  });

  test('should show error on invalid login', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');

    await page.getByRole('button', { name: 'Login' }).click();

    // Check for toast or error message. The code uses toast.error('Login Failed')
    await expect(page.getByText('Login Failed')).toBeVisible();
  });
});
