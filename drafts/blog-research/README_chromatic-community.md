# CHROMATIC - Community Edition
### *by UN/TITLD*

> Open-source LUT generation toolkit for cinematographers and colorists. Extract authentic color science from reference images.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://chromatic-demo.vercel.app)
[![GitHub](https://img.shields.io/github/stars/YOUR_USERNAME/chromatic-community?style=social)](https://github.com/YOUR_USERNAME/chromatic-community)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎬 What is Chromatic?

**Chromatic Community Edition** is a free, open-source color grading toolkit that extracts authentic color science from reference images and converts it into professional LUT files. This is the showcase version - perfect for learning, experimentation, and contributing to the color grading community.

> **Looking for Pro features?** Check out [Chromatic Pro](https://chromatic.com) for unlimited grid sizes, all format conversions, preset management, and more.

---

## ✨ Features (Community Edition)

### 🎨 Image-to-LUT Generation
- ✅ **Authentic Color Extraction** - Zone-based analysis (shadows/midtones/highlights)
- ✅ **17×17×17 Grid Size** - Industry-standard quality
- ✅ **Adjustable Intensity** - 0-100% strength control
- ✅ **Real-time Preview** - See changes before exporting
- ✅ **.cube Export** - Universal format supported by all major software

### 🔄 LUT Conversion
- ✅ **Format Detection** - Auto-detects .cube, .3dl, and .lut files
- ✅ **Basic Conversion** - .cube → .3dl format conversion
- ✅ **Quality Validation** - Ensures valid LUT structure

### 📊 LUT Analysis
- ✅ **Quality Scoring** - Comprehensive LUT validation
- ✅ **Banding Detection** - Preview problematic areas
- ✅ **Statistics** - Min/max/average color values

### 🎯 Interactive Demo
- ✅ **Before/After Comparison** - Drag-to-compare slider
- ✅ **No Login Required** - Try it instantly
- ✅ **Educational** - Learn how LUTs work

---

## 🚀 Live Demo

**Try it now:** [chromatic-demo.vercel.app](https://chromatic-demo.vercel.app)

No signup required - upload an image and generate your first LUT in seconds!

---

## 🆚 Community vs Pro

| Feature | Community (Free) | Pro ($12/mo) |
|---------|------------------|--------------|
| **Grid Sizes** | 17×17×17 | 17, 33, 65 |
| **Export Formats** | .cube only | .cube, .3dl, .lut |
| **Conversions** | .cube → .3dl | All bidirectional |
| **Preset Saving** | ❌ | ✅ Unlimited |
| **Batch Processing** | ❌ | ✅ Multiple images |
| **Advanced Controls** | ❌ | ✅ Split toning, etc. |

**Upgrade to Pro:** [chromatic.com/pricing](https://chromatic.com/pricing)

---

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (lightning-fast builds)
- Wouter (routing)
- TanStack Query (server state)
- shadcn/ui (beautiful components)
- Tailwind CSS (cinematic styling)

**Backend:**
- Express.js + Node.js
- PostgreSQL (Neon serverless)
- Drizzle ORM (type-safe)
- Passport.js (auth)
- Sharp (image processing)
- Multer (file uploads)

**LUT Processing:**
- Custom parser (.cube, .3dl, .lut)
- Zone-based color extraction
- Trilinear interpolation
- Quality analysis algorithms

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Quick Start

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/chromatic-community.git
cd chromatic-community

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Push database schema
npm run db:push

# Start development server
npm run dev
```

Your app will be running at `http://localhost:5000`

### Environment Variables

```bash
# Database (required)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Session (required)
SESSION_SECRET=your-random-secret-here

# Optional: Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## 📖 How It Works

### Image-to-LUT Algorithm

1. **Image Analysis**
   ```
   Upload → Sharp Processing → Color Extraction
   ```

2. **Zone-Based Analysis**
   - **Shadows**: Pixels with <33% luminance
   - **Midtones**: Pixels with 33-67% luminance  
   - **Highlights**: Pixels with >67% luminance

3. **Color Transform Generation**
   ```
   Per Zone: Brightness + Contrast + Saturation → LUT Cube
   ```

4. **Export**
   ```
   3D Color Cube → .cube format → Download
   ```

### LUT Format Details

**17×17×17 Grid** = 4,913 color points
- Industry-standard quality
- Supported by all major software
- Smooth color transitions
- ~50KB file size

---

## 🎨 Use Cases

### For Learning
- Understand how LUTs work
- Experiment with color grading
- Build your first preset library

### For Cinematographers
- Extract looks from film stills
- Create quick reference LUTs
- Match camera color profiles

### For Content Creators
- Generate cinematic color grades
- Convert reference images to LUTs
- Apply consistent looks to videos

---

## 🤝 Contributing

Contributions are welcome! This is a community project.

**Ways to contribute:**
- 🐛 Report bugs via [Issues](https://github.com/YOUR_USERNAME/chromatic-community/issues)
- 💡 Suggest features
- 🔧 Submit pull requests
- 📖 Improve documentation
- ⭐ Star the repo!

### Development Setup

```bash
# Fork the repo
# Clone your fork
git clone https://github.com/YOUR_USERNAME/chromatic-community.git

# Create a feature branch
git checkout -b feature/awesome-feature

# Make your changes
# Test thoroughly

# Commit and push
git commit -m "Add awesome feature"
git push origin feature/awesome-feature

# Open a Pull Request
```

---

## 📐 Architecture

```
chromatic-community/
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/      # Route pages
│   │   ├── components/ # Reusable UI
│   │   └── lib/        # Utilities
├── server/              # Express backend
│   ├── routes.ts       # API endpoints
│   ├── storage.ts      # Database layer
│   └── utils/          # LUT processing
├── shared/              # Shared types
│   └── schema.ts       # Database schema
└── package.json
```

---

## 🔐 Security

- Bcrypt password hashing
- Express sessions (PostgreSQL)
- Rate limiting
- Input validation
- Secure file uploads (in-memory only)
- Environment variable protection

---

## 📊 Performance

- **In-Memory Processing** - No disk writes
- **Image Optimization** - Sharp for speed
- **Efficient Algorithms** - Optimized color math
- **Fast Builds** - Vite HMR
- **Database Indexing** - Quick queries

---

## 📝 License

**MIT License** - Use freely for personal and commercial projects.

See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Filmic Pro** - .cube format spec
- **Autodesk** - .3dl format spec
- **shadcn/ui** - UI components
- **Vercel** - Deployment platform
- **Neon** - PostgreSQL hosting

---

## 📚 Learn More

- [What are LUTs?](https://chromatic.com/learn/what-are-luts)
- [Color Grading Basics](https://chromatic.com/learn/color-grading)
- [LUT Format Guide](https://chromatic.com/learn/formats)

---

## 🔗 Links

- **Live Demo**: [chromatic-demo.vercel.app](https://chromatic-demo.vercel.app)
- **Full Version**: [chromatic.com](https://chromatic.com)
- **Documentation**: [docs.chromatic.com](https://docs.chromatic.com)
- **Support**: support@chromatic.com

---

## ⭐ Support the Project

If you find this useful:
- ⭐ Star the repo
- 🐦 Share on Twitter
- 💼 Use in your projects
- 🤝 Contribute code
- ☕ [Buy me a coffee](https://buymeacoffee.com/chromatic)

Or upgrade to [Chromatic Pro](https://chromatic.com/pricing) for advanced features!

---

<div align="center">

**Built with ❤️ for the color grading community**

*by UN/TITLD*

[🌟 Star](https://github.com/YOUR_USERNAME/chromatic-community) • [🐛 Report Bug](https://github.com/YOUR_USERNAME/chromatic-community/issues) • [💡 Request Feature](https://github.com/YOUR_USERNAME/chromatic-community/issues)

</div>
