# DeepSeek OCR Terminal

A retro Matrix-themed Next.js application for testing your vLLM-compatible DeepSeek OCR endpoint.

## Features

- 🎨 **Retro Matrix UI** - Cool terminal aesthetic with CRT scanline effects and green glow
- 📸 **Multi-Image Upload** - Drag-and-drop or click to upload multiple images
- 🖼️ **Image Preview Grid** - View and manage uploaded images before processing
- 💬 **Dual Prompts** - Configure system behavior and user instructions separately
- ⚡ **Real-time Processing** - Connected to deployed DeepSeek OCR API on AWS
- 📋 **Markdown Output** - Clean, formatted results with copy-to-clipboard functionality
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling with custom Matrix theme
- **React 19** - Latest React features

## Project Structure

```
deepseek-app/
├── app/                 # Next.js App Router directory (routes)
│   ├── ocr/
│   │   └── page.tsx    # Main OCR testing page
│   ├── api/
│   │   └── ocr/
│   │       └── route.ts # Mock API endpoint
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles with Matrix theme
├── components/
│   ├── ImageUpload.tsx    # Multi-image upload component
│   ├── PromptInput.tsx    # Text input component
│   └── ResultDisplay.tsx  # Results display component
├── lib/
│   └── types.ts        # TypeScript type definitions
└── public/             # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd deepseek-app
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Home Page** - Visit the landing page to see system capabilities
2. **Access OCR Terminal** - Click the button to navigate to `/ocr`
3. **Upload Images** - Drag & drop or click to upload images (JPEG, PNG, WEBP)
4. **Configure Prompts**:
   - System Prompt (optional): Configure OCR behavior
   - User Prompt (required): Specify what you want to extract
5. **Execute** - Click `[EXECUTE_OCR]` to process
6. **View Results** - See formatted output with processing time
7. **Copy Output** - Use the copy button to save results

## API Connection

The application is now connected to a deployed DeepSeek OCR API running on AWS EC2!

### Current Configuration

- **API Endpoint**: `http://52.54.253.30:8000`
- **Model**: `deepseek-ai/DeepSeek-OCR`
- **Status**: Deployed and ready to use

### Changing the API Endpoint

If the API IP changes (due to instance restart) or you want to use a different endpoint:

1. Create a `.env.local` file in the project root:

```bash
# .env.local
DEEPSEEK_API_ENDPOINT=http://YOUR-IP:8000
```

2. Get the current endpoint from the infrastructure:

```bash
cd ../deepseek-infra/terraform
terraform output api_endpoint
```

3. Restart the Next.js development server

### Important Note on Dynamic IPs

The deployed API uses a dynamic IP address. If you stop and restart the EC2 instance, the IP will change. You'll need to:
- Update the `DEEPSEEK_API_ENDPOINT` environment variable
- Or enable Elastic IP in the Terraform configuration for a static address

## Customization

### Theme Colors

Edit `app/globals.css` to customize the Matrix theme:

```css
:root {
  --matrix-green: #00ff41;      /* Primary green */
  --matrix-dark-green: #003b00;  /* Dark green background */
  --matrix-cyan: #00ffff;        /* Accent cyan */
}
```

### Upload Limits

Modify `components/ImageUpload.tsx` to change file size limits:

```typescript
const maxSize = 10 * 1024 * 1024; // Currently 10MB
```

## Future Enhancements

- [ ] User authentication and sessions
- [ ] PDF upload and processing support
- [ ] Example prompts sidebar
- [ ] Request history tracking
- [x] Real vLLM endpoint integration
- [ ] Batch processing queue
- [ ] Export results as files

## Development

### Build for Production

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

## License

This project is part of the DeepSeek OCR infrastructure and is intended for testing purposes.

## Contributing

Feel free to submit issues and enhancement requests!

---

**Note**: This application is now connected to a deployed DeepSeek OCR API. Make sure the EC2 instance is running before using the OCR functionality.
