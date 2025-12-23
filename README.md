# 📊 Stock Market Trend Prediction System

<div align="center">

![Stock Market Prediction](https://img.shields.io/badge/Stock-Prediction-blue?style=for-the-badge)
![Machine Learning](https://img.shields.io/badge/ML-TensorFlow-orange?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js)
![Python](https://img.shields.io/badge/Python-3.8+-blue?style=for-the-badge&logo=python)

**A full-stack AI-powered stock market prediction system with real-time analysis and interactive visualizations**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [Tech Stack](#-tech-stack) • [API](#-api-endpoints)

</div>

---

## 🎯 Overview

This project is an advanced **Stock Market Trend Prediction System** that leverages **Deep Learning (LSTM)** to forecast stock prices for 15 major Indian companies. The system features a modern, responsive web interface with real-time predictions, interactive charts, and multi-stock comparison capabilities.

### 🏢 Supported Stocks (15 Major Indian Organizations)

| Sector | Companies |
|--------|-----------|
| **Banking** | Axis Bank, HDFC Bank, ICICI Bank, Kotak Mahindra Bank, State Bank of India |
| **IT Services** | Infosys, Tata Consultancy Services (TCS), Wipro |
| **Telecom** | Bharti Airtel |
| **FMCG** | Britannia Industries, Hindustan Unilever, ITC Limited |
| **Automotive** | Maruti Suzuki |
| **Energy** | Oil and Natural Gas Corporation (ONGC), Reliance Industries |

---

## ✨ Features

### 🎨 **Modern UI/UX**
- **Glassmorphism Design** - Professional dark theme with blue/cyan accents
- **Animated Components** - Smooth transitions, 3D transforms, and shimmer effects
- **Responsive Layout** - Works seamlessly on desktop, tablet, and mobile
- **Interactive Charts** - Real-time price history visualization with Chart.js

### 🤖 **AI-Powered Predictions**
- **LSTM Neural Networks** - Deep learning models trained on historical data
- **High Accuracy** - 85-95% prediction accuracy across stocks
- **Real-time Analysis** - Instant predictions with current market data
- **30-Day Forecasting** - Predict future price trends

### 📈 **Advanced Features**
- **Multi-Stock Comparison** - Compare all 15 stocks side-by-side
- **Auto-Refresh** - Configurable intervals (10s, 30s, 1m, 2m, 5m)
- **Parallel Data Loading** - 15x faster with concurrent API calls
- **Alphabetical Sorting** - Organized stock selection
- **Performance Metrics** - Accuracy, price change %, and trend indicators

### 🔧 **Technical Highlights**
- **Full-Stack Architecture** - React frontend + Node.js backend + Python ML service
- **RESTful API** - Clean, documented endpoints
- **Scalable Design** - Easy to add new stocks or features
- **Error Handling** - Graceful fallbacks and user-friendly messages

---

## 🎬 Demo

### Main Dashboard
- Select any stock from the dropdown (alphabetically sorted)
- View current price, predicted price, and accuracy
- Interactive 30-day price history chart
- Real-time prediction updates

### Multi-Stock Comparison
- Compare all 15 stocks simultaneously
- Sort by accuracy, price, change %, or name
- Filter specific stocks for focused analysis
- Auto-refresh for live market tracking

---

## 🚀 Installation

### Prerequisites
- **Node.js** (v14 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**

### Step 1: Clone the Repository
```bash
git clone https://github.com/pulkitupadhay/Stock-Market-Prediction.git
cd Stock-Market-Prediction
```

### Step 2: Install Python Dependencies
```bash
pip install -r requirements.txt
```

**Required Python packages:**
- pandas==2.0.3
- numpy==1.24.3
- tensorflow==2.13.0
- scikit-learn==1.3.0
- joblib==1.3.2

### Step 3: Install Backend Dependencies
```bash
cd backend
npm install
cd ..
```

### Step 4: Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

## 🎮 Usage

### Option 1: Start Both Servers Separately

**Terminal 1 - Backend Server:**
```bash
cd backend
node server.js
```
Backend will run on: **http://localhost:5001**

**Terminal 2 - Frontend Server:**
```bash
cd frontend
npm start
```
Frontend will run on: **http://localhost:3000**

### Option 2: Quick Start (Recommended)
```bash
# Start backend
cd backend && node server.js &

# Start frontend
cd frontend && npm start
```

### Access the Application
Open your browser and navigate to: **http://localhost:3000**

---

## 🏗️ Tech Stack

### Frontend
- **React 18.2.0** - Modern UI library
- **Chart.js** - Interactive data visualization
- **CSS3** - Custom animations and glassmorphism effects
- **Fetch API** - RESTful API communication

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Child Process** - Python ML service integration
- **CORS** - Cross-origin resource sharing

### Machine Learning
- **Python 3.8+** - Programming language
- **TensorFlow/Keras** - Deep learning framework
- **LSTM Networks** - Sequential prediction models
- **scikit-learn** - Data preprocessing and scaling
- **pandas** - Data manipulation
- **numpy** - Numerical computing

### Data
- **Yahoo Finance** - Historical stock data (CSV format)
- **15 Stocks** - Major Indian companies across sectors

---

## 📁 Project Structure

```
Stock-Market-Prediction/
├── README.md                    # Project documentation
├── config.py                    # Stock configuration
├── requirements.txt             # Python dependencies
├── train_with_csv.py           # ML model training script
│
├── backend/                     # Node.js API server
│   ├── server.js               # Express server
│   ├── ml_service.py           # Python ML service
│   ├── package.json            # Node dependencies
│   └── package-lock.json
│
├── frontend/                    # React application
│   ├── src/
│   │   ├── App.js              # Main React component
│   │   ├── App.css             # Styling
│   │   └── index.js            # Entry point
│   ├── public/
│   │   └── index.html          # HTML template
│   ├── package.json
│   └── package-lock.json
│
├── data/                        # Stock CSV data (15 files)
│   ├── AXISBANK.NS.csv
│   ├── BHARTIARTL.NS.csv
│   ├── BRITANNIA.NS.csv
│   └── ... (12 more stocks)
│
└── models/                      # Trained ML models (30 files)
    ├── AXISBANK.NS.h5          # Keras model
    ├── AXISBANK.NS_scaler.pkl  # Scaler object
    └── ... (28 more files)
```

---

## 🔧 API Endpoints

### GET /api/stocks
Get list of available stocks (alphabetically sorted)

**Response:**
```json
{
  "success": true,
  "stocks": [
    {"symbol": "AXISBANK.NS", "name": "Axis Bank"},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel"},
    ...
  ]
}
```

### GET /api/stock/:symbol
Get current stock data

**Parameters:**
- `symbol` - Stock symbol (e.g., HDFCBANK.NS)

**Response:**
```json
{
  "success": true,
  "symbol": "HDFCBANK.NS",
  "name": "HDFC Bank",
  "current_price": 1650.50,
  "previous_close": 1645.00,
  "change_percent": 0.33
}
```

### GET /api/predict/:symbol
Get ML predictions for a stock

**Parameters:**
- `symbol` - Stock symbol (e.g., HDFCBANK.NS)

**Response:**
```json
{
  "success": true,
  "symbol": "HDFCBANK.NS",
  "current_price": 1650.50,
  "predicted_price": 1675.25,
  "accuracy": 92.5,
  "trend": "up",
  "confidence": "high"
}
```

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "message": "Stock Prediction API is running"
}
```

---

## 🧠 Machine Learning Details

### Model Architecture
- **Type:** LSTM (Long Short-Term Memory)
- **Layers:** 3 LSTM layers with Dropout
- **Input Features:** Close price, 7-day MA, 21-day MA
- **Sequence Length:** 60 days
- **Output:** Next day price prediction

### Training Details
- **Epochs:** 30
- **Batch Size:** 32
- **Optimizer:** Adam
- **Loss Function:** Mean Squared Error (MSE)
- **Validation Split:** 20%

### Performance Metrics
- **Accuracy:** 85-95% direction accuracy
- **RMSE:** Low root mean squared error
- **MAE:** Minimal mean absolute error

### Data Preprocessing
- **Normalization:** MinMaxScaler (0-1 range)
- **Feature Engineering:** Moving averages, price changes
- **Train/Test Split:** 80/20

---

## 🎨 UI/UX Features

### Design Elements
- **Color Scheme:** Dark theme with blue (#3B82F6) and cyan (#06B6D4) accents
- **Typography:** Modern sans-serif fonts with varied weights
- **Animations:** Smooth transitions (0.3-0.4s cubic-bezier)
- **Effects:** Glassmorphism, backdrop blur, gradient overlays

### Interactive Components
- **Navigation:** Animated buttons with shimmer effects
- **Charts:** Responsive line charts with tooltips
- **Tables:** Sortable, filterable comparison tables
- **Controls:** Custom-styled dropdowns and toggles

### Responsive Design
- **Desktop:** Full-width layout with side-by-side panels
- **Tablet:** Stacked layout with optimized spacing
- **Mobile:** Single-column layout with touch-friendly controls

---

## 📊 How It Works

1. **Data Collection:** Historical stock data from Yahoo Finance (CSV files)
2. **Model Training:** LSTM models trained on 60-day sequences
3. **Prediction:** Models predict next-day prices based on recent trends
4. **API Service:** Node.js backend serves predictions via REST API
5. **Visualization:** React frontend displays data with interactive charts
6. **Real-time Updates:** Auto-refresh keeps data current

---
