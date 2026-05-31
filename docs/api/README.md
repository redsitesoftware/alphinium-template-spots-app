# API Documentation

**Alphinium REST API Reference**

## Overview

The Alphinium API is powered by Strapi CMS and provides RESTful endpoints for content management and user operations.

**Base URL:** `http://localhost:1337` (development) or `https://api.alphinium.com` (production)

## Authentication

All API requests require an API token sent in the Authorization header:

```bash
Authorization: Bearer YOUR_API_TOKEN
```

**Get API Token:**
1. Login to Strapi admin panel
2. Settings → API Tokens
3. Create new API Token
4. Copy token for use in requests

## Common Headers

```bash
Content-Type: application/json
Authorization: Bearer YOUR_API_TOKEN
```

## Articles API

### List Articles

**Endpoint:** `GET /api/articles`

**Query Parameters:**
- `pagination[page]` - Page number (default: 1)
- `pagination[pageSize]` - Items per page (default: 25)
- `sort` - Sort field (e.g., `createdAt:desc`)
- `filters[title][$contains]` - Filter by title

**Example Request:**
```bash
curl -X GET http://localhost:1337/api/articles \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "title": "My First Article",
        "content": "Article content here",
        "createdAt": "2026-03-01T09:00:00.000Z",
        "updatedAt": "2026-03-01T09:00:00.000Z"
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

### Get Single Article

**Endpoint:** `GET /api/articles/:id`

**Example Request:**
```bash
curl -X GET http://localhost:1337/api/articles/1 \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**Example Response:**
```json
{
  "data": {
    "id": 1,
    "attributes": {
      "title": "My First Article",
      "content": "Article content here",
      "createdAt": "2026-03-01T09:00:00.000Z",
      "updatedAt": "2026-03-01T09:00:00.000Z"
    }
  }
}
```

### Create Article

**Endpoint:** `POST /api/articles`

**Request Body:**
```json
{
  "data": {
    "title": "New Article",
    "content": "Article content"
  }
}
```

**Example Request:**
```bash
curl -X POST http://localhost:1337/api/articles \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "title": "New Article",
      "content": "Article content"
    }
  }'
```

**Example Response:**
```json
{
  "data": {
    "id": 2,
    "attributes": {
      "title": "New Article",
      "content": "Article content",
      "createdAt": "2026-03-01T09:05:00.000Z",
      "updatedAt": "2026-03-01T09:05:00.000Z"
    }
  }
}
```

### Update Article

**Endpoint:** `PUT /api/articles/:id`

**Request Body:**
```json
{
  "data": {
    "title": "Updated Title",
    "content": "Updated content"
  }
}
```

**Example Request:**
```bash
curl -X PUT http://localhost:1337/api/articles/1 \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "title": "Updated Title",
      "content": "Updated content"
    }
  }'
```

### Delete Article

**Endpoint:** `DELETE /api/articles/:id`

**Example Request:**
```bash
curl -X DELETE http://localhost:1337/api/articles/1 \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**Example Response:**
```json
{
  "data": {
    "id": 1,
    "attributes": {
      "title": "My First Article",
      "content": "Article content",
      "createdAt": "2026-03-01T09:00:00.000Z",
      "updatedAt": "2026-03-01T09:00:00.000Z"
    }
  }
}
```

## Authentication API

### Register User

**Endpoint:** `POST /api/auth/local/register`

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Example Response:**
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

### Login

**Endpoint:** `POST /api/auth/local`

**Request Body:**
```json
{
  "identifier": "john@example.com",
  "password": "SecurePassword123"
}
```

**Example Response:**
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

### Get Current User

**Endpoint:** `GET /api/users/me`

**Headers:**
```bash
Authorization: Bearer JWT_TOKEN
```

**Example Response:**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "provider": "local",
  "confirmed": true,
  "blocked": false,
  "createdAt": "2026-03-01T09:00:00.000Z",
  "updatedAt": "2026-03-01T09:00:00.000Z"
}
```

## Subscriptions API

### Create Checkout Session

**Endpoint:** `POST /api/subscriptions/create-checkout-session`

**Request Body:**
```json
{
  "priceId": "price_1234567890",
  "userId": "user_123"
}
```

**Example Response:**
```json
{
  "sessionId": "cs_test_1234567890",
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_1234567890"
}
```

### Get Subscription Status

**Endpoint:** `GET /api/subscriptions/:userId`

**Example Response:**
```json
{
  "subscriptionId": "sub_1234567890",
  "status": "active",
  "currentPeriodEnd": "2026-04-01T09:00:00.000Z",
  "plan": {
    "name": "Pro Plan",
    "amount": 2900,
    "interval": "month"
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "status": 400,
    "name": "ValidationError",
    "message": "Missing required fields",
    "details": {}
  }
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

**Development:** No rate limits

**Production:** 
- 100 requests per minute per IP
- 1000 requests per hour per token

## Pagination

All list endpoints support pagination:

```bash
GET /api/articles?pagination[page]=1&pagination[pageSize]=10
```

**Response includes:**
```json
{
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "pageCount": 5,
      "total": 47
    }
  }
}
```

## Filtering & Sorting

### Filtering
```bash
# Contains
GET /api/articles?filters[title][$contains]=react

# Equals
GET /api/articles?filters[status][$eq]=published

# Greater than
GET /api/articles?filters[views][$gt]=100
```

### Sorting
```bash
# Ascending
GET /api/articles?sort=title

# Descending
GET /api/articles?sort=createdAt:desc

# Multiple fields
GET /api/articles?sort[0]=title&sort[1]=createdAt:desc
```

## Additional Resources

- [Strapi REST API Docs](https://docs.strapi.io/dev-docs/api/rest)
- [Stripe API Docs](https://stripe.com/docs/api)
- [React Native Integration](../react-native/README.md)

---

**Last Updated:** March 1, 2026  
**Questions?** Open an issue on GitHub
