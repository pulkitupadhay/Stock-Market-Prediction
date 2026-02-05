"""
ML Service for Stock Predictions
Called by Node.js backend via child_process
"""

import sys
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import load_model
import joblib
import os

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config

def get_demo_data(symbol, days=90):
    """Generate demo stock data"""
    base_prices = {
        'RELIANCE.NS': 2450,
        'TCS.NS': 3500,
        'HDFCBANK.NS': 1650,
        'INFY.NS': 1450,
        'SBIN.NS': 580,
        'ICICIBANK.NS': 950,
        'BHARTIARTL.NS': 850,
        'HINDUNILVR.NS': 2400,
        'ITC.NS': 420,
        'KOTAKBANK.NS': 1750,
        'LT.NS': 3200,
        'AXISBANK.NS': 1050,
        'WIPRO.NS': 450,
        'MARUTI.NS': 10500,
        'BAJFINANCE.NS': 7200
    }
    
    base_price = base_prices.get(symbol, 1000)
    dates = [(datetime.now() - timedelta(days=days-i)).strftime('%Y-%m-%d') for i in range(days)]
    
    np.random.seed(hash(symbol) % 2**32)
    prices = []
    current_price = base_price
    
    for i in range(days):
        change = np.random.normal(0, base_price * 0.02)
        current_price = max(current_price + change, base_price * 0.5)
        prices.append(current_price)
    
    data = []
    for i, date in enumerate(dates):
        price = prices[i]
        data.append({
            'Date': date,
            'Open': price * (1 + np.random.uniform(-0.01, 0.01)),
            'High': price * (1 + np.random.uniform(0, 0.02)),
            'Low': price * (1 - np.random.uniform(0, 0.02)),
            'Close': price,
            'Volume': int(np.random.uniform(1000000, 10000000))
        })
    
    return pd.DataFrame(data)

def load_stock_data(symbol):
    """Load stock data from CSV file"""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_path = os.path.join(base_dir, 'data', f'{symbol}.csv')

    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        # Get last 90 days
        df = df.tail(90).copy()
        return df
    else:
        # Fallback to demo data
        return get_demo_data(symbol, days=90)

def make_predictions(symbol):
    """Generate predictions for a stock"""
    try:
        # Check if model exists (models are in parent directory)
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        model_path = os.path.join(base_dir, 'models', f'{symbol}.h5')
        scaler_path = os.path.join(base_dir, 'models', f'{symbol}_scaler.pkl')

        if not os.path.exists(model_path):
            return {'error': f'Model not found for {symbol}'}

        # Load model and scaler
        model = load_model(model_path)
        scaler = joblib.load(scaler_path)

        # Load stock data from CSV
        df = load_stock_data(symbol)

        # Calculate moving averages (same as training)
        df['MA7'] = df['Close'].rolling(window=7).mean()
        df['MA21'] = df['Close'].rolling(window=21).mean()

        # Prepare data with same features as training
        data = df[['Close', 'MA7', 'MA21']].dropna()
        scaled_data = scaler.transform(data)
        
        # Create sequences with all 3 features
        sequence_length = config.SEQUENCE_LENGTH
        X = []
        for i in range(sequence_length, len(scaled_data)):
            X.append(scaled_data[i-sequence_length:i, :])  # Use all 3 features
        X = np.array(X)
        
        # Make predictions
        predictions = model.predict(X, verbose=0)

        # Inverse transform predictions (need to create full feature array)
        # Predictions are for Close price (first column)
        pred_full = np.zeros((predictions.shape[0], 3))
        pred_full[:, 0] = predictions.flatten()
        pred_full[:, 1:] = scaled_data[sequence_length:, 1:]  # Use actual MA values
        predictions_unscaled = scaler.inverse_transform(pred_full)[:, 0]

        # Get actual values
        actual_values = data['Close'].values[sequence_length:]
        predicted = predictions_unscaled
        
        # Direction accuracy
        actual_direction = np.diff(actual_values) > 0
        predicted_direction = np.diff(predicted) > 0
        direction_accuracy = np.mean(actual_direction == predicted_direction) * 100

        # Get dates (accounting for dropna from MA calculation)
        dates_list = df['Date'].tolist()

        # Prepare response
        result = {
            'success': True,
            'symbol': symbol,
            'predictions': {
                'dates': dates_list,
                'actual': actual_values.tolist(),
                'predicted': predicted.tolist(),
                'latest_prediction': float(predicted[-1]),
                'direction_accuracy': float(direction_accuracy),
                'sentiment': {
                    'sentiment_label': 'Positive' if predicted[-1] > actual_values[-1] else 'Negative',
                    'confidence': float(min(abs((predicted[-1] - actual_values[-1]) / actual_values[-1]) * 100, 100))
                }
            }
        }
        
        return result
        
    except Exception as e:
        return {'error': str(e)}

