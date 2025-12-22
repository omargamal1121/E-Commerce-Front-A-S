# Fashion E-Commerce API Integration

## Overview

This document describes the integration of the Fashion-main backend APIs with the frontend application. The integration includes authentication (login, register, logout), token refresh, and cart operations.

## API Endpoints

### Authentication

#### Login
- **Endpoint**: `/api/Account/login`
- **Method**: POST
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response Format**:
  ```json
  {
    "statuscode": 200,
    "responseBody": {
      "message": "Login successful",
      "data": {
        "userid": "user-id",
        "token": "jwt-token",
        "refreshToken": "refresh-token"
      }
    }
  }
  ```

#### Register
- **Endpoint**: `/api/Account/register`
- **Method**: POST
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "userName": "johndoe",
    "phoneNumber": "01234567890",
    "age": 25,
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }
  ```
- **Response Format**:
  ```json
  {
    "statuscode": 201,
    "responseBody": {
      "message": "User registered successfully"
    }
  }
  ```

#### Logout
- **Endpoint**: `/api/Account/Logout`
- **Method**: POST
- **Headers**: Authorization: Bearer {token}
- **Response Format**:
  ```json
  {
    "statuscode": 200,
    "responseBody": {
      "message": "Logged out successfully"
    }
  }
  ```

#### Refresh Token
- **Endpoint**: `/api/Account/refresh-token`
- **Method**: POST
- **Request Body**:
  ```json
  {
    "refreshToken": "refresh-token-value"
  }
  ```
- **Response Format**:
  ```json
  {
    "statuscode": 200,
    "responseBody": {
      "message": "Token refreshed successfully",
      "data": {
        "userid": "user-id",
        "token": "new-jwt-token",
        "refreshToken": "new-refresh-token"
      }
    }
  }
  ```

## Implementation Details

### Authentication Flow

1. **Login**:
   - User submits email and password
   - On successful login, the token, refresh token, and user ID are stored in localStorage
   - The token is also set in the ShopContext for use in authenticated requests

2. **Registration**:
   - User submits registration form with all required fields
   - On successful registration, user is redirected to the login page

3. **Logout**:
   - Sends a logout request to the server
   - Clears all authentication data from localStorage
   - Redirects to the login page

4. **Token Refresh**:
   - When an API request returns a 401 Unauthorized error, the system attempts to refresh the token
   - If successful, the original request is retried with the new token
   - If unsuccessful, the user is redirected to the login page

### API Utilities

The application includes utility functions for making authenticated API requests:

- `fetchWithTokenRefresh`: Makes an API request and automatically handles token refresh if needed
- `getAuthHeaders`: Prepares headers with the authentication token

## Error Handling

All API requests include proper error handling:

1. Network errors are caught and displayed to the user
2. API errors (non-200 responses) are parsed and displayed from the response body
3. Authentication errors trigger the token refresh flow

## Local Storage

The following items are stored in localStorage:

- `token`: JWT token for authentication
- `refreshToken`: Token used to obtain a new JWT when it expires
- `userId`: The user's ID

## Future Improvements

1. Implement account management features (change password, update profile)
2. Add support for social login
3. Implement more robust error handling and retry mechanisms
4. Add support for persistent shopping cart across sessions