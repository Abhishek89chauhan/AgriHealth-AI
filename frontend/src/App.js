import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import Cropper from 'react-easy-crop';
import './App.css';
import vegiBackground from './vegi2.png';
import fruitsBackground from './fruits1.jpg';
import grainsBackground from './grains.jpg';

const API_URL = process.env.REACT_APP_API_URL || 'https://plant-disease-api-yt7l.onrender.com';

const compressImage = (file, maxSize = 1024, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const image = new Image();
      image.onload = () => {
        let { width, height } = image;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      image.onerror = reject;
      image.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing...');
  const [serverReady, setServerReady] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('vegetables'); // Category: vegetables, fruits, grains
  const [selectedCrop, setSelectedCrop] = useState('potato'); // New state for crop selection
  const cameraInputRef = useRef(null);
  const [showTips, setShowTips] = useState(false);
  const [showDiseaseList, setShowDiseaseList] = useState(false); // New state for disease list modal
  
  // Cropping states
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    const wakeServer = async () => {
      try {
        await axios.get(`${API_URL}/ping`, { timeout: 120000 });
        setServerReady(true);
      } catch {
        setServerReady(false);
      }
    };
    wakeServer();
  }, []);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setPrediction(null);
      setConfidence(0);

      try {
        const compressedFile = await compressImage(file);
        setSelectedImage(compressedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(compressedFile);
        await analyzImage(compressedFile);
      } catch (error) {
        console.error('Error preparing image:', error);
        alert('Could not process the image. Please try another file.');
      }
    }
  };

  const analyzImage = async (file) => {
    setLoading(true);
    setLoadingMessage(serverReady ? 'Analyzing image...' : 'Waking up server, please wait...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('crop', selectedCrop);

    try {
      const response = await axios.post(`${API_URL}/predict`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000
      });

      setPrediction(response.data.class);
      setConfidence(response.data.confidence);
      setServerReady(true);
    } catch (error) {
      console.error('Error:', error);
      if (error.code === 'ECONNABORTED') {
        alert('Request timed out. The server may still be starting up — please try again in a moment.');
      } else if (error.response) {
        alert(`Server error: ${error.response.status}. Please check the backend.`);
      } else if (error.request) {
        alert('Cannot connect to the backend server. Please wait a moment and try again.');
      } else {
        alert('Error: ' + error.message);
      }
    } finally {
      setLoading(false);
      setLoadingMessage('Analyzing...');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    multiple: false
  });

  const handlePredict = async () => {
    if (!selectedImage) {
      alert('Please select an image first!');
      return;
    }

    await analyzImage(selectedImage);
  };

  const handleCameraCapture = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Clear previous results immediately
      setPrediction(null);
      setConfidence(0);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const compressedFile = await compressImage(croppedImage.file);
      setPreview(croppedImage.url);
      setSelectedImage(compressedFile);
      setShowCropModal(false);
      await analyzImage(compressedFile);
    } catch (e) {
      console.error('Error cropping image:', e);
    }
  };

  const getCroppedImg = (imageSrc, pixelCrop) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
          const url = URL.createObjectURL(blob);
          resolve({ file, url });
        }, 'image/jpeg');
      };
      image.onerror = reject;
    });
  };

  const cancelCrop = () => {
    setShowCropModal(false);
    setImageToCrop(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const openCamera = () => {
    cameraInputRef.current.click();
  };

  const formatClassName = (className) => {
    return className
      .replace(/Potato___/g, '')
      .replace(/Pepper__bell___/g, '')
      .replace(/Tomato_/g, '')
      .replace(/Tomato__/g, '')
      .replace(/Corn_\(maize\)___/g, '')
      .replace(/Apple___/g, '')
      .replace(/_/g, ' ');
  };

  const getHealthStatus = (className) => {
    const lowerClassName = className.toLowerCase();
    if (lowerClassName.includes('healthy')) {
      return { status: 'Healthy', color: '#10b981', emoji: '+' };
    } else if (className.includes('Early_blight') || className.includes('Early blight')) {
      return { status: 'Early Blight Detected', color: '#f59e0b', emoji: '⚠' };
    } else if (className.includes('Late_blight') || className.includes('Late blight')) {
      return { status: 'Late Blight Detected', color: '#ef4444', emoji: '⚠' };
    } else if (className.includes('Bacterial_spot') || className.includes('Bacterial spot')) {
      return { status: 'Bacterial Spot Detected', color: '#ef4444', emoji: '⚠' };
    } else if (className.includes('Leaf_Mold') || className.includes('Leaf Mold')) {
      return { status: 'Leaf Mold Detected', color: '#ef4444', emoji: '⚠' };
    } else if (className.includes('Septoria')) {
      return { status: 'Septoria Leaf Spot Detected', color: '#ef4444', emoji: '⚠' };
    } else if (className.includes('Spider_mites') || className.includes('Spider mites')) {
      return { status: 'Spider Mites Detected', color: '#f59e0b', emoji: '⚠' };
    } else if (className.includes('Target_Spot') || className.includes('Target Spot')) {
      return { status: 'Target Spot Detected', color: '#ef4444', emoji: '⚠' };
    } else if (className.includes('mosaic_virus') || className.includes('mosaic virus')) {
      return { status: 'Mosaic Virus Detected', color: '#ef4444', emoji: '⚠' };
    } else if (className.includes('YellowLeaf') || className.includes('Curl_Virus')) {
      return { status: 'Yellow Leaf Curl Virus Detected', color: '#ef4444', emoji: '⚠' };
    } else if (className.includes('brown_rust')) {
      return { status: 'Brown Rust Detected', color: '#92400e', emoji: '⚠' };
    } else if (className.includes('yellow_rust')) {
      return { status: 'Yellow Rust Detected', color: '#f59e0b', emoji: '⚠' };
    } else if (className.includes('septoria')) {
      return { status: 'Septoria Detected', color: '#ef4444', emoji: '⚠' };
    } else if (className.includes('brown_spot')) {
      return { status: 'Brown Spot Detected', color: '#92400e', emoji: '⚠' };
    } else if (className.includes('hispa')) {
      return { status: 'Hispa Detected', color: '#ef4444', emoji: '⚠' };
    } else if (className.includes('leaf_blast')) {
      return { status: 'Leaf Blast Detected', color: '#ef4444', emoji: '⚠' };
    } else if (className.includes('neck_blast')) {
      return { status: 'Neck Blast Detected', color: '#dc2626', emoji: '⚠' };
    } else if (className.includes('anthracnose')) {
      return { status: 'Anthracnose Detected', color: '#ef4444', emoji: '⚠' };
    } else if (className.includes('die_black')) {
      return { status: 'Die Black Detected', color: '#1f2937', emoji: '⚠' };
    } else if (className.includes('gall_midge')) {
      return { status: 'Gall Midge Detected', color: '#ef4444', emoji: '⚠' };
    } else if (className.includes('powdery_mildew')) {
      return { status: 'Powdery Mildew Detected', color: '#f97316', emoji: '⚠' };
    } else if (className.includes('Mosaic')) {
      return { status: 'Mosaic Disease Detected', color: '#eab308', emoji: '⚠' };
    } else if (className.includes('RedRot')) {
      return { status: 'Red Rot Detected', color: '#dc2626', emoji: '⚠' };
    } else if (className.includes('Rust')) {
      return { status: 'Rust Detected', color: '#92400e', emoji: '⚠' };
    } else if (className.includes('Yellow')) {
      return { status: 'Yellow Disease Detected', color: '#fbbf24', emoji: '⚠' };
    } else if (className.includes('downy')) {
      return { status: 'Downy Mildew Detected', color: '#6b7280', emoji: '⚠' };
    } else if (className.includes('mottle')) {
      return { status: 'Mottle Disease Detected', color: '#eab308', emoji: '⚠' };
    } else if (className.includes('seedling')) {
      return { status: 'Seedling Blight Detected', color: '#dc2626', emoji: '⚠' };
    } else if (className.includes('smut')) {
      return { status: 'Smut Disease Detected', color: '#1f2937', emoji: '⚠' };
    } else if (className.includes('wilt')) {
      return { status: 'Wilt Disease Detected', color: '#92400e', emoji: '⚠' };
    }
    return { status: 'Disease Detected', color: '#ef4444', emoji: '⚠' };
  };

  const getCropIcon = () => {
    if (selectedCrop === 'potato') return '🥔';
    if (selectedCrop === 'pepper') return '🫑';
    if (selectedCrop === 'tomato') return '🍅';
    if (selectedCrop === 'maize') return '🌽';
    if (selectedCrop === 'apple') return '🍎';
    if (selectedCrop === 'wheat') return '🌾';
    if (selectedCrop === 'rice') return '🌾'; // Using grain icon for rice
    if (selectedCrop === 'mango') return '🥭';
    if (selectedCrop === 'sugarcane') return '🎍';
    if (selectedCrop === 'finger_millet') return '🌾';
    return '🌱';
  };

  const getCropName = () => {
    if (selectedCrop === 'potato') return 'Potato';
    if (selectedCrop === 'pepper') return 'Pepper Bell';
    if (selectedCrop === 'tomato') return 'Tomato';
    if (selectedCrop === 'maize') return 'Maize';
    if (selectedCrop === 'apple') return 'Apple';
    if (selectedCrop === 'wheat') return 'Wheat';
    if (selectedCrop === 'rice') return 'Rice';
    if (selectedCrop === 'mango') return 'Mango';
    if (selectedCrop === 'sugarcane') return 'Sugarcane';
    if (selectedCrop === 'finger_millet') return 'Finger Millet';
    return 'Plant';
  };

  const getBackgroundImage = () => {
    if (selectedCategory === 'vegetables') return vegiBackground;
    if (selectedCategory === 'fruits') return fruitsBackground;
    if (selectedCategory === 'grains') return grainsBackground;
    return '';
  };

  return (
    <div 
      className={`App ${selectedCategory}`}
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${getBackgroundImage()})`
      }}
    >
      <div className="main-title">
        <h1>Plant Disease Detection</h1>
        <p>AI-Powered Multi-Crop Health Analysis</p>
      </div>
      <div className="container">
        <header className="header">
          {/* Category Tabs */}
          <div className="category-tabs">
            <button 
              className={`category-tab ${selectedCategory === 'vegetables' ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory('vegetables');
                setSelectedCrop('potato');
                setPrediction(null);
                setConfidence(0);
              }}
            >
              🥔 Vegetables
            </button>
            <button 
              className={`category-tab ${selectedCategory === 'fruits' ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory('fruits');
                setSelectedCrop('apple');
                setPrediction(null);
                setConfidence(0);
              }}
            >
              🍎 Fruits
            </button>
            <button 
              className={`category-tab ${selectedCategory === 'grains' ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory('grains');
                setSelectedCrop('rice');
                setPrediction(null);
                setConfidence(0);
              }}
            >
              🌾 Grains
            </button>
          </div>

          {/* Disease List Button - Top Right */}
          <div className="disease-list-button-container">
            <button 
              className="disease-list-button"
              onClick={() => setShowDiseaseList(!showDiseaseList)}
            >
              📋 Crop-Disease List
            </button>
          </div>

          <h2>{getCropIcon()} {getCropName()} Disease Detection</h2>
          
          {/* Crop Selector Toggle - Vegetables */}
          {selectedCategory === 'vegetables' && (
            <div className="crop-selector">
              <button 
                className={`crop-button ${selectedCrop === 'potato' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCrop('potato');
                  setPrediction(null);
                  setConfidence(0);
                }}
              >
                🥔 Potato
              </button>
              <button 
                className={`crop-button ${selectedCrop === 'tomato' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCrop('tomato');
                  setPrediction(null);
                  setConfidence(0);
                }}
              >
                🍅 Tomato
              </button>
              <button 
                className={`crop-button ${selectedCrop === 'pepper' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCrop('pepper');
                  setPrediction(null);
                  setConfidence(0);
                }}
              >
                🌶️ Bell Pepper
              </button>
            </div>
          )}

          {/* Crop Selector Toggle - Fruits */}
          {selectedCategory === 'fruits' && (
            <div className="crop-selector">
              <button 
                className={`crop-button ${selectedCrop === 'apple' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCrop('apple');
                  setPrediction(null);
                  setConfidence(0);
                }}
              >
                🍎 Apple
              </button>
              <button 
                className={`crop-button ${selectedCrop === 'mango' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCrop('mango');
                  setPrediction(null);
                  setConfidence(0);
                }}
              >
                🥭 Mango
              </button>
              <button 
                className={`crop-button ${selectedCrop === 'sugarcane' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCrop('sugarcane');
                  setPrediction(null);
                  setConfidence(0);
                }}
              >
                🎋 Sugarcane
              </button>
            </div>
          )}

          {/* Crop Selector Toggle - Grains */}
          {selectedCategory === 'grains' && (
            <div className="crop-selector">
              <button 
                className={`crop-button ${selectedCrop === 'rice' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCrop('rice');
                  setPrediction(null);
                  setConfidence(0);
                }}
              >
                🌾 Rice
              </button>
              <button 
                className={`crop-button ${selectedCrop === 'wheat' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCrop('wheat');
                  setPrediction(null);
                  setConfidence(0);
                }}
              >
                🌾 Wheat
              </button>
              <button 
                className={`crop-button ${selectedCrop === 'finger_millet' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCrop('finger_millet');
                  setPrediction(null);
                  setConfidence(0);
                }}
              >
                🌾 Finger Millet
              </button>
              <button 
                className={`crop-button ${selectedCrop === 'maize' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCrop('maize');
                  setPrediction(null);
                  setConfidence(0);
                }}
              >
                🌽 Maize
              </button>
            </div>
          )}
        </header>

        <div className="main-content">
          <div className="upload-section">
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
              <input {...getInputProps()} />
              {preview ? (
                <div className="preview-container">
                  <img src={preview} alt="Preview" className="preview-image" />
                </div>
              ) : (
                <div className="dropzone-content">
                  <div className="upload-icon">📁</div>
                  <p className="dropzone-text">
                    {isDragActive
                      ? 'Drop the image here...'
                      : 'Drag & drop an image here, or click to select'}
                  </p>
                  <p className="dropzone-hint">Supported formats: JPG, JPEG, PNG</p>
                </div>
              )}
            </div>

            {/* Hidden camera input */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              style={{ display: 'none' }}
            />

            {/* Camera and Tips buttons */}
            <div className="action-buttons">
              <button onClick={() => setShowTips(true)} className="tips-icon-button" title="Photo Tips">
                💡
              </button>
              <button onClick={openCamera} className="camera-button">
                📷 Take Photo
              </button>
            </div>

            {selectedImage && (
              <button
                onClick={handlePredict}
                disabled={loading}
                className="predict-button"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    {loadingMessage}
                  </>
                ) : (
                  'Analyze Image'
                )}
              </button>
            )}
          </div>

          {/* Tips Modal */}
          {showTips && (
            <div className="modal-overlay" onClick={() => setShowTips(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setShowTips(false)}>
                  ✕
                </button>
                <h3 className="modal-title">📋 Tips for Better Results</h3>
                <ul className="modal-tips-list">
                  <li>✓ Use good lighting (natural light is best)</li>
                  <li>✓ Focus on the affected leaf area</li>
                  <li>✓ Keep the camera steady</li>
                  <li>✓ Fill the frame with the leaf</li>
                  <li>✓ Avoid blurry or dark images</li>
                  <li>✓ Capture clear details of symptoms</li>
                </ul>
              </div>
            </div>
          )}

          {prediction && (
            <div className="results-section">
              <h2>Analysis Results</h2>
              <div className="result-card">
                <div className="result-header" style={{ borderColor: getHealthStatus(prediction).color }}>
                  <span className={`result-emoji ${prediction.toLowerCase().includes('healthy') ? 'healthy-emoji' : 'disease-emoji'}`}>
                    {getHealthStatus(prediction).emoji}
                  </span>
                  <h3 style={{ color: getHealthStatus(prediction).color }}>
                    {getHealthStatus(prediction).status}
                  </h3>
                </div>
                <div className="result-details">
                  <div className="detail-item">
                    <span className="detail-label">Disease Type:</span>
                    <span className="detail-value">{formatClassName(prediction)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Confidence:</span>
                    <span className="detail-value">{(confidence * 100).toFixed(2)}%</span>
                  </div>
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{
                        width: `${confidence * 100}%`,
                        backgroundColor: getHealthStatus(prediction).color
                      }}
                    ></div>
                  </div>
                </div>
                
                {!prediction.toLowerCase().includes('healthy') && (
                  <div className="recommendations">
                    <h4>💡 Recommendations:</h4>
                    <ul>
                      {prediction.includes('Early_blight') && (
                        <>
                          <li>Remove and destroy infected plant parts</li>
                          <li>Apply fungicides containing chlorothalonil or mancozeb</li>
                          <li>Improve air circulation around plants</li>
                          <li>Water at the base of plants, avoid wetting foliage</li>
                        </>
                      )}
                      {prediction.includes('Late_blight') && (
                        <>
                          <li>Remove infected plants immediately</li>
                          <li>Apply copper-based fungicides</li>
                          <li>Ensure proper spacing between plants</li>
                          <li>Avoid overhead irrigation</li>
                          <li>Consider resistant varieties</li>
                        </>
                      )}
                      {prediction.includes('Bacterial_spot') && (
                        <>
                          <li>Remove and destroy infected leaves</li>
                          <li>Apply copper-based bactericides</li>
                          <li>Avoid working with plants when wet</li>
                          <li>Use pathogen-free seeds and transplants</li>
                          <li>Rotate crops to reduce disease pressure</li>
                        </>
                      )}
                      {prediction.includes('Leaf_Mold') && (
                        <>
                          <li>Improve ventilation and reduce humidity</li>
                          <li>Remove infected leaves immediately</li>
                          <li>Apply fungicides if necessary</li>
                          <li>Avoid overhead watering</li>
                        </>
                      )}
                      {prediction.includes('Septoria') && (
                        <>
                          <li>Remove infected lower leaves</li>
                          <li>Apply fungicides containing chlorothalonil</li>
                          <li>Mulch around plants to prevent soil splash</li>
                          <li>Rotate crops annually</li>
                        </>
                      )}
                      {prediction.includes('Spider_mites') && (
                        <>
                          <li>Spray plants with strong water jets</li>
                          <li>Apply insecticidal soap or neem oil</li>
                          <li>Introduce predatory mites</li>
                          <li>Maintain proper humidity levels</li>
                        </>
                      )}
                      {prediction.includes('Target_Spot') && (
                        <>
                          <li>Remove and destroy infected plant debris</li>
                          <li>Apply appropriate fungicides</li>
                          <li>Improve air circulation</li>
                          <li>Practice crop rotation</li>
                        </>
                      )}
                      {(prediction.includes('mosaic_virus') || prediction.includes('YellowLeaf') || prediction.includes('Curl_Virus')) && (
                        <>
                          <li>Remove and destroy infected plants immediately</li>
                          <li>Control insect vectors (whiteflies, aphids)</li>
                          <li>Use virus-resistant varieties</li>
                          <li>Maintain weed-free areas around plants</li>
                          <li>Disinfect tools between plants</li>
                        </>
                      )}
                      {prediction.includes('Cercospora') && (
                        <>
                          <li>Remove and destroy infected leaves</li>
                          <li>Apply fungicides containing azoxystrobin or propiconazole</li>
                          <li>Practice crop rotation (2-3 years)</li>
                          <li>Plant resistant varieties</li>
                          <li>Maintain proper plant spacing</li>
                        </>
                      )}
                      {prediction.includes('Common_rust') && (
                        <>
                          <li>Apply fungicides at first sign of infection</li>
                          <li>Use resistant hybrid varieties</li>
                          <li>Remove volunteer corn plants</li>
                          <li>Plant early to avoid peak rust season</li>
                        </>
                      )}
                      {prediction.includes('Northern_Leaf_Blight') && (
                        <>
                          <li>Plant resistant hybrids</li>
                          <li>Apply fungicides (azoxystrobin, pyraclostrobin)</li>
                          <li>Tillage to bury crop residue</li>
                          <li>Rotate with non-host crops</li>
                          <li>Ensure adequate spacing for air circulation</li>
                        </>
                      )}
                      {prediction.includes('Apple_scab') && (
                        <>
                          <li>Remove fallen leaves and infected fruit</li>
                          <li>Apply fungicides during spring growth</li>
                          <li>Plant scab-resistant varieties</li>
                          <li>Prune trees to improve air circulation</li>
                          <li>Avoid overhead irrigation</li>
                        </>
                      )}
                      {prediction.includes('Black_rot') && (
                        <>
                          <li>Remove infected fruit, branches and mummies</li>
                          <li>Apply fungicides during bloom period</li>
                          <li>Prune out dead and diseased branches</li>
                          <li>Maintain tree vigor with proper fertilization</li>
                          <li>Clean up fallen fruit and leaves</li>
                        </>
                      )}
                      {prediction.includes('Cedar_apple_rust') && (
                        <>
                          <li>Remove nearby cedar trees if possible</li>
                          <li>Apply fungicides in early spring</li>
                          <li>Plant resistant apple varieties</li>
                          <li>Rake and dispose of fallen leaves</li>
                          <li>Maintain good air circulation</li>
                        </>
                      )}
                      {prediction.includes('brown_rust') && (
                        <>
                          <li>Apply fungicides containing triazole or strobilurin</li>
                          <li>Plant resistant wheat varieties</li>
                          <li>Remove volunteer wheat plants</li>
                          <li>Practice crop rotation</li>
                          <li>Monitor fields regularly during growing season</li>
                        </>
                      )}
                      {prediction.includes('yellow_rust') && (
                        <>
                          <li>Apply fungicides at first sign of infection</li>
                          <li>Use resistant wheat cultivars</li>
                          <li>Remove infected plant debris</li>
                          <li>Avoid excessive nitrogen fertilization</li>
                          <li>Ensure proper plant spacing for air circulation</li>
                        </>
                      )}
                      {(prediction.includes('septoria') && selectedCrop === 'wheat') && (
                        <>
                          <li>Apply fungicides during early growth stages</li>
                          <li>Practice crop rotation (minimum 2 years)</li>
                          <li>Use certified disease-free seeds</li>
                          <li>Remove and destroy infected crop residue</li>
                          <li>Plant resistant wheat varieties</li>
                          <li>Improve field drainage</li>
                        </>
                      )}
                      {prediction.includes('brown_spot') && (
                        <>
                          <li>Apply fungicides containing mancozeb or copper oxychloride</li>
                          <li>Use disease-free certified seeds</li>
                          <li>Maintain proper fertilization (avoid nitrogen excess)</li>
                          <li>Ensure adequate potassium levels in soil</li>
                          <li>Practice proper water management</li>
                          <li>Remove infected plant debris</li>
                        </>
                      )}
                      {prediction.includes('hispa') && (
                        <>
                          <li>Remove and destroy affected leaves</li>
                          <li>Apply recommended insecticides</li>
                          <li>Maintain clean field surroundings</li>
                          <li>Use light traps to monitor and control adults</li>
                          <li>Plant early to avoid peak infestation period</li>
                          <li>Use resistant rice varieties</li>
                        </>
                      )}
                      {prediction.includes('leaf_blast') && (
                        <>
                          <li>Apply fungicides (tricyclazole, azoxystrobin) at early signs</li>
                          <li>Use resistant rice varieties</li>
                          <li>Avoid excessive nitrogen fertilization</li>
                          <li>Maintain proper plant spacing for air circulation</li>
                          <li>Remove and burn infected plant parts</li>
                          <li>Practice crop rotation</li>
                          <li>Use certified disease-free seeds</li>
                        </>
                      )}
                      {prediction.includes('neck_blast') && (
                        <>
                          <li>Apply systemic fungicides at panicle initiation stage</li>
                          <li>Use resistant rice cultivars</li>
                          <li>Avoid late-season nitrogen application</li>
                          <li>Ensure balanced fertilization</li>
                          <li>Remove infected panicles immediately</li>
                          <li>Maintain optimal water levels</li>
                          <li>Practice field sanitation</li>
                        </>
                      )}
                      {prediction.includes('anthracnose') && (
                        <>
                          <li>Apply fungicides containing copper or mancozeb</li>
                          <li>Remove and destroy infected plant parts</li>
                          <li>Practice proper pruning for air circulation</li>
                          <li>Avoid overhead irrigation</li>
                          <li>Harvest fruits at proper maturity</li>
                          <li>Use resistant mango varieties</li>
                          <li>Maintain orchard sanitation</li>
                        </>
                      )}
                      {prediction.includes('die_black') && (
                        <>
                          <li>Prune and destroy dead branches</li>
                          <li>Apply copper-based fungicides</li>
                          <li>Improve orchard drainage</li>
                          <li>Avoid mechanical injuries to trees</li>
                          <li>Practice proper fertilization</li>
                          <li>Remove and burn infected plant material</li>
                          <li>Maintain tree vigor through proper care</li>
                        </>
                      )}
                      {prediction.includes('gall_midge') && (
                        <>
                          <li>Remove and destroy affected plant parts</li>
                          <li>Apply recommended insecticides during flowering</li>
                          <li>Use pheromone traps for monitoring</li>
                          <li>Practice orchard sanitation</li>
                          <li>Avoid excessive nitrogen fertilization</li>
                          <li>Encourage natural predators</li>
                          <li>Time irrigation to avoid conducive conditions</li>
                        </>
                      )}
                      {prediction.includes('powdery_mildew') && (
                        <>
                          <li>Apply sulfur-based or systemic fungicides</li>
                          <li>Ensure proper spacing for air circulation</li>
                          <li>Remove infected leaves and flowers</li>
                          <li>Avoid overhead watering</li>
                          <li>Maintain moderate humidity levels</li>
                          <li>Use resistant mango cultivars</li>
                          <li>Apply fungicides preventively during susceptible stages</li>
                        </>
                      )}
                      {prediction.includes('Mosaic') && selectedCrop === 'sugarcane' && (
                        <>
                          <li>Remove and destroy infected plant parts</li>
                          <li>Use virus-free planting material</li>
                          <li>Control insect vectors (aphids, leafhoppers)</li>
                          <li>Practice crop rotation</li>
                          <li>Maintain field sanitation</li>
                          <li>Plant resistant sugarcane varieties</li>
                          <li>Monitor and rogue out infected plants early</li>
                        </>
                      )}
                      {prediction.includes('RedRot') && (
                        <>
                          <li>Use resistant sugarcane varieties</li>
                          <li>Treat seed setts with fungicides before planting</li>
                          <li>Remove and burn infected plants immediately</li>
                          <li>Practice crop rotation with non-host crops</li>
                          <li>Ensure proper field drainage</li>
                          <li>Use certified disease-free seed material</li>
                          <li>Avoid waterlogging conditions</li>
                        </>
                      )}
                      {prediction.includes('Rust') && selectedCrop === 'sugarcane' && (
                        <>
                          <li>Apply fungicides containing triazole or mancozeb</li>
                          <li>Use rust-resistant sugarcane varieties</li>
                          <li>Remove heavily infected leaves</li>
                          <li>Maintain proper plant nutrition</li>
                          <li>Avoid excessive nitrogen application</li>
                          <li>Ensure good air circulation in fields</li>
                          <li>Monitor and treat early in infection cycle</li>
                        </>
                      )}
                      {prediction.includes('Yellow') && selectedCrop === 'sugarcane' && (
                        <>
                          <li>Plant resistant or tolerant sugarcane varieties</li>
                          <li>Improve soil drainage and aeration</li>
                          <li>Apply balanced fertilization with micronutrients</li>
                          <li>Use disease-free seed material</li>
                          <li>Practice proper water management</li>
                          <li>Monitor soil pH and adjust if necessary</li>
                          <li>Remove and destroy severely infected plants</li>
                        </>
                      )}
                      {prediction.includes('downy') && (
                        <>
                          <li>Apply metalaxyl-based fungicides</li>
                          <li>Use resistant finger millet varieties</li>
                          <li>Ensure proper spacing between plants</li>
                          <li>Avoid overhead irrigation during early morning</li>
                          <li>Remove and destroy infected plant debris</li>
                          <li>Practice crop rotation with non-host crops</li>
                          <li>Ensure good field drainage</li>
                        </>
                      )}
                      {prediction.includes('mottle') && (
                        <>
                          <li>Use virus-free certified seeds</li>
                          <li>Control insect vectors (aphids, leafhoppers)</li>
                          <li>Remove and destroy infected plants immediately</li>
                          <li>Maintain field sanitation</li>
                          <li>Plant resistant or tolerant varieties</li>
                          <li>Avoid planting near infected fields</li>
                          <li>Monitor regularly for early symptoms</li>
                        </>
                      )}
                      {prediction.includes('seedling') && (
                        <>
                          <li>Treat seeds with fungicides before planting</li>
                          <li>Use certified disease-free seeds</li>
                          <li>Ensure proper seed depth and spacing</li>
                          <li>Improve soil drainage in seedling areas</li>
                          <li>Avoid overwatering during seedling stage</li>
                          <li>Apply protective fungicides if severe</li>
                          <li>Practice crop rotation</li>
                        </>
                      )}
                      {prediction.includes('smut') && (
                        <>
                          <li>Treat seeds with systemic fungicides</li>
                          <li>Use smut-resistant finger millet varieties</li>
                          <li>Remove and burn infected plant parts</li>
                          <li>Maintain proper plant spacing</li>
                          <li>Avoid excessive nitrogen fertilization</li>
                          <li>Use certified disease-free seeds</li>
                          <li>Practice field sanitation</li>
                        </>
                      )}
                      {prediction.includes('wilt') && (
                        <>
                          <li>Use wilt-resistant finger millet varieties</li>
                          <li>Ensure proper soil drainage</li>
                          <li>Avoid overwatering and waterlogging</li>
                          <li>Practice crop rotation with non-susceptible crops</li>
                          <li>Remove and destroy infected plants</li>
                          <li>Maintain balanced soil fertility</li>
                          <li>Use soil fumigation in severe cases</li>
                        </>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Crop Modal */}
        {showCropModal && (
          <div className="modal-overlay">
            <div className="crop-modal-content">
              <button className="modal-close" onClick={cancelCrop}>×</button>
              <h2 className="modal-title">Crop Your Image</h2>
              
              <div className="crop-container">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              
              <div className="crop-controls">
                <label className="zoom-label">
                  Zoom
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(e.target.value)}
                    className="zoom-slider"
                  />
                </label>
              </div>
              
              <div className="crop-buttons">
                <button className="cancel-crop-button" onClick={cancelCrop}>
                  Cancel
                </button>
                <button className="apply-crop-button" onClick={createCroppedImage}>
                  ✓ Apply & Analyze
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Disease List Modal */}
        {showDiseaseList && (
          <div className="disease-list-modal">
            <div className="disease-list-content">
              <div className="disease-list-header">
                <h2>📋 Crop-Disease Reference Guide</h2>
                <button className="close-modal-button" onClick={() => setShowDiseaseList(false)}>✕</button>
              </div>
              <div className="disease-list-body">
                
                <div className="crop-disease-section">
                  <h3>🥔 Vegetables</h3>
                  
                  <div className="crop-item">
                    <h4>🥔 Potato</h4>
                    <ul>
                      <li>Early Blight</li>
                      <li>Late Blight</li>
                      <li>Healthy</li>
                    </ul>
                  </div>

                  <div className="crop-item">
                    <h4>🍅 Tomato</h4>
                    <ul>
                      <li>Bacterial Spot</li>
                      <li>Early Blight</li>
                      <li>Late Blight</li>
                      <li>Leaf Mold</li>
                      <li>Septoria Leaf Spot</li>
                      <li>Spider Mites (Two-spotted)</li>
                      <li>Target Spot</li>
                      <li>Yellow Leaf Curl Virus</li>
                      <li>Mosaic Virus</li>
                      <li>Healthy</li>
                    </ul>
                  </div>

                  <div className="crop-item">
                    <h4>🌶️ Bell Pepper</h4>
                    <ul>
                      <li>Bacterial Spot</li>
                      <li>Healthy</li>
                    </ul>
                  </div>
                </div>

                <div className="crop-disease-section">
                  <h3>🍎 Fruits</h3>
                  
                  <div className="crop-item">
                    <h4>🍎 Apple</h4>
                    <ul>
                      <li>Apple Scab</li>
                      <li>Black Rot</li>
                      <li>Cedar Apple Rust</li>
                      <li>Healthy</li>
                    </ul>
                  </div>

                  <div className="crop-item">
                    <h4>🥭 Mango</h4>
                    <ul>
                      <li>Anthracnose</li>
                      <li>Bacterial Canker</li>
                      <li>Cutting Weevil</li>
                      <li>Die Back</li>
                      <li>Gall Midge</li>
                      <li>Powdery Mildew</li>
                      <li>Sooty Mould</li>
                      <li>Healthy</li>
                    </ul>
                  </div>

                  <div className="crop-item">
                    <h4>🎋 Sugarcane</h4>
                    <ul>
                      <li>Bacterial Blight</li>
                      <li>Red Rot</li>
                      <li>Rust</li>
                      <li>Mosaic</li>
                      <li>Yellow Leaf Disease</li>
                      <li>Healthy</li>
                    </ul>
                  </div>
                </div>

                <div className="crop-disease-section">
                  <h3>🌾 Grains</h3>
                  
                  <div className="crop-item">
                    <h4>🌾 Rice</h4>
                    <ul>
                      <li>Bacterial Leaf Blight</li>
                      <li>Brown Spot</li>
                      <li>Leaf Smut</li>
                      <li>Healthy</li>
                    </ul>
                  </div>

                  <div className="crop-item">
                    <h4>🌾 Wheat</h4>
                    <ul>
                      <li>Brown Rust</li>
                      <li>Yellow Rust</li>
                      <li>Healthy</li>
                    </ul>
                  </div>

                  <div className="crop-item">
                    <h4>🌾 Finger Millet</h4>
                    <ul>
                      <li>Blast (Downy)</li>
                      <li>Mottle</li>
                      <li>Seedling Disease</li>
                      <li>Smut</li>
                      <li>Wilt</li>
                      <li>Healthy</li>
                    </ul>
                  </div>

                  <div className="crop-item">
                    <h4>🌽 Maize (Corn)</h4>
                    <ul>
                      <li>Common Rust</li>
                      <li>Gray Leaf Spot</li>
                      <li>Northern Leaf Blight</li>
                      <li>Healthy</li>
                    </ul>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        <footer className="footer">
          <p>Powered by TensorFlow & React | Deep Learning CNN Model</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
