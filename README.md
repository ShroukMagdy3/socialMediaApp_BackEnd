# Social Media App Backend

A full-featured **Social Media Application Backend** built with **Node.js, Express, TypeScript, and MongoDB**. This project provides secure authentication, user management, friendships, chats, and advanced features like **Two-Factor Authentication (2FA)**.

---

## 🚀 Project Overview

This backend powers a social media platform where users can:

* Create accounts and authenticate securely
* Manage profiles and account settings
* Send and manage friend requests
* Chat with friends in real time (API-ready)
* Enable Two-Factor Authentication (2FA)
* Administer users with role-based authorization

The project follows **clean architecture** principles with separation of concerns between routes, services, middleware, and database models.

---

## 🛠️ Tech Stack

* **Node.js**
* **Express.js**
* **TypeScript**
* **MongoDB & Mongoose**
* **JWT Authentication (Access & Refresh Tokens)**
* **Role-Based Authorization**
* **Docker & Docker Compose**

---

##  Project Structure

```
socialMediaApp_BackEnd/
│── DB/
│   └── models/
│       └── users.model.ts
│       └── posts.model.ts
│       └── comments.model.ts
│       └── chats.model.ts
│
│── middleware/
│   ├── authentication.ts
│   ├── authorization.ts
│   ├── validation.ts
│   └── multer.cloud.ts
│
│── modules/
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.validator.ts
│   ├── posts/
│   │   ├── posts.service.ts
│   │   ├── posts.validator.ts
│   │   └── posts.controller.ts
│   ├── comments/
│   │   ├── comments.service.ts
│   │   ├── comment.validator.ts
│   │   └── comments.controller.ts
│   └── chats/
│       ├── chat.rest.service.ts
│       ├── chat.validation.ts
│       └── chat.controller.ts
│
│── utilities/
│   └── token.ts
│
│── app.ts
│── server.ts
│── package.json
│── tsconfig.json
│── .env
│── Dockerfile
│── docker-compose.yml
```

##  Authentication & Security

* **JWT-based Authentication** (Access & Refresh tokens)
* **Email confirmation flow**
* **Password reset & forget password**
* **Two-Factor Authentication (2FA)**
* **Role-based access control** (User, Admin, Super Admin)

---

##  User Routes Documentation

Base Route:

```
/api/users
```

###  Authentication

| Method | Endpoint          | Description               |
| ------ | ----------------- | ------------------------- |
| POST   | `/signUp`         | Register a new user       |
| PATCH  | `/confirmEmail`   | Confirm user email        |
| POST   | `/signIn`         | User login                |
| POST   | `/loginWithGmail` | Login using Google        |
| POST   | `/logOut`         | Logout user               |
| GET    | `/refreshToken`   | Generate new access token |

---

###  Profile & Account

| Method | Endpoint       | Description                |
| ------ | -------------- | -------------------------- |
| GET    | `/getProfile`  | Get logged-in user profile |
| PUT    | `/updateInfo`  | Update user profile info   |
| PATCH  | `/updatePass`  | Update password            |
| PATCH  | `/updateEmail` | Update email               |
| POST   | `/upload`      | Upload profile image       |

---

###  Account Control

| Method | Endpoint                   | Description              |
| ------ | -------------------------- | ------------------------ |
| PATCH  | `/forgetPass`              | Request password reset   |
| PATCH  | `/resetPass`               | Reset password           |
| DELETE | `/freezeAccount/:userId`   | Freeze account           |
| DELETE | `/unFreezeAccount/:userId` | Unfreeze account (Admin) |

---

###  Friends & Requests

| Method | Endpoint                     | Description           |
| ------ | ---------------------------- | --------------------- |
| POST   | `/sendRequest/:userId`       | Send friend request   |
| PATCH  | `/acceptRequest/:requestId`  | Accept friend request |
| DELETE | `/friend-request/:requestId` | Cancel friend request |
| DELETE | `/unfriend/:friendId`        | Remove friend         |

---

###  Block System

| Method | Endpoint                  | Description  |
| ------ | ------------------------- | ------------ |
| PATCH  | `/block/:blockedUserId`   | Block user   |
| PATCH  | `/unblock/:blockedUserId` | Unblock user |

---

###  Admin Dashboard

| Method | Endpoint              | Description          |
| ------ | --------------------- | -------------------- |
| GET    | `/dasBoard`           | View admin dashboard |
| PATCH  | `/updateRole/:userId` | Update user role     |

Roles allowed: `Admin`, `SuperAdmin`

---

###  Two-Factor Authentication (2FA)

| Method | Endpoint            | Description            |
| ------ | ------------------- | ---------------------- |
| POST   | `/enable-2fa`       | Enable 2FA             |
| POST   | `/confirmEnable2FA` | Confirm 2FA setup      |
| POST   | `/confirmLogin`     | Confirm login with 2FA |

---

### Chats

Base Route:

```
/api/users/:userId/chat
```

| Method | Endpoint          | Description                                 |
| ------ | ----------------- | ------------------------------------------- |
| GET    | `/`               | Get private chat with user                  |
| POST   | `/createGroup`    | Create a group chat (with image attachment) |
| GET    | `/group/:groupId` | Get group chat details                      |

---

### Posts

Base Route:

```
/api/posts
```

| Method | Endpoint                | Description                     |
| ------ | ----------------------- | ------------------------------- |
| POST   | `/createPost`           | Create a new post (with images) |
| PATCH  | `/react/:postId`        | Like or unlike a post           |
| PATCH  | `/update/:postId`       | Update a post                   |
| GET    | `/getAllPosts`          | Get all posts                   |
| GET    | `/getPost/:postId`      | Get single post                 |
| PUT    | `/freezePost/:postId`   | Freeze a post                   |
| PUT    | `/unfreezePost/:postId` | Unfreeze a post                 |
| DELETE | `/delete/:postId`       | Delete a post                   |

---

### Comments

Base Route:

```
/api/posts/:postId/comment
```

| Method | Endpoint                 | Description                         |
| ------ | ------------------------ | ----------------------------------- |
| POST   | `/`                      | Create a comment (with attachments) |
| GET    | `/getComment/:commentId` | Get a comment                       |
| PUT    | `/update/:commentId`     | Update a comment                    |
| DELETE | `/delete/:commentId`     | Delete a comment                    |

---

##  Running the Project

### Install dependencies

```bash
npm install
```

### Environment variables

Create `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
```

### Run in development

```bash
npm run dev
```

### Run with Docker

```bash
docker-compose up --build
```

---

##  License

This project is licensed under the **MIT License**.

---

##  Author

**Shrouk Magdy**

---

⭐ If you like this project, feel free to give it a star on GitHub!
