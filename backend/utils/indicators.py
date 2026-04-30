import pandas as pd
import numpy as np


def calculate_rsi(prices: pd.Series, period: int = 14) -> float:
    """相对强弱指标 RSI"""
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi.iloc[-1]


def calculate_macd(prices: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
    """MACD 指标，返回 (macd_line, signal_line, histogram)"""
    ema_fast = prices.ewm(span=fast, adjust=False).mean()
    ema_slow = prices.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    return macd_line.iloc[-1], signal_line.iloc[-1], histogram.iloc[-1]


def calculate_bollinger_bands(prices: pd.Series, period: int = 20, std_dev: int = 2):
    """布林带，返回 (upper, middle, lower)"""
    sma = prices.rolling(window=period).mean()
    std = prices.rolling(window=period).std()
    # Handle zero std (all prices identical)
    std = std.fillna(0)
    upper = sma + (std * std_dev)
    lower = sma - (std * std_dev)
    return upper.iloc[-1], sma.iloc[-1], lower.iloc[-1]


def calculate_ema(prices: pd.Series, span: int) -> float:
    """指数移动平均线"""
    return prices.ewm(span=span, adjust=False).mean().iloc[-1]


def calculate_sma(prices: pd.Series, window: int) -> float:
    """简单移动平均线"""
    result = prices.rolling(window=window).mean().iloc[-1]
    # Handle NaN when not enough data points
    if pd.isna(result):
        return float(prices.mean())
    return float(result)


def calculate_atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> float:
    """平均真实波幅 ATR"""
    tr1 = high - low
    tr2 = abs(high - close.shift())
    tr3 = abs(low - close.shift())
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return tr.rolling(window=period).mean().iloc[-1]
