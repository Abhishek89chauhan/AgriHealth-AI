# 🌱 Plant Disease Detection - Multi-Crop AI Web Application

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://plant-disease-frontend-ibpp.onrender.com)


AI-powered web application for detecting plant diseases across 10 crops using deep learning CNN models trained on TensorFlow. Deployed and accessible 24/7.

## 🌐 Live Application

- **Frontend**: [https://plant-disease-frontend-ibpp.onrender.com](https://plant-disease-frontend-ibpp.onrender.com)

## ✨ Features

### Core Functionality
- 🌾 **10 Crop Support**: Organized in 3 categories
  - 🥔 **Vegetables**: Potato, Tomato, Bell Pepper
  - 🍎 **Fruits**: Apple, Mango, Sugarcane
  - � **Grains**: Rice, Wheat, Finger Millet, Maize
- 🖼️ **Drag & Drop Interface**: Easy-to-use image upload
- 📸 **Camera Capture**: Take photos directly from your device
- ✂️ **Image Cropping**: Crop and adjust captured images before analysis
- ⚡ **Real-time Detection**: Instant disease classification with confidence scores
- 💊 **Treatment Recommendations**: Get actionable advice for detected diseases
- � **Crop-Disease Reference**: Comprehensive list of all crops and their diseases
- �📱 **Mobile Responsive**: Fully optimized for smartphones and tablets
- 💡 **Photo Tips**: Built-in guidance for taking quality plant photos
- 🎨 **Category-Based Navigation**: Organized tabbed interface for easy crop selection

### Supported Disease Classes (50+ Total)

| Category | Crop | Disease Classes | Count |
|----------|------|----------------|-------|
| **🥔 Vegetables** | **Potato** | Early Blight, Late Blight, Healthy | 3 |
| | **Tomato** | Bacterial Spot, Early Blight, Late Blight, Leaf Mold, Septoria Leaf Spot, Spider Mites, Target Spot, Mosaic Virus, Yellow Leaf Curl Virus, Healthy | 10 |
| | **Bell Pepper** | Bacterial Spot, Healthy | 2 |
| **🍎 Fruits** | **Apple** | Apple Scab, Black Rot, Cedar Apple Rust, Healthy | 4 |
| | **Mango** | Anthracnose, Bacterial Canker, Cutting Weevil, Die Back, Gall Midge, Powdery Mildew, Sooty Mould, Healthy | 8 |
| | **Sugarcane** | Bacterial Blight, Red Rot, Rust, Mosaic, Yellow Leaf Disease, Healthy | 6 |
| **🌾 Grains** | **Rice** | Bacterial Leaf Blight, Brown Spot, Leaf Smut, Healthy | 4 |
| | **Wheat** | Brown Rust, Yellow Rust, Healthy | 3 |
| | **Finger Millet** | Blast (Downy), Mottle, Seedling Disease, Smut, Wilt, Healthy | 6 |
| | **Maize** | Common Rust, Gray Leaf Spot, Northern Leaf Blight, Healthy | 4 |

## 🏗️ Project Structure

```
PlantDiseaseDetection/
├── models/              # Potato disease model
│   ├── 1/              # TensorFlow SavedModel
│   ├── 1.keras         # Keras format
│   └── 1.h5           # H5 format
├── models1/            # Pepper disease model
│   ├── 2/
│   ├── 2.keras
│   └── 2.h5
├── models2/            # Tomato disease model
│   ├── 3/
│   ├── 3.keras
│   └── 3.h5
├── models3/            # Maize disease model
│   ├── 4/
│   ├── 4.keras
│   └── 4.h5
├── models4/            # Apple disease model
│   ├── 5/
│   ├── 5.keras
│   └── 5.h5
├── models5/            # Wheat disease model
│   ├── 6/
│   ├── 6.keras
│   └── 6.h5
├── models6/            # Rice disease model
│   ├── 7/
│   ├── 7.keras
│   └── 7.h5
├── models7/            # Mango disease model
│   ├── 8/
│   ├── 8.keras
│   └── 8.h5
├── models8/            # Sugarcane disease model
│   ├── 9/
│   ├── 9.keras
│   └── 9.h5
├── models9/            # Finger Millet disease model
│   ├── 10/
│   ├── 10.keras
│   └── 10.h5
├── backend/
│   ├── package.json    # Express + TensorFlow.js dependencies
│   └── src/
│       ├── index.js        # Express API server
│       ├── cropConfig.js   # Crop → model paths & class labels
│       ├── imageService.js # Image preprocessing
│       └── modelService.js # Model load & inference
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js      # Main React component
│   │   ├── App.css     # Styles
│   │   ├── index.js
│   │   ├── vegi2.png   # Vegetables background
│   │   ├── fruits1.jpg # Fruits background
│   │   └── grains.jpg  # Grains background
│   └── package.json
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Crop models as TensorFlow **SavedModel** folders (or TF.js `model.json`) under `models/` … `models9/`

### Local Development Setup

#### Backend Setup

1. **Navigate to backend directory:**
   ```powershell
   cd backend
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Start the Express server:**
   ```powershell
   npm start
   ```
   
   Backend runs on `http://localhost:8000`

> **Models on Render:** Linux installs `@tensorflow/tfjs-node` and loads your existing **SavedModel** folders (`models/1`, …) — no conversion required for deploy.  
> **Local Windows:** if `tfjs-node` fails to install, convert once with `python backend/scripts/convert_models.py` (needs a compatible Python/tensorflowjs setup) so `model.json` exists under each model folder.

#### Frontend Setup

1. **Navigate to frontend directory:**
   ```powershell
   cd frontend
   ```

2. **Install npm dependencies:**
   ```powershell
   npm install
   ```

3. **Start the React development server:**
   ```powershell
   npm start
   ```
   
   Frontend opens at `http://localhost:3000`

## 🎯 Usage

### Web Application

1. Visit the live application or run locally
2. **Select Category**: Choose from Vegetables 🥔, Fruits 🍎, or Grains 🌾
3. **Select Crop Type**: Pick the specific crop from the selected category
4. **Upload Image**: 
   - Drag & drop an image, OR
   - Click to browse files, OR
   - Use camera to take a photo (with cropping)
5. **View Results**: 
   - Disease classification
   - Confidence percentage
   - Treatment recommendations
6. **Crop-Disease List**: Click the 📋 button (top-right) to view all supported crops and diseases

### Camera & Cropping Feature

1. Click the **📸 Take Photo** button
2. Capture image using your device camera
3. **Crop the image** in the cropping modal:
   - Drag to reposition
   - Use zoom slider to adjust size
   - Click **"✓ Apply & Analyze"** to proceed
4. Get instant disease prediction

### Photo Tips 💡

Click the tips button (💡) to see guidelines for best results:
- Good lighting, no shadows
- Clear focus on affected leaf areas
- Fill frame with leaf/plant part
- Avoid blurry or dark images
- Include both healthy and diseased parts if possible

## 🧪 API Documentation

### Base URL

- **Local**: `http://localhost:8000`

### Endpoints

#### GET `/ping`
Health check endpoint

**Response:**
```json
"Hello, I am alive"
```

#### POST `/predict`
Predict disease from uploaded image

**Request:**
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `file` (required): Image file (JPEG, PNG)
  - `crop` (optional): Crop type - `potato`, `pepper`, `tomato`, `maize`, `apple`, `wheat`, `rice`, `mango`, `sugarcane`, or `finger_millet` (default: `potato`)

**Example using curl:**
```bash
curl -X POST "" \
  -F "file=@plant_image.jpg" \
  -F "crop=mango"
```

**Response:**
```json
{
  "class": "Mango_Anthracnose",
  "confidence": 0.9547,
  "crop": "mango",
  "all_predictions": {
    "Mango_Anthracnose": 0.9547,
    "Mango_Bacterial_Canker": 0.0012,
    "Mango_Cutting_Weevil": 0.0023,
    ...
  }
}
```

## 📊 Model Information

- **Architecture**: CNN (Convolutional Neural Network)
- **Framework**: TensorFlow.js (Node) / original models trained with TensorFlow/Keras
- **Input Size**: 256x256 pixels (RGB)
- **Image Preprocessing**: 
  - EXIF orientation correction
  - RGB conversion
  - Bilinear resize to 256×256 (float32, 0–255 scale)
- **Training Dataset**: PlantVillage Dataset + Custom Datasets
- **Total Models**: 10 (one per crop type)

## 🎨 Technologies Used

### Backend
- **Express** - Node.js web framework
- **@tensorflow/tfjs-node** - Deep learning inference
- **Sharp** - Image processing
- **Multer** - Multipart file uploads
- **CORS** - Cross-origin support

### Frontend
- **React 18.2.0** - UI framework
- **React Dropzone** - Drag & drop functionality
- **React Easy Crop** - Image cropping
- **Axios** - HTTP client
- **CSS3** - Modern responsive styling

### Deployment
- **Render** - Cloud platform (free tier)
- **Git/GitHub** - Version control

## 🚀 Deployment

### Frontend (Static Site)
- **Platform**: Render Static Site
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `build`
- **Auto-Deploy**: Enabled (on push to main)

### Backend (Web Service)
- **Platform**: Render Web Service
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`
- **Auto-Deploy**: Enabled (on push to main)

### Important Notes
- ⏱️ **Cold Start**: First request after inactivity may take 30-60 seconds on free-tier hosting (Render spins down idle services)
- 🔄 **Auto-Wake**: The app pings the backend on load to reduce wait time when you upload an image
- ⚡ **Lazy Model Loading**: Only the selected crop's model is loaded, not all 10 at once
- ⚡ **Subsequent Requests**: Much faster after the server and model are warm

## 🔧 Configuration

### Environment Variables (Optional)

#### Frontend `.env` (for local development)
```
REACT_APP_API_URL=http://localhost:8000
```

#### Backend
`PORT` is optional (defaults to `8000`). Models are loaded from relative paths under the project root.

### CORS Configuration
Backend allows all origins for production deployment via the `cors` middleware.

## 🐛 Troubleshooting

### Backend Issues
- **TensorFlow / native binding errors**: Use Node 18+ and run `npm install` inside `backend`
- **Model not found**: Ensure SavedModel folders exist (`models/1`, `models1/2`, …) or place a TF.js `model.json` in those folders. `.keras` / `.h5` alone will not load in Node
- **CUDA errors**: Expected on CPU-only systems; `tfjs-node` runs on CPU

### Frontend Issues
- **Cannot connect to backend**: Check if backend is running and URL is correct
- **Timeout errors**: Wait for backend cold start (up to 60 seconds)
- **Build errors**: Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- **PlantVillage Dataset** - Training data for all crop disease models
- **TensorFlow Team** - Deep learning framework
- **Express / Node.js Community** - Backend framework
- **React Community** - Frontend framework
- **Render** - Deployment platform

## 📸 Screenshots

### Desktop View
- Clean, modern interface with gradient background
- Category-based navigation (Vegetables, Fruits, Grains)
- Crop selector with emoji icons
- Drag & drop upload area
- Real-time disease detection results
- Treatment recommendations
- Crop-Disease reference list modal

### Mobile View
- Fully responsive layout
- Touch-friendly category tabs
- Compact crop buttons
- Camera capture with cropping
- Optimized disease list modal
- Smooth scrolling and transitions

### Tablet View
- Optimized layout for medium screens
- Comfortable touch targets
- Adaptive spacing and sizing

## 🔮 Future Enhancements

- [ ] Add more crop types (cotton, groundnut, etc.)
- [ ] Historical tracking of detections
- [ ] Batch image processing
- [ ] Export reports as PDF
- [ ] Multi-language support (Hindi, regional languages)
- [ ] Integration with agricultural LLM chatbot
- [ ] Weather-based disease prediction
- [ ] Offline mode with PWA
- [ ] Migration to DigitalOcean for 24/7 uptime
- [ ] User authentication and saved history

## 📊 Performance

- **Model Inference Time**: ~1-3 seconds (after model is loaded)
- **First Crop Request**: 5-15 seconds (loads one model on demand)
- **Cold Start Time**: 30-60 seconds on free-tier hosting when server is asleep
- **Prediction Accuracy**: Varies by crop (generally >90%)
- **Supported Image Formats**: JPEG, JPG, PNG
- **Image Optimization**: Client-side compression before upload reduces transfer time

---

**Made for farmers and agricultural researchers**