def calculate_risk_analysis(symbol):
    """Calculate comprehensive risk metrics for a stock"""
    try:
        # Load stock data
        df = load_stock_data(symbol)

        if df is None or len(df) < 30:
            return {'error': 'Insufficient data for risk analysis'}

        # Calculate daily returns
        df['Returns'] = df['Close'].pct_change()

        # 1. Volatility (Standard Deviation of Returns)
        volatility = df['Returns'].std() * np.sqrt(252) * 100  # Annualized volatility

        # 2. Maximum Drawdown
        cumulative = (1 + df['Returns']).cumprod()
        running_max = cumulative.cummax()
        drawdown = (cumulative - running_max) / running_max
        max_drawdown = drawdown.min() * 100

        # 3. Value at Risk (VaR) - 95% confidence
        var_95 = np.percentile(df['Returns'].dropna(), 5) * 100

        # 4. Sharpe Ratio (assuming risk-free rate of 6%)
        risk_free_rate = 0.06
        excess_returns = df['Returns'].mean() * 252 - risk_free_rate
        sharpe_ratio = excess_returns / (df['Returns'].std() * np.sqrt(252)) if df['Returns'].std() > 0 else 0

        # 5. Price Volatility (30-day)
        price_volatility = df['Close'].tail(30).std() / df['Close'].tail(30).mean() * 100

        # 6. Volume Volatility
        volume_volatility = df['Volume'].tail(30).std() / df['Volume'].tail(30).mean() * 100

        # 7. Risk Score (0-100, higher = riskier)
        # Weighted combination of metrics
        volatility_score = min(volatility / 0.5, 100)  # Normalize to 100
        drawdown_score = min(abs(max_drawdown) / 0.3, 100)
        var_score = min(abs(var_95) / 0.05, 100)

        risk_score = (volatility_score * 0.4 + drawdown_score * 0.3 + var_score * 0.3)

        # 8. Risk Level
        if risk_score < 30:
            risk_level = 'Low'
            risk_color = '#00ff88'
        elif risk_score < 60:
            risk_level = 'Medium'
            risk_color = '#ffaa00'
        else:
            risk_level = 'High'
            risk_color = '#ff4444'

        # 9. Risk Factors
        risk_factors = []

        if volatility > 40:
            risk_factors.append({
                'factor': 'High Volatility',
                'description': f'Annual volatility of {volatility:.1f}% indicates significant price swings',
                'severity': 'high'
            })
        elif volatility > 25:
            risk_factors.append({
                'factor': 'Moderate Volatility',
                'description': f'Annual volatility of {volatility:.1f}% shows moderate price fluctuations',
                'severity': 'medium'
            })

        if abs(max_drawdown) > 20:
            risk_factors.append({
                'factor': 'Large Drawdown',
                'description': f'Maximum drawdown of {abs(max_drawdown):.1f}% indicates potential for significant losses',
                'severity': 'high'
            })

        if abs(var_95) > 3:
            risk_factors.append({
                'factor': 'High Daily Risk',
                'description': f'95% VaR of {abs(var_95):.2f}% suggests high daily loss potential',
                'severity': 'high'
            })

        if sharpe_ratio < 0.5:
            risk_factors.append({
                'factor': 'Poor Risk-Adjusted Returns',
                'description': f'Sharpe ratio of {sharpe_ratio:.2f} indicates low returns relative to risk',
                'severity': 'medium'
            })

        if len(risk_factors) == 0:
            risk_factors.append({
                'factor': 'Stable Performance',
                'description': 'Stock shows relatively stable performance with manageable risk',
                'severity': 'low'
            })

        # 10. Recommendations
        recommendations = []

        if risk_score < 30:
            recommendations.append('Suitable for conservative investors')
            recommendations.append('Good for long-term holdings')
        elif risk_score < 60:
            recommendations.append('Suitable for moderate risk tolerance')
            recommendations.append('Consider diversification')
        else:
            recommendations.append('Only for high risk tolerance investors')
            recommendations.append('Use stop-loss orders')
            recommendations.append('Limit position size')

        if sharpe_ratio > 1:
            recommendations.append('Good risk-adjusted returns')

        # Prepare result
        result = {
            'success': True,
            'symbol': symbol,
            'risk_analysis': {
                'risk_score': round(risk_score, 2),
                'risk_level': risk_level,
                'risk_color': risk_color,
                'metrics': {
                    'volatility': round(volatility, 2),
                    'max_drawdown': round(max_drawdown, 2),
                    'var_95': round(var_95, 2),
                    'sharpe_ratio': round(sharpe_ratio, 2),
                    'price_volatility': round(price_volatility, 2),
                    'volume_volatility': round(volume_volatility, 2)
                },
                'risk_factors': risk_factors,
                'recommendations': recommendations,
                'volatility_history': df['Returns'].tail(30).fillna(0).tolist()
            }
        }

        return result

    except Exception as e:
        return {'error': str(e)}

def get_stock_data(symbol):
    """Get current stock data"""
    try:
        # Load from CSV
        df = load_stock_data(symbol)

        result = {
            'success': True,
            'symbol': symbol,
            'data': df.to_dict('records')
        }

        return result

    except Exception as e:
        return {'error': str(e)}

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'Usage: python ml_service.py <action> <symbol>'}))
        sys.exit(1)

    action = sys.argv[1]
    symbol = sys.argv[2]

    if action == 'predict':
        result = make_predictions(symbol)
    elif action == 'stock':
        result = get_stock_data(symbol)
    elif action == 'risk':
        result = calculate_risk_analysis(symbol)
    else:
        result = {'error': f'Unknown action: {action}'}

    print(json.dumps(result))

