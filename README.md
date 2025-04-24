# BookNotFound 📚

BookNotFound is an intelligent documentation search and question-answering system that helps users find and interact with documentation more effectively. It uses natural language processing to understand questions and provide context-aware responses from your documentation.

## Features 🌟

- **Natural Language Question Answering**: Ask questions in plain English and get relevant answers
- **Context-Aware Responses**: Responses are generated considering the full context of your documentation
- **Confidence Scoring**: Each answer comes with a confidence score to indicate reliability
- **Interactive Feedback**: Users can provide feedback on answers and suggest improvements
- **Documentation Management**: Admin interface for managing and editing documentation
- **Markdown Support**: Full markdown support with live preview and diff editing
- **Suggestion System**: Users can suggest new documentation when no relevant content is found

## Getting Started 🚀

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- MongoDB

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/BookNotFound.git
cd BookNotFound
```

2. Install frontend dependencies:
```bash
cd book-not-found
npm install
```

3. Install backend dependencies:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

4. Set up environment variables:
   - Create `.env` in the backend directory
   - Create `.env` in the book-not-found directory

Example backend `.env`:
```
MONGODB_URI=mongodb://localhost:27017/booknotfound
JWT_SECRET=your_jwt_secret
```

Example frontend `.env`:
```
API_URL=http://localhost:5000
```

### Running the Application

1. Start the backend server:
```bash
cd backend
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
python app.py
```

2. Start the frontend development server:
```bash
cd book-not-found
npm run dev
```

The application will be available at:
- Frontend: http://localhost:4200
- Admin Panel: http://localhost:4200/admin
- Backend API: http://localhost:5000

## Usage 💡

### Asking Questions
1. Enter your question in natural language
2. The system will search through documentation and provide relevant answers
3. View confidence scores and source documents
4. Provide feedback on answers

### Managing Documentation
1. Access the admin panel at `/admin`
2. Create, edit, or delete documentation
3. View and manage user feedback and suggestions
4. Monitor system performance and usage

### Contributing to Documentation
1. Use the suggestion system when relevant documentation isn't found
2. Provide feedback on existing documentation
3. Suggest improvements through the built-in editor

## Architecture 🏗️

- **Frontend**: Angular with TailwindCSS and DaisyUI
- **Backend**: Python with FastAPI
- **Database**: MongoDB
- **Search**: Semantic search with embeddings
- **Editor**: Monaco Editor with diff support

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- Built with [Angular](https://angular.io/)
- Styled with [TailwindCSS](https://tailwindcss.com/) and [DaisyUI](https://daisyui.com/)
- Editor powered by [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- Markdown rendering by [ngx-markdown](https://github.com/jfcere/ngx-markdown) 