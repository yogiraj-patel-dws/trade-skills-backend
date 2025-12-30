# Trade Skills Backend - API Documentation

## 🚀 Quick Start

### Environment Setup
```bash
# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Setup database
npm run db:generate
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

### Testing
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:payment    # Payment flow tests
npm run test:meet      # 100ms meet flow tests
npm run test:integration # Complete integration tests

# Run with coverage
npm run test:coverage

# Setup test database
npm run db:test:setup
```

## 🔐 Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "role": "USER"
    },
    "token": "jwt_token_here"
  }
}
```

## 💳 Payment Flow

### 1. Get Available Packages
```http
GET /api/payments/packages
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "pkg_123",
      "name": "Starter Pack",
      "credits": 100,
      "price": 99.99,
      "currency": "INR"
    }
  ]
}
```

### 2. Create Payment Order
```http
POST /api/payments/create-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "packageId": "pkg_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "pay_123",
      "status": "PENDING",
      "amount": 99.99
    },
    "razorpayOrder": {
      "id": "order_razorpay_123",
      "amount": 9999,
      "currency": "INR"
    }
  }
}
```

### 3. Verify Payment
```http
POST /api/payments/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpay_order_id": "order_razorpay_123",
  "razorpay_payment_id": "pay_razorpay_456",
  "razorpay_signature": "signature_hash"
}
```

### 4. Payment History
```http
GET /api/payments/history?status=COMPLETED&limit=10
Authorization: Bearer <token>
```

## 🎥 100ms Meet Flow

### 1. Create Session
```http
POST /api/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "JavaScript Fundamentals",
  "description": "Learn JS basics",
  "skillId": "skill_123",
  "sessionType": "ONE_ON_ONE",
  "creditCost": 50,
  "scheduledAt": "2024-01-15T10:00:00Z",
  "duration": 60
}
```

### 2. Join Session (Participant)
```http
POST /api/sessions/{sessionId}/join
Authorization: Bearer <token>
```

### 3. Create Meeting Room (Host Only)
```http
POST /api/meet/create-room
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": "session_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roomId": "room_hms_123",
    "meetingLink": "https://tradeskills.app.100ms.live/meeting/room_hms_123",
    "roomConfig": {
      "roomId": "room_hms_123",
      "roomName": "tradeskills-session123",
      "templateId": "template_123"
    }
  }
}
```

### 4. Join Meeting
```http
GET /api/meet/join/{sessionId}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authToken": "hms_auth_token_123",
    "roomId": "room_hms_123",
    "meetingLink": "https://tradeskills.app.100ms.live/meeting/room_hms_123",
    "isHost": false,
    "userInfo": {
      "userId": "user_123",
      "name": "John Doe",
      "role": "guest"
    }
  }
}
```

### 5. Start Session (Host Only)
```http
POST /api/meet/start/{sessionId}
Authorization: Bearer <token>
```

### 6. Record Attendance
```http
POST /api/meet/attendance/{sessionId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "join"  // or "leave"
}
```

### 7. End Session (Host Only)
```http
POST /api/meet/end/{sessionId}
Authorization: Bearer <token>
```

### 8. Get Session Statistics
```http
GET /api/meet/stats/{sessionId}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_123",
    "title": "JavaScript Fundamentals",
    "status": "COMPLETED",
    "scheduledDuration": 60,
    "actualDuration": 58,
    "participantCount": 1,
    "participants": [
      {
        "name": "John Doe",
        "joinedAt": "2024-01-15T10:02:00Z",
        "leftAt": "2024-01-15T11:00:00Z",
        "duration": 58
      }
    ]
  }
}
```

### 9. Get Recordings
```http
GET /api/meet/recordings/{sessionId}
Authorization: Bearer <token>
```

## 💰 Wallet Management

### Get Wallet Balance
```http
GET /api/wallet
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "availableCredits": 150,
    "lockedCredits": 50,
    "totalEarned": 200,
    "totalSpent": 100
  }
}
```

### Get Transaction History
```http
GET /api/wallet/transactions?type=SESSION_PAYMENT&limit=20
Authorization: Bearer <token>
```

### Lock Credits for Session
```http
POST /api/wallet/lock-credits
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50,
  "sessionId": "session_123",
  "reason": "Session booking"
}
```

## 🎯 Complete Integration Flow

### Scenario: User purchases credits and attends a session

1. **Purchase Credits**
   ```bash
   # Get packages
   curl -X GET http://localhost:3000/api/payments/packages
   
   # Create order
   curl -X POST http://localhost:3000/api/payments/create-order \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"packageId": "pkg_123"}'
   
   # Verify payment (after Razorpay payment)
   curl -X POST http://localhost:3000/api/payments/verify \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "razorpay_order_id": "order_123",
       "razorpay_payment_id": "pay_456",
       "razorpay_signature": "signature_hash"
     }'
   ```

2. **Join Session**
   ```bash
   # Find available sessions
   curl -X GET http://localhost:3000/api/sessions/public \
     -H "Authorization: Bearer $TOKEN"
   
   # Join session
   curl -X POST http://localhost:3000/api/sessions/session_123/join \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **Attend Meeting**
   ```bash
   # Get meeting access
   curl -X GET http://localhost:3000/api/meet/join/session_123 \
     -H "Authorization: Bearer $TOKEN"
   
   # Record attendance
   curl -X POST http://localhost:3000/api/meet/attendance/session_123 \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"action": "join"}'
   ```

## 🔧 Environment Variables

### Required for Payment Testing
```env
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### Required for 100ms Testing
```env
HMS_ACCESS_KEY=your_100ms_access_key
HMS_SECRET=your_100ms_secret
HMS_TEMPLATE_ID=your_template_id
```

## 🧪 Testing Credentials

### Test Razorpay Keys
```env
RAZORPAY_KEY_ID=rzp_test_1234567890
RAZORPAY_KEY_SECRET=test_secret_key
```

### Test 100ms Configuration
```env
HMS_ACCESS_KEY=test_access_key
HMS_SECRET=test_secret
HMS_TEMPLATE_ID=test_template_id
```

## 📊 Error Handling

### Common Error Responses

**Insufficient Credits:**
```json
{
  "success": false,
  "message": "Insufficient credits. Required: 50, Available: 30",
  "statusCode": 400
}
```

**Invalid Payment Signature:**
```json
{
  "success": false,
  "message": "Invalid payment signature",
  "statusCode": 400
}
```

**Meeting Room Creation Failed:**
```json
{
  "success": false,
  "message": "Failed to create meeting room",
  "statusCode": 400
}
```

**Unauthorized Access:**
```json
{
  "success": false,
  "message": "Not authorized to join this meeting",
  "statusCode": 400
}
```

## 🚀 Production Deployment

### Environment Setup
1. Set production environment variables
2. Configure production database
3. Set up SSL certificates
4. Configure reverse proxy (nginx)

### Health Check
```http
GET /health
```

### API Documentation
Visit `/api-docs` for interactive Swagger documentation.

## 📝 Rate Limits

- **General API**: 100 requests per 15 minutes per IP
- **Payment endpoints**: Additional validation and monitoring
- **Meet endpoints**: Session-based rate limiting

## 🔒 Security Features

- JWT token authentication
- Rate limiting per IP
- Input validation with Joi
- SQL injection prevention with Prisma
- CORS configuration
- Helmet security headers
- Password hashing with bcrypt
- Role-based access control