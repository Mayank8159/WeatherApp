import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Cloud, CloudRain, LocateFixed, Search, Snowflake, Sun } from 'lucide-react-native';

type ConditionType = 'sunny' | 'rainy' | 'cloudy' | 'snowy';

type ResultState = {
  city: string;
  country: string;
  temperature: string;
  conditionLabel: string;
  highLow: string;
  humidity: string;
  wind: string;
  rainChance: string;
  condition: ConditionType;
};

export default function Explore() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState<ResultState | null>(null);

  const searchCityWeather = React.useCallback(async () => {
    const cityName = query.trim();
    if (!cityName) {
      setError('Enter a city name first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
      );
      const geoJson = await geoRes.json();
      const place = geoJson?.results?.[0];

      if (!place) {
        setError('City not found. Try a different name.');
        setResult(null);
        return;
      }

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&hourly=precipitation_probability&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
      );
      const weatherJson = await weatherRes.json();

      const current = weatherJson?.current ?? {};
      const daily = weatherJson?.daily ?? {};
      const hourly = weatherJson?.hourly ?? {};

      const conditionData = getConditionFromCode(current?.weather_code ?? 0);

      const max0 = daily?.temperature_2m_max?.[0];
      const min0 = daily?.temperature_2m_min?.[0];

      const rainArray: number[] = hourly?.precipitation_probability ?? [];
      const rainSlice = rainArray.slice(0, 6).filter((v) => typeof v === 'number');
      const avgRain = rainSlice.length
        ? `${Math.round(rainSlice.reduce((sum, n) => sum + n, 0) / rainSlice.length)}%`
        : '--%';

      setResult({
        city: place.name,
        country: place.country ?? '',
        temperature:
          typeof current?.temperature_2m === 'number'
            ? `${Math.round(current.temperature_2m)}°`
            : '--°',
        conditionLabel: conditionData.label,
        highLow:
          typeof max0 === 'number' && typeof min0 === 'number'
            ? `H:${Math.round(max0)}°  L:${Math.round(min0)}°`
            : 'H:--°  L:--°',
        humidity:
          typeof current?.relative_humidity_2m === 'number'
            ? `${Math.round(current.relative_humidity_2m)}%`
            : '--%',
        wind:
          typeof current?.wind_speed_10m === 'number'
            ? `${Math.round(current.wind_speed_10m)} km/h`
            : '-- km/h',
        rainChance: avgRain,
        condition: conditionData.type,
      });
    } catch {
      setError('Unable to fetch weather right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + 24 }]}> 
        <Text style={styles.title}>Explore Weather</Text>
        <Text style={styles.subtitle}>Search any city and get live conditions</Text>

        <BlurView intensity={35} tint="light" style={styles.searchShell}>
          <Search color="#E7E7FF" size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search city..."
            placeholderTextColor="rgba(235,235,245,0.65)"
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={searchCityWeather}
          />
          <Pressable onPress={searchCityWeather} style={styles.searchButton}>
            <LocateFixed color="#FFFFFF" size={16} />
          </Pressable>
        </BlurView>

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        {loading && (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.loaderText}>Fetching weather...</Text>
          </View>
        )}

        {result && !loading && (
          <BlurView intensity={55} tint="dark" style={styles.resultCard}>
            <LinearGradient
              colors={['rgba(86, 71, 189, 0.45)', 'rgba(27, 24, 72, 0.4)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.rowTop}>
              <View>
                <Text style={styles.cityText}>{result.city}</Text>
                <Text style={styles.countryText}>{result.country}</Text>
              </View>
              <View style={styles.iconBadge}>{getConditionIcon(result.condition, 22)}</View>
            </View>

            <Text style={styles.tempText}>{result.temperature}</Text>
            <Text style={styles.conditionText}>{result.conditionLabel}</Text>
            <Text style={styles.highLowText}>{result.highLow}</Text>

            <View style={styles.metricsRow}>
              <MetricPill label="Humidity" value={result.humidity} />
              <MetricPill label="Wind" value={result.wind} />
              <MetricPill label="Rain" value={result.rainChance} />
            </View>
          </BlurView>
        )}
      </View>
    </View>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricPill}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function getConditionIcon(condition: ConditionType, size = 18) {
  if (condition === 'sunny') return <Sun color="#FFD76A" size={size} />;
  if (condition === 'rainy') return <CloudRain color="#89B8FF" size={size} />;
  if (condition === 'snowy') return <Snowflake color="#BEEBFF" size={size} />;
  return <Cloud color="#D7D9F2" size={size} />;
}

function getConditionFromCode(code: number): { type: ConditionType; label: string } {
  if (code === 0) return { type: 'sunny', label: 'Clear Sky' };
  if ([1, 2].includes(code)) return { type: 'cloudy', label: 'Partly Cloudy' };
  if ([3, 45, 48].includes(code)) return { type: 'cloudy', label: 'Cloudy' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { type: 'snowy', label: 'Snow' };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) {
    return { type: 'rainy', label: 'Rainy' };
  }
  return { type: 'cloudy', label: 'Cloudy' };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(235,235,245,0.72)',
    marginTop: 4,
    marginBottom: 18,
    fontSize: 14,
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    marginLeft: 10,
    marginRight: 8,
  },
  searchButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  errorText: {
    color: '#FFD4D4',
    marginTop: 10,
    fontSize: 13,
  },
  loaderWrap: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loaderText: {
    color: 'rgba(255,255,255,0.85)',
  },
  resultCard: {
    marginTop: 18,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cityText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  countryText: {
    color: 'rgba(235,235,245,0.7)',
    fontSize: 13,
    marginTop: 2,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  tempText: {
    color: '#FFFFFF',
    fontSize: 54,
    fontWeight: '200',
    marginTop: 10,
    lineHeight: 58,
  },
  conditionText: {
    color: '#F3F5FF',
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.9,
  },
  highLowText: {
    color: 'rgba(255,255,255,0.84)',
    marginTop: 2,
    fontSize: 15,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  metricPill: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  metricLabel: {
    color: 'rgba(235,235,245,0.72)',
    fontSize: 11,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
});