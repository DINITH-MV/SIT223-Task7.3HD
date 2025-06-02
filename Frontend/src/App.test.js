import { render, screen } from "@testing-library/react";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

test("renders login page correctly", () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );

  // Use a more specific query for the heading
  const headingElement = screen.getByRole("heading", {
    level: 1,
    name: /Login/i,
  });
  expect(headingElement).toBeInTheDocument();

  // These queries are unique so they remain the same
  const emailInput = screen.getByPlaceholderText(/Enter your email.../i);
  expect(emailInput).toBeInTheDocument();

  const passwordInput = screen.getByPlaceholderText(/Enter your password.../i);
  expect(passwordInput).toBeInTheDocument();

  // Use a more specific query for the button
  const loginButton = screen.getByRole("button", { name: /Login/i });
  expect(loginButton).toBeInTheDocument();

  // You can also check for the signup link
  const signupLink = screen.getByRole("link", { name: /Signup/i });
  expect(signupLink).toBeInTheDocument();
});
