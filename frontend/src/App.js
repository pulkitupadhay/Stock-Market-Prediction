import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState('');
  const [stockData, setStockData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allStocksData, setAllStocksData] = useState({});
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'comparison', 'risk'

  // Comparison page state
  const [comparisonData, setComparisonData] = useState([]);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [sortBy, setSortBy] = useState('accuracy'); // 'accuracy', 'price', 'change', 'name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [autoRefresh, setAutoRefresh] = useState(false); // Auto-refresh toggle
  const [refreshInterval, setRefreshInterval] = useState(30); // Refresh interval in seconds

  // Risk analysis state
  const [allRiskData, setAllRiskData] = useState([]);
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [selectedRiskStock, setSelectedRiskStock] = useState('');
  const [riskSortBy, setRiskSortBy] = useState('risk_score'); // 'risk_score', 'volatility', 'name'
  const [riskSortOrder, setRiskSortOrder] = useState('desc');

  // Fetch available stocks
  useEffect(() => {
    console.log('Fetching stocks list...');
    fetch('/api/stocks?t=' + Date.now())
      .then(res => res.json())
      .then(data => {
        console.log('Stocks received:', data);
        if (data.success && data.stocks.length > 0) {
          setStocks(data.stocks);
          // Set first stock as default
          setSelectedStock(data.stocks[0].symbol);
          // Fetch all stocks data for comparison (DISABLED - Feature in progress)
          // fetchAllStocksData(data.stocks);
        }
      })
      .catch(err => console.error('Error:', err));
  }, []);

  // Fetch data when stock changes
  useEffect(() => {
    if (selectedStock) {
      fetchData();
    }
  }, [selectedStock]);

  // Auto-refresh for comparison page
  useEffect(() => {
    let intervalId;

    if (currentPage === 'comparison' && autoRefresh && stocks.length > 0) {
      // Load data immediately when auto-refresh is enabled
      if (comparisonData.length === 0) {
        loadComparisonData();
      }

      // Set up interval for auto-refresh
      intervalId = setInterval(() => {
        loadComparisonData();
      }, refreshInterval * 1000);
    }

    // Cleanup interval on unmount or when dependencies change
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentPage, autoRefresh, refreshInterval, stocks]);

  // Fetch all stocks data for comparison
  const fetchAllStocksData = async (stocksList) => {
    const data = {};
    for (const stock of stocksList) {
      try {
        const predRes = await fetch(`/api/predict/${stock.symbol}`);
        const predJson = await predRes.json();
        if (predJson.success) {
          data[stock.symbol] = predJson.predictions;
        }
      } catch (err) {
        console.error(`Error fetching ${stock.symbol}:`, err);
      }
    }
    setAllStocksData(data);
  };

  // Calculate risk analysis
  const calculateRiskAnalysis = (predData) => {
    if (!predData) return null;

    const actual = predData.actual || [];
    const predicted = predData.predicted || [];

    // Calculate volatility (standard deviation of price changes)
    const priceChanges = [];
    for (let i = 1; i < actual.length; i++) {
      priceChanges.push(Math.abs(actual[i] - actual[i-1]) / actual[i-1] * 100);
    }
    const avgVolatility = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;

    // Calculate prediction error
    let totalError = 0;
    for (let i = 0; i < Math.min(actual.length, predicted.length); i++) {
      totalError += Math.abs(actual[i] - predicted[i]) / actual[i];
    }
    const avgError = (totalError / Math.min(actual.length, predicted.length)) * 100;

    // Calculate trend consistency
    let upDays = 0;
    let downDays = 0;
    for (let i = 1; i < actual.length; i++) {
      if (actual[i] > actual[i-1]) upDays++;
      else downDays++;
    }
    const trendConsistency = Math.abs(upDays - downDays) / actual.length * 100;

    // Calculate overall risk score (0-100, higher = riskier)
    const riskScore = Math.min(100, Math.round(
      (avgVolatility * 0.4) + (avgError * 0.4) + ((100 - trendConsistency) * 0.2)
    ));

    let riskLevel = 'Low';
    if (riskScore > 60) riskLevel = 'High';
    else if (riskScore > 30) riskLevel = 'Medium';

    return {
      score: riskScore,
      level: riskLevel,
      volatility: avgVolatility.toFixed(2),
      predictionError: avgError.toFixed(2),
      trendConsistency: trendConsistency.toFixed(2)
    };
  };

  const fetchData = async () => {
    setLoading(true);

    // Fetch stock data
    try {
      const stockRes = await fetch(`/api/stock/${selectedStock}`);
      const stockJson = await stockRes.json();
      if (stockJson.success) {
        setStockData(stockJson);
      }
    } catch (err) {
      console.error('Error fetching stock:', err);
    }

    // Fetch predictions
    try {
      const predRes = await fetch(`/api/predict/${selectedStock}`);
      const predJson = await predRes.json();
      if (predJson.success) {
        setPredictions(predJson);
        // Calculate risk analysis (DISABLED - Feature in progress)
        // const risk = calculateRiskAnalysis(predJson.predictions);
        // setRiskAnalysis(risk);
      } else {
        setPredictions(null);
        setRiskAnalysis(null);
      }
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setPredictions(null);
      setRiskAnalysis(null);
    }

    setLoading(false);
  };

  const latestData = stockData?.data && stockData.data.length > 0 ? stockData.data[stockData.data.length - 1] : null;
  const previousData = stockData?.data && stockData.data.length > 1 ? stockData.data[stockData.data.length - 2] : null;
  const priceChange = latestData && previousData ? latestData.Close - previousData.Close : 0;
  const priceChangePercent = previousData && previousData.Close ? (priceChange / previousData.Close) * 100 : 0;

  // Load comparison data when switching to comparison page
  useEffect(() => {
    if (currentPage === 'comparison' && stocks.length > 0 && comparisonData.length === 0) {
      loadComparisonData();
    }
  }, [currentPage, stocks]);

  // Function to load comparison data
  // Optimized: Load all stocks in parallel for faster refresh
  const loadComparisonData = async () => {
    setLoadingComparison(true);

    try {
      // Fetch all stocks in parallel instead of sequentially
      const promises = stocks.map(async (stock) => {
        try {
          // Fetch stock data and predictions in parallel
          const [stockRes, predRes] = await Promise.all([
            fetch(`/api/stock/${stock.symbol}`),
            fetch(`/api/predict/${stock.symbol}`)
          ]);

          const [stockJson, predJson] = await Promise.all([
            stockRes.json(),
            predRes.json()
          ]);

          if (stockJson.success && predJson.success) {
            const latestData = stockJson.data[stockJson.data.length - 1];
            const previousData = stockJson.data[stockJson.data.length - 2];
            const priceChange = latestData.Close - previousData.Close;
            const priceChangePercent = (priceChange / previousData.Close) * 100;

            return {
              symbol: stock.symbol,
              name: stock.name,
              currentPrice: latestData.Close,
              predictedPrice: predJson.predictions.latest_prediction,
              priceChange: priceChange,
              priceChangePercent: priceChangePercent,
              accuracy: predJson.predictions.direction_accuracy,
              sentiment: predJson.predictions.sentiment?.sentiment_label || 'Neutral',
              volume: latestData.Volume,
              high: latestData.High,
              low: latestData.Low
            };
          }
          return null;
        } catch (err) {
          console.error(`Error loading ${stock.symbol}:`, err);
          return null;
        }
      });

      // Wait for all promises to complete
      const results = await Promise.all(promises);

      // Filter out null results
      const data = results.filter(item => item !== null);

      setComparisonData(data);
    } catch (err) {
      console.error('Error loading comparison data:', err);
    } finally {
      setLoadingComparison(false);
    }
  };

  // Toggle stock selection
  const toggleStockSelection = (symbol) => {
    setSelectedStocks(prev =>
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  // Load risk analysis data for all stocks
  const loadRiskData = async () => {
    setLoadingRisk(true);

    try {
      // Fetch risk analysis for all stocks in parallel
      const promises = stocks.map(async (stock) => {
        try {
          const response = await fetch(`/api/risk/${stock.symbol}`);
          const data = await response.json();

          if (data.success && data.risk_analysis) {
            return {
              symbol: stock.symbol,
              name: stock.name,
              ...data.risk_analysis
            };
          }
          return null;
        } catch (err) {
          console.error(`Error loading risk for ${stock.symbol}:`, err);
          return null;
        }
      });

      // Wait for all promises to complete
      const results = await Promise.all(promises);

      // Filter out null results
      const data = results.filter(item => item !== null);

      setAllRiskData(data);
    } catch (err) {
      console.error('Error loading risk data:', err);
    } finally {
      setLoadingRisk(false);
    }
  };

  // Render different pages based on currentPage
  const renderPage = () => {
    switch(currentPage) {
      case 'home':
        return renderHomePage();
      case 'comparison':
        return renderComparisonPage();
      case 'risk':
        return renderRiskPage();
      default:
        return renderHomePage();
    }
  };

  // HOME PAGE
  const renderHomePage = () => (
    <div className="page-container">
      <div className="container">
        <div className="card">
          <select
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            className="stock-select"
          >
            {stocks.map(stock => (
              <option key={stock.symbol} value={stock.symbol}>
                {stock.name} ({stock.symbol})
              </option>
            ))}
          </select>
        </div>

        {loading && <div className="loading">Loading...</div>}

        {/* Stock Info */}
        {latestData && latestData.Close !== undefined && (
          <div className="card">
            <h2>{selectedStock}</h2>
            <div className="price-section">
              <div className="price">₹{latestData.Close.toFixed(2)}</div>
              <div className={`change ${priceChange >= 0 ? 'positive' : 'negative'}`}>
                {priceChange >= 0 ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}
                ({Math.abs(priceChangePercent).toFixed(2)}%)
              </div>
            </div>
            <div className="stats">
              <div className="stat">
                <div className="label">Open</div>
                <div className="value">₹{latestData.Open?.toFixed(2) || 'N/A'}</div>
              </div>
              <div className="stat">
                <div className="label">High</div>
                <div className="value">₹{latestData.High?.toFixed(2) || 'N/A'}</div>
              </div>
              <div className="stat">
                <div className="label">Low</div>
                <div className="value">₹{latestData.Low?.toFixed(2) || 'N/A'}</div>
              </div>
              <div className="stat">
                <div className="label">Volume</div>
                <div className="value">{latestData.Volume ? (latestData.Volume / 1000000).toFixed(2) + 'M' : 'N/A'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Predictions */}
        {predictions && predictions.predictions && (
          <div className="card prediction-card">
            <h2>🤖 AI Prediction</h2>
            <div className="prediction-grid">
              <div>
                <div className="label">Predicted Price</div>
                <div className="pred-price">
                  ₹{predictions.predictions.latest_prediction?.toFixed(2) || 'N/A'}
                </div>
              </div>
              <div>
                <div className="label">Direction Accuracy</div>
                <div className="accuracy">
                  {predictions.predictions.direction_accuracy?.toFixed(1) || 'N/A'}%
                </div>
              </div>
              <div>
                <div className="label">Sentiment Analysis</div>
                <div className={`sentiment-badge ${predictions.predictions.sentiment?.sentiment_label?.toLowerCase() || 'neutral'}`}>
                  {predictions.predictions.sentiment?.sentiment_label || 'Neutral'}
                </div>
              </div>
            </div>
          </div>
        )}

        {!predictions && !loading && (
          <div className="card warning">
            ⚠️ Model not trained for {selectedStock}.
            Run: <code>python simple_train.py</code>
          </div>
        )}

        {/* Price Comparison Chart */}
        {predictions && predictions.predictions && predictions.predictions.dates && predictions.predictions.actual && predictions.predictions.predicted && (
          <div className="card">
            <h2>📊 Price Comparison Chart</h2>
            <div className="chart-header">
              <div className="chart-info">
                <span className="chart-period">Last 30 Days Analysis</span>
                <span className="chart-accuracy">Accuracy: {predictions.predictions.direction_accuracy?.toFixed(1) || 'N/A'}%</span>
              </div>
            </div>
            <div className="chart">
              <div className="chart-main">
                <div className="chart-y-axis">
                  {(() => {
                    const actualData = predictions.predictions.actual.slice(-30);
                    const predictedData = predictions.predictions.predicted.slice(-30);
                    const max = Math.max(...actualData, ...predictedData);
                    const min = Math.min(...actualData, ...predictedData);
                    const range = max - min || 1;
                    const steps = 5;

                    return Array.from({length: steps}, (_, i) => {
                      const value = max - (range / (steps - 1)) * i;
                      return (
                        <div key={i} className="y-axis-label">
                          ₹{value.toFixed(0)}
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="chart-content">
                  <div className="chart-grid">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} className="grid-line" style={{top: `${i * 25}%`}}></div>
                    ))}
                  </div>
                  <div className="chart-container">
                    {predictions.predictions.dates.slice(-30).map((date, i) => {
                      const actual = predictions.predictions.actual[predictions.predictions.actual.length - 30 + i];
                      const predicted = predictions.predictions.predicted[predictions.predictions.predicted.length - 30 + i];

                      if (actual === undefined || predicted === undefined) return null;

                      const max = Math.max(...predictions.predictions.actual.slice(-30), ...predictions.predictions.predicted.slice(-30));
                      const min = Math.min(...predictions.predictions.actual.slice(-30), ...predictions.predictions.predicted.slice(-30));
                      const range = max - min || 1;
                      const actualHeight = ((actual - min) / range) * 100;
                      const predictedHeight = ((predicted - min) / range) * 100;

                      return (
                        <div key={i} className="chart-bar-group">
                          <div className="chart-bars">
                            <div
                              className="bar actual"
                              style={{height: `${actualHeight}%`}}
                              title={`Actual: ₹${actual.toFixed(2)}`}
                            >
                              <span className="bar-tooltip">₹{actual.toFixed(0)}</span>
                            </div>
                            <div
                              className="bar predicted"
                              style={{height: `${predictedHeight}%`}}
                              title={`Predicted: ₹${predicted.toFixed(2)}`}
                            >
                              <span className="bar-tooltip">₹{predicted.toFixed(0)}</span>
                            </div>
                          </div>
                          {(i % 2 === 0 || i === predictions.predictions.dates.slice(-30).length - 1) && (
                            <div className="chart-label">
                              {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="chart-legend">
                <span><span className="legend-box actual"></span> Actual Price</span>
                <span><span className="legend-box predicted"></span> Predicted Price</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );

  // COMPARISON PAGE
  const renderComparisonPage = () => {
    // Sort comparison data
    const sortedData = [...comparisonData].sort((a, b) => {
      let aVal, bVal;

      switch(sortBy) {
        case 'accuracy':
          aVal = a.accuracy;
          bVal = b.accuracy;
          break;
        case 'price':
          aVal = a.currentPrice;
          bVal = b.currentPrice;
          break;
        case 'change':
          aVal = a.priceChangePercent;
          bVal = b.priceChangePercent;
          break;
        case 'name':
          aVal = a.name;
          bVal = b.name;
          return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        default:
          aVal = a.accuracy;
          bVal = b.accuracy;
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    // Filter selected stocks
    const displayData = selectedStocks.length > 0
      ? sortedData.filter(s => selectedStocks.includes(s.symbol))
      : sortedData;

    return (
      <div className="page-container">
        <h2 className="page-title">📊 Multi-Stock Comparison</h2>
        <p className="page-subtitle">Compare all {stocks.length} stocks side-by-side in real-time</p>

        <div className="container">
          {/* Controls */}
          <div className="card">
            <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center'}}>
                <div>
                  <label style={{marginRight: '10px', color: 'var(--text-secondary)', fontWeight: '600'}}>Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="comparison-select"
                  >
                    <option value="accuracy">Accuracy</option>
                    <option value="price">Current Price</option>
                    <option value="change">Price Change %</option>
                    <option value="name">Name</option>
                  </select>
                </div>

                <div>
                  <label style={{marginRight: '10px', color: 'var(--text-secondary)', fontWeight: '600'}}>Order:</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="comparison-select"
                  >
                    <option value="desc">High to Low</option>
                    <option value="asc">Low to High</option>
                  </select>
                </div>

                <button
                  onClick={loadComparisonData}
                  disabled={loadingComparison}
                  className="refresh-button"
                >
                  🔄 {loadingComparison ? 'Loading...' : 'Refresh Now'}
                </button>

                {selectedStocks.length > 0 && (
                  <button
                    onClick={() => setSelectedStocks([])}
                    className="clear-button"
                  >
                    Clear Selection ({selectedStocks.length})
                  </button>
                )}
              </div>

              <div style={{display: 'flex', gap: '15px', alignItems: 'center', padding: '10px 15px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)'}}>
                <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: '600'}}>
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    style={{width: '18px', height: '18px', cursor: 'pointer'}}
                  />
                  Auto-Refresh
                </label>
                {autoRefresh && (
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    className="comparison-select"
                    style={{minWidth: '100px'}}
                  >
                    <option value="10">10s</option>
                    <option value="30">30s</option>
                    <option value="60">1m</option>
                    <option value="120">2m</option>
                    <option value="300">5m</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {loadingComparison && (
            <div className="card" style={{textAlign: 'center', padding: '40px'}}>
              <div className="loading">Loading comparison data...</div>
            </div>
          )}

          {!loadingComparison && displayData.length === 0 && (
            <div className="card" style={{textAlign: 'center', padding: '40px'}}>
              <p style={{color: 'var(--text-secondary)'}}>No data available. Click "Refresh Data" to load.</p>
            </div>
          )}

          {/* Comparison Table */}
          {!loadingComparison && displayData.length > 0 && (
            <div className="card" style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{borderBottom: '2px solid var(--border)'}}>
                    <th style={{padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600'}}>Select</th>
                    <th style={{padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600'}}>Stock</th>
                    <th style={{padding: '12px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: '600'}}>Current Price</th>
                    <th style={{padding: '12px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: '600'}}>Predicted</th>
                    <th style={{padding: '12px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: '600'}}>Change</th>
                    <th style={{padding: '12px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: '600'}}>Accuracy</th>
                    <th style={{padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: '600'}}>Sentiment</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((stock, index) => (
                    <tr
                      key={stock.symbol}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: selectedStocks.includes(stock.symbol) ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{padding: '12px'}}>
                        <input
                          type="checkbox"
                          checked={selectedStocks.includes(stock.symbol)}
                          onChange={() => toggleStockSelection(stock.symbol)}
                          style={{cursor: 'pointer', width: '18px', height: '18px'}}
                        />
                      </td>
                      <td style={{padding: '12px'}}>
                        <div style={{fontWeight: 'bold', color: 'var(--text-primary)'}}>{stock.name}</div>
                        <div style={{fontSize: '0.85em', color: 'var(--text-muted)'}}>{stock.symbol}</div>
                      </td>
                      <td style={{padding: '12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary)'}}>
                        ₹{stock.currentPrice?.toFixed(2) || 'N/A'}
                      </td>
                      <td style={{padding: '12px', textAlign: 'right', color: 'var(--accent-cyan)'}}>
                        ₹{stock.predictedPrice?.toFixed(2) || 'N/A'}
                      </td>
                      <td style={{padding: '12px', textAlign: 'right'}}>
                        <div style={{color: stock.priceChange >= 0 ? 'var(--success)' : 'var(--danger)'}}>
                          {stock.priceChange >= 0 ? '▲' : '▼'} {Math.abs(stock.priceChangePercent || 0).toFixed(2)}%
                        </div>
                      </td>
                      <td style={{padding: '12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-cyan)'}}>
                        {stock.accuracy?.toFixed(1) || 'N/A'}%
                      </td>
                      <td style={{padding: '12px', textAlign: 'center'}}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.85em',
                          fontWeight: 'bold',
                          background: stock.sentiment === 'Positive' ? 'rgba(34, 197, 94, 0.2)' :
                                     stock.sentiment === 'Negative' ? 'rgba(239, 68, 68, 0.2)' :
                                     'rgba(156, 163, 175, 0.2)',
                          color: stock.sentiment === 'Positive' ? '#22c55e' :
                                stock.sentiment === 'Negative' ? '#ef4444' :
                                '#9ca3af'
                        }}>
                          {stock.sentiment}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary Cards */}
          {!loadingComparison && displayData.length > 0 && (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px'}}>
              <div className="card">
                <h3 style={{marginBottom: '10px', color: 'var(--text-secondary)', fontSize: '0.9em'}}>📈 Best Performer</h3>
                <div style={{fontSize: '1.5em', fontWeight: 'bold', color: 'var(--success)'}}>
                  {displayData.reduce((max, s) => (s.priceChangePercent || 0) > (max.priceChangePercent || 0) ? s : max, displayData[0]).name}
                </div>
                <div style={{color: 'var(--text-muted)', fontSize: '0.9em'}}>
                  +{(displayData.reduce((max, s) => (s.priceChangePercent || 0) > (max.priceChangePercent || 0) ? s : max, displayData[0]).priceChangePercent || 0).toFixed(2)}%
                </div>
              </div>

              <div className="card">
                <h3 style={{marginBottom: '10px', color: 'var(--text-secondary)', fontSize: '0.9em'}}>🎯 Highest Accuracy</h3>
                <div style={{fontSize: '1.5em', fontWeight: 'bold', color: 'var(--accent-cyan)'}}>
                  {displayData.reduce((max, s) => (s.accuracy || 0) > (max.accuracy || 0) ? s : max, displayData[0]).name}
                </div>
                <div style={{color: 'var(--text-muted)', fontSize: '0.9em'}}>
                  {(displayData.reduce((max, s) => (s.accuracy || 0) > (max.accuracy || 0) ? s : max, displayData[0]).accuracy || 0).toFixed(1)}% accurate
                </div>
              </div>

              <div className="card">
                <h3 style={{marginBottom: '10px', color: 'var(--text-secondary)', fontSize: '0.9em'}}>💰 Most Expensive</h3>
                <div style={{fontSize: '1.5em', fontWeight: 'bold', color: 'var(--accent-yellow)'}}>
                  {displayData.reduce((max, s) => (s.currentPrice || 0) > (max.currentPrice || 0) ? s : max, displayData[0]).name}
                </div>
                <div style={{color: 'var(--text-muted)', fontSize: '0.9em'}}>
                  ₹{(displayData.reduce((max, s) => (s.currentPrice || 0) > (max.currentPrice || 0) ? s : max, displayData[0]).currentPrice || 0).toFixed(2)}
                </div>
              </div>

              <div className="card">
                <h3 style={{marginBottom: '10px', color: 'var(--text-secondary)', fontSize: '0.9em'}}>📊 Average Accuracy</h3>
                <div style={{fontSize: '1.5em', fontWeight: 'bold', color: 'var(--text-primary)'}}>
                  {(displayData.reduce((sum, s) => sum + (s.accuracy || 0), 0) / displayData.length).toFixed(1)}%
                </div>
                <div style={{color: 'var(--text-muted)', fontSize: '0.9em'}}>
                  Across {displayData.length} stocks
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // RISK ANALYSIS PAGE
  const renderRiskPage = () => {
    // Sort risk data
    const sortedRiskData = [...allRiskData].sort((a, b) => {
      let aVal, bVal;

      switch(riskSortBy) {
        case 'risk_score':
          aVal = a.risk_score;
          bVal = b.risk_score;
          break;
        case 'volatility':
          aVal = a.metrics.volatility;
          bVal = b.metrics.volatility;
          break;
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        default:
          aVal = a.risk_score;
          bVal = b.risk_score;
      }

      if (typeof aVal === 'string') {
        return riskSortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return riskSortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return (
      <div className="page-container">
        <h2 className="page-title">⚠️ Risk Analysis Dashboard</h2>
        <p className="page-subtitle">AI-powered risk assessment for your investments</p>

        <div className="container">
          {/* Controls */}
          <div className="card comparison-controls">
            <div className="controls-row">
              <button
                className="load-button"
                onClick={loadRiskData}
                disabled={loadingRisk}
              >
                {loadingRisk ? '⏳ Analyzing...' : '🔄 Analyze All Stocks'}
              </button>

              <div className="sort-controls">
                <label>Sort by:</label>
                <select value={riskSortBy} onChange={(e) => setRiskSortBy(e.target.value)}>
                  <option value="risk_score">Risk Score</option>
                  <option value="volatility">Volatility</option>
                  <option value="name">Name</option>
                </select>

                <button
                  className="sort-order-button"
                  onClick={() => setRiskSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                >
                  {riskSortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loadingRisk && (
            <div className="card" style={{textAlign: 'center', padding: '40px'}}>
              <div className="loading">Analyzing risk for all stocks...</div>
            </div>
          )}

          {/* Risk Analysis Grid */}
          {!loadingRisk && sortedRiskData.length > 0 && (
            <div className="risk-grid">
              {sortedRiskData.map((stock) => (
                <div key={stock.symbol} className="risk-card">
                  {/* Header */}
                  <div className="risk-card-header">
                    <h3>{stock.name}</h3>
                    <span className="risk-symbol">{stock.symbol}</span>
                  </div>

                  {/* Risk Score Gauge */}
                  <div className="risk-gauge-container">
                    <div className="risk-gauge">
                      <div
                        className="risk-gauge-fill"
                        style={{
                          width: `${stock.risk_score}%`,
                          background: stock.risk_color
                        }}
                      ></div>
                    </div>
                    <div className="risk-score-label">
                      <span className="risk-score" style={{color: stock.risk_color}}>
                        {stock.risk_score}
                      </span>
                      <span className="risk-level" style={{color: stock.risk_color}}>
                        {stock.risk_level} Risk
                      </span>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="risk-metrics">
                    <div className="risk-metric">
                      <span className="metric-label">Volatility</span>
                      <span className="metric-value">{stock.metrics.volatility.toFixed(1)}%</span>
                    </div>
                    <div className="risk-metric">
                      <span className="metric-label">Max Drawdown</span>
                      <span className="metric-value">{stock.metrics.max_drawdown.toFixed(1)}%</span>
                    </div>
                    <div className="risk-metric">
                      <span className="metric-label">VaR (95%)</span>
                      <span className="metric-value">{stock.metrics.var_95.toFixed(2)}%</span>
                    </div>
                    <div className="risk-metric">
                      <span className="metric-label">Sharpe Ratio</span>
                      <span className="metric-value">{stock.metrics.sharpe_ratio.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Risk Factors */}
                  <div className="risk-factors">
                    <h4>Risk Factors:</h4>
                    {stock.risk_factors.slice(0, 2).map((factor, idx) => (
                      <div key={idx} className={`risk-factor risk-factor-${factor.severity}`}>
                        <span className="factor-icon">
                          {factor.severity === 'high' ? '🔴' : factor.severity === 'medium' ? '🟡' : '🟢'}
                        </span>
                        <div className="factor-content">
                          <strong>{factor.factor}</strong>
                          <p>{factor.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  <div className="risk-recommendations">
                    <h4>Recommendations:</h4>
                    <ul>
                      {stock.recommendations.slice(0, 2).map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loadingRisk && sortedRiskData.length === 0 && (
            <div className="card" style={{textAlign: 'center', padding: '60px 40px'}}>
              <div style={{fontSize: '4em', marginBottom: '20px'}}>📊</div>
              <h3 style={{fontSize: '1.8em', marginBottom: '15px'}}>No Risk Data Yet</h3>
              <p style={{fontSize: '1.2em', color: 'var(--text-secondary)', marginBottom: '25px'}}>
                Click "Analyze All Stocks" to calculate risk metrics for all stocks
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>📈 Stock Market Prediction</h1>
        <p>AI-Powered LSTM Analysis</p>

        {/* Navigation Bar */}
        <div className="nav-bar">
          <button
            className={`nav-button ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentPage('home')}
          >
            <span className="icon">🏠</span>
            <span>Home</span>
          </button>
          <button
            className={`nav-button ${currentPage === 'comparison' ? 'active' : ''}`}
            onClick={() => setCurrentPage('comparison')}
          >
            <span className="icon">📊</span>
            <span>Stock Comparison</span>
          </button>
          <button
            className={`nav-button ${currentPage === 'risk' ? 'active' : ''}`}
            onClick={() => setCurrentPage('risk')}
          >
            <span className="icon">⚠️</span>
            <span>Risk Analysis</span>
          </button>
        </div>
      </header>

      {/* Render Current Page */}
      {renderPage()}
    </div>
  );
}

export default App;

