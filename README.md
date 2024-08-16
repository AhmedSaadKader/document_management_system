# Document Management System (DMS)

## Overview

The Document Management System (DMS) is a web application built using the MERN stack (MongoDB, Express.js, React.js, Node.js). The application integrates both relational and NoSQL databases to manage user authentication, workspace management, document handling, and more.

## Features

- **User Authentication**: Secure user registration and login using a relational database (PostgreSQL/MySQL) with JWT-based session management.
- **Workspace Management**: Users can create and manage workspaces, each with its unique directory structure stored in MongoDB.
- **Document Upload**: Upload documents to a cloud storage system, with metadata saved in MongoDB.
- **Document Download**: Download documents securely, with proper authentication and authorization checks.
- **Document Preview**: Preview documents as Base64-encoded data.
- **Document Deletion**: Implement soft deletion of documents, ensuring data integrity.
- **Document Listing**: List documents based on workspaces and user profiles, with filtering and sorting options.
- **Document Search**: Search for documents by name or type using optimized MongoDB queries.
- **Additional Features**:
  - Document versioning
  - Document tagging
  - Document profiling
  - Granular access control

## Technology Stack

- **Frontend**: React.js
- **Backend**: Node.js, Express.js
- **Databases**:
  - **Relational Database**: PostgreSQL or MySQL (for user authentication)
  - **NoSQL Database**: MongoDB (for workspace and document management)
- **Storage**: AWS S3 or other cloud storage services for document storage
- **Security**: JWT for session management, bcrypt for password hashing
- **Testing**: Jasmine

## Installation

To set up the project locally, follow these steps:

### Prerequisites

- Node.js (v14.x or higher)
- npm or yarn
- PostgreSQL or MySQL
- MongoDB
- AWS account (if using AWS S3 for document storage)

### Clone the Repository

```bash
git clone https://github.com/AhmedSaadKader/document_management_system.git
cd document-management-system
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file with the following:

```plaintext
PORT=5000
DATABASE_URL=your_relational_database_url
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=your_aws_region
S3_BUCKET_NAME=your_s3_bucket_name
```

### Run the Application

```bash
cd backend
npm run dev
```

### Testing

```bash
npm test
```

## Project Structure

```plaintext
document-management-system/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   ├── config/
│   ├── middleware/
│   └── tests/
├── .gitignore
├── README.md
├── Instructions.md
└── package.json
```

## Contribution Guidelines

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch for your feature/bugfix.
3. Commit your changes with a meaningful commit message.
4. Push your branch and create a Pull Request.

## Acknowledgments

- MERN stack for providing the foundational technologies.
- AWS for cloud storage solutions.
- [bcrypt](https://www.npmjs.com/package/bcrypt) for password hashing.
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) for handling JWT authentication.
