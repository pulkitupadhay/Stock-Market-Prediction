
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const STOCKS = [
    { symbol: 'AXISBANK.NS', name: 'Axis Bank' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel' },
    { symbol: 'BRITANNIA.NS', name: 'Britannia Industries' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
    { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
    { symbol: 'INFY.NS', name: 'Infosys' },
    { symbol: 'ITC.NS', name: 'ITC Limited' },
    { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank' },
    { symbol: 'MARUTI.NS', name: 'Maruti Suzuki' },
    { symbol: 'ONGC.NS', name: 'Oil and Natural Gas Corporation' },
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
    { symbol: 'SBIN.NS', name: 'State Bank of India' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services' },
    { symbol: 'WIPRO.NS', name: 'Wipro' }
];

function callPythonService(action, symbol) {
    return new Promise((resolve, reject) => {
        const pythonPath = 'python3';
        const scriptPath = path.join(__dirname, 'ml_service.py');
        
        const python = spawn(pythonPath, [scriptPath, action, symbol]);
        
        let dataString = '';
        let errorString = '';
        
        python.stdout.on('data', (data) => {
            dataString += data.toString();
        });
        
        python.stderr.on('data', (data) => {
            errorString += data.toString();
        });
        
        python.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python process exited with code ${code}`);
                console.error('Error:', errorString);
                reject(new Error(errorString || 'Python process failed'));
                return;
            }
            
            try {
                const result = JSON.parse(dataString);
                resolve(result);
            } catch (err) {
                console.error('Failed to parse Python output:', dataString);
                reject(new Error('Failed to parse Python output'));
            }
        });
        
        python.on('error', (err) => {
            console.error('Failed to start Python process:', err);
            reject(err);
        });
    });
}

// 
app.get('/api/stocks', (req, res) => {
    console.log('GET /api/stocks');
    res.json({
        success: true,
        stocks: STOCKS
    });
});

app.get('/api/stock/:symbol', async (req, res) => {
    const { symbol } = req.params;
    console.log(`GET /api/stock/${symbol}`);
    
    try {
        const result = await callPythonService('stock', symbol);
        
        if (result.error) {
            return res.status(500).json({
                success: false,
                error: result.error
            });
        }
        
        res.json(result);
    } catch (err) {
        console.error('Error fetching stock data:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

app.get('/api/predict/:symbol', async (req, res) => {
    const { symbol } = req.params;
    console.log(`GET /api/predict/${symbol}`);
    
    try {
        const result = await callPythonService('predict', symbol);
        
        if (result.error) {
            return res.status(500).json({
                success: false,
                error: result.error
            });
        }
        
        res.json(result);
    } catch (err) {
        console.error('Error generating predictions:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

app.get('/api/risk/:symbol', async (req, res) => {
    const { symbol } = req.params;
    console.log(`GET /api/risk/${symbol}`);

    try {
        const result = await callPythonService('risk', symbol);

        if (result.error) {
            return res.status(500).json({
                success: false,
                error: result.error
            });
        }

        res.json(result);
    } catch (err) {
        console.error('Error calculating risk:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        stocks: STOCKS.length
    });
});

// Start server
app.listen(PORT, () => {
    console.log('============================================================');
    console.log('🚀 Stock Prediction API - Node.js/Express');
    console.log('============================================================');
    console.log(`   Server: http://localhost:${PORT}`);
    console.log(`   Stocks: ${STOCKS.length} available`);
    console.log(`   ML Service: Python (TensorFlow/Keras)`);
    console.log('============================================================');
});

